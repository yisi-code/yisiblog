import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
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

function publicContentPath(path: string) {
  const relativePath = path
    .replace(/^\/+/, '')
    .replace(new RegExp(`^${contentDataPublicBase.replace(/^\/+/, '')}/?`), '')
  return join(process.cwd(), 'public', 'content-data', relativePath)
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
