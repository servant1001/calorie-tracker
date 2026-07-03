export const parseFoodTextSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['items', 'totalCalories', 'confidence', 'notice'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['mealType', 'foodName', 'quantity', 'unit', 'caloriesPerUnit', 'totalCalories', 'note'],
        properties: {
          mealType: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack', 'midnight-snack'],
          },
          foodName: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          caloriesPerUnit: { type: 'number' },
          totalCalories: { type: 'number' },
          note: { type: 'string' },
        },
      },
    },
    totalCalories: { type: 'number' },
    confidence: { type: 'number' },
    notice: { type: 'string' },
  },
} as const

export function buildFoodParseSystemPrompt() {
  return [
    '你是 Calorie Tracker 的 AI 飲食紀錄助手。',
    '你的任務是把使用者輸入的一句自然語言，整理成可以寫入熱量紀錄系統的 JSON。',
    '請使用繁體中文理解內容，但回傳格式必須完全符合 JSON schema。',
    '請幫每個項目推估 mealType、份量、單位、每份熱量與總熱量。',
    '若熱量沒有把握，仍可估算，但 note 要提醒這是 AI 估算值，建議使用者確認。',
    'confidence 請回傳 0 到 1 的數值。',
    'notice 請用一句繁體中文提醒使用者先確認份量與熱量再加入紀錄。',
  ].join('\n')
}

export function buildFoodParseUserPrompt(text: string, recordDate: string) {
  return [
    `紀錄日期：${recordDate}`,
    `使用者輸入：${text}`,
    '請整理成飲食項目陣列。',
  ].join('\n')
}

export function buildMealPhotoSystemPrompt() {
  return [
    '你是 Calorie Tracker 的 AI 圖片辨識餐點助手。',
    '請根據照片中最可能的餐點內容，回傳結構化 JSON。',
    '若無法百分之百確定，仍可估算，但 note 與 notice 要提醒這是 AI 估算值。',
    '請使用 breakfast、lunch、dinner、snack、midnight-snack 其中之一作為 mealType。',
  ].join('\n')
}
