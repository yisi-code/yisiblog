import {
    compareRecordsByLatest,
    albumsFromRecords,
    fetchNormalizedRecords,
    findRecordBySlug,
    friendsFromRecords,
    projectsFromRecords,
    recordMatchesSlug,
    recordSlugText,
    recordsByType,
    songsFromRecords,
    type DataRecordType,
    type NormalizedDataRecord
} from '~/data/records'
import {formatDisplayDate} from '~/utils/dateFormat'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

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

export type HomePageData = {
    posts: SiteContentItem[]
    chatters: SiteContentItem[]
    moments: SiteContentItem[]
    albums: ReturnType<typeof albumsFromRecords>
    friends: ReturnType<typeof friendsFromRecords>
    projects: ReturnType<typeof projectsFromRecords>
    songs: ReturnType<typeof songsFromRecords>
}

const emptyHomePageData = (): HomePageData => ({
    posts: [],
    chatters: [],
    moments: [],
    albums: [],
    friends: [],
    projects: [],
    songs: []
})

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

function sortedRecords(records: NormalizedDataRecord[], type: DataRecordType) {
    return recordsByType(records, type)
        .filter((record) => Boolean(record.contentUrl))
        .sort(compareRecordsByLatest)
}

function recordsAsContentItems(records: NormalizedDataRecord[], type: DataRecordType): SiteContentItem[] {
    return sortedRecords(records, type).map((record) => mergeRecordContent(record))
}

async function loadRecordContent(record: NormalizedDataRecord) {
    if (!record.contentUrl) return mergeRecordContent(record)

    if (record.contentUrl.startsWith('/content-data/')) {
        const markdown = await $fetch<string>(record.contentUrl)
        const parsed = await parseMarkdown(markdown)
        return mergeRecordContent(record, {
            path: record.path,
            body: parsed.body,
            title: parsed.data?.title,
            description: parsed.data?.description
        })
    }

    const data = await $fetch<ContentItem>('/api/content/remote', {
        query: {
            url: record.contentUrl,
            path: record.path
        }
    })
    return mergeRecordContent(record, data)
}

function loadContentRecords(type: DataRecordType, key: string) {
    const {data} = useAsyncData(key, async () => {
        const records = await fetchNormalizedRecords()
        return Promise.all(sortedRecords(records, type).map(loadRecordContent))
    }, {
        default: () => []
    })
    return computed(() => data.value || [])
}

function contentDataKey(type: DataRecordType, slug: string | string[]) {
    return `${type}-${recordSlugText(slug)}`
}

function loadContentRecordBySlug(type: DataRecordType, slug: string | string[]) {
    return useAsyncData(contentDataKey(type, slug), async () => {
        const records = await fetchNormalizedRecords()
        const record = findRecordBySlug(records, type, slug)
        if (!record) return null
        return loadRecordContent(record)
    })
}

export function useHomePageData() {
    return useAsyncData('home-page-data', async () => {
        const records = await fetchNormalizedRecords()

        return {
            posts: recordsAsContentItems(records, 'post'),
            chatters: recordsAsContentItems(records, 'chatter'),
            moments: recordsAsContentItems(records, 'moment'),
            albums: albumsFromRecords(records),
            friends: friendsFromRecords(records),
            projects: projectsFromRecords(records),
            songs: songsFromRecords(records)
        }
    }, {
        default: emptyHomePageData
    })
}

function loadRecentContentRecords(type: DataRecordType, currentSlug: string | string[], limit = 3) {
    const slugText = recordSlugText(currentSlug)
    const {data} = useAsyncData(`recent-${type}-${slugText}`, async () => {
        const records = await fetchNormalizedRecords()
        return Promise.all(sortedRecords(records, type)
            .filter((item) => !recordMatchesSlug(item, currentSlug))
            .slice(0, limit)
            .map(loadRecordContent))
    }, {
        default: () => []
    })
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

export function usePostsData(key = 'posts-data') {
    return loadContentRecords('post', key)
}

export function useChattersData(key = 'chatters-data') {
    return loadContentRecords('chatter', key)
}

export function useMomentsData(key = 'moments-data') {
    return loadContentRecords('moment', key)
}

export function usePostData(slug: string | string[]) {
    return loadContentRecordBySlug('post', slug)
}

export function useRecentPosts(currentSlug: string | string[], limit = 3) {
    return loadRecentContentRecords('post', currentSlug, limit)
}

export function useChatterData(slug: string | string[]) {
    return loadContentRecordBySlug('chatter', slug)
}

export function useRecentChatters(currentSlug: string | string[], limit = 3) {
    return loadRecentContentRecords('chatter', currentSlug, limit)
}

export function useAboutPage() {
    return useAsyncData('about-page', async () => {
        const records = await fetchNormalizedRecords()
        const record = findRecordBySlug(records, 'about', 'about')
        if (!record) return null
        return loadRecordContent(record)
    })
}
