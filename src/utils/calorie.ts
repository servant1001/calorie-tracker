export function calculateFoodCalories(quantity: number, caloriesPerUnit: number) {
  return quantity * caloriesPerUnit
}

export function calculateExerciseCalories(durationMinutes: number, caloriesPerMinute: number) {
  return durationMinutes * caloriesPerMinute
}

export function calculateNetCalories(totalIntake: number, totalBurn: number) {
  return totalIntake - totalBurn
}

export function calculateRemainingCalories(dailyGoal: number, totalIntake: number) {
  return dailyGoal - totalIntake
}
