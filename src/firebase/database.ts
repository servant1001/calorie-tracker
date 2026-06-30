import { get, ref, set } from 'firebase/database'

import type { UserProfile } from '@/types/profile'

import { database } from './config'

export async function createUserProfile(uid: string, profile: UserProfile) {
  await set(ref(database, `users/${uid}/profile`), profile)
}

export async function ensureUserProfile(uid: string, profile: UserProfile) {
  const profileRef = ref(database, `users/${uid}/profile`)
  const snapshot = await get(profileRef)

  if (!snapshot.exists()) {
    await set(profileRef, profile)
  }
}

export async function getUserProfile(uid: string) {
  const snapshot = await get(ref(database, `users/${uid}/profile`))

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.val() as UserProfile
}

export async function updateUserProfile(uid: string, profile: UserProfile) {
  await set(ref(database, `users/${uid}/profile`), profile)
}
