import { assertAdminSession } from '#server/services/adminAuth'
import { syncAdminRecordsToGitHub } from '#server/services/adminGithubContentService'
import type { AdminSyncRecordsPayload } from '~~/shared/adminData'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)

  const body = await readBody<AdminSyncRecordsPayload>(event)
  const changes = Array.isArray(body?.changes) ? body.changes : []
  if (!changes.length) {
    throw createError({ statusCode: 400, statusMessage: '没有需要同步的变更' })
  }

  return syncAdminRecordsToGitHub(changes)
})
