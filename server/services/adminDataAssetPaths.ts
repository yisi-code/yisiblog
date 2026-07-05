import type { AdminDataRecord, AdminPhoto, AdminRecordType } from '~~/shared/adminData'

export const adminDataFolderByType: Record<AdminRecordType, string> = {
  post: '博文',
  chatter: '杂谈',
  moment: '动态',
  about: '关于',
  music: '音乐',
  friend: '友链',
  album: '相册',
  project: '项目'
}

export function safeDataCapsulePathPart(value: string | undefined, fallback: string) {
  const clean = Array.from(String(value || ''))
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code > 31 && code !== 127
    })
    .join('')
    .replace(/[<>:"/\\|?*#%&{}^~[\]`]/g, '_')
    .trim()

  return clean || fallback
}

export function dataCapsuleRecordFolder(record: Pick<AdminDataRecord, 'id' | 'type'>) {
  return `${adminDataFolderByType[record.type]}/${safeDataCapsulePathPart(record.id, 'record')}`
}

export function dataCapsuleRecordFileBase(record: Pick<AdminDataRecord, 'id'>, suffix?: string | number) {
  const idPart = safeDataCapsulePathPart(record.id, 'record')
  if (!suffix) return idPart
  return `${idPart}-${safeDataCapsulePathPart(String(suffix), String(suffix))}`
}

export function dataCapsuleMarkdownBaseName(record: Pick<AdminDataRecord, 'id'>) {
  return dataCapsuleRecordFileBase(record)
}

export function dataCapsuleCoverBaseName(record: Pick<AdminDataRecord, 'id'>) {
  return dataCapsuleRecordFileBase(record)
}

export function dataCapsuleMusicBaseName(record: Pick<AdminDataRecord, 'id'>) {
  return dataCapsuleRecordFileBase(record)
}

export function dataCapsuleLyricBaseName(record: Pick<AdminDataRecord, 'id'>) {
  return dataCapsuleRecordFileBase(record)
}

export function dataCapsuleImageBaseName(record: Pick<AdminDataRecord, 'id'>, index: number) {
  return dataCapsuleRecordFileBase(record, index + 1)
}

export function dataCapsulePhotoBaseName(record: Pick<AdminDataRecord, 'id'>, photo: Pick<AdminPhoto, 'caption'>, index: number) {
  return dataCapsuleRecordFileBase(record, photo.caption?.trim() || index + 1)
}
