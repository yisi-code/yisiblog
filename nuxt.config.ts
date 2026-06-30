import tailwindcss from '@tailwindcss/vite'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

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

type ContentBodyNode = string | number | boolean | null | undefined | unknown[]

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

function addImageLoadingAttrs(nodes?: ContentBodyNode[]) {
  if (!Array.isArray(nodes)) return

  nodes.forEach((node) => {
    if (!Array.isArray(node)) return

    const tagName = typeof node[0] === 'string' ? node[0] : ''
    const attrs = node[1] && typeof node[1] === 'object' && !Array.isArray(node[1])
      ? node[1] as Record<string, unknown>
      : null

    if (tagName === 'img' && attrs) {
      attrs.referrerpolicy ??= 'no-referrer'
      attrs.loading ??= 'lazy'
      attrs.decoding ??= 'async'
    }

    addImageLoadingAttrs(node.slice(2) as ContentBodyNode[])
  })
}

function contentBodyValue(content: unknown) {
  if (!content || typeof content !== 'object') return undefined
  const contentRecord = content as { body?: unknown }
  if (!contentRecord.body || typeof contentRecord.body !== 'object') return undefined
  const body = contentRecord.body as { value?: unknown }
  return Array.isArray(body.value) ? body.value as ContentBodyNode[] : undefined
}

export default defineNuxtConfig({
  compatibilityDate: '2026-06-22',
  devtools: { enabled: true },
  modules: ['@nuxt/content', '@pinia/nuxt', '@nuxtjs/color-mode', '@nuxt/eslint'],
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  css: ['katex/dist/katex.min.css', '~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit'
      ]
    }
  },
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light'
  },
  content: {
    build: {
      markdown: {
        remarkPlugins: {
          'remark-math': {
            instance: remarkMath
          },
          'remark-preserve-blank-lines': {
            instance: remarkPreserveBlankLines
          }
        },
        rehypePlugins: {
          'rehype-katex': {
            instance: rehypeKatex,
            options: {
              throwOnError: false
            }
          }
        },
        highlight: {
          theme: {
            default: 'github-light',
            dark: 'github-dark'
          }
        }
      }
    }
  },
  hooks: {
    'content:file:beforeParse': ({ file }) => {
      if (file.extension === '.md' && typeof file.body === 'string') {
        file.body = normalizeDisplayMathDelimiters(file.body)
      }
    },
    'content:file:afterParse': ({ content }) => {
      addImageLoadingAttrs(contentBodyValue(content))
    }
  },
  runtimeConfig: {
    adminToken: process.env.ADMIN_TOKEN || '',
    ai: {
      provider: process.env.AI_PROVIDER || 'deepseek',
      apiKey: process.env.AI_API_KEY || '',
      baseUrl: process.env.AI_BASE_URL || '',
      model: process.env.AI_MODEL || '',
      maxOutputTokens: process.env.AI_MAX_OUTPUT_TOKENS || '150',
      temperature: process.env.AI_TEMPERATURE || '0.85'
    },
    gitalk: {
      clientSecret: process.env.GITALK_CLIENT_SECRET || ''
    },
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      gitalk: {
        clientID: process.env.NUXT_PUBLIC_GITALK_CLIENT_ID || '',
        clientSecretConfigured: Boolean(process.env.GITALK_CLIENT_SECRET),
        repo: process.env.NUXT_PUBLIC_GITALK_REPO || '',
        owner: process.env.NUXT_PUBLIC_GITALK_OWNER || '',
        admin: (process.env.NUXT_PUBLIC_GITALK_ADMIN || '').split(',').map((item) => item.trim()).filter(Boolean)
      }
    }
  },
  routeRules: {
    '/timeline': { redirect: '/posts' },
    '/__nuxt_content/**': { prerender: false }
  },
  nitro: {
    prerender: {
      crawlLinks: false,
      failOnError: false,
      ignore: ['/__nuxt_content/**']
    }
  }
})
