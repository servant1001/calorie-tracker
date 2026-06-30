import { get, push, ref, remove, set, update } from 'firebase/database'

import { database } from '@/firebase/config'
import type { FoodFormPayload, FoodRecord } from '@/types/food'
import { calculateFoodCalories } from '@/utils/calorie'

function getFoodsCollectionRef(userId: string) {
  return ref(database, `foods/${userId}`)
}

function buildFoodRecord(id: string, payload: FoodFormPayload): FoodRecord {
  return {
    id,
    ...payload,
    totalCalories: calculateFoodCalories(payload.quantity, payload.caloriesPerUnit),
  }
}

export async function listFoods(userId: string): Promise<FoodRecord[]> {
  const snapshot = await get(getFoodsCollectionRef(userId))

  if (!snapshot.exists()) {
    return []
  }

  const value = snapshot.val() as Record<string, Omit<FoodRecord, 'id'>>

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

export async function createFood(userId: string, payload: FoodFormPayload): Promise<FoodRecord> {
  const newFoodRef = push(getFoodsCollectionRef(userId))

  if (!newFoodRef.key) {
    throw new Error('建立飲食紀錄失敗，請稍後再試。')
  }

  const record = buildFoodRecord(newFoodRef.key, payload)

  await set(newFoodRef, record)

  return record
}

export async function updateFood(
  userId: string,
  foodId: string,
  payload: FoodFormPayload,
): Promise<FoodRecord> {
  const record = buildFoodRecord(foodId, payload)

  await update(ref(database, `foods/${userId}/${foodId}`), record)

  return record
}

export async function deleteFood(userId: string, foodId: string) {
  await remove(ref(database, `foods/${userId}/${foodId}`))
}
