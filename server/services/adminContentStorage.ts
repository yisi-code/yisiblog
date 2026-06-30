import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import {
  adminContentFile,
  adminLyricFileName,
  adminRecordHasField,
  adminRecordNeedsMarkdown,
  type AdminDataRecord,
  type AdminManagedRecord,
  type AdminRecordType
} from '~~/shared/adminData'

const rootDir = process.cwd()
const recordsFilePath = resolve(rootDir, 'app/data/source/records.json')
const contentRootPath = resolve(rootDir, 'content')
const lyricsRootPath = resolve(contentRootPath, 'lyrics')

function assertAdminId(id: string) {
  if (!id || id.length > 120 || id.includes('..') || /[\\/]/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: '记录 ID 只能是普通文件名，不能包含路径字符' })
  }
}

function assertInside(basePath: string, targetPath: string) {
  const resolvedBase = resolve(basePath)
  const resolvedTarget = resolve(targetPath)
  if (resolvedTarget !== resolvedBase && !resolvedTarget.startsWith(`${resolvedBase}\\`) && !resolvedTarget.startsWith(`${resolvedBase}/`)) {
    throw createError({ statusCode: 400, statusMessage: '文件路径超出允许范围' })
  }
}

async function exists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function compactRecord(record: AdminDataRecord): AdminDataRecord {
  return Object.fromEntries(Object.entries(record).filter(([key, value]) => {
    const shouldDrop = value === undefined
      || value === ''
      || (Array.isArray(value) && value.length === 0)
      || (value && typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length)

    return key === 'id' || key === 'type' || !shouldDrop
  })) as AdminDataRecord
}

function normalizeRecordForRead(record: AdminDataRecord): AdminDataRecord {
  return compactRecord({
    ...record,
    tags: Array.isArray(record.tags) ? record.tags : []
  })
}

function normalizeRecordForWrite(record: AdminDataRecord): AdminDataRecord {
  assertAdminId(record.id)

  if (record.type === 'about' && record.id !== 'about') {
    throw createError({ statusCode: 400, statusMessage: 'about 类型只支持 about 页面' })
  }

  return compactRecord({
    id: record.type === 'about' ? 'about' : record.id.trim(),
    type: record.type,
    title: adminRecordHasField(record.type, 'title') ? record.title?.trim() : undefined,
    description: adminRecordHasField(record.type, 'description') ? record.description?.trim() : undefined,
    date: adminRecordHasField(record.type, 'date') ? record.date?.trim() : undefined,
    cover: adminRecordHasField(record.type, 'cover') ? record.cover?.trim() : undefined,
    url: adminRecordHasField(record.type, 'url') ? record.url?.trim() : undefined,
    path: record.path?.trim(),
    tags: adminRecordHasField(record.type, 'tags') && Array.isArray(record.tags) ? record.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    mood: adminRecordHasField(record.type, 'mood') ? record.mood?.trim() : undefined,
    location: adminRecordHasField(record.type, 'location') ? record.location?.trim() : undefined,
    images: adminRecordHasField(record.type, 'images') && Array.isArray(record.images) ? record.images.map((image) => String(image).trim()).filter(Boolean) : [],
    artist: adminRecordHasField(record.type, 'artist') ? record.artist?.trim() : undefined,
    error: adminRecordHasField(record.type, 'error') ? record.error?.trim() : undefined,
    photos: adminRecordHasField(record.type, 'photos') && Array.isArray(record.photos) ? record.photos.map((photo) => ({
      url: String(photo.url || '').trim(),
      caption: photo.caption?.trim()
    })).filter((photo) => photo.url) : [],
    icon: adminRecordHasField(record.type, 'icon') ? record.icon?.trim() : undefined
  })
}

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

export async function readAdminManagedRecords(): Promise<AdminManagedRecord[]> {
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

export async function saveAdminRecord(params: {
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

  return (await readAdminManagedRecords()).find((record) => record.type === nextRecord.type && record.id === nextRecord.id)
}

export async function deleteAdminRecord(params: {
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
