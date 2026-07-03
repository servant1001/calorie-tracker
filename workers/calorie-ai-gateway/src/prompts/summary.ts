export const dailySummarySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'suggestion', 'highlights'],
  properties: {
    summary: { type: 'string' },
    suggestion: { type: 'string' },
    highlights: {
      type: 'array',
      items: { type: 'string' },
    },
  },
} as const

export function buildDailySummarySystemPrompt() {
  return [
    '你是 Calorie Tracker 的 AI 每日健康分析助手。',
    '請根據使用者今天的飲食、運動、體重、目標熱量與 BMR，產生簡短但有幫助的繁體中文分析。',
    'summary 請控制在 2 到 3 句內。',
    'suggestion 請提供一個最具行動性的建議。',
    'highlights 請整理 3 到 4 個重點，適合顯示在 Dashboard。',
    '避免醫療診斷語氣。',
  ].join('\n')
}

export function buildDailySummaryUserPrompt(payload: {
  recordDate: string
  dailyGoal: number
  dailyExerciseGoal: number
  currentWeight: number
  targetWeight: number
  activityLevel: string
  intakeTotal: number
  exerciseTotal: number
  basalBurn: number
  totalBurn: number
  netCalories: number
  foods: Array<{ foodName: string; mealType: string; quantity: number; unit: string; totalCalories: number }>
  exercises: Array<{ exerciseName: string; durationMinutes: number; totalCalories: number }>
}) {
  return [
    `日期：${payload.recordDate}`,
    `每日目標熱量：${payload.dailyGoal} kcal`,
    `每日運動消耗目標：${payload.dailyExerciseGoal} kcal`,
    `目前體重：${payload.currentWeight} kg`,
    `目標體重：${payload.targetWeight} kg`,
    `活動量：${payload.activityLevel}`,
    `今日攝取：${payload.intakeTotal} kcal`,
    `今日運動消耗：${payload.exerciseTotal} kcal`,
    `今日基礎代謝 BMR：${payload.basalBurn} kcal`,
    `今日總消耗：${payload.totalBurn} kcal`,
    `今日淨熱量：${payload.netCalories} kcal`,
    `今日飲食：${JSON.stringify(payload.foods)}`,
    `今日運動：${JSON.stringify(payload.exercises)}`,
  ].join('\n')
}
