export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readRawBody(event)

  if (!body) {
    throw createError({ statusCode: 400, statusMessage: '缺少请求体' })
  }

  let proxyBody = body
  const gitalkClientSecret = String(config.gitalk.clientSecret || '').trim()

  if (gitalkClientSecret) {
    const contentType = getHeader(event, 'content-type') || ''

    if (contentType.includes('application/json')) {
      const payload = JSON.parse(body) as Record<string, unknown>
      payload.client_secret = gitalkClientSecret
      proxyBody = JSON.stringify(payload)
    } else {
      const params = new URLSearchParams(body)
      params.set('client_secret', gitalkClientSecret)
      proxyBody = params.toString()
    }
  }

  return $fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': getHeader(event, 'content-type') || 'application/json',
      Accept: 'application/json'
    },
    body: proxyBody
  })
})
