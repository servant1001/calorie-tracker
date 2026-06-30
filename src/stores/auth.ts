import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { loginWithGoogle, logout, subscribeToAuthState } from '@/firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const displayName = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const email = ref<string | null>(null)
  const isReady = ref(false)
  const isLoading = ref(false)
  let unsubscribe: null | (() => void) = null

  const isAuthenticated = computed(() => Boolean(userId.value))

  function setSession(nextUserId: string, nextEmail: string | null, nextDisplayName?: string | null) {
    userId.value = nextUserId
    email.value = nextEmail
    displayName.value = nextDisplayName ?? null
  }

  function clearSession() {
    userId.value = null
    email.value = null
    displayName.value = null
  }

  function initialize() {
    if (unsubscribe) {
      return Promise.resolve()
    }

    isLoading.value = true

    return new Promise<void>((resolve) => {
      unsubscribe = subscribeToAuthState((user) => {
        if (user) {
          setSession(user.uid, user.email, user.displayName)
        } else {
          clearSession()
        }

        isReady.value = true
        isLoading.value = false
        resolve()
      })
    })
  }

  async function signInWithGoogle() {
    isLoading.value = true

    try {
      await loginWithGoogle()
    } finally {
      isLoading.value = false
    }
  }

  async function signOut() {
    isLoading.value = true

    try {
      await logout()
    } finally {
      isLoading.value = false
    }
  }

  return {
    displayName,
    email,
    isAuthenticated,
    isLoading,
    isReady,
    userId,
    initialize,
    signInWithGoogle,
    signOut,
    setSession,
    clearSession,
  }
})
