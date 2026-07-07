export function publicContentAssetUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  if (import.meta.client) return cleanPath
  if (process.env.NODE_ENV === 'development') return `http://localhost:3000${cleanPath}`

  const siteUrl = useRuntimeConfig().public.siteUrl
  if (!siteUrl) return cleanPath
  return `${siteUrl.replace(/\/+$/, '')}${cleanPath}`
}

export async function fetchPublicContentText(path: string) {
  return await $fetch<string>(publicContentAssetUrl(path), { responseType: 'text' })
}

export async function fetchPublicContentJson<T>(path: string) {
  return await $fetch<T>(publicContentAssetUrl(path))
}
