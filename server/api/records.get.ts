import { readDataCapsuleRecords } from '#server/services/adminRecordsDataCapsule'

const recordsErrorLogIntervalMs = 30 * 1000
let recordsLastErrorLogAt = 0

export default defineEventHandler(async () => {
  try {
    return {
      records: await readDataCapsuleRecords()
    }
  } catch (error) {
    const now = Date.now()
    if (now - recordsLastErrorLogAt > recordsErrorLogIntervalMs) {
      recordsLastErrorLogAt = now
      console.warn('[records:get] records.json 读取失败，返回空数据：', error instanceof Error ? error.message : error)
    }

    return {
      records: [],
      error: error instanceof Error ? error.message : 'records.json 读取失败'
    }
  }
})
