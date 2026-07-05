import {
  adminContentFile,
  adminRecordNeedsMarkdown,
  type AdminDataRecord,
  type AdminManagedRecord,
  type AdminPendingChange,
  type AdminRecordType
} from '~~/shared/adminData'
import {
  dataCapsuleCoverBaseName,
  dataCapsuleImageBaseName,
  dataCapsuleLyricBaseName,
  dataCapsuleMarkdownBaseName,
  dataCapsuleMusicBaseName,
  dataCapsulePhotoBaseName,
  dataCapsuleRecordFolder,
  safeDataCapsulePathPart
} from './adminDataAssetPaths'
import {
  assertAdminId,
  normalizeRecordForRead,
  normalizeRecordForWrite
} from './adminContentCore'
import {
  deleteDataCapsuleObject,
  readDataCapsuleObject,
  renameDataCapsuleObject,
  uploadDataCapsuleObject
} from './dataCapsuleStorage'
import {
  readDataCapsuleRecords,
  writeDataCapsuleRecords
} from './adminRecordsDataCapsule'

function extensionFromUrl(value?: string) {
  if (!value) return ''
  try {
    const pathname = decodeURIComponent(new URL(value).pathname)
    const fileName = pathname.split('/').pop() || ''
    return fileName.match(/\.[^.]+$/)?.[0] || ''
  } catch {
    return ''
  }
}

function keyInFolder(folder: string, fileBaseName: string, sourceUrl?: string) {
  const extension = extensionFromUrl(sourceUrl)
  return `${folder.replace(/^\/+|\/+$/g, '')}/${safeDataCapsulePathPart(fileBaseName, 'file')}${extension}`
}

function recordAssetUrls(record?: AdminDataRecord) {
  return [
    record?.contentUrl,
    record?.cover,
    record?.url,
    record?.lrcUrl,
    ...(record?.images || []),
    ...(record?.photos || []).map((photo) => photo.url)
  ].filter(Boolean) as string[]
}

async function uploadMarkdownContent(record: AdminDataRecord, content: string) {
  const uploaded = await uploadDataCapsuleObject({
    key: `${dataCapsuleRecordFolder(record)}/${dataCapsuleMarkdownBaseName(record)}.md`,
    body: Buffer.from(content || '', 'utf8'),
    contentType: 'text/markdown; charset=utf-8'
  })
  return uploaded.url
}

async function reconcileDataCapsuleAssets(nextRecord: AdminDataRecord, previousRecord?: AdminDataRecord) {
  const recordFolder = dataCapsuleRecordFolder(nextRecord)

  if (adminRecordNeedsMarkdown(nextRecord.type)) {
    nextRecord.contentUrl = await renameDataCapsuleObject(
      nextRecord.contentUrl,
      `${recordFolder}/${dataCapsuleMarkdownBaseName(nextRecord)}.md`
    )
  }

  if (nextRecord.type === 'music') {
    nextRecord.url = await renameDataCapsuleObject(nextRecord.url, keyInFolder(recordFolder, dataCapsuleMusicBaseName(nextRecord), nextRecord.url))
    nextRecord.lrcUrl = await renameDataCapsuleObject(nextRecord.lrcUrl, keyInFolder(recordFolder, dataCapsuleLyricBaseName(nextRecord), nextRecord.lrcUrl))
  }

  if (nextRecord.cover) {
    nextRecord.cover = await renameDataCapsuleObject(nextRecord.cover, keyInFolder(recordFolder, dataCapsuleCoverBaseName(nextRecord), nextRecord.cover))
  }

  if (Array.isArray(nextRecord.images)) {
    nextRecord.images = await Promise.all(nextRecord.images.map((url, index) => {
      return renameDataCapsuleObject(url, keyInFolder(recordFolder, dataCapsuleImageBaseName(nextRecord, index), url))
    }))
  }

  if (Array.isArray(nextRecord.photos)) {
    nextRecord.photos = await Promise.all(nextRecord.photos.map(async (photo, index) => {
      return {
        ...photo,
        url: await renameDataCapsuleObject(photo.url, keyInFolder(recordFolder, dataCapsulePhotoBaseName(nextRecord, photo, index), photo.url))
      }
    }))
  }

  const nextUrls = new Set(recordAssetUrls(nextRecord))
  for (const url of recordAssetUrls(previousRecord)) {
    if (!nextUrls.has(url)) await deleteDataCapsuleObject(url)
  }
}

export async function readAdminRecords() {
  return readDataCapsuleRecords()
}

export async function writeAdminRecords(records: AdminDataRecord[]) {
  await writeDataCapsuleRecords(records)
}

export async function readAdminManagedRecordsFromDataCapsule(): Promise<AdminManagedRecord[]> {
  const records = await readAdminRecords()

  return Promise.all(records.map(async (sourceRecord) => {
    const record = normalizeRecordForRead(sourceRecord)
    const managedRecord: AdminManagedRecord = { ...record }

    if (adminRecordNeedsMarkdown(record.type)) {
      const contentFile = adminContentFile(record.type, record.id)
      managedRecord.contentFile = contentFile
      if (record.contentUrl) {
        try {
          managedRecord.content = (await readDataCapsuleObject(record.contentUrl)).toString('utf8')
        } catch {
          managedRecord.content = ''
        }
      } else {
        managedRecord.content = ''
      }
    }

    return managedRecord
  }))
}

export async function saveAdminRecordToDataCapsule(params: {
  originalId?: string
  record: AdminDataRecord
  content?: string
  lrc?: string
}) {
  const originalId = params.originalId?.trim()
  const nextRecord = normalizeRecordForWrite(params.record)
  const records = await readAdminRecords()
  const currentIndex = records.findIndex((record) => record.type === nextRecord.type && record.id === (originalId || nextRecord.id))
  const duplicateIndex = records.findIndex((record, index) => record.type === nextRecord.type && record.id === nextRecord.id && index !== currentIndex)

  if (duplicateIndex >= 0) {
    throw createError({ statusCode: 409, statusMessage: '同类型下已存在相同 ID 的记录' })
  }

  const previousRecord = currentIndex >= 0 ? records[currentIndex] : undefined

  if (adminRecordNeedsMarkdown(nextRecord.type)) {
    nextRecord.contentUrl = await uploadMarkdownContent(nextRecord, params.content || '')
  }

  await reconcileDataCapsuleAssets(nextRecord, previousRecord)

  if (currentIndex >= 0) {
    records[currentIndex] = nextRecord
  } else {
    records.unshift(nextRecord)
  }

  await writeAdminRecords(records)

  return (await readAdminManagedRecordsFromDataCapsule()).find((record) => record.type === nextRecord.type && record.id === nextRecord.id)
}

export async function deleteAdminRecordFromDataCapsule(params: {
  id: string
  type: AdminRecordType
  deleteAssociatedFiles?: boolean
}) {
  assertAdminId(params.id)

  const records = await readAdminRecords()
  const target = records.find((record) => record.type === params.type && record.id === params.id)
  const nextRecords = records.filter((record) => !(record.type === params.type && record.id === params.id))

  if (nextRecords.length === records.length) {
    throw createError({ statusCode: 404, statusMessage: '记录不存在' })
  }

  if (params.deleteAssociatedFiles && target) {
    for (const url of recordAssetUrls(target)) {
      await deleteDataCapsuleObject(url)
    }
  }

  await writeAdminRecords(nextRecords)
}

export async function applyAdminChangesToDataCapsule(changes: AdminPendingChange[]) {
  for (const change of changes) {
    if (change.action === 'save') {
      if (!change.record) continue
      await saveAdminRecordToDataCapsule({
        originalId: change.originalId,
        record: change.record,
        content: change.content,
        lrc: change.lrc
      })

      continue
    }

    if (change.id && change.type) {
      try {
        await deleteAdminRecordFromDataCapsule({
          id: change.id,
          type: change.type,
          deleteAssociatedFiles: change.deleteAssociatedFiles
        })
      } catch (error: unknown) {
        const responseError = error as { statusCode?: number }
        if (responseError.statusCode !== 404) throw error
      }
    }
  }
}
