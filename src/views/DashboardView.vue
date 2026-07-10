<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import {
  Activity,
  ArrowRight,
  Dumbbell,
  Flame,
  Salad,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import AiAssistantCard from '@/components/AiAssistantCard.vue'
import StatisticsChart from '@/components/StatisticsChart.vue'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useFoodsStore } from '@/stores/foods'
import { useProfileStore } from '@/stores/profile'
import { useWeightsStore } from '@/stores/weights'
import type { DashboardSummary } from '@/types/dashboard'
import { calculateRemainingCalories } from '@/utils/calorie'
import { formatDate } from '@/utils/date'
import { calculateBmr } from '@/utils/health'
import { showError } from '@/utils/message'

const router = useRouter()
const authStore = useAuthStore()
const foodsStore = useFoodsStore()
const exercisesStore = useExercisesStore()
const profileStore = useProfileStore()
const weightsStore = useWeightsStore()

const today = formatDate(new Date())

const mealLabelMap = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '點心',
  'midnight-snack': '宵夜',
} as const

const activityLevelLabelMap = {
  low: '低活動量',
  medium: '中活動量',
  high: '高活動量',
} as const

const allTodayFoods = computed(() =>
  foodsStore.records.filter((record) => record.recordDate === today),
)

const todayFoods = computed(() => allTodayFoods.value.slice(0, 4))

const allTodayExercises = computed(() =>
  exercisesStore.records.filter((record) => record.recordDate === today),
)

const todayExercises = computed(() => allTodayExercises.value.slice(0, 4))

const latestWeights = computed(() =>
  [...weightsStore.records]
    .sort((left, right) => right.recordDate.localeCompare(left.recordDate))
    .slice(0, 4),
)

const currentWeight = computed(() => weightsStore.latestWeight ?? profileStore.profile.weight)

const summary = computed<DashboardSummary>(() => {
  const totalIntake = foodsStore.records
    .filter((record) => record.recordDate === today)
    .reduce((sum, record) => sum + record.totalCalories, 0)
  const exerciseBurn = exercisesStore.records
    .filter((record) => record.recordDate === today)
    .reduce((sum, record) => sum + record.totalCalories, 0)
  const basalBurn = calculateBmr({
    ...profileStore.profile,
    weight: currentWeight.value,
  })
  const totalBurn = basalBurn + exerciseBurn
  const netCalories = totalIntake - totalBurn
  const dailyGoal = profileStore.profile.dailyGoal || 2200

  return {
    totalIntake,
    basalBurn,
    exerciseBurn,
    totalBurn,
    netCalories,
    remainingCalories: calculateRemainingCalories(dailyGoal, totalIntake),
    currentWeight: currentWeight.value,
  }
})

const dailyGoal = computed(() => profileStore.profile.dailyGoal || 2200)
const dailyExerciseGoal = computed(() => profileStore.profile.dailyExerciseGoal || 300)

const exerciseGoalPercent = computed(() => {
  if (!dailyExerciseGoal.value) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round((summary.value.exerciseBurn / dailyExerciseGoal.value) * 100)))
})

const weightGap = computed(() =>
  Number((summary.value.currentWeight - profileStore.profile.targetWeight).toFixed(1)),
)

const remainingMessage = computed(() => {
  if (summary.value.remainingCalories > 0) {
    return `今天還可以攝取 ${summary.value.remainingCalories} kcal`
  }

  if (summary.value.remainingCalories < 0) {
    return `今天已超出攝取目標 ${Math.abs(summary.value.remainingCalories)} kcal`
  }

  return '今天剛好達成攝取目標'
})

const isTodayDeficit = computed(() => summary.value.netCalories < 0)
const todayDeficitCalories = computed(() => Math.round(Math.abs(summary.value.netCalories)))

const deficitMessage = computed(() => {
  if (!isTodayDeficit.value) {
    return ''
  }

  return `今天已達成熱量赤字 ${todayDeficitCalories.value} kcal`
})

const exerciseGoalLabel = computed(() => {
  if (summary.value.exerciseBurn >= dailyExerciseGoal.value) {
    return '運動目標達成'
  }

  return '運動消耗進度'
})

const exerciseGoalDetail = computed(() => {
  if (summary.value.exerciseBurn >= dailyExerciseGoal.value) {
    return `已超過目標 ${summary.value.exerciseBurn - dailyExerciseGoal.value} kcal`
  }

  return `${summary.value.exerciseBurn} / ${dailyExerciseGoal.value} kcal`
})

const ringTone = computed(() => {
  if (summary.value.exerciseBurn >= dailyExerciseGoal.value) {
    return '#2d7a56'
  }

  if (summary.value.exerciseBurn > 0) {
    return '#4da3ff'
  }

  return '#617070'
})

const weightMessage = computed(() => {
  if (weightGap.value > 0) {
    return `距離目標體重還差 ${weightGap.value} kg`
  }

  if (weightGap.value < 0) {
    return `目前比目標輕 ${Math.abs(weightGap.value)} kg`
  }

  return '目前已到達目標體重'
})

const greeting = computed(() => {
  const hour = new Date().getHours()

  if (hour < 12) {
    return '早安'
  }

  if (hour < 18) {
    return '午安'
  }

  return '晚安'
})

const displayName = computed(() => profileStore.profile.nickname || authStore.displayName || '你')

const weeklyDates = computed(() => {
  const dates: string[] = []

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    dates.push(formatDate(date))
  }

  return dates
})

const weeklyTrend = computed(() =>
  weeklyDates.value.map((date) => {
    const intake = foodsStore.records
      .filter((record) => record.recordDate === date)
      .reduce((sum, record) => sum + record.totalCalories, 0)
    const exerciseBurn = exercisesStore.records
      .filter((record) => record.recordDate === date)
      .reduce((sum, record) => sum + record.totalCalories, 0)
    const basalBurn = calculateBmr({
      ...profileStore.profile,
      weight: currentWeight.value,
    })
    const totalBurn = basalBurn + exerciseBurn

    return {
      date,
      intake,
      basalBurn,
      exerciseBurn,
      totalBurn,
      netCalories: intake - totalBurn,
      isDeficit: intake < totalBurn,
      goal: dailyGoal.value,
    }
  }),
)

const weeklyDeficitDays = computed(() =>
  weeklyTrend.value.filter((item) => item.isDeficit),
)

const chartOption = computed<EChartsOption>(() => ({
  animationDuration: 500,
  color: ['#2d7a56', '#4da3ff', '#8b7cf6', '#ffb454'],
  grid: {
    left: 24,
    right: 24,
    top: 24,
    bottom: 20,
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    top: 0,
    itemWidth: 12,
    textStyle: {
      color: '#617070',
    },
    data: ['攝取', '總消耗', '運動消耗', '目標'],
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: weeklyTrend.value.map((item) => item.date.slice(5)),
    axisLine: {
      lineStyle: {
        color: 'rgba(36, 50, 51, 0.14)',
      },
    },
    axisLabel: {
      color: '#617070',
    },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#617070',
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(36, 50, 51, 0.08)',
      },
    },
  },
  series: [
    {
      name: '攝取',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: weeklyTrend.value.map((item) => item.intake),
      areaStyle: {
        color: 'rgba(45, 122, 86, 0.12)',
      },
    },
    {
      name: '總消耗',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: weeklyTrend.value.map((item) => item.totalBurn),
    },
    {
      name: '運動消耗',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: {
        width: 2,
      },
      data: weeklyTrend.value.map((item) => item.exerciseBurn),
    },
    {
      name: '熱量赤字',
      type: 'scatter',
      symbol: 'roundRect',
      symbolSize: [8, 8],
      itemStyle: {
        color: '#2d7a56',
      },
      label: {
        show: true,
        position: 'top',
        distance: 14,
        formatter: (params) => {
          const value = typeof params.data === 'object' && params.data && 'netCalories' in params.data
            ? Math.round(Math.abs(Number(params.data.netCalories)))
            : 0

          return `{deficit|赤字 ${value}}`
        },
        rich: {
          deficit: {
            color: '#8f1239',
            backgroundColor: '#ffe4ea',
            borderColor: 'rgba(190, 24, 93, 0.28)',
            borderWidth: 1,
            borderRadius: 999,
            padding: [5, 10],
            fontSize: 12,
            fontWeight: 700,
          },
        },
      },
      tooltip: {
        valueFormatter: (value) => `${value} kcal`,
      },
      data: weeklyTrend.value.map((item) =>
        item.isDeficit
          ? {
              value: item.intake,
              netCalories: item.netCalories,
            }
          : null,
      ),
    },
    {
      name: '目標',
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: {
        type: 'dashed',
      },
      data: weeklyTrend.value.map((item) => item.goal),
    },
  ],
}))

const statCards = computed(() => [
  {
    label: '今日攝取',
    value: summary.value.totalIntake,
    unit: 'kcal',
    tone: 'warm',
    icon: Flame,
    note: '來自今日飲食紀錄',
  },
  {
    label: '今日總消耗',
    value: summary.value.totalBurn,
    unit: 'kcal',
    tone: 'cool',
    icon: Dumbbell,
    note: `BMR ${summary.value.basalBurn} / 運動 ${summary.value.exerciseBurn}`,
  },
  {
    label: '今日淨熱量',
    value: summary.value.netCalories,
    unit: 'kcal',
    tone: 'violet',
    icon: Activity,
    note: '攝取減去基礎代謝與運動',
  },
  {
    label: '剩餘可攝取',
    value: summary.value.remainingCalories,
    unit: 'kcal',
    tone: 'fresh',
    icon: Target,
    note: '以今日攝取對比每日目標熱量',
  },
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
    showError(error, '載入首頁資料失敗，請稍後再試。')
  }
}

onMounted(async () => {
  await loadDashboardData()
})
</script>

<template>
  <div class="page-stack dashboard-page">
    <section class="dashboard-hero">
      <div class="dashboard-hero__glow dashboard-hero__glow--a"></div>
      <div class="dashboard-hero__glow dashboard-hero__glow--b"></div>

      <div class="dashboard-hero__content">
        <div class="dashboard-hero__eyebrow">
          <span class="dashboard-hero__pill">
            <Sparkles :size="14" />
            Today Health Snapshot
          </span>
          <span class="dashboard-hero__date">{{ today }}</span>
        </div>

        <h3>{{ greeting }}，{{ displayName }}</h3>
        <p class="section-copy section-copy--dark">
          今天也朝健康邁進一步。先看熱量進度，再決定接下來要補充飲食還是安排運動。
        </p>

        <div class="hero-notes">
          <div class="hero-note">
            <Sparkles :size="18" />
            <span>{{ remainingMessage }}</span>
          </div>

          <div v-if="isTodayDeficit" class="hero-note hero-note--deficit">
            <Target :size="18" />
            <span>{{ deficitMessage }}</span>
          </div>
        </div>

        <div class="hero-meta">
          <article class="hero-meta-card hero-meta-card--goal">
            <div class="hero-meta-card__icon">
              <Target :size="18" />
            </div>
            <span>今日目標</span>
            <strong>{{ dailyGoal }} kcal</strong>
            <p>{{ activityLevelLabelMap[profileStore.profile.activityLevel] }}</p>
          </article>

          <article class="hero-meta-card hero-meta-card--exercise">
            <div class="hero-meta-card__icon">
              <Dumbbell :size="18" />
            </div>
            <span>運動消耗目標</span>
            <strong>{{ dailyExerciseGoal }} kcal</strong>
            <p>右側狀態環會顯示今日達成率</p>
          </article>

          <article class="hero-meta-card hero-meta-card--bmr">
            <div class="hero-meta-card__icon">
              <Flame :size="18" />
            </div>
            <span>基礎代謝 BMR</span>
            <strong>{{ summary.basalBurn }} kcal</strong>
            <p>今日總消耗已含基礎代謝</p>
          </article>

          <article class="hero-meta-card hero-meta-card--weight">
            <div class="hero-meta-card__icon">
              <Scale :size="18" />
            </div>
            <span>目前體重</span>
            <strong>{{ summary.currentWeight }} kg</strong>
            <p>{{ weightMessage }}</p>
          </article>
        </div>
      </div>

      <div class="dashboard-hero__ring-shell">
        <div class="dashboard-hero__ring-copy">
          <span>今日運動目標</span>
          <strong>{{ exerciseGoalPercent }}%</strong>
          <p>{{ exerciseGoalDetail }}</p>
        </div>

        <div class="dashboard-hero__ring">
          <div
            class="calorie-ring"
            :style="{
              '--progress': `${exerciseGoalPercent}%`,
              '--ring-color': ringTone,
            }"
          >
            <div class="calorie-ring__inner">
              <span>{{ exerciseGoalPercent }}%</span>
              <strong>{{ exerciseGoalLabel }}</strong>
              <p>{{ exerciseGoalDetail }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-kpi-grid">
      <article
        v-for="card in statCards"
        :key="card.label"
        :class="['dashboard-kpi', `dashboard-kpi--${card.tone}`]"
      >
        <div class="dashboard-kpi__top">
          <div class="dashboard-kpi__icon">
            <component :is="card.icon" :size="20" />
          </div>
          <p>{{ card.label }}</p>
        </div>

        <div class="dashboard-kpi__value">
          <strong>{{ card.value }}</strong>
          <span>{{ card.unit }}</span>
        </div>

        <small class="dashboard-kpi__note">{{ card.note }}</small>
      </article>
    </section>

    <section class="quick-actions">
      <button type="button" class="quick-action-card quick-action-card--green" @click="router.push('/foods')">
        <div class="quick-action-card__icon quick-action-card__icon--green">
          <Salad :size="20" />
        </div>
        <div>
          <span class="quick-action-card__eyebrow">Nutrition Log</span>
          <strong>新增飲食</strong>
          <p>快速記錄今天吃了什麼</p>
        </div>
        <ArrowRight :size="18" />
      </button>

      <button type="button" class="quick-action-card quick-action-card--blue" @click="router.push('/exercises')">
        <div class="quick-action-card__icon quick-action-card__icon--blue">
          <Dumbbell :size="20" />
        </div>
        <div>
          <span class="quick-action-card__eyebrow">Workout Log</span>
          <strong>新增運動</strong>
          <p>補上運動時間與消耗熱量</p>
        </div>
        <ArrowRight :size="18" />
      </button>

      <button type="button" class="quick-action-card quick-action-card--rose" @click="router.push('/weights')">
        <div class="quick-action-card__icon quick-action-card__icon--rose">
          <Scale :size="20" />
        </div>
        <div>
          <span class="quick-action-card__eyebrow">Body Check</span>
          <strong>新增體重</strong>
          <p>追蹤近期變化與目標距離</p>
        </div>
        <ArrowRight :size="18" />
      </button>
    </section>

    <AiAssistantCard
      :user-id="authStore.userId"
      :record-date="today"
      :activity-level="profileStore.profile.activityLevel"
      :daily-goal="dailyGoal"
      :daily-exercise-goal="dailyExerciseGoal"
      :dietary-preferences="profileStore.profile.dietaryPreferences"
      :current-weight="summary.currentWeight"
      :target-weight="profileStore.profile.targetWeight"
      :intake-total="summary.totalIntake"
      :exercise-total="summary.exerciseBurn"
      :basal-burn="summary.basalBurn"
      :total-burn="summary.totalBurn"
      :net-calories="summary.netCalories"
      :foods="allTodayFoods"
      :exercises="allTodayExercises"
    />

    <el-card shadow="hover" class="content-card dashboard-section dashboard-section--chart">
      <template #header>
        <div class="card-header card-header--chart">
          <div>
            <span>本週熱量趨勢</span>
            <p class="card-subtitle">用攝取、總消耗、運動消耗與目標線快速判斷這週節奏。</p>
          </div>

          <div class="chart-header-badge">
            <Activity :size="16" />
            <span>{{ weeklyDeficitDays.length }} 天達成赤字</span>
          </div>
        </div>
      </template>

      <div class="chart-panel">
        <StatisticsChart :option="chartOption" />
      </div>

      <div v-if="weeklyDeficitDays.length" class="deficit-strip">
        <span class="deficit-strip__label">本週已達成熱量赤字</span>
        <div class="deficit-strip__items">
          <span
            v-for="item in weeklyDeficitDays"
            :key="item.date"
            class="deficit-chip"
          >
            {{ item.date.slice(5) }} · {{ Math.round(Math.abs(item.netCalories)) }} kcal
          </span>
        </div>
      </div>
    </el-card>

    <section class="dashboard-records">
      <el-row :gutter="16">
        <el-col :xs="24" :xl="8">
          <el-card shadow="hover" class="content-card dashboard-section dashboard-record-card">
            <template #header>
              <div class="card-header">
                <div>
                  <span>今日飲食</span>
                  <p class="card-subtitle">最多顯示 4 筆今日飲食紀錄</p>
                </div>
                <el-button type="primary" plain @click="router.push('/foods')">查看全部</el-button>
              </div>
            </template>

            <div v-if="todayFoods.length" class="record-list">
              <article v-for="food in todayFoods" :key="food.id" class="record-item">
                <div class="record-item__icon record-item__icon--warm">
                  <Salad :size="18" />
                </div>
                <div class="record-item__content">
                  <strong>{{ food.foodName }}</strong>
                  <p>{{ mealLabelMap[food.mealType] }} · {{ food.quantity }} {{ food.unit }}</p>
                </div>
                <div class="record-item__metric">
                  <strong>{{ food.totalCalories }}</strong>
                  <span>kcal</span>
                </div>
              </article>
            </div>

            <el-empty v-else description="今天還沒有飲食紀錄" />
          </el-card>
        </el-col>

        <el-col :xs="24" :xl="8">
          <el-card shadow="hover" class="content-card dashboard-section dashboard-record-card">
            <template #header>
              <div class="card-header">
                <div>
                  <span>今日運動</span>
                  <p class="card-subtitle">最多顯示 4 筆今日運動紀錄</p>
                </div>
                <el-button type="success" plain @click="router.push('/exercises')">查看全部</el-button>
              </div>
            </template>

            <div v-if="todayExercises.length" class="record-list">
              <article v-for="exercise in todayExercises" :key="exercise.id" class="record-item">
                <div class="record-item__icon record-item__icon--cool">
                  <Dumbbell :size="18" />
                </div>
                <div class="record-item__content">
                  <strong>{{ exercise.exerciseName }}</strong>
                  <p>{{ exercise.durationMinutes }} 分鐘</p>
                </div>
                <div class="record-item__metric">
                  <strong>{{ exercise.totalCalories }}</strong>
                  <span>kcal</span>
                </div>
              </article>
            </div>

            <el-empty v-else description="今天還沒有運動紀錄" />
          </el-card>
        </el-col>

        <el-col :xs="24" :xl="8">
          <el-card shadow="hover" class="content-card dashboard-section dashboard-record-card">
            <template #header>
              <div class="card-header">
                <div>
                  <span>近期體重</span>
                  <p class="card-subtitle">顯示最新 4 筆體重紀錄</p>
                </div>
                <el-button plain @click="router.push('/weights')">查看全部</el-button>
              </div>
            </template>

            <div v-if="latestWeights.length" class="record-list">
              <article v-for="item in latestWeights" :key="item.id" class="record-item">
                <div class="record-item__icon record-item__icon--neutral">
                  <TrendingUp :size="18" />
                </div>
                <div class="record-item__content">
                  <strong>{{ item.weight }} kg</strong>
                  <p>{{ item.recordDate }}</p>
                </div>
                <div class="record-item__metric">
                  <strong>{{ profileStore.profile.height ? Math.round((item.weight / ((profileStore.profile.height / 100) ** 2)) * 10) / 10 : '--' }}</strong>
                  <span>BMI</span>
                </div>
              </article>
            </div>

            <el-empty v-else description="目前還沒有體重紀錄" />
          </el-card>
        </el-col>
      </el-row>
    </section>
  </div>
</template>

<style scoped>
.dashboard-page {
  gap: 22px;
}

.dashboard-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 360px);
  gap: 24px;
  align-items: center;
  padding: 34px;
  border-radius: 34px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(251, 253, 252, 0.94));
  border: 1px solid rgba(36, 50, 51, 0.08);
  box-shadow:
    0 26px 60px rgba(33, 58, 55, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  overflow: hidden;
  contain: layout paint style;
}

.dashboard-hero__glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(10px);
  pointer-events: none;
}

.dashboard-hero__glow--a {
  top: -64px;
  right: 12%;
  width: 220px;
  height: 220px;
  background: rgba(77, 163, 255, 0.1);
}

.dashboard-hero__glow--b {
  bottom: -96px;
  left: -32px;
  width: 260px;
  height: 260px;
  background: rgba(80, 203, 151, 0.08);
}

.dashboard-hero__content,
.dashboard-hero__ring-shell {
  position: relative;
  z-index: 1;
}

.dashboard-hero__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.dashboard-hero__pill,
.dashboard-hero__date {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(36, 50, 51, 0.08);
  color: var(--text-main);
  font-size: 13px;
  font-weight: 700;
}

.dashboard-hero__date {
  color: var(--text-muted);
}

.dashboard-hero__content h3 {
  margin: 0;
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.1;
}

.hero-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.hero-note {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.26));
  border: 1px solid rgba(255, 255, 255, 0.46);
  color: var(--text-main);
  box-shadow:
    0 18px 36px rgba(33, 58, 55, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px) saturate(126%);
}

.hero-note--deficit {
  background: linear-gradient(135deg, rgba(255, 232, 238, 0.72), rgba(255, 218, 229, 0.38));
  border-color: rgba(255, 255, 255, 0.42);
  color: #8f1239;
}

.hero-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 24px;
}

.hero-meta-card {
  position: relative;
  padding: 18px 18px 18px 62px;
  border-radius: 24px;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.18));
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 22px 42px rgba(33, 58, 55, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px) saturate(128%);
  overflow: hidden;
  contain: layout paint style;
}

.hero-meta-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.04) 58%);
  pointer-events: none;
}

.hero-meta-card > * {
  position: relative;
  z-index: 1;
}

.hero-meta-card__icon {
  position: absolute;
  top: 18px;
  left: 18px;
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--text-main);
}

.hero-meta-card--goal .hero-meta-card__icon {
  background: #e9f8e8;
}

.hero-meta-card--exercise .hero-meta-card__icon {
  background: #e9f4ff;
}

.hero-meta-card--bmr .hero-meta-card__icon {
  background: #fff0e1;
}

.hero-meta-card--weight .hero-meta-card__icon {
  background: #f1eeff;
}

.hero-meta-card span,
.hero-meta-card p,
.dashboard-kpi p,
.dashboard-kpi span,
.record-item__content p,
.record-item__metric span {
  color: var(--text-muted);
}

.hero-meta-card span,
.dashboard-kpi p {
  display: block;
  margin-bottom: 8px;
}

.hero-meta-card strong {
  display: block;
  font-size: 28px;
}

.hero-meta-card p {
  margin: 8px 0 0;
}

.dashboard-hero__ring-shell {
  padding: 24px;
  border-radius: 30px;
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.18));
  border: 1px solid rgba(255, 255, 255, 0.48);
  box-shadow:
    0 24px 48px rgba(33, 58, 55, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px) saturate(128%);
  contain: layout paint style;
}

.dashboard-hero__ring-copy {
  text-align: center;
  margin-bottom: 18px;
}

.dashboard-hero__ring-copy span,
.dashboard-hero__ring-copy p {
  color: var(--text-muted);
}

.dashboard-hero__ring-copy span {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dashboard-hero__ring-copy strong {
  display: block;
  font-size: clamp(30px, 5vw, 42px);
  line-height: 1;
}

.dashboard-hero__ring-copy p {
  margin: 8px 0 0;
}

.dashboard-hero__ring {
  display: flex;
  justify-content: center;
}

.calorie-ring {
  --progress: 0%;
  --ring-color: #2d7a56;
  width: min(100%, 320px);
  aspect-ratio: 1;
  padding: 18px;
  border-radius: 50%;
  background:
    conic-gradient(var(--ring-color) var(--progress), rgba(45, 122, 86, 0.12) 0),
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(245, 250, 245, 0.88));
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 1px rgba(36, 50, 51, 0.06);
}

.calorie-ring__inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  display: grid;
  place-items: center;
  text-align: center;
  padding: 24px;
}

.calorie-ring__inner span {
  font-size: clamp(34px, 6vw, 48px);
  font-weight: 800;
  line-height: 1;
}

.calorie-ring__inner strong {
  margin-top: 10px;
  font-size: 20px;
}

.calorie-ring__inner p {
  margin: 8px 0 0;
  color: var(--text-muted);
}

.dashboard-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  content-visibility: auto;
  contain-intrinsic-size: 320px;
}

.dashboard-section {
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.18));
  box-shadow:
    0 24px 48px rgba(33, 58, 55, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(14px) saturate(128%);
  contain: layout paint style;
  content-visibility: auto;
  contain-intrinsic-size: 520px;
}

.dashboard-section--chart {
  position: relative;
}

.dashboard-section--chart::before,
.dashboard-record-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05) 55%);
  pointer-events: none;
  z-index: 0;
}

.dashboard-section :deep(.el-card__header),
.dashboard-section :deep(.el-card__body) {
  position: relative;
  z-index: 1;
}

.card-header--chart {
  gap: 16px;
}

.chart-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 234, 240, 0.72), rgba(255, 226, 234, 0.34));
  color: #8f1239;
  border: 1px solid rgba(255, 255, 255, 0.46);
  font-size: 13px;
  font-weight: 700;
  box-shadow:
    0 12px 24px rgba(143, 18, 57, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px) saturate(126%);
}

.chart-panel {
  margin: 0 -2px;
}

.deficit-strip {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(36, 50, 51, 0.08);
}

.deficit-strip__label {
  display: block;
  margin-bottom: 10px;
  color: #9f1239;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.deficit-strip__items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.deficit-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 233, 239, 0.78), rgba(255, 218, 229, 0.42));
  color: #8f1239;
  border: 1px solid rgba(255, 255, 255, 0.48);
  font-size: 13px;
  font-weight: 700;
  box-shadow:
    0 10px 20px rgba(143, 18, 57, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px) saturate(122%);
}

.dashboard-kpi {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 208px;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
  box-shadow:
    0 22px 40px rgba(33, 58, 55, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(12px) saturate(126%);
  overflow: hidden;
  contain: layout paint style;
}

.dashboard-kpi::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.06) 60%);
  pointer-events: none;
}

.dashboard-kpi > * {
  position: relative;
  z-index: 1;
}

.dashboard-kpi:hover,
.quick-action-card:hover,
.record-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 38px rgba(33, 58, 55, 0.09);
}

.dashboard-kpi__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dashboard-kpi__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.34));
  border: 1px solid rgba(255, 255, 255, 0.44);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.dashboard-kpi__value {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.dashboard-kpi strong {
  font-size: clamp(38px, 5vw, 48px);
  line-height: 1;
}

.dashboard-kpi__note {
  display: block;
  margin-top: 10px;
  color: var(--text-muted);
  line-height: 1.5;
}

.dashboard-kpi--warm {
  background: linear-gradient(145deg, rgba(255, 226, 190, 0.92), rgba(255, 188, 122, 0.58));
  border-color: rgba(255, 177, 92, 0.26);
}

.dashboard-kpi--cool {
  background: linear-gradient(145deg, rgba(219, 239, 255, 0.92), rgba(158, 212, 255, 0.58));
  border-color: rgba(94, 173, 255, 0.24);
}

.dashboard-kpi--violet {
  background: linear-gradient(145deg, rgba(235, 228, 255, 0.92), rgba(193, 176, 255, 0.58));
  border-color: rgba(145, 118, 255, 0.24);
}

.dashboard-kpi--fresh {
  background: linear-gradient(145deg, rgba(225, 247, 222, 0.92), rgba(160, 223, 153, 0.58));
  border-color: rgba(84, 188, 117, 0.24);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  content-visibility: auto;
  contain-intrinsic-size: 200px;
}

.quick-action-card {
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 18px 20px;
  border: 1px solid rgba(255, 255, 255, 0.48);
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.44), rgba(255, 255, 255, 0.18));
  color: var(--text-main);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  overflow: hidden;
  box-shadow:
    0 22px 40px rgba(33, 58, 55, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(12px) saturate(126%);
  contain: layout paint style;
}

.quick-action-card::after {
  content: '';
  position: absolute;
  inset: auto -30px -30px auto;
  width: 120px;
  height: 120px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.quick-action-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.04) 58%);
  pointer-events: none;
}

.quick-action-card:hover {
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow:
    0 26px 44px rgba(33, 58, 55, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.quick-action-card--green {
  background:
    radial-gradient(circle at top right, rgba(74, 197, 122, 0.24), transparent 30%),
    linear-gradient(145deg, rgba(239, 255, 238, 0.82), rgba(198, 238, 194, 0.36));
  border-color: rgba(84, 192, 117, 0.24);
}

.quick-action-card--blue {
  background:
    radial-gradient(circle at top right, rgba(91, 170, 255, 0.26), transparent 30%),
    linear-gradient(145deg, rgba(239, 248, 255, 0.82), rgba(195, 225, 255, 0.38));
  border-color: rgba(99, 177, 255, 0.24);
}

.quick-action-card--rose {
  background:
    radial-gradient(circle at top right, rgba(255, 120, 170, 0.22), transparent 30%),
    linear-gradient(145deg, rgba(255, 245, 248, 0.84), rgba(255, 211, 227, 0.4));
  border-color: rgba(255, 136, 178, 0.22);
}

.quick-action-card > * {
  position: relative;
  z-index: 1;
}

.quick-action-card strong {
  display: block;
  margin-bottom: 4px;
  font-size: 18px;
  text-align: left;
}

.quick-action-card__eyebrow {
  display: inline-block;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.quick-action-card p {
  margin: 0;
  color: var(--text-muted);
  text-align: left;
}

.quick-action-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.quick-action-card__icon--green {
  background: linear-gradient(145deg, rgba(223, 247, 220, 0.96), rgba(159, 221, 153, 0.62));
}

.quick-action-card__icon--blue {
  background: linear-gradient(145deg, rgba(221, 240, 255, 0.96), rgba(160, 208, 255, 0.62));
}

.quick-action-card__icon--rose {
  background: linear-gradient(145deg, rgba(255, 238, 244, 0.96), rgba(255, 196, 218, 0.62));
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-record-card {
  min-height: 100%;
}

.record-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 16px;
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.16));
  border: 1px solid rgba(255, 255, 255, 0.42);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
  box-shadow:
    0 16px 30px rgba(33, 58, 55, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px) saturate(122%);
  contain: layout paint style;
}

.record-item__icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.record-item__icon--warm {
  background: linear-gradient(145deg, rgba(255, 240, 225, 0.88), rgba(255, 222, 191, 0.46));
}

.record-item__icon--cool {
  background: linear-gradient(145deg, rgba(233, 244, 255, 0.88), rgba(210, 232, 255, 0.46));
}

.record-item__icon--neutral {
  background: linear-gradient(145deg, rgba(240, 241, 245, 0.9), rgba(223, 226, 235, 0.5));
}

.record-item__content strong,
.record-item__metric strong {
  display: block;
}

.record-item__content p,
.record-item__metric span {
  margin: 4px 0 0;
}

.record-item__metric {
  text-align: right;
}

@media (max-width: 1200px) {
  .dashboard-hero,
  .quick-actions {
    grid-template-columns: 1fr;
  }

  .dashboard-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-hero {
    padding: 22px;
    border-radius: 24px;
  }

  .dashboard-hero__ring-shell {
    padding: 20px;
    border-radius: 24px;
  }

  .hero-meta,
  .dashboard-kpi-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-kpi {
    min-height: 164px;
  }

  .card-header--chart {
    align-items: flex-start;
  }

  .chart-header-badge {
    align-self: flex-start;
  }
}

@media (max-width: 640px) {
  .dashboard-page {
    gap: 18px;
  }

  .hero-note {
    width: 100%;
    justify-content: flex-start;
  }

  .record-item {
    grid-template-columns: auto 1fr;
  }

  .record-item__metric {
    grid-column: 2;
    text-align: left;
  }
}
</style>
