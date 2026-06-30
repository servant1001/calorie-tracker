export interface ExerciseRecord {
  id: string
  recordDate: string
  exerciseName: string
  durationMinutes: number
  caloriesPerMinute: number
  totalCalories: number
  note: string
}

export interface ExerciseFormPayload {
  recordDate: string
  exerciseName: string
  durationMinutes: number
  caloriesPerMinute: number
  note: string
}
