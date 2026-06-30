import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getUserProfile, updateUserProfile } from '@/firebase/database'
import type { UserProfile } from '@/types/profile'

function createDefaultProfile(): UserProfile {
  return {
    nickname: '',
    gender: 'other',
    age: 18,
    height: 170,
    weight: 70,
    targetWeight: 65,
    dailyGoal: 2200,
    activityLevel: 'medium',
  }
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile>(createDefaultProfile())
  const isLoading = ref(false)

  const bmi = computed(() => {
    const heightInMeters = profile.value.height / 100

    if (!heightInMeters) {
      return 0
    }

    return Number((profile.value.weight / (heightInMeters * heightInMeters)).toFixed(1))
  })

  async function fetchProfile(userId: string) {
    isLoading.value = true

    try {
      const nextProfile = await getUserProfile(userId)

      if (nextProfile) {
        profile.value = nextProfile
      }
    } finally {
      isLoading.value = false
    }
  }

  async function saveProfile(userId: string, nextProfile: UserProfile) {
    isLoading.value = true

    try {
      await updateUserProfile(userId, nextProfile)
      profile.value = nextProfile
    } finally {
      isLoading.value = false
    }
  }

  return {
    bmi,
    isLoading,
    profile,
    fetchProfile,
    saveProfile,
  }
})
