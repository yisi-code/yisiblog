import { assertAdminSession } from '#server/services/adminAuth'
import { writeAdminCloudDraftState } from '#server/services/adminCloudDraftStorage'
import type { AdminPendingChange } from '~~/shared/adminData'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)

  const body = await readBody<{
    pendingChanges?: AdminPendingChange[]
  }>(event)

  return writeAdminCloudDraftState({
    pendingChanges: Array.isArray(body.pendingChanges) ? body.pendingChanges : []
  })
})
