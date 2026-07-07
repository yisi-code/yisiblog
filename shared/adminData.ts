export const adminRecordTypes = ['post', 'chatter', 'moment', 'about', 'music', 'friend', 'album', 'project'] as const

export type AdminRecordType = typeof adminRecordTypes[number]
type AdminRecordField = 'title' | 'description' | 'date' | 'cover' | 'url' | 'tags' | 'mood' | 'location' | 'images' | 'artist' | 'photos' | 'icon'

export const adminRecordTypeLabels: Record<AdminRecordType, string> = {
  post: '博文',
  chatter: '杂谈',
  moment: '动态',
  about: '关于',
  music: '音乐',
  friend: '友链',
  album: '相册',
  project: '项目'
}

export const adminRecordFieldConfig: Record<AdminRecordType, Partial<Record<AdminRecordField, true>>> = {
  post: {
    title: true,
    description: true,
    date: true,
    cover: true,
    tags: true
  },
  chatter: {
    title: true,
    description: true,
    date: true,
    cover: true,
    tags: true,
    mood: true
  },
  moment: {
    date: true,
    location: true,
    images: true
  },
  about: {
    title: true,
    date: true,
    cover: true
  },
  music: {
    title: true,
    description: true,
    cover: true,
    url: true,
    artist: true
  },
  friend: {
    title: true,
    description: true,
    cover: true,
    url: true
  },
  album: {
    title: true,
    description: true,
    date: true,
    cover: true,
    tags: true,
    photos: true
  },
  project: {
    title: true,
    description: true,
    cover: true,
    url: true,
    tags: true,
    icon: true
  }
}

export function adminRecordHasField(type: AdminRecordType, field: AdminRecordField) {
  return Boolean(adminRecordFieldConfig[type][field])
}

export type AdminPhoto = {
  url: string
  caption?: string
}

export type AdminDataRecord = {
  id: string
  type: AdminRecordType
  title?: string
  description?: string
  date?: string
  cover?: string
  url?: string
  lrcUrl?: string
  contentUrl?: string
  path?: string
  tags?: string[]
  mood?: string
  location?: string
  images?: string[]
  artist?: string
  photos?: AdminPhoto[]
  icon?: string
}

export type AdminManagedRecord = AdminDataRecord & {
  content?: string
  lrc?: string
  lrcFile?: string
}

export type AdminRecordsResponse = {
  records: AdminManagedRecord[]
}

export type AdminRecordDetailResponse = {
  record: AdminManagedRecord | null
}

export type AdminMusicFilePayload = {
  fileName: string
  path: string
  publicUrl: string
  storage: 'data-capsule'
  size?: number
  mimeType?: string
}

export type AdminPendingChange = {
  action: 'save' | 'delete'
  key: string
  originalId?: string
  record?: AdminDataRecord
  content?: string
  lrc?: string
  musicFile?: AdminMusicFilePayload
  id?: string
  type?: AdminRecordType
  deleteAssociatedFiles?: boolean
  snapshot?: AdminManagedRecord
  updatedAt: string
}

export type AdminSyncRecordsPayload = {
  changes: AdminPendingChange[]
}

export type AdminSyncRecordsResponse = {
  ok: true
  records: AdminManagedRecord[]
  syncedCount: number
}

export function adminRecordNeedsMarkdown(type: AdminRecordType) {
  return type === 'post' || type === 'chatter' || type === 'moment' || type === 'about'
}

export function adminLyricFileName(url?: string, fallbackTitle?: string, fallbackId?: string) {
  const sourceName = decodeURIComponent(url?.split('/').pop() || fallbackTitle || fallbackId || 'song')
  const fileName = sourceName.includes('.') ? sourceName.replace(/\.[^.]+$/, '.lrc') : `${sourceName}.lrc`
  return fileName.replace(/[\\/]/g, '-')
}
