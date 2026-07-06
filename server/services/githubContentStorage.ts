import type { Buffer } from 'node:buffer'

type GitHubContentConfig = {
  owner: string
  repo: string
  branch: string
  token: string
  basePath: string
}

type GitHubTreeItem = {
  path: string
  mode?: '100644'
  type?: 'blob'
  content?: string
  encoding?: 'base64'
  sha?: null
}

type GitHubTreeResponse = {
  sha: string
}

type GitHubRefResponse = {
  object: {
    sha: string
  }
}

type GitHubCommitResponse = {
  sha: string
  tree: {
    sha: string
  }
}

type GitHubCommitResult = {
  commitSha: string
  treeSha: string
}

function githubContentConfig(): GitHubContentConfig {
  const runtimeConfig = useRuntimeConfig()
  const github = runtimeConfig.githubData || {}
  const owner = String(github.owner || process.env.GITHUB_DATA_OWNER || '').trim()
  const repo = String(github.repo || process.env.GITHUB_DATA_REPO || '').trim()
  const branch = String(github.branch || process.env.GITHUB_DATA_BRANCH || 'main').trim()
  const token = String(github.token || process.env.GITHUB_DATA_TOKEN || '').trim()
  const basePath = String(github.basePath || process.env.GITHUB_DATA_BASE_PATH || 'public/content-data').trim()

  if (!owner || !repo || !branch || !token) {
    throw new Error('未配置 GitHub 数据仓库变量：GITHUB_DATA_OWNER、GITHUB_DATA_REPO、GITHUB_DATA_BRANCH、GITHUB_DATA_TOKEN')
  }

  return {
    owner,
    repo,
    branch,
    token,
    basePath: basePath || 'public/content-data'
  }
}

async function githubRequest<T>(config: GitHubContentConfig, path: string, options: {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
} = {}) {
  try {
    return await $fetch<T>(`https://api.github.com/repos/${config.owner}/${config.repo}${path}`, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'yisiblog-admin-sync'
      },
      body: options.body
    })
  } catch (error: unknown) {
    const responseError = error as {
      response?: {
        status?: number
        statusText?: string
        _data?: unknown
      }
    }
    const data = responseError.response?._data
    const message = typeof data === 'object' && data && 'message' in data
      ? String((data as { message?: unknown }).message || '')
      : ''
    throw new Error(`GitHub API 请求失败：${responseError.response?.status || ''} ${message || responseError.response?.statusText || ''}`.trim(), {
      cause: error
    })
  }
}

function textTreeItem(path: string, content: string): GitHubTreeItem {
  return {
    path,
    mode: '100644',
    type: 'blob',
    content
  }
}

function binaryTreeItem(path: string, content: Buffer): GitHubTreeItem {
  return {
    path,
    mode: '100644',
    type: 'blob',
    content: content.toString('base64'),
    encoding: 'base64'
  }
}

export function githubDataBasePath() {
  return githubContentConfig().basePath
}

export async function commitGitHubContent(params: {
  message: string
  textFiles: Record<string, string>
  binaryFiles?: Record<string, Buffer>
  deleteFiles?: string[]
}) {
  const config = githubContentConfig()
  const ref = await githubRequest<GitHubRefResponse>(config, `/git/ref/heads/${encodeURIComponent(config.branch)}`)
  const baseCommitSha = ref.object.sha
  const baseCommit = await githubRequest<GitHubCommitResponse>(config, `/git/commits/${baseCommitSha}`)

  const tree = [
    ...Object.entries(params.textFiles).map(([path, content]) => textTreeItem(path, content)),
    ...Object.entries(params.binaryFiles || {}).map(([path, content]) => binaryTreeItem(path, content)),
    ...(params.deleteFiles || []).map((path) => ({
      path,
      sha: null
    }))
  ]

  const nextTree = await githubRequest<GitHubTreeResponse>(config, '/git/trees', {
    method: 'POST',
    body: {
      base_tree: baseCommit.tree.sha,
      tree
    }
  })

  const nextCommit = await githubRequest<GitHubCommitResult>(config, '/git/commits', {
    method: 'POST',
    body: {
      message: params.message,
      tree: nextTree.sha,
      parents: [baseCommitSha]
    }
  })

  await githubRequest(config, `/git/refs/heads/${encodeURIComponent(config.branch)}`, {
    method: 'PATCH',
    body: {
      sha: nextCommit.sha,
      force: false
    }
  })

  return {
    commitSha: nextCommit.sha,
    treeSha: nextTree.sha,
    branch: config.branch,
    owner: config.owner,
    repo: config.repo
  }
}
