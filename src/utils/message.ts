import { ElMessage } from 'element-plus'

export function showSuccess(message: string) {
  ElMessage.success(message)
}

export function showError(error: unknown, fallback = '發生未預期錯誤，請稍後再試。') {
  if (error instanceof Error && error.message) {
    ElMessage.error(error.message)
    return
  }

  ElMessage.error(fallback)
}
