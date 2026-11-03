<template>
  <section class="basic-overview" aria-label="设备监管基础数据概览">
    <div class="basic-overview-metrics">
      <div v-for="item in metricCards" :key="item.label" class="basic-metric">
        <div :class="['basic-metric-icon', `basic-metric-icon--${item.tone}`]">
          <component :is="item.icon" />
        </div>
        <div class="basic-metric-content">
          <span class="basic-metric-label">{{ item.label }}</span>
          <strong :class="['basic-metric-value', `basic-metric-value--${item.tone}`]">
            {{ item.value }}<small>{{ item.unit }}</small>
          </strong>
        </div>
      </div>
    </div>

    <div class="basic-overview-charts">
      <article class="basic-chart-panel">
        <header class="basic-chart-header">
          <h3>按设备类型分布</h3>
          <span>共 {{ summary.total }} 台</span>
        </header>
        <div ref="typeChartEl" class="basic-chart" role="img" aria-label="设备类型分布图"></div>
      </article>

      <article class="basic-chart-panel">
        <header class="basic-chart-header">
          <h3>按工作级别分布</h3>
          <span>GB/T 3811 工作级别</span>
        </header>
        <div ref="levelChartEl" class="basic-chart" role="img" aria-label="工作级别分布图"></div>
      </article>

      <article class="basic-chart-panel basic-chart-panel--wide">
        <header class="basic-chart-header">
          <h3>按投入时间分布</h3>
          <span>按投用年份统计</span>
        </header>
        <div ref="yearChartEl" class="basic-chart basic-chart--year" role="img" aria-label="设备投入年份分布图"></div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Box, CircleCheck, Timer, VideoPause, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { Device } from '@/mock'

const props = defineProps<{ devices: Device[] }>()

const CURRENT_YEAR = new Date().getFullYear()
const typeChartEl = ref<HTMLElement | null>(null)
const levelChartEl = ref<HTMLElement | null>(null)
const yearChartEl = ref<HTMLElement | null>(null)
let typeChart: echarts.ECharts | null = null
let levelChart: echarts.ECharts | null = null
let yearChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function technicalValue(device: Device, name: string) {
  return device.technicalParams?.find(item => item.name === name)?.value?.trim() || ''
}

function deviceTypeGroup(type: string) {
  if (type.includes('门座')) return '门座式起重机'
  if (type.includes('门式')) return '门式起重机'
  if (type.includes('塔式') || type.includes('塔吊')) return '塔式起重机'
  if (/(流动|汽车|履带|随车)/.test(type)) return '流动式起重机'
  if (type.includes('缆索')) return '缆索起重机'
  if (/(桥式|单梁|双梁|天车|电动葫芦|吊钩|抓斗|夹钳|磁盘)/.test(type)) return '桥式起重机'
  return '其他起重设备'
}

function workLevel(device: Device) {
  const raw = technicalValue(device, '工作级别').toUpperCase().replace(/\s+/g, '')
  const match = raw.match(/^(A|M)[1-8]$/)
  return match ? match[0] : '未标注'
}

function installYear(device: Device) {
  const match = device.installDate?.match(/(?:19|20)\d{2}/)
  if (!match) return null
  const year = Number(match[0])
  return year >= 1950 && year <= CURRENT_YEAR ? year : null
}

function countValues(values: string[]) {
  const counts = new Map<string, number>()
  values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1))
  return counts
}

const summary = computed(() => {
  const devices = props.devices
  const years = devices.map(installYear).filter((year): year is number => year !== null)
  const avgAge = years.length
    ? Math.round((years.reduce((total, year) => total + CURRENT_YEAR - year, 0) / years.length) * 10) / 10
    : 0

  return {
    total: devices.length,
    running: devices.filter(device => device.status === 'running').length,
    standby: devices.filter(device => device.status === 'standby').length,
    attention: devices.filter(device => device.status === 'stopped' || device.status === 'maintenance').length,
    avgAge
  }
})

const metricCards = computed(() => [
  { label: '在册设备', value: summary.value.total, unit: '台', icon: Box, tone: 'primary' },
  { label: '运行中', value: summary.value.running, unit: '台', icon: CircleCheck, tone: 'success' },
  { label: '待机', value: summary.value.standby, unit: '台', icon: VideoPause, tone: 'muted' },
  { label: '停机 / 维修', value: summary.value.attention, unit: '台', icon: Warning, tone: 'warning' },
  { label: '平均役龄', value: summary.value.avgAge, unit: '年', icon: Timer, tone: 'secondary' }
])

const typeDistribution = computed(() => {
  const entries = [...countValues(props.devices.map(device => deviceTypeGroup(device.type || ''))).entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
  return entries.map(([name, value]) => ({ name, value }))
})

const levelDistribution = computed(() => {
  const counts = countValues(props.devices.map(workLevel))
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      if (a.name === '未标注') return 1
      if (b.name === '未标注') return -1
      return a.name.localeCompare(b.name, 'zh-CN', { numeric: true })
    })
})

const yearDistribution = computed(() => {
  const counts = new Map<string, number>()
  props.devices.forEach(device => {
    const year = installYear(device)
    const key = year === null ? '未知' : year < 2010 ? '2010以前' : String(year)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  const years = [...counts.keys()].filter(key => /^\d{4}$/.test(key)).sort()
  const keys = [
    ...(counts.has('2010以前') ? ['2010以前'] : []),
    ...years,
    ...(counts.has('未知') ? ['未知'] : [])
  ]
  return keys.map(name => ({ name, value: counts.get(name) ?? 0 }))
})

function cssColor(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function commonAxis() {
  const border = cssColor('--color-border')
  const borderLight = cssColor('--color-border-light')
  const muted = cssColor('--color-text-muted')
  return {
    axisLine: { lineStyle: { color: border } },
    axisTick: { show: false },
    axisLabel: { color: muted, fontSize: 10 },
    splitLine: { lineStyle: { color: borderLight } }
  }
}

function renderCharts() {
  if (!typeChart || !levelChart || !yearChart) return
  const text = cssColor('--color-text-secondary')
  const card = cssColor('--color-card-bg')
  const palette = [
    cssColor('--color-primary'),
    cssColor('--color-success'),
    cssColor('--color-warning'),
    cssColor('--color-danger'),
    cssColor('--color-primary-hover'),
    cssColor('--color-header-bg2'),
    cssColor('--color-standby'),
    cssColor('--color-text-secondary')
  ]

  typeChart.setOption({
    aria: { enabled: true },
    color: palette,
    tooltip: { trigger: 'item', confine: true, formatter: '{b}：{c} 台（{d}%）' },
    legend: { type: 'scroll', bottom: 4, textStyle: { color: text, fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
    series: [{
      type: 'pie',
      radius: ['42%', '67%'],
      center: ['50%', '42%'],
      itemStyle: { borderColor: card, borderWidth: 2 },
      label: { color: text, fontSize: 11, formatter: '{b}\n{c} 台' },
      data: typeDistribution.value
    }]
  }, true)

  const levelAxis = commonAxis()
  levelChart.setOption({
    aria: { enabled: true },
    grid: { left: 12, right: 16, top: 18, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', confine: true, formatter: '工作级别 {b}：{c0} 台' },
    xAxis: {
      type: 'category',
      data: levelDistribution.value.map(item => item.name),
      axisLine: levelAxis.axisLine,
      axisTick: levelAxis.axisTick,
      axisLabel: { ...levelAxis.axisLabel, interval: 0, hideOverlap: true }
    },
    yAxis: { type: 'value', minInterval: 1, axisLabel: levelAxis.axisLabel, splitLine: levelAxis.splitLine },
    series: [{
      type: 'bar',
      barMaxWidth: 30,
      data: levelDistribution.value.map(item => item.value),
      itemStyle: { color: cssColor('--color-primary-hover'), borderRadius: [3, 3, 0, 0] }
    }]
  }, true)

  const yearAxis = commonAxis()
  yearChart.setOption({
    aria: { enabled: true },
    grid: { left: 12, right: 18, top: 18, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', confine: true, formatter: '{b}：{c0} 台' },
    xAxis: {
      type: 'category',
      data: yearDistribution.value.map(item => item.name),
      axisLine: yearAxis.axisLine,
      axisTick: yearAxis.axisTick,
      axisLabel: { ...yearAxis.axisLabel, interval: 0, hideOverlap: true }
    },
    yAxis: { type: 'value', minInterval: 1, axisLabel: yearAxis.axisLabel, splitLine: yearAxis.splitLine },
    series: [{
      type: 'bar',
      barMaxWidth: 24,
      data: yearDistribution.value.map(item => item.value),
      itemStyle: { color: cssColor('--color-primary'), borderRadius: [3, 3, 0, 0] }
    }]
  }, true)
}

onMounted(async () => {
  await nextTick()
  if (!typeChartEl.value || !levelChartEl.value || !yearChartEl.value) return
  typeChart = echarts.init(typeChartEl.value)
  levelChart = echarts.init(levelChartEl.value)
  yearChart = echarts.init(yearChartEl.value)
  renderCharts()

  resizeObserver = new ResizeObserver(() => {
    typeChart?.resize()
    levelChart?.resize()
    yearChart?.resize()
  })
  resizeObserver.observe(typeChartEl.value)
  resizeObserver.observe(levelChartEl.value)
  resizeObserver.observe(yearChartEl.value)
})

watch(() => props.devices, renderCharts, { deep: true })

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  typeChart?.dispose()
  levelChart?.dispose()
  yearChart?.dispose()
})
</script>

<style scoped>
.basic-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.basic-overview-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.basic-metric {
  min-width: 0;
  min-height: 72px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 11px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--color-card-shadow);
}

.basic-metric-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.basic-metric-icon :deep(svg) {
  width: 19px;
  height: 19px;
}

.basic-metric-icon--primary { color: var(--color-primary); background: var(--color-primary-light); }
.basic-metric-icon--success { color: var(--color-success); background: var(--color-success-bg); }
.basic-metric-icon--muted { color: var(--color-standby); background: var(--color-standby-bg); }
.basic-metric-icon--warning { color: var(--color-warning); background: var(--color-warning-bg); }
.basic-metric-icon--secondary { color: var(--color-text-secondary); background: var(--color-border-light); }

.basic-metric-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.basic-metric-label {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.basic-metric-value {
  color: var(--color-text-primary);
  font-size: 22px;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}

.basic-metric-value small {
  margin-left: 4px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 400;
}

.basic-metric-value--primary { color: var(--color-primary); }
.basic-metric-value--success { color: var(--color-success); }
.basic-metric-value--muted { color: var(--color-standby); }
.basic-metric-value--warning { color: var(--color-warning); }

.basic-overview-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.basic-chart-panel {
  min-width: 0;
  overflow: hidden;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--color-card-shadow);
}

.basic-chart-panel--wide {
  grid-column: 1 / -1;
}

.basic-chart-header {
  height: 42px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-border-light);
}

.basic-chart-header h3 {
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.basic-chart-header span {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: 11px;
}

.basic-chart {
  height: 252px;
}

.basic-chart--year {
  height: 226px;
}

@media (max-width: 1100px) {
  .basic-overview-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .basic-overview-metrics,
  .basic-overview-charts {
    grid-template-columns: 1fr;
  }

  .basic-chart-panel--wide {
    grid-column: auto;
  }
}
</style>
