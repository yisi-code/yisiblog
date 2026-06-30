import { assertAdminSession } from '#server/services/adminAuth'
import { saveAdminRecord } from '#server/services/adminContentStorage'
import { adminRecordTypes, type AdminMutationResponse, type AdminSaveRecordPayload } from '~~/shared/adminData'

export default defineEventHandler(async (event): Promise<AdminMutationResponse> => {
  assertAdminSession(event)

  const body = await readBody<AdminSaveRecordPayload>(event)
  const record = body.record

  if (!record?.id?.trim() || !adminRecordTypes.includes(record.type)) {
    throw createError({ statusCode: 400, statusMessage: '记录 ID 或类型无效' })
  }

  return {
    ok: true,
    record: await saveAdminRecord({
      originalId: body.originalId,
      record,
      content: body.content,
      lrc: body.lrc
    })
  }
})
