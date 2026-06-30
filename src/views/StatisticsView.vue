<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed, onMounted } from 'vue'

import StatisticsChart from '@/components/StatisticsChart.vue'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useFoodsStore } from '@/stores/foods'
import { useWeightsStore } from '@/stores/weights'
import { calculateAverage, buildDailyCalorieStats, buildWeightTrendStats, getLastItems } from '@/utils/statistics'
import { showError } from '@/utils/message'

const authStore = useAuthStore()
const foodsStore = useFoodsStore()
const exercisesStore = useExercisesStore()
const weightsStore = useWeightsStore()

const calorieStats = computed(() => buildDailyCalorieStats(foodsStore.records, exercisesStore.records))
const weightStats = computed(() => buildWeightTrendStats(weightsStore.records))

const last7Days = computed(() => getLastItems(calorieStats.value, 7))
const last30Days = computed(() => getLastItems(calorieStats.value, 30))

const weeklyAverageIntake = computed(() => calculateAverage(last7Days.value.map((item) => item.intake)))
const weeklyAverageBurn = computed(() => calculateAverage(last7Days.value.map((item) => item.burn)))
const monthlyAverageNet = computed(() => calculateAverage(last30Days.value.map((item) => item.net)))
const latestWeight = computed(() => getLastItems(weightStats.value, 1)[0]?.weight ?? 0)

const calorieChartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    top: 0,
  },
  grid: {
    left: 16,
    right: 16,
    bottom: 16,
    top: 48,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: calorieStats.value.map((item) => item.date),
    axisLabel: {
      color: '#617070',
    },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#617070',
    },
  },
  series: [
    {
      name: '攝取熱量',
      type: 'bar',
      data: calorieStats.value.map((item) => item.intake),
      itemStyle: {
        color: '#f5a46b',
        borderRadius: [8, 8, 0, 0],
      },
    },
    {
      name: '消耗熱量',
      type: 'bar',
      data: calorieStats.value.map((item) => item.burn),
      itemStyle: {
        color: '#72b7ff',
        borderRadius: [8, 8, 0, 0],
      },
    },
    {
      name: '淨熱量',
      type: 'line',
      smooth: true,
      data: calorieStats.value.map((item) => item.net),
      lineStyle: {
        color: '#2d7a56',
        width: 3,
      },
      itemStyle: {
        color: '#2d7a56',
      },
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
  <div class="page-stack">
    <section class="hero-panel hero-panel--statistics">
      <div>
        <p class="section-kicker">Statistics</p>
        <h3>用圖表把每日熱量與體重趨勢看得更明白</h3>
        <p class="section-copy section-copy--dark">
          這裡先整理每日攝取、消耗、淨熱量與體重變化，之後可以再延伸週報、月報與 AI 分析。
        </p>
      </div>

      <div class="hero-stats">
        <article class="hero-stat-card hero-stat-card--sun">
          <span>近 7 日平均攝取</span>
          <strong>{{ weeklyAverageIntake }} kcal</strong>
        </article>
        <article class="hero-stat-card hero-stat-card--cool">
          <span>近 7 日平均消耗</span>
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
        <el-card shadow="hover" class="content-card">
          <template #header>
            <div class="card-header">
              <div>
                <span>每日熱量統計</span>
                <p class="card-subtitle">攝取、消耗與淨熱量的日別趨勢</p>
              </div>
              <el-tag type="success" effect="plain">近 {{ calorieStats.length }} 天</el-tag>
            </div>
          </template>

          <StatisticsChart :option="calorieChartOption" />
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="8">
        <el-card shadow="hover" class="content-card">
          <template #header>
            <div class="card-header">
              <div>
                <span>分析摘要</span>
                <p class="card-subtitle">先用週/月平均快速掌握狀態</p>
              </div>
            </div>
          </template>

          <div class="summary-stack">
            <article class="summary-block">
              <span>近 7 日平均攝取熱量</span>
              <strong>{{ weeklyAverageIntake }} kcal</strong>
            </article>
            <article class="summary-block">
              <span>近 7 日平均消耗熱量</span>
              <strong>{{ weeklyAverageBurn }} kcal</strong>
            </article>
            <article class="summary-block">
              <span>近 30 日平均淨熱量</span>
              <strong>{{ monthlyAverageNet }} kcal</strong>
            </article>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="content-card">
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
