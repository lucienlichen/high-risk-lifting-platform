<template>
  <div class="had-drawer">
    <div class="had-shell">
      <div class="had-top-bar">
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
        <div class="had-actions">
          <el-select v-if="activeModule === 'structure'" v-model="selectedAlgorithm" size="small" style="width: 180px;">
            <el-option label="累积损伤算法模型01" value="miner01" />
            <el-option label="累积损伤算法模型02" value="miner02" />
            <el-option label="累积损伤算法模型03" value="miner03" />
          </el-select>
          <el-tag type="primary" effect="plain" round>最近 24h</el-tag>
          <el-button size="small" circle @click="emit('close')">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <div v-if="activeModule === 'structure' && allRows.length > 0" class="had-body" style="padding: 16px; overflow: hidden; display: flex; flex-direction: column; gap: 16px;">
        <div class="had-panel" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
          <div class="had-table-wrap" style="flex: 1; padding: 12px; height: 100%; min-height: 0;">
            <el-table :data="allTableRows" style="width: 100%" height="100%" :span-method="spanMethod" :row-class-name="tableRowClassName">
                <el-table-column prop="structureObject" label="结构对象" min-width="7%" align="center">
                  <template #default="{ row }">
                    <span style="font-weight: 700; color: var(--color-primary);">{{ row.structureObject }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="code" label="编号" min-width="4%" align="center" />
                <el-table-column prop="position" label="测点位置" min-width="16%" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span>{{ row.position }}</span>
                    <el-tag v-if="row.source === 'twin'" size="small" type="info" effect="plain" style="margin-left: 6px; zoom: 0.85;">数字孪生</el-tag>
                    <el-tag v-else size="small" type="primary" effect="plain" style="margin-left: 6px; zoom: 0.85;">实测点位</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="maxStress" label="最大应力" min-width="7%" align="center" />
                <el-table-column prop="minStress" label="最小应力" min-width="7%" align="center" />
                <el-table-column prop="avgStress" label="平均应力" min-width="7%" align="center" />
                <el-table-column prop="workCycles" label="循环次数" min-width="7%" align="center" />
                <el-table-column prop="cumulativeWorkTime" label="累计工作时间" min-width="9%" align="center" />
                <el-table-column prop="damageDegree" label="累积疲劳损伤度" min-width="10%" align="center" />
                <el-table-column prop="statusText" label="点位状态" min-width="8%" align="center">
                  <template #default="{ row }">
                    <el-tag :type="levelTagType(row.level)" size="small" effect="plain">{{ row.statusText }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="structureStatusText" label="结构健康状态" min-width="10%" align="center">
                  <template #default="{ row }">
                    <el-tag :type="levelTagType(row.structureLevel)" size="small" effect="plain">{{ row.structureStatusText }}</el-tag>
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
import { computed, ref } from 'vue'
import { Close } from '@element-plus/icons-vue'
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
type PointSource = 'measured' | 'twin'

type StructureRow = {
  key: string
  code: string
  position: string
  structureObject: string
  source: PointSource
  sourceLabel: string
  level: AssessmentLevel
  structureLevel?: AssessmentLevel
  currentValue: number
  damageValue: number
  maxStress: string
  minStress: string
  avgStress: string
  workCycles: string
  cumulativeWorkTime: string
  damageDegree: string
  history: RemoteTrendHistory
  rowspan?: number
  colspan?: number
}

const moduleTabs = [
  { key: 'structure', label: '结构健康评估', sub: '疲劳累积损伤度' },
  { key: 'gearbox', label: '减速机健康评估', sub: '模块占位' },
  { key: 'brake', label: '制动器健康评估', sub: '模块占位' },
  { key: 'wheel', label: '行走车轮健康评估', sub: '模块占位' }
] as const

const activeModule = ref<ModuleKey>('structure')
const selectedAlgorithm = ref('miner01')

const monitoringData = computed<RemoteMonitoringData | null>(() =>
  props.device ? getRemoteMonitoringData(props.device) : null
)

function positionFromLabel(label: string) {
  const left = label.includes('·') ? label.split('·')[1] : label
  return left.replace(/（\d+#）/g, '').trim()
}

function getStructureObject(position: string) {
  if (position.includes('主梁') || position.includes('翼缘')) return '主梁'
  if (position.includes('端梁')) return '端梁'
  if (position.includes('腿')) return '支腿'
  if (position.includes('车')) return '运行机构'
  if (position.includes('加强筋') || position.includes('连接板')) return '附属结构'
  return '其他结构'
}

function levelTagType(level: AssessmentLevel) {
  if (level === 'danger') return 'danger'
  if (level === 'warn') return 'warning'
  return 'success'
}

function levelText(level: AssessmentLevel) {
  if (level === 'danger') return '异常'
  if (level === 'warn') return '亚健康'
  return '健康'
}

function damageLevel(value: number): AssessmentLevel {
  if (value >= 0.85) return 'danger'
  if (value >= 0.7) return 'warn'
  return 'normal'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const STRESS_TWIN_POSITIONS: readonly string[] = [
  '主梁跨中区',
  '主梁支座区',
  '支腿顶部节点',
  '端梁腹板',
  '下翼缘监测',
  '加强筋焊缝',
  '小车轨道梁',
  '刚性腿连接',
  '柔性腿连接',
  '主梁上翼缘',
  '主梁下翼缘',
  '端梁连接板',
  '支腿与主梁',
  '大车轨道侧'
]

const HOURS_24 = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

function twinSeedHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}

function computeTwinMetrics(deviceId: string): { code: string; position: string; history: RemoteTrendHistory }[] {
  const dSeed = twinSeedHash(String(deviceId))
  return STRESS_TWIN_POSITIONS.map((position, i) => {
    const code = String(7 + i)
    const base = 68 + i * 3.5 + (dSeed % 20) / 3
    const amp = 7 + i % 7
    const salt = twinSeedHash(`dt-${i}-${position}`)
    const values = HOURS_24.map((_, hi) => {
      const phase = (hi + (dSeed ^ salt) % 11) / 3.8
      const v = base + amp * Math.sin(phase) + ((dSeed + hi) % 5) / 3
      return Math.round(v * 10) / 10
    })
    return {
      code,
      position,
      history: { kind: 'trend' as const, times: HOURS_24, values, valueLabel: 'με' }
    }
  })
}

const measuredRows = computed<StructureRow[]>(() => {
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
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
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

    const workCyclesCount = Math.floor(damageValue * 850000)
    const workTimeHours = Math.floor(damageValue * 48000)

    const pos = positionFromLabel(item.label)
    return {
      key: `measured-${index}`,
      code: String(index + 1),
      position: pos,
      structureObject: getStructureObject(pos),
      source: 'measured' as PointSource,
      sourceLabel: '实测',
      level,
      currentValue: current,
      damageValue,
      maxStress: `${peak.toFixed(1)} ${item.history.valueLabel}`,
      minStress: `${valley.toFixed(1)} ${item.history.valueLabel}`,
      avgStress: `${avg.toFixed(1)} ${item.history.valueLabel}`,
      workCycles: `${(workCyclesCount / 10000).toFixed(1)}万次`,
      cumulativeWorkTime: `${workTimeHours}h`,
      damageDegree: damageValue.toFixed(2),
      history: item.history
    }
  })
})

const twinRows = computed<StructureRow[]>(() => {
  if (!props.device) return []
  const twinData = computeTwinMetrics(String(props.device.id))
  const allValues = twinData.flatMap(t => t.history.values)
  const maxVal = Math.max(...allValues, 1)

  return twinData.map((twin, index) => {
    const values = twin.history.values
    const current = values[values.length - 1] ?? 0
    const peak = Math.max(...values)
    const valley = Math.min(...values)
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
    const amplitude = peak - valley
    const damageValue = clamp(
      peak / maxVal * 0.42 +
      amplitude / maxVal * 0.28 +
      0.38,
      0.12,
      0.96
    )
    const level = damageLevel(damageValue)

    const workCyclesCount = Math.floor(damageValue * 850000)
    const workTimeHours = Math.floor(damageValue * 48000)

    return {
      key: `twin-${index}`,
      code: twin.code,
      position: twin.position,
      structureObject: getStructureObject(twin.position),
      source: 'twin' as PointSource,
      sourceLabel: '孪生',
      level,
      currentValue: current,
      damageValue,
      maxStress: `${peak.toFixed(1)} ${twin.history.valueLabel}`,
      minStress: `${valley.toFixed(1)} ${twin.history.valueLabel}`,
      avgStress: `${avg.toFixed(1)} ${twin.history.valueLabel}`,
      workCycles: `${(workCyclesCount / 10000).toFixed(1)}万次`,
      cumulativeWorkTime: `${workTimeHours}h`,
      damageDegree: damageValue.toFixed(2),
      history: twin.history
    }
  })
})

const allRows = computed<StructureRow[]>(() => {
  const rows = [...measuredRows.value, ...twinRows.value].sort((a, b) => {
    if (a.structureObject !== b.structureObject) {
      return a.structureObject.localeCompare(b.structureObject)
    }
    if (a.source !== b.source) {
      return a.source === 'measured' ? -1 : 1
    }
    return b.damageValue - a.damageValue
  })

  // Assign grouping variables
  let currentGroup = ''
  let currentIdx = 1
  let groupStartIndex = 0
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.structureObject !== currentGroup) {
      // Finalize previous group's rowspan and max level
      if (i > 0) {
        const groupLen = i - groupStartIndex
        rows[groupStartIndex].rowspan = groupLen
        
        let worstLevel: AssessmentLevel = 'normal'
        for (let j = groupStartIndex; j < i; j++) {
          if (rows[j].level === 'danger') worstLevel = 'danger'
          else if (rows[j].level === 'warn' && worstLevel !== 'danger') worstLevel = 'warn'
        }
        for (let j = groupStartIndex; j < i; j++) {
          rows[j].structureLevel = worstLevel
          if (j > groupStartIndex) rows[j].rowspan = 0
        }
      }
      
      currentGroup = row.structureObject
      currentIdx = 1
      groupStartIndex = i
    }
    row.code = String(currentIdx++)
  }
  
  // Finalize last group
  if (rows.length > 0) {
    const groupLen = rows.length - groupStartIndex
    rows[groupStartIndex].rowspan = groupLen
    
    let worstLevel: AssessmentLevel = 'normal'
    for (let j = groupStartIndex; j < rows.length; j++) {
      if (rows[j].level === 'danger') worstLevel = 'danger'
      else if (rows[j].level === 'warn' && worstLevel !== 'danger') worstLevel = 'warn'
    }
    for (let j = groupStartIndex; j < rows.length; j++) {
      rows[j].structureLevel = worstLevel
      if (j > groupStartIndex) rows[j].rowspan = 0
    }
  }

  return rows
})

const allTableRows = computed(() =>
  allRows.value.map(item => ({
    ...item,
    statusText: levelText(item.level),
    structureStatusText: levelText(item.structureLevel || 'normal')
  }))
)

function spanMethod({ row, column, rowIndex, columnIndex }: any) {
  if (column.property === 'structureObject' || column.property === 'structureStatusText') {
    return {
      rowspan: row.rowspan,
      colspan: row.rowspan === 0 ? 0 : 1
    }
  }
}

function tableRowClassName({ row, rowIndex }: { row: StructureRow; rowIndex: number }) {
  if (row.rowspan && row.rowspan > 0) {
    return 'had-table-group-start'
  }
  return ''
}

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
    ? '全部监测点位的应力特征、累积疲劳损伤度及状态评估'
    : currentModuleMeta.value.sub
)
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

.had-top-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 12px;
  background: rgba(248, 250, 252, 0.88);
  border-bottom: 1px solid var(--color-border-light);
}

.had-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.had-module-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
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

.had-placeholder-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  grid-template-columns: minmax(0, 1fr);
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
  grid-template-columns: 1fr;
  gap: 14px;
}

.had-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  max-height: 480px;
}

.had-list-item {
  padding: 10px 12px;
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
  margin-bottom: 6px;
}

.had-list-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.had-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  flex-shrink: 0;
}

.had-type-badge--measured {
  background: rgba(22, 119, 255, 0.12);
  color: #1677ff;
}

.had-type-badge--twin {
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
}

.had-list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 12px;
  color: var(--color-text-secondary);
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
}

.had-table-source {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.had-table-source--measured {
  background: rgba(22, 119, 255, 0.12);
  color: #1677ff;
}

.had-table-source--twin {
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
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

:deep(.had-table-group-start > td) {
  border-top: 2px solid rgba(22, 119, 255, 0.1) !important;
}

:deep(.el-table .el-table__row:first-child.had-table-group-start > td) {
  border-top: none !important;
}

@media (max-width: 1280px) {
  .had-module-tabs,
  .had-placeholder-grid,
  .had-placeholder-body {
    grid-template-columns: 1fr;
  }

  .had-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
