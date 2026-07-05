import { createHash, createHmac } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'

const recordsPath = resolve('app/data/source/records.json')
const contentSourceDir = resolve('content')
const publicSourceDir = resolve('public')
const region = 'us-east-1'
const service = 's3'
const requestType = 'aws4_request'
const userAgent = 'rclone/v1.74.3'

const folderByType = {
  post: '博文',
  chatter: '杂谈',
  moment: '动态',
  about: '关于',
  music: '音乐',
  friend: '友链',
  album: '相册',
  project: '项目'
}

const contentFolderByType = {
  post: 'posts',
  chatter: 'chatters',
  moment: 'moments',
  about: 'about'
}

function loadEnv() {
  const env = {}
  const text = existsSync('.env') ? readFileSync('.env', 'utf8') : ''
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index <= 0) continue
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function normalizeEndpoint(value) {
  const endpoint = String(value || '').trim()
  if (!endpoint) return ''
  return /^https?:\/\//i.test(endpoint) ? endpoint : `https://${endpoint}`
}

function trimSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '')
}

function joinKey(...parts) {
  return parts.map((part) => trimSlashes(part)).filter(Boolean).join('/')
}

function safePathPart(value, fallback) {
  const clean = Array.from(String(value || ''))
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code > 31 && code !== 127
    })
    .join('')
    .replace(/[\\/]/g, '-')
    .trim()
  return clean || fallback
}

function recordFolder(record) {
  return joinKey(folderByType[record.type] || record.type, safePathPart(record.id, 'record'))
}

function recordBase(record, suffix) {
  const idPart = safePathPart(record.id, 'record')
  return suffix ? `${idPart}-${safePathPart(String(suffix), String(suffix))}` : idPart
}

function hashHex(value) {
  return createHash('sha256').update(value).digest('hex')
}

function hmac(key, value) {
  return createHmac('sha256', key).update(value).digest()
}

function hmacHex(key, value) {
  return createHmac('sha256', key).update(value).digest('hex')
}

function amzDateParts() {
  const source = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  return {
    amzDate: source,
    dateStamp: source.slice(0, 8)
  }
}

function encodePathPart(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

function encodePathname(pathname) {
  return pathname.split('/').map((part) => encodePathPart(decodeURIComponent(part))).join('/')
}

function encodeKeyPath(key) {
  return key.split('/').map((part) => encodePathPart(part)).join('/')
}

function contentTypeByExtension(filePath) {
  const extension = extname(filePath).toLowerCase()
  if (extension === '.md') return 'text/markdown; charset=utf-8'
  if (extension === '.m4a') return 'audio/mp4'
  if (extension === '.mp3') return 'audio/mpeg'
  if (extension === '.lrc') return 'text/plain; charset=utf-8'
  if (extension === '.txt') return 'text/plain; charset=utf-8'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.webp') return 'image/webp'
  if (extension === '.gif') return 'image/gif'
  if (extension === '.avif') return 'image/avif'
  return 'application/octet-stream'
}

function extensionFromUrl(url) {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname)
    const extension = extname(pathname).toLowerCase()
    return extension || ''
  } catch {
    return ''
  }
}

function objectUrl(config, key) {
  const endpoint = new URL(config.endpoint)
  const encodedPath = joinKey(config.bucket, key).split('/').map((part) => encodePathPart(part)).join('/')
  return new URL(`/${encodedPath}`, endpoint.origin)
}

function publicUrl(config, key) {
  const endpoint = new URL(config.endpoint)
  return `${endpoint.origin}/${encodePathPart(config.bucket)}/${key.split('/').map((part) => encodePathPart(part)).join('/')}`
}

function signingKey(config, dateStamp) {
  const dateKey = hmac(`AWS4${config.secretAccessKey}`, dateStamp)
  const regionKey = hmac(dateKey, region)
  const serviceKey = hmac(regionKey, service)
  return hmac(serviceKey, requestType)
}

function authorizationHeader(config, method, url, queryText, headers, payloadHash, dateStamp, amzDate) {
  const signedHeaders = Object.keys(headers).sort().join(';')
  const canonicalHeaders = Object.keys(headers).sort().map((name) => `${name}:${headers[name]}\n`).join('')
  const canonicalRequest = [
    method,
    encodePathname(url.pathname),
    queryText,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n')
  const credentialScope = `${dateStamp}/${region}/${service}/${requestType}`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashHex(canonicalRequest)
  ].join('\n')
  return [
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${hmacHex(signingKey(config, dateStamp), stringToSign)}`
  ].join(', ')
}

async function uploadObject(config, key, body, contentType) {
  const url = objectUrl(config, key)
  const payloadHash = hashHex(body)
  const { amzDate, dateStamp } = amzDateParts()
  const headers = {
    host: url.host,
    'content-type': contentType,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  }
  const authorization = authorizationHeader(config, 'PUT', url, '', headers, payloadHash, dateStamp, amzDate)
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      authorization,
      'user-agent': userAgent
    },
    body: new Uint8Array(body)
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(`上传失败：${key} ${response.status} ${message || response.statusText}`)
  }

  return publicUrl(config, key)
}

async function copyObject(config, sourceKey, targetKey) {
  if (sourceKey === targetKey) return publicUrl(config, targetKey)

  const url = objectUrl(config, targetKey)
  const payloadHash = hashHex(Buffer.alloc(0))
  const { amzDate, dateStamp } = amzDateParts()
  const headers = {
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-copy-source': `/${config.bucket}/${encodeKeyPath(sourceKey)}`,
    'x-amz-date': amzDate
  }
  const authorization = authorizationHeader(config, 'PUT', url, '', headers, payloadHash, dateStamp, amzDate)
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      authorization,
      'user-agent': userAgent
    }
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(`复制失败：${sourceKey} -> ${targetKey} ${response.status} ${message || response.statusText}`)
  }

  return publicUrl(config, targetKey)
}

function dataCapsuleKeyFromUrl(config, value) {
  if (!value) return ''
  try {
    const url = new URL(value)
    const endpoint = new URL(config.endpoint)
    if (url.origin !== endpoint.origin) return ''
    const parts = url.pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part))
    const bucketIndex = parts.indexOf(config.bucket)
    return bucketIndex >= 0 ? parts.slice(bucketIndex + 1).join('/') : ''
  } catch {
    return ''
  }
}

const downloadCache = new Map()

async function downloadRemoteAsset(url) {
  if (downloadCache.has(url)) return downloadCache.get(url)
  const response = await fetch(url, { headers: { 'user-agent': userAgent } })
  if (!response.ok) throw new Error(`下载失败：${url} ${response.status} ${response.statusText}`)
  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const buffer = Buffer.from(await response.arrayBuffer())
  const asset = { buffer, contentType }
  downloadCache.set(url, asset)
  return asset
}

function localPublicPath(value) {
  if (!value || /^https?:\/\//i.test(value)) return ''
  const cleanUrl = decodeURIComponent(String(value).split(/[?#]/)[0]).replace(/^\/+/, '')
  const filePath = resolve(publicSourceDir, cleanUrl)
  return existsSync(filePath) ? filePath : ''
}

function localLyricPath(record) {
  const candidates = [
    resolve(contentSourceDir, 'lyrics', `${record.id}.lrc`),
    resolve(contentSourceDir, 'lyrics', `${record.title || record.id}.lrc`),
    resolve(contentSourceDir, 'lyrics', `${record.id}.txt`),
    resolve(contentSourceDir, 'lyrics', `${record.title || record.id}.txt`)
  ]
  return candidates.find((candidate) => existsSync(candidate)) || ''
}

function localFileNameCandidates(...values) {
  const names = []
  for (const value of values) {
    const text = String(value || '').trim()
    if (!text) continue
    names.push(text)
    names.push(text.replace(/[<>:"/\\|?*]/g, '_'))
  }
  return [...new Set(names)]
}

function localContentPath(record) {
  const folder = contentFolderByType[record.type]
  if (!folder) return ''
  const candidates = localFileNameCandidates(record.id, record.title).map((name) => resolve(contentSourceDir, folder, `${name}.md`))
  return candidates.find((candidate) => existsSync(candidate)) || ''
}

async function migrateUrlAsset(config, value, targetKey, uploaded, meta) {
  if (!value) return value

  const existingKey = dataCapsuleKeyFromUrl(config, value)
  if (existingKey) {
    const nextUrl = await copyObject(config, existingKey, targetKey)
    if (nextUrl !== value) uploaded.push({ ...meta, key: targetKey, mode: 'copy' })
    return nextUrl
  }

  const localPath = localPublicPath(value)
  if (localPath) {
    const nextUrl = await uploadObject(config, targetKey, readFileSync(localPath), contentTypeByExtension(localPath))
    uploaded.push({ ...meta, key: targetKey, mode: 'local' })
    return nextUrl
  }

  if (/^https?:\/\//i.test(value)) {
    const asset = await downloadRemoteAsset(value)
    const nextUrl = await uploadObject(config, targetKey, asset.buffer, asset.contentType || contentTypeByExtension(targetKey))
    uploaded.push({ ...meta, key: targetKey, mode: 'download' })
    return nextUrl
  }

  return value
}

async function main() {
  const env = loadEnv()
  const config = {
    endpoint: normalizeEndpoint(env.DATA_CAPSULE_ENDPOINT),
    bucket: String(env.DATA_CAPSULE_BUCKET || '').trim(),
    accessKeyId: String(env.DATA_CAPSULE_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: String(env.DATA_CAPSULE_SECRET_ACCESS_KEY || '').trim()
  }

  if (!config.endpoint || !config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error('缺少 DATA_CAPSULE_ENDPOINT / DATA_CAPSULE_BUCKET / DATA_CAPSULE_ACCESS_KEY_ID / DATA_CAPSULE_SECRET_ACCESS_KEY')
  }

  const records = JSON.parse(readFileSync(recordsPath, 'utf8'))
  const uploaded = []
  const failures = []
  let changed = false

  for (const record of records) {
    const folder = recordFolder(record)
    const baseName = recordBase(record)

    const contentPath = localContentPath(record)
    if (contentPath) {
      const key = joinKey(folder, `${baseName}.md`)
      const nextUrl = await uploadObject(config, key, readFileSync(contentPath), contentTypeByExtension(contentPath))
      if (record.contentUrl !== nextUrl) {
        record.contentUrl = nextUrl
        uploaded.push({ type: 'content', id: record.id, key, mode: 'local' })
        changed = true
      }
    }

    if (record.cover) {
      try {
        const extension = extensionFromUrl(record.cover) || '.jpg'
        const key = joinKey(folder, `${baseName}${extension}`)
        const nextUrl = await migrateUrlAsset(config, record.cover, key, uploaded, { type: 'cover', id: record.id })
        if (nextUrl !== record.cover) {
          record.cover = nextUrl
          changed = true
        }
      } catch (error) {
        failures.push({ type: 'cover', id: record.id, message: error instanceof Error ? error.message : String(error) })
      }
    }

    if (record.type === 'music') {
      const musicExtension = extensionFromUrl(record.url) || '.m4a'
      const musicKey = joinKey(folder, `${baseName}${musicExtension}`)
      const nextMusicUrl = await migrateUrlAsset(config, record.url, musicKey, uploaded, { type: 'music', id: record.id })
      if (nextMusicUrl !== record.url) {
        record.url = nextMusicUrl
        changed = true
      }

      const lyricPath = localLyricPath(record)
      if (lyricPath) {
        const key = joinKey(folder, `${baseName}${extname(lyricPath) || '.lrc'}`)
        const nextUrl = await uploadObject(config, key, readFileSync(lyricPath), contentTypeByExtension(lyricPath))
        if (record.lrcUrl !== nextUrl) {
          record.lrcUrl = nextUrl
          uploaded.push({ type: 'lyric', id: record.id, key, mode: 'local' })
          changed = true
        }
      } else if (record.lrcUrl) {
        const extension = extensionFromUrl(record.lrcUrl) || '.lrc'
        const key = joinKey(folder, `${baseName}${extension}`)
        const nextUrl = await migrateUrlAsset(config, record.lrcUrl, key, uploaded, { type: 'lyric', id: record.id })
        if (nextUrl !== record.lrcUrl) {
          record.lrcUrl = nextUrl
          changed = true
        }
      }
    }

    if (Array.isArray(record.images)) {
      for (let index = 0; index < record.images.length; index += 1) {
        try {
          const currentUrl = record.images[index]
          const extension = extensionFromUrl(currentUrl) || '.jpg'
          const key = joinKey(folder, `${recordBase(record, index + 1)}${extension}`)
          const nextUrl = await migrateUrlAsset(config, currentUrl, key, uploaded, { type: 'image', id: record.id })
          if (nextUrl !== currentUrl) {
            record.images[index] = nextUrl
            changed = true
          }
        } catch (error) {
          failures.push({ type: 'image', id: record.id, message: error instanceof Error ? error.message : String(error) })
        }
      }
    }

    if (Array.isArray(record.photos)) {
      for (let index = 0; index < record.photos.length; index += 1) {
        try {
          const photo = record.photos[index]
          const extension = extensionFromUrl(photo.url) || '.jpg'
          const suffix = photo.caption?.trim() || index + 1
          const key = joinKey(folder, `${recordBase(record, suffix)}${extension}`)
          const nextUrl = await migrateUrlAsset(config, photo.url, key, uploaded, { type: 'photo', id: record.id })
          if (nextUrl !== photo.url) {
            photo.url = nextUrl
            changed = true
          }
        } catch (error) {
          failures.push({ type: 'photo', id: record.id, message: error instanceof Error ? error.message : String(error) })
        }
      }
    }
  }

  if (changed) {
    writeFileSync(recordsPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  }

  await uploadObject(config, 'records.json', Buffer.from(`${JSON.stringify(records, null, 2)}\n`, 'utf8'), 'application/json; charset=utf-8')
  uploaded.push({ type: 'records', id: 'records.json', key: 'records.json', mode: 'root' })

  console.log(JSON.stringify({
    uploaded,
    failures,
    changedRecords: changed,
    note: '未删除旧数据胶囊对象、public/music 或 content 中的原文件'
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
