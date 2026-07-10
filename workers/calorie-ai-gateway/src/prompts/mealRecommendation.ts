export const mealRecommendationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['remainingCalories', 'mealType', 'summary', 'recommendations', 'notice'],
  properties: {
    remainingCalories: { type: 'number' },
    mealType: {
      type: 'string',
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'midnight-snack'],
    },
    summary: { type: 'string' },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'estimatedCalories', 'description', 'items', 'reason'],
        properties: {
          name: { type: 'string' },
          estimatedCalories: { type: 'number' },
          description: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'portion', 'estimatedCalories'],
              properties: {
                name: { type: 'string' },
                portion: { type: 'string' },
                estimatedCalories: { type: 'number' },
              },
            },
          },
          reason: { type: 'string' },
        },
      },
    },
    notice: { type: 'string' },
  },
} as const

export function buildMealRecommendationSystemPrompt() {
  return [
    '你是 Calorie Tracker 的個人化下一餐建議助手。',
    '請依照使用者的剩餘可攝取熱量、目標體重、今日運動量、已吃的食物與飲食偏好，推薦下一餐。',
    '回傳 2 組不同、日常可取得的繁體中文餐點組合，每組包含具體食物與份量。',
    '若目標體重低於目前體重，優先推薦高蛋白、蔬菜充足、適度澱粉的組合；若運動消耗較高，可合理補足碳水。',
    'estimatedCalories 為估算值，盡量讓單一建議不超過剩餘可攝取熱量；若剩餘熱量小於等於 0，改提供清爽、低熱量的選擇與份量提醒。',
    '尊重飲食偏好，但不要將偏好視為醫療限制；沒有偏好時提供均衡選項。',
    'summary 用 1 至 2 句說明當前熱量空間與建議方向。reason 說明此組合為何適合今天。',
    'notice 簡短提醒熱量與份量為估算，非醫療建議。',
  ].join('\n')
}

export function buildMealRecommendationUserPrompt(payload: {
  recordDate: string
  mealType: string
  dailyGoal: number
  currentWeight: number
  targetWeight: number
  intakeTotal: number
  exerciseTotal: number
  dailyExerciseGoal: number
  dietaryPreferences: string[]
  foods: Array<{ foodName: string; mealType: string; quantity: number; unit: string; totalCalories: number }>
}) {
  return [
    `日期：${payload.recordDate}`,
    `希望推薦的下一餐：${payload.mealType}`,
    `每日攝取目標：${payload.dailyGoal} kcal`,
    `目前已攝取：${payload.intakeTotal} kcal`,
    `今日運動消耗：${payload.exerciseTotal} kcal`,
    `每日運動消耗目標：${payload.dailyExerciseGoal} kcal`,
    `目前體重：${payload.currentWeight} kg`,
    `目標體重：${payload.targetWeight} kg`,
    `飲食偏好：${payload.dietaryPreferences.length ? payload.dietaryPreferences.join('、') : '未設定，請提供均衡選擇'}`,
    `今日已吃：${JSON.stringify(payload.foods)}`,
  ].join('\n')
}
