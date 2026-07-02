import type {
  AdminManagedRecord,
  AdminPendingChange,
  AdminSyncRecordsResponse
} from '~~/shared/adminData'
import {
  applyAdminChangesToLocal,
  readAdminManagedRecordsFromLocal
} from './adminContentStorage'
import {
  readAdminManagedRecordsFromGithub,
  syncAdminChangesToGithub
} from './adminGithubSync'

function logMirrorError(target: string, error: unknown) {
  console.warn(`[admin-content:${target}]`, error instanceof Error ? error.message : error)
}

function runDetached(task: () => Promise<unknown>, target: string) {
  task().catch((error) => logMirrorError(target, error))
}

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
    try {
      const records = await readAdminManagedRecordsFromGithub()
      setAdminRecordsCache(records)
      return records
    } catch (error) {
      logMirrorError('github-read-fallback', error)
      const records = await readAdminManagedRecordsFromLocal()
      setAdminRecordsCache(records)
      return records
    } finally {
      adminRecordsReadPromise = null
    }
  })()

  return cloneAdminRecords(await adminRecordsReadPromise)
}

export async function syncAdminRecords(changes: AdminPendingChange[]): Promise<AdminSyncRecordsResponse> {
  const githubResult = await syncAdminChangesToGithub(changes)
  setAdminRecordsCache(githubResult.records)

  runDetached(async () => {
    await applyAdminChangesToLocal(changes)
  }, 'local-bulk-sync')

  return {
    ok: true,
    records: githubResult.records,
    syncedCount: githubResult.syncedCount,
    commit: githubResult.commit
  }
}
