<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  option: EChartsOption
}>()

const chartElement = ref<HTMLDivElement | null>(null)
let chartInstance: import('echarts').ECharts | null = null
let echartsModule: typeof import('echarts') | null = null
let renderFrameId: number | null = null

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

function scheduleRender() {
  if (renderFrameId !== null) {
    window.cancelAnimationFrame(renderFrameId)
  }

  renderFrameId = window.requestAnimationFrame(() => {
    renderFrameId = null
    void renderChart()
  })
}

function handleResize() {
  chartInstance?.resize()
}

watch(
  () => props.option,
  async () => {
    await nextTick()
    scheduleRender()
  },
  { deep: true },
)

onMounted(() => {
  scheduleRender()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (renderFrameId !== null) {
    window.cancelAnimationFrame(renderFrameId)
    renderFrameId = null
  }

  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div ref="chartElement" class="statistics-chart"></div>
</template>
