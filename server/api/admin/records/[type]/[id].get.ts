import { assertAdminSession } from '#server/services/adminAuth'
import { readStaticManagedRecordDetail } from '#server/services/staticContentStorage'
import { adminRecordTypes, type AdminRecordDetailResponse, type AdminRecordType } from '~~/shared/adminData'

export default defineEventHandler(async (event): Promise<AdminRecordDetailResponse> => {
  assertAdminSession(event)

  const type = getRouterParam(event, 'type') as AdminRecordType | undefined
  const id = safeDecodeParam(getRouterParam(event, 'id') || '')
  if (!type || !adminRecordTypes.includes(type) || !id) {
    throw createError({ statusCode: 400, statusMessage: '记录类型或 ID 无效' })
  }

  return {
    record: await readStaticManagedRecordDetail(type, id)
  }
})

function safeDecodeParam(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
