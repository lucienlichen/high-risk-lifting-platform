<template>
  <div class="cpd-drawer">
    <div class="cpd-shell">
      <div class="cpd-header">
        <div class="cpd-header-main">
          <span class="cpd-title">裂纹预测</span>
          <span class="cpd-subtitle">基于结构损伤监测、结构应力关联与裂纹演化前端推演</span>
        </div>
        <div class="cpd-header-actions">
          <div class="cpd-range-tabs">
            <button
              v-for="option in rangeOptions"
              :key="option.key"
              :class="['cpd-range-tab', { active: activeRange === option.key }]"
              @click="activeRange = option.key"
            >
              {{ option.label }}
            </button>
          </div>
          <el-button size="small" circle @click="emit('close')">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <div v-if="pointRows.length > 0" class="cpd-body">
        <div class="cpd-overview-grid">
          <div class="cpd-overview-card cpd-overview-card--primary">
            <span class="cpd-overview-label">综合裂纹风险等级</span>
            <span class="cpd-overview-value">{{ overallLevelText }}</span>
            <span class="cpd-overview-sub">当前综合评分 {{ overallScoreDisplay }} / 100</span>
          </div>
          <div class="cpd-overview-card">
            <span class="cpd-overview-label">最危险点位</span>
            <span class="cpd-overview-value cpd-overview-value--text">{{ topRiskRow?.position ?? '暂无' }}</span>
            <span class="cpd-overview-sub">{{ topRiskRow?.trendText ?? '整体稳定' }}</span>
          </div>
          <div class="cpd-overview-card">
            <span class="cpd-overview-label">裂纹发展阶段</span>
            <span class="cpd-overview-value cpd-overview-value--text">{{ overallStageLabel }}</span>
            <span class="cpd-overview-sub">{{ overallStageSummary }}</span>
          </div>
          <div class="cpd-overview-card">
            <span class="cpd-overview-label">未来预测结论</span>
            <span class="cpd-overview-value cpd-overview-value--text">{{ overallPredictionHeadline }}</span>
            <span class="cpd-overview-sub">{{ overallPredictionDetail }}</span>
          </div>
          <div class="cpd-overview-card">
            <span class="cpd-overview-label">当前处置建议</span>
            <span class="cpd-overview-value cpd-overview-value--text">{{ overallPrimaryAction }}</span>
            <span class="cpd-overview-sub">{{ overallSafetyWindow }}</span>
          </div>
        </div>

        <div class="cpd-main-grid">
          <div class="cpd-panel">
            <div class="cpd-panel-header">
              <span class="cpd-panel-title">监测点位分布与风险定位</span>
              <el-tag :type="overallLevelTagType" size="small" effect="plain">{{ overallLevelText }}</el-tag>
            </div>
            <div class="cpd-panel-body">
              <div class="cpd-map-shell">
                <div class="cpd-map">
                  <div class="cpd-map-structure cpd-map-structure--beam"></div>
                  <div class="cpd-map-structure cpd-map-structure--brace-left"></div>
                  <div class="cpd-map-structure cpd-map-structure--brace-right"></div>
                  <div class="cpd-map-structure cpd-map-structure--carriage"></div>
                  <button
                    v-for="(node, index) in positionNodes"
                    :key="node.key"
                    :class="['cpd-map-node', `cpd-map-node--${node.level}`, { active: selectedPointKey === node.key }]"
                    :style="{ top: node.top, left: node.left }"
                    @click="selectedPointKey = node.key"
                  >
                    <span class="cpd-map-node-index">{{ index + 1 }}</span>
                  </button>
                </div>
                <div v-if="selectedPointRow" class="cpd-map-detail">
                  <div class="cpd-map-detail-head">
                    <span class="cpd-map-detail-title">{{ selectedPointRow.position }}</span>
                    <el-tag :type="levelTagType(selectedPointRow.level)" size="small" effect="plain">
                      {{ levelText(selectedPointRow.level) }}
                    </el-tag>
                  </div>
                  <div class="cpd-map-detail-metrics">
                    <div class="cpd-metric-card">
                      <span class="cpd-metric-label">当前评分</span>
                      <span class="cpd-metric-value">{{ scoreDisplay(selectedPointRow.riskValue) }}</span>
                    </div>
                    <div class="cpd-metric-card">
                      <span class="cpd-metric-label">24h预测</span>
                      <span class="cpd-metric-value">{{ scoreDisplay(selectedPointRow.predict24) }}</span>
                    </div>
                    <div class="cpd-metric-card">
                      <span class="cpd-metric-label">7天趋势</span>
                      <span class="cpd-metric-value cpd-metric-value--text">{{ selectedPointRow.trend7Text }}</span>
                    </div>
                  </div>
                  <div class="cpd-map-detail-text">{{ selectedPointRow.locationText }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="cpd-panel">
            <div class="cpd-panel-header">
              <span class="cpd-panel-title">点位裂纹预测对比</span>
              <span class="cpd-panel-subtitle">点击表格行联动趋势与诊断区域</span>
            </div>
            <div class="cpd-table-wrap">
              <el-table
                :data="compareTableRows"
                style="width: 100%"
                height="100%"
                :row-class-name="compareRowClassName"
                @row-click="handleCompareRowClick"
              >
                <el-table-column prop="rank" label="排名" width="64" />
                <el-table-column prop="position" label="点位" min-width="132" show-overflow-tooltip />
                <el-table-column prop="riskText" label="当前风险等级" width="118">
                  <template #default="{ row }">
                    <el-tag :type="levelTagType(row.level)" size="small" effect="plain">{{ row.riskText }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="currentScore" label="当前评分" width="92" />
                <el-table-column prop="future24" label="24h预测" width="92" />
                <el-table-column prop="future7" label="7天趋势" width="110" show-overflow-tooltip />
                <el-table-column prop="stageLabel" label="阶段判断" min-width="120" show-overflow-tooltip />
                <el-table-column prop="suggestion" label="建议" min-width="220" show-overflow-tooltip />
              </el-table>
            </div>
          </div>
        </div>

        <div class="cpd-trend-grid">
          <div class="cpd-panel">
            <div class="cpd-panel-header">
              <span class="cpd-panel-title">综合裂纹风险趋势</span>
              <span class="cpd-panel-subtitle">{{ currentRangeMeta.summary }}</span>
            </div>
            <div class="cpd-panel-body">
              <div class="cpd-summary-row">
                <div class="cpd-summary-chip">
                  <span class="cpd-summary-chip-label">当前</span>
                  <span class="cpd-summary-chip-value">{{ overallScoreDisplay }}</span>
                </div>
                <div class="cpd-summary-chip">
                  <span class="cpd-summary-chip-label">未来24h</span>
                  <span class="cpd-summary-chip-value">{{ overallPredict24Display }}</span>
                </div>
                <div class="cpd-summary-chip">
                  <span class="cpd-summary-chip-label">未来7天</span>
                  <span class="cpd-summary-chip-value">{{ overallPredict7Display }}</span>
                </div>
              </div>
              <div ref="overviewChartRef" class="cpd-chart cpd-chart--large"></div>
            </div>
          </div>

          <div class="cpd-panel">
            <div class="cpd-panel-header">
              <span class="cpd-panel-title">单点位多源趋势</span>
              <span class="cpd-panel-subtitle">{{ selectedPointRow?.position ?? '暂无点位' }}</span>
            </div>
            <div class="cpd-panel-body">
              <div v-if="selectedPointRow" class="cpd-detail-grid">
                <div class="cpd-metric-card">
                  <span class="cpd-metric-label">应变</span>
                  <span class="cpd-metric-value">{{ selectedPointRow.currentStrain }}</span>
                </div>
                <div class="cpd-metric-card">
                  <span class="cpd-metric-label">声发射</span>
                  <span class="cpd-metric-value">{{ selectedPointRow.currentAcoustic }}</span>
                </div>
                <div class="cpd-metric-card">
                  <span class="cpd-metric-label">结构应力</span>
                  <span class="cpd-metric-value">{{ selectedPointRow.currentStress }}</span>
                </div>
                <div class="cpd-metric-card">
                  <span class="cpd-metric-label">模型置信度</span>
                  <span class="cpd-metric-value">{{ percentText(selectedPointRow.confidence) }}</span>
                </div>
              </div>
              <div ref="pointChartRef" class="cpd-chart cpd-chart--large"></div>
            </div>
          </div>
        </div>

        <div class="cpd-bottom-grid">
          <div class="cpd-panel">
            <div class="cpd-panel-header">
              <span class="cpd-panel-title">裂纹发展阶段预测</span>
              <span class="cpd-panel-subtitle">{{ selectedPointRow?.position ?? '暂无点位' }}</span>
            </div>
            <div v-if="selectedPointRow" class="cpd-panel-body">
              <div class="cpd-stage-track">
                <div
                  v-for="item in stageOptions"
                  :key="item.key"
                  :class="[
                    'cpd-stage-item',
                    {
                      'is-current': item.key === selectedPointRow.stage,
                      'is-future': item.key === selectedPointRow.futureStage
                    }
                  ]"
                >
                  <span class="cpd-stage-dot"></span>
                  <span class="cpd-stage-label">{{ item.label }}</span>
                </div>
              </div>
              <div class="cpd-stage-summary">
                <div class="cpd-stage-summary-card">
                  <span class="cpd-stage-summary-label">当前阶段</span>
                  <span class="cpd-stage-summary-value">{{ stageLabel(selectedPointRow.stage) }}</span>
                </div>
                <div class="cpd-stage-summary-card">
                  <span class="cpd-stage-summary-label">演进判断</span>
                  <span class="cpd-stage-summary-value">{{ selectedPointRow.stageForecastText }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="cpd-panel">
            <div class="cpd-panel-header">
              <span class="cpd-panel-title">预测依据与诊断解释</span>
              <span class="cpd-panel-subtitle">解释系统为何给出当前结论</span>
            </div>
            <div v-if="selectedPointRow" class="cpd-panel-body cpd-explain-body">
              <div class="cpd-explain-lead">{{ selectedPointRow.conclusion }}</div>
              <div class="cpd-explain-list">
                <div v-for="basis in selectedPointRow.basis" :key="basis" class="cpd-explain-item">
                  <span class="cpd-explain-dot"></span>
                  <span>{{ basis }}</span>
                </div>
              </div>
              <div class="cpd-reliability-grid">
                <div class="cpd-reliability-card">
                  <span class="cpd-reliability-label">模型置信度</span>
                  <span class="cpd-reliability-value">{{ percentText(selectedPointRow.confidence) }}</span>
                </div>
                <div class="cpd-reliability-card">
                  <span class="cpd-reliability-label">数据完整率</span>
                  <span class="cpd-reliability-value">{{ percentText(selectedPointRow.dataCompleteness) }}</span>
                </div>
                <div class="cpd-reliability-card">
                  <span class="cpd-reliability-label">传感器状态</span>
                  <span class="cpd-reliability-value">{{ selectedPointRow.sensorStatusText }}</span>
                </div>
                <div class="cpd-reliability-card">
                  <span class="cpd-reliability-label">一致性判断</span>
                  <span class="cpd-reliability-value">{{ selectedPointRow.consistencyText }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="cpd-panel">
            <div class="cpd-panel-header">
              <span class="cpd-panel-title">运维建议与处置动作</span>
              <span class="cpd-panel-subtitle">围绕当前重点点位给出处置闭环</span>
            </div>
            <div v-if="selectedPointRow" class="cpd-panel-body cpd-action-body">
              <div class="cpd-action-grid">
                <div class="cpd-action-card">
                  <span class="cpd-action-label">当前建议动作</span>
                  <span class="cpd-action-value">{{ selectedPointRow.suggestion }}</span>
                </div>
                <div class="cpd-action-card">
                  <span class="cpd-action-label">建议处理时限</span>
                  <span class="cpd-action-value">{{ selectedPointRow.actionDeadline }}</span>
                </div>
                <div class="cpd-action-card">
                  <span class="cpd-action-label">建议检查方式</span>
                  <span class="cpd-action-value">{{ selectedPointRow.inspectMethod }}</span>
                </div>
                <div class="cpd-action-card">
                  <span class="cpd-action-label">风险升级条件</span>
                  <span class="cpd-action-value">{{ selectedPointRow.escalationCondition }}</span>
                </div>
              </div>
              <div class="cpd-explain-list">
                <div v-for="advice in selectedActionList" :key="advice" class="cpd-explain-item">
                  <span class="cpd-explain-dot cpd-explain-dot--danger"></span>
                  <span>{{ advice }}</span>
                </div>
              </div>
            </div>
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getRemoteMonitoringData } from '@/mock'
import type { Device, RemoteDualTrendHistory, RemoteMonitoringData, RemoteTrendHistory } from '@/mock'

const props = defineProps<{
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const rangeOptions = [
  { key: '1h', label: '最近1小时', summary: '查看短周期风险波动与未来1小时推演' },
  { key: '24h', label: '最近24小时', summary: '查看近24小时历史与未来24小时预测' },
  { key: '7d', label: '最近7天', summary: '查看近7天演化趋势与未来7天预测' },
  { key: '30d', label: '最近30天', summary: '查看长周期变化与未来30天演进参考' }
] as const

const stageOptions = [
  { key: 'normal', label: '正常阶段' },
  { key: 'emerging', label: '疑似萌生' },
  { key: 'early', label: '早期扩展' },
  { key: 'accelerating', label: '扩展加速' },
  { key: 'critical', label: '高风险阶段' }
] as const

type TimeRange = typeof rangeOptions[number]['key']
type CrackLevel = 'normal' | 'attention' | 'warning' | 'alarm'
type StageKey = typeof stageOptions[number]['key']

type CrackPointRow = {
  key: string
  position: string
  level: CrackLevel
  riskValue: number
  predict24: number
  predict7: number
  trendText: string
  trend7Text: string
  stage: StageKey
  futureStage: StageKey
  stageForecastText: string
  lastAbnormalTime: string
  suggestion: string
  actionDeadline: string
  inspectMethod: string
  escalationCondition: string
  currentStrain: string
  currentAcoustic: string
  currentStress: string
  confidence: number
  dataCompleteness: number
  sensorStatusText: string
  consistencyText: string
  locationText: string
  conclusion: string
  basis: string[]
  history: RemoteDualTrendHistory
  stressHistory: RemoteTrendHistory | null
}

type CompareTableRow = {
  key: string
  rank: number
  position: string
  level: CrackLevel
  riskText: string
  currentScore: string
  future24: string
  future7: string
  stageLabel: string
  suggestion: string
}

const pointLayout = [
  { top: '17%', left: '22%' },
  { top: '18%', left: '72%' },
  { top: '46%', left: '34%' },
  { top: '48%', left: '78%' },
  { top: '74%', left: '18%' },
  { top: '74%', left: '58%' }
] as const

const activeRange = ref<TimeRange>('24h')
const selectedPointKey = ref('')

const monitoringData = computed<RemoteMonitoringData | null>(() =>
  props.device ? getRemoteMonitoringData(props.device) : null
)

const currentRangeMeta = computed(() =>
  rangeOptions.find(item => item.key === activeRange.value) ?? rangeOptions[1]
)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function lastValue(values: number[]) {
  return values[values.length - 1] ?? 0
}

function scoreDisplay(value: number) {
  return String(Math.round(value * 100))
}

function percentText(value: number) {
  return `${Math.round(value * 100)}%`
}

function positionFromLabel(label: string) {
  const left = label.includes('·') ? label.split('·')[1] : label
  return left.replace(/（\d+#）/g, '').trim()
}

function levelTagType(level: CrackLevel) {
  if (level === 'alarm') return 'danger'
  if (level === 'warning') return 'warning'
  if (level === 'attention') return 'info'
  return 'success'
}

function levelText(level: CrackLevel) {
  if (level === 'alarm') return '报警'
  if (level === 'warning') return '预警'
  if (level === 'attention') return '关注'
  return '正常'
}

function riskLevel(value: number): CrackLevel {
  if (value >= 0.8) return 'alarm'
  if (value >= 0.64) return 'warning'
  if (value >= 0.42) return 'attention'
  return 'normal'
}

function stageFromScore(value: number): StageKey {
  if (value >= 0.86) return 'critical'
  if (value >= 0.7) return 'accelerating'
  if (value >= 0.56) return 'early'
  if (value >= 0.38) return 'emerging'
  return 'normal'
}

function stageLabel(stage: StageKey) {
  return stageOptions.find(item => item.key === stage)?.label ?? '正常阶段'
}

function seriesGrowth(values: number[]) {
  if (values.length < 6) return 0
  const segment = Math.max(2, Math.floor(values.length / 4))
  const prev = average(values.slice(values.length - segment * 2, values.length - segment))
  const recent = average(values.slice(values.length - segment))
  const base = Math.max(Math.abs(prev), 1)
  return (recent - prev) / base
}

function agreementText(value: number) {
  if (value >= 0.8) return '高'
  if (value >= 0.58) return '中'
  return '低'
}

function trendTextFromScores(current: number, next24: number, next7: number) {
  const delta24 = next24 - current
  const delta7 = next7 - next24
  if (delta24 >= 0.14 || delta7 >= 0.1) return '持续抬升'
  if (delta24 >= 0.05) return '波动上升'
  if (delta24 <= -0.06 && delta7 <= -0.03) return '逐步回落'
  return '基本稳定'
}

function actionMeta(level: CrackLevel) {
  if (level === 'alarm') {
    return {
      suggestion: '建议立即停机复核并启动专项检测',
      deadline: '24小时内完成专项检测',
      inspectMethod: '优先安排超声、磁粉与现场开裂复核',
      escalation: '若24h预测评分持续大于85分，立即升级为停机检查'
    }
  }
  if (level === 'warning') {
    return {
      suggestion: '建议48小时内安排人工复核及无损检测',
      deadline: '48小时内完成现场复核',
      inspectMethod: '建议实施超声检测并复核焊缝表面状态',
      escalation: '若多源异常连续两个周期放大，升级为报警'
    }
  }
  if (level === 'attention') {
    return {
      suggestion: '建议加密观察并缩短人工复核周期',
      deadline: '72小时内安排人工复核',
      inspectMethod: '开展重点部位巡检并保留趋势记录',
      escalation: '若24h预测超过65分，升级为预警'
    }
  }
  return {
    suggestion: '继续监测并按原周期巡检',
    deadline: '按计划执行例行检查',
    inspectMethod: '维持常规巡检与数据留存',
    escalation: '若应变与声发射同步抬升，转入关注'
  }
}

function locationText(position: string, index: number) {
  const texts = [
    '位于主梁左侧焊缝热点区域，适合作为裂纹萌生先导点位跟踪。',
    '位于主梁右侧焊缝热点区域，可用于对称位置风险对比。',
    '位于主梁下翼缘中部，重点关注疲劳应力与局部损伤耦合。',
    '位于端梁连接板过渡区，重点检查连接板与孔边异常。',
    '位于支腿与主梁过渡区，适合识别结构过渡位置裂纹演化。',
    '位于小车架铰点附近，适合跟踪载荷变化引起的局部累积损伤。'
  ]
  return texts[index] ?? `${position} 为当前裂纹预测关注测点。`
}

function buildPointBaseSeries(row: CrackPointRow) {
  const strain = row.history.strain.values
  const acoustic = row.history.acoustic.values
  const stress = row.stressHistory?.values.length ? row.stressHistory.values : strain.map(value => value * 1.08)
  const strainMax = Math.max(...strain, 1)
  const acousticMax = Math.max(...acoustic, 1)
  const stressMax = Math.max(...stress, 1)
  const stressIndex = stress.map(value => Number((value / stressMax * 100).toFixed(1)))
  const acousticIndex = acoustic.map(value => Number((value / acousticMax * 100).toFixed(1)))
  const eddyIndex = strain.map((value, index) => Number((
    clamp(
      value / strainMax * 0.32 +
      (acoustic[index] ?? 0) / acousticMax * 0.44 +
      (stress[index] ?? 0) / stressMax * 0.24,
      0.08,
      0.99
    ) * 100
  ).toFixed(1)))
  const riskIndex = strain.map((value, index) => Number((
    clamp(
      value / strainMax * 0.24 +
      (acoustic[index] ?? 0) / acousticMax * 0.22 +
      (stress[index] ?? 0) / stressMax * 0.18 +
      eddyIndex[index] / 100 * 0.22 +
      Math.abs(value - (strain[0] ?? value)) / strainMax * 0.14,
      0.08,
      0.99
    ) * 100
  ).toFixed(1)))
  return {
    labels: row.history.strain.times,
    stressIndex,
    acousticIndex,
    eddyIndex,
    riskIndex
  }
}

function projectLongSeries(values: number[], count: number, intensity: number) {
  const latest = lastValue(values)
  const mean = average(values)
  const growth = seriesGrowth(values) * 100
  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 1 : index / (count - 1)
    const base = mean * (0.82 + progress * 0.14) + latest * (0.08 + progress * 0.1)
    const wave = Math.sin(index * 1.2 + latest / 30) * intensity + Math.cos(index * 0.7) * intensity * 0.45
    const drift = growth * (progress - 0.5) * 0.7
    return Number(clamp(base + wave + drift, 8, 98).toFixed(1))
  })
}

function buildForecastSeries(start: number, target: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const progress = (index + 1) / count
    const wave = Math.sin(progress * Math.PI) * Math.abs(target - start) * 0.04
    const sign = target >= start ? 1 : -1
    return Number(clamp(start + (target - start) * progress + wave * sign, 6, 99).toFixed(1))
  })
}

function buildRangeViewFromSeries(base: ReturnType<typeof buildPointBaseSeries>, range: TimeRange, target: number) {
  if (range === '1h') {
    const actualCount = Math.min(6, base.labels.length)
    const actualLabels = base.labels.slice(base.labels.length - actualCount)
    const futureLabels = Array.from({ length: 6 }, (_, index) => `+${(index + 1) * 10}m`)
    return {
      labels: [...actualLabels, ...futureLabels],
      actualCount,
      stress: [...base.stressIndex.slice(base.stressIndex.length - actualCount), ...Array(futureLabels.length).fill(null)],
      acoustic: [...base.acousticIndex.slice(base.acousticIndex.length - actualCount), ...Array(futureLabels.length).fill(null)],
      eddy: [...base.eddyIndex.slice(base.eddyIndex.length - actualCount), ...Array(futureLabels.length).fill(null)],
      risk: [...base.riskIndex.slice(base.riskIndex.length - actualCount), ...Array(futureLabels.length).fill(null)],
      forecast: [
        ...Array(Math.max(actualCount - 1, 0)).fill(null),
        lastValue(base.riskIndex.slice(base.riskIndex.length - actualCount)),
        ...buildForecastSeries(lastValue(base.riskIndex), target, futureLabels.length)
      ]
    }
  }

  if (range === '24h') {
    const futureLabels = Array.from({ length: 8 }, (_, index) => `+${(index + 1) * 3}h`)
    return {
      labels: [...base.labels, ...futureLabels],
      actualCount: base.labels.length,
      stress: [...base.stressIndex, ...Array(futureLabels.length).fill(null)],
      acoustic: [...base.acousticIndex, ...Array(futureLabels.length).fill(null)],
      eddy: [...base.eddyIndex, ...Array(futureLabels.length).fill(null)],
      risk: [...base.riskIndex, ...Array(futureLabels.length).fill(null)],
      forecast: [
        ...Array(Math.max(base.labels.length - 1, 0)).fill(null),
        lastValue(base.riskIndex),
        ...buildForecastSeries(lastValue(base.riskIndex), target, futureLabels.length)
      ]
    }
  }

  if (range === '7d') {
    const actualLabels = Array.from({ length: 7 }, (_, index) => `D-${6 - index}`)
    const futureLabels = Array.from({ length: 7 }, (_, index) => `+${index + 1}d`)
    const stress = projectLongSeries(base.stressIndex, 7, 4.2)
    const acoustic = projectLongSeries(base.acousticIndex, 7, 5.5)
    const eddy = projectLongSeries(base.eddyIndex, 7, 4.8)
    const risk = projectLongSeries(base.riskIndex, 7, 4.4)
    return {
      labels: [...actualLabels, ...futureLabels],
      actualCount: actualLabels.length,
      stress: [...stress, ...Array(futureLabels.length).fill(null)],
      acoustic: [...acoustic, ...Array(futureLabels.length).fill(null)],
      eddy: [...eddy, ...Array(futureLabels.length).fill(null)],
      risk: [...risk, ...Array(futureLabels.length).fill(null)],
      forecast: [
        ...Array(Math.max(actualLabels.length - 1, 0)).fill(null),
        lastValue(risk),
        ...buildForecastSeries(lastValue(risk), target, futureLabels.length)
      ]
    }
  }

  const actualLabels = Array.from({ length: 10 }, (_, index) => `D-${(9 - index) * 3}`)
  const futureLabels = Array.from({ length: 10 }, (_, index) => `+${(index + 1) * 3}d`)
  const stress = projectLongSeries(base.stressIndex, 10, 5.2)
  const acoustic = projectLongSeries(base.acousticIndex, 10, 6.2)
  const eddy = projectLongSeries(base.eddyIndex, 10, 5.5)
  const risk = projectLongSeries(base.riskIndex, 10, 5.8)
  return {
    labels: [...actualLabels, ...futureLabels],
    actualCount: actualLabels.length,
    stress: [...stress, ...Array(futureLabels.length).fill(null)],
    acoustic: [...acoustic, ...Array(futureLabels.length).fill(null)],
    eddy: [...eddy, ...Array(futureLabels.length).fill(null)],
    risk: [...risk, ...Array(futureLabels.length).fill(null)],
    forecast: [
      ...Array(Math.max(actualLabels.length - 1, 0)).fill(null),
      lastValue(risk),
      ...buildForecastSeries(lastValue(risk), target, futureLabels.length)
    ]
  }
}

const pointRows = computed<CrackPointRow[]>(() => {
  const damageRows = (monitoringData.value?.damage ?? []).flatMap(item =>
    item.history.kind === 'dualTrend'
      ? [{
          ...item,
          history: item.history
        }]
      : []
  )
  const stressRows = (monitoringData.value?.stress ?? []).flatMap(item =>
    item.history.kind === 'trend'
      ? [{
          ...item,
          history: item.history
        }]
      : []
  )
  if (!damageRows.length) return []

  const allStrainMax = Math.max(...damageRows.map(item => Math.max(...item.history.strain.values)), 1)
  const allAcousticMax = Math.max(...damageRows.map(item => Math.max(...item.history.acoustic.values)), 1)
  const allStressMax = Math.max(
    ...stressRows.map(item => Math.max(...item.history.values)),
    allStrainMax * 1.08,
    1
  )

  return damageRows.map((item, index) => {
    const strainValues = item.history.strain.values
    const acousticValues = item.history.acoustic.values
    const stressHistory = stressRows[index]?.history.kind === 'trend' ? stressRows[index].history : null
    const stressValues = stressHistory?.values.length ? stressHistory.values : strainValues.map(value => value * 1.08)
    const currentStrain = lastValue(strainValues)
    const currentAcoustic = lastValue(acousticValues)
    const currentStress = lastValue(stressValues)
    const peakStrain = Math.max(...strainValues)
    const peakAcoustic = Math.max(...acousticValues)
    const peakStress = Math.max(...stressValues)
    const strainDelta = Math.abs(currentStrain - (strainValues[0] ?? currentStrain)) / allStrainMax
    const acousticDelta = Math.abs(currentAcoustic - (acousticValues[0] ?? currentAcoustic)) / allAcousticMax
    const stressDelta = Math.abs(currentStress - (stressValues[0] ?? currentStress)) / allStressMax
    const strainGrowth = seriesGrowth(strainValues)
    const acousticGrowth = seriesGrowth(acousticValues)
    const stressGrowth = seriesGrowth(stressValues)
    const positiveCount = [strainGrowth, acousticGrowth, stressGrowth].filter(value => value > 0.015).length
    const stableCount = [strainGrowth, acousticGrowth, stressGrowth].filter(value => Math.abs(value) <= 0.015).length
    const consistency = clamp((positiveCount * 0.34 + stableCount * 0.18) / 1, 0.38, 0.96)
    const growthBlend = clamp((strainGrowth + acousticGrowth + stressGrowth) / 3, -0.06, 0.24)
    const eddyFeature = clamp(
      currentAcoustic / allAcousticMax * 0.34 +
      currentStress / allStressMax * 0.24 +
      strainDelta * 0.22 +
      acousticDelta * 0.2,
      0.08,
      0.98
    )
    const riskValue = clamp(
      peakStrain / allStrainMax * 0.18 +
      peakAcoustic / allAcousticMax * 0.16 +
      peakStress / allStressMax * 0.14 +
      strainDelta * 0.16 +
      acousticDelta * 0.14 +
      stressDelta * 0.08 +
      eddyFeature * 0.14 +
      Math.max(growthBlend, -0.02) * 0.18,
      0.16,
      0.98
    )
    const predict24 = clamp(
      riskValue +
      growthBlend * 0.85 +
      eddyFeature * 0.08 +
      consistency * 0.03,
      0.18,
      0.99
    )
    const predict7 = clamp(
      predict24 +
      growthBlend * 0.94 +
      eddyFeature * 0.1 +
      (riskValue >= 0.72 ? 0.04 : 0),
      0.2,
      0.995
    )
    const level = riskLevel(Math.max(riskValue, predict24 * 0.96))
    const stage = stageFromScore(riskValue)
    const futureStage = stageFromScore((predict24 + predict7) / 2)
    const completeness = clamp(
      (strainValues.length + acousticValues.length + (stressHistory?.values.length ?? strainValues.length)) / (24 * 3),
      0.76,
      0.98
    )
    const confidence = clamp(0.56 + completeness * 0.18 + consistency * 0.18 + (stressHistory ? 0.05 : 0), 0.58, 0.95)
    const combinedSeries = strainValues.map((value, idx) =>
      value / allStrainMax * 0.36 +
      (acousticValues[idx] ?? 0) / allAcousticMax * 0.38 +
      (stressValues[idx] ?? 0) / allStressMax * 0.26
    )
    const lastAbnormalIndex = combinedSeries.reduce((bestIndex, value, idx, list) => value >= (list[bestIndex] ?? 0) ? idx : bestIndex, 0)
    const lastAbnormalTime = item.history.strain.times[lastAbnormalIndex] ?? item.history.strain.times[item.history.strain.times.length - 1] ?? '--'
    const trend = trendTextFromScores(riskValue, predict24, predict7)
    const action = actionMeta(level)
    const position = positionFromLabel(item.label)
    const basis = [
      `应变峰值 ${peakStrain.toFixed(1)} ${item.history.strain.valueLabel ?? ''}，当前值 ${currentStrain.toFixed(1)} ${item.history.strain.valueLabel ?? ''}。`,
      `声发射活跃度峰值 ${peakAcoustic.toFixed(0)} ${item.history.acoustic.valueLabel ?? ''}，最近异常时刻 ${lastAbnormalTime}。`,
      `关联结构应力当前为 ${currentStress.toFixed(1)} ${stressHistory?.valueLabel ?? 'με'}，与裂纹风险趋势一致性 ${agreementText(consistency)}。`,
      `综合预测置信度 ${percentText(confidence)}，适合作为本轮点位优先级排序依据。`
    ]
    return {
      key: `crack-${index}`,
      position,
      level,
      riskValue,
      predict24,
      predict7,
      trendText: `未来24h ${trend}，建议持续跟踪 ${position}`,
      trend7Text: trendTextFromScores(predict24, predict7, clamp(predict7 + growthBlend * 0.5, 0.18, 0.995)),
      stage,
      futureStage,
      stageForecastText: futureStage === stage
        ? `当前维持“${stageLabel(stage)}”，短期内以持续监测为主`
        : `若当前趋势持续，预计将由“${stageLabel(stage)}”演进至“${stageLabel(futureStage)}”`,
      lastAbnormalTime,
      suggestion: action.suggestion,
      actionDeadline: action.deadline,
      inspectMethod: action.inspectMethod,
      escalationCondition: action.escalation,
      currentStrain: `${currentStrain.toFixed(1)} ${item.history.strain.valueLabel ?? ''}`,
      currentAcoustic: `${currentAcoustic.toFixed(0)} ${item.history.acoustic.valueLabel ?? ''}`,
      currentStress: `${currentStress.toFixed(1)} ${stressHistory?.valueLabel ?? 'με'}`,
      confidence,
      dataCompleteness: completeness,
      sensorStatusText: completeness >= 0.9 ? '正常' : '需关注',
      consistencyText: agreementText(consistency),
      locationText: locationText(position, index),
      conclusion: `${position} 当前综合裂纹评分 ${scoreDisplay(riskValue)} 分，未来24小时预测 ${scoreDisplay(predict24)} 分，未来7天趋势判断为“${trendTextFromScores(riskValue, predict24, predict7)}”。`,
      basis,
      history: item.history,
      stressHistory
    }
  }).sort((a, b) => b.riskValue - a.riskValue)
})

const topRiskRow = computed(() => pointRows.value[0] ?? null)

watch(pointRows, rows => {
  if (!rows.find(item => item.key === selectedPointKey.value)) {
    selectedPointKey.value = rows[0]?.key ?? ''
  }
}, { immediate: true })

const selectedPointRow = computed(() =>
  pointRows.value.find(item => item.key === selectedPointKey.value) ?? pointRows.value[0] ?? null
)

const positionNodes = computed(() =>
  pointRows.value.map((row, index) => ({
    ...row,
    top: pointLayout[index % pointLayout.length].top,
    left: pointLayout[index % pointLayout.length].left
  }))
)

const overallRiskScore = computed(() => {
  if (!pointRows.value.length) return 0
  const avg = average(pointRows.value.map(item => item.riskValue))
  const top = topRiskRow.value?.riskValue ?? avg
  return Number((avg * 0.56 + top * 0.44).toFixed(2))
})

const overallPredict24 = computed(() => {
  if (!pointRows.value.length) return 0
  const avg = average(pointRows.value.map(item => item.predict24))
  const top = topRiskRow.value?.predict24 ?? avg
  return Number((avg * 0.54 + top * 0.46).toFixed(2))
})

const overallPredict7 = computed(() => {
  if (!pointRows.value.length) return 0
  const avg = average(pointRows.value.map(item => item.predict7))
  const top = topRiskRow.value?.predict7 ?? avg
  return Number((avg * 0.52 + top * 0.48).toFixed(2))
})

const overallLevel = computed(() => riskLevel(Math.max(overallRiskScore.value, overallPredict24.value * 0.98)))
const overallLevelText = computed(() => levelText(overallLevel.value))
const overallLevelTagType = computed(() => levelTagType(overallLevel.value))
const overallStage = computed(() => stageFromScore((overallRiskScore.value + overallPredict24.value) / 2))
const overallStageLabel = computed(() => stageLabel(overallStage.value))
const overallScoreDisplay = computed(() => scoreDisplay(overallRiskScore.value))
const overallPredict24Display = computed(() => scoreDisplay(overallPredict24.value))
const overallPredict7Display = computed(() => scoreDisplay(overallPredict7.value))
const overallStageSummary = computed(() =>
  overallPredict7.value > overallRiskScore.value + 0.08 ? '未来阶段仍有继续上探迹象' : '当前阶段短期内相对可控'
)
const overallPredictionHeadline = computed(() =>
  trendTextFromScores(overallRiskScore.value, overallPredict24.value, overallPredict7.value)
)
const overallPredictionDetail = computed(() =>
  `未来24h ${overallPredict24Display.value} 分，未来7天 ${overallPredict7Display.value} 分`
)
const overallPrimaryAction = computed(() =>
  topRiskRow.value?.suggestion ?? '继续监测并保持常规巡检'
)
const overallSafetyWindow = computed(() =>
  topRiskRow.value?.actionDeadline ?? '暂无明确处置时限'
)

const compareTableRows = computed<CompareTableRow[]>(() =>
  pointRows.value.map((row, index) => ({
    key: row.key,
    rank: index + 1,
    position: row.position,
    level: row.level,
    riskText: levelText(row.level),
    currentScore: scoreDisplay(row.riskValue),
    future24: scoreDisplay(row.predict24),
    future7: row.trend7Text,
    stageLabel: stageLabel(row.stage),
    suggestion: row.suggestion
  }))
)

const selectedActionList = computed(() => {
  const row = selectedPointRow.value
  if (!row) return []
  return [
    `优先围绕 ${row.position} 开展现场复核，并保留本次预测截图与趋势结果。`,
    `若未来24小时预测评分升至 ${Math.min(99, Math.round(row.predict24 * 100) + 8)} 分以上，建议立即升级处置级别。`,
    `建议将 ${row.position} 纳入下一轮重点巡检路线，与相邻结构位置做对比检查。`
  ]
})

function handleCompareRowClick(row: CompareTableRow) {
  selectedPointKey.value = row.key
}

function compareRowClassName({ row }: { row: CompareTableRow }) {
  return row.key === selectedPointKey.value ? 'cpd-table-row--active' : ''
}

function buildOverallBaseSeries() {
  if (!pointRows.value.length) {
    return {
      labels: [] as string[],
      riskIndex: [] as number[]
    }
  }
  const seriesList = pointRows.value.map(row => buildPointBaseSeries(row).riskIndex)
  const totalWeight = pointRows.value.reduce((sum, row) => sum + row.riskValue, 0) || 1
  const labels = buildPointBaseSeries(pointRows.value[0]).labels
  const riskIndex = labels.map((_, index) => {
    const weighted = pointRows.value.reduce((sum, row, rowIndex) => {
      const weight = (row.riskValue + 0.15) / (totalWeight + pointRows.value.length * 0.15)
      return sum + (seriesList[rowIndex][index] ?? 0) * weight
    }, 0)
    return Number(weighted.toFixed(1))
  })
  return { labels, riskIndex }
}

function buildOverallRangeView() {
  const base = buildOverallBaseSeries()
  if (!base.labels.length) {
    return {
      labels: [] as string[],
      actualCount: 0,
      risk: [] as Array<number | null>,
      forecast: [] as Array<number | null>
    }
  }

  if (activeRange.value === '1h') {
    const actualCount = Math.min(6, base.labels.length)
    const actualLabels = base.labels.slice(base.labels.length - actualCount)
    const futureLabels = Array.from({ length: 6 }, (_, index) => `+${(index + 1) * 10}m`)
    const actualRisk = base.riskIndex.slice(base.riskIndex.length - actualCount)
    return {
      labels: [...actualLabels, ...futureLabels],
      actualCount,
      risk: [...actualRisk, ...Array(futureLabels.length).fill(null)],
      forecast: [
        ...Array(Math.max(actualCount - 1, 0)).fill(null),
        lastValue(actualRisk),
        ...buildForecastSeries(lastValue(actualRisk), clamp(overallPredict24.value * 100, 12, 98), futureLabels.length)
      ]
    }
  }

  if (activeRange.value === '24h') {
    const futureLabels = Array.from({ length: 8 }, (_, index) => `+${(index + 1) * 3}h`)
    return {
      labels: [...base.labels, ...futureLabels],
      actualCount: base.labels.length,
      risk: [...base.riskIndex, ...Array(futureLabels.length).fill(null)],
      forecast: [
        ...Array(Math.max(base.labels.length - 1, 0)).fill(null),
        lastValue(base.riskIndex),
        ...buildForecastSeries(lastValue(base.riskIndex), clamp(overallPredict24.value * 100, 12, 98), futureLabels.length)
      ]
    }
  }

  if (activeRange.value === '7d') {
    const actualLabels = Array.from({ length: 7 }, (_, index) => `D-${6 - index}`)
    const futureLabels = Array.from({ length: 7 }, (_, index) => `+${index + 1}d`)
    const actualRisk = projectLongSeries(base.riskIndex, 7, 4.2)
    return {
      labels: [...actualLabels, ...futureLabels],
      actualCount: actualLabels.length,
      risk: [...actualRisk, ...Array(futureLabels.length).fill(null)],
      forecast: [
        ...Array(Math.max(actualLabels.length - 1, 0)).fill(null),
        lastValue(actualRisk),
        ...buildForecastSeries(lastValue(actualRisk), clamp(overallPredict7.value * 100, 14, 99), futureLabels.length)
      ]
    }
  }

  const actualLabels = Array.from({ length: 10 }, (_, index) => `D-${(9 - index) * 3}`)
  const futureLabels = Array.from({ length: 10 }, (_, index) => `+${(index + 1) * 3}d`)
  const actualRisk = projectLongSeries(base.riskIndex, 10, 5.2)
  return {
    labels: [...actualLabels, ...futureLabels],
    actualCount: actualLabels.length,
    risk: [...actualRisk, ...Array(futureLabels.length).fill(null)],
    forecast: [
      ...Array(Math.max(actualLabels.length - 1, 0)).fill(null),
      lastValue(actualRisk),
      ...buildForecastSeries(lastValue(actualRisk), clamp(overallPredict7.value * 100 + 4, 16, 99), futureLabels.length)
    ]
  }
}

const overviewChartRef = ref<HTMLElement>()
const pointChartRef = ref<HTMLElement>()
let overviewChart: echarts.ECharts | null = null
let pointChart: echarts.ECharts | null = null

function renderOverviewChart() {
  if (!overviewChartRef.value || !pointRows.value.length) return
  overviewChart ??= echarts.init(overviewChartRef.value)
  const chartData = buildOverallRangeView()
  overviewChart.setOption({
    backgroundColor: 'transparent',
    animationDuration: 320,
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      textStyle: { color: '#475569', fontSize: 12 }
    },
    grid: { left: 48, right: 28, top: 38, bottom: 34 },
    xAxis: {
      type: 'category',
      data: chartData.labels,
      axisLine: { lineStyle: { color: '#dbe4ee' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: '风险指数',
      min: 0,
      max: 100,
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#edf2f7', type: 'dashed' } }
    },
    series: [
      {
        name: '综合裂纹风险',
        type: 'line',
        smooth: true,
        data: chartData.risk,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 3, color: '#1677ff' },
        itemStyle: { color: '#1677ff' },
        areaStyle: { color: 'rgba(22, 119, 255, 0.08)' }
      },
      {
        name: '未来预测',
        type: 'line',
        smooth: true,
        data: chartData.forecast,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 3, type: 'dashed', color: '#ff4d4f' },
        itemStyle: { color: '#ff4d4f' },
        areaStyle: { color: 'rgba(255, 77, 79, 0.06)' }
      }
    ]
  }, true)
}

function renderPointChart() {
  if (!pointChartRef.value || !selectedPointRow.value) return
  pointChart ??= echarts.init(pointChartRef.value)
  const row = selectedPointRow.value
  const base = buildPointBaseSeries(row)
  const chartData = buildRangeViewFromSeries(
    base,
    activeRange.value,
    clamp((activeRange.value === '7d' || activeRange.value === '30d' ? row.predict7 : row.predict24) * 100, 12, 99)
  )
  pointChart.setOption({
    backgroundColor: 'transparent',
    animationDuration: 320,
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      textStyle: { color: '#475569', fontSize: 12 }
    },
    grid: { left: 48, right: 28, top: 38, bottom: 34 },
    xAxis: {
      type: 'category',
      data: chartData.labels,
      axisLine: { lineStyle: { color: '#dbe4ee' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: '指数化趋势',
      min: 0,
      max: 100,
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#edf2f7', type: 'dashed' } }
    },
    series: [
      {
        name: '结构应力指数',
        type: 'line',
        smooth: true,
        data: chartData.stress,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#1677ff' },
        itemStyle: { color: '#1677ff' }
      },
      {
        name: '声发射活跃度',
        type: 'line',
        smooth: true,
        data: chartData.acoustic,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#ff7a45' },
        itemStyle: { color: '#ff7a45' }
      },
      {
        name: '柔性涡流特征',
        type: 'line',
        smooth: true,
        data: chartData.eddy,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#14b8a6' },
        itemStyle: { color: '#14b8a6' }
      },
      {
        name: '综合裂纹风险',
        type: 'line',
        smooth: true,
        data: chartData.risk,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 3, color: '#7c3aed' },
        itemStyle: { color: '#7c3aed' }
      },
      {
        name: '裂纹预测指数',
        type: 'line',
        smooth: true,
        data: chartData.forecast,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 3, type: 'dashed', color: '#ff4d4f' },
        itemStyle: { color: '#ff4d4f' },
        areaStyle: { color: 'rgba(255, 77, 79, 0.05)' }
      }
    ]
  }, true)
}

function resizeCharts() {
  overviewChart?.resize()
  pointChart?.resize()
}

function refreshCharts() {
  nextTick(() => {
    renderOverviewChart()
    renderPointChart()
    setTimeout(resizeCharts, 60)
  })
}

watch([pointRows, selectedPointRow, activeRange], refreshCharts, { immediate: true })
watch(monitoringData, refreshCharts)

onMounted(() => {
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  overviewChart?.dispose()
  pointChart?.dispose()
  overviewChart = null
  pointChart = null
})
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
}

.cpd-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.cpd-header-main {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.cpd-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.cpd-subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.cpd-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cpd-range-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.cpd-range-tab {
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.cpd-range-tab.active {
  background: rgba(22, 119, 255, 0.1);
  color: #1677ff;
  box-shadow: inset 0 0 0 1px rgba(22, 119, 255, 0.15);
}

.cpd-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: auto;
  padding: 12px 14px 14px;
}

.cpd-overview-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.cpd-overview-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 15px 16px;
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  box-shadow: var(--color-card-shadow);
}

.cpd-overview-card--primary {
  background: linear-gradient(135deg, rgba(255, 77, 79, 0.1), rgba(124, 58, 237, 0.08));
}

.cpd-overview-label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.cpd-overview-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.16;
  color: var(--color-text-primary);
}

.cpd-overview-value--text {
  font-size: 18px;
  line-height: 1.4;
}

.cpd-overview-sub {
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.cpd-main-grid,
.cpd-trend-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.3fr);
  gap: 12px;
}

.cpd-bottom-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
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
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(248, 250, 252, 0.8);
}

.cpd-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.cpd-panel-subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.cpd-panel-body {
  padding: 14px;
}

.cpd-map-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.cpd-map {
  position: relative;
  min-height: 290px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(22, 119, 255, 0.12);
  background: linear-gradient(180deg, rgba(240, 249, 255, 0.9), rgba(255, 255, 255, 0.98));
  overflow: hidden;
}

.cpd-map-structure {
  position: absolute;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.18), rgba(71, 85, 105, 0.18));
}

.cpd-map-structure--beam {
  top: 24%;
  left: 12%;
  right: 12%;
  height: 18px;
}

.cpd-map-structure--brace-left {
  top: 24%;
  left: 18%;
  width: 14px;
  height: 52%;
}

.cpd-map-structure--brace-right {
  top: 24%;
  right: 18%;
  width: 14px;
  height: 52%;
}

.cpd-map-structure--carriage {
  top: 44%;
  left: 32%;
  right: 26%;
  height: 16px;
}

.cpd-map-node {
  position: absolute;
  width: 34px;
  height: 34px;
  margin: -17px 0 0 -17px;
  border: none;
  border-radius: 50%;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.cpd-map-node:hover,
.cpd-map-node.active {
  transform: scale(1.08);
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.18);
}

.cpd-map-node--normal {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.cpd-map-node--attention {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.cpd-map-node--warning {
  background: linear-gradient(135deg, #fb923c, #f97316);
}

.cpd-map-node--alarm {
  background: linear-gradient(135deg, #ff4d4f, #e11d48);
}

.cpd-map-node-index {
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.cpd-map-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
}

.cpd-map-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.cpd-map-detail-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.cpd-map-detail-metrics,
.cpd-detail-grid,
.cpd-action-grid,
.cpd-reliability-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.cpd-map-detail-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.cpd-map-detail-text,
.cpd-explain-lead {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.cpd-table-wrap {
  height: 330px;
  padding: 0 12px 12px;
}

.cpd-summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.cpd-summary-chip,
.cpd-metric-card,
.cpd-stage-summary-card,
.cpd-reliability-card,
.cpd-action-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 12px 13px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-subtle);
}

.cpd-summary-chip {
  min-width: 120px;
}

.cpd-summary-chip-label,
.cpd-metric-label,
.cpd-stage-summary-label,
.cpd-reliability-label,
.cpd-action-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.cpd-summary-chip-value,
.cpd-metric-value,
.cpd-stage-summary-value,
.cpd-reliability-value,
.cpd-action-value {
  font-size: 17px;
  line-height: 1.4;
  font-weight: 700;
  color: var(--color-text-primary);
}

.cpd-metric-value--text {
  font-size: 14px;
}

.cpd-chart {
  min-height: 300px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.82), rgba(255, 255, 255, 0.98));
}

.cpd-chart--large {
  min-height: 320px;
}

.cpd-stage-track {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.cpd-stage-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: var(--radius-sm);
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.92);
}

.cpd-stage-item.is-current {
  border-color: rgba(22, 119, 255, 0.28);
  background: rgba(22, 119, 255, 0.06);
}

.cpd-stage-item.is-future {
  border-color: rgba(255, 77, 79, 0.28);
  background: rgba(255, 77, 79, 0.06);
}

.cpd-stage-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #cbd5e1;
}

.cpd-stage-item.is-current .cpd-stage-dot {
  background: #1677ff;
}

.cpd-stage-item.is-future .cpd-stage-dot {
  background: #ff4d4f;
}

.cpd-stage-label {
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.cpd-stage-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.cpd-explain-body,
.cpd-action-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cpd-explain-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cpd-explain-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.cpd-explain-dot {
  width: 8px;
  height: 8px;
  margin-top: 8px;
  border-radius: 50%;
  background: #1677ff;
  flex-shrink: 0;
}

.cpd-explain-dot--danger {
  background: #ff4d4f;
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
  --el-table-row-hover-bg-color: rgba(22, 119, 255, 0.05);
}

:deep(.el-table th.el-table__cell .cell),
:deep(.el-table .el-table__body .cell) {
  font-size: 13px;
}

:deep(.cpd-table-row--active td.el-table__cell) {
  background: rgba(22, 119, 255, 0.08);
}

@media (max-width: 1520px) {
  .cpd-overview-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .cpd-bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1280px) {
  .cpd-main-grid,
  .cpd-trend-grid,
  .cpd-overview-grid,
  .cpd-detail-grid,
  .cpd-action-grid,
  .cpd-reliability-grid,
  .cpd-map-detail-metrics,
  .cpd-stage-track,
  .cpd-stage-summary {
    grid-template-columns: 1fr;
  }

  .cpd-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .cpd-header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
