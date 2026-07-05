import { assertAdminSession } from '#server/services/adminAuth'
import { assertAllowedExtension, safeUploadBaseName, safeUploadFileName, safeUploadFolder } from '#server/services/adminUploadUtils'
import { uploadDataCapsuleObject } from '#server/services/dataCapsuleStorage'

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']

export default defineEventHandler(async (event) => {
  assertAdminSession(event)

  const form = await readMultipartFormData(event)
  const file = form?.find((item) => item.name === 'file')
  const folder = form?.find((item) => item.name === 'folder')?.data?.toString('utf8')
  const targetName = form?.find((item) => item.name === 'fileName')?.data?.toString('utf8')

  if (!file?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: '请选择要上传的图片文件' })
  }

  const sourceName = safeUploadFileName(file.filename || '', `image-${Date.now()}`)
  const extension = assertAllowedExtension(sourceName, allowedExtensions, '图片文件格式不支持')
  const fileName = `${safeUploadBaseName(targetName, sourceName.replace(/\.[^.]+$/, ''))}${extension}`
  const targetFolder = safeUploadFolder(folder, '图片')
  const uploaded = await uploadDataCapsuleObject({
    key: `${targetFolder}/${fileName}`,
    body: file.data,
    contentType: file.type
  })

  return {
    fileName,
    path: uploaded.key,
    publicUrl: uploaded.url,
    storage: 'data-capsule',
    size: file.data.length,
    mimeType: file.type
  }
})
