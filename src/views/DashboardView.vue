<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { MEAL_TYPE_LABEL_MAP } from '@/constants/food'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useFoodsStore } from '@/stores/foods'
import { useProfileStore } from '@/stores/profile'
import { useWeightsStore } from '@/stores/weights'
import type { DashboardSummary } from '@/types/dashboard'
import { calculateRemainingCalories } from '@/utils/calorie'
import { formatDate } from '@/utils/date'
import { showError } from '@/utils/message'

const router = useRouter()
const authStore = useAuthStore()
const foodsStore = useFoodsStore()
const exercisesStore = useExercisesStore()
const profileStore = useProfileStore()
const weightsStore = useWeightsStore()

const today = formatDate(new Date())

const todayFoods = computed(() =>
  foodsStore.records.filter((record) => record.recordDate === today).slice(0, 5),
)

const todayExercises = computed(() =>
  exercisesStore.records.filter((record) => record.recordDate === today).slice(0, 5),
)

const summary = computed<DashboardSummary>(() => {
  const totalIntake = foodsStore.records
    .filter((record) => record.recordDate === today)
    .reduce((sum, record) => sum + record.totalCalories, 0)
  const totalBurn = exercisesStore.records
    .filter((record) => record.recordDate === today)
    .reduce((sum, record) => sum + record.totalCalories, 0)
  const netCalories = totalIntake - totalBurn
  const dailyGoal = profileStore.profile.dailyGoal || 2200

  return {
    totalIntake,
    totalBurn,
    netCalories,
    remainingCalories: calculateRemainingCalories(dailyGoal, netCalories),
    currentWeight: weightsStore.latestWeight ?? profileStore.profile.weight,
  }
})

const weightGap = computed(() =>
  Number((summary.value.currentWeight - profileStore.profile.targetWeight).toFixed(1)),
)

const weightGapLabel = computed(() => {
  if (weightGap.value > 0) {
    return `距離目標還差 ${weightGap.value} kg`
  }

  if (weightGap.value < 0) {
    return `已低於目標 ${Math.abs(weightGap.value)} kg`
  }

  return '已達成目標體重'
})

const progressCards = computed(() => [
  {
    label: '每日目標熱量',
    value: `${profileStore.profile.dailyGoal} kcal`,
    note: `活動量：${profileStore.profile.activityLevel}`,
  },
  {
    label: '目標體重',
    value: `${profileStore.profile.targetWeight} kg`,
    note: weightGapLabel.value,
  },
  {
    label: '今日紀錄筆數',
    value: `${todayFoods.value.length + todayExercises.value.length} 筆`,
    note: `飲食 ${todayFoods.value.length} 筆 / 運動 ${todayExercises.value.length} 筆`,
  },
])

const statCards = computed(() => [
  { label: '今日攝取熱量', value: `${summary.value.totalIntake} kcal`, tone: 'warm' },
  { label: '今日消耗熱量', value: `${summary.value.totalBurn} kcal`, tone: 'cool' },
  { label: '今日淨熱量', value: `${summary.value.netCalories} kcal`, tone: 'neutral' },
  { label: '剩餘可攝取熱量', value: `${summary.value.remainingCalories} kcal`, tone: 'fresh' },
])

async function loadDashboardData() {
  if (!authStore.userId) {
    return
  }

  try {
    await Promise.all([
      foodsStore.fetchFoods(authStore.userId),
      exercisesStore.fetchExercises(authStore.userId),
      weightsStore.fetchWeights(authStore.userId),
      profileStore.fetchProfile(authStore.userId),
    ])
  } catch (error) {
    showError(error, '讀取首頁統計失敗，請稍後再試。')
  }
}

onMounted(async () => {
  await loadDashboardData()
})
</script>

<template>
  <div class="page-stack">
    <section class="hero-panel">
      <div>
        <p class="section-kicker">Daily Overview</p>
        <h3>今天的熱量狀態一眼看懂</h3>
        <p class="section-copy section-copy--dark">
          整合今日飲食、運動、個人目標熱量與最新體重，讓每日管理直接聚焦在最重要的進度。
        </p>
      </div>
      <div class="hero-panel__badge">
        <span>今日體重</span>
        <strong>{{ summary.currentWeight }} kg</strong>
      </div>
    </section>

    <el-row :gutter="16">
      <el-col v-for="card in statCards" :key="card.label" :xs="24" :sm="12" :lg="6">
        <article :class="['metric-card', `metric-card--${card.tone}`]">
          <p>{{ card.label }}</p>
          <strong>{{ card.value }}</strong>
        </article>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col v-for="card in progressCards" :key="card.label" :xs="24" :md="8">
        <article class="progress-card">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <p>{{ card.note }}</p>
        </article>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :xl="12">
        <el-card shadow="hover" class="content-card">
          <template #header>
            <div class="card-header">
              <span>今日飲食紀錄</span>
              <el-button type="primary" plain @click="router.push('/foods')">前往飲食頁</el-button>
            </div>
          </template>

          <el-table :data="todayFoods" stripe empty-text="今天還沒有飲食紀錄">
            <el-table-column label="餐別" min-width="100">
              <template #default="{ row }">
                {{ MEAL_TYPE_LABEL_MAP[row.mealType] }}
              </template>
            </el-table-column>
            <el-table-column prop="foodName" label="食物名稱" min-width="160" />
            <el-table-column prop="totalCalories" label="熱量 (kcal)" min-width="120" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="12">
        <el-card shadow="hover" class="content-card">
          <template #header>
            <div class="card-header">
              <span>今日運動紀錄</span>
              <el-button type="success" plain @click="router.push('/exercises')">前往運動頁</el-button>
            </div>
          </template>

          <el-table :data="todayExercises" stripe empty-text="今天還沒有運動紀錄">
            <el-table-column prop="exerciseName" label="運動名稱" min-width="140" />
            <el-table-column prop="durationMinutes" label="時間 (分鐘)" min-width="120" />
            <el-table-column prop="totalCalories" label="消耗 (kcal)" min-width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
