import type { ExerciseRecord } from '@/types/exercise'
import type { FoodRecord } from '@/types/food'
import type { WeightRecord } from '@/types/weight'

export interface DailyCalorieStat {
  date: string
  intake: number
  basalBurn: number
  exerciseBurn: number
  burn: number
  net: number
}

export interface WeightTrendStat {
  date: string
  weight: number
}

export function buildDailyCalorieStats(
  foods: FoodRecord[],
  exercises: ExerciseRecord[],
  basalBurnPerDay = 0,
): DailyCalorieStat[] {
  const map = new Map<string, DailyCalorieStat>()

  for (const food of foods) {
    const current = map.get(food.recordDate) ?? {
      date: food.recordDate,
      intake: 0,
      basalBurn: basalBurnPerDay,
      exerciseBurn: 0,
      burn: 0,
      net: 0,
    }

    current.intake += food.totalCalories
    current.burn = current.basalBurn + current.exerciseBurn
    current.net = current.intake - current.burn
    map.set(food.recordDate, current)
  }

  for (const exercise of exercises) {
    const current = map.get(exercise.recordDate) ?? {
      date: exercise.recordDate,
      intake: 0,
      basalBurn: basalBurnPerDay,
      exerciseBurn: 0,
      burn: 0,
      net: 0,
    }

    current.exerciseBurn += exercise.totalCalories
    current.burn = current.basalBurn + current.exerciseBurn
    current.net = current.intake - current.burn
    map.set(exercise.recordDate, current)
  }

  return [...map.values()].sort((left, right) => left.date.localeCompare(right.date))
}

export function buildWeightTrendStats(weights: WeightRecord[]): WeightTrendStat[] {
  return [...weights]
    .sort((left, right) => left.recordDate.localeCompare(right.recordDate))
    .map((item) => ({
      date: item.recordDate,
      weight: item.weight,
    }))
}

export function calculateAverage(values: number[]) {
  if (!values.length) {
    return 0
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

export function getLastItems<T>(items: T[], count: number) {
  return items.slice(Math.max(0, items.length - count))
}
