import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { readStaticRecordsForEvent, readStaticTextContent } from '#server/services/staticContentStorage'
import type { H3Event } from 'h3'

async function allowedStaticContentUrls(event: H3Event) {
  const records = await readStaticRecordsForEvent(event)
  return new Set(records
    .map((record) => record.contentUrl)
    .filter((url): url is string => Boolean(url?.startsWith('/content-data/'))))
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = String(query.url || '')
  const path = String(query.path || '')

  if (!url || !(await allowedStaticContentUrls(event)).has(url)) {
    throw createError({ statusCode: 404, statusMessage: '内容不存在' })
  }

  let markdown: string
  try {
    markdown = await readStaticTextContent(url, event)
  } catch (error) {
    console.warn('[content:static] 静态 Markdown 读取失败：', error instanceof Error ? error.message : error)
    throw createError({
      statusCode: 503,
      statusMessage: '内容读取失败，请稍后重试'
    })
  }

  const parsed = await parseMarkdown(markdown)

  return {
    path,
    body: parsed.body,
    bodyRaw: markdown,
    title: parsed.data?.title,
    description: parsed.data?.description,
    toc: parsed.toc
  }
})
