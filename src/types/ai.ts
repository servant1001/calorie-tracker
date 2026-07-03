import type { ActivityLevel, MealType } from './common'
import type { ExerciseRecord } from './exercise'
import type { FoodRecord } from './food'

export interface AiParsedFoodItem {
  mealType: MealType
  foodName: string
  quantity: number
  unit: string
  caloriesPerUnit: number
  totalCalories: number
  note: string
}

export interface ParseFoodTextRequest {
  text: string
  recordDate: string
  locale?: string
}

export interface ParseFoodTextResponse {
  items: AiParsedFoodItem[]
  totalCalories: number
  confidence: number
  notice: string
  provider: string
  model: string
}

export interface MealPhotoRequest {
  imageUrl: string
  recordDate: string
  locale?: string
}

export interface DailySummaryRequest {
  recordDate: string
  dailyGoal: number
  dailyExerciseGoal: number
  currentWeight: number
  targetWeight: number
  activityLevel: ActivityLevel
  intakeTotal: number
  exerciseTotal: number
  basalBurn: number
  totalBurn: number
  netCalories: number
  foods: FoodRecord[]
  exercises: ExerciseRecord[]
}

export interface DailySummaryResponse {
  summary: string
  suggestion: string
  highlights: string[]
  provider: string
  model: string
}
