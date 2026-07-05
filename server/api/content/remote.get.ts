import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { readDataCapsuleObject } from '#server/services/dataCapsuleStorage'
import { readDataCapsuleRecords } from '#server/services/adminRecordsDataCapsule'

async function allowedContentUrls() {
  const records = await readDataCapsuleRecords()
  return new Set(records
    .map((record) => record.contentUrl)
    .filter((url): url is string => Boolean(url)))
}

function addImageAttrs(nodes: unknown) {
  if (!nodes || typeof nodes !== 'object') return

  const node = nodes as {
    tag?: string
    props?: Record<string, unknown>
    children?: unknown[]
  }

  if (node.tag === 'img') {
    node.props ||= {}
    node.props.referrerpolicy ??= 'no-referrer'
    node.props.loading ??= 'lazy'
    node.props.decoding ??= 'async'
  }

  if (Array.isArray(node.children)) {
    node.children.forEach(addImageAttrs)
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = String(query.url || '')
  const path = String(query.path || '')

  if (!url || !(await allowedContentUrls()).has(url)) {
    throw createError({ statusCode: 404, statusMessage: '内容不存在' })
  }

  const markdown = (await readDataCapsuleObject(url)).toString('utf8')
  const parsed = await parseMarkdown(markdown)
  addImageAttrs(parsed.body)

  return {
    path,
    body: parsed.body,
    bodyRaw: markdown,
    title: parsed.data?.title,
    description: parsed.data?.description,
    toc: parsed.toc
  }
})
