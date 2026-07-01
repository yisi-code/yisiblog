import { assertAdminSession } from '#server/services/adminAuth'
import { readAdminManagedRecords } from '#server/services/adminContentService'
import type { AdminRecordsResponse } from '~~/shared/adminData'

export default defineEventHandler(async (event): Promise<AdminRecordsResponse> => {
  assertAdminSession(event)

  return {
    records: await readAdminManagedRecords()
  }
})
