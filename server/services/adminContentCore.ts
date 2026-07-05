import {
  adminRecordHasField,
  adminRecordNeedsMarkdown,
  type AdminDataRecord
} from '~~/shared/adminData'

export function assertAdminId(id: string) {
  if (!id || id.length > 120 || id.includes('..') || /[\\/]/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: '记录 ID 只能是普通文件名，不能包含路径字符' })
  }
}

export function compactRecord(record: AdminDataRecord): AdminDataRecord {
  return Object.fromEntries(Object.entries(record).filter(([key, value]) => {
    const shouldDrop = value === undefined
      || value === ''
      || (Array.isArray(value) && value.length === 0)
      || (value && typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length)

    return key === 'id' || key === 'type' || !shouldDrop
  })) as AdminDataRecord
}

export function normalizeRecordForRead(record: AdminDataRecord): AdminDataRecord {
  return compactRecord({
    ...record,
    tags: Array.isArray(record.tags) ? record.tags : []
  })
}

export function normalizeRecordForWrite(record: AdminDataRecord): AdminDataRecord {
  assertAdminId(record.id)

  if (record.type === 'about' && record.id !== 'about') {
    throw createError({ statusCode: 400, statusMessage: 'about 类型只支持 about 页面' })
  }

  return compactRecord({
    id: record.type === 'about' ? 'about' : record.id.trim(),
    type: record.type,
    title: adminRecordHasField(record.type, 'title') ? record.title?.trim() : undefined,
    description: adminRecordHasField(record.type, 'description') ? record.description?.trim() : undefined,
    date: adminRecordHasField(record.type, 'date') ? record.date?.trim() : undefined,
    cover: adminRecordHasField(record.type, 'cover') ? record.cover?.trim() : undefined,
    url: adminRecordHasField(record.type, 'url') ? record.url?.trim() : undefined,
    lrcUrl: record.type === 'music' ? record.lrcUrl?.trim() : undefined,
    contentUrl: adminRecordNeedsMarkdown(record.type) ? record.contentUrl?.trim() : undefined,
    path: record.path?.trim(),
    tags: adminRecordHasField(record.type, 'tags') && Array.isArray(record.tags) ? record.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    mood: adminRecordHasField(record.type, 'mood') ? record.mood?.trim() : undefined,
    location: adminRecordHasField(record.type, 'location') ? record.location?.trim() : undefined,
    images: adminRecordHasField(record.type, 'images') && Array.isArray(record.images) ? record.images.map((image) => String(image).trim()).filter(Boolean) : [],
    artist: adminRecordHasField(record.type, 'artist') ? record.artist?.trim() : undefined,
    error: adminRecordHasField(record.type, 'error') ? record.error?.trim() : undefined,
    photos: adminRecordHasField(record.type, 'photos') && Array.isArray(record.photos) ? record.photos.map((photo) => ({
      url: String(photo.url || '').trim(),
      caption: photo.caption?.trim()
    })).filter((photo) => photo.url) : [],
    icon: adminRecordHasField(record.type, 'icon') ? record.icon?.trim() : undefined
  })
}
