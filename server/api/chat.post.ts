import { requestAiChat } from '#server/aiProvider'
import { siteConfig } from '~~/shared/siteConfig'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ message?: string }>(event)
  const message = body.message?.trim()

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: '缺少消息内容' })
  }

  const reply = await requestAiChat({
    config: useRuntimeConfig(event).ai,
    systemPrompt: siteConfig.aiAssistantPrompt,
    userMessage: message
  })

  return {
    reply: reply || '本喵现在不想理你喵...'
  }
})
