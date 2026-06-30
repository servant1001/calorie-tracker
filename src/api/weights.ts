import { get, push, ref, remove, set, update } from 'firebase/database'

import { database } from '@/firebase/config'
import type { WeightFormPayload, WeightRecord } from '@/types/weight'

function getWeightsCollectionRef(userId: string) {
  return ref(database, `weights/${userId}`)
}

function buildWeightRecord(id: string, payload: WeightFormPayload): WeightRecord {
  return {
    id,
    ...payload,
  }
}

export async function listWeights(userId: string): Promise<WeightRecord[]> {
  const snapshot = await get(getWeightsCollectionRef(userId))

  if (!snapshot.exists()) {
    return []
  }

  const value = snapshot.val() as Record<string, Omit<WeightRecord, 'id'>>

  return Object.entries(value)
    .map(([id, item]) => ({
      id,
      ...item,
    }))
    .sort((left, right) => right.recordDate.localeCompare(left.recordDate))
}

export async function createWeight(userId: string, payload: WeightFormPayload): Promise<WeightRecord> {
  const newWeightRef = push(getWeightsCollectionRef(userId))

  if (!newWeightRef.key) {
    throw new Error('建立體重紀錄失敗，請稍後再試。')
  }

  const record = buildWeightRecord(newWeightRef.key, payload)

  await set(newWeightRef, record)

  return record
}

export async function updateWeight(
  userId: string,
  weightId: string,
  payload: WeightFormPayload,
): Promise<WeightRecord> {
  const record = buildWeightRecord(weightId, payload)
  await update(ref(database, `weights/${userId}/${weightId}`), record)
  return record
}

export async function deleteWeight(userId: string, weightId: string) {
  await remove(ref(database, `weights/${userId}/${weightId}`))
}
