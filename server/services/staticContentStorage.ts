import { useStorage } from 'nitropack/runtime' // [reference:7]
import {
  contentDataPublicBase,
  contentMarkdownPath,
  contentRecordsPath
} from '~~/shared/contentDataPaths'
import {
  adminRecordNeedsMarkdown,
  type AdminManagedRecord
} from '~~/shared/adminData'
import { normalizeRecordForRead } from './adminContentCore'

// 使用 useStorage 来读取 public 目录下的文件
export async function readStaticTextContent(path: string) {
  // 从路径中提取相对于 content-data 的文件名
  const relativePath = path
      .replace(/^\/+/, '')
      .replace(new RegExp(`^${contentDataPublicBase.replace(/^\/+/, '')}/?`), '')

  // 通过 useStorage 读取 public 存储中的文件[reference:8]
  const content = await useStorage('public').getItem(`content-data/${relativePath}`)
  if (content === null || content === undefined) {
    throw new Error(`File not found: content-data/${relativePath}`)
  }
  // 注意：useStorage 返回的是 Buffer 或字符串，可能需要根据情况处理
  return content as string
}

export async function readStaticRecords() {
  // 直接使用重写后的 readStaticTextContent
  const source = await readStaticTextContent(contentRecordsPath())
  return (JSON.parse(source || '[]') as AdminManagedRecord[]).map(normalizeRecordForRead)
}

export async function readStaticManagedRecords(): Promise<AdminManagedRecord[]> {
  const records = await readStaticRecords()

  return Promise.all(records.map(async (record) => {
    const managedRecord: AdminManagedRecord = { ...record }
    if (adminRecordNeedsMarkdown(record.type)) {
      try {
        managedRecord.content = await readStaticTextContent(record.contentUrl || contentMarkdownPath(record))
      } catch {
        managedRecord.content = ''
      }
    }
    return managedRecord
  }))
}
