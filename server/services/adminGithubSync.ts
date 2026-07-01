import {
  adminContentFile,
  adminLyricFileName,
  adminRecordNeedsMarkdown,
  type AdminDataRecord,
  type AdminDeleteRecordPayload,
  type AdminManagedRecord,
  type AdminSaveRecordPayload
} from '~~/shared/adminData'
import { compactRecord, normalizeRecordForWrite } from './adminContentCore'

type GitHubFile = {
  content?: string
  sha?: string
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
  delete?: boolean
}

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

function decodeBase64(value: string) {
  return Buffer.from(value.replace(/\n/g, ''), 'base64').toString('utf8')
}

function githubContentPath(type: AdminDataRecord['type'], id: string) {
  const contentFile = adminContentFile(type, id)
  return contentFile ? `content/${contentFile}` : ''
}

async function requestGithub<T>(path: string, options: {
  method?: 'GET' | 'PUT' | 'DELETE'
  body?: Record<string, unknown>
} = {}) {
  const target = githubContentsApi(path)
  if (!target) {
    throw new Error('未配置 GitHub 同步环境变量，已跳过 GitHub 同步')
  }

  const { config, url } = target

  return $fetch<T>(url, {
    method: options.method || 'GET',
    query: options.method ? undefined : { ref: config.branch },
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'yisiblog-admin-sync'
    },
    body: options.body
  })
}

async function requestGithubRepo<T>(path: string, options: {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: Record<string, unknown>
} = {}) {
  const target = githubRepoApi(path)
  if (!target) {
    throw new Error('未配置 GitHub 同步环境变量，已跳过 GitHub 同步')
  }

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
  return {
    text: file.content ? decodeBase64(file.content) : '',
    sha: file.sha
  }
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

async function commitGithubChanges(changes: GitHubChange[], message: string) {
  const target = githubConfig()
  if (!target) {
    throw new Error('未配置 GitHub 同步环境变量，已跳过 GitHub 同步')
  }

  if (!changes.length) return

  const ref = await requestGithubRepo<GitHubRef>(`git/ref/heads/${target.branch}`)
  const headSha = ref.object?.sha
  if (!headSha) throw new Error('GitHub 同步失败：无法读取目标分支引用')

  const headCommit = await requestGithubRepo<GitHubCommit>(`git/commits/${headSha}`)
  const baseTreeSha = headCommit.tree?.sha
  if (!baseTreeSha) throw new Error('GitHub 同步失败：无法读取目标分支 tree')

  const tree = await requestGithubRepo<GitHubTree>('git/trees', {
    method: 'POST',
    body: {
      base_tree: baseTreeSha,
      tree: changes.map((change) => {
        if (change.delete) {
          return {
            path: change.path,
            mode: '100644',
            type: 'blob',
            sha: null
          }
        }

        return {
          path: change.path,
          mode: '100644',
          type: 'blob',
          content: change.content || ''
        }
      })
    }
  })
  if (!tree.sha) throw new Error('GitHub 同步失败：无法创建 tree')

  const commit = await requestGithubRepo<{ sha?: string }>('git/commits', {
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
}

async function readGithubRecords() {
  const source = await readGithubText('app/data/source/records.json')
  return {
    records: JSON.parse(source.text || '[]') as AdminDataRecord[],
    sha: source.sha
  }
}

export async function readAdminManagedRecordsFromGithub(): Promise<AdminManagedRecord[]> {
  if (!githubConfig()) {
    throw new Error('未配置 GitHub 同步环境变量，无法从 GitHub 读取记录')
  }

  const { records } = await readGithubRecords()

  return Promise.all(records.map(async (sourceRecord) => {
    const record = normalizeRecordForWrite(sourceRecord)
    const managedRecord: AdminManagedRecord = { ...record }

    if (adminRecordNeedsMarkdown(record.type)) {
      const contentFile = adminContentFile(record.type, record.id)
      managedRecord.contentFile = contentFile
      try {
        managedRecord.content = (await readGithubText(githubContentPath(record.type, record.id))).text
      } catch (error: unknown) {
        const responseError = error as { response?: { status?: number } }
        if (responseError.response?.status !== 404) throw error
        managedRecord.content = ''
      }
    }

    if (record.type === 'music') {
      const lrcFile = adminLyricFileName(record.url, record.title, record.id)
      managedRecord.lrcFile = lrcFile
      try {
        managedRecord.lrc = (await readGithubText(`content/lyrics/${lrcFile}`)).text
      } catch (error: unknown) {
        const responseError = error as { response?: { status?: number } }
        if (responseError.response?.status !== 404) throw error
        managedRecord.lrc = ''
      }
    }

    return managedRecord
  }))
}

export async function syncSavedRecordToGithub(payload: AdminSaveRecordPayload) {
  if (!githubConfig()) return 'skipped' as const

  const originalId = payload.originalId?.trim()
  const nextRecord = normalizeRecordForWrite(payload.record)
  const { records } = await readGithubRecords()
  const currentIndex = records.findIndex((record) => record.type === nextRecord.type && record.id === (originalId || nextRecord.id))
  const duplicateIndex = records.findIndex((record, index) => record.type === nextRecord.type && record.id === nextRecord.id && index !== currentIndex)

  if (duplicateIndex >= 0) {
    throw new Error('GitHub 同步失败：同类型下已存在相同 ID 的记录')
  }

  if (currentIndex >= 0) {
    records[currentIndex] = nextRecord
  } else {
    records.unshift(nextRecord)
  }

  const changes: GitHubChange[] = [{
    path: 'app/data/source/records.json',
    content: `${JSON.stringify(records.map(compactRecord), null, 2)}\n`
  }]

  if (adminRecordNeedsMarkdown(nextRecord.type)) {
    changes.push({
      path: githubContentPath(nextRecord.type, nextRecord.id),
      content: payload.content || ''
    })
    if (originalId && originalId !== nextRecord.id) {
      const previousPath = githubContentPath(nextRecord.type, originalId)
      if (await githubFileExists(previousPath)) {
        changes.push({
          path: previousPath,
          delete: true
        })
      }
    }
  }

  if (nextRecord.type === 'music' && typeof payload.lrc === 'string') {
    changes.push({
      path: `content/lyrics/${adminLyricFileName(nextRecord.url, nextRecord.title, nextRecord.id)}`,
      content: payload.lrc
    })
  }

  await commitGithubChanges(changes, `admin: save ${nextRecord.type}/${nextRecord.id}`)
  const latestRecords = await readAdminManagedRecordsFromGithub()

  return {
    status: 'synced' as const,
    record: latestRecords.find((record) => record.type === nextRecord.type && record.id === nextRecord.id),
    records: latestRecords
  }
}

export async function syncDeletedRecordToGithub(payload: AdminDeleteRecordPayload) {
  if (!githubConfig()) return 'skipped' as const

  const { records } = await readGithubRecords()
  const target = records.find((record) => record.type === payload.type && record.id === payload.id)
  const nextRecords = records.filter((record) => !(record.type === payload.type && record.id === payload.id))
  const changes: GitHubChange[] = []

  if (nextRecords.length !== records.length) {
    changes.push({
      path: 'app/data/source/records.json',
      content: `${JSON.stringify(nextRecords.map(compactRecord), null, 2)}\n`
    })
  }

  if (payload.deleteAssociatedFiles && target) {
    if (adminRecordNeedsMarkdown(payload.type)) {
      const contentFile = githubContentPath(payload.type, payload.id)
      if (await githubFileExists(contentFile)) {
        changes.push({
          path: contentFile,
          delete: true
        })
      }
    }
    if (payload.type === 'music') {
      const lyricFile = `content/lyrics/${adminLyricFileName(target.url, target.title, target.id)}`
      if (await githubFileExists(lyricFile)) {
        changes.push({
          path: lyricFile,
          delete: true
        })
      }
    }
  }

  if (changes.length) {
    await commitGithubChanges(changes, `admin: delete ${payload.type}/${payload.id}`)
  }

  return {
    status: 'synced' as const,
    records: await readAdminManagedRecordsFromGithub()
  }
}
