import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import {
  adminContentFile,
  adminLyricFileName,
  adminRecordNeedsMarkdown,
  type AdminDataRecord,
  type AdminManagedRecord,
  type AdminPendingChange,
  type AdminRecordType
} from '~~/shared/adminData'
import {
  assertAdminId,
  assertInside,
  compactRecord,
  contentRootPath,
  exists,
  lyricsRootPath,
  normalizeRecordForRead,
  normalizeRecordForWrite,
  recordsFilePath
} from './adminContentCore'

async function readOptionalText(filePath: string) {
  if (!await exists(filePath)) return ''
  return readFile(filePath, 'utf8')
}

function markdownPath(type: AdminRecordType, id: string) {
  const contentFile = adminContentFile(type, id)
  if (!contentFile) return ''
  const filePath = resolve(contentRootPath, contentFile)
  assertInside(contentRootPath, filePath)
  return filePath
}

function lyricPath(fileName: string) {
  const filePath = resolve(lyricsRootPath, fileName)
  assertInside(lyricsRootPath, filePath)
  return filePath
}

export async function readAdminRecords() {
  const source = await readFile(recordsFilePath, 'utf8')
  return JSON.parse(source) as AdminDataRecord[]
}

export async function writeAdminRecords(records: AdminDataRecord[]) {
  await writeFile(recordsFilePath, `${JSON.stringify(records.map(compactRecord), null, 2)}\n`, 'utf8')
}

export async function readAdminManagedRecordsFromLocal(): Promise<AdminManagedRecord[]> {
  const records = await readAdminRecords()

  return Promise.all(records.map(async (sourceRecord) => {
    const record = normalizeRecordForRead(sourceRecord)
    const managedRecord: AdminManagedRecord = { ...record }

    if (adminRecordNeedsMarkdown(record.type)) {
      const contentFile = adminContentFile(record.type, record.id)
      managedRecord.contentFile = contentFile
      managedRecord.content = await readOptionalText(markdownPath(record.type, record.id))
    }

    if (record.type === 'music') {
      const lrcFile = adminLyricFileName(record.url, record.title, record.id)
      managedRecord.lrcFile = lrcFile
      managedRecord.lrc = await readOptionalText(lyricPath(lrcFile))
    }

    return managedRecord
  }))
}

export async function saveAdminRecordToLocal(params: {
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

  if (currentIndex >= 0) {
    records[currentIndex] = nextRecord
  } else {
    records.unshift(nextRecord)
  }

  await writeAdminRecords(records)

  if (adminRecordNeedsMarkdown(nextRecord.type)) {
    const nextPath = markdownPath(nextRecord.type, nextRecord.id)
    await mkdir(dirname(nextPath), { recursive: true })

    if (originalId && originalId !== nextRecord.id) {
      const previousPath = markdownPath(nextRecord.type, originalId)
      if (await exists(previousPath) && !await exists(nextPath)) {
        await rename(previousPath, nextPath)
      }
    }

    await writeFile(nextPath, params.content || '', 'utf8')
  }

  if (nextRecord.type === 'music' && typeof params.lrc === 'string') {
    const nextPath = lyricPath(adminLyricFileName(nextRecord.url, nextRecord.title, nextRecord.id))
    await mkdir(dirname(nextPath), { recursive: true })
    await writeFile(nextPath, params.lrc, 'utf8')
  }

  return (await readAdminManagedRecordsFromLocal()).find((record) => record.type === nextRecord.type && record.id === nextRecord.id)
}

export async function deleteAdminRecordFromLocal(params: {
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

  await writeAdminRecords(nextRecords)

  if (params.deleteAssociatedFiles && target) {
    if (adminRecordNeedsMarkdown(params.type)) {
      await rm(markdownPath(params.type, params.id), { force: true })
    }
    if (params.type === 'music') {
      await rm(lyricPath(adminLyricFileName(target.url, target.title, target.id)), { force: true })
    }
  }
}

export async function applyAdminChangesToLocal(changes: AdminPendingChange[]) {
  for (const change of changes) {
    if (change.action === 'save') {
      if (!change.record) continue
      await saveAdminRecordToLocal({
        originalId: change.originalId,
        record: change.record,
        content: change.content,
        lrc: change.lrc
      })

      continue
    }

    if (change.id && change.type) {
      try {
        await deleteAdminRecordFromLocal({
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
