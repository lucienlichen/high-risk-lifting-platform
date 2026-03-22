<template>
  <div class="remote-layer" aria-modal="true" role="dialog">
    <div class="remote-backdrop" />

    <div class="remote-panel" :class="{ 'remote-panel--open': panelOpen }">
      <header class="remote-header">
        <div class="remote-header-main">
          <h2 class="remote-title">远程监测服务</h2>
          <div v-if="device" class="remote-header-meta">
            <span class="remote-meta-item">
              <span class="remote-meta-label">设备</span>{{ device.name }}
            </span>
            <span class="remote-meta-item">
              <span class="remote-meta-label">编号</span>{{ device.code }}
            </span>
            <span class="remote-meta-item">
              <span class="remote-meta-label">运行</span>{{ statusLabels[device.status] }}
            </span>
            <span class="remote-meta-item">
              <span class="remote-meta-label">风险</span>{{ riskLabels[device.riskLevel] }}
            </span>
            <span v-if="monitoringData" class="remote-meta-item remote-meta-time">
              <span class="remote-meta-label">刷新</span>{{ monitoringData.lastRefresh }}
            </span>
          </div>
        </div>
        <el-button type="primary" text class="remote-close" @click="close">
          <el-icon :size="18"><Close /></el-icon>
          关闭
        </el-button>
      </header>

      <div v-if="monitoringData" class="remote-body">
        <nav class="remote-nav">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            :class="['remote-nav-item', { active: activeSection === item.id }]"
            @click="activeSection = item.id"
          >
            {{ item.label }}
          </button>
        </nav>

        <div class="remote-workspace">
          <aside class="remote-metric-list" aria-label="监测测点列表">
            <template v-for="group in metricGroups" :key="group.title">
              <div class="remote-metric-group-title">{{ group.title }}</div>
              <button
                v-for="m in group.metrics"
                :key="m.key"
                type="button"
                :class="['remote-metric-tile', { active: selectedMetricKey === m.key }]"
                @click="selectMetric(m.key)"
              >
                <div class="remote-metric-tile-top">
                  <span class="remote-metric-tile-label">{{ m.item.label }}</span>
                  <span :class="['remote-status-tag', 'remote-status-tag--' + m.item.status]">
                    {{ statusText(m.item.status) }}
                  </span>
                </div>
                <div class="remote-metric-tile-value">{{ m.item.value }}</div>
                <div class="remote-metric-tile-hint">
                  {{ m.item.history.kind === 'trend' ? '历史曲线' : '历史采样记录' }}
                </div>
              </button>
            </template>
          </aside>

          <div class="remote-detail">
            <div v-if="selectedMetric" class="section-card remote-detail-card">
              <div class="section-card-header remote-detail-header">
                <div>
                  <span class="section-card-title">{{ selectedMetric.item.label }}</span>
                  <div class="remote-detail-meta">
                    <span class="remote-detail-current">
                      当前值 <strong>{{ selectedMetric.item.value }}</strong>
                    </span>
                    <el-tag size="small" :type="historyKindTagType" effect="plain">
                      {{ selectedMetric.item.history.kind === 'trend' ? '24h 数值趋势' : '24h 状态采样' }}
                    </el-tag>
                  </div>
                </div>
              </div>
              <div class="section-card-body remote-detail-body">
                <template v-if="selectedMetric.item.history.kind === 'trend'">
                  <div ref="sectionChartRef" class="remote-chart"></div>
                </template>
                <template v-else>
                  <el-table
                    :data="selectedMetric.item.history.rows"
                    stripe
                    size="small"
                    class="remote-history-table"
                    max-height="calc(100vh - var(--header-height) - 220px)"
                  >
                    <el-table-column prop="time" label="时刻" width="88" />
                    <el-table-column prop="value" label="采样值" min-width="120" />
                  </el-table>
                </template>
              </div>
            </div>
            <div v-else class="remote-detail-empty">请选择左侧监测项查看历史数据</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useSceneStore } from '@/stores/scene'
import { getRemoteMonitoringData } from '@/mock'
import type { Device, RemoteSectionId, RemoteStatusItem } from '@/mock'

const props = defineProps<{ device: Device | null }>()

const store = useSceneStore()
const activeSection = ref<RemoteSectionId>('structure')
const selectedMetricKey = ref('')
const panelOpen = ref(false)
const sectionChartRef = ref<HTMLElement>()
let sectionChart: echarts.ECharts | null = null

const statusLabels: Record<string, string> = {
  running: '运行中',
  standby: '待机',
  stopped: '停机',
  maintenance: '维修中'
}
const riskLabels: Record<string, string> = {
  normal: '正常',
  low: '低风险',
  medium: '中风险',
  high: '高风险'
}

const navItems: { id: RemoteSectionId; label: string }[] = [
  { id: 'structure', label: '结构健康监测' },
  { id: 'mechanism', label: '机构健康监测' },
  { id: 'electric', label: '电控系统监测' },
  { id: 'rope', label: '钢丝绳监测' },
  { id: 'other', label: '其他部件监测' }
]

const monitoringData = computed(() => getRemoteMonitoringData(props.device))

type MetricRow = { key: string; item: RemoteStatusItem }

function isCompletePayload(
  d: ReturnType<typeof getRemoteMonitoringData>
): d is NonNullable<typeof d> {
  return !!(
    d &&
    d.structure?.stress &&
    d.structure?.damage &&
    d.mechanism?.gearbox &&
    d.mechanism?.brake &&
    d.mechanism?.wheel &&
    Array.isArray(d.electric) &&
    Array.isArray(d.rope) &&
    Array.isArray(d.other)
  )
}

const metricGroups = computed(() => {
  const d = monitoringData.value
  if (!isCompletePayload(d)) return [] as { title: string; metrics: MetricRow[] }[]
  switch (activeSection.value) {
    case 'structure':
      return [
        {
          title: '结构应力监测',
          metrics: d.structure.stress.map((item, i) => ({ key: `structure:stress:${i}`, item }))
        },
        {
          title: '结构损伤监测',
          metrics: d.structure.damage.map((item, i) => ({ key: `structure:damage:${i}`, item }))
        }
      ]
    case 'mechanism':
      return [
        {
          title: '减速机故障监测',
          metrics: d.mechanism.gearbox.map((item, i) => ({ key: `mechanism:gearbox:${i}`, item }))
        },
        {
          title: '制动器性能监测',
          metrics: d.mechanism.brake.map((item, i) => ({ key: `mechanism:brake:${i}`, item }))
        },
        {
          title: '大车车轮故障监测',
          metrics: d.mechanism.wheel.map((item, i) => ({ key: `mechanism:wheel:${i}`, item }))
        }
      ]
    case 'electric':
      return [{ title: '电控系统监测', metrics: d.electric.map((item, i) => ({ key: `electric:${i}`, item })) }]
    case 'rope':
      return [{ title: '钢丝绳监测', metrics: d.rope.map((item, i) => ({ key: `rope:${i}`, item })) }]
    case 'other':
      return [{ title: '其他部件监测', metrics: d.other.map((item, i) => ({ key: `other:${i}`, item })) }]
    default:
      return []
  }
})

const selectedMetric = computed(() => {
  for (const g of metricGroups.value) {
    const m = g.metrics.find(x => x.key === selectedMetricKey.value)
    if (m) return m
  }
  return null
})

const historyKindTagType = computed(() =>
  selectedMetric.value?.item.history.kind === 'trend' ? 'primary' : 'info'
)

function close() {
  panelOpen.value = false
  window.setTimeout(() => store.setService(null), 300)
}

function statusText(s: string) {
  if (s === 'danger') return '异常'
  if (s === 'warn') return '注意'
  return '正常'
}

function selectMetric(key: string) {
  selectedMetricKey.value = key
}

function pickDefaultMetricKey(): string {
  const g = metricGroups.value[0]
  return g?.metrics[0]?.key ?? ''
}

function disposeSectionChart() {
  sectionChart?.dispose()
  sectionChart = null
}

function renderSectionChart() {
  if (!sectionChartRef.value || !selectedMetric.value) return
  const h = selectedMetric.value.item.history
  if (h.kind !== 'trend') {
    disposeSectionChart()
    return
  }
  disposeSectionChart()
  sectionChart = echarts.init(sectionChartRef.value)
  sectionChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    xAxis: {
      type: 'category',
      data: h.times,
      axisLine: { lineStyle: { color: '#e8edf3' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: h.valueLabel,
      nameTextStyle: { color: '#94a3b8', fontSize: 10 },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f0f4f8' } }
    },
    series: [
      {
        name: selectedMetric.value.item.label,
        type: 'line',
        data: h.values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#1677ff', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22,119,255,0.18)' },
              { offset: 1, color: 'rgba(22,119,255,0)' }
            ]
          }
        }
      }
    ]
  })
}

watch([metricGroups, () => props.device?.id], () => {
  const keys = new Set<string>()
  for (const g of metricGroups.value) for (const m of g.metrics) keys.add(m.key)
  if (!keys.has(selectedMetricKey.value)) {
    selectedMetricKey.value = pickDefaultMetricKey()
  }
})

watch(activeSection, () => {
  selectedMetricKey.value = pickDefaultMetricKey()
})

watch([selectedMetric, monitoringData, panelOpen], () => {
  nextTick(() => {
    if (selectedMetric.value?.item.history.kind === 'trend') {
      renderSectionChart()
      window.setTimeout(() => sectionChart?.resize(), 50)
    } else {
      disposeSectionChart()
    }
  })
})

watch(panelOpen, open => {
  if (open) {
    nextTick(() => {
      renderSectionChart()
      window.setTimeout(() => sectionChart?.resize(), 320)
    })
  }
})

onMounted(() => {
  requestAnimationFrame(() => {
    panelOpen.value = true
  })
  selectedMetricKey.value = pickDefaultMetricKey()
})

onUnmounted(() => {
  disposeSectionChart()
})
</script>

<style scoped>
.remote-layer {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
}

.remote-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.22);
  pointer-events: auto;
}

.remote-panel {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.15);
  transform: translateY(100%);
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: auto;
  overflow: hidden;
}

.remote-panel--open {
  transform: translateY(0);
}

.remote-header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(22, 119, 255, 0.04);
}

.remote-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.remote-header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.remote-meta-label {
  color: var(--color-text-muted);
  margin-right: 4px;
}

.remote-meta-time {
  flex-basis: 100%;
}

.remote-close {
  flex-shrink: 0;
  font-weight: 600;
}

.remote-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: 0;
}

.remote-nav {
  border-right: 1px solid var(--color-border-light);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--color-border-light);
}

.remote-nav-item {
  text-align: left;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  line-height: 1.35;
}

.remote-nav-item:hover {
  color: var(--color-primary);
  background: rgba(255, 255, 255, 0.7);
}

.remote-nav-item.active {
  color: var(--color-primary);
  font-weight: 600;
  background: var(--color-card-bg);
  border-color: rgba(22, 119, 255, 0.35);
  box-shadow: 0 1px 4px rgba(22, 119, 255, 0.08);
}

.remote-workspace {
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  gap: 0;
  min-height: 0;
  min-width: 0;
}

.remote-metric-list {
  border-right: 1px solid var(--color-border-light);
  padding: 12px 10px 14px;
  overflow-y: auto;
  background: rgba(248, 250, 252, 0.65);
}

.remote-metric-group-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin: 12px 4px 8px;
}

.remote-metric-group-title:first-child {
  margin-top: 0;
}

.remote-metric-tile {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-card-border);
  background: var(--color-card-bg);
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    background 0.15s;
  box-shadow: var(--color-card-shadow);
}

.remote-metric-tile:hover {
  border-color: rgba(22, 119, 255, 0.35);
}

.remote-metric-tile.active {
  border-color: var(--color-primary);
  background: rgba(22, 119, 255, 0.06);
  box-shadow: 0 2px 10px rgba(22, 119, 255, 0.12);
}

.remote-metric-tile-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.remote-metric-tile-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.35;
}

.remote-metric-tile-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  margin-bottom: 4px;
}

.remote-metric-tile-hint {
  font-size: 10px;
  color: var(--color-text-muted);
}

.remote-detail {
  min-width: 0;
  min-height: 0;
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.remote-detail-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin: 0;
  overflow: hidden;
}

.remote-detail-header {
  flex-shrink: 0;
  align-items: flex-start;
}

.remote-detail-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.remote-detail-current {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.remote-detail-current strong {
  color: var(--color-primary);
  font-size: 14px;
  margin-left: 4px;
}

.remote-detail-body {
  flex: 1;
  min-height: 0;
  padding: 12px 16px 16px !important;
  display: flex;
  flex-direction: column;
}

.remote-chart {
  width: 100%;
  flex: 1;
  min-height: 280px;
}

.remote-history-table {
  width: 100%;
}

.remote-detail-empty {
  margin: auto;
  font-size: 13px;
  color: var(--color-text-muted);
}

.remote-status-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.remote-status-tag--normal {
  background: rgba(82, 196, 26, 0.12);
  color: var(--color-success);
}

.remote-status-tag--warn {
  background: rgba(250, 140, 22, 0.12);
  color: var(--color-warning);
}

.remote-status-tag--danger {
  background: rgba(255, 77, 79, 0.1);
  color: var(--color-danger);
}

@media (max-width: 1100px) {
  .remote-workspace {
    grid-template-columns: minmax(220px, 1fr) minmax(0, 1.2fr);
  }
  .remote-body {
    grid-template-columns: 148px minmax(0, 1fr);
  }
}
</style>
