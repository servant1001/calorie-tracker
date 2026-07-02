import type { ActivityLevel } from './common'

export interface UserProfile {
  nickname: string
  gender: 'male' | 'female' | 'other'
  age: number
  height: number
  weight: number
  targetWeight: number
  dailyGoal: number
  dailyExerciseGoal: number
  activityLevel: ActivityLevel
}
