import {
  adminRecordNeedsMarkdown,
  type AdminDataRecord,
  type AdminManagedRecord,
  type AdminPendingChange
} from '~~/shared/adminData'
import {
  contentLyricPath,
  contentMarkdownPath,
  contentMusicPath,
  contentRecordsPath,
  githubPathFromContentPath
} from '~~/shared/contentDataPaths'
import {
  compactRecord,
  normalizeRecordForRead,
  normalizeRecordForWrite
} from './adminContentCore'
import { readDataCapsuleObject as readDataCapsuleAsset } from './dataCapsuleStorage'
import { clearAdminCloudDraftState } from './adminCloudDraftStorage'
import { commitGitHubContent, githubDataBasePath } from './githubContentStorage'
import { readStaticManagedRecords } from './staticContentStorage'

function extensionFromUrl(value?: string) {
  if (!value) return ''
  try {
    const pathname = decodeURIComponent(new URL(value).pathname)
    return pathname.split('/').pop()?.match(/\.[^.]+$/)?.[0] || ''
  } catch {
    return ''
  }
}

function cloneManagedRecord(record: AdminManagedRecord): AdminManagedRecord {
  return {
    ...record,
    tags: record.tags ? [...record.tags] : undefined,
    images: record.images ? [...record.images] : undefined,
    photos: record.photos ? record.photos.map((photo) => ({ ...photo })) : undefined
  }
}

function applyChanges(baseRecords: AdminDataRecord[], changes: AdminPendingChange[]) {
  const nextRecords = baseRecords.map((record) => normalizeRecordForRead(record))
  const deleteFiles = new Set<string>()
  const markdownFiles: Record<string, string> = {}
  const musicSources: {
    sourceUrl: string
    targetPath: string
  }[] = []

  for (const change of changes) {
    if (change.action === 'delete') {
      const deleteIndex = nextRecords.findIndex((record) => record.type === change.type && record.id === change.id)
      const deletedRecord = deleteIndex >= 0 ? nextRecords[deleteIndex] : change.snapshot
      if (deleteIndex >= 0) nextRecords.splice(deleteIndex, 1)

      if (deletedRecord && adminRecordNeedsMarkdown(deletedRecord.type)) {
        deleteFiles.add(githubPathFromContentPath(contentMarkdownPath(deletedRecord), githubDataBasePath()))
      }
      if (deletedRecord?.type === 'music') {
        if (deletedRecord.url?.startsWith('/content-data/')) deleteFiles.add(githubPathFromContentPath(deletedRecord.url, githubDataBasePath()))
        if (deletedRecord.lrcUrl?.startsWith('/content-data/')) deleteFiles.add(githubPathFromContentPath(deletedRecord.lrcUrl, githubDataBasePath()))
      }
      continue
    }

    if (!change.record) continue

    const nextRecord = normalizeRecordForWrite(change.record, { content: change.content })
    const currentIndex = nextRecords.findIndex((record) => record.type === nextRecord.type && record.id === (change.originalId || nextRecord.id))
    const duplicateIndex = nextRecords.findIndex((record, index) => record.type === nextRecord.type && record.id === nextRecord.id && index !== currentIndex)
    if (duplicateIndex >= 0) {
      throw createError({ statusCode: 409, statusMessage: '同类型下已存在相同 ID 的记录' })
    }

    if (adminRecordNeedsMarkdown(nextRecord.type)) {
      nextRecord.contentUrl = contentMarkdownPath(nextRecord)
      markdownFiles[nextRecord.contentUrl] = change.content || ''

      if (change.originalId && change.originalId !== nextRecord.id) {
        deleteFiles.add(githubPathFromContentPath(contentMarkdownPath({
          id: change.originalId,
          type: nextRecord.type
        }), githubDataBasePath()))
      }
    }

    if (nextRecord.type === 'music') {
      const musicSourceUrl = change.musicFile?.publicUrl || nextRecord.url
      const musicExtension = extensionFromUrl(musicSourceUrl) || '.mp3'
      if (musicSourceUrl) {
        nextRecord.url = contentMusicPath(nextRecord, musicExtension)
        musicSources.push({
          sourceUrl: musicSourceUrl,
          targetPath: nextRecord.url
        })
      }

      if (change.lrc !== undefined && change.lrc.trim()) {
        nextRecord.lrcUrl = contentLyricPath(nextRecord)
        markdownFiles[nextRecord.lrcUrl] = change.lrc
      } else if (nextRecord.lrcUrl && !nextRecord.lrcUrl.startsWith('/content-data/')) {
        nextRecord.lrcUrl = contentLyricPath(nextRecord)
        musicSources.push({
          sourceUrl: change.record.lrcUrl || '',
          targetPath: nextRecord.lrcUrl
        })
      }
    }

    if (currentIndex >= 0) nextRecords[currentIndex] = nextRecord
    else nextRecords.unshift(nextRecord)
  }

  return {
    records: nextRecords,
    markdownFiles,
    musicSources,
    deleteFiles: [...deleteFiles]
  }
}

export async function syncAdminRecordsToGitHub(changes: AdminPendingChange[]) {
  const baseRecords = await readStaticManagedRecords()
  const contentByRecordKey = new Map(baseRecords.map((record) => [
    `${record.type}:${record.id}`,
    'content' in record ? String(record.content || '') : ''
  ]))
  const lrcByRecordKey = new Map(baseRecords.map((record) => [
    `${record.type}:${record.id}`,
    'lrc' in record ? String(record.lrc || '') : ''
  ]))
  changes.forEach((change) => {
    if (change.action === 'save' && change.record?.type === 'music' && change.lrc !== undefined) {
      lrcByRecordKey.set(`${change.record.type}:${change.record.id}`, change.lrc)
    }
  })
  const syncResult = applyChanges(baseRecords, changes)
  const textFiles: Record<string, string> = {}
  const binaryFiles: Record<string, Buffer> = {}
  const basePath = githubDataBasePath()

  textFiles[githubPathFromContentPath(contentRecordsPath(), basePath)] = `${JSON.stringify(syncResult.records.map(compactRecord), null, 2)}\n`

  for (const [contentPath, content] of Object.entries(syncResult.markdownFiles)) {
    textFiles[githubPathFromContentPath(contentPath, basePath)] = content
  }

  for (const source of syncResult.musicSources) {
    if (!source.sourceUrl) continue
    binaryFiles[githubPathFromContentPath(source.targetPath, basePath)] = await readDataCapsuleAsset(source.sourceUrl)
  }

  const commit = await commitGitHubContent({
    message: `Sync content data (${changes.length} changes)`,
    textFiles,
    binaryFiles,
    deleteFiles: syncResult.deleteFiles
  })

  await clearAdminCloudDraftState()

  const records: AdminManagedRecord[] = syncResult.records.map((record) => ({
    ...normalizeRecordForRead(record),
    content: adminRecordNeedsMarkdown(record.type)
      ? syncResult.markdownFiles[record.contentUrl || ''] ?? contentByRecordKey.get(`${record.type}:${record.id}`) ?? ''
      : undefined,
    lrc: record.type === 'music'
      ? lrcByRecordKey.get(`${record.type}:${record.id}`) ?? ''
      : undefined
  })).map(cloneManagedRecord)

  return {
    ok: true as const,
    records,
    syncedCount: changes.length,
    commit
  }
}
