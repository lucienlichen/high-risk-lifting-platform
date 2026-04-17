<template>
  <div class="cpd-drawer">
    <div class="cpd-shell">
      <div class="cpd-top-bar">
        <div class="cpd-top-left"></div>
        <div class="cpd-actions">
          <el-select v-model="selectedAlgorithm" size="small" style="width: 180px;">
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

      <div v-if="allRows.length > 0" class="cpd-body" style="padding: 16px; overflow: hidden; display: flex; flex-direction: column; gap: 16px;">
        <div class="cpd-panel" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
          <div class="cpd-table-wrap" style="flex: 1; padding: 12px; height: 100%; min-height: 0;">
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
                <el-table-column prop="predictedCrackTime" label="点位预计裂纹萌生时间" min-width="13%" align="center">
                  <template #default="{ row }">
                    <span :style="{ color: row.damageValue >= 0.85 ? '#f56c6c' : (row.damageValue >= 0.7 ? '#e6a23c' : 'inherit'), fontWeight: row.damageValue >= 0.7 ? '600' : 'normal' }">
                      {{ row.predictedCrackTime }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="structurePredictedCrackTime" label="结构预计裂纹萌生时间" min-width="13%" align="center">
                  <template #default="{ row }">
                    <span :style="{ color: row.structureDamageValue >= 0.85 ? '#f56c6c' : (row.structureDamageValue >= 0.7 ? '#e6a23c' : 'inherit'), fontWeight: row.structureDamageValue >= 0.7 ? '600' : 'normal' }">
                      {{ row.structurePredictedCrackTime }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
          </div>
        </div>
      </div>

      <div v-else class="cpd-empty">
        <el-empty description="当前设备暂无可用于裂纹预测分析的数据" />
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

const selectedAlgorithm = ref('miner01')

type PointSource = 'measured' | 'twin'

type StructureRow = {
  key: string
  code: string
  position: string
  structureObject: string
  source: PointSource
  sourceLabel: string
  damageValue: number
  structureDamageValue?: number
  maxStress: string
  minStress: string
  avgStress: string
  workCycles: string
  cumulativeWorkTime: string
  damageDegree: string
  predictedCrackTime: string
  structurePredictedCrackTime?: string
  rowspan?: number
  colspan?: number
}

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

function formatPredictedCrackTime(damageValue: number, workTimeHours: number) {
  if (damageValue >= 1.0) return '已萌生'
  if (damageValue <= 0) return '大于10年'
  
  const remainingHours = (workTimeHours * (1 - damageValue)) / damageValue
  
  if (remainingHours <= 24) return '24小时内'
  
  const remainingDays = Math.floor(remainingHours / 24)
  if (remainingDays <= 30) return `约 ${remainingDays} 天`
  
  const remainingMonths = Math.floor(remainingDays / 30)
  if (remainingMonths <= 12) return `约 ${remainingMonths} 个月`
  
  const remainingYears = (remainingDays / 365).toFixed(1)
  if (parseFloat(remainingYears) > 10) return '大于10年'
  return `约 ${remainingYears} 年`
}

const measuredRows = computed<StructureRow[]>(() => {
  const stressData = monitoringData.value?.stress ?? []
  const rows = stressData.filter(item => item.history.kind === 'trend') as (typeof stressData[0] & { history: RemoteTrendHistory })[]
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

    const workCyclesCount = Math.floor(damageValue * 850000)
    const workTimeHours = Math.floor(damageValue * 48000)

    const algorithmFactor = selectedAlgorithm.value === 'miner02' ? 1.1 : selectedAlgorithm.value === 'miner03' ? 0.9 : 1.0
    const finalDamageValue = clamp(damageValue * algorithmFactor, 0.1, 0.99)

    const pos = positionFromLabel(item.label)
    return {
      key: `measured-${index}`,
      code: String(index + 1),
      position: pos,
      structureObject: getStructureObject(pos),
      source: 'measured' as PointSource,
      sourceLabel: '实测',
      damageValue: finalDamageValue,
      maxStress: `${peak.toFixed(1)} ${item.history.valueLabel}`,
      minStress: `${valley.toFixed(1)} ${item.history.valueLabel}`,
      avgStress: `${avg.toFixed(1)} ${item.history.valueLabel}`,
      workCycles: `${(workCyclesCount / 10000).toFixed(1)}万次`,
      cumulativeWorkTime: `${workTimeHours}h`,
      damageDegree: finalDamageValue.toFixed(2),
      predictedCrackTime: formatPredictedCrackTime(finalDamageValue, workTimeHours)
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

    const workCyclesCount = Math.floor(damageValue * 850000)
    const workTimeHours = Math.floor(damageValue * 48000)

    const algorithmFactor = selectedAlgorithm.value === 'miner02' ? 1.1 : selectedAlgorithm.value === 'miner03' ? 0.9 : 1.0
    const finalDamageValue = clamp(damageValue * algorithmFactor, 0.1, 0.99)

    return {
      key: `twin-${index}`,
      code: twin.code,
      position: twin.position,
      structureObject: getStructureObject(twin.position),
      source: 'twin' as PointSource,
      sourceLabel: '孪生',
      damageValue: finalDamageValue,
      maxStress: `${peak.toFixed(1)} ${twin.history.valueLabel}`,
      minStress: `${valley.toFixed(1)} ${twin.history.valueLabel}`,
      avgStress: `${avg.toFixed(1)} ${twin.history.valueLabel}`,
      workCycles: `${(workCyclesCount / 10000).toFixed(1)}万次`,
      cumulativeWorkTime: `${workTimeHours}h`,
      damageDegree: finalDamageValue.toFixed(2),
      predictedCrackTime: formatPredictedCrackTime(finalDamageValue, workTimeHours)
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

  let currentGroup = ''
  let currentIdx = 1
  let groupStartIndex = 0
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.structureObject !== currentGroup) {
      if (i > 0) {
        const groupLen = i - groupStartIndex
        rows[groupStartIndex].rowspan = groupLen
        
        let maxDamageValue = 0
        for (let j = groupStartIndex; j < i; j++) {
          if (rows[j].damageValue > maxDamageValue) {
            maxDamageValue = rows[j].damageValue
          }
        }
        const workTimeHours = Math.floor(maxDamageValue * 48000)
        const structurePredictedTime = formatPredictedCrackTime(maxDamageValue, workTimeHours)
        
        for (let j = groupStartIndex; j < i; j++) {
          rows[j].structureDamageValue = maxDamageValue
          rows[j].structurePredictedCrackTime = structurePredictedTime
          if (j > groupStartIndex) rows[j].rowspan = 0
        }
      }
      currentGroup = row.structureObject
      currentIdx = 1
      groupStartIndex = i
    }
    row.code = String(currentIdx++)
  }
  
  if (rows.length > 0) {
    const groupLen = rows.length - groupStartIndex
    rows[groupStartIndex].rowspan = groupLen
    
    let maxDamageValue = 0
    for (let j = groupStartIndex; j < rows.length; j++) {
      if (rows[j].damageValue > maxDamageValue) {
        maxDamageValue = rows[j].damageValue
      }
    }
    const workTimeHours = Math.floor(maxDamageValue * 48000)
    const structurePredictedTime = formatPredictedCrackTime(maxDamageValue, workTimeHours)
    
    for (let j = groupStartIndex; j < rows.length; j++) {
      rows[j].structureDamageValue = maxDamageValue
      rows[j].structurePredictedCrackTime = structurePredictedTime
      if (j > groupStartIndex) rows[j].rowspan = 0
    }
  }

  return rows
})

const allTableRows = computed(() => allRows.value)

function spanMethod({ row, column, rowIndex, columnIndex }: any) {
  if (column.property === 'structureObject' || column.property === 'structurePredictedCrackTime') {
    return {
      rowspan: row.rowspan,
      colspan: row.rowspan === 0 ? 0 : 1
    }
  }
}

function tableRowClassName({ row, rowIndex }: { row: StructureRow; rowIndex: number }) {
  if (row.rowspan && row.rowspan > 0) {
    return 'cpd-table-group-start'
  }
  return ''
}
</script>

<style scoped>
.cpd-drawer {
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
  animation: cpd-slide-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes cpd-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.cpd-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 0;
}

.cpd-top-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 12px;
  background: rgba(248, 250, 252, 0.88);
  border-bottom: 1px solid var(--color-border-light);
}

.cpd-top-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cpd-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cpd-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  padding: 12px 16px 16px;
}

.cpd-panel {
  min-width: 0;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  overflow: hidden;
}

.cpd-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(248, 250, 252, 0.82);
}

.cpd-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.cpd-table-wrap {
  padding: 0 12px 12px;
}

.cpd-table-source {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.cpd-table-source--measured {
  background: rgba(22, 119, 255, 0.12);
  color: #1677ff;
}

.cpd-table-source--twin {
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
}

.cpd-empty {
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

:deep(.cpd-table-group-start > td) {
  border-top: 2px solid rgba(22, 119, 255, 0.1) !important;
}

:deep(.el-table .el-table__row:first-child.cpd-table-group-start > td) {
  border-top: none !important;
}

@media (max-width: 1280px) {
  .cpd-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
