<script setup lang="ts">
import { Bot, Brain, Sparkles, Utensils } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import { generateDailySummary, parseFoodText } from '@/api/ai'
import { useFoodsStore } from '@/stores/foods'
import type { DailySummaryResponse } from '@/types/ai'
import type { ActivityLevel, MealType } from '@/types/common'
import type { ExerciseRecord } from '@/types/exercise'
import type { FoodFormPayload, FoodRecord } from '@/types/food'
import { showError, showSuccess } from '@/utils/message'

interface AiDraftFoodItem {
  mealType: MealType
  foodName: string
  quantity: number
  unit: string
  caloriesPerUnit: number
  note: string
}

const props = defineProps<{
  activityLevel: ActivityLevel
  basalBurn: number
  currentWeight: number
  dailyExerciseGoal: number
  dailyGoal: number
  exercises: ExerciseRecord[]
  exerciseTotal: number
  foods: FoodRecord[]
  intakeTotal: number
  netCalories: number
  recordDate: string
  targetWeight: number
  totalBurn: number
  userId: null | string
}>()

const emit = defineEmits<{
  saved: [count: number]
}>()

const foodsStore = useFoodsStore()

const mealOptions: Array<{ label: string; value: MealType }> = [
  { label: '早餐', value: 'breakfast' },
  { label: '午餐', value: 'lunch' },
  { label: '晚餐', value: 'dinner' },
  { label: '點心', value: 'snack' },
  { label: '宵夜', value: 'midnight-snack' },
]

const inputText = ref('')
const notice = ref('')
const confidence = ref(0)
const providerLabel = ref('')
const parsedItems = ref<AiDraftFoodItem[]>([])
const isParsing = ref(false)
const isSaving = ref(false)
const isGeneratingSummary = ref(false)
const summary = ref<DailySummaryResponse | null>(null)

const parsedTotalCalories = computed(() =>
  parsedItems.value.reduce((sum, item) => sum + Math.round(item.quantity * item.caloriesPerUnit), 0),
)

const hasParsedItems = computed(() => parsedItems.value.length > 0)

const hasDailyRecords = computed(() => props.foods.length > 0 || props.exercises.length > 0)

function createDraftItem(item?: Partial<AiDraftFoodItem>): AiDraftFoodItem {
  return {
    mealType: item?.mealType ?? 'breakfast',
    foodName: item?.foodName?.trim() ?? '',
    quantity: Number(item?.quantity ?? 1),
    unit: item?.unit?.trim() ?? '份',
    caloriesPerUnit: Number(item?.caloriesPerUnit ?? 0),
    note: item?.note?.trim() ?? '',
  }
}

function resetParsedItems() {
  parsedItems.value = []
  notice.value = ''
  confidence.value = 0
  providerLabel.value = ''
}

function addEmptyItem() {
  parsedItems.value = [...parsedItems.value, createDraftItem()]
}

function removeItem(index: number) {
  parsedItems.value = parsedItems.value.filter((_, itemIndex) => itemIndex !== index)
}

async function handleParseFoodText() {
  if (!inputText.value.trim()) {
    showError(new Error('請先輸入今天吃了什麼。'))
    return
  }

  isParsing.value = true

  try {
    const response = await parseFoodText({
      text: inputText.value.trim(),
      recordDate: props.recordDate,
      locale: 'zh-TW',
    })

    parsedItems.value = response.items.map((item) =>
      createDraftItem({
        mealType: item.mealType,
        foodName: item.foodName,
        quantity: item.quantity,
        unit: item.unit,
        caloriesPerUnit: item.caloriesPerUnit,
        note: item.note,
      }),
    )
    notice.value = response.notice
    confidence.value = Math.round(response.confidence * 100)
    providerLabel.value = `${response.provider} · ${response.model}`

    if (!response.items.length) {
      showError(new Error('AI 目前沒有成功解析出可保存的飲食項目，請換個描述方式再試一次。'))
    }
  } catch (error) {
    showError(error, 'AI 飲食解析失敗，請稍後再試。')
  } finally {
    isParsing.value = false
  }
}

async function handleSaveFoods() {
  if (!props.userId) {
    showError(new Error('目前尚未登入，無法保存 AI 解析結果。'))
    return
  }

  if (!parsedItems.value.length) {
    showError(new Error('目前沒有可保存的飲食項目。'))
    return
  }

  const payloads = parsedItems.value
    .map<FoodFormPayload | null>((item) => {
      const foodName = item.foodName.trim()
      const quantity = Number(item.quantity)
      const caloriesPerUnit = Number(item.caloriesPerUnit)

      if (!foodName || quantity <= 0 || caloriesPerUnit < 0) {
        return null
      }

      return {
        recordDate: props.recordDate,
        mealType: item.mealType,
        foodName,
        quantity,
        unit: item.unit.trim() || '份',
        caloriesPerUnit,
        note: item.note.trim(),
      }
    })
    .filter((item): item is FoodFormPayload => Boolean(item))

  if (!payloads.length) {
    showError(new Error('請先補齊食物名稱、份量與熱量後再保存。'))
    return
  }

  isSaving.value = true

  try {
    for (const payload of payloads) {
      await foodsStore.addFood(props.userId, payload)
    }

    showSuccess(`已新增 ${payloads.length} 筆 AI 飲食紀錄`)
    emit('saved', payloads.length)
    inputText.value = ''
    resetParsedItems()
  } catch (error) {
    showError(error, '保存 AI 飲食紀錄失敗，請稍後再試。')
  } finally {
    isSaving.value = false
  }
}

async function handleGenerateSummary() {
  if (!hasDailyRecords.value) {
    showError(new Error('今天還沒有飲食或運動資料，暫時無法產生 AI 摘要。'))
    return
  }

  isGeneratingSummary.value = true

  try {
    summary.value = await generateDailySummary({
      recordDate: props.recordDate,
      dailyGoal: props.dailyGoal,
      dailyExerciseGoal: props.dailyExerciseGoal,
      currentWeight: props.currentWeight,
      targetWeight: props.targetWeight,
      activityLevel: props.activityLevel,
      intakeTotal: props.intakeTotal,
      exerciseTotal: props.exerciseTotal,
      basalBurn: props.basalBurn,
      totalBurn: props.totalBurn,
      netCalories: props.netCalories,
      foods: props.foods,
      exercises: props.exercises,
    })
  } catch (error) {
    showError(error, 'AI 今日分析失敗，請稍後再試。')
  } finally {
    isGeneratingSummary.value = false
  }
}

watch(
  () => props.recordDate,
  () => {
    summary.value = null
    resetParsedItems()
    inputText.value = ''
  },
)
</script>

<template>
  <el-card shadow="hover" class="content-card dashboard-section ai-card">
    <template #header>
      <div class="card-header ai-card__header">
        <div>
          <span>AI 健康助手</span>
          <p class="card-subtitle">先用自然語言快速記錄飲食，再產生今天的 AI 健康摘要。</p>
        </div>

        <div class="ai-card__badge">
          <Sparkles :size="16" />
          <span>AI Assist</span>
        </div>
      </div>
    </template>

    <div class="ai-card__grid">
      <section class="ai-panel ai-panel--input">
        <div class="ai-panel__heading">
          <div class="ai-panel__icon">
            <Utensils :size="18" />
          </div>
          <div>
            <strong>文字解析飲食</strong>
            <p>例如：早餐吃了鮪魚蛋吐司一份、無糖豆漿 350ml。</p>
          </div>
        </div>

        <el-input
          v-model="inputText"
          type="textarea"
          :rows="5"
          resize="none"
          placeholder="輸入今天吃了什麼、份量與餐別，AI 會幫你拆成可編輯的飲食紀錄。"
        />

        <div class="ai-panel__actions">
          <el-button type="primary" :loading="isParsing" @click="handleParseFoodText">
            AI 解析飲食
          </el-button>
          <el-button plain @click="addEmptyItem">手動新增一筆</el-button>
        </div>

        <div v-if="notice || providerLabel" class="ai-meta">
          <el-tag v-if="notice" effect="dark" round class="ai-meta__tag ai-meta__tag--notice">
            {{ notice }}
          </el-tag>
          <el-tag v-if="confidence" round class="ai-meta__tag">
            信心 {{ confidence }}%
          </el-tag>
          <span v-if="providerLabel" class="ai-meta__provider">{{ providerLabel }}</span>
        </div>

        <div v-if="hasParsedItems" class="draft-list">
          <article v-for="(item, index) in parsedItems" :key="`${item.foodName}-${index}`" class="draft-item">
            <div class="draft-item__top">
              <strong>項目 {{ index + 1 }}</strong>
              <el-button text type="danger" @click="removeItem(index)">刪除</el-button>
            </div>

            <div class="draft-item__grid">
              <el-form-item label="餐別">
                <el-select v-model="item.mealType">
                  <el-option
                    v-for="option in mealOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="食物名稱">
                <el-input v-model="item.foodName" />
              </el-form-item>

              <el-form-item label="份量">
                <el-input-number v-model="item.quantity" :min="0" :step="0.5" :precision="1" />
              </el-form-item>

              <el-form-item label="單位">
                <el-input v-model="item.unit" />
              </el-form-item>

              <el-form-item label="每份熱量">
                <el-input-number v-model="item.caloriesPerUnit" :min="0" :step="10" />
              </el-form-item>

              <el-form-item label="估算總熱量">
                <div class="draft-item__total">
                  {{ Math.round(item.quantity * item.caloriesPerUnit) }} kcal
                </div>
              </el-form-item>
            </div>

            <el-form-item label="備註">
              <el-input v-model="item.note" placeholder="例如：AI 估算值，之後可再修正" />
            </el-form-item>
          </article>

          <div class="draft-footer">
            <div>
              <span>本次預計新增</span>
              <strong>{{ parsedItems.length }} 筆</strong>
              <p>合計約 {{ parsedTotalCalories }} kcal</p>
            </div>

            <el-button type="success" :loading="isSaving" @click="handleSaveFoods">
              確認寫入今日飲食
            </el-button>
          </div>
        </div>
      </section>

      <section class="ai-panel ai-panel--summary">
        <div class="ai-panel__heading">
          <div class="ai-panel__icon ai-panel__icon--summary">
            <Brain :size="18" />
          </div>
          <div>
            <strong>今日 AI 摘要</strong>
            <p>依照今天的飲食、運動、BMR 與熱量差額給你簡短建議。</p>
          </div>
        </div>

        <div class="summary-stats">
          <div class="summary-stat">
            <span>攝取</span>
            <strong>{{ intakeTotal }} kcal</strong>
          </div>
          <div class="summary-stat">
            <span>運動消耗</span>
            <strong>{{ exerciseTotal }} kcal</strong>
          </div>
          <div class="summary-stat">
            <span>淨熱量</span>
            <strong>{{ netCalories }} kcal</strong>
          </div>
        </div>

        <el-button
          class="summary-generate"
          type="primary"
          plain
          :loading="isGeneratingSummary"
          @click="handleGenerateSummary"
        >
          產生今日 AI 分析
        </el-button>

        <div v-if="summary" class="summary-result">
          <div class="summary-result__intro">
            <div class="summary-result__icon">
              <Bot :size="18" />
            </div>
            <div>
              <strong>AI 今日回顧</strong>
              <p>{{ summary.provider }} · {{ summary.model }}</p>
            </div>
          </div>

          <article class="summary-block">
            <span>整體摘要</span>
            <p>{{ summary.summary }}</p>
          </article>

          <article class="summary-block">
            <span>今日建議</span>
            <p>{{ summary.suggestion }}</p>
          </article>

          <article v-if="summary.highlights.length" class="summary-block">
            <span>重點提醒</span>
            <ul class="summary-list">
              <li v-for="item in summary.highlights" :key="item">{{ item }}</li>
            </ul>
          </article>
        </div>

        <el-empty v-else description="按下按鈕後，AI 會依今日資料產生分析。" />
      </section>
    </div>
  </el-card>
</template>

<style scoped>
.ai-card__header {
  gap: 16px;
}

.ai-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(233, 248, 232, 0.74), rgba(219, 244, 229, 0.34));
  color: #226448;
  border: 1px solid rgba(255, 255, 255, 0.46);
  font-size: 13px;
  font-weight: 700;
  box-shadow:
    0 12px 24px rgba(45, 122, 86, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px) saturate(140%);
}

.ai-card__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 18px;
}

.ai-panel {
  padding: 20px;
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.16));
  border: 1px solid rgba(255, 255, 255, 0.46);
  box-shadow:
    0 18px 36px rgba(33, 58, 55, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(22px) saturate(145%);
}

.ai-panel__heading {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
}

.ai-panel__heading strong {
  display: block;
  margin-bottom: 4px;
  font-size: 18px;
}

.ai-panel__heading p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.ai-panel__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, rgba(241, 255, 240, 0.88), rgba(216, 244, 216, 0.48));
  border: 1px solid rgba(255, 255, 255, 0.48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.ai-panel__icon--summary {
  background: linear-gradient(145deg, rgba(233, 244, 255, 0.88), rgba(213, 233, 255, 0.48));
}

.ai-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.ai-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.ai-meta__tag {
  border: none;
}

.ai-meta__tag--notice {
  background: linear-gradient(135deg, rgba(255, 242, 215, 0.92), rgba(255, 228, 181, 0.88));
  color: #8a5300;
}

.ai-meta__provider {
  color: var(--text-muted);
  font-size: 13px;
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
}

.draft-item {
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.2));
  border: 1px solid rgba(255, 255, 255, 0.48);
}

.draft-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.draft-item__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.draft-item__total {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  color: var(--text-main);
  font-weight: 700;
}

.draft-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(233, 248, 232, 0.54), rgba(218, 245, 217, 0.22));
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.draft-footer span,
.draft-footer p {
  color: var(--text-muted);
}

.draft-footer strong {
  display: inline-block;
  margin-left: 8px;
  font-size: 22px;
}

.draft-footer p {
  margin: 4px 0 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-stat {
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.2));
  border: 1px solid rgba(255, 255, 255, 0.46);
}

.summary-stat span {
  display: block;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 13px;
}

.summary-stat strong {
  font-size: 22px;
}

.summary-generate {
  width: 100%;
  margin-top: 16px;
}

.summary-result {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
}

.summary-result__intro {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(233, 244, 255, 0.56), rgba(212, 231, 255, 0.24));
  border: 1px solid rgba(255, 255, 255, 0.46);
}

.summary-result__intro p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.summary-result__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.68);
}

.summary-block {
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.18));
  border: 1px solid rgba(255, 255, 255, 0.46);
}

.summary-block span {
  display: block;
  margin-bottom: 10px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
}

.summary-block p {
  margin: 0;
  line-height: 1.7;
}

.summary-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-main);
}

.summary-list li + li {
  margin-top: 8px;
}

.ai-panel :deep(.el-form-item) {
  margin-bottom: 12px;
}

.ai-panel :deep(.el-form-item__label) {
  color: var(--text-muted);
}

.ai-panel :deep(.el-textarea__inner),
.ai-panel :deep(.el-input__wrapper),
.ai-panel :deep(.el-select__wrapper),
.ai-panel :deep(.el-input-number) {
  border-radius: 16px;
}

@media (max-width: 1080px) {
  .ai-card__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .draft-item__grid,
  .summary-stats {
    grid-template-columns: 1fr;
  }

  .draft-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
