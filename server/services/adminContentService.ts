import type {
  AdminDeleteRecordPayload,
  AdminMutationResponse,
  AdminSaveRecordPayload
} from '~~/shared/adminData'
import {
  deleteAdminRecordFromLocal,
  readAdminManagedRecordsFromLocal,
  saveAdminRecordToLocal
} from './adminContentStorage'
import {
  readAdminManagedRecordsFromGithub,
  syncDeletedRecordToGithub,
  syncSavedRecordToGithub
} from './adminGithubSync'

function logMirrorError(target: string, error: unknown) {
  console.warn(`[admin-content:${target}]`, error instanceof Error ? error.message : error)
}

function runDetached(task: () => Promise<unknown>, target: string) {
  task().catch((error) => logMirrorError(target, error))
}

export async function readAdminManagedRecords() {
  try {
    return await readAdminManagedRecordsFromGithub()
  } catch (error) {
    logMirrorError('github-read-fallback', error)
    return readAdminManagedRecordsFromLocal()
  }
}

export async function saveAdminRecord(payload: AdminSaveRecordPayload): Promise<AdminMutationResponse> {
  const githubResult = await syncSavedRecordToGithub(payload)

  if (githubResult === 'skipped') {
    throw createError({ statusCode: 500, statusMessage: '未配置 GitHub 同步环境变量，无法保存到远程仓库' })
  }

  runDetached(async () => {
    await saveAdminRecordToLocal(payload)
  }, 'local-save')

  return {
    ok: true,
    record: githubResult.record,
    records: githubResult.records,
    sync: {
      github: githubResult.status,
      local: 'pending'
    }
  }
}

export async function deleteAdminRecord(payload: AdminDeleteRecordPayload): Promise<AdminMutationResponse> {
  const githubResult = await syncDeletedRecordToGithub(payload)

  if (githubResult === 'skipped') {
    throw createError({ statusCode: 500, statusMessage: '未配置 GitHub 同步环境变量，无法保存到远程仓库' })
  }

  runDetached(async () => {
    await deleteAdminRecordFromLocal(payload)
  }, 'local-delete')

  return {
    ok: true,
    records: githubResult.records,
    sync: {
      github: githubResult.status,
      local: 'pending'
    }
  }
}
