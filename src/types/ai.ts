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

export interface DietaryGapRequest {
  recordDate: string
  dailyGoal: number
  currentWeight: number
  targetWeight: number
  intakeTotal: number
  exerciseTotal: number
  foods: FoodRecord[]
}

export type DietaryGapStatus = 'low' | 'adequate' | 'unknown'

export interface DietaryGapMetric {
  status: DietaryGapStatus
  estimatedGrams?: number
  estimatedServings?: number
  targetGrams?: number
  targetServings?: number
  gapGrams?: number
  gapServings?: number
  message: string
}

export interface DietaryGapResponse {
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
  provider: string
  model: string
}
