import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { calculateRemainingCalories } from '@/utils/calorie'

export const useDashboardStore = defineStore('dashboard', () => {
  const dailyGoal = ref(2200)
  const totalIntake = ref(0)
  const totalBurn = ref(0)

  const netCalories = computed(() => totalIntake.value - totalBurn.value)
  const remainingCalories = computed(() =>
    calculateRemainingCalories(dailyGoal.value, totalIntake.value),
  )

  return {
    dailyGoal,
    totalIntake,
    totalBurn,
    netCalories,
    remainingCalories,
  }
})
