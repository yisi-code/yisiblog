export function publicContentAssetUrl(path: string) {
  const cleanPath = encodeContentPath(path)
  if (import.meta.client) return cleanPath

  const origin = currentRequestOrigin() || configuredSiteOrigin()
  if (!origin) return cleanPath
  return `${origin}${cleanPath}`
}

function currentRequestOrigin() {
  try {
    const origin = useRequestURL().origin
    return origin && origin !== 'null' ? origin.replace(/\/+$/, '') : ''
  } catch {
    return ''
  }
}

function configuredSiteOrigin() {
  const siteUrl = useRuntimeConfig().public.siteUrl
  return typeof siteUrl === 'string' && siteUrl ? siteUrl.replace(/\/+$/, '') : ''
}

function encodeContentPath(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return cleanPath
    .split('/')
    .map((part, index) => index === 0 ? '' : encodeURIComponent(safeDecodePathPart(part)))
    .join('/')
}

function safeDecodePathPart(part: string) {
  try {
    return decodeURIComponent(part)
  } catch {
    return part
  }
}

export async function fetchPublicContentText(path: string) {
  return await $fetch<string>(publicContentAssetUrl(path), { responseType: 'text' })
}

export async function fetchPublicContentJson<T>(path: string) {
  return await $fetch<T>(publicContentAssetUrl(path))
}
