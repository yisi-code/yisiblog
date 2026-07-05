import { readDataCapsuleRecords } from '#server/services/adminRecordsDataCapsule'

export default defineEventHandler(async () => {
  return {
    records: await readDataCapsuleRecords()
  }
})
