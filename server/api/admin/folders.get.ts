import { assertAdminSession } from '#server/services/adminAuth'
import { listDataCapsuleFolders } from '#server/services/dataCapsuleStorage'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)

  try {
    return {
      folders: await listDataCapsuleFolders()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '数据胶囊目录读取失败'
    console.warn('[admin-folders:list]', message)
    return {
      folders: [],
      error: message
    }
  }
})
