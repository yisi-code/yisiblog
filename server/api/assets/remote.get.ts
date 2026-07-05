import { readDataCapsuleObjectWithMeta } from '#server/services/dataCapsuleStorage'
import { readDataCapsuleRecords } from '#server/services/adminRecordsDataCapsule'

async function allowedAssetUrls() {
  const records = await readDataCapsuleRecords()
  const urls = new Set<string>()

  for (const record of records) {
    for (const value of [
      record.cover,
      record.url,
      record.lrcUrl,
      record.icon,
      ...(record.images || []),
      ...(record.photos || []).map((photo) => photo.url)
    ]) {
      if (typeof value === 'string' && value) urls.add(value)
    }
  }

  return urls
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = String(query.url || '')

  if (!url || !(await allowedAssetUrls()).has(url)) {
    throw createError({ statusCode: 404, statusMessage: '资源不存在' })
  }

  const asset = await readDataCapsuleObjectWithMeta(url)
  if (!asset.body.byteLength) {
    throw createError({ statusCode: 404, statusMessage: '资源不存在' })
  }

  setHeader(event, 'content-type', asset.contentType || 'application/octet-stream')
  const contentLength = Number(asset.contentLength)
  if (Number.isFinite(contentLength) && contentLength > 0) setHeader(event, 'content-length', contentLength)
  if (asset.etag) setHeader(event, 'etag', asset.etag)
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')

  return asset.body
})
