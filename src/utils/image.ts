const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('圖片讀取失敗。'))
    }

    reader.onerror = () => reject(new Error('圖片讀取失敗。'))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('圖片載入失敗。'))
    image.src = dataUrl
  })
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export async function createOptimizedMealPhotoDataUrl(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(originalDataUrl)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('瀏覽器目前無法處理圖片。')
  }

  context.drawImage(image, 0, 0, width, height)

  const optimizedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)

  if (optimizedDataUrl.length > 4_000_000) {
    throw new Error('圖片仍然過大，請改用較小的照片或先裁切後再上傳。')
  }

  return optimizedDataUrl
}
