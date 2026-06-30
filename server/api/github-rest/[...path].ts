const blockedHeaders = new Set([
  'connection',
  'content-length',
  'host',
  'origin',
  'referer',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site'
])

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || ''
  const query = getQuery(event)
  const method = getMethod(event)
  const target = new URL(`https://api.github.com/${path}`)

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => target.searchParams.append(key, String(item)))
      return
    }
    if (value !== undefined) target.searchParams.set(key, String(value))
  })

  const runtimeConfig = useRuntimeConfig(event)

  if (runtimeConfig.public.gitalk.clientID && runtimeConfig.public.gitalk.clientSecretConfigured) {
    if (!target.searchParams.has('client_id')) {
      target.searchParams.set('client_id', runtimeConfig.public.gitalk.clientID)
    }
    if (!target.searchParams.has('client_secret')) {
      target.searchParams.set('client_secret', runtimeConfig.gitalk.clientSecret)
    }
  }

  const headers: Record<string, string> = {
    Accept: getHeader(event, 'accept') || 'application/json',
    'User-Agent': 'XHBlogs-Gitalk-Proxy'
  }

  for (const [key, value] of Object.entries(getHeaders(event))) {
    const lowerKey = key.toLowerCase()
    if (!value || blockedHeaders.has(lowerKey)) continue
    if (lowerKey === 'authorization' && value.toLowerCase().startsWith('basic ')) continue
    headers[key] = value
  }

  const body = method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(event)
  if (body && !headers['content-type'] && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    return await $fetch(target.toString(), {
      method,
      headers,
      body
    })
  } catch (error: unknown) {
    const responseError = error as {
      response?: {
        status?: number
        statusText?: string
        _data?: unknown
      }
    }

    throw createError({
      statusCode: responseError.response?.status || 502,
      statusMessage: responseError.response?.statusText || 'GitHub API 请求失败',
      data: responseError.response?._data
    })
  }
})
