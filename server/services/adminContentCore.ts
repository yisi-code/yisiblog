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

function markdownFirstParagraph(content = '') {
  const withoutFrontmatter = content
    .replace(/^---\s*[\s\S]*?\r?\n---\s*/, '')
    .replace(/```[\s\S]*?```/g, ' ')

  const paragraph = withoutFrontmatter
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' '))
    .find(Boolean) || ''

  return paragraph
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[\s-]*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function recordDescriptionForWrite(record: AdminDataRecord, content?: string) {
  if (record.type === 'post' || record.type === 'chatter' || record.type === 'moment') {
    return record.description?.trim() || markdownFirstParagraph(content)
  }

  return adminRecordHasField(record.type, 'description') ? record.description?.trim() : undefined
}

export function normalizeRecordForWrite(record: AdminDataRecord, options: { content?: string } = {}): AdminDataRecord {
  assertAdminId(record.id)

  if (record.type === 'about' && record.id !== 'about') {
    throw createError({ statusCode: 400, statusMessage: 'about 类型只支持 about 页面' })
  }

  return compactRecord({
    id: record.type === 'about' ? 'about' : record.id.trim(),
    type: record.type,
    title: adminRecordHasField(record.type, 'title') ? record.title?.trim() : undefined,
    description: recordDescriptionForWrite(record, options.content),
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
    photos: adminRecordHasField(record.type, 'photos') && Array.isArray(record.photos) ? record.photos.map((photo) => ({
      url: String(photo.url || '').trim(),
      caption: photo.caption?.trim()
    })).filter((photo) => photo.url) : []
  })
}
