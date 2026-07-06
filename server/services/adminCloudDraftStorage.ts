import type { AdminPendingChange } from '~~/shared/adminData'
import {
  readDataCapsuleObjectByKey,
  uploadDataCapsuleObject
} from './dataCapsuleStorage'

export type AdminCloudDraftState = {
  drafts: Record<string, unknown>
  pendingChanges: AdminPendingChange[]
  updatedAt?: string
}

const cloudDraftsKey = 'admin-drafts/drafts.json'
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
  const [drafts, pendingChanges] = await Promise.all([
    readJsonByKey<Record<string, unknown>>(cloudDraftsKey, {}),
    readJsonByKey<AdminPendingChange[]>(cloudPendingKey, [])
  ])

  return {
    drafts: drafts && typeof drafts === 'object' && !Array.isArray(drafts) ? drafts : {},
    pendingChanges: Array.isArray(pendingChanges) ? pendingChanges : []
  }
}

export async function writeAdminCloudDraftState(state: AdminCloudDraftState) {
  const updatedAt = new Date().toISOString()
  await Promise.all([
    writeJsonByKey(cloudDraftsKey, {
      ...(state.drafts || {}),
      updatedAt
    }),
    writeJsonByKey(cloudPendingKey, state.pendingChanges || [])
  ])

  return {
    ok: true as const,
    updatedAt
  }
}

export async function clearAdminCloudDraftState() {
  await Promise.all([
    writeJsonByKey(cloudDraftsKey, {}),
    writeJsonByKey(cloudPendingKey, [])
  ])
}
