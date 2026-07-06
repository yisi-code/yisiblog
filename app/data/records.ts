export type DataRecordType = 'post' | 'chatter' | 'moment' | 'music' | 'friend' | 'album' | 'project' | 'about'

export type DataRecord = {
  id: string
  type: DataRecordType
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
  error?: string
  photos?: Photo[]
  icon?: string
}

export type NormalizedDataRecord = DataRecord & {
  path: string
  contentUrl: string | undefined
  tags: string[]
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
  lrcUrl?: string
  title: string
  artist?: string
  error?: string
}

type RecordsResponse = {
  records: DataRecord[]
  error?: string
}

const staticRecordsPath = '/content-data/records.json'
const normalizedRecordsCacheTtlMs = 60 * 1000
let normalizedRecordsCache: {
  records: NormalizedDataRecord[]
  expiresAt: number
} | null = null
let normalizedRecordsPromise: Promise<NormalizedDataRecord[]> | null = null

const routeBaseByType: Partial<Record<DataRecordType, string>> = {
  post: 'posts',
  chatter: 'chatter',
  album: 'albums'
}

function recordPath(record: DataRecord) {
  if (record.path) return record.path
  const base = routeBaseByType[record.type]
  if (base) return `/${base}/${record.id}`
  if (record.type === 'about') return '/about'
  return `/${record.type}s`
}

function remoteAssetUrl(value?: string) {
  if (!value || value.startsWith('/content-data/')) return value
  if (!value.includes('s3.cstcloud.cn')) return value
  return `/api/assets/remote?url=${encodeURIComponent(value)}`
}

function normalizeAssetUrls<T extends DataRecord>(record: T): T {
  return {
    ...record,
    cover: remoteAssetUrl(record.cover),
    url: record.type === 'music' ? remoteAssetUrl(record.url) : record.url,
    lrcUrl: remoteAssetUrl(record.lrcUrl),
    icon: remoteAssetUrl(record.icon),
    images: Array.isArray(record.images) ? record.images.map((image) => remoteAssetUrl(image) || image) : record.images,
    photos: Array.isArray(record.photos)
      ? record.photos.map((photo) => ({
          ...photo,
          url: remoteAssetUrl(photo.url) || photo.url
        }))
      : record.photos
  }
}

export function normalizeDataRecord(record: DataRecord): NormalizedDataRecord {
  const normalizedRecord = normalizeAssetUrls(record)
  return {
    ...normalizedRecord,
    path: recordPath(normalizedRecord),
    contentUrl: normalizedRecord.contentUrl,
    tags: Array.isArray(normalizedRecord.tags) ? normalizedRecord.tags : []
  }
}

export function normalizeRecords(records: DataRecord[]) {
  return records.map(normalizeDataRecord).sort(compareRecordsByLatest)
}

function cloneNormalizedRecords(records: NormalizedDataRecord[]) {
  return records.map((record) => ({
    ...record,
    tags: [...record.tags],
    images: record.images ? [...record.images] : undefined,
    photos: record.photos ? record.photos.map((photo) => ({ ...photo })) : undefined
  }))
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

export function recordsByType<T extends DataRecordType>(records: NormalizedDataRecord[], type: T) {
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

export function findRecordBySlug<T extends DataRecordType>(records: NormalizedDataRecord[], type: T, slug?: string | string[]) {
  return recordsByType(records, type).find((record) => recordMatchesSlug(record, slug)) || null
}

export function albumsFromRecords(records: NormalizedDataRecord[]) {
  return recordsByType(records, 'album')
    .filter((record): record is NormalizedDataRecord & { type: 'album'; title: string } => Boolean(record.title))
    .map((record) => ({
      ...record,
      photos: Array.isArray(record.photos) ? record.photos : []
    }))
}

export function friendsFromRecords(records: NormalizedDataRecord[]) {
  return recordsByType(records, 'friend')
    .filter((record): record is NormalizedDataRecord & { type: 'friend'; title: string; url: string } => Boolean(record.title && record.url))
    .map((record) => ({ ...record }))
}

export function projectsFromRecords(records: NormalizedDataRecord[]) {
  return recordsByType(records, 'project')
    .filter((record): record is NormalizedDataRecord & { type: 'project'; title: string; url: string } => Boolean(record.title && record.url))
    .map((record) => ({
      ...record,
      icon: record.icon || ''
    }))
}

export function songsFromRecords(records: NormalizedDataRecord[]) {
  return recordsByType(records, 'music')
    .filter((record): record is NormalizedDataRecord & { type: 'music'; url: string; title: string } => Boolean(record.url && record.title))
    .map((record) => ({
      ...record,
      artist: record.artist,
      error: record.error
    }))
}

export async function fetchNormalizedRecords() {
  const now = Date.now()
  if (normalizedRecordsCache && normalizedRecordsCache.expiresAt > now) {
    return cloneNormalizedRecords(normalizedRecordsCache.records)
  }

  normalizedRecordsPromise ||= (async () => {
    const response: RecordsResponse = await $fetch<DataRecord[]>(staticRecordsPath)
      .then((records) => ({ records }))
      .catch(() => $fetch<RecordsResponse>('/api/records'))
    const records = normalizeRecords(Array.isArray(response.records) ? response.records : [])

    if (!response.error) {
      normalizedRecordsCache = {
        records: cloneNormalizedRecords(records),
        expiresAt: Date.now() + normalizedRecordsCacheTtlMs
      }
    }

    return records
  })().finally(() => {
    normalizedRecordsPromise = null
  })

  return cloneNormalizedRecords(await normalizedRecordsPromise)
}

export async function fetchSongsData() {
  return songsFromRecords(await fetchNormalizedRecords())
}

export function useRecordsData(key = 'records-data') {
  const { data } = useAsyncData(key, fetchNormalizedRecords, {
    default: () => []
  })
  return computed(() => data.value || [])
}

export function useAlbumsData() {
  const records = useRecordsData('albums-records-data')
  return computed(() => albumsFromRecords(records.value))
}

export function useAlbumData(slug?: string) {
  return useAsyncData(`album-${recordSlugText(slug || '')}`, async () => {
    const records = await fetchNormalizedRecords()
    return albumsFromRecords(records).find((item) => recordMatchesSlug(item, slug)) || null
  }, {
    default: () => null
  })
}

export function useFriendsData() {
  const records = useRecordsData('friends-records-data')
  return computed(() => friendsFromRecords(records.value))
}

export function useProjectsData() {
  const records = useRecordsData('projects-records-data')
  return computed(() => projectsFromRecords(records.value))
}

export function useSongsData() {
  const records = useRecordsData('songs-records-data')
  return computed(() => songsFromRecords(records.value))
}
