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

async function readTextContent(path: string) {
  return readFile(publicContentPath(path), 'utf8')
}

export async function readStaticManagedRecords(): Promise<AdminManagedRecord[]> {
  const source = await readTextContent(contentRecordsPath())
  const records = (JSON.parse(source || '[]') as AdminManagedRecord[]).map(normalizeRecordForRead)

  return Promise.all(records.map(async (record) => {
    const managedRecord: AdminManagedRecord = { ...record }
    if (adminRecordNeedsMarkdown(record.type)) {
      try {
        managedRecord.content = await readTextContent(record.contentUrl || contentMarkdownPath(record))
      } catch {
        managedRecord.content = ''
      }
    }
    return managedRecord
  }))
}
