import { assertAdminSession } from '#server/services/adminAuth'
import { readAdminCloudDraftState } from '#server/services/adminCloudDraftStorage'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)

  return readAdminCloudDraftState()
})
