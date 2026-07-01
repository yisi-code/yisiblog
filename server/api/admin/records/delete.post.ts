import { assertAdminSession } from '#server/services/adminAuth'
import { deleteAdminRecord } from '#server/services/adminContentService'
import { adminRecordTypes, type AdminDeleteRecordPayload, type AdminMutationResponse } from '~~/shared/adminData'

export default defineEventHandler(async (event): Promise<AdminMutationResponse> => {
  assertAdminSession(event)

  const body = await readBody<AdminDeleteRecordPayload>(event)

  if (!body.id?.trim() || !adminRecordTypes.includes(body.type)) {
    throw createError({ statusCode: 400, statusMessage: '记录 ID 或类型无效' })
  }

  return deleteAdminRecord(body)
})
