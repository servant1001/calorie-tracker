import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { createExercise, deleteExercise, listExercises, updateExercise } from '@/api/exercises'
import type { ExerciseFormPayload, ExerciseRecord } from '@/types/exercise'

export const useExercisesStore = defineStore('exercises', () => {
  const records = ref<ExerciseRecord[]>([])
  const isLoading = ref(false)
  const selectedDate = ref('')

  const filteredRecords = computed(() =>
    records.value.filter((record) => !selectedDate.value || record.recordDate === selectedDate.value),
  )

  const totalCalories = computed(() =>
    filteredRecords.value.reduce((sum, record) => sum + record.totalCalories, 0),
  )

  async function fetchExercises(userId: string) {
    isLoading.value = true

    try {
      records.value = await listExercises(userId)
    } finally {
      isLoading.value = false
    }
  }

  async function addExercise(userId: string, payload: ExerciseFormPayload) {
    const record = await createExercise(userId, payload)
    records.value = [record, ...records.value]
    return record
  }

  async function editExercise(userId: string, exerciseId: string, payload: ExerciseFormPayload) {
    const record = await updateExercise(userId, exerciseId, payload)
    records.value = records.value.map((item) => (item.id === exerciseId ? record : item))
    records.value.sort((left, right) => {
      if (left.recordDate === right.recordDate) {
        return right.id.localeCompare(left.id)
      }

      return right.recordDate.localeCompare(left.recordDate)
    })
    return record
  }

  async function removeExercise(userId: string, exerciseId: string) {
    await deleteExercise(userId, exerciseId)
    records.value = records.value.filter((item) => item.id !== exerciseId)
  }

  function setDateFilter(recordDate: string) {
    selectedDate.value = recordDate
  }

  return {
    filteredRecords,
    isLoading,
    records,
    selectedDate,
    totalCalories,
    fetchExercises,
    addExercise,
    editExercise,
    removeExercise,
    setDateFilter,
  }
})
