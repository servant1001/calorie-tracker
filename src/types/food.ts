import type { MealType } from './common'

export interface FoodRecord {
  id: string
  recordDate: string
  mealType: MealType
  foodName: string
  quantity: number
  unit: string
  caloriesPerUnit: number
  totalCalories: number
  note: string
}

export interface FoodFormPayload {
  recordDate: string
  mealType: MealType
  foodName: string
  quantity: number
  unit: string
  caloriesPerUnit: number
  totalCalories?: number
  note: string
}
