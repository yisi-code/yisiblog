import {
  adminContentFile,
  adminLyricFileName,
  adminRecordNeedsMarkdown,
  type AdminDataRecord,
  type AdminManagedRecord,
  type AdminPendingChange
} from '~~/shared/adminData'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { compactRecord, normalizeRecordForWrite } from './adminContentCore'

type GitHubFile = {
  content?: string
}

type GitHubRef = {
  object?: {
    sha?: string
  }
}

type GitHubCommit = {
  tree?: {
    sha?: string
  }
}

type GitHubTree = {
  sha?: string
}

type GitHubChange = {
  path: string
  content?: string
  contentBase64?: string
  delete?: boolean
}

const publicMusicRootPath = resolve(process.cwd(), 'public/music')

function githubConfig() {
  const runtimeConfig = useRuntimeConfig()
  const token = String(runtimeConfig.github?.token || process.env.GITHUB_TOKEN || '').trim()
  const owner = String(runtimeConfig.github?.owner || process.env.GITHUB_OWNER || '').trim()
  const repo = String(runtimeConfig.github?.repo || process.env.GITHUB_REPO || '').trim()
  const branch = String(runtimeConfig.github?.branch || process.env.GITHUB_BRANCH || 'main').trim()
  const committerName = String(runtimeConfig.github?.committerName || process.env.GITHUB_COMMITTER_NAME || 'yisiblog-bot').trim()
  const committerEmail = String(runtimeConfig.github?.committerEmail || process.env.GITHUB_COMMITTER_EMAIL || 'yisiblog-bot@example.com').trim()

  if (!token || !owner || !repo) return null

  return {
    token,
    owner,
    repo,
    branch,
    committerName,
    committerEmail
  }
}

function githubContentsApi(path: string) {
  const config = githubConfig()
  if (!config) return null

  return {
    config,
    url: `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path.replace(/^\/+/, '')}`
  }
}

function githubRepoApi(path: string) {
  const config = githubConfig()
  if (!config) return null

  return {
    config,
    url: `https://api.github.com/repos/${config.owner}/${config.repo}/${path.replace(/^\/+/, '')}`
  }
}

function assertGithubConfigured() {
  const config = githubConfig()
  if (!config) {
    throw new Error('未配置 GitHub 同步环境变量，无法同步远程仓库')
  }
  return config
}

function decodeBase64(value: string) {
  return Buffer.from(value.replace(/\n/g, ''), 'base64').toString('utf8')
}

function githubContentPath(type: AdminDataRecord['type'], id: string) {
  const contentFile = adminContentFile(type, id)
  return contentFile ? `content/${contentFile}` : ''
}

function localMusicPath(publicPath: string) {
  const normalizedPath = publicPath.trim()
  if (!normalizedPath.startsWith('/music/')) {
    throw new Error('音乐文件路径必须以 /music/ 开头')
  }

  const fileName = normalizedPath.replace(/^\/music\//, '').replace(/[\\/]/g, '-')
  const filePath = resolve(publicMusicRootPath, fileName)
  if (!filePath.startsWith(publicMusicRootPath)) {
    throw new Error('音乐文件路径无效')
  }
  return {
    fileName,
    filePath
  }
}

async function requestGithub<T>(path: string, options: {
  method?: 'GET'
} = {}) {
  const target = githubContentsApi(path)
  if (!target) throw new Error('未配置 GitHub 同步环境变量，无法读取远程仓库')

  const { config, url } = target

  return $fetch<T>(url, {
    method: options.method || 'GET',
    query: { ref: config.branch },
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'yisiblog-admin-sync'
    }
  })
}

async function requestGithubRepo<T>(path: string, options: {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: Record<string, unknown>
} = {}) {
  const target = githubRepoApi(path)
  if (!target) throw new Error('未配置 GitHub 同步环境变量，无法访问远程仓库')

  const { config, url } = target

  return $fetch<T>(url, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'yisiblog-admin-sync'
    },
    body: options.body
  })
}

async function readGithubFile(path: string) {
  return requestGithub<GitHubFile>(path)
}

async function readGithubText(path: string) {
  const file = await readGithubFile(path)
  return file.content ? decodeBase64(file.content) : ''
}

async function githubFileExists(path: string) {
  try {
    await readGithubFile(path)
    return true
  } catch (error: unknown) {
    const responseError = error as { response?: { status?: number } }
    if (responseError.response?.status === 404) return false
    throw error
  }
}

async function createBase64Blob(contentBase64: string) {
  const blob = await requestGithubRepo<{ sha?: string }>('git/blobs', {
    method: 'POST',
    body: {
      content: contentBase64,
      encoding: 'base64'
    }
  })
  if (!blob.sha) throw new Error('GitHub 同步失败：无法创建二进制文件 blob')
  return blob.sha
}

async function commitGithubChanges(changes: GitHubChange[], message: string) {
  const target = assertGithubConfigured()
  if (!changes.length) return undefined

  const ref = await requestGithubRepo<GitHubRef>(`git/ref/heads/${target.branch}`)
  const headSha = ref.object?.sha
  if (!headSha) throw new Error('GitHub 同步失败：无法读取目标分支引用')

  const headCommit = await requestGithubRepo<GitHubCommit>(`git/commits/${headSha}`)
  const baseTreeSha = headCommit.tree?.sha
  if (!baseTreeSha) throw new Error('GitHub 同步失败：无法读取目标分支 tree')

  const treeEntries = await Promise.all(changes.map(async (change) => {
    if (change.delete) {
      return {
        path: change.path,
        mode: '100644',
        type: 'blob',
        sha: null
      }
    }

    if (change.contentBase64) {
      return {
        path: change.path,
        mode: '100644',
        type: 'blob',
        sha: await createBase64Blob(change.contentBase64)
      }
    }

    return {
      path: change.path,
      mode: '100644',
      type: 'blob',
      content: change.content || ''
    }
  }))

  const tree = await requestGithubRepo<GitHubTree>('git/trees', {
    method: 'POST',
    body: {
      base_tree: baseTreeSha,
      tree: treeEntries
    }
  })
  if (!tree.sha) throw new Error('GitHub 同步失败：无法创建 tree')

  const commit = await requestGithubRepo<{ sha?: string; html_url?: string }>('git/commits', {
    method: 'POST',
    body: {
      message,
      tree: tree.sha,
      parents: [headSha],
      committer: {
        name: target.committerName,
        email: target.committerEmail
      }
    }
  })
  if (!commit.sha) throw new Error('GitHub 同步失败：无法创建 commit')

  await requestGithubRepo(`git/refs/heads/${target.branch}`, {
    method: 'PATCH',
    body: {
      sha: commit.sha,
      force: false
    }
  })

  return {
    sha: commit.sha,
    url: commit.html_url
  }
}

function upsertChange(changes: GitHubChange[], nextChange: GitHubChange) {
  const index = changes.findIndex((change) => change.path === nextChange.path)
  if (index >= 0) {
    changes[index] = nextChange
    return
  }
  changes.push(nextChange)
}

async function readGithubRecords() {
  const source = await readGithubText('app/data/source/records.json')
  return JSON.parse(source || '[]') as AdminDataRecord[]
}

async function hydrateManagedRecords(records: AdminDataRecord[], sidecar = new Map<string, {
  content?: string
  lrc?: string
}>()): Promise<AdminManagedRecord[]> {
  return Promise.all(records.map(async (sourceRecord) => {
    const record = normalizeRecordForWrite(sourceRecord)
    const managedRecord: AdminManagedRecord = { ...record }
    const extra = sidecar.get(`${record.type}:${record.id}`)

    if (adminRecordNeedsMarkdown(record.type)) {
      const contentFile = adminContentFile(record.type, record.id)
      managedRecord.contentFile = contentFile
      if (typeof extra?.content === 'string') {
        managedRecord.content = extra.content
      } else {
        try {
          managedRecord.content = await readGithubText(githubContentPath(record.type, record.id))
        } catch (error: unknown) {
          const responseError = error as { response?: { status?: number } }
          if (responseError.response?.status !== 404) throw error
          managedRecord.content = ''
        }
      }
    }

    if (record.type === 'music') {
      const lrcFile = adminLyricFileName(record.url, record.title, record.id)
      managedRecord.lrcFile = lrcFile
      if (typeof extra?.lrc === 'string') {
        managedRecord.lrc = extra.lrc
      } else {
        try {
          managedRecord.lrc = await readGithubText(`content/lyrics/${lrcFile}`)
        } catch (error: unknown) {
          const responseError = error as { response?: { status?: number } }
          if (responseError.response?.status !== 404) throw error
          managedRecord.lrc = ''
        }
      }
    }

    return managedRecord
  }))
}

export async function readAdminManagedRecordsFromGithub(): Promise<AdminManagedRecord[]> {
  assertGithubConfigured()
  return hydrateManagedRecords(await readGithubRecords())
}

export async function syncAdminChangesToGithub(changesPayload: AdminPendingChange[]) {
  assertGithubConfigured()

  if (!changesPayload.length) {
    return {
      status: 'synced' as const,
      records: await readAdminManagedRecordsFromGithub(),
      syncedCount: 0
    }
  }

  const records = await readGithubRecords()
  const githubChanges: GitHubChange[] = []
  const sidecar = new Map<string, { content?: string; lrc?: string }>()

  for (const change of changesPayload) {
    if (change.action === 'save') {
      if (!change.record) throw new Error('同步失败：保存变更缺少记录内容')

      const originalId = change.originalId?.trim()
      const nextRecord = normalizeRecordForWrite(change.record)
      const currentIndex = records.findIndex((record) => record.type === nextRecord.type && record.id === (originalId || nextRecord.id))
      const duplicateIndex = records.findIndex((record, index) => record.type === nextRecord.type && record.id === nextRecord.id && index !== currentIndex)

      if (duplicateIndex >= 0) throw new Error('同步失败：同类型下已存在相同 ID 的记录')

      if (currentIndex >= 0) {
        records[currentIndex] = nextRecord
      } else {
        records.unshift(nextRecord)
      }

      const sidecarKey = `${nextRecord.type}:${nextRecord.id}`
      const sidecarValue = sidecar.get(sidecarKey) || {}

      if (adminRecordNeedsMarkdown(nextRecord.type)) {
        sidecarValue.content = change.content || ''
        upsertChange(githubChanges, {
          path: githubContentPath(nextRecord.type, nextRecord.id),
          content: change.content || ''
        })

        if (originalId && originalId !== nextRecord.id) {
          const previousPath = githubContentPath(nextRecord.type, originalId)
          if (await githubFileExists(previousPath)) {
            upsertChange(githubChanges, {
              path: previousPath,
              delete: true
            })
          }
        }
      }

      if (nextRecord.type === 'music') {
        if (typeof change.lrc === 'string') {
          sidecarValue.lrc = change.lrc
          upsertChange(githubChanges, {
            path: `content/lyrics/${adminLyricFileName(nextRecord.url, nextRecord.title, nextRecord.id)}`,
            content: change.lrc
          })
        }

        if (change.musicFile?.path) {
          const music = localMusicPath(change.musicFile.path)
          try {
            const contentBase64 = (await readFile(music.filePath)).toString('base64')
            upsertChange(githubChanges, {
              path: `public/music/${music.fileName}`,
              contentBase64
            })
          } catch {
            throw new Error(`音乐文件不存在，无法同步：${change.musicFile.path}`)
          }
        }
      }

      sidecar.set(sidecarKey, sidecarValue)
      continue
    }

    if (!change.id || !change.type) throw new Error('同步失败：删除变更缺少记录 ID 或类型')

    const target = records.find((record) => record.type === change.type && record.id === change.id)
    const nextRecords = records.filter((record) => !(record.type === change.type && record.id === change.id))
    records.splice(0, records.length, ...nextRecords)

    if (change.deleteAssociatedFiles && target) {
      if (adminRecordNeedsMarkdown(change.type)) {
        const contentFile = githubContentPath(change.type, change.id)
        if (await githubFileExists(contentFile)) {
          upsertChange(githubChanges, {
            path: contentFile,
            delete: true
          })
        }
      }

      if (change.type === 'music') {
        const lyricFile = `content/lyrics/${adminLyricFileName(target.url, target.title, target.id)}`
        if (await githubFileExists(lyricFile)) {
          upsertChange(githubChanges, {
            path: lyricFile,
            delete: true
          })
        }
      }
    }
  }

  upsertChange(githubChanges, {
    path: 'app/data/source/records.json',
    content: `${JSON.stringify(records.map(compactRecord), null, 2)}\n`
  })

  const commit = await commitGithubChanges(githubChanges, `admin: sync ${changesPayload.length} change${changesPayload.length > 1 ? 's' : ''}`)

  return {
    status: 'synced' as const,
    records: await hydrateManagedRecords(records, sidecar),
    syncedCount: changesPayload.length,
    commit
  }
}
