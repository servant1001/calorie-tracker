import { get, push, ref, remove, set, update } from 'firebase/database'

import { database } from '@/firebase/config'
import type { ExerciseFormPayload, ExerciseRecord } from '@/types/exercise'
import { calculateExerciseCalories } from '@/utils/calorie'

function getExercisesCollectionRef(userId: string) {
  return ref(database, `exercises/${userId}`)
}

function buildExerciseRecord(id: string, payload: ExerciseFormPayload): ExerciseRecord {
  const totalCalories = typeof payload.totalCalories === 'number'
    ? payload.totalCalories
    : calculateExerciseCalories(payload.durationMinutes, payload.caloriesPerMinute)

  return {
    id,
    ...payload,
    totalCalories,
  }
}

export async function listExercises(userId: string): Promise<ExerciseRecord[]> {
  const snapshot = await get(getExercisesCollectionRef(userId))

  if (!snapshot.exists()) {
    return []
  }

  const value = snapshot.val() as Record<string, Omit<ExerciseRecord, 'id'>>

  return Object.entries(value)
    .map(([id, item]) => ({
      id,
      ...item,
    }))
    .sort((left, right) => {
      if (left.recordDate === right.recordDate) {
        return right.id.localeCompare(left.id)
      }

      return right.recordDate.localeCompare(left.recordDate)
    })
}

export async function createExercise(
  userId: string,
  payload: ExerciseFormPayload,
): Promise<ExerciseRecord> {
  const newExerciseRef = push(getExercisesCollectionRef(userId))

  if (!newExerciseRef.key) {
    throw new Error('建立運動紀錄失敗，請稍後再試。')
  }

  const record = buildExerciseRecord(newExerciseRef.key, payload)

  await set(newExerciseRef, record)

  return record
}

export async function updateExercise(
  userId: string,
  exerciseId: string,
  payload: ExerciseFormPayload,
): Promise<ExerciseRecord> {
  const record = buildExerciseRecord(exerciseId, payload)

  await update(ref(database, `exercises/${userId}/${exerciseId}`), record)

  return record
}

export async function deleteExercise(userId: string, exerciseId: string) {
  await remove(ref(database, `exercises/${userId}/${exerciseId}`))
}
