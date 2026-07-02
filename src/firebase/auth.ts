import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth'
import type { FirebaseError } from 'firebase/app'

import type { RegisterForm } from '@/types/auth'
import type { UserProfile } from '@/types/profile'

import { auth } from './config'
import { createUserProfile, ensureUserProfile } from './database'

const googleProvider = new GoogleAuthProvider()

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function waitForAuthSession(user: User) {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady()
  }

  if (auth.currentUser?.uid !== user.uid) {
    await new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        if (nextUser?.uid === user.uid) {
          unsubscribe()
          resolve()
        }
      })
    })
  }

  await user.getIdToken()
  await delay(200)
}

function isPermissionDeniedError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as FirebaseError).code === 'PERMISSION_DENIED'
  )
}

async function writeProfileWithRetry(user: User, profile: UserProfile, mode: 'create' | 'ensure') {
  const runWrite = () =>
    mode === 'create'
      ? createUserProfile(user.uid, profile)
      : ensureUserProfile(user.uid, profile)

  await waitForAuthSession(user)

  try {
    await runWrite()
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      throw error
    }

    await user.getIdToken(true)
    await waitForAuthSession(user)
    await runWrite()
  }
}

function buildDefaultProfile(overrides?: Partial<UserProfile>): UserProfile {
  return {
    nickname: '',
    gender: 'other',
    age: 18,
    height: 170,
    weight: 70,
    targetWeight: 65,
    dailyGoal: 2200,
    dailyExerciseGoal: 300,
    activityLevel: 'medium',
    ...overrides,
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function registerWithEmail(form: RegisterForm) {
  const credential = await createUserWithEmailAndPassword(auth, form.email, form.password)

  if (form.nickname) {
    await updateProfile(credential.user, {
      displayName: form.nickname,
    })
  }

  await writeProfileWithRetry(
    credential.user,
    buildDefaultProfile({
      nickname: form.nickname,
    }),
    'create',
  )

  return credential
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider)

  await ensureProfileForUser(credential)

  return credential
}

export async function ensureProfileForUser(credential: UserCredential) {
  const { user } = credential

  await writeProfileWithRetry(
    user,
    buildDefaultProfile({
      nickname: user.displayName ?? '',
    }),
    'ensure',
  )
}

export function logout() {
  return signOut(auth)
}
