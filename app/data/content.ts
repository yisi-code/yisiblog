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
import type { MDCRoot } from '@nuxtjs/mdc'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { fetchPublicContentText } from './contentAssets'

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
    bodyRaw?: string
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
    mood?: string
    location?: string
    images?: string[]
    body?: MDCRoot & {
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
    const body = item?.body
        ? {
            ...item.body,
            toc: item.body.toc || item.toc
        }
        : undefined

    return {
        ...record,
        title: record.title || item?.title,
        body,
        bodyRaw: item?.bodyRaw,
        description: record.description || item?.description || '',
        cover: record.cover,
        date: formatDisplayDate(record.date),
        tags: Array.isArray(record.tags) ? record.tags : []
    }
}

function recordsAsHomeContentItems(records: NormalizedDataRecord[], type: DataRecordType): SiteContentItem[] {
    return recordsByType(records, type)
        .sort(compareRecordsByLatest)
        .map((record) => mergeRecordContent(record))
}

async function loadRecordContent(record: NormalizedDataRecord) {
    if (!record.contentUrl) return mergeRecordContent(record)

    if (record.contentUrl.startsWith('/content-data/')) {
        try {
            const markdown = await fetchPublicContentText(record.contentUrl)
            const parsed = await parseMarkdown(markdown)
            return mergeRecordContent(record, {
                path: record.path,
                body: parsed.body,
                bodyRaw: markdown,
                title: parsed.data?.title,
                description: parsed.data?.description,
                toc: parsed.toc
            })
        } catch (error) {
            console.warn('[content] Markdown 读取失败', record.contentUrl, error instanceof Error ? error.message : error)
            return mergeRecordContent(record)
        }
    }

    throw createError({ statusCode: 400, statusMessage: 'contentUrl 必须指向 /content-data/ 静态 Markdown' })
}

async function loadContentRecords(type: DataRecordType, key: string) {
    const {data, pending, status} = await useAsyncData(key, async () => {
        const records = await fetchNormalizedRecords()
        return recordsAsHomeContentItems(records, type)
    }, {
        default: () => []
    })
    return {
        items: computed(() => data.value || []),
        pending,
        status
    }
}

function contentDataKey(type: DataRecordType, slug: string | string[]) {
    return `${type}-${recordSlugText(slug)}`
}

async function loadContentRecordBySlug(type: DataRecordType, slug: string | string[]) {
    return await useAsyncData(contentDataKey(type, slug), async () => {
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
            posts: recordsAsHomeContentItems(records, 'post'),
            chatters: recordsAsHomeContentItems(records, 'chatter'),
            moments: recordsAsHomeContentItems(records, 'moment'),
            albums: albumsFromRecords(records),
            friends: friendsFromRecords(records),
            projects: projectsFromRecords(records),
            songs: songsFromRecords(records)
        }
    }, {
        default: emptyHomePageData
    })
}

async function loadRecentContentRecords(type: DataRecordType, currentSlug: string | string[], limit = 3) {
    const slugText = recordSlugText(currentSlug)
    const {data, pending, status} = await useAsyncData(`recent-${type}-${slugText}`, async () => {
        const records = await fetchNormalizedRecords()
        return recordsByType(records, type)
            .sort(compareRecordsByLatest)
            .filter((item) => !recordMatchesSlug(item, currentSlug))
            .slice(0, limit)
            .map((record) => mergeRecordContent(record))
    }, {
        default: () => []
    })
    return {
        items: computed(() => data.value || []),
        pending,
        status
    }
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

function plainMarkdownText(markdown = '', options: { preserveLineBreaks?: boolean } = {}) {
  const text = markdown
      .replace(/^---[\s\S]*?---\s*/m, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^[\s-]*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/[*_~]/g, '')
      .trim()

  if (options.preserveLineBreaks) {
    return compressExtraLineBreaks(text.replace(/[^\S\r\n]+/g, ' '))
  }

  return text.replace(/\s+/g, ' ')
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
    const text = compressExtraLineBreaks(collectContentTextBlocks(bodyNodes)
      .join('\n')
      .replace(/[^\S\r\n]+/g, ' ')
      .trim())
    return text || plainMarkdownText(item.bodyRaw, options)
  }

    const text = collectContentText(bodyNodes)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    return text || plainMarkdownText(item.bodyRaw, options)
}

export async function usePostsData(key = 'posts-data') {
    return await loadContentRecords('post', key)
}

export async function useChattersData(key = 'chatters-data') {
    return await loadContentRecords('chatter', key)
}

export async function useMomentsData(key = 'moments-data') {
    return await loadContentRecords('moment', key)
}

export async function usePostData(slug: string | string[]) {
    return await loadContentRecordBySlug('post', slug)
}

export async function useRecentPosts(currentSlug: string | string[], limit = 3) {
    return await loadRecentContentRecords('post', currentSlug, limit)
}

export async function useChatterData(slug: string | string[]) {
    return await loadContentRecordBySlug('chatter', slug)
}

export async function useRecentChatters(currentSlug: string | string[], limit = 3) {
    return await loadRecentContentRecords('chatter', currentSlug, limit)
}

export async function useAboutPage() {
    return await useAsyncData('about-page', async () => {
        const records = await fetchNormalizedRecords()
        const record = findRecordBySlug(records, 'about', 'about')
        if (!record) return null
        return loadRecordContent(record)
    })
}
