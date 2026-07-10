<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { Calendar, Delete, EditPen, Plus, RefreshRight } from '@element-plus/icons-vue'
import { Camera, ImagePlus, Sparkles } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { analyzeMealPhoto, parseFoodText } from '@/api/ai'
import { MEAL_TYPE_LABEL_MAP, MEAL_TYPE_OPTIONS } from '@/constants/food'
import { useAuthStore } from '@/stores/auth'
import { useFoodsStore } from '@/stores/foods'
import type { MealType } from '@/types/common'
import type { AiParsedFoodItem } from '@/types/ai'
import type { FoodFormPayload, FoodRecord } from '@/types/food'
import { formatDate } from '@/utils/date'
import { createOptimizedMealPhotoDataUrl } from '@/utils/image'
import { showError, showSuccess } from '@/utils/message'

const authStore = useAuthStore()
const foodsStore = useFoodsStore()
const formRef = ref<FormInstance>()
const isDialogVisible = ref(false)
const isSubmitting = ref(false)
const editingFoodId = ref<string | null>(null)
const useManualTotalCalories = ref(false)
const isAiAssistVisible = ref(false)
const aiFoodText = ref('')
const aiSuggestions = ref<AiParsedFoodItem[]>([])
const aiNotice = ref('')
const aiProviderLabel = ref('')
const aiConfidence = ref(0)
const isAiParsing = ref(false)
const isAiAnalyzingPhoto = ref(false)
const isSavingAiSuggestions = ref(false)
const aiPhotoDataUrl = ref('')
const aiPhotoFileName = ref('')
const aiPhotoInputRef = ref<HTMLInputElement>()

const filters = reactive({
  recordDate: formatDate(new Date()),
  mealType: '' as MealType | '',
})

const form = reactive<FoodFormPayload>({
  recordDate: formatDate(new Date()),
  mealType: 'breakfast',
  foodName: '',
  quantity: 1,
  unit: '份',
  caloriesPerUnit: 0,
  totalCalories: 0,
  note: '',
})

const rules: FormRules<FoodFormPayload> = {
  recordDate: [{ required: true, message: '請選擇日期', trigger: 'change' }],
  mealType: [{ required: true, message: '請選擇餐別', trigger: 'change' }],
  foodName: [{ required: true, message: '請輸入食物名稱', trigger: 'blur' }],
  quantity: [{ required: true, message: '請輸入份量', trigger: 'blur' }],
  unit: [{ required: true, message: '請輸入單位', trigger: 'blur' }],
  caloriesPerUnit: [{ required: true, message: '請輸入每份熱量', trigger: 'blur' }],
}

const dialogTitle = computed(() => (editingFoodId.value ? '編輯飲食紀錄' : '新增飲食紀錄'))
const filteredRecords = computed(() => foodsStore.filteredRecords)
const totalCalories = computed(() => foodsStore.totalCalories)
const todayCount = computed(() => filteredRecords.value.length)
const calculatedTotalCalories = computed(() =>
  Math.round(form.quantity * form.caloriesPerUnit),
)
const aiSuggestionsTotalCalories = computed(() =>
  aiSuggestions.value.reduce((total, item) => total + Math.round(Number(item.totalCalories) || 0), 0),
)

watch(
  () => [filters.recordDate, filters.mealType] as const,
  ([recordDate, mealType]) => {
    foodsStore.setFilters(recordDate, mealType)
  },
  { immediate: true },
)

function resetForm() {
  form.recordDate = filters.recordDate || formatDate(new Date())
  form.mealType = 'breakfast'
  form.foodName = ''
  form.quantity = 1
  form.unit = '份'
  form.caloriesPerUnit = 0
  form.totalCalories = 0
  form.note = ''
  editingFoodId.value = null
  useManualTotalCalories.value = false
  resetAiAssist()
}

function openCreateDialog() {
  resetForm()
  isDialogVisible.value = true
}

function openEditDialog(record: FoodRecord) {
  editingFoodId.value = record.id
  form.recordDate = record.recordDate
  form.mealType = record.mealType
  form.foodName = record.foodName
  form.quantity = record.quantity
  form.unit = record.unit
  form.caloriesPerUnit = record.caloriesPerUnit
  form.totalCalories = record.totalCalories
  form.note = record.note
  useManualTotalCalories.value = record.totalCalories !== record.quantity * record.caloriesPerUnit
  isDialogVisible.value = true
}

function resetAiAssist() {
  isAiAssistVisible.value = false
  aiFoodText.value = ''
  aiSuggestions.value = []
  aiNotice.value = ''
  aiProviderLabel.value = ''
  aiConfidence.value = 0
  aiPhotoDataUrl.value = ''
  aiPhotoFileName.value = ''

  if (aiPhotoInputRef.value) {
    aiPhotoInputRef.value.value = ''
  }
}

function setAiSuggestions(
  items: AiParsedFoodItem[],
  meta: { confidence: number; notice: string; provider: string; model: string },
) {
  aiSuggestions.value = items
  aiNotice.value = meta.notice
  aiConfidence.value = Math.round(meta.confidence * 100)
  aiProviderLabel.value = `${meta.provider} · ${meta.model}`
}

function applyAiSuggestion(item: AiParsedFoodItem) {
  form.mealType = item.mealType
  form.foodName = item.foodName
  form.quantity = item.quantity
  form.unit = item.unit
  form.caloriesPerUnit = item.caloriesPerUnit
  form.totalCalories = item.totalCalories
  form.note = item.note
  useManualTotalCalories.value = item.totalCalories !== Math.round(item.quantity * item.caloriesPerUnit)
  showSuccess(`已套用「${item.foodName}」的 AI 建議，請確認後儲存。`)
}

function removeAiSuggestion(index: number) {
  aiSuggestions.value.splice(index, 1)
}

async function handleSaveAllAiSuggestions() {
  if (!authStore.userId) {
    return
  }

  const payloads = aiSuggestions.value
    .map<FoodFormPayload | null>((item) => {
      const foodName = item.foodName.trim()
      const quantity = Number(item.quantity)
      const caloriesPerUnit = Number(item.caloriesPerUnit)
      const totalCalories = Math.round(Number(item.totalCalories))

      if (!foodName || quantity <= 0 || caloriesPerUnit < 0 || totalCalories < 0) {
        return null
      }

      return {
        recordDate: form.recordDate,
        mealType: item.mealType,
        foodName,
        quantity,
        unit: item.unit.trim() || '份',
        caloriesPerUnit,
        totalCalories,
        note: item.note.trim(),
      }
    })
    .filter((item): item is FoodFormPayload => Boolean(item))

  if (payloads.length !== aiSuggestions.value.length) {
    showError(new Error('請確認每個項目都有食物名稱、有效份量與熱量。'))
    return
  }

  isSavingAiSuggestions.value = true

  try {
    for (const payload of payloads) {
      await foodsStore.addFood(authStore.userId, payload)
    }

    await fetchFoods()
    showSuccess(`已新增 ${payloads.length} 筆 AI 飲食紀錄。`)
    isDialogVisible.value = false
    resetForm()
  } catch (error) {
    showError(error, '保存 AI 飲食紀錄失敗，請稍後再試。')
  } finally {
    isSavingAiSuggestions.value = false
  }
}

async function handleAiParseText() {
  if (!aiFoodText.value.trim()) {
    showError(new Error('請先輸入餐點描述。'))
    return
  }

  isAiParsing.value = true

  try {
    const response = await parseFoodText({
      text: aiFoodText.value.trim(),
      recordDate: form.recordDate,
      locale: 'zh-TW',
    })
    setAiSuggestions(response.items, response)

    if (!response.items.length) {
      showError(new Error('AI 沒有解析出可套用的餐點，請改用更具體的描述。'))
    }
  } catch (error) {
    showError(error, 'AI 飲食解析失敗，請稍後再試。')
  } finally {
    isAiParsing.value = false
  }
}

function triggerAiPhotoPicker() {
  aiPhotoInputRef.value?.click()
}

async function handleAiPhotoPicked(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    showError(new Error('請選擇圖片檔案。'))
    return
  }

  try {
    aiPhotoDataUrl.value = await createOptimizedMealPhotoDataUrl(file)
    aiPhotoFileName.value = file.name
  } catch (error) {
    showError(error, '餐點照片處理失敗，請換一張照片再試。')
  }
}

async function handleAiAnalyzePhoto() {
  if (!aiPhotoDataUrl.value) {
    showError(new Error('請先選擇一張餐點照片。'))
    return
  }

  isAiAnalyzingPhoto.value = true

  try {
    const response = await analyzeMealPhoto({
      imageUrl: aiPhotoDataUrl.value,
      recordDate: form.recordDate,
      locale: 'zh-TW',
    })
    setAiSuggestions(response.items, response)

    if (!response.items.length) {
      showError(new Error('AI 沒有辨識出可套用的餐點，請換張更清楚的照片。'))
    }
  } catch (error) {
    showError(error, 'AI 餐點辨識失敗，請稍後再試。')
  } finally {
    isAiAnalyzingPhoto.value = false
  }
}

watch(
  () => [form.quantity, form.caloriesPerUnit],
  () => {
    if (!useManualTotalCalories.value) {
      form.totalCalories = calculatedTotalCalories.value
    }
  },
  { immediate: true },
)

watch(
  () => useManualTotalCalories.value,
  (isManual) => {
    if (!isManual) {
      form.totalCalories = calculatedTotalCalories.value
    }
  },
)

async function fetchFoods() {
  if (!authStore.userId) {
    return
  }

  try {
    await foodsStore.fetchFoods(authStore.userId)
  } catch (error) {
    showError(error, '讀取飲食紀錄失敗，請稍後再試。')
  }
}

async function handleSubmit() {
  if (!formRef.value || !authStore.userId) {
    return
  }

  const isValid = await formRef.value.validate().catch(() => false)

  if (!isValid) {
    return
  }

  isSubmitting.value = true

  try {
    if (editingFoodId.value) {
      await foodsStore.editFood(authStore.userId, editingFoodId.value, { ...form })
      showSuccess('飲食紀錄已更新。')
    } else {
      await foodsStore.addFood(authStore.userId, { ...form })
      showSuccess('飲食紀錄已新增。')
    }

    await fetchFoods()
    isDialogVisible.value = false
    resetForm()
  } catch (error) {
    showError(error, '儲存飲食紀錄失敗，請稍後再試。')
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(record: FoodRecord) {
  if (!authStore.userId) {
    return
  }

  try {
    await foodsStore.removeFood(authStore.userId, record.id)
    await fetchFoods()
    showSuccess(`已刪除「${record.foodName}」飲食紀錄。`)
  } catch (error) {
    showError(error, '刪除飲食紀錄失敗，請稍後再試。')
  }
}

onMounted(async () => {
  await fetchFoods()
})
</script>

<template>
  <div class="page-stack journal-page journal-page--foods">
    <section class="hero-panel hero-panel--foods journal-hero">
      <div>
        <p class="section-kicker">Food Journal</p>
        <h3>把每天吃進去的熱量記得更清楚</h3>
        <p class="section-copy section-copy--dark">
          依日期與餐別整理飲食紀錄，自動計算總熱量，讓 Dashboard 能直接接到今日攝取統計。
        </p>
      </div>

      <div class="hero-stats">
        <article class="hero-stat-card">
          <span>篩選後總熱量</span>
          <strong>{{ totalCalories }} kcal</strong>
        </article>
        <article class="hero-stat-card">
          <span>目前筆數</span>
          <strong>{{ todayCount }} 筆</strong>
        </article>
      </div>
    </section>

    <el-card shadow="hover" class="content-card journal-shell-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>飲食紀錄管理</span>
            <p class="card-subtitle">新增、查詢、編輯與刪除每日飲食資料</p>
          </div>

          <div class="action-group">
            <el-button :icon="RefreshRight" plain @click="fetchFoods">重新整理</el-button>
            <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增飲食紀錄</el-button>
          </div>
        </div>
      </template>

      <div class="filters-panel journal-filters">
        <div class="toolbar-grid toolbar-grid--foods">
          <el-date-picker
            v-model="filters.recordDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="選擇日期"
            :prefix-icon="Calendar"
            clearable
          />

          <el-select v-model="filters.mealType" placeholder="選擇餐別" clearable>
            <el-option
              v-for="option in MEAL_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="filter-pills">
          <el-tag effect="plain" round type="success">
            日期：{{ filters.recordDate || '全部日期' }}
          </el-tag>
          <el-tag effect="plain" round>
            餐別：{{ filters.mealType ? MEAL_TYPE_LABEL_MAP[filters.mealType] : '全部餐別' }}
          </el-tag>
        </div>
      </div>

      <el-table v-loading="foodsStore.isLoading" :data="filteredRecords" stripe class="foods-table journal-table" empty-text="目前沒有符合條件的飲食紀錄">
        <el-table-column prop="recordDate" label="日期" min-width="120" />
        <el-table-column label="餐別" min-width="110">
          <template #default="{ row }">
            <el-tag round effect="plain">{{ MEAL_TYPE_LABEL_MAP[row.mealType] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="foodName" label="食物名稱" min-width="180" />
        <el-table-column label="份量" min-width="120">
          <template #default="{ row }">
            {{ row.quantity }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="caloriesPerUnit" label="每份熱量" min-width="120">
          <template #default="{ row }">
            {{ row.caloriesPerUnit }} kcal
          </template>
        </el-table-column>
        <el-table-column prop="totalCalories" label="總熱量" min-width="120">
          <template #default="{ row }">
            <strong>{{ row.totalCalories }} kcal</strong>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="備註" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" :icon="EditPen" @click="openEditDialog(row)">編輯</el-button>
              <el-popconfirm
                title="確定要刪除這筆飲食紀錄嗎？"
                confirm-button-text="刪除"
                cancel-button-text="取消"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button link type="danger" :icon="Delete">刪除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      width="min(720px, calc(100vw - 24px))"
      class="journal-dialog"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="settings-grid">
        <section v-if="!editingFoodId" class="food-ai-assist form-item-span-2">
          <button
            class="food-ai-assist__trigger"
            type="button"
            :aria-expanded="isAiAssistVisible"
            @click="isAiAssistVisible = !isAiAssistVisible"
          >
            <span class="food-ai-assist__icon"><Sparkles :size="17" /></span>
            <span>
              <strong>AI 快速填入餐點</strong>
              <small>輸入描述或上傳照片，AI 會建立可確認的飲食建議</small>
            </span>
            <el-tag round effect="plain" type="success">{{ isAiAssistVisible ? '收合' : '使用 AI' }}</el-tag>
          </button>

          <div v-if="isAiAssistVisible" class="food-ai-assist__content">
            <div class="food-ai-assist__sources">
              <div class="food-ai-assist__source">
                <label for="ai-food-description">描述餐點</label>
                <el-input
                  id="ai-food-description"
                  v-model="aiFoodText"
                  type="textarea"
                  :rows="3"
                  resize="none"
                  placeholder="例如：午餐吃雞胸肉沙拉一份、無糖拿鐵一杯"
                />
                <el-button type="primary" :loading="isAiParsing" @click="handleAiParseText">
                  AI 解析文字
                </el-button>
              </div>

              <div class="food-ai-assist__source food-ai-assist__source--photo">
                <label>拍照辨識</label>
                <input
                  ref="aiPhotoInputRef"
                  class="food-ai-assist__file-input"
                  type="file"
                  accept="image/*"
                  @change="handleAiPhotoPicked"
                >
                <div class="food-ai-assist__photo-state">
                  <img v-if="aiPhotoDataUrl" :src="aiPhotoDataUrl" :alt="aiPhotoFileName" decoding="async">
                  <ImagePlus v-else :size="21" />
                  <span>{{ aiPhotoFileName || '選擇清楚的餐點照片' }}</span>
                </div>
                <div class="food-ai-assist__photo-actions">
                  <el-button plain :icon="Camera" @click="triggerAiPhotoPicker">選擇照片</el-button>
                  <el-button type="primary" :loading="isAiAnalyzingPhoto" @click="handleAiAnalyzePhoto">
                    AI 辨識照片
                  </el-button>
                </div>
              </div>
            </div>

            <div v-if="aiNotice || aiProviderLabel" class="food-ai-assist__meta">
              <el-tag v-if="aiNotice" round effect="plain" type="warning">{{ aiNotice }}</el-tag>
              <el-tag v-if="aiConfidence" round effect="plain">信心 {{ aiConfidence }}%</el-tag>
              <span v-if="aiProviderLabel">{{ aiProviderLabel }}</span>
            </div>

            <div v-if="aiSuggestions.length" class="food-ai-assist__suggestions">
              <div class="food-ai-assist__suggestions-title">
                <div>
                  <strong>AI 建議項目</strong>
                  <span>逐筆確認後，可一次採納所有項目</span>
                </div>
                <div class="food-ai-assist__batch-total">
                  <span>合計</span>
                  <strong>{{ aiSuggestionsTotalCalories }} kcal</strong>
                </div>
              </div>
              <article v-for="(item, index) in aiSuggestions" :key="`${item.foodName}-${index}`" class="food-ai-suggestion">
                <div class="food-ai-suggestion__top">
                  <strong>項目 {{ index + 1 }}</strong>
                  <div>
                    <el-button text type="primary" @click="applyAiSuggestion(item)">套用單筆</el-button>
                    <el-button text type="danger" @click="removeAiSuggestion(index)">移除</el-button>
                  </div>
                </div>
                <div class="food-ai-suggestion__fields">
                  <label>
                    <span>食物名稱</span>
                    <el-input v-model="item.foodName" />
                  </label>
                  <label>
                    <span>餐別</span>
                    <el-select v-model="item.mealType">
                      <el-option
                        v-for="option in MEAL_TYPE_OPTIONS"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </label>
                  <label>
                    <span>份量</span>
                    <el-input-number v-model="item.quantity" :min="0.1" :step="0.5" :precision="1" />
                  </label>
                  <label>
                    <span>單位</span>
                    <el-input v-model="item.unit" />
                  </label>
                  <label>
                    <span>每份熱量</span>
                    <el-input-number v-model="item.caloriesPerUnit" :min="0" :step="10" />
                  </label>
                  <label>
                    <span>總熱量 (kcal)</span>
                    <el-input-number v-model="item.totalCalories" :min="0" :step="10" />
                  </label>
                </div>
                <label class="food-ai-suggestion__note">
                  <span>備註</span>
                  <el-input v-model="item.note" placeholder="可補充品牌、烹調方式等資訊" />
                </label>
              </article>
              <div class="food-ai-assist__save-all">
                <span>確認每筆資料後，一次建立 {{ aiSuggestions.length }} 筆飲食紀錄。</span>
                <el-button type="success" :loading="isSavingAiSuggestions" @click="handleSaveAllAiSuggestions">
                  全部採納並保存
                </el-button>
              </div>
            </div>
          </div>
        </section>

        <el-form-item label="日期" prop="recordDate">
          <el-date-picker
            v-model="form.recordDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="選擇日期"
          />
        </el-form-item>

        <el-form-item label="餐別" prop="mealType">
          <el-select v-model="form.mealType" placeholder="選擇餐別">
            <el-option
              v-for="option in MEAL_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="食物名稱" prop="foodName">
          <el-input v-model="form.foodName" placeholder="例如：雞胸肉、燕麥牛奶、鮭魚沙拉" />
        </el-form-item>

        <el-form-item label="份量" prop="quantity">
          <el-input-number v-model="form.quantity" :min="0.1" :step="0.5" :precision="1" />
        </el-form-item>

        <el-form-item label="單位" prop="unit">
          <el-input v-model="form.unit" placeholder="例如：份、碗、杯、片" />
        </el-form-item>

        <el-form-item label="每份熱量 (kcal)" prop="caloriesPerUnit">
          <el-input-number v-model="form.caloriesPerUnit" :min="0" :step="10" />
        </el-form-item>

        <el-form-item label="總熱量模式" class="form-item-span-2">
          <el-segmented
            v-model="useManualTotalCalories"
            :options="[
              { label: '自動計算', value: false },
              { label: '手動輸入', value: true },
            ]"
          />
        </el-form-item>

        <el-form-item v-if="useManualTotalCalories" label="總熱量 (kcal)">
          <el-input-number v-model="form.totalCalories" :min="0" :step="10" />
        </el-form-item>

        <el-form-item v-else label="總熱量">
          <el-input :model-value="`${calculatedTotalCalories} kcal`" readonly />
        </el-form-item>

        <el-form-item label="備註" prop="note" class="form-item-span-2">
          <el-input v-model="form.note" type="textarea" :rows="3" placeholder="可記錄口味、品牌、烹調方式等資訊" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="isDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">儲存紀錄</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.food-ai-assist {
  overflow: hidden;
  margin-bottom: 18px;
  border: 1px solid rgba(75, 174, 137, 0.22);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(224, 250, 239, 0.72), rgba(235, 245, 255, 0.66));
}

.food-ai-assist__trigger {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 15px 16px;
  border: 0;
  background: transparent;
  color: var(--text-main);
  text-align: left;
  cursor: pointer;
}

.food-ai-assist__trigger > span:nth-child(2) {
  flex: 1;
}

.food-ai-assist__trigger strong,
.food-ai-assist__trigger small {
  display: block;
}

.food-ai-assist__trigger small {
  margin-top: 3px;
  color: var(--text-muted);
}

.food-ai-assist__icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  color: #20835f;
  background: rgba(255, 255, 255, 0.72);
}

.food-ai-assist__content {
  padding: 0 16px 16px;
}

.food-ai-assist__sources {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.food-ai-assist__source {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
}

.food-ai-assist__source label,
.food-ai-assist__suggestions-title strong {
  font-size: 14px;
  font-weight: 700;
}

.food-ai-assist__file-input {
  display: none;
}

.food-ai-assist__photo-state {
  display: flex;
  min-height: 82px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  padding: 10px;
  border: 1px dashed rgba(57, 135, 110, 0.38);
  border-radius: 12px;
  color: var(--text-muted);
  text-align: center;
}

.food-ai-assist__photo-state img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 9px;
}

.food-ai-assist__photo-actions,
.food-ai-assist__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.food-ai-assist__meta {
  align-items: center;
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 12px;
}

.food-ai-assist__suggestions {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.food-ai-assist__suggestions-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.food-ai-assist__suggestions-title span,
.food-ai-suggestion label > span,
.food-ai-suggestion__note > span {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
}

.food-ai-assist__batch-total {
  display: flex;
  flex: 0 0 auto;
  align-items: baseline;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.64);
}

.food-ai-assist__batch-total strong {
  color: #167856;
  font-size: 14px;
}

.food-ai-suggestion {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.58);
}

.food-ai-suggestion__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.food-ai-suggestion__fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.food-ai-suggestion label {
  min-width: 0;
}

.food-ai-suggestion label > span,
.food-ai-suggestion__note > span {
  margin-bottom: 5px;
}

.food-ai-suggestion :deep(.el-input-number) {
  width: 100%;
}

.food-ai-assist__save-all {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 14px;
  background: rgba(223, 248, 234, 0.72);
  color: #356c58;
  font-size: 13px;
}

@media (max-width: 640px) {
  .food-ai-assist__sources {
    grid-template-columns: 1fr;
  }

  .food-ai-assist__trigger small {
    display: none;
  }

  .food-ai-assist__suggestions-title,
  .food-ai-assist__save-all {
    align-items: flex-start;
    flex-direction: column;
  }

  .food-ai-suggestion__fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
