import type {
  Env,
  ProviderAdapter,
  StructuredGenerationRequest,
  StructuredGenerationResponse,
} from '../types'
import { parseJsonStringArray, safeJsonParse } from '../utils'

interface OpenAiResponsesPayload {
  model: string
  input: unknown[]
  store: boolean
  reasoning?: {
    effort: string
  }
  text: {
    format: {
      type: 'json_schema'
      name: string
      strict: boolean
      schema: Record<string, unknown>
    }
  }
}

function buildOpenAiInput(payload: StructuredGenerationRequest) {
  const userContent: Array<Record<string, string>> = [
    {
      type: 'input_text',
      text: payload.userPrompt,
    },
  ]

  if (payload.imageUrl) {
    userContent.push({
      type: 'input_image',
      image_url: payload.imageUrl,
    })
  }

  return [
    {
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: payload.systemPrompt,
        },
      ],
    },
    {
      role: 'user',
      content: userContent,
    },
  ]
}

function extractResponseText(responseJson: Record<string, unknown>) {
  if (typeof responseJson.output_text === 'string') {
    return responseJson.output_text
  }

  const output = Array.isArray(responseJson.output) ? responseJson.output : []

  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? (item as { content: unknown[] }).content
      : []

    for (const block of content) {
      if (!block || typeof block !== 'object') {
        continue
      }

      const candidate = block as { text?: string }

      if (typeof candidate.text === 'string') {
        return candidate.text
      }
    }
  }

  throw new Error('OpenAI 未回傳可解析的文字內容。')
}

export const openAiProvider: ProviderAdapter = {
  name: 'openai',
  isEnabled(env) {
    return parseJsonStringArray(env.OPENAI_API_KEYS_JSON).length > 0
  },
  async generateStructuredOutput<TData>(
    env: Env,
    payload: StructuredGenerationRequest,
  ): Promise<StructuredGenerationResponse<TData>> {
    const apiKeys = parseJsonStringArray(env.OPENAI_API_KEYS_JSON)

    if (!apiKeys.length) {
      throw new Error('尚未設定 OPENAI_API_KEYS_JSON。')
    }

    const model = env.OPENAI_MODEL || 'gpt-5.5'
    const reasoningEffort = env.OPENAI_REASONING_EFFORT || 'medium'
    let lastError: Error | null = null

    for (const apiKey of apiKeys) {
      try {
        const requestBody: OpenAiResponsesPayload = {
          model,
          input: buildOpenAiInput(payload),
          store: false,
          reasoning: {
            effort: reasoningEffort,
          },
          text: {
            format: {
              type: 'json_schema',
              name: payload.schemaName,
              strict: true,
              schema: payload.schema,
            },
          },
        }

        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const responseJson = await response.json() as Record<string, unknown>
        const parsedText = extractResponseText(responseJson)
        const data = safeJsonParse<TData>(parsedText)

        return {
          data,
          provider: 'openai',
          model,
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('OpenAI 請求失敗。')
      }
    }

    throw lastError ?? new Error('OpenAI Provider 暫時無法使用。')
  },
}
