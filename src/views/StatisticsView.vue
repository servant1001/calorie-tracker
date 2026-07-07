<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed, onMounted } from 'vue'

import StatisticsChart from '@/components/StatisticsChart.vue'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useFoodsStore } from '@/stores/foods'
import { useProfileStore } from '@/stores/profile'
import { useWeightsStore } from '@/stores/weights'
import { calculateBmr } from '@/utils/health'
import { calculateAverage, buildDailyCalorieStats, buildWeightTrendStats, getLastItems } from '@/utils/statistics'
import { showError } from '@/utils/message'

const authStore = useAuthStore()
const foodsStore = useFoodsStore()
const exercisesStore = useExercisesStore()
const profileStore = useProfileStore()
const weightsStore = useWeightsStore()

const basalBurnPerDay = computed(() =>
  calculateBmr({
    ...profileStore.profile,
    weight: weightsStore.latestWeight ?? profileStore.profile.weight,
  }),
)

const calorieStats = computed(() =>
  buildDailyCalorieStats(foodsStore.records, exercisesStore.records, basalBurnPerDay.value),
)
const weightStats = computed(() => buildWeightTrendStats(weightsStore.records))

const last7Days = computed(() => getLastItems(calorieStats.value, 7))
const last30Days = computed(() => getLastItems(calorieStats.value, 30))
const displayedCalorieStats = computed(() => getLastItems(calorieStats.value, 14))

const weeklyAverageIntake = computed(() => calculateAverage(last7Days.value.map((item) => item.intake)))
const weeklyAverageBurn = computed(() => calculateAverage(last7Days.value.map((item) => item.burn)))
const weeklyAverageExerciseBurn = computed(() => calculateAverage(last7Days.value.map((item) => item.exerciseBurn)))
const monthlyAverageNet = computed(() => calculateAverage(last30Days.value.map((item) => item.net)))
const latestWeight = computed(() => getLastItems(weightStats.value, 1)[0]?.weight ?? 0)
const deficitDays = computed(() => displayedCalorieStats.value.filter((item) => item.net < 0))
const peakIntakeDay = computed(() =>
  displayedCalorieStats.value.reduce<(typeof displayedCalorieStats.value)[number] | null>(
    (max, item) => (!max || item.intake > max.intake ? item : max),
    null,
  ),
)
const highestBurnDay = computed(() =>
  displayedCalorieStats.value.reduce<(typeof displayedCalorieStats.value)[number] | null>(
    (max, item) => (!max || item.burn > max.burn ? item : max),
    null,
  ),
)
const bestDeficitDay = computed(() =>
  deficitDays.value.reduce<(typeof deficitDays.value)[number] | null>(
    (best, item) => (!best || item.net < best.net ? item : best),
    null,
  ),
)

const calorieChartOption = computed<EChartsOption>(() => ({
  animationDuration: 550,
  color: ['#f0a35e', '#7fb8ff', '#ffb454', '#2d7a56'],
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(36, 50, 51, 0.08)',
    textStyle: {
      color: '#243233',
    },
    valueFormatter: (value) => `${value} kcal`,
  },
  legend: {
    top: 0,
    data: ['攝取熱量', '基礎代謝 BMR', '總消耗', '淨熱量'],
    textStyle: {
      color: '#617070',
    },
  },
  grid: {
    left: 18,
    right: 20,
    bottom: 18,
    top: 56,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: displayedCalorieStats.value.map((item) => item.date.slice(5)),
    axisLabel: {
      color: '#617070',
    },
    axisLine: {
      lineStyle: {
        color: 'rgba(36, 50, 51, 0.14)',
      },
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
      name: '攝取熱量',
      type: 'bar',
      barMaxWidth: 18,
      data: displayedCalorieStats.value.map((item) => item.intake),
      itemStyle: {
        color: '#f5a46b',
        borderRadius: [8, 8, 0, 0],
      },
    },
    {
      name: '基礎代謝 BMR',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: displayedCalorieStats.value.map((item) => item.basalBurn),
      lineStyle: {
        color: '#ffb454',
        type: 'dashed',
        width: 2,
      },
    },
    {
      name: '總消耗',
      type: 'bar',
      barMaxWidth: 18,
      data: displayedCalorieStats.value.map((item) => item.burn),
      itemStyle: {
        color: '#72b7ff',
        borderRadius: [8, 8, 0, 0],
      },
    },
    {
      name: '淨熱量',
      type: 'line',
      smooth: true,
      data: displayedCalorieStats.value.map((item) => item.net),
      lineStyle: {
        color: '#2d7a56',
        width: 3,
      },
      itemStyle: {
        color: '#2d7a56',
      },
      areaStyle: {
        color: 'rgba(45, 122, 86, 0.08)',
      },
    },
    {
      name: '赤字日',
      type: 'scatter',
      symbol: 'roundRect',
      symbolSize: [12, 12],
      itemStyle: {
        color: '#be185d',
      },
      label: {
        show: true,
        position: 'top',
        distance: 14,
        formatter: (params) => {
          const value = typeof params.data === 'object' && params.data && 'net' in params.data
            ? Math.round(Math.abs(Number(params.data.net)))
            : 0

          return `{deficit|赤字 ${value}}`
        },
        rich: {
          deficit: {
            color: '#9f1239',
            backgroundColor: '#ffe4ea',
            borderColor: 'rgba(190, 24, 93, 0.24)',
            borderWidth: 1,
            borderRadius: 999,
            padding: [5, 10],
            fontSize: 12,
            fontWeight: 700,
          },
        },
      },
      data: displayedCalorieStats.value.map((item) =>
        item.net < 0
          ? {
              value: item.net,
              net: item.net,
            }
          : null,
      ),
    },
  ],
}))

const weightChartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
  },
  grid: {
    left: 16,
    right: 16,
    bottom: 16,
    top: 24,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: weightStats.value.map((item) => item.date),
    axisLabel: {
      color: '#617070',
    },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#617070',
    },
    min: (value) => Math.floor(value.min - 1),
    max: (value) => Math.ceil(value.max + 1),
  },
  series: [
    {
      name: '體重',
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(255, 155, 167, 0.18)',
      },
      lineStyle: {
        color: '#e47a8d',
        width: 3,
      },
      itemStyle: {
        color: '#d76177',
      },
      data: weightStats.value.map((item) => item.weight),
    },
  ],
}))

async function loadStatisticsData() {
  if (!authStore.userId) {
    return
  }

  try {
    await Promise.all([
      foodsStore.fetchFoods(authStore.userId),
      exercisesStore.fetchExercises(authStore.userId),
      profileStore.fetchProfile(authStore.userId),
      weightsStore.fetchWeights(authStore.userId),
    ])
  } catch (error) {
    showError(error, '讀取統計資料失敗，請稍後再試。')
  }
}

onMounted(async () => {
  await loadStatisticsData()
})
</script>

<template>
  <div class="page-stack journal-page statistics-page">
    <section class="hero-panel hero-panel--statistics journal-hero statistics-hero">
      <div>
        <p class="section-kicker">Statistics</p>
        <h3>用圖表把每日熱量與體重趨勢看得更明白</h3>
        <p class="section-copy section-copy--dark">
          這裡先整理每日攝取、基礎代謝、總消耗、淨熱量與體重變化，之後可以再延伸週報、月報與 AI 分析。
        </p>
      </div>

      <div class="hero-stats">
        <article class="hero-stat-card hero-stat-card--sun">
          <span>近 7 日平均攝取</span>
          <strong>{{ weeklyAverageIntake }} kcal</strong>
        </article>
        <article class="hero-stat-card hero-stat-card--cool">
          <span>每日基礎代謝 BMR</span>
          <strong>{{ basalBurnPerDay }} kcal</strong>
        </article>
        <article class="hero-stat-card">
          <span>近 7 日平均總消耗</span>
          <strong>{{ weeklyAverageBurn }} kcal</strong>
        </article>
        <article class="hero-stat-card hero-stat-card--rose">
          <span>最新體重</span>
          <strong>{{ latestWeight ? `${latestWeight} kg` : '尚無資料' }}</strong>
        </article>
      </div>
    </section>

    <el-row :gutter="16">
      <el-col :xs="24" :xl="16">
        <el-card shadow="hover" class="content-card journal-shell-card statistics-shell-card">
          <template #header>
            <div class="card-header">
              <div>
                <span>每日熱量統計</span>
                <p class="card-subtitle">聚焦最近 14 天的攝取、總消耗、BMR 與淨熱量節奏。</p>
              </div>
              <div class="statistics-tag-group">
                <el-tag type="success" effect="plain">近 {{ displayedCalorieStats.length }} 天</el-tag>
                <el-tag type="danger" effect="plain">{{ deficitDays.length }} 天赤字</el-tag>
              </div>
            </div>
          </template>

          <div class="statistics-insight-grid">
            <article class="statistics-insight-card statistics-insight-card--warm">
              <span>最高攝取日</span>
              <strong>{{ peakIntakeDay ? `${peakIntakeDay.intake} kcal` : '--' }}</strong>
              <p>{{ peakIntakeDay ? peakIntakeDay.date : '尚無資料' }}</p>
            </article>

            <article class="statistics-insight-card statistics-insight-card--cool">
              <span>最高總消耗日</span>
              <strong>{{ highestBurnDay ? `${highestBurnDay.burn} kcal` : '--' }}</strong>
              <p>{{ highestBurnDay ? highestBurnDay.date : '尚無資料' }}</p>
            </article>

            <article class="statistics-insight-card statistics-insight-card--rose">
              <span>最佳赤字日</span>
              <strong>{{ bestDeficitDay ? `${Math.round(Math.abs(bestDeficitDay.net))} kcal` : '--' }}</strong>
              <p>{{ bestDeficitDay ? bestDeficitDay.date : '目前沒有赤字日' }}</p>
            </article>
          </div>

          <StatisticsChart :option="calorieChartOption" />
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="8">
        <el-card shadow="hover" class="content-card journal-shell-card statistics-shell-card">
          <template #header>
            <div class="card-header">
              <div>
                <span>分析摘要</span>
                <p class="card-subtitle">先用週/月平均快速掌握狀態</p>
              </div>
            </div>
          </template>

          <div class="summary-stack">
            <article class="summary-block statistics-summary-block">
              <span>近 7 日平均攝取熱量</span>
              <strong>{{ weeklyAverageIntake }} kcal</strong>
            </article>
            <article class="summary-block statistics-summary-block">
              <span>近 7 日平均消耗熱量</span>
              <strong>{{ weeklyAverageBurn }} kcal</strong>
            </article>
            <article class="summary-block statistics-summary-block">
              <span>近 7 日平均運動消耗</span>
              <strong>{{ weeklyAverageExerciseBurn }} kcal</strong>
            </article>
            <article class="summary-block statistics-summary-block">
              <span>近 30 日平均淨熱量</span>
              <strong>{{ monthlyAverageNet }} kcal</strong>
            </article>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="content-card journal-shell-card statistics-shell-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>體重趨勢</span>
            <p class="card-subtitle">依紀錄日期顯示體重變化</p>
          </div>
          <el-tag type="danger" effect="plain">近 {{ weightStats.length }} 筆</el-tag>
        </div>
      </template>

      <StatisticsChart :option="weightChartOption" />
    </el-card>
  </div>
</template>

<style scoped>
.statistics-tag-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.statistics-insight-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.statistics-insight-card {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  box-shadow:
    0 14px 28px rgba(33, 58, 55, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.statistics-insight-card span,
.statistics-insight-card p {
  color: var(--text-muted);
}

.statistics-insight-card span {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
}

.statistics-insight-card strong {
  display: block;
  font-size: 28px;
  line-height: 1.1;
}

.statistics-insight-card p {
  margin: 8px 0 0;
}

.statistics-insight-card--warm {
  background:
    radial-gradient(circle at top right, rgba(255, 182, 117, 0.22), transparent 28%),
    linear-gradient(145deg, rgba(255, 245, 232, 0.88), rgba(255, 229, 198, 0.44));
}

.statistics-insight-card--cool {
  background:
    radial-gradient(circle at top right, rgba(120, 184, 255, 0.22), transparent 28%),
    linear-gradient(145deg, rgba(241, 248, 255, 0.88), rgba(216, 233, 255, 0.44));
}

.statistics-insight-card--rose {
  background:
    radial-gradient(circle at top right, rgba(255, 138, 176, 0.22), transparent 28%),
    linear-gradient(145deg, rgba(255, 245, 248, 0.88), rgba(255, 223, 233, 0.44));
}

@media (max-width: 768px) {
  .statistics-insight-grid {
    grid-template-columns: 1fr;
  }
}
</style>
