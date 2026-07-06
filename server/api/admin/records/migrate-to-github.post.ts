import { assertAdminSession } from '#server/services/adminAuth'
import { migrateDataCapsuleContentToGitHub } from '#server/services/dataCapsuleToGithubMigration'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)

  return migrateDataCapsuleContentToGitHub()
})
