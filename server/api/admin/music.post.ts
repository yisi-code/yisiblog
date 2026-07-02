import { mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { assertAdminSession } from '#server/services/adminAuth'

const musicRootPath = resolve(process.cwd(), 'public/music')
const allowedExtensions = ['.mp3', '.m4a', '.ogg', '.wav', '.flac']

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
  const file = form?.find((item) => item.name === 'file')

  if (!file?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: '请选择要上传的音乐文件' })
  }

  const sourceName = safeFileName(file.filename || '', `music-${Date.now()}`)
  const extension = extname(sourceName).toLowerCase()

  if (!allowedExtensions.includes(extension)) {
    throw createError({ statusCode: 400, statusMessage: '音乐文件格式不支持' })
  }

  const fileName = safeFileName(sourceName, `music-${Date.now()}${extension}`)
  const filePath = resolve(musicRootPath, fileName)

  if (!filePath.startsWith(musicRootPath)) {
    throw createError({ statusCode: 400, statusMessage: '音乐文件路径无效' })
  }

  await mkdir(musicRootPath, { recursive: true })
  await writeFile(filePath, file.data)

  return {
    fileName,
    path: `/music/${fileName}`,
    size: file.data.length,
    mimeType: file.type
  }
})
