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
