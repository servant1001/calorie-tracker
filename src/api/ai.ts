import type {
  DietaryGapRequest,
  DietaryGapResponse,
  DailySummaryRequest,
  DailySummaryResponse,
  MealPhotoRequest,
  ParseFoodTextRequest,
  ParseFoodTextResponse,
} from '@/types/ai'

function getAiGatewayBaseUrl() {
  const configuredBaseUrl = String(import.meta.env.VITE_AI_GATEWAY_BASE_URL ?? '').trim()

  if (!configuredBaseUrl) {
    return ''
  }

  return configuredBaseUrl.replace(/\/$/, '')
}

function buildAiEndpoint(path: string) {
  const baseUrl = getAiGatewayBaseUrl()

  if (!baseUrl) {
    return `/api/ai/${path}`
  }

  return `${baseUrl}/api/ai/${path}`
}

async function postJson<TResponse>(path: string, payload: unknown): Promise<TResponse> {
  const response = await fetch(buildAiEndpoint(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'AI 服務暫時無法使用，請稍後再試。')
  }

  return response.json() as Promise<TResponse>
}

export function parseFoodText(payload: ParseFoodTextRequest) {
  return postJson<ParseFoodTextResponse>('parse-food-text', payload)
}

export function analyzeMealPhoto(payload: MealPhotoRequest) {
  return postJson<ParseFoodTextResponse>('meal-photo', payload)
}

export function generateDailySummary(payload: DailySummaryRequest) {
  return postJson<DailySummaryResponse>('daily-summary', payload)
}

export function analyzeDietaryGap(payload: DietaryGapRequest) {
  return postJson<DietaryGapResponse>('dietary-gap', payload)
}
