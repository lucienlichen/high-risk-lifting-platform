<template>
  <div class="had-drawer">
    <div class="had-shell">
      <div class="had-header">
        <div class="had-header-main">
          <span class="had-title">健康评估</span>
          <span class="had-subtitle">{{ activeModuleSubtitle }}</span>
        </div>
        <div class="had-header-actions">
          <el-tag type="primary" effect="plain" round>最近 24h</el-tag>
          <el-button size="small" circle @click="emit('close')">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="had-module-tabs">
        <button
          v-for="item in moduleTabs"
          :key="item.key"
          :class="['had-module-tab', { active: activeModule === item.key }]"
          @click="activeModule = item.key"
        >
          <span class="had-module-tab-title">{{ item.label }}</span>
        </button>
      </div>

      <div v-if="activeModule === 'structure' && structureRows.length > 0" class="had-body">
        <div class="had-overview-grid">
          <div class="had-overview-card had-overview-card--score">
            <span class="had-overview-label">疲劳累积损伤度</span>
            <span class="had-overview-value">{{ totalDamageDegree }}<em> / 1.00</em></span>
            <span class="had-overview-sub">{{ structureHealthLevel }}</span>
          </div>
          <div class="had-overview-card">
            <span class="had-overview-label">高风险测点</span>
            <span class="had-overview-value">{{ highRiskPointCount }}<em> / {{ structureRows.length }}</em></span>
            <span class="had-overview-sub">{{ topDamageRow?.position ?? '暂无重点位置' }}</span>
          </div>
          <div class="had-overview-card">
            <span class="had-overview-label">最大应力峰值</span>
            <span class="had-overview-value">{{ topPeakStress }}<em> MPa</em></span>
            <span class="had-overview-sub">{{ topPeakPosition }}</span>
          </div>
          <div class="had-overview-card">
            <span class="had-overview-label">结构评估结论</span>
            <span class="had-overview-value had-overview-value--text">{{ structureConclusionShort }}</span>
            <span class="had-overview-sub">基于结构应力监测推演</span>
          </div>
        </div>

        <div class="had-main-grid had-main-grid--structure">
          <div class="had-panel">
            <div class="had-panel-header">
              <span class="had-panel-title">关键位置损伤排序</span>
              <el-tag :type="highRiskPointCount > 0 ? 'danger' : 'success'" size="small" effect="plain">
                {{ highRiskPointCount > 0 ? `重点关注 ${highRiskPointCount} 处` : '整体稳定' }}
              </el-tag>
            </div>
            <div class="had-panel-body had-split">
              <div class="had-list">
                <div
                  v-for="row in structureRows"
                  :key="row.key"
                  :class="['had-list-item', { active: selectedStructureKey === row.key }]"
                  @click="selectedStructureKey = row.key"
                >
                  <div class="had-list-head">
                    <span class="had-list-title">{{ row.position }}</span>
                    <el-tag :type="levelTagType(row.level)" size="small" effect="plain">{{ levelText(row.level) }}</el-tag>
                  </div>
                  <div class="had-list-meta">
                    <span>当前 {{ row.currentStress }}</span>
                    <span>峰值 {{ row.peakStress }}</span>
                  </div>
                  <div class="had-list-meta">
                    <span>损伤度 {{ row.damageDegree }}</span>
                    <span>占比 {{ row.damagePercent }}</span>
                  </div>
                  <div class="had-list-meta had-list-meta--trend">
                    <span>{{ row.trendText }}</span>
                  </div>
                </div>
              </div>
              <div class="had-detail">
                <div v-if="selectedStructureRow" class="had-detail-top">
                  <div class="had-detail-metric">
                    <span class="had-detail-label">疲劳累积损伤度</span>
                    <span class="had-detail-value">{{ selectedStructureRow.damageDegree }}</span>
                  </div>
                  <div class="had-detail-metric">
                    <span class="had-detail-label">当前应力</span>
                    <span class="had-detail-value">{{ selectedStructureRow.currentStress }}</span>
                  </div>
                  <div class="had-detail-metric">
                    <span class="had-detail-label">应力幅值</span>
                    <span class="had-detail-value">{{ selectedStructureRow.amplitudeDisplay }}</span>
                  </div>
                </div>
                <div ref="structureChartRef" class="had-chart"></div>
              </div>
            </div>
          </div>

          <div class="had-side-stack">
            <div class="had-panel">
              <div class="had-panel-header">
                <span class="had-panel-title">评估结论</span>
              </div>
              <div class="had-summary-text">{{ structureSummary }}</div>
            </div>

            <div class="had-panel">
              <div class="had-panel-header">
                <span class="had-panel-title">建议动作</span>
              </div>
              <div class="had-advice-list">
                <div v-for="advice in structureAdviceList" :key="advice" class="had-advice-item">
                  <span class="had-advice-dot"></span>
                  <span>{{ advice }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="had-panel">
          <div class="had-panel-header">
            <span class="had-panel-title">疲劳累积损伤度明细</span>
          </div>
          <div class="had-table-wrap">
            <el-table :data="structureTableRows" style="width: 100%" height="100%">
              <el-table-column prop="position" label="测点位置" min-width="180" show-overflow-tooltip />
              <el-table-column prop="currentStress" label="当前应力" width="120" />
              <el-table-column prop="peakStress" label="峰值应力" width="120" />
              <el-table-column prop="amplitudeDisplay" label="应力幅值" width="120" />
              <el-table-column prop="damageDegree" label="疲劳累积损伤度" width="150" />
              <el-table-column prop="damagePercent" label="风险占比" width="110" />
              <el-table-column prop="riskText" label="风险等级" width="110">
                <template #default="{ row }">
                  <el-tag :type="levelTagType(row.level)" size="small" effect="plain">{{ row.riskText }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <div v-else-if="activeModule !== 'structure'" class="had-body">
        <div class="had-placeholder-grid">
          <div class="had-overview-card had-overview-card--placeholder">
            <span class="had-overview-label">{{ currentModuleMeta.label }}</span>
            <span class="had-overview-value had-overview-value--text">功能预留</span>
            <span class="had-overview-sub">{{ currentModuleMeta.sub }}</span>
          </div>
          <div class="had-overview-card">
            <span class="had-overview-label">当前状态</span>
            <span class="had-overview-value">待接入</span>
            <span class="had-overview-sub">后续按真实监测数据补齐</span>
          </div>
          <div class="had-overview-card">
            <span class="had-overview-label">页面能力</span>
            <span class="had-overview-value">已规划</span>
            <span class="had-overview-sub">评估卡、趋势图、建议动作</span>
          </div>
        </div>

        <div class="had-placeholder-main">
          <div class="had-panel">
            <div class="had-panel-header">
              <span class="had-panel-title">{{ currentModuleMeta.label }}</span>
            </div>
            <div class="had-placeholder-body">
              <div class="had-placeholder-box">
                <span class="had-placeholder-title">模块说明</span>
                <p>{{ currentModuleMeta.description }}</p>
              </div>
              <div class="had-placeholder-box">
                <span class="had-placeholder-title">预留能力</span>
                <div class="had-advice-list">
                  <div v-for="item in currentModuleMeta.plans" :key="item" class="had-advice-item">
                    <span class="had-advice-dot"></span>
                    <span>{{ item }}</span>
                  </div>
                </div>
              </div>
              <div class="had-placeholder-chart">后续接入后在此展示趋势图与评估指标</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="had-empty">
        <el-empty description="当前设备暂无可评估的结构监测数据" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getRemoteMonitoringData } from '@/mock'
import type { Device, RemoteMonitoringData, RemoteTrendHistory } from '@/mock'

const props = defineProps<{
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

type AssessmentLevel = 'normal' | 'warn' | 'danger'
type ModuleKey = 'structure' | 'gearbox' | 'brake' | 'wheel'

type StructureRow = {
  key: string
  position: string
  level: AssessmentLevel
  currentValue: number
  peakValue: number
  amplitudeValue: number
  damageValue: number
  currentStress: string
  peakStress: string
  amplitudeDisplay: string
  damageDegree: string
  damagePercent: string
  trendText: string
  history: RemoteTrendHistory
}

const moduleTabs = [
  { key: 'structure', label: '结构健康评估', sub: '疲劳累积损伤度' },
  { key: 'gearbox', label: '减速机健康评估', sub: '模块占位' },
  { key: 'brake', label: '制动器健康评估', sub: '模块占位' },
  { key: 'wheel', label: '行走车轮健康评估', sub: '模块占位' }
] as const

const activeModule = ref<ModuleKey>('structure')

const monitoringData = computed<RemoteMonitoringData | null>(() =>
  props.device ? getRemoteMonitoringData(props.device) : null
)

function positionFromLabel(label: string) {
  const left = label.includes('·') ? label.split('·')[1] : label
  return left.replace(/（\d+#）/g, '').trim()
}

function levelTagType(level: AssessmentLevel) {
  if (level === 'danger') return 'danger'
  if (level === 'warn') return 'warning'
  return 'success'
}

function levelText(level: AssessmentLevel) {
  if (level === 'danger') return '高风险'
  if (level === 'warn') return '关注'
  return '正常'
}

function damageLevel(value: number): AssessmentLevel {
  if (value >= 0.8) return 'danger'
  if (value >= 0.55) return 'warn'
  return 'normal'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const structureRows = computed<StructureRow[]>(() => {
  const rows = (monitoringData.value?.stress ?? []).filter(item => item.history.kind === 'trend')
  if (!rows.length) return []

  const peaks = rows.map(item => Math.max(...item.history.values))
  const amplitudes = rows.map(item => Math.max(...item.history.values) - Math.min(...item.history.values))
  const maxPeak = Math.max(...peaks, 1)
  const maxAmplitude = Math.max(...amplitudes, 1)

  return rows.map((item, index) => {
    const values = item.history.values
    const current = values[values.length - 1] ?? 0
    const first = values[0] ?? current
    const peak = Math.max(...values)
    const valley = Math.min(...values)
    const amplitude = peak - valley
    const trendStrength = Math.abs(current - first)
    const statusWeight = item.status === 'danger' ? 1 : item.status === 'warn' ? 0.72 : 0.4
    const damageValue = clamp(
      peak / maxPeak * 0.42 +
      amplitude / maxAmplitude * 0.28 +
      trendStrength / maxPeak * 0.12 +
      statusWeight * 0.18,
      0.12,
      0.96
    )
    const level = damageLevel(damageValue)
    const direct = current >= first ? '上升' : '回落'

    return {
      key: `structure-${index}`,
      position: positionFromLabel(item.label),
      level,
      currentValue: current,
      peakValue: peak,
      amplitudeValue: amplitude,
      damageValue,
      currentStress: `${current.toFixed(1)} ${item.history.valueLabel}`,
      peakStress: `${peak.toFixed(1)} ${item.history.valueLabel}`,
      amplitudeDisplay: `${amplitude.toFixed(1)} ${item.history.valueLabel}`,
      damageDegree: damageValue.toFixed(2),
      damagePercent: `${Math.round(damageValue * 100)}%`,
      trendText: `近 24h ${direct} ${Math.abs(current - first).toFixed(1)} ${item.history.valueLabel}`,
      history: item.history
    }
  }).sort((a, b) => b.damageValue - a.damageValue)
})

const selectedStructureKey = ref('')

const selectedStructureRow = computed(() =>
  structureRows.value.find(item => item.key === selectedStructureKey.value) ?? structureRows.value[0] ?? null
)

watch(structureRows, rows => {
  if (!rows.find(item => item.key === selectedStructureKey.value)) {
    selectedStructureKey.value = rows[0]?.key ?? ''
  }
}, { immediate: true })

const totalDamageDegree = computed(() => {
  if (!structureRows.value.length) return '0.00'
  const total = structureRows.value.reduce((sum, item) => sum + item.damageValue, 0) / structureRows.value.length
  return total.toFixed(2)
})

const structureHealthLevel = computed(() => {
  const value = Number(totalDamageDegree.value)
  if (value >= 0.8) return '结构疲劳风险预警'
  if (value >= 0.55) return '结构处于关注状态'
  return '结构整体稳定'
})

const highRiskPointCount = computed(() => structureRows.value.filter(item => item.level !== 'normal').length)
const topDamageRow = computed(() => structureRows.value[0] ?? null)
const topPeakPoint = computed(() =>
  structureRows.value.slice().sort((a, b) => b.peakValue - a.peakValue)[0] ?? null
)

const topPeakStress = computed(() => topPeakPoint.value?.peakValue.toFixed(1) ?? '0.0')
const topPeakPosition = computed(() => topPeakPoint.value?.position ?? '暂无')

const structureConclusionShort = computed(() =>
  Number(totalDamageDegree.value) >= 0.8 ? '需立即关注'
  : Number(totalDamageDegree.value) >= 0.55 ? '建议重点跟踪'
  : '当前稳定'
)

const structureSummary = computed(() => {
  if (!structureRows.value.length) return '当前暂无可用于结构疲劳累积损伤度分析的应力监测数据。'
  const top = topDamageRow.value
  if (!top) return '当前暂无可用于结构疲劳累积损伤度分析的应力监测数据。'
  return `基于结构应力近 24h 监测数据，当前结构疲劳累积损伤度总评为 ${totalDamageDegree.value}。${top.position} 的损伤累积最为突出，当前损伤度 ${top.damageDegree}，峰值应力 ${top.peakStress}，应力幅值 ${top.amplitudeDisplay}，建议将该位置列为优先关注点。`
})

const structureAdviceList = computed(() => {
  const top = topDamageRow.value
  const list: string[] = []
  if (top) {
    list.push(`优先复核 ${top.position} 的应力峰值和波动幅值，并作为疲劳累积损伤度重点跟踪位置。`)
  }
  if (highRiskPointCount.value > 1) {
    list.push(`当前共有 ${highRiskPointCount.value} 个结构测点处于关注或高风险状态，建议安排专项巡检。`)
  }
  list.push('建议保留本轮评估结果作为后续疲劳损伤趋势对比基线。')
  return list
})

const structureTableRows = computed(() =>
  structureRows.value.map(item => ({
    ...item,
    riskText: levelText(item.level)
  }))
)

const currentModuleMeta = computed(() => {
  const base: Record<Exclude<ModuleKey, 'structure'>, { label: string; sub: string; description: string; plans: string[] }> = {
    gearbox: {
      label: '减速机健康评估',
      sub: '预留减速机温升、振动、润滑等评估能力',
      description: '当前页面已预留减速机健康评估框架，后续可基于温度、振动、油液状态和故障征兆实现综合健康评估。',
      plans: ['预留总览评分卡', '预留趋势图区域', '预留建议动作与结论区']
    },
    brake: {
      label: '制动器健康评估',
      sub: '预留制动力、响应、磨损等评估能力',
      description: '当前页面已预留制动器健康评估框架，后续可基于开闭反馈、响应时间、异常频次和磨损状态进行评估。',
      plans: ['预留总览评分卡', '预留趋势图区域', '预留建议动作与结论区']
    },
    wheel: {
      label: '行走车轮健康评估',
      sub: '预留轮压、磨损、偏斜等评估能力',
      description: '当前页面已预留行走车轮健康评估框架，后续可基于轮压均衡、偏斜趋势、磨损程度和冲击异常进行评估。',
      plans: ['预留总览评分卡', '预留趋势图区域', '预留建议动作与结论区']
    }
  }
  return activeModule.value === 'structure'
    ? { label: '结构健康评估', sub: '基于结构应力的疲劳累积损伤度', description: '', plans: [] }
    : base[activeModule.value]
})

const activeModuleSubtitle = computed(() =>
  activeModule.value === 'structure'
    ? '基于结构应力监测数据的疲劳累积损伤度评估'
    : currentModuleMeta.value.sub
)

const structureChartRef = ref<HTMLElement>()
let structureChart: echarts.ECharts | null = null

function buildDamageHistory(row: StructureRow) {
  const values = row.history.values
  const maxValue = Math.max(...values, 1)
  let cumulative = 0.08
  return values.map((value, index) => {
    const prev = index === 0 ? value : values[index - 1]
    const delta = Math.abs(value - prev)
    cumulative = clamp(cumulative + value / maxValue * 0.035 + delta / maxValue * 0.02, 0.08, row.damageValue)
    return Number(cumulative.toFixed(3))
  })
}

function renderStructureChart() {
  if (!structureChartRef.value || !selectedStructureRow.value) return
  structureChart ??= echarts.init(structureChartRef.value)
  const row = selectedStructureRow.value
  const damageHistory = buildDamageHistory(row)
  structureChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      textStyle: { color: '#475569', fontSize: 12 }
    },
    grid: { left: 52, right: 58, top: 38, bottom: 30 },
    xAxis: {
      type: 'category',
      data: row.history.times,
      axisLine: { lineStyle: { color: '#dbe4ee' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    yAxis: [
      {
        type: 'value',
        name: row.history.valueLabel,
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } }
      },
      {
        type: 'value',
        name: '损伤度',
        min: 0,
        max: 1,
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLabel: { color: '#64748b', fontSize: 11 }
      }
    ],
    series: [
      {
        name: '应力趋势',
        type: 'line',
        smooth: true,
        data: row.history.values,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 3, color: row.level === 'danger' ? '#ff4d4f' : row.level === 'warn' ? '#faad14' : '#1677ff' },
        itemStyle: { color: row.level === 'danger' ? '#ff4d4f' : row.level === 'warn' ? '#faad14' : '#1677ff' },
        areaStyle: {
          color: row.level === 'danger'
            ? 'rgba(255,77,79,0.12)'
            : row.level === 'warn'
              ? 'rgba(250,173,20,0.12)'
              : 'rgba(22,119,255,0.12)'
        }
      },
      {
        name: '疲劳累积损伤度',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: damageHistory,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 3, color: '#7c3aed' },
        itemStyle: { color: '#7c3aed' }
      }
    ]
  }, true)
}

watch(selectedStructureRow, () => {
  nextTick(() => {
    renderStructureChart()
    setTimeout(() => structureChart?.resize(), 50)
  })
}, { immediate: true })

watch(activeModule, () => {
  nextTick(() => {
    renderStructureChart()
    setTimeout(() => structureChart?.resize(), 50)
  })
})

watch(monitoringData, () => {
  nextTick(() => {
    renderStructureChart()
    setTimeout(() => structureChart?.resize(), 50)
  })
})

onUnmounted(() => {
  structureChart?.dispose()
  structureChart = null
})
</script>

<style scoped>
.had-drawer {
  position: absolute;
  inset: 50px 0 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background: rgba(248, 250, 252, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(22, 119, 255, 0.18);
  box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.12);
  animation: had-slide-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes had-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.had-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 0;
}

.had-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.had-header-main {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.had-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.had-subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.had-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.had-module-tabs {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(248, 250, 252, 0.88);
  border-bottom: 1px solid var(--color-border-light);
  overflow-x: auto;
}

.had-module-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.16s, color 0.16s, box-shadow 0.16s;
}

.had-module-tab.active {
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.had-module-tab-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.had-module-tab.active .had-module-tab-title {
  color: var(--color-primary);
}

.had-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  padding: 12px 16px 16px;
}

.had-overview-grid,
.had-placeholder-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.had-overview-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px;
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  box-shadow: var(--color-card-shadow);
}

.had-overview-card--score {
  background: linear-gradient(135deg, rgba(22, 119, 255, 0.1), rgba(124, 58, 237, 0.08));
}

.had-overview-card--placeholder {
  background: linear-gradient(135deg, rgba(22, 119, 255, 0.08), rgba(15, 23, 42, 0.04));
}

.had-overview-label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.had-overview-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-text-primary);
}

.had-overview-value--text {
  font-size: 18px;
  line-height: 1.35;
}

.had-overview-value em {
  font-style: normal;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.had-overview-sub {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.had-main-grid--structure {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
  gap: 12px;
}

.had-side-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.had-panel {
  min-width: 0;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  overflow: hidden;
}

.had-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(248, 250, 252, 0.82);
}

.had-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.had-panel-body {
  padding: 14px 16px 16px;
}

.had-summary-text {
  padding: 16px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--color-text-secondary);
}

.had-advice-list {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.had-advice-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.had-advice-dot {
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.had-split {
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  gap: 14px;
}

.had-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.had-list-item {
  padding: 12px 14px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-bg-subtle);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.had-list-item:hover,
.had-list-item.active {
  background: var(--color-card-bg);
  border-color: rgba(22, 119, 255, 0.34);
  box-shadow: 0 2px 10px rgba(22, 119, 255, 0.08);
}

.had-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.had-list-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.had-list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.had-list-meta--trend {
  margin-top: 6px;
  color: var(--color-text-muted);
}

.had-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.had-detail-top {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.had-detail-metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
}

.had-detail-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.had-detail-value {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.had-chart {
  min-height: 300px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.8), rgba(255, 255, 255, 0.95));
}

.had-table-wrap {
  padding: 0 12px 12px;
  height: 280px;
}

.had-placeholder-main {
  flex: 1;
  min-height: 0;
}

.had-placeholder-body {
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.had-placeholder-box {
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-subtle);
}

.had-placeholder-box p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.had-placeholder-title {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.had-placeholder-chart {
  grid-column: 1 / -1;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--color-border-light);
  background: rgba(248, 250, 252, 0.72);
  color: var(--color-text-muted);
  font-size: 14px;
}

.had-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: var(--radius-md);
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(248, 250, 252, 0.6);
  --el-table-row-hover-bg-color: rgba(22, 119, 255, 0.04);
}

:deep(.el-table th.el-table__cell .cell),
:deep(.el-table .el-table__body .cell) {
  font-size: 13px;
}

@media (max-width: 1280px) {
  .had-module-tabs,
  .had-overview-grid,
  .had-placeholder-grid,
  .had-main-grid--structure,
  .had-split,
  .had-placeholder-body {
    grid-template-columns: 1fr;
  }

  .had-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
