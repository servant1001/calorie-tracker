<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { Calendar, Delete, EditPen, Plus, RefreshRight } from '@element-plus/icons-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { MEAL_TYPE_LABEL_MAP, MEAL_TYPE_OPTIONS } from '@/constants/food'
import { useAuthStore } from '@/stores/auth'
import { useFoodsStore } from '@/stores/foods'
import type { MealType } from '@/types/common'
import type { FoodFormPayload, FoodRecord } from '@/types/food'
import { formatDate } from '@/utils/date'
import { showError, showSuccess } from '@/utils/message'

const authStore = useAuthStore()
const foodsStore = useFoodsStore()
const formRef = ref<FormInstance>()
const isDialogVisible = ref(false)
const isSubmitting = ref(false)
const editingFoodId = ref<string | null>(null)

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
  form.note = ''
  editingFoodId.value = null
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
  form.note = record.note
  isDialogVisible.value = true
}

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

        <el-form-item label="總熱量">
          <el-input :model-value="`${form.quantity * form.caloriesPerUnit} kcal`" readonly />
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
