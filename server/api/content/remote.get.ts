import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { readDataCapsuleObject } from '#server/services/dataCapsuleStorage'
import { readDataCapsuleRecords } from '#server/services/adminRecordsDataCapsule'

type MarkdownNode = {
  type?: string
  value?: string
  position?: {
    start?: {
      line?: number
    }
    end?: {
      line?: number
    }
  }
  children?: MarkdownNode[]
}

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

function remarkPreserveBlankLines() {
  return (tree: MarkdownNode) => {
    preserveBlankLines(tree)
  }
}

function preserveBlankLines(node: MarkdownNode) {
  if (!Array.isArray(node.children)) return

  const nextChildren: MarkdownNode[] = []
  node.children.forEach((child) => {
    const previous = nextChildren[nextChildren.length - 1]
    const previousEndLine = previous?.position?.end?.line
    const currentStartLine = child.position?.start?.line
    const blankLineCount = previousEndLine && currentStartLine
      ? Math.max(0, currentStartLine - previousEndLine - 1)
      : 0

    if (blankLineCount > 1) {
      nextChildren.push({
        type: 'html',
        value: '<span class="content-prose__blank-lines" style="--blank-lines:1" data-blank-lines="1" aria-hidden="true"></span>'
      })
    }

    preserveBlankLines(child)
    nextChildren.push(child)
  })

  node.children = nextChildren
}

function normalizeDisplayMathDelimiters(markdown: string) {
  const lines = markdown.split('\n')
  const nextLines: string[] = []
  let isInCodeFence = false
  let codeFenceMarker = ''
  let isInDisplayMath = false

  lines.forEach((line) => {
    const fenceMatch = line.trimStart().match(/^(```|~~~)/)
    if (fenceMatch) {
      const marker = fenceMatch[1] || ''
      if (!isInCodeFence) {
        isInCodeFence = true
        codeFenceMarker = marker
      } else if (marker === codeFenceMarker) {
        isInCodeFence = false
        codeFenceMarker = ''
      }
      nextLines.push(line)
      return
    }

    if (isInCodeFence) {
      nextLines.push(line)
      return
    }

    let currentLine = line
    while (true) {
      if (currentLine.trim() === '$$') {
        nextLines.push(currentLine)
        isInDisplayMath = !isInDisplayMath
        break
      }

      if (isInDisplayMath) {
        const closeMatch = currentLine.match(/^(\s*)\$\$(.*)$/)
        if (!closeMatch) {
          nextLines.push(currentLine)
          break
        }

        nextLines.push(`${closeMatch[1] || ''}$$`)
        isInDisplayMath = false
        currentLine = (closeMatch[2] || '').trimStart()
        if (!currentLine) break
        continue
      }

      const openMatch = currentLine.match(/^(.*\S)\s+\$\$\s*$/)
      if (openMatch) {
        nextLines.push((openMatch[1] || '').trimEnd())
        nextLines.push('$$')
        isInDisplayMath = true
        break
      }

      nextLines.push(currentLine)
      break
    }
  })

  return nextLines.join('\n')
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = String(query.url || '')
  const path = String(query.path || '')

  if (!url || !(await allowedContentUrls()).has(url)) {
    throw createError({ statusCode: 404, statusMessage: '内容不存在' })
  }

  let markdown: string
  try {
    markdown = normalizeDisplayMathDelimiters((await readDataCapsuleObject(url)).toString('utf8'))
  } catch (error) {
    console.warn('[content:remote] 数据胶囊 Markdown 读取失败：', error instanceof Error ? error.message : error)
    throw createError({
      statusCode: 503,
      statusMessage: '内容读取失败，请稍后重试'
    })
  }

  const parsed = await parseMarkdown(markdown, {
    remark: {
      plugins: {
        'remark-math': {
          instance: remarkMath
        },
        'remark-preserve-blank-lines': {
          instance: remarkPreserveBlankLines
        }
      }
    },
    rehype: {
      plugins: {
        'rehype-katex': {
          instance: rehypeKatex,
          options: {
            throwOnError: false
          }
        }
      }
    },
    highlight: {
      theme: {
        default: 'github-dark',
        dark: 'github-dark'
      }
    }
  })
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
