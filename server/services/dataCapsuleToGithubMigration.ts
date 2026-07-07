import type { AdminDataRecord } from '~~/shared/adminData'
import {
  contentLyricPath,
  contentMarkdownPath,
  contentMusicPath,
  contentRecordsPath,
  githubPathFromContentPath
} from '~~/shared/contentDataPaths'
import { compactRecord, normalizeRecordForRead, normalizeRecordForWrite } from './adminContentCore'
import { readDataCapsuleRecords } from './adminRecordsDataCapsule'
import { readDataCapsuleObject } from './dataCapsuleStorage'
import { commitGitHubContent, githubDataBasePath } from './githubContentStorage'

type DataCapsuleMigrationResult = {
  ok: true
  migratedCount: number
  commit: Awaited<ReturnType<typeof commitGitHubContent>>
}

function extensionFromUrl(value?: string) {
  if (!value) return ''
  try {
    const pathname = decodeURIComponent(new URL(value).pathname)
    return pathname.split('/').pop()?.match(/\.[^.]+$/)?.[0] || ''
  } catch {
    return ''
  }
}

export async function migrateDataCapsuleContentToGitHub(): Promise<DataCapsuleMigrationResult> {
  const sourceRecords = await readDataCapsuleRecords()
  const basePath = githubDataBasePath()
  const nextRecords: AdminDataRecord[] = []
  const textFiles: Record<string, string> = {}
  const binaryFiles: Record<string, Buffer> = {}

  for (const sourceRecord of sourceRecords) {
    const record = normalizeRecordForRead(sourceRecord)
    let markdownContent = ''

    if ((record.type === 'post' || record.type === 'chatter' || record.type === 'moment' || record.type === 'about') && record.contentUrl) {
      const nextPath = contentMarkdownPath(record)
      markdownContent = (await readDataCapsuleObject(record.contentUrl)).toString('utf8')
      textFiles[githubPathFromContentPath(nextPath, basePath)] = markdownContent
      record.contentUrl = nextPath
    }

    if (record.type === 'music' && record.url) {
      const nextPath = contentMusicPath(record, extensionFromUrl(record.url) || '.mp3')
      binaryFiles[githubPathFromContentPath(nextPath, basePath)] = await readDataCapsuleObject(record.url)
      record.url = nextPath
    }

    if (record.type === 'music' && record.lrcUrl) {
      const nextPath = contentLyricPath(record)
      textFiles[githubPathFromContentPath(nextPath, basePath)] = (await readDataCapsuleObject(record.lrcUrl)).toString('utf8')
      record.lrcUrl = nextPath
    }

    nextRecords.push(record.type === 'post' || record.type === 'chatter' || record.type === 'moment'
      ? normalizeRecordForWrite(record, { content: markdownContent })
      : record)
  }

  textFiles[githubPathFromContentPath(contentRecordsPath(), basePath)] = `${JSON.stringify(nextRecords.map(compactRecord), null, 2)}\n`

  const commit = await commitGitHubContent({
    message: `Migrate data capsule content (${nextRecords.length} records)`,
    textFiles,
    binaryFiles
  })

  return {
    ok: true as const,
    migratedCount: nextRecords.length,
    commit
  }
}
