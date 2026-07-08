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

      <!-- ── 结构损伤评估 ── -->
      <div v-else-if="activeModule === 'damage'" class="had-body had-assess-body">
        <div class="had-panel had-assess-panel">
          <div class="had-table-wrap had-assess-table-wrap">
            <el-table :data="damageRows" style="width:100%" height="100%">
              <el-table-column prop="no" label="编号" min-width="5%" align="center" />
              <el-table-column prop="site" label="测点位置" min-width="9%" align="center" />
              <el-table-column prop="desc" label="具体位置" min-width="14%" show-overflow-tooltip />
              <el-table-column label="历史数据" min-width="9%" align="center">
                <template #default="{ row }">
                  <button class="had-hist-link" @click="openHistory('damage', row.idx, row.title, row.loc, row.level)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    查看数据
                  </button>
                </template>
              </el-table-column>
              <el-table-column prop="strainMax" label="应变最大(με)" min-width="8%" align="center" />
              <el-table-column prop="strainAvg" label="应变平均(με)" min-width="8%" align="center" />
              <el-table-column prop="aeMax" label="声发射最大(dB)" min-width="8%" align="center" />
              <el-table-column prop="aeAvg" label="声发射平均(dB)" min-width="8%" align="center" />
              <el-table-column label="位置损伤状态" min-width="9%" align="center">
                <template #default="{ row }">
                  <el-tag :type="levelTagType(row.level)" size="small" effect="plain">{{ row.statusLabel }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="损伤程度" min-width="9%" align="center">
                <template #default="{ row }">
                  <el-tag :type="levelTagType(row.level)" size="small" effect="dark">{{ row.degree }}</el-tag>
                  <span class="had-degree-pct">{{ row.pct }}%</span>
                </template>
              </el-table-column>
              <el-table-column prop="maintain" label="维修建议" min-width="21%" show-overflow-tooltip />
            </el-table>
          </div>
        </div>
      </div>

      <div v-else class="had-empty">
        <el-empty description="当前设备暂无可评估的结构监测数据" />
      </div>

      <!-- ═══ 历史数据文件弹窗（结构损伤） ═══ -->
      <div v-if="historyModal" class="had-modal-mask" @click.self="closeHistory">
        <div class="had-modal-card had-hist-card">
          <header class="had-modal-head">
            <div class="had-modal-title">
              <span class="had-modal-name">{{ historyModal.title }} · 历史数据文件</span>
              <span class="had-modal-loc">{{ historyModal.location }}</span>
            </div>
            <button class="had-modal-close" @click="closeHistory"><el-icon><Close /></el-icon></button>
          </header>
          <div class="had-modal-sub">
            <span>{{ FILE_META[historyModal.mode].desc }}</span>
            <span>每日 1 个数据文件 · 共 {{ historyModal.days.length }} 个</span>
          </div>
          <div class="had-hist-head">
            <span>日期</span><span>数据文件</span><span class="ta-r">下载</span>
          </div>
          <div class="had-hist-list">
            <div v-for="day in historyModal.days" :key="day.date" class="had-hist-row">
              <span class="had-hist-date">{{ day.date }}</span>
              <span class="had-hist-file">
                <svg class="had-hist-file-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span class="had-hist-file-main">
                  <span class="had-hist-fname">{{ day.file.name }}</span>
                  <span class="had-hist-fmeta">上传 {{ day.file.time }} · {{ day.file.sizeMB }} MB · {{ day.file.records.toLocaleString() }} 点</span>
                </span>
                <el-tag v-if="day.file.level !== 'normal'" :type="levelTagType(day.file.level)" size="small" effect="plain">{{ day.file.level === 'danger' ? '异常段' : '波动段' }}</el-tag>
              </span>
              <span class="ta-r">
                <button class="had-hist-dl" title="下载数据文件（演示占位）">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
              </span>
            </div>
          </div>
        </div>
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
type ModuleKey = 'structure' | 'damage'
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
  { key: 'damage', label: '结构损伤评估', sub: '声发射 / 应变损伤识别' }
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

/* ════════════════════════════════════════════════════════════════
   结构损伤 / 减速机 / 行走车轮 / 制动器 状态评估
   - 数据沿用 getRemoteMonitoringData（与「健康监测数据」Tab 口径一致）
   - 每行复刻参考的评估文本列：健康评估 / 故障诊断 / 故障预测 / 维修建议
   - 历史数据列用最大/最小/平均统计值（不做迷你图）
   ════════════════════════════════════════════════════════════════ */

interface TrendStat { max: number; min: number; avg: number; unit: string }

function statOf(h: RemoteTrendHistory, digits = 0): TrendStat {
  const f = Math.pow(10, digits)
  const round = (n: number) => Math.round(n * f) / f
  const v = h.values
  return {
    max: round(Math.max(...v)),
    min: round(Math.min(...v)),
    avg: round(v.reduce((a, b) => a + b, 0) / v.length),
    unit: h.valueLabel ?? ''
  }
}

function siteOfLabel(label: string): string {
  const seg = label.includes('·') ? label.split('·')[1] : label
  return seg.replace(/（.*?）/g, '').trim()
}

function seedHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}

const devId = computed(() => props.device?.id ?? '')

// ── 结构损伤评估 ──────────────────────────────────────────────
const DAMAGE_DESC: Record<string, string> = {
  焊缝热点A: '主梁腹板与上翼缘纵向角焊缝热点（A 区）',
  焊缝热点B: '主梁腹板与下翼缘纵向角焊缝热点（B 区）',
  主梁下翼缘: '主梁跨中下翼缘母材应力集中区',
  端梁连接板: '端梁与主梁连接节点板及螺栓群',
  支腿过渡区: '支腿与下横梁变截面过渡圆弧区',
  小车架铰点: '小车架与车轮组连接铰点销轴部位'
}
const DAMAGE_MAINTAIN: Record<AssessmentLevel, string> = {
  normal: '该部位应变与声发射信号均在正常范围、未见损伤特征，维持周期性监测与数据归档即可。',
  warn: '声发射活动增强、应变出现异常波动，疑似早期损伤；建议提高监测频次并安排无损检测（磁粉/超声）复核焊缝与应力集中区。',
  danger: '应变与声发射信号显著超限、存在明显损伤/裂纹，立即限载停机，开展无损检测与剩余强度评估，必要时修复或更换构件。'
}

interface DamageRow {
  no: string; idx: number; site: string; desc: string; title: string; loc: string
  strainMax: number; strainAvg: number; aeMax: number; aeAvg: number
  level: AssessmentLevel; statusLabel: string
  degree: string; pct: number; maintain: string
}

const damageRows = computed<DamageRow[]>(() => {
  const data = monitoringData.value
  if (!data) return []
  return data.damage.flatMap((p, i) => {
    const h = p.history
    if (h.kind !== 'dualTrend') return []
    const strain = statOf(h.strain, 1)
    const ae = statOf(h.acoustic, 0)
    const site = siteOfLabel(p.label)
    const level = p.status as AssessmentLevel
    const r = seedHash(`${devId.value}-dmg-${site}`)
    let pct: number, degree: string
    if (level === 'normal') { pct = 4 + (r % 6); degree = '无' }
    else if (level === 'warn') { pct = 28 + (r % 18); degree = '轻度' }
    else { pct = 58 + (r % 30); degree = pct >= 78 ? '重度' : '中度' }
    return [{
      no: `${i + 1}#`,
      idx: i,
      site,
      desc: DAMAGE_DESC[site] ?? site,
      title: `结构损伤监测·${site}`,
      loc: DAMAGE_DESC[site] ?? site,
      strainMax: strain.max, strainAvg: strain.avg,
      aeMax: ae.max, aeAvg: ae.avg,
      level,
      statusLabel: level === 'normal' ? '无损伤' : '有损伤',
      degree,
      pct,
      maintain: DAMAGE_MAINTAIN[level]
    }]
  })
})

const pad2 = (n: number) => String(n).padStart(2, '0')
function dateMinusDays(days: number): string {
  const dt = new Date()
  dt.setDate(dt.getDate() - days)
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

/* ── 历史数据文件弹窗（结构损伤：每日 1 个数据文件）──
   对齐参考页面：测点 → 历史数据 → 每日数据文件清单（日期 / 文件名 / 下载） */
type HistMode = 'damage'
interface HistFile { name: string; time: string; sizeMB: number; records: number; level: AssessmentLevel }
interface HistDay { date: string; file: HistFile }

const FILE_META: Record<HistMode, { prefix: string; ext: string; desc: string }> = {
  damage: { prefix: 'DMG', ext: 'dat', desc: '应变与声发射原始波形 · DAT · 采样率 1 MHz' }
}
const MODE_SALT: Record<HistMode, number> = { damage: 5300 }

function buildHistoryDays(mode: HistMode, idx: number, level: AssessmentLevel): HistDay[] {
  const baseSeed = seedHash(`${devId.value}-${mode}-${idx}`) + MODE_SALT[mode]
  const rnd = (n: number) => {
    let x = (baseSeed + n * 2654435761) >>> 0
    x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13
    return (x >>> 0) % 1000 / 1000
  }
  const dayCount = 14 + Math.floor(rnd(1) * 8) // 14~21 天
  const meta = FILE_META[mode]
  const days: HistDay[] = []
  for (let d = 0; d < dayCount; d++) {
    const date = dateMinusDays(d)
    const ymd = date.replace(/-/g, '')
    const hour = 6 + Math.floor(rnd(d * 7 + 2) * 4)
    const min = Math.floor(rnd(d * 7 + 3) * 12) * 5
    const time = `${pad2(hour)}:${pad2(min)}`
    const records = 1800 + Math.floor(rnd(d * 7 + 4) * 4600)
    const sizeMB = Math.round(((records / 1000) * (4 + rnd(d * 7 + 5) * 6) / 10) * 10) / 10 + 0.1
    const elevated = rnd(d * 7 + 6) < (level === 'danger' ? 0.34 : level === 'warn' ? 0.2 : 0.06)
    const fLevel: AssessmentLevel = elevated
      ? (level === 'danger' && rnd(d * 7 + 7) < 0.55 ? 'danger' : 'warn')
      : 'normal'
    days.push({
      date,
      file: { name: `${meta.prefix}_P${idx + 1}_${ymd}.${meta.ext}`, time, sizeMB: Math.round(sizeMB * 10) / 10, records, level: fLevel }
    })
  }
  return days
}

const historyModal = ref<{ title: string; location: string; mode: HistMode; days: HistDay[] } | null>(null)
function openHistory(mode: HistMode, idx: number, title: string, location: string, level: AssessmentLevel) {
  historyModal.value = { title, location, mode, days: buildHistoryDays(mode, idx, level) }
}
function closeHistory() { historyModal.value = null }
</script>

<style scoped>
.had-drawer {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
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

/* ── 状态评估通用表格容器 ── */
.had-assess-body {
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.had-assess-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.had-assess-table-wrap {
  flex: 1;
  padding: 12px;
  height: 100%;
  min-height: 0;
}

.had-stat {
  font-weight: 600;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.had-stat em {
  font-style: normal;
  font-weight: 500;
  color: var(--color-text-muted);
}

.had-degree-pct {
  margin-left: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

/* ── 制动器：闸瓦图像识别 ── */
.had-brake-body {
  padding: 14px 16px 16px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.had-brake-day {
  flex-shrink: 0;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  overflow: hidden;
}

.had-brake-day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(248, 250, 252, 0.7);
}

.had-brake-day-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.had-brake-date {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.had-brake-day-metrics {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.had-brake-day-metrics strong {
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.had-brake-day-hint {
  color: var(--color-text-muted);
}

.had-brake-day-grid {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 14px;
  padding: 14px;
}

.had-brake-shots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  align-content: start;
}

.had-brake-shot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px 6px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-bg-subtle);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
}

.had-brake-shot:hover {
  border-color: rgba(22, 119, 255, 0.4);
  box-shadow: 0 2px 10px rgba(22, 119, 255, 0.12);
  transform: translateY(-1px);
}

.had-brake-shot-img {
  position: relative;
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.18), rgba(148, 163, 184, 0.06));
  color: #94a3b8;
}

.had-brake-shot.is-warn .had-brake-shot-img {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.06));
  color: #b45309;
}

.had-brake-shot.is-danger .had-brake-shot-img {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.24), rgba(239, 68, 68, 0.07));
  color: #b91c1c;
}

.had-brake-shot-badge {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  color: #fff;
  background: rgba(15, 23, 42, 0.55);
}

.had-brake-shot.is-warn .had-brake-shot-badge { background: rgba(180, 83, 9, 0.9); }
.had-brake-shot.is-danger .had-brake-shot-badge { background: rgba(185, 28, 28, 0.92); }

.had-brake-shot-time {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.had-brake-assess {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  align-content: start;
}

.had-brake-assess-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.had-brake-assess-item .k {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--color-primary);
}

.had-brake-assess-item .v {
  color: var(--color-text-secondary);
}

.had-brake-lightbox {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
}

.had-brake-lightbox-card {
  display: flex;
  gap: 16px;
  width: min(640px, 92vw);
  padding: 16px;
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
}

.had-brake-lightbox-img {
  position: relative;
  flex-shrink: 0;
  width: 260px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.06));
  color: #94a3b8;
  font-size: 13px;
}

.had-brake-lightbox-img.is-warn { background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.06)); color: #b45309; }
.had-brake-lightbox-img.is-danger { background: linear-gradient(135deg, rgba(239, 68, 68, 0.24), rgba(239, 68, 68, 0.07)); color: #b91c1c; }

.had-brake-lightbox-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.had-brake-lightbox-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.had-brake-lightbox-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.had-brake-lightbox-rows > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-subtle);
  font-size: 13px;
}

.had-brake-lightbox-rows span { color: var(--color-text-muted); }
.had-brake-lightbox-rows strong { color: var(--color-text-primary); }

/* ── 历史数据查看入口按钮 ── */
.had-hist-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.had-hist-link:hover {
  text-decoration: underline;
}

/* ── 通用弹窗外壳 ── */
.had-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 2900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
}

.had-modal-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 82vh;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
  overflow: hidden;
}

.had-hist-card { max-width: 640px; }
.had-brakeday-card { max-width: 760px; }

.had-modal-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid var(--color-border-light);
}

.had-modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.had-modal-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.had-modal-loc {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.had-modal-close {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.had-modal-close:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
}

.had-modal-sub {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 14px;
  font-size: 11px;
  color: var(--color-text-muted);
  background: rgba(248, 250, 252, 0.7);
  border-bottom: 1px solid var(--color-border-light);
}

/* ── 历史数据文件清单 ── */
.had-hist-head,
.had-hist-row {
  display: grid;
  grid-template-columns: 120px 1fr 48px;
  gap: 12px;
  align-items: center;
  padding: 0 14px;
}

.had-hist-head {
  flex-shrink: 0;
  height: 34px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border-light);
}

.had-hist-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.had-hist-row {
  min-height: 52px;
  padding-top: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
  transition: background 0.15s;
}

.had-hist-row:hover { background: rgba(22, 119, 255, 0.03); }

.had-hist-date {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.had-hist-file {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.had-hist-file-icon { color: var(--color-primary); flex-shrink: 0; }

.had-hist-file-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.had-hist-fname {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-mono, ui-monospace, monospace);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.had-hist-fmeta {
  font-size: 11px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.ta-r { text-align: right; justify-self: end; }

.had-hist-dl {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.had-hist-dl:hover { background: var(--color-bg-subtle); color: var(--color-primary); }

/* ── 制动器当日抓拍弹窗网格 ── */
.had-brakeday-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  padding: 14px;
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
