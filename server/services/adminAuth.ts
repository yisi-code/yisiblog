import { createHmac, timingSafeEqual } from 'node:crypto'
import { createError, getHeader, type H3Event } from 'h3'

const adminSessionTtlMs = 30 * 60 * 1000

function adminSecret(event: H3Event) {
  const adminToken = String(useRuntimeConfig(event).adminToken || '').trim()

  if (!adminToken) {
    throw createError({ statusCode: 403, statusMessage: '未配置 ADMIN_TOKEN，管理接口已禁用' })
  }

  return adminToken
}

function signSession(expiresAt: number, secret: string) {
  return createHmac('sha256', secret).update(String(expiresAt)).digest('hex')
}

function safeEqual(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue)
  const right = Buffer.from(rightValue)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function createAdminSession(event: H3Event, requestToken: string) {
  const adminToken = adminSecret(event)

  if (!requestToken || requestToken !== adminToken) {
    throw createError({ statusCode: 401, statusMessage: '管理令牌无效' })
  }

  const expiresAt = Date.now() + adminSessionTtlMs
  return {
    session: `${expiresAt}.${signSession(expiresAt, adminToken)}`,
    expiresAt
  }
}

export function assertAdminSession(event: H3Event) {
  const adminToken = adminSecret(event)
  const session = String(getHeader(event, 'x-admin-session') || '').trim()
  const [expiresText, signature] = session.split('.')
  const expiresAt = Number(expiresText)

  if (!expiresAt || !signature || Date.now() > expiresAt) {
    throw createError({ statusCode: 401, statusMessage: '管理会话已过期' })
  }

  if (!safeEqual(signature, signSession(expiresAt, adminToken))) {
    throw createError({ statusCode: 401, statusMessage: '管理会话无效' })
  }

  return { expiresAt }
}
