import type { MealRecommendationResponse } from '@/types/ai'

const CANVAS_WIDTH = 1200
const HORIZONTAL_PADDING = 72
const CONTENT_WIDTH = CANVAS_WIDTH - HORIZONTAL_PADDING * 2

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const resolvedRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + resolvedRadius, y)
  context.arcTo(x + width, y, x + width, y + height, resolvedRadius)
  context.arcTo(x + width, y + height, x, y + height, resolvedRadius)
  context.arcTo(x, y + height, x, y, resolvedRadius)
  context.arcTo(x, y, x + width, y, resolvedRadius)
  context.closePath()
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let currentLine = ''

  for (const character of text) {
    const nextLine = `${currentLine}${character}`

    if (currentLine && context.measureText(nextLine).width > maxWidth) {
      lines.push(currentLine)
      currentLine = character
    } else {
      currentLine = nextLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length ? lines : ['']
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const lines = wrapText(context, text, maxWidth)

  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight)
  })

  return y + lines.length * lineHeight
}

function getMealTypeLabel(mealType: MealRecommendationResponse['mealType']) {
  const labels = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '點心',
    'midnight-snack': '宵夜',
  } as const

  return labels[mealType]
}

export async function downloadMealRecommendationImage(
  recommendation: MealRecommendationResponse,
  recordDate: string,
) {
  const canvas = document.createElement('canvas')
  const estimatedHeight = 920 + recommendation.recommendations.reduce(
    (total, item) => total
      + 240
      + item.items.length * 58
      + Math.ceil(item.description.length / 27) * 40
      + Math.ceil(item.reason.length / 30) * 36,
    0,
  )
  canvas.width = CANVAS_WIDTH
  canvas.height = Math.max(estimatedHeight, 1280)

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('瀏覽器目前無法產生圖片。')
  }

  const background = context.createLinearGradient(0, 0, CANVAS_WIDTH, canvas.height)
  background.addColorStop(0, '#edf9f1')
  background.addColorStop(0.48, '#f8fbff')
  background.addColorStop(1, '#fff4e4')
  context.fillStyle = background
  context.fillRect(0, 0, CANVAS_WIDTH, canvas.height)

  context.fillStyle = 'rgba(255, 255, 255, 0.68)'
  roundRect(context, 42, 42, CANVAS_WIDTH - 84, canvas.height - 84, 42)
  context.fill()

  let cursorY = 118
  context.fillStyle = '#2d7a56'
  context.font = '700 27px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
  context.fillText('CALORIE TRACKER · AI MEAL PLAN', HORIZONTAL_PADDING, cursorY)

  cursorY += 66
  context.fillStyle = '#203537'
  context.font = '700 54px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
  context.fillText(`個人化${getMealTypeLabel(recommendation.mealType)}建議`, HORIZONTAL_PADDING, cursorY)

  cursorY += 42
  context.fillStyle = '#617070'
  context.font = '400 25px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
  context.fillText(`${recordDate} · 依今日熱量、運動與飲食偏好生成`, HORIZONTAL_PADDING, cursorY)

  cursorY += 54
  context.fillStyle = '#e5f5ea'
  roundRect(context, HORIZONTAL_PADDING, cursorY, CONTENT_WIDTH, 148, 28)
  context.fill()
  context.fillStyle = '#2d7a56'
  context.font = '700 23px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
  context.fillText('本餐可用熱量', HORIZONTAL_PADDING + 30, cursorY + 47)
  context.font = '800 48px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
  context.fillText(`${Math.round(recommendation.remainingCalories)} kcal`, HORIZONTAL_PADDING + 30, cursorY + 105)

  cursorY += 192
  context.fillStyle = '#415b5c'
  context.font = '400 26px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
  cursorY = drawWrappedText(context, recommendation.summary, HORIZONTAL_PADDING, cursorY, CONTENT_WIDTH, 38) + 30

  for (const item of recommendation.recommendations) {
    const descriptionLines = Math.max(1, Math.ceil(item.description.length / 27))
    const cardHeight = 138 + descriptionLines * 38 + item.items.length * 54 + Math.ceil(item.reason.length / 30) * 32

    context.fillStyle = 'rgba(255, 255, 255, 0.84)'
    roundRect(context, HORIZONTAL_PADDING, cursorY, CONTENT_WIDTH, cardHeight, 28)
    context.fill()

    context.fillStyle = '#203537'
    context.font = '700 34px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
    context.fillText(item.name, HORIZONTAL_PADDING + 28, cursorY + 50)

    context.fillStyle = '#2d7a56'
    context.font = '700 25px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
    const caloriesLabel = `約 ${Math.round(item.estimatedCalories)} kcal`
    context.fillText(caloriesLabel, CANVAS_WIDTH - HORIZONTAL_PADDING - 28 - context.measureText(caloriesLabel).width, cursorY + 50)

    context.fillStyle = '#617070'
    context.font = '400 23px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
    let itemCursorY = drawWrappedText(context, item.description, HORIZONTAL_PADDING + 28, cursorY + 92, CONTENT_WIDTH - 56, 34) + 16

    for (const food of item.items) {
      context.fillStyle = '#eaf6ee'
      roundRect(context, HORIZONTAL_PADDING + 28, itemCursorY, CONTENT_WIDTH - 56, 42, 12)
      context.fill()
      context.fillStyle = '#31584b'
      context.font = '500 21px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
      context.fillText(`${food.name} · ${food.portion}`, HORIZONTAL_PADDING + 44, itemCursorY + 28)
      const foodCalories = `${Math.round(food.estimatedCalories)} kcal`
      context.fillText(foodCalories, CANVAS_WIDTH - HORIZONTAL_PADDING - 44 - context.measureText(foodCalories).width, itemCursorY + 28)
      itemCursorY += 52
    }

    context.fillStyle = '#617070'
    context.font = '400 21px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
    drawWrappedText(context, `推薦原因：${item.reason}`, HORIZONTAL_PADDING + 28, itemCursorY + 12, CONTENT_WIDTH - 56, 31)
    cursorY += cardHeight + 20
  }

  context.fillStyle = '#7b8989'
  context.font = '400 18px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
  drawWrappedText(context, recommendation.notice, HORIZONTAL_PADDING, cursorY + 8, CONTENT_WIDTH, 28)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) {
        resolve(nextBlob)
      } else {
        reject(new Error('圖片產生失敗，請稍後再試。'))
      }
    }, 'image/png')
  })

  const link = document.createElement('a')
  const objectUrl = URL.createObjectURL(blob)
  link.href = objectUrl
  link.download = `calorie-tracker-${recordDate}-${recommendation.mealType}-meal-plan.png`
  link.click()
  URL.revokeObjectURL(objectUrl)
}
