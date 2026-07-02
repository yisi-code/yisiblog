import { assertAdminSession } from '#server/services/adminAuth'
import { syncAdminRecords } from '#server/services/adminContentService'
import type { AdminSyncRecordsPayload, AdminSyncRecordsResponse } from '~~/shared/adminData'

export default defineEventHandler(async (event): Promise<AdminSyncRecordsResponse> => {
  assertAdminSession(event)

  const body = await readBody<AdminSyncRecordsPayload>(event)
  const changes = Array.isArray(body.changes) ? body.changes : []

  if (!changes.length) {
    throw createError({ statusCode: 400, statusMessage: '没有需要同步的变更' })
  }

  return syncAdminRecords(changes)
})
