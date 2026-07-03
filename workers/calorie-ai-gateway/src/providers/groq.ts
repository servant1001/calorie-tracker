import type {
  Env,
  ProviderAdapter,
  StructuredGenerationRequest,
  StructuredGenerationResponse,
} from '../types'
import { parseJsonStringArray, safeJsonParse } from '../utils'

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

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

export const groqProvider: ProviderAdapter = {
  name: 'groq',
  isEnabled(env) {
    return Boolean(env.GROQ_MODEL && parseJsonStringArray(env.GROQ_API_KEYS_JSON).length)
  },
  async generateStructuredOutput<TData>(
    env: Env,
    payload: StructuredGenerationRequest,
  ): Promise<StructuredGenerationResponse<TData>> {
    const model = String(env.GROQ_MODEL ?? '').trim()
    const apiKeys = parseJsonStringArray(env.GROQ_API_KEYS_JSON)
    let lastError: Error | null = null

    if (!model || !apiKeys.length) {
      throw new Error('尚未完整設定 Groq provider。')
    }

    for (const apiKey of apiKeys) {
      try {
        const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
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
          throw new Error('Groq 未回傳內容。')
        }

        return {
          data: safeJsonParse<TData>(parsedText),
          provider: 'groq',
          model,
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Groq 請求失敗。')
      }
    }

    throw lastError ?? new Error('Groq 暫時無法使用。')
  },
}
