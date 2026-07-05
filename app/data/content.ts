import {
    compareRecordsByLatest,
    findRecordBySlug,
    recordMatchesSlug,
    recordSlugText,
    recordsByType,
    useRecordsData,
    type DataRecordType,
    type NormalizedDataRecord
} from '~/data/records'
import {formatDisplayDate} from '~/utils/dateFormat'

type ContentBodyNode = string | number | boolean | null | undefined | {
    type?: string
    value?: string
    children?: ContentBodyNode[]
} | ContentBodyNode[]

export type ContentItem = {
    id?: string
    type?: DataRecordType
    path?: string
    stem?: string
    title?: string
    description?: string
    date?: string
    cover?: string
    tags?: string[]
    contentFile?: string
    contentUrl?: string
    mood?: string
    location?: string
    images?: string[]
    body?: {
        type?: string
        children?: ContentBodyNode[]
        value?: ContentBodyNode[]
        toc?: {
            links?: {
                id?: string
                text?: string
                depth?: number
                children?: {
                    id?: string
                    text?: string
                    depth?: number
                }[]
            }[]
        }
    }
}

export type SiteContentItem = ContentItem & {
    path: string
    tags: string[]
}

function mergeRecordContent(record: NormalizedDataRecord, item?: ContentItem | null): SiteContentItem {
    return {
        ...record,
        body: item?.body,
        description: record.description || '',
        cover: record.cover,
        date: formatDisplayDate(record.date),
        tags: Array.isArray(record.tags) ? record.tags : []
    }
}

function contentPath(record: NormalizedDataRecord) {
    return record.contentFile ? `/${record.contentFile}` : ''
}

function sortedRecords(records: NormalizedDataRecord[], type: DataRecordType) {
    return recordsByType(records, type)
        .filter((record) => Boolean(record.contentFile))
        .sort(compareRecordsByLatest)
}

async function loadRecordContent(record: NormalizedDataRecord) {
    if (record.contentUrl) {
        const data = await $fetch<ContentItem>('/api/content/remote', {
            query: {
                url: record.contentUrl,
                path: record.path
            }
        })
        return mergeRecordContent(record, data)
    }

    const path = contentPath(record)
    if (!path) return mergeRecordContent(record)
    const collection = record.type === 'about' ? 'about' : `${record.type}s` as 'posts' | 'chatters' | 'moments'
    const data = await queryCollection(collection)
        .where('stem', '=', record.contentFile)
        .first()
    return mergeRecordContent(record, data as ContentItem | null)
}

async function loadContentRecords(type: DataRecordType, key: string) {
    const records = await useRecordsData(`${key}-records`)
    const {data} = await useAsyncData(key, () => Promise.all(sortedRecords(records.value, type).map(loadRecordContent)))
    return computed(() => data.value || [])
}

function contentDataKey(type: DataRecordType, slug: string | string[]) {
    return `${type}-${recordSlugText(slug)}`
}

async function loadContentRecordBySlug(type: DataRecordType, slug: string | string[]) {
    const records = await useRecordsData(`${contentDataKey(type, slug)}-records`)
    return useAsyncData(contentDataKey(type, slug), async () => {
        const record = findRecordBySlug(records.value, type, slug)
        if (!record) return null
        return loadRecordContent(record)
    })
}

async function loadRecentContentRecords(type: DataRecordType, currentSlug: string | string[], limit = 3) {
    const slugText = recordSlugText(currentSlug)
    const records = await useRecordsData(`recent-${type}-${slugText}-records`)
    const {data} = await useAsyncData(`recent-${type}-${slugText}`, () => Promise.all(
        sortedRecords(records.value, type)
            .filter((item) => !recordMatchesSlug(item, currentSlug))
            .slice(0, limit)
            .map(loadRecordContent)
    ))
    return computed(() => data.value || [])
}

export function collectContentText(nodes: ContentBodyNode[] = []): string[] {
    return nodes.flatMap((node) => {
        if (typeof node === 'string') return [node]
        if (typeof node === 'number' || typeof node === 'boolean') return [String(node)]
        if (!node) return []
        if (Array.isArray(node)) return collectContentText(node.slice(2))

        const current = typeof node.value === 'string' ? [node.value] : []
        return [...current, ...collectContentText(node.children || [])]
    })
}

function collectInlineContentText(node: ContentBodyNode): string {
    if (typeof node === 'string') return node
    if (typeof node === 'number' || typeof node === 'boolean') return String(node)
    if (!node) return ''
    if (Array.isArray(node)) {
        const type = typeof node[0] === 'string' ? node[0] : ''
        const attrs = typeof node[1] === 'object' && !Array.isArray(node[1]) ? node[1] as Record<string, unknown> : {}
        const blankLineCount = Number(attrs.dataBlankLines || attrs['data-blank-lines'])
        if (type === 'span' && Number.isFinite(blankLineCount) && blankLineCount > 0) {
            return '\n'.repeat(blankLineCount)
        }

        if (type === 'br') return '\n'
        return node.slice(2).map(collectInlineContentText).join('')
    }

    const current = typeof node.value === 'string' ? node.value : ''
    return `${current}${(node.children || []).map(collectInlineContentText).join('')}`
}

function compressExtraLineBreaks(text: string) {
  return text.replace(/\n{3,}/g, '\n\n')
}

function collectContentTextBlocks(nodes: ContentBodyNode[] = []): string[] {
    return nodes.flatMap((node) => {
        if (!node) return []
        if (Array.isArray(node)) {
            const type = typeof node[0] === 'string' ? node[0] : ''
            if (type === 'ul' || type === 'ol' || type === 'blockquote') {
                return collectContentTextBlocks(node.slice(2))
            }
            if (type === 'span') {
                const blankLines = collectInlineContentText(node)
                return blankLines ? [blankLines] : []
            }

            const text = collectInlineContentText(node).trim()
            return text ? [text] : []
        }

        const text = collectInlineContentText(node).trim()
        return text ? [text] : []
    })
}

export function extractContentText(item: ContentItem, options: { preserveLineBreaks?: boolean } = {}) {
  const bodyNodes = item.body?.value || item.body?.children
  if (options.preserveLineBreaks) {
    return compressExtraLineBreaks(collectContentTextBlocks(bodyNodes)
      .join('\n')
      .replace(/[^\S\r\n]+/g, ' ')
      .trim())
  }

    return collectContentText(bodyNodes)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export async function usePostsData(key = 'posts-data') {
    return loadContentRecords('post', key)
}

export async function useChattersData(key = 'chatters-data') {
    return loadContentRecords('chatter', key)
}

export async function useMomentsData(key = 'moments-data') {
    return loadContentRecords('moment', key)
}

export async function usePostData(slug: string | string[]) {
    return loadContentRecordBySlug('post', slug)
}

export async function useRecentPosts(currentSlug: string | string[], limit = 3) {
    return loadRecentContentRecords('post', currentSlug, limit)
}

export async function useChatterData(slug: string | string[]) {
    return loadContentRecordBySlug('chatter', slug)
}

export async function useRecentChatters(currentSlug: string | string[], limit = 3) {
    return loadRecentContentRecords('chatter', currentSlug, limit)
}

export async function useAboutPage() {
    const records = await useRecordsData('about-records')
    return useAsyncData('about-page', async () => {
        const record = findRecordBySlug(records.value, 'about', 'about')
        if (!record) return null
        return loadRecordContent(record)
    })
}
