import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { createWeight, deleteWeight, listWeights, updateWeight } from '@/api/weights'
import type { WeightFormPayload, WeightRecord } from '@/types/weight'

export const useWeightsStore = defineStore('weights', () => {
  const records = ref<WeightRecord[]>([])
  const isLoading = ref(false)
  const selectedDate = ref('')

  const filteredRecords = computed(() =>
    records.value.filter((record) => !selectedDate.value || record.recordDate === selectedDate.value),
  )

  const latestWeight = computed(() => records.value[0]?.weight ?? null)

  async function fetchWeights(userId: string) {
    isLoading.value = true

    try {
      records.value = await listWeights(userId)
    } finally {
      isLoading.value = false
    }
  }

  async function addWeight(userId: string, payload: WeightFormPayload) {
    const record = await createWeight(userId, payload)
    records.value = [record, ...records.value].sort((a, b) => b.recordDate.localeCompare(a.recordDate))
    return record
  }

  async function editWeight(userId: string, weightId: string, payload: WeightFormPayload) {
    const record = await updateWeight(userId, weightId, payload)
    records.value = records.value
      .map((item) => (item.id === weightId ? record : item))
      .sort((a, b) => b.recordDate.localeCompare(a.recordDate))
    return record
  }

  async function removeWeight(userId: string, weightId: string) {
    await deleteWeight(userId, weightId)
    records.value = records.value.filter((item) => item.id !== weightId)
  }

  function setDateFilter(recordDate: string) {
    selectedDate.value = recordDate
  }

  return {
    filteredRecords,
    isLoading,
    latestWeight,
    records,
    selectedDate,
    fetchWeights,
    addWeight,
    editWeight,
    removeWeight,
    setDateFilter,
  }
})
