export type AiProvider = 'deepseek' | 'openai'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type OpenAICompatibleResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

type AiRuntimeConfig = {
  provider?: unknown
  apiKey?: unknown
  baseUrl?: unknown
  model?: unknown
  maxOutputTokens?: unknown
  temperature?: unknown
}

type AiChatConfig = {
  provider: AiProvider
  apiKey: string
  baseUrl: string
  model: string
  maxOutputTokens: number
  temperature: number
}

type AiChatOptions = {
  config: AiRuntimeConfig
  systemPrompt: string
  userMessage: string
}

const providerDefaults: Record<AiProvider, { baseUrl: string; model: string }> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash'
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini'
  }
}

export async function requestAiChat(options: AiChatOptions) {
  const config = resolveAiChatConfig(options.config)
  const response = await callOpenAICompatible({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    messages: [
      { role: 'system', content: options.systemPrompt },
      { role: 'user', content: options.userMessage }
    ],
    maxTokens: config.maxOutputTokens,
    temperature: config.temperature
  })

  return response?.choices?.[0]?.message?.content || ''
}

function resolveAiChatConfig(value: AiRuntimeConfig): AiChatConfig {
  const provider = normalizeProvider(value.provider)
  const defaults = providerDefaults[provider]
  const apiKey = String(value.apiKey || '').trim()

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: '缺少 AI_API_KEY' })
  }

  return {
    provider,
    apiKey,
    baseUrl: String(value.baseUrl || defaults.baseUrl).replace(/\/$/, ''),
    model: String(value.model || defaults.model).trim(),
    maxOutputTokens: normalizePositiveInteger(value.maxOutputTokens, 150),
    temperature: normalizeTemperature(value.temperature, 0.85)
  }
}

function callOpenAICompatible(options: {
  apiKey: string
  baseUrl: string
  model: string
  messages: ChatMessage[]
  maxTokens: number
  temperature: number
}) {
  return $fetch<OpenAICompatibleResponse>(`${options.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: {
      model: options.model,
      messages: options.messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature
    }
  })
}

function normalizeProvider(value: unknown): AiProvider {
  const provider = String(value || 'deepseek').trim().toLowerCase()

  if (provider === 'openai') return 'openai'

  return 'deepseek'
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value || ''), 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeTemperature(value: unknown, fallback: number) {
  const parsed = Number.parseFloat(String(value || ''))

  if (!Number.isFinite(parsed)) return fallback

  return Math.min(Math.max(parsed, 0), 2)
}
