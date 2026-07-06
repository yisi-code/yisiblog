import type { AdminDataRecord, AdminRecordType } from './adminData'

export const contentDataPublicBase = '/content-data'
export const githubContentDataDefaultBasePath = 'public/content-data'

const markdownFolderByType: Partial<Record<AdminRecordType, string>> = {
  post: 'posts',
  chatter: 'chatter',
  moment: 'moments',
  about: 'about'
}

export function safeContentPathPart(value: string | undefined, fallback: string) {
  const clean = Array.from(String(value || ''))
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code > 31 && code !== 127
    })
    .join('')
    .replace(/[<>:"/\\|?*#%&{}^~[\]`]/g, '_')
    .trim()

  return clean || fallback
}

export function contentDataPath(...parts: string[]) {
  return [contentDataPublicBase, ...parts.map((part) => part.replace(/^\/+|\/+$/g, '')).filter(Boolean)].join('/')
}

export function githubPathFromContentPath(path: string, basePath = githubContentDataDefaultBasePath) {
  const cleanBase = basePath.replace(/^\/+|\/+$/g, '')
  const cleanPath = path.replace(/^\/+/, '')
  if (cleanPath === contentDataPublicBase.replace(/^\/+/, '')) return cleanBase
  return `${cleanBase}/${cleanPath.replace(/^content-data\/?/, '')}`.replace(/\/+/g, '/')
}

export function contentRecordsPath() {
  return contentDataPath('records.json')
}

export function contentMarkdownPath(record: Pick<AdminDataRecord, 'id' | 'type'>) {
  const folder = markdownFolderByType[record.type]
  if (!folder) return ''

  const id = record.type === 'about' ? 'about' : safeContentPathPart(record.id, 'record')
  return contentDataPath(folder, `${id}.md`)
}

export function contentMusicPath(record: Pick<AdminDataRecord, 'id'>, extension: string) {
  const id = safeContentPathPart(record.id, 'music')
  const cleanExtension = extension.startsWith('.') ? extension : `.${extension}`
  return contentDataPath('music', `${id}${cleanExtension}`)
}

export function contentLyricPath(record: Pick<AdminDataRecord, 'id'>) {
  const id = safeContentPathPart(record.id, 'music')
  return contentDataPath('music', `${id}.lrc`)
}
