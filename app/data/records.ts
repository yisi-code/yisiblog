import recordsSource from './source/records.json'

export type DataRecordType = 'post' | 'chatter' | 'moment' | 'music' | 'friend' | 'album' | 'project' | 'about'

export type DataRecord = {
  id: string
  type: DataRecordType
  title?: string
  description?: string
  date?: string
  cover?: string
  url?: string
  path?: string
  tags: string[]
  mood?: string
  location?: string
  images?: string[]
  artist?: string
  error?: string
  photos?: Photo[]
  icon?: string
}

export type NormalizedDataRecord = DataRecord & {
  path: string
  contentFile: string | undefined
}

export type Photo = {
  url: string
  caption?: string
}

export type Album = NormalizedDataRecord & {
  type: 'album'
  title: string
  photos: Photo[]
}

export type Friend = NormalizedDataRecord & {
  type: 'friend'
  title: string
  url: string
}

export type Project = NormalizedDataRecord & {
  type: 'project'
  title: string
  url: string
  icon: string
}

export type Song = NormalizedDataRecord & {
  type: 'music'
  url: string
  title: string
  artist?: string
  error?: string
}

const routeBaseByType: Partial<Record<DataRecordType, string>> = {
  post: 'posts',
  chatter: 'chatter',
  album: 'albums',
}

const contentBaseByType: Partial<Record<DataRecordType, string>> = {
  post: 'posts',
  chatter: 'chatters',
  moment: 'moments',
  about: 'about'
}

function recordPath(record: DataRecord) {
  if (record.path) return record.path
  const base = routeBaseByType[record.type]
  if (base) return `/${base}/${record.id}`
  if (record.type === 'about') return '/about'
  return `/${record.type}s`
}

function recordContentFile(record: DataRecord) {
  const base = contentBaseByType[record.type]
  return base ? `${base}/${record.id}` : undefined
}

export function recordTimestamp(record: Pick<DataRecord, 'date' | 'id'>) {
  const rawDate = record.date || String(record.id || '').match(/-(\d{10,})/)?.[1] || ''
  if (/^\d{10,}$/.test(rawDate)) return Number(rawDate)

  const normalizedDate = rawDate.replace(/^(\d{2})-/, '20$1-')
  const timestamp = new Date(normalizedDate).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function compareRecordsByLatest<T extends Pick<DataRecord, 'date' | 'id'>>(a: T, b: T) {
  return recordTimestamp(b) - recordTimestamp(a)
}

export const records: NormalizedDataRecord[] = (recordsSource as DataRecord[]).map((record) => ({
  ...record,
  path: recordPath(record),
  contentFile: recordContentFile(record),
  tags: Array.isArray(record.tags) ? record.tags : []
})).sort(compareRecordsByLatest) satisfies NormalizedDataRecord[]

export function recordsByType<T extends DataRecordType>(type: T) {
  return records.filter((record): record is NormalizedDataRecord & { type: T } => record.type === type)
}

export function recordMatchesSlug(record: NormalizedDataRecord, slug?: string | string[]) {
  if (!slug) return false
  const slugText = Array.isArray(slug) ? slug.join('/') : slug
  return record.id === slugText || record.path.endsWith(`/${slugText}`)
}

export function recordSlugText(slug: string | string[]) {
  return Array.isArray(slug) ? slug.join('/') : slug
}

export function findRecordBySlug<T extends DataRecordType>(type: T, slug?: string | string[]) {
  return recordsByType(type).find((record) => recordMatchesSlug(record, slug)) || null
}

export const albums: Album[] = recordsByType('album')
  .filter((record): record is NormalizedDataRecord & { type: 'album'; title: string } => Boolean(record.title))
  .map((record) => ({
    ...record,
    photos: Array.isArray(record.photos) ? record.photos : []
  }))

export const friends: Friend[] = recordsByType('friend')
  .filter((record): record is NormalizedDataRecord & { type: 'friend'; title: string; url: string } => Boolean(record.title && record.url))
  .map((record) => ({ ...record }))

export const projects: Project[] = recordsByType('project')
  .filter((record): record is NormalizedDataRecord & { type: 'project'; title: string; url: string } => Boolean(record.title && record.url))
  .map((record) => ({
    ...record,
    icon: record.icon || ''
  }))

export const songs: Song[] = recordsByType('music')
  .filter((record): record is NormalizedDataRecord & { type: 'music'; url: string; title: string } => Boolean(record.url && record.title))
  .map((record) => ({
    ...record,
    artist: record.artist,
    error: record.error
  }))

function useStaticData<T>(key: string, value: T) {
  return useState<T>(key, () => value)
}

// Pages and stores use these composables so static records and content records
// share the same "useXxxData" access style.
export function useAlbumsData() {
  return useStaticData('albums-data', albums)
}

export function useAlbumData(slug?: string) {
  const albumItems = useAlbumsData()
  return computed(() => albumItems.value.find((item) => recordMatchesSlug(item, slug)) || null)
}

export function useFriendsData() {
  return useStaticData('friends-data', friends)
}

export function useProjectsData() {
  return useStaticData('projects-data', projects)
}

export function useSongsData() {
  return useStaticData('songs-data', songs)
}
