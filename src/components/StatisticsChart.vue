<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  option: EChartsOption
}>()

const chartElement = ref<HTMLDivElement | null>(null)
let chartInstance: import('echarts').ECharts | null = null
let echartsModule: typeof import('echarts') | null = null

async function loadEcharts() {
  if (!echartsModule) {
    echartsModule = await import('echarts')
  }

  return echartsModule
}

async function renderChart() {
  if (!chartElement.value) {
    return
  }

  const echarts = await loadEcharts()

  chartInstance ??= echarts.init(chartElement.value)
  chartInstance.setOption(props.option, true)
  chartInstance.resize()
}

function handleResize() {
  chartInstance?.resize()
}

watch(
  () => props.option,
  async () => {
    await nextTick()
    await renderChart()
  },
  { deep: true },
)

onMounted(() => {
  void renderChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div ref="chartElement" class="statistics-chart"></div>
</template>
