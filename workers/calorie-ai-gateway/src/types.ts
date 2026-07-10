export type ProviderName = 'groq' | 'openai' | 'openai_compat'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'midnight-snack'

export interface Env {
  ALLOWED_ORIGIN?: string
  AI_PROVIDER_ORDER?: string
  GROQ_MODEL?: string
  GROQ_VISION_MODEL?: string
  GROQ_API_KEYS_JSON?: string
  OPENAI_MODEL?: string
  OPENAI_REASONING_EFFORT?: 'low' | 'medium' | 'high'
  OPENAI_API_KEYS_JSON?: string
  OPENAI_COMPAT_BASE_URL?: string
  OPENAI_COMPAT_MODEL?: string
  OPENAI_COMPAT_API_KEYS_JSON?: string
}

export interface StructuredGenerationRequest {
  schemaName: string
  schema: Record<string, unknown>
  systemPrompt: string
  userPrompt: string
  imageUrl?: string
}

export interface StructuredGenerationResponse<TData> {
  data: TData
  provider: ProviderName
  model: string
}

export interface ParseFoodTextBody {
  text: string
  recordDate: string
  locale?: string
}

export interface MealPhotoBody {
  imageUrl: string
  recordDate: string
  locale?: string
}

export interface DailySummaryBody {
  recordDate: string
  dailyGoal: number
  dailyExerciseGoal: number
  currentWeight: number
  targetWeight: number
  activityLevel: 'low' | 'medium' | 'high'
  intakeTotal: number
  exerciseTotal: number
  basalBurn: number
  totalBurn: number
  netCalories: number
  foods: Array<{
    foodName: string
    mealType: MealType
    quantity: number
    unit: string
    totalCalories: number
  }>
  exercises: Array<{
    exerciseName: string
    durationMinutes: number
    totalCalories: number
  }>
}

export interface DietaryGapBody {
  recordDate: string
  dailyGoal: number
  currentWeight: number
  targetWeight: number
  intakeTotal: number
  exerciseTotal: number
  foods: Array<{
    foodName: string
    mealType: MealType
    quantity: number
    unit: string
    totalCalories: number
    note?: string
  }>
}

export interface ParsedFoodItem {
  mealType: MealType
  foodName: string
  quantity: number
  unit: string
  caloriesPerUnit: number
  totalCalories: number
  note: string
}

export interface ParseFoodTextResult {
  items: ParsedFoodItem[]
  totalCalories: number
  confidence: number
  notice: string
}

export interface DailySummaryResult {
  summary: string
  suggestion: string
  highlights: string[]
}

interface DietaryGapMetric {
  status: 'low' | 'adequate' | 'unknown'
  estimatedGrams?: number
  estimatedServings?: number
  targetGrams?: number
  targetServings?: number
  gapGrams?: number
  gapServings?: number
  message: string
}

export interface DietaryGapResult {
  protein: DietaryGapMetric & {
    estimatedGrams: number
    targetGrams: number
    gapGrams: number
  }
  vegetables: DietaryGapMetric & {
    estimatedServings: number
    targetServings: number
    gapServings: number
  }
  fiber: DietaryGapMetric & {
    estimatedGrams: number
    targetGrams: number
    gapGrams: number
  }
  calorieDistribution: {
    status: 'balanced' | 'skewed' | 'unknown'
    message: string
  }
  dinnerSuggestion: string
  highlights: string[]
  disclaimer: string
}

export interface ProviderAdapter {
  name: ProviderName
  isEnabled(env: Env): boolean
  generateStructuredOutput<TData>(
    env: Env,
    payload: StructuredGenerationRequest,
  ): Promise<StructuredGenerationResponse<TData>>
}
