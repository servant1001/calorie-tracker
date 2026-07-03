import type {
  Env,
  ProviderAdapter,
  StructuredGenerationRequest,
  StructuredGenerationResponse,
} from '../types'
import { parseJsonStringArray, safeJsonParse } from '../utils'

function buildMessages(payload: StructuredGenerationRequest) {
  const userContent = payload.imageUrl
    ? [
        { type: 'text', text: payload.userPrompt },
        { type: 'image_url', image_url: { url: payload.imageUrl } },
      ]
    : payload.userPrompt

  return [
    {
      role: 'system',
      content: payload.systemPrompt,
    },
    {
      role: 'user',
      content: userContent,
    },
  ]
}

export const openAiCompatProvider: ProviderAdapter = {
  name: 'openai_compat',
  isEnabled(env) {
    return Boolean(env.OPENAI_COMPAT_BASE_URL && env.OPENAI_COMPAT_MODEL && parseJsonStringArray(env.OPENAI_COMPAT_API_KEYS_JSON).length)
  },
  async generateStructuredOutput<TData>(
    env: Env,
    payload: StructuredGenerationRequest,
  ): Promise<StructuredGenerationResponse<TData>> {
    const baseUrl = String(env.OPENAI_COMPAT_BASE_URL ?? '').replace(/\/$/, '')
    const model = env.OPENAI_COMPAT_MODEL || ''
    const apiKeys = parseJsonStringArray(env.OPENAI_COMPAT_API_KEYS_JSON)
    let lastError: Error | null = null

    if (!baseUrl || !model || !apiKeys.length) {
      throw new Error('尚未完整設定 OPENAI_COMPAT provider。')
    }

    for (const apiKey of apiKeys) {
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: buildMessages(payload),
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: payload.schemaName,
                strict: true,
                schema: payload.schema,
              },
            },
          }),
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const responseJson = await response.json() as {
          choices?: Array<{
            message?: {
              content?: string
            }
          }>
        }
        const parsedText = responseJson.choices?.[0]?.message?.content

        if (!parsedText) {
          throw new Error('OpenAI-compatible provider 未回傳內容。')
        }

        return {
          data: safeJsonParse<TData>(parsedText),
          provider: 'openai_compat',
          model,
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('OpenAI-compatible provider 請求失敗。')
      }
    }

    throw lastError ?? new Error('OpenAI-compatible provider 暫時無法使用。')
  },
}
