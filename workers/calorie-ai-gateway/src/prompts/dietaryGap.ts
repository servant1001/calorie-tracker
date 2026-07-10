export const dietaryGapSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'protein',
    'vegetables',
    'fiber',
    'calorieDistribution',
    'dinnerSuggestion',
    'highlights',
    'disclaimer',
  ],
  properties: {
    protein: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'estimatedGrams', 'targetGrams', 'gapGrams', 'message'],
      properties: {
        status: { type: 'string', enum: ['low', 'adequate', 'unknown'] },
        estimatedGrams: { type: 'number' },
        targetGrams: { type: 'number' },
        gapGrams: { type: 'number' },
        message: { type: 'string' },
      },
    },
    vegetables: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'estimatedServings', 'targetServings', 'gapServings', 'message'],
      properties: {
        status: { type: 'string', enum: ['low', 'adequate', 'unknown'] },
        estimatedServings: { type: 'number' },
        targetServings: { type: 'number' },
        gapServings: { type: 'number' },
        message: { type: 'string' },
      },
    },
    fiber: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'estimatedGrams', 'targetGrams', 'gapGrams', 'message'],
      properties: {
        status: { type: 'string', enum: ['low', 'adequate', 'unknown'] },
        estimatedGrams: { type: 'number' },
        targetGrams: { type: 'number' },
        gapGrams: { type: 'number' },
        message: { type: 'string' },
      },
    },
    calorieDistribution: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'message'],
      properties: {
        status: { type: 'string', enum: ['balanced', 'skewed', 'unknown'] },
        message: { type: 'string' },
      },
    },
    dinnerSuggestion: { type: 'string' },
    highlights: {
      type: 'array',
      items: { type: 'string' },
    },
    disclaimer: { type: 'string' },
  },
} as const

export function buildDietaryGapSystemPrompt() {
  return [
    '你是 Calorie Tracker 的 AI 飲食缺口分析助手。',
    '請依使用者當日已記錄的食物名稱、份量與熱量，估算蛋白質、蔬菜份數、膳食纖維與餐次熱量分配。',
    '營養素是推估值，不可假裝為精確營養資料；資料不足時將 status 設為 unknown，並在 message 說明原因。',
    '針對以減脂或體重管理為目標的一般成年人，提出保守、日常可執行的建議；避免醫療診斷與治療建議。',
    'protein 的 targetGrams 請以使用者體重與體重管理情境估算合理的每日目標。',
    'vegetables 的 targetServings 預設為 3 至 5 份的合理整數；fiber 的 targetGrams 請採保守合理值。',
    'gap 數值不可為負數；足夠時為 0。所有數字請簡潔、適合顯示在 Dashboard。',
    'dinnerSuggestion 必須具體，包含可補足的方向與大約份量，例如蛋白質或蔬菜。',
    'highlights 請回傳 2 至 4 個繁體中文重點。',
    'disclaimer 請簡短說明這是依飲食紀錄做的 AI 估算，非醫療或精確營養分析。',
  ].join('\n')
}

export function buildDietaryGapUserPrompt(payload: {
  recordDate: string
  dailyGoal: number
  currentWeight: number
  targetWeight: number
  intakeTotal: number
  exerciseTotal: number
  foods: Array<{ foodName: string; mealType: string; quantity: number; unit: string; totalCalories: number; note?: string }>
}) {
  return [
    `日期：${payload.recordDate}`,
    `每日攝取目標：${payload.dailyGoal} kcal`,
    `目前體重：${payload.currentWeight} kg`,
    `目標體重：${payload.targetWeight} kg`,
    `目前攝取：${payload.intakeTotal} kcal`,
    `目前運動消耗：${payload.exerciseTotal} kcal`,
    `今日飲食紀錄：${JSON.stringify(payload.foods)}`,
    '請產生今日飲食缺口分析。',
  ].join('\n')
}
