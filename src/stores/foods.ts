import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { createFood, deleteFood, listFoods, updateFood } from '@/api/foods'
import type { MealType } from '@/types/common'
import type { FoodFormPayload, FoodRecord } from '@/types/food'

export const useFoodsStore = defineStore('foods', () => {
  const records = ref<FoodRecord[]>([])
  const isLoading = ref(false)
  const selectedDate = ref('')
  const selectedMealType = ref<MealType | ''>('')

  const filteredRecords = computed(() =>
    records.value.filter((record) => {
      const matchesDate = !selectedDate.value || record.recordDate === selectedDate.value
      const matchesMealType = !selectedMealType.value || record.mealType === selectedMealType.value

      return matchesDate && matchesMealType
    }),
  )

  const totalCalories = computed(() =>
    filteredRecords.value.reduce((sum, record) => sum + record.totalCalories, 0),
  )

  async function fetchFoods(userId: string) {
    isLoading.value = true

    try {
      records.value = await listFoods(userId)
    } finally {
      isLoading.value = false
    }
  }

  async function addFood(userId: string, payload: FoodFormPayload) {
    const record = await createFood(userId, payload)
    records.value = [record, ...records.value]
    return record
  }

  async function editFood(userId: string, foodId: string, payload: FoodFormPayload) {
    const record = await updateFood(userId, foodId, payload)
    records.value = records.value.map((item) => (item.id === foodId ? record : item))
    records.value.sort((left, right) => {
      if (left.recordDate === right.recordDate) {
        return right.id.localeCompare(left.id)
      }

      return right.recordDate.localeCompare(left.recordDate)
    })
    return record
  }

  async function removeFood(userId: string, foodId: string) {
    await deleteFood(userId, foodId)
    records.value = records.value.filter((item) => item.id !== foodId)
  }

  function setFilters(recordDate: string, mealType: MealType | '') {
    selectedDate.value = recordDate
    selectedMealType.value = mealType
  }

  return {
    filteredRecords,
    isLoading,
    records,
    selectedDate,
    selectedMealType,
    totalCalories,
    fetchFoods,
    addFood,
    editFood,
    removeFood,
    setFilters,
  }
})
