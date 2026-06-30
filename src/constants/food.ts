import type { MealType } from '@/types/common'

export const MEAL_TYPE_OPTIONS: Array<{ label: string; value: MealType }> = [
  { label: '早餐', value: 'breakfast' },
  { label: '午餐', value: 'lunch' },
  { label: '晚餐', value: 'dinner' },
  { label: '點心', value: 'snack' },
  { label: '宵夜', value: 'midnight-snack' },
]

export const MEAL_TYPE_LABEL_MAP: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '點心',
  'midnight-snack': '宵夜',
}
