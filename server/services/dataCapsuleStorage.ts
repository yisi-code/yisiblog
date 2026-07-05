import { createHash, createHmac } from 'node:crypto'

type DataCapsuleConfig = {
  endpoint: string
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
}

type UploadObjectParams = {
  key: string
  body: Buffer
  contentType?: string
}

type DataCapsuleObject = {
  body: Buffer
  contentType: string
  contentLength: string
  etag: string
}

type SignedRequestParams = {
  method: 'DELETE' | 'GET' | 'PUT'
  key?: string
  query?: Record<string, string>
  body?: Buffer
  contentType?: string
  headers?: Record<string, string>
  payloadHashMode?: 'empty' | 'unsigned'
}

const s3Service = 's3'
const s3RequestType = 'aws4_request'
const s3CompatibleUserAgent = 'rclone/v1.74.3'
const emptyPayloadHash = hashHex(Buffer.alloc(0))

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, '')
}

function joinKey(...parts: string[]) {
  return parts.map((part) => trimSlashes(part)).filter(Boolean).join('/')
}

function hashHex(value: Buffer | string) {
  return createHash('sha256').update(value).digest('hex')
}

function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest()
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest('hex')
}

function amzDateParts(date = new Date()) {
  const source = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
  return {
    amzDate: source,
    dateStamp: source.slice(0, 8)
  }
}

function encodePathPart(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

function encodePathname(pathname: string) {
  return pathname.split('/').map((part) => encodePathPart(decodeURIComponent(part))).join('/')
}

function encodeQueryValue(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

function canonicalQuery(query: Record<string, string>) {
  return Object.keys(query).sort().map((key) => `${encodeQueryValue(key)}=${encodeQueryValue(query[key] || '')}`).join('&')
}

function publicObjectUrl(baseUrl: string, key: string) {
  const base = baseUrl.replace(/\/+$/g, '')
  const encodedKey = key.split('/').map((part) => encodePathPart(part)).join('/')
  return `${base}/${encodedKey}`
}

function encodeKeyPath(key: string) {
  return key.split('/').map((part) => encodePathPart(part)).join('/')
}

function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function bucketBaseUrl(config: DataCapsuleConfig, bucket: string) {
  return objectUrl(config, bucket, '').toString().replace(/\/+$/g, '')
}

function objectUrl(config: DataCapsuleConfig, bucket: string, key: string) {
  const endpoint = new URL(config.endpoint)
  const endpointPath = trimSlashes(endpoint.pathname)
  const objectPath = joinKey(endpointPath, bucket, key).split('/').map((part) => encodePathPart(part)).join('/')
  return new URL(`/${objectPath}`, endpoint.origin)
}

function signingKey(config: DataCapsuleConfig, dateStamp: string) {
  const dateKey = hmac(`AWS4${config.secretAccessKey}`, dateStamp)
  const regionKey = hmac(dateKey, config.region)
  const serviceKey = hmac(regionKey, s3Service)
  return hmac(serviceKey, s3RequestType)
}

function dataCapsuleConfig(): DataCapsuleConfig | null {
  const runtimeConfig = useRuntimeConfig()
  const source = runtimeConfig.dataCapsule || {}
  const endpoint = normalizeDataCapsuleEndpoint(source.endpoint || process.env.DATA_CAPSULE_ENDPOINT || '')
  const bucket = String(source.bucket || process.env.DATA_CAPSULE_BUCKET || '').trim()
  const region = 'us-east-1'
  const accessKeyId = String(source.accessKeyId || process.env.DATA_CAPSULE_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = String(source.secretAccessKey || process.env.DATA_CAPSULE_SECRET_ACCESS_KEY || '').trim()

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null

  return {
    endpoint,
    bucket,
    region,
    accessKeyId,
    secretAccessKey
  }
}

function normalizeDataCapsuleEndpoint(value: unknown) {
  const endpoint = String(value || '').trim()
  if (!endpoint) return ''
  return /^https?:\/\//i.test(endpoint) ? endpoint : `https://${endpoint}`
}

export function isDataCapsuleConfigured() {
  return Boolean(dataCapsuleConfig())
}

function dataCapsuleCredentialDebug(config: DataCapsuleConfig) {
  return {
    endpoint: config.endpoint,
    bucket: config.bucket,
    accessKeyIdTail: config.accessKeyId.slice(-4),
    secretLength: config.secretAccessKey.length,
    secretTail: config.secretAccessKey.slice(-4)
  }
}

async function signedDataCapsuleRequest(config: DataCapsuleConfig, params: SignedRequestParams) {
  const key = joinKey(params.key || '')
  const url = objectUrl(config, config.bucket, key)
  const queryText = canonicalQuery(params.query || {})
  if (queryText) url.search = queryText

  const body = params.body || Buffer.alloc(0)
  const payloadHash = params.method === 'PUT' && body.byteLength
    ? hashHex(body)
    : params.payloadHashMode === 'unsigned'
      ? 'UNSIGNED-PAYLOAD'
      : emptyPayloadHash
  const { amzDate, dateStamp } = amzDateParts()
  const headers: Record<string, string> = {
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  }

  if (params.contentType) headers['content-type'] = params.contentType
  Object.assign(headers, params.headers || {})

  const signedHeaders = Object.keys(headers).sort().join(';')
  const canonicalHeaders = Object.keys(headers).sort().map((name) => `${name}:${headers[name]}\n`).join('')
  const canonicalRequest = [
    params.method,
    encodePathname(url.pathname),
    queryText,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n')
  const credentialScope = `${dateStamp}/${config.region}/${s3Service}/${s3RequestType}`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashHex(canonicalRequest)
  ].join('\n')
  const signature = hmacHex(signingKey(config, dateStamp), stringToSign)
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`
  ].join(', ')

  const requestBody = new Uint8Array(body.byteLength)
  requestBody.set(body)

  return await fetch(url, {
    method: params.method,
    headers: {
      ...headers,
      authorization,
      'user-agent': s3CompatibleUserAgent
    },
    body: params.method === 'PUT' && body.byteLength ? requestBody : undefined
  })
}

async function listDataCapsulePage(config: DataCapsuleConfig, query: Record<string, string>) {
  const response = await signedDataCapsuleRequest(config, {
    method: 'GET',
    query,
    payloadHashMode: 'empty'
  })

  if (response.status !== 401 && response.status !== 403) return response

  return await signedDataCapsuleRequest(config, {
    method: 'GET',
    query,
    payloadHashMode: 'unsigned'
  })
}

function dataCapsuleKeyFromUrl(config: DataCapsuleConfig, value?: string) {
  if (!value) return ''

  try {
    const url = new URL(value)
    const endpoint = new URL(config.endpoint)
    if (url.origin !== endpoint.origin) return ''

    const endpointPath = trimSlashes(endpoint.pathname)
    const objectBase = joinKey(endpointPath, config.bucket)
    const pathParts = url.pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part))
    const baseParts = objectBase.split('/').filter(Boolean)
    const matchesBase = baseParts.every((part, index) => pathParts[index] === part)

    if (!matchesBase) return ''

    return pathParts.slice(baseParts.length).join('/')
  } catch {
    return ''
  }
}

export function dataCapsuleObjectKeyFromUrl(value?: string) {
  const config = dataCapsuleConfig()
  if (!config) return ''
  return dataCapsuleKeyFromUrl(config, value)
}

export function dataCapsuleObjectUrlFromKey(key: string) {
  const config = dataCapsuleConfig()
  if (!config) throw new Error('未配置中国科技云数据胶囊 S3 变量')
  return publicObjectUrl(bucketBaseUrl(config, config.bucket), joinKey(key))
}

export async function uploadDataCapsuleObject(params: UploadObjectParams) {
  const config = dataCapsuleConfig()
  if (!config) throw new Error('未配置中国科技云数据胶囊 S3 上传变量')

  const key = joinKey(params.key)
  const response = await signedDataCapsuleRequest(config, {
    method: 'PUT',
    key,
    body: params.body,
    contentType: params.contentType || 'application/octet-stream'
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(`数据胶囊上传失败：${response.status} ${message || response.statusText}`)
  }

  return {
    key,
    bucket: config.bucket,
    url: publicObjectUrl(bucketBaseUrl(config, config.bucket), key)
  }
}

export async function readDataCapsuleObject(sourceUrl: string | undefined) {
  const object = await readDataCapsuleObjectWithMeta(sourceUrl)
  return object.body
}

export async function readDataCapsuleObjectByKey(key: string) {
  const object = await readDataCapsuleObjectWithMetaByKey(key)
  return object.body
}

export async function readDataCapsuleObjectWithMeta(sourceUrl: string | undefined): Promise<DataCapsuleObject> {
  const config = dataCapsuleConfig()
  if (!config) throw new Error('未配置中国科技云数据胶囊 S3 变量')

  const sourceKey = dataCapsuleKeyFromUrl(config, sourceUrl)
  if (!sourceKey) {
    return {
      body: Buffer.alloc(0),
      contentType: '',
      contentLength: '0',
      etag: ''
    }
  }

  return readDataCapsuleObjectWithMetaByConfig(config, sourceKey)
}

export async function readDataCapsuleObjectWithMetaByKey(key: string): Promise<DataCapsuleObject> {
  const config = dataCapsuleConfig()
  if (!config) throw new Error('未配置中国科技云数据胶囊 S3 变量')
  return readDataCapsuleObjectWithMetaByConfig(config, joinKey(key))
}

async function readDataCapsuleObjectWithMetaByConfig(config: DataCapsuleConfig, key: string): Promise<DataCapsuleObject> {
  const response = await signedDataCapsuleRequest(config, {
    method: 'GET',
    key,
    payloadHashMode: 'empty'
  })

  if (!response.ok) {
    const retryResponse = await signedDataCapsuleRequest(config, {
      method: 'GET',
      key,
      payloadHashMode: 'unsigned'
    })

    if (!retryResponse.ok) {
      const message = await retryResponse.text().catch(() => '')
      throw new Error(`数据胶囊文件读取失败：${retryResponse.status} ${message || retryResponse.statusText}`)
    }

    return {
      body: Buffer.from(await retryResponse.arrayBuffer()),
      contentType: retryResponse.headers.get('content-type') || '',
      contentLength: retryResponse.headers.get('content-length') || '',
      etag: retryResponse.headers.get('etag') || ''
    }
  }

  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || '',
    contentLength: response.headers.get('content-length') || '',
    etag: response.headers.get('etag') || ''
  }
}

export async function renameDataCapsuleObject(sourceUrl: string | undefined, targetKey: string) {
  const config = dataCapsuleConfig()
  if (!config) throw new Error('未配置中国科技云数据胶囊 S3 上传变量')

  const sourceKey = dataCapsuleKeyFromUrl(config, sourceUrl)
  const nextKey = joinKey(targetKey)
  if (!sourceKey || !nextKey) return sourceUrl || ''
  if (sourceKey === nextKey) return publicObjectUrl(bucketBaseUrl(config, config.bucket), nextKey)

  const response = await signedDataCapsuleRequest(config, {
    method: 'PUT',
    key: nextKey,
    headers: {
      'x-amz-copy-source': `/${config.bucket}/${encodeKeyPath(sourceKey)}`
    }
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(`数据胶囊文件重命名失败：${response.status} ${message || response.statusText}`)
  }

  await deleteDataCapsuleObject(sourceUrl)

  return publicObjectUrl(bucketBaseUrl(config, config.bucket), nextKey)
}

export async function copyDataCapsuleObject(sourceUrl: string | undefined, targetKey: string) {
  const config = dataCapsuleConfig()
  if (!config) throw new Error('未配置中国科技云数据胶囊 S3 变量')

  const sourceKey = dataCapsuleKeyFromUrl(config, sourceUrl)
  const nextKey = joinKey(targetKey)
  if (!sourceKey || !nextKey) return sourceUrl || ''
  if (sourceKey === nextKey) return publicObjectUrl(bucketBaseUrl(config, config.bucket), nextKey)

  const response = await signedDataCapsuleRequest(config, {
    method: 'PUT',
    key: nextKey,
    headers: {
      'x-amz-copy-source': `/${config.bucket}/${encodeKeyPath(sourceKey)}`
    }
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(`数据胶囊文件复制失败：${response.status} ${message || response.statusText}`)
  }

  return publicObjectUrl(bucketBaseUrl(config, config.bucket), nextKey)
}

export async function deleteDataCapsuleObject(sourceUrl: string | undefined) {
  const config = dataCapsuleConfig()
  if (!config) throw new Error('未配置中国科技云数据胶囊 S3 上传变量')

  const sourceKey = dataCapsuleKeyFromUrl(config, sourceUrl)
  if (!sourceKey) return

  const response = await signedDataCapsuleRequest(config, {
    method: 'DELETE',
    key: sourceKey
  })

  if (!response.ok && response.status !== 404) {
    const message = await response.text().catch(() => '')
    throw new Error(`数据胶囊文件删除失败：${response.status} ${message || response.statusText}`)
  }
}

export async function listDataCapsuleFolders() {
  const config = dataCapsuleConfig()
  if (!config) throw new Error('未配置中国科技云数据胶囊 S3 上传变量')

  const folders = new Set<string>()
  let continuationToken = ''

  do {
    const query: Record<string, string> = {
      'max-keys': '1000',
      prefix: ''
    }
    if (continuationToken) query.marker = continuationToken

    const response = await listDataCapsulePage(config, query)

    if (!response.ok) {
      const message = await response.text().catch(() => '')
      throw new Error(`数据胶囊目录读取失败：${response.status} ${message || response.statusText} ${JSON.stringify(dataCapsuleCredentialDebug(config))}`)
    }

    const xmlText = await response.text()
    for (const match of xmlText.matchAll(/<Prefix>([^<]+)<\/Prefix>/g)) {
      const folder = decodeXmlText(match[1] || '').replace(/\/+$/g, '')
      if (folder) folders.add(folder)
    }

    for (const match of xmlText.matchAll(/<Key>([^<]+)<\/Key>/g)) {
      const key = decodeXmlText(match[1] || '')
      if (key.endsWith('/')) {
        const folder = key.replace(/\/+$/g, '')
        if (folder) folders.add(folder)
        continue
      }

      const parts = key.split('/').filter(Boolean)
      parts.pop()

      for (let index = 0; index < parts.length; index += 1) {
        folders.add(parts.slice(0, index + 1).join('/'))
      }
    }

    continuationToken = decodeXmlText(xmlText.match(/<NextMarker>([^<]+)<\/NextMarker>/)?.[1] || '')
  } while (continuationToken)

  return [...folders].sort((a, b) => a.localeCompare(b, 'zh-CN'))
}
