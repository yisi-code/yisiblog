import {
  readDataCapsuleObjectByKey,
  uploadDataCapsuleObject
} from './dataCapsuleStorage'
import {
  compactRecord,
  normalizeRecordForRead
} from './adminContentCore'
import type { AdminDataRecord } from '~~/shared/adminData'

export const recordsObjectKey = 'records.json'
const recordsCacheTtlMs = 5 * 60 * 1000
const recordsFailureCooldownMs = 60 * 1000
let recordsCache: {
  records: AdminDataRecord[]
  expiresAt: number
} | null = null
let recordsReadPromise: Promise<AdminDataRecord[]> | null = null
let recordsLastFailure: {
  message: string
  retryAfter: number
} | null = null

function cloneRecords(records: AdminDataRecord[]): AdminDataRecord[] {
  return records.map((record) => ({
    ...record,
    tags: record.tags ? [...record.tags] : undefined,
    images: record.images ? [...record.images] : undefined,
    photos: record.photos ? record.photos.map((photo) => ({ ...photo })) : undefined
  }))
}

function setRecordsCache(records: AdminDataRecord[]) {
  recordsCache = {
    records: cloneRecords(records),
    expiresAt: Date.now() + recordsCacheTtlMs
  }
  recordsLastFailure = null
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function failureCooldownMessage(now = Date.now()) {
  if (!recordsLastFailure || recordsLastFailure.retryAfter <= now) return ''

  const waitSeconds = Math.ceil((recordsLastFailure.retryAfter - now) / 1000)
  return `records.json 读取暂缓，${waitSeconds} 秒后重试：${recordsLastFailure.message}`
}

export async function readDataCapsuleRecords() {
  const now = Date.now()
  if (recordsCache && recordsCache.expiresAt > now) return cloneRecords(recordsCache.records)

  const cooldownMessage = failureCooldownMessage(now)
  if (cooldownMessage) {
    if (recordsCache) return cloneRecords(recordsCache.records)
    throw new Error(cooldownMessage)
  }

  recordsReadPromise ||= (async () => {
    try {
      const source = (await readDataCapsuleObjectByKey(recordsObjectKey)).toString('utf8')
      const records = (JSON.parse(source || '[]') as AdminDataRecord[]).map(normalizeRecordForRead)
      setRecordsCache(records)
      return records
    } catch (error) {
      const message = errorMessage(error)
      recordsLastFailure = {
        message,
        retryAfter: Date.now() + recordsFailureCooldownMs
      }

      if (recordsCache) {
        recordsCache.expiresAt = recordsLastFailure.retryAfter
        console.warn('[records:data-capsule] records.json 读取失败，使用最近一次成功读取的数据胶囊缓存：', message)
        return recordsCache.records
      }

      throw error
    } finally {
      recordsReadPromise = null
    }
  })()

  return cloneRecords(await recordsReadPromise)
}

export async function writeDataCapsuleRecords(records: AdminDataRecord[]) {
  const nextRecords = records.map(normalizeRecordForRead)
  await uploadDataCapsuleObject({
    key: recordsObjectKey,
    body: Buffer.from(`${JSON.stringify(nextRecords.map(compactRecord), null, 2)}\n`, 'utf8'),
    contentType: 'application/json; charset=utf-8'
  })
  setRecordsCache(nextRecords)
}
