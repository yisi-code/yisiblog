import { mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { assertAdminSession } from '#server/services/adminAuth'

type MediaKind = 'image' | 'music' | 'lyric'

const rootDir = process.cwd()
const targets: Record<MediaKind, {
  directory: string
  publicBase: string
  extensions: string[]
}> = {
  image: {
    directory: resolve(rootDir, 'public/images'),
    publicBase: '/images',
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']
  },
  music: {
    directory: resolve(rootDir, 'public/music'),
    publicBase: '/music',
    extensions: ['.mp3', '.m4a', '.ogg', '.wav', '.flac']
  },
  lyric: {
    directory: resolve(rootDir, 'content/lyrics'),
    publicBase: '',
    extensions: ['.lrc', '.txt']
  }
}

function safeFileName(fileName: string, fallbackName: string) {
  const cleanName = fileName
    .replace(/[\\/]/g, '-')
    .replace(/[^\p{L}\p{N}._ -]/gu, '')
    .trim()

  return cleanName || fallbackName
}

export default defineEventHandler(async (event) => {
  assertAdminSession(event)

  const form = await readMultipartFormData(event)
  const kindValue = form?.find((item) => item.name === 'kind')?.data.toString('utf8') as MediaKind | undefined
  const file = form?.find((item) => item.name === 'file')

  if (!kindValue || !targets[kindValue]) {
    throw createError({ statusCode: 400, statusMessage: '媒体类型无效' })
  }

  if (!file?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: '请选择要上传的文件' })
  }

  const target = targets[kindValue]
  const sourceName = safeFileName(file.filename || '', `${kindValue}-${Date.now()}`)
  const extension = extname(sourceName).toLowerCase()

  if (!target.extensions.includes(extension)) {
    throw createError({ statusCode: 400, statusMessage: '文件格式不支持' })
  }

  const fileName = safeFileName(sourceName, `${kindValue}-${Date.now()}${extension}`)
  const filePath = resolve(target.directory, fileName)

  if (!filePath.startsWith(target.directory)) {
    throw createError({ statusCode: 400, statusMessage: '文件路径无效' })
  }

  await mkdir(target.directory, { recursive: true })
  await writeFile(filePath, file.data)

  return {
    fileName,
    path: kindValue === 'lyric' ? `content/lyrics/${fileName}` : `${target.publicBase}/${fileName}`,
    text: kindValue === 'lyric' ? file.data.toString('utf8') : undefined
  }
})
