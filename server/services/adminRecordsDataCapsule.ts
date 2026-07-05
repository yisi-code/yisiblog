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
const recordsCacheTtlMs = 30 * 1000
let recordsCache: {
  records: AdminDataRecord[]
  expiresAt: number
} | null = null
let recordsReadPromise: Promise<AdminDataRecord[]> | null = null

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
}

export async function readDataCapsuleRecords() {
  if (recordsCache && recordsCache.expiresAt > Date.now()) return cloneRecords(recordsCache.records)

  recordsReadPromise ||= (async () => {
    try {
      const source = (await readDataCapsuleObjectByKey(recordsObjectKey)).toString('utf8')
      const records = (JSON.parse(source || '[]') as AdminDataRecord[]).map(normalizeRecordForRead)
      setRecordsCache(records)
      return records
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
