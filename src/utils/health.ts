import type { UserProfile } from '@/types/profile'

export function calculateBmi(weight: number, heightCm: number) {
  const heightInMeters = heightCm / 100

  if (!heightInMeters) {
    return 0
  }

  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

export function getBmiLabel(bmi: number) {
  if (bmi < 18.5) {
    return '過輕'
  }

  if (bmi < 24) {
    return '正常'
  }

  if (bmi < 27) {
    return '過重'
  }

  return '肥胖'
}

export function calculateBmr(profile: Pick<UserProfile, 'gender' | 'age' | 'height' | 'weight'>) {
  const { age, height, weight, gender } = profile

  if (!age || !height || !weight) {
    return 0
  }

  const base = 10 * weight + 6.25 * height - 5 * age

  if (gender === 'male') {
    return Math.round(base + 5)
  }

  if (gender === 'female') {
    return Math.round(base - 161)
  }

  // Infer a neutral adjustment for profiles that are not explicitly male/female.
  return Math.round(base - 78)
}
