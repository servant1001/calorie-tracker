import { generateStructuredOutput } from './providerRouter'
import {
  buildFoodParseSystemPrompt,
  buildFoodParseUserPrompt,
  buildMealPhotoSystemPrompt,
  parseFoodTextSchema,
} from './prompts/food'
import {
  buildDailySummarySystemPrompt,
  buildDailySummaryUserPrompt,
  dailySummarySchema,
} from './prompts/summary'
import {
  buildDietaryGapSystemPrompt,
  buildDietaryGapUserPrompt,
  dietaryGapSchema,
} from './prompts/dietaryGap'
import type {
  DailySummaryBody,
  DailySummaryResult,
  DietaryGapBody,
  DietaryGapResult,
  Env,
  MealPhotoBody,
  ParseFoodTextBody,
  ParseFoodTextResult,
  ParsedFoodItem,
} from './types'
import { buildCorsHeaders, jsonResponse, parseJsonBody } from './utils'

function normalizeMealType(mealType: string): ParsedFoodItem['mealType'] {
  if (mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner' || mealType === 'snack' || mealType === 'midnight-snack') {
    return mealType
  }

  return 'snack'
}

function normalizeFoodResult(result: ParseFoodTextResult): ParseFoodTextResult {
  const items = result.items.map((item) => {
    const quantity = Number(item.quantity) || 1
    const caloriesPerUnit = Number(item.caloriesPerUnit) || 0

    return {
      ...item,
      mealType: normalizeMealType(item.mealType),
      quantity,
      caloriesPerUnit,
      totalCalories: Number(item.totalCalories) || Math.round(quantity * caloriesPerUnit),
      note: item.note || 'AI 估算熱量，建議確認份量後再加入紀錄。',
    }
  })

  return {
    ...result,
    items,
    totalCalories: Number(result.totalCalories) || items.reduce((sum, item) => sum + item.totalCalories, 0),
    confidence: Number(result.confidence) || 0.7,
    notice: result.notice || '此熱量為 AI 估算值，建議確認份量後再加入紀錄。',
  }
}

async function handleParseFoodText(env: Env, request: Request) {
  const body = await parseJsonBody<ParseFoodTextBody>(request)

  if (!body.text?.trim()) {
    return jsonResponse({ error: '請提供要解析的飲食文字內容。' }, { status: 400 })
  }

  const response = await generateStructuredOutput<ParseFoodTextResult>(env, {
    schemaName: 'food_parse_result',
    schema: parseFoodTextSchema as unknown as Record<string, unknown>,
    systemPrompt: buildFoodParseSystemPrompt(),
    userPrompt: buildFoodParseUserPrompt(body.text.trim(), body.recordDate),
  })

  return jsonResponse({
    ...normalizeFoodResult(response.data),
    provider: response.provider,
    model: response.model,
  })
}

async function handleMealPhoto(env: Env, request: Request) {
  const body = await parseJsonBody<MealPhotoBody>(request)

  if (!body.imageUrl?.trim()) {
    return jsonResponse({ error: '請提供餐點圖片網址。' }, { status: 400 })
  }

  const response = await generateStructuredOutput<ParseFoodTextResult>(env, {
    schemaName: 'meal_photo_result',
    schema: parseFoodTextSchema as unknown as Record<string, unknown>,
    systemPrompt: buildMealPhotoSystemPrompt(),
    userPrompt: `紀錄日期：${body.recordDate}\n請辨識這張餐點照片中的食物、份量與估算熱量。`,
    imageUrl: body.imageUrl.trim(),
  })

  return jsonResponse({
    ...normalizeFoodResult(response.data),
    provider: response.provider,
    model: response.model,
  })
}

async function handleDailySummary(env: Env, request: Request) {
  const body = await parseJsonBody<DailySummaryBody>(request)

  const response = await generateStructuredOutput<DailySummaryResult>(env, {
    schemaName: 'daily_summary_result',
    schema: dailySummarySchema as unknown as Record<string, unknown>,
    systemPrompt: buildDailySummarySystemPrompt(),
    userPrompt: buildDailySummaryUserPrompt(body),
  })

  return jsonResponse({
    ...response.data,
    provider: response.provider,
    model: response.model,
  })
}

async function handleDietaryGap(env: Env, request: Request) {
  const body = await parseJsonBody<DietaryGapBody>(request)

  if (!body.foods?.length) {
    return jsonResponse({ error: '請先提供至少一筆飲食紀錄。' }, { status: 400 })
  }

  const response = await generateStructuredOutput<DietaryGapResult>(env, {
    schemaName: 'dietary_gap_result',
    schema: dietaryGapSchema as unknown as Record<string, unknown>,
    systemPrompt: buildDietaryGapSystemPrompt(),
    userPrompt: buildDietaryGapUserPrompt(body),
  })

  return jsonResponse({
    ...response.data,
    provider: response.provider,
    model: response.model,
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const corsHeaders = buildCorsHeaders(request.headers.get('Origin'), env.ALLOWED_ORIGIN)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    try {
      let response: Response

      if (request.method === 'POST' && url.pathname === '/api/ai/parse-food-text') {
        response = await handleParseFoodText(env, request)
      } else if (request.method === 'POST' && url.pathname === '/api/ai/meal-photo') {
        response = await handleMealPhoto(env, request)
      } else if (request.method === 'POST' && url.pathname === '/api/ai/daily-summary') {
        response = await handleDailySummary(env, request)
      } else if (request.method === 'POST' && url.pathname === '/api/ai/dietary-gap') {
        response = await handleDietaryGap(env, request)
      } else if (request.method === 'GET' && url.pathname === '/health') {
        response = jsonResponse({ ok: true, service: 'calorie-ai-gateway' })
      } else {
        response = jsonResponse({ error: 'Not Found' }, { status: 404 })
      }

      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    } catch (error) {
      return jsonResponse(
        {
          error: error instanceof Error ? error.message : 'AI Gateway 發生未預期錯誤。',
        },
        {
          status: 500,
          headers: corsHeaders,
        },
      )
    }
  },
}
