import type {
  AdminManagedRecord,
  AdminPendingChange,
  AdminSyncRecordsResponse
} from '~~/shared/adminData'
import {
  applyAdminChangesToDataCapsule,
  readAdminManagedRecordsFromDataCapsule
} from './adminContentStorage'

const adminRecordsCacheTtlMs = 60 * 1000
let adminRecordsCache: {
  records: AdminManagedRecord[]
  expiresAt: number
} | null = null
let adminRecordsReadPromise: Promise<AdminManagedRecord[]> | null = null

function cloneAdminRecords(records: AdminManagedRecord[]) {
  return records.map((record) => ({
    ...record,
    tags: record.tags ? [...record.tags] : undefined,
    images: record.images ? [...record.images] : undefined,
    photos: record.photos ? record.photos.map((photo) => ({ ...photo })) : undefined
  }))
}

function setAdminRecordsCache(records: AdminManagedRecord[]) {
  adminRecordsCache = {
    records: cloneAdminRecords(records),
    expiresAt: Date.now() + adminRecordsCacheTtlMs
  }
}

export async function readAdminManagedRecords() {
  if (adminRecordsCache && adminRecordsCache.expiresAt > Date.now()) {
    return cloneAdminRecords(adminRecordsCache.records)
  }

  adminRecordsReadPromise ||= (async () => {
    const records = await readAdminManagedRecordsFromDataCapsule()
    setAdminRecordsCache(records)
    adminRecordsReadPromise = null
    return records
  })()

  return cloneAdminRecords(await adminRecordsReadPromise)
}

export async function syncAdminRecords(changes: AdminPendingChange[]): Promise<AdminSyncRecordsResponse> {
  await applyAdminChangesToDataCapsule(changes)
  const records = await readAdminManagedRecordsFromDataCapsule()
  setAdminRecordsCache(records)

  return {
    ok: true,
    records,
    syncedCount: changes.length
  }
}
