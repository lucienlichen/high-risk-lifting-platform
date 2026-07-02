<template>
  <div ref="el" class="svc-echart"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{ option: echarts.EChartsOption }>()

const el = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let ro: ResizeObserver | null = null

const render = () => { if (chart) chart.setOption(props.option, true) }

onMounted(() => {
  if (!el.value) return
  chart = echarts.init(el.value)
  render()
  ro = new ResizeObserver(() => chart?.resize())
  ro.observe(el.value)
})
watch(() => props.option, render, { deep: true })
onBeforeUnmount(() => { ro?.disconnect(); chart?.dispose(); chart = null })
</script>

<style scoped>
.svc-echart { width: 100%; height: 100%; min-height: 240px; }
</style>
