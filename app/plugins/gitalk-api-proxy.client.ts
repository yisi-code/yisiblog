export default defineNuxtPlugin(() => {
  const marker = '__xhblogsGitalkApiProxyPatched'
  const proto = XMLHttpRequest.prototype as XMLHttpRequest & Record<string, boolean>;

  if (proto[marker]) return
  proto[marker] = true

  const originalOpen = XMLHttpRequest.prototype.open

  XMLHttpRequest.prototype.open = function open(
    method: string,
    url: string | URL,
    asyncFlag: boolean = true,
    username?: string | null,
    password?: string | null
  ) {
    const nextUrl = rewriteGithubApiUrl(url)

    if (typeof nextUrl === 'string' && nextUrl.startsWith('/api/github-rest')) {
      return originalOpen.call(this, method, nextUrl, asyncFlag)
    }

    return originalOpen.call(this, method, nextUrl, asyncFlag, username, password)
  }
})

function rewriteGithubApiUrl(url: string | URL) {
  const urlText = url.toString()
  const githubApiOrigin = 'https://api.github.com'

  if (!urlText.startsWith(githubApiOrigin)) return url

  return urlText.replace(githubApiOrigin, '/api/github-rest')
}
