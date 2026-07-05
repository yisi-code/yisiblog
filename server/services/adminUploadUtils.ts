import { extname } from 'node:path'

function stripControlCharacters(value: string) {
  return Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code > 31 && code !== 127
    })
    .join('')
}

export function safeUploadFileName(fileName: string, fallbackName: string) {
  const cleanName = stripControlCharacters(fileName)
    .replace(/[\\/]/g, '-')
    .trim()

  return cleanName || fallbackName
}

export function safeUploadBaseName(baseName: string | undefined, fallbackName: string) {
  const cleanName = stripControlCharacters(String(baseName || ''))
    .replace(/[\\/]/g, '-')
    .trim()

  return cleanName || fallbackName
}

export function assertAllowedExtension(fileName: string, allowedExtensions: string[], message: string) {
  const extension = extname(fileName).toLowerCase()

  if (!allowedExtensions.includes(extension)) {
    throw createError({ statusCode: 400, statusMessage: message })
  }

  return extension
}

export function safeUploadFolder(folder: string | undefined, fallbackFolder: string) {
  const cleanFolder = String(folder || '')
    .split(/[\\/]+/)
    .map((part) => stripControlCharacters(part).trim())
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/')

  return cleanFolder || fallbackFolder
}
