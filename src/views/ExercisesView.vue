<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { Calendar, Delete, EditPen, Plus, RefreshRight, Timer } from '@element-plus/icons-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import type { ExerciseFormPayload, ExerciseRecord } from '@/types/exercise'
import { formatDate } from '@/utils/date'
import { showError, showSuccess } from '@/utils/message'

const authStore = useAuthStore()
const exercisesStore = useExercisesStore()
const formRef = ref<FormInstance>()
const isDialogVisible = ref(false)
const isSubmitting = ref(false)
const editingExerciseId = ref<string | null>(null)

const filters = reactive({
  recordDate: formatDate(new Date()),
})

const form = reactive<ExerciseFormPayload>({
  recordDate: formatDate(new Date()),
  exerciseName: '',
  durationMinutes: 30,
  caloriesPerMinute: 8,
  note: '',
})

const rules: FormRules<ExerciseFormPayload> = {
  recordDate: [{ required: true, message: '請選擇日期', trigger: 'change' }],
  exerciseName: [{ required: true, message: '請輸入運動名稱', trigger: 'blur' }],
  durationMinutes: [{ required: true, message: '請輸入運動時間', trigger: 'blur' }],
  caloriesPerMinute: [{ required: true, message: '請輸入每分鐘消耗', trigger: 'blur' }],
}

const dialogTitle = computed(() => (editingExerciseId.value ? '編輯運動紀錄' : '新增運動紀錄'))
const filteredRecords = computed(() => exercisesStore.filteredRecords)
const totalCalories = computed(() => exercisesStore.totalCalories)
const totalMinutes = computed(() =>
  filteredRecords.value.reduce((sum, record) => sum + record.durationMinutes, 0),
)

watch(
  () => filters.recordDate,
  (recordDate) => {
    exercisesStore.setDateFilter(recordDate)
  },
  { immediate: true },
)

function resetForm() {
  form.recordDate = filters.recordDate || formatDate(new Date())
  form.exerciseName = ''
  form.durationMinutes = 30
  form.caloriesPerMinute = 8
  form.note = ''
  editingExerciseId.value = null
}

function openCreateDialog() {
  resetForm()
  isDialogVisible.value = true
}

function openEditDialog(record: ExerciseRecord) {
  editingExerciseId.value = record.id
  form.recordDate = record.recordDate
  form.exerciseName = record.exerciseName
  form.durationMinutes = record.durationMinutes
  form.caloriesPerMinute = record.caloriesPerMinute
  form.note = record.note
  isDialogVisible.value = true
}

async function fetchExercises() {
  if (!authStore.userId) {
    return
  }

  try {
    await exercisesStore.fetchExercises(authStore.userId)
  } catch (error) {
    showError(error, '讀取運動紀錄失敗，請稍後再試。')
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
    if (editingExerciseId.value) {
      await exercisesStore.editExercise(authStore.userId, editingExerciseId.value, { ...form })
      showSuccess('運動紀錄已更新。')
    } else {
      await exercisesStore.addExercise(authStore.userId, { ...form })
      showSuccess('運動紀錄已新增。')
    }

    await fetchExercises()
    isDialogVisible.value = false
    resetForm()
  } catch (error) {
    showError(error, '儲存運動紀錄失敗，請稍後再試。')
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(record: ExerciseRecord) {
  if (!authStore.userId) {
    return
  }

  try {
    await exercisesStore.removeExercise(authStore.userId, record.id)
    await fetchExercises()
    showSuccess(`已刪除「${record.exerciseName}」運動紀錄。`)
  } catch (error) {
    showError(error, '刪除運動紀錄失敗，請稍後再試。')
  }
}

onMounted(async () => {
  await fetchExercises()
})
</script>

<template>
  <div class="page-stack">
    <section class="hero-panel hero-panel--exercises">
      <div>
        <p class="section-kicker">Exercise Journal</p>
        <h3>把每天消耗出去的熱量也記得有脈絡</h3>
        <p class="section-copy section-copy--dark">
          依日期追蹤運動時數與熱量消耗，之後 Dashboard 就能同步顯示今日總消耗與淨熱量。
        </p>
      </div>

      <div class="hero-stats">
        <article class="hero-stat-card hero-stat-card--cool">
          <span>篩選後總消耗</span>
          <strong>{{ totalCalories }} kcal</strong>
        </article>
        <article class="hero-stat-card hero-stat-card--cool">
          <span>總運動時間</span>
          <strong>{{ totalMinutes }} 分鐘</strong>
        </article>
      </div>
    </section>

    <el-card shadow="hover" class="content-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>運動紀錄管理</span>
            <p class="card-subtitle">管理每日運動、時間與熱量消耗</p>
          </div>

          <div class="action-group">
            <el-button :icon="RefreshRight" plain @click="fetchExercises">重新整理</el-button>
            <el-button type="success" :icon="Plus" @click="openCreateDialog">新增運動紀錄</el-button>
          </div>
        </div>
      </template>

      <div class="filters-panel filters-panel--cool">
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
          <el-tag effect="plain" round type="info">
            日期：{{ filters.recordDate || '全部日期' }}
          </el-tag>
        </div>
      </div>

      <el-table
        v-loading="exercisesStore.isLoading"
        :data="filteredRecords"
        stripe
        class="foods-table"
        empty-text="目前沒有符合條件的運動紀錄"
      >
        <el-table-column prop="recordDate" label="日期" min-width="120" />
        <el-table-column prop="exerciseName" label="運動名稱" min-width="180" />
        <el-table-column prop="durationMinutes" label="運動時間" min-width="130">
          <template #default="{ row }">
            {{ row.durationMinutes }} 分鐘
          </template>
        </el-table-column>
        <el-table-column prop="caloriesPerMinute" label="每分鐘消耗" min-width="130">
          <template #default="{ row }">
            {{ row.caloriesPerMinute }} kcal
          </template>
        </el-table-column>
        <el-table-column prop="totalCalories" label="總消耗" min-width="120">
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
                title="確定要刪除這筆運動紀錄嗎？"
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

        <el-form-item label="運動名稱" prop="exerciseName">
          <el-input v-model="form.exerciseName" placeholder="例如：跑步、快走、飛輪、有氧舞蹈" />
        </el-form-item>

        <el-form-item label="運動時間 (分鐘)" prop="durationMinutes">
          <el-input-number v-model="form.durationMinutes" :min="1" :step="5" :prefix-icon="Timer" />
        </el-form-item>

        <el-form-item label="每分鐘消耗 (kcal)" prop="caloriesPerMinute">
          <el-input-number v-model="form.caloriesPerMinute" :min="1" :step="1" />
        </el-form-item>

        <el-form-item label="總消耗">
          <el-input :model-value="`${form.durationMinutes * form.caloriesPerMinute} kcal`" readonly />
        </el-form-item>

        <el-form-item label="備註" prop="note" class="form-item-span-2">
          <el-input v-model="form.note" type="textarea" :rows="3" placeholder="可補充強度、器材、地點或訓練內容" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="isDialogVisible = false">取消</el-button>
          <el-button type="success" :loading="isSubmitting" @click="handleSubmit">儲存紀錄</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
