import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
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

// 获取当前文件的绝对路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 从 server/services/ 向上两级到达项目根目录
const PROJECT_ROOT = join(__dirname, '../..')

function publicContentPath(path: string) {
  const relativePath = path
      .replace(/^\/+/, '')
      .replace(new RegExp(`^${contentDataPublicBase.replace(/^\/+/, '')}/?`), '')
  // 使用项目根目录，而非 process.cwd()
  return join(PROJECT_ROOT, 'public', 'content-data', relativePath)
}

export async function readStaticTextContent(path: string) {
  return readFile(publicContentPath(path), 'utf8')
}

export async function readStaticRecords() {
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
