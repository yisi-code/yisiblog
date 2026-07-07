import {
    contentMarkdownPath,
    contentRecordsPath
} from '~~/shared/contentDataPaths'
import {
    adminRecordNeedsMarkdown,
    type AdminManagedRecord
} from '~~/shared/adminData'
import {normalizeRecordForRead} from './adminContentCore'
import {fetchPublicContentText} from '~~/app/data/contentAssets'

export async function readStaticTextContent(path: string) {
    return await fetchPublicContentText(path)
}

export async function readStaticRecords() {
    try {
        const source = await readStaticTextContent(contentRecordsPath())
        return (JSON.parse(source || '[]') as AdminManagedRecord[]).map(normalizeRecordForRead)
    } catch (error) {
        console.warn('[static-content] records.json 读取失败', error instanceof Error ? error.message : error)
        return []
    }
}

export async function readStaticManagedRecords(): Promise<AdminManagedRecord[]> {
    const records = await readStaticRecords()

    return Promise.all(records.map(async (record) => {
        const managedRecord: AdminManagedRecord = {...record}
        if (adminRecordNeedsMarkdown(record.type)) {
            try {
                managedRecord.content = await readStaticTextContent(record.contentUrl || contentMarkdownPath(record))
            } catch {
                managedRecord.content = ''
            }
        }
        if (record.type === 'music' && record.lrcUrl) {
            try {
                managedRecord.lrc = await readStaticTextContent(record.lrcUrl)
            } catch {
                managedRecord.lrc = ''
            }
        }
        return managedRecord
    }))
}
