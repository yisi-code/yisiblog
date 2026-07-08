import type { AdminPendingChange } from '~~/shared/adminData'
import {
  readDataCapsuleObjectByKey,
  uploadDataCapsuleObject
} from './dataCapsuleStorage'

export type AdminCloudDraftState = {
  pendingChanges: AdminPendingChange[]
  updatedAt?: string
}

const cloudPendingKey = 'admin-drafts/pending.json'

async function readJsonByKey<T>(key: string, fallback: T): Promise<T> {
  try {
    const source = (await readDataCapsuleObjectByKey(key)).toString('utf8')
    if (!source.trim()) return fallback
    return JSON.parse(source) as T
  } catch {
    return fallback
  }
}

async function writeJsonByKey(key: string, value: unknown) {
  await uploadDataCapsuleObject({
    key,
    body: Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8'),
    contentType: 'application/json; charset=utf-8'
  })
}

export async function readAdminCloudDraftState(): Promise<AdminCloudDraftState> {
  const pendingChanges = await readJsonByKey<AdminPendingChange[]>(cloudPendingKey, [])

  return {
    pendingChanges: Array.isArray(pendingChanges) ? pendingChanges : []
  }
}

export async function writeAdminCloudDraftState(state: AdminCloudDraftState) {
  const updatedAt = new Date().toISOString()
  await writeJsonByKey(cloudPendingKey, state.pendingChanges || [])

  return {
    ok: true as const,
    updatedAt
  }
}

export async function clearAdminCloudDraftState() {
  await writeJsonByKey(cloudPendingKey, [])
}
