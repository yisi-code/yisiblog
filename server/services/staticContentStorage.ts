import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {useStorage} from 'nitropack/runtime'
import {
    contentDataPublicBase,
    contentMarkdownPath,
    contentRecordsPath
} from '~~/shared/contentDataPaths'
import {
    adminRecordNeedsMarkdown,
    type AdminManagedRecord
} from '~~/shared/adminData'
import {normalizeRecordForRead} from './adminContentCore'

function publicContentPath(path: string) {
    const relativePath = path
        .replace(/^\/+/, '')
        .replace(new RegExp(`^${contentDataPublicBase.replace(/^\/+/, '')}/?`), '')
    return join(process.cwd(), 'public', 'content-data', relativePath)
}

function isFileNotFound(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}

function relativeContentPath(path: string) {
    return path
        .replace(/^\/+/, '')
        .replace(new RegExp(`^${contentDataPublicBase.replace(/^\/+/, '')}/?`), '')
}

export async function readStaticTextContent(path: string) {
    const relativePath = relativeContentPath(path)
    const storageContent = await useStorage('public').getItem(`content-data/${relativePath}`)
    if (typeof storageContent === 'string') return storageContent
    if (storageContent instanceof Uint8Array) return Buffer.from(storageContent).toString('utf8')
    if (storageContent !== null && storageContent !== undefined) return String(storageContent)

    try {
        return await readFile(publicContentPath(path), 'utf8')
    } catch (error) {
        if (!isFileNotFound(error)) throw error
        throw error
    }
}

export async function readStaticRecords() {
    try {
        const source = await readStaticTextContent(contentRecordsPath())
        return (JSON.parse(source || '[]') as AdminManagedRecord[]).map(normalizeRecordForRead)
    } catch (error) {
        // 如果文件不存在，返回空数组
        if (isFileNotFound(error)) {
            return []
        }
        throw error
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
        return managedRecord
    }))
}
