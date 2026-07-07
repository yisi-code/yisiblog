export function publicContentAssetUrl(path: string) {
  const cleanPath = encodeContentPath(path)
  if (import.meta.client) return cleanPath
  if (process.env.NODE_ENV === 'development') return `http://localhost:3000${cleanPath}`

  const siteUrl = useRuntimeConfig().public.siteUrl
  if (!siteUrl) return cleanPath
  return `${siteUrl.replace(/\/+$/, '')}${cleanPath}`
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
