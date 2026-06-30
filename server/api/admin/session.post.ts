import { createAdminSession } from '#server/services/adminAuth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string }>(event)
  return createAdminSession(event, String(body.token || '').trim())
})
