import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { normalize, resolve, sep } from 'node:path'
import {
    contentMarkdownPath,
    contentRecordsPath
} from '~~/shared/contentDataPaths'
import {
    adminRecordNeedsMarkdown,
    type AdminRecordType,
    type AdminManagedRecord
} from '~~/shared/adminData'
import {normalizeRecordForRead} from './adminContentCore'
import type { H3Event } from 'h3'

const publicContentDataPrefix = '/content-data/'

function cleanStaticContentPath(path: string) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    if (!cleanPath.startsWith(publicContentDataPrefix)) {
        throw createError({ statusCode: 400, message: '静态内容路径必须位于 /content-data/' })
    }

    return cleanPath
}

function decodeStaticContentPath(path: string) {
    return cleanStaticContentPath(path)
        .split('/')
        .map((part, index) => {
            if (index === 0) return ''
            try {
                return decodeURIComponent(part)
            } catch {
                return part
            }
        })
        .join('/')
}

function staticContentFileCandidates(path: string) {
    const cleanPath = decodeStaticContentPath(path).replace(/^\/+/, '')
    return [
        resolve(process.cwd(), 'public', cleanPath),
        resolve(process.cwd(), '.output', 'public', cleanPath)
    ]
}

function assertStaticContentFilePath(filePath: string) {
    const normalizedFilePath = normalize(filePath)
    const allowedRoots = [
        resolve(process.cwd(), 'public', 'content-data'),
        resolve(process.cwd(), '.output', 'public', 'content-data')
    ].map((root) => normalize(root))

    if (!allowedRoots.some((root) => normalizedFilePath === root || normalizedFilePath.startsWith(`${root}${sep}`))) {
        throw createError({ statusCode: 400, message: '静态内容路径无效' })
    }
}

async function readStaticTextContentFromFile(path: string) {
    for (const filePath of staticContentFileCandidates(path)) {
        assertStaticContentFilePath(filePath)
        if (existsSync(filePath)) return await readFile(filePath, 'utf8')
    }

    return null
}

function requestOrigin(event?: H3Event) {
    try {
        const origin = event ? getRequestURL(event).origin : useRequestURL().origin
        return origin && origin !== 'null' ? origin.replace(/\/+$/, '') : ''
    } catch {
        return ''
    }
}

function configuredSiteOrigin(event?: H3Event) {
    const siteUrl = useRuntimeConfig(event).public.siteUrl
    if (typeof siteUrl === 'string' && siteUrl) return siteUrl.replace(/\/+$/, '')

    const vercelUrl = process.env.VERCEL_URL
    if (vercelUrl) return `https://${vercelUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`

    return ''
}

function staticContentOrigins(event?: H3Event) {
    return [...new Set([
        configuredSiteOrigin(event),
        requestOrigin(event)
    ].filter(Boolean))]
}

function encodeStaticContentPath(path: string) {
    return cleanStaticContentPath(path)
        .split('/')
        .map((part, index) => index === 0 ? '' : encodeURIComponent(part))
        .join('/')
}

export async function readStaticTextContent(path: string, event?: H3Event) {
    const fileContent = await readStaticTextContentFromFile(path)
    if (fileContent !== null) return fileContent

    let lastError: unknown
    for (const origin of staticContentOrigins(event)) {
        try {
            return await $fetch<string>(`${origin}${encodeStaticContentPath(path)}`, {responseType: 'text'})
        } catch (error) {
            lastError = error
        }
    }

    if (lastError) throw lastError
    throw createError({ statusCode: 404, message: '静态内容文件不存在' })
}

export async function readStaticRecords() {
    try {
        const source = await readStaticTextContent(contentRecordsPath())
        return (JSON.parse(source || '[]') as AdminManagedRecord[]).map(normalizeRecordForRead)
    } catch (error) {
        console.warn('[static-content] records.json 读取失败', error instanceof Error ? error.message : error)
        throw createError({ statusCode: 503, message: 'records.json 读取失败' })
    }
}

export async function readStaticRecordsForEvent(event: H3Event) {
    try {
        const source = await readStaticTextContent(contentRecordsPath(), event)
        return (JSON.parse(source || '[]') as AdminManagedRecord[]).map(normalizeRecordForRead)
    } catch (error) {
        console.warn('[static-content] records.json 读取失败', error instanceof Error ? error.message : error)
        throw createError({ statusCode: 503, message: 'records.json 读取失败' })
    }
}

export async function readStaticManagedRecords(): Promise<AdminManagedRecord[]> {
    const records = await readStaticRecords()

    return records.map((record) => ({...record}))
}

export async function readStaticManagedRecordsForEvent(event: H3Event): Promise<AdminManagedRecord[]> {
    const records = await readStaticRecordsForEvent(event)

    return records.map((record) => ({...record}))
}

export async function readStaticManagedRecordDetail(type: AdminRecordType, id: string, event?: H3Event): Promise<AdminManagedRecord | null> {
    const records = event ? await readStaticRecordsForEvent(event) : await readStaticRecords()
    const record = records.find((item) => item.type === type && item.id === id)
    if (!record) return null

    const managedRecord: AdminManagedRecord = {...record}
    if (adminRecordNeedsMarkdown(record.type)) {
        try {
            managedRecord.content = await readStaticTextContent(record.contentUrl || contentMarkdownPath(record), event)
        } catch {
            managedRecord.content = ''
        }
    }
    if (record.type === 'music' && record.lrcUrl) {
        try {
            managedRecord.lrc = await readStaticTextContent(record.lrcUrl, event)
        } catch {
            managedRecord.lrc = ''
        }
    }

    return managedRecord
}
