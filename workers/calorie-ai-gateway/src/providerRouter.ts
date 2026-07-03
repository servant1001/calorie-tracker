import { groqProvider } from './providers/groq'
import { openAiCompatProvider } from './providers/openaiCompat'
import { openAiProvider } from './providers/openai'
import type {
  Env,
  ProviderAdapter,
  ProviderName,
  StructuredGenerationRequest,
  StructuredGenerationResponse,
} from './types'
import { parseProviderOrder } from './utils'

const providerRegistry: Record<ProviderName, ProviderAdapter> = {
  groq: groqProvider,
  openai: openAiProvider,
  openai_compat: openAiCompatProvider,
}

export async function generateStructuredOutput<TData>(
  env: Env,
  payload: StructuredGenerationRequest,
): Promise<StructuredGenerationResponse<TData>> {
  const providerOrder = parseProviderOrder(env.AI_PROVIDER_ORDER) as ProviderName[]
  const errors: string[] = []

  for (const providerName of providerOrder) {
    const provider = providerRegistry[providerName]

    if (!provider || !provider.isEnabled(env)) {
      continue
    }

    try {
      return await provider.generateStructuredOutput<TData>(env, payload)
    } catch (error) {
      errors.push(`${providerName}: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  throw new Error(errors.join(' | ') || '目前沒有可用的 AI Provider。')
}
