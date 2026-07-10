<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { Calendar, Delete, EditPen, Plus, RefreshRight } from '@element-plus/icons-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useWeightsStore } from '@/stores/weights'
import type { WeightFormPayload, WeightRecord } from '@/types/weight'
import { formatDate } from '@/utils/date'
import { calculateBmi, getBmiLabel } from '@/utils/health'
import { showError, showSuccess } from '@/utils/message'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const weightsStore = useWeightsStore()
const formRef = ref<FormInstance>()
const isDialogVisible = ref(false)
const isSubmitting = ref(false)
const editingWeightId = ref<string | null>(null)
const selectedRecords = ref<WeightRecord[]>([])

const filters = reactive({
  recordDate: '',
})

const form = reactive<WeightFormPayload>({
  recordDate: formatDate(new Date()),
  weight: 70,
  note: '',
})

const rules: FormRules<WeightFormPayload> = {
  recordDate: [{ required: true, message: '請選擇日期', trigger: 'change' }],
  weight: [{ required: true, message: '請輸入體重', trigger: 'blur' }],
}

const filteredRecords = computed(() => weightsStore.filteredRecords)
const latestWeight = computed(() => weightsStore.latestWeight)
const latestBmi = computed(() =>
  latestWeight.value ? calculateBmi(latestWeight.value, profileStore.profile.height) : 0,
)
const dialogTitle = computed(() => (editingWeightId.value ? '編輯體重紀錄' : '新增體重紀錄'))

watch(
  () => filters.recordDate,
  (recordDate) => {
    weightsStore.setDateFilter(recordDate)
  },
  { immediate: true },
)

function resetForm() {
  form.recordDate = formatDate(new Date())
  form.weight = Number(profileStore.profile.weight || 70)
  form.note = ''
  editingWeightId.value = null
}

function openCreateDialog() {
  resetForm()
  isDialogVisible.value = true
}

function openEditDialog(record: WeightRecord) {
  editingWeightId.value = record.id
  form.recordDate = record.recordDate
  form.weight = record.weight
  form.note = record.note
  isDialogVisible.value = true
}

async function loadWeightData() {
  if (!authStore.userId) {
    return
  }

  try {
    await Promise.all([
      weightsStore.fetchWeights(authStore.userId),
      profileStore.fetchProfile(authStore.userId),
    ])
  } catch (error) {
    showError(error, '讀取體重資料失敗，請稍後再試。')
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
    if (editingWeightId.value) {
      await weightsStore.editWeight(authStore.userId, editingWeightId.value, { ...form })
      showSuccess('體重紀錄已更新。')
    } else {
      await weightsStore.addWeight(authStore.userId, { ...form })
      showSuccess('體重紀錄已新增。')
    }

    await loadWeightData()
    isDialogVisible.value = false
    resetForm()
  } catch (error) {
    showError(error, '儲存體重紀錄失敗，請稍後再試。')
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(record: WeightRecord) {
  if (!authStore.userId) {
    return
  }

  try {
    await weightsStore.removeWeight(authStore.userId, record.id)
    await loadWeightData()
    showSuccess(`已刪除 ${record.recordDate} 的體重紀錄。`)
  } catch (error) {
    showError(error, '刪除體重紀錄失敗，請稍後再試。')
  }
}

function handleSelectionChange(records: WeightRecord[]) {
  selectedRecords.value = records
}

async function handleBatchDelete() {
  if (!authStore.userId || !selectedRecords.value.length) {
    return
  }

  const recordsToDelete = [...selectedRecords.value]

  try {
    await Promise.all(recordsToDelete.map((record) => weightsStore.removeWeight(authStore.userId!, record.id)))
    selectedRecords.value = []
    await loadWeightData()
    showSuccess(`已刪除 ${recordsToDelete.length} 筆體重紀錄。`)
  } catch (error) {
    await loadWeightData()
    showError(error, '批次刪除體重紀錄失敗，請稍後再試。')
  }
}

onMounted(async () => {
  await loadWeightData()
})
</script>

<template>
  <div class="page-stack journal-page journal-page--weights">
    <section class="hero-panel hero-panel--weights journal-hero">
      <div>
        <p class="section-kicker">Weight Journal</p>
        <h3>把體重變化和 BMI 一起看，進度更有感</h3>
        <p class="section-copy section-copy--dark">
          記錄每日體重後，系統會依個人設定中的身高自動計算 BMI，先打好週月趨勢分析前的基礎資料。
        </p>
      </div>

      <div class="hero-stats">
        <article class="hero-stat-card hero-stat-card--rose">
          <span>最新體重</span>
          <strong>{{ latestWeight ? `${latestWeight} kg` : '尚無資料' }}</strong>
        </article>
        <article class="hero-stat-card hero-stat-card--rose">
          <span>目前 BMI</span>
          <strong>{{ latestBmi ? `${latestBmi} (${getBmiLabel(latestBmi)})` : '尚無資料' }}</strong>
        </article>
      </div>
    </section>

    <el-card shadow="hover" class="content-card journal-shell-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>體重紀錄管理</span>
            <p class="card-subtitle">管理每日體重與備註，建立趨勢分析基礎</p>
          </div>

          <div class="action-group">
            <el-button :icon="RefreshRight" plain @click="loadWeightData">重新整理</el-button>
            <el-popconfirm
              :title="`確定要刪除已選的 ${selectedRecords.length} 筆體重紀錄嗎？`"
              confirm-button-text="刪除"
              cancel-button-text="取消"
              @confirm="handleBatchDelete"
            >
              <template #reference>
                <el-button type="danger" plain :icon="Delete" :disabled="!selectedRecords.length">
                  刪除已選 ({{ selectedRecords.length }})
                </el-button>
              </template>
            </el-popconfirm>
            <el-button :icon="Plus" @click="openCreateDialog">新增體重紀錄</el-button>
          </div>
        </div>
      </template>

      <div class="filters-panel filters-panel--rose journal-filters">
        <div class="toolbar-grid toolbar-grid--foods">
          <el-date-picker
            v-model="filters.recordDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="選擇日期"
            :prefix-icon="Calendar"
            clearable
          />
        </div>

        <div class="filter-pills">
          <el-tag effect="plain" round type="danger">
            日期：{{ filters.recordDate || '全部日期' }}
          </el-tag>
          <el-tag effect="plain" round>
            身高：{{ profileStore.profile.height }} cm
          </el-tag>
        </div>
      </div>

      <el-table
        v-loading="weightsStore.isLoading || profileStore.isLoading"
        :data="filteredRecords"
        stripe
        class="journal-table"
        empty-text="目前沒有符合條件的體重紀錄"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="52" />
        <el-table-column prop="recordDate" label="日期" min-width="120" />
        <el-table-column prop="weight" label="體重" min-width="120">
          <template #default="{ row }">
            <strong>{{ row.weight }} kg</strong>
          </template>
        </el-table-column>
        <el-table-column label="BMI" min-width="120">
          <template #default="{ row }">
            {{ calculateBmi(row.weight, profileStore.profile.height) }}
          </template>
        </el-table-column>
        <el-table-column label="狀態" min-width="120">
          <template #default="{ row }">
            <el-tag round effect="plain">
              {{ getBmiLabel(calculateBmi(row.weight, profileStore.profile.height)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="備註" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" :icon="EditPen" @click="openEditDialog(row)">編輯</el-button>
              <el-popconfirm
                title="確定要刪除這筆體重紀錄嗎？"
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
      width="min(680px, calc(100vw - 24px))"
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

        <el-form-item label="體重 (kg)" prop="weight">
          <el-input-number v-model="form.weight" :min="20" :max="300" :step="0.1" :precision="1" />
        </el-form-item>

        <el-form-item label="BMI 預覽">
          <el-input
            :model-value="`${calculateBmi(form.weight, profileStore.profile.height)} (${getBmiLabel(calculateBmi(form.weight, profileStore.profile.height))})`"
            readonly
          />
        </el-form-item>

        <el-form-item label="備註" prop="note" class="form-item-span-2">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="3"
            placeholder="可補充量測時間、狀態、飲食控制或訓練週期"
          />
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
