<template>
  <div class="rmd-drawer">
    <div class="rmd-shell">
      <!-- Top bar -->
      <div class="rmd-top-bar">
        <div class="rmd-top-left">
          <el-icon class="rmd-top-icon"><Aim /></el-icon>
          <span class="rmd-top-title">风险定量监测</span>
        </div>
        <div class="rmd-actions">
          <el-tag type="primary" effect="plain" round>评估日期 {{ assessDate }}</el-tag>
          <el-button size="small" circle @click="emit('close')">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <div v-if="device" class="rmd-body">
        <!-- Status bar -->
        <div class="rmd-status-bar">
          <div class="rmd-status-item">
            <div class="rmd-status-icon" style="background: var(--color-info-bg); color: var(--color-info);">
              <el-icon><Location /></el-icon>
            </div>
            <div class="rmd-status-text">
              <span class="rmd-status-label">所在位置</span>
              <span class="rmd-status-value">{{ displayLocationName(device.location) }}</span>
            </div>
          </div>
          <div class="rmd-status-divider"></div>
          <div class="rmd-status-item">
            <div class="rmd-status-icon" :style="{ background: statusMeta.bg, color: statusMeta.color }">
              <el-icon><SwitchButton /></el-icon>
            </div>
            <div class="rmd-status-text">
              <span class="rmd-status-label">工作状态</span>
              <span class="rmd-status-value">
                <span class="rmd-status-dot" :style="{ background: statusMeta.color }"></span>
                {{ statusMeta.text }}
              </span>
            </div>
          </div>
          <div class="rmd-status-divider"></div>
          <div class="rmd-status-item">
            <div class="rmd-status-icon" style="background: var(--color-info-bg); color: var(--color-info);">
              <el-icon><Odometer /></el-icon>
            </div>
            <div class="rmd-status-text">
              <span class="rmd-status-label">实时振动</span>
              <span class="rmd-status-value">{{ vibration.toFixed(2) }} <em class="rmd-unit">mm/s</em></span>
            </div>
          </div>
          <div class="rmd-status-update">
            <el-icon><Refresh /></el-icon>
            <span>数据更新：刚刚</span>
          </div>
        </div>

        <!-- Risk matrix -->
        <div class="rmd-panel">
          <div class="rmd-panel-head">
            <div class="rmd-panel-title">
              <el-icon class="rmd-panel-icon"><DataAnalysis /></el-icon>
              <span>风险评估指标</span>
              <span class="rmd-count">共 {{ assessment.indicators.length }} 项</span>
            </div>
            <div class="rmd-legend">
              <span v-for="g in 4" :key="g" class="rmd-legend-item">
                <span class="rmd-legend-dot" :style="{ background: gradeColor(g) }"></span>{{ g }}级
              </span>
            </div>
          </div>

          <div class="rmd-matrix-wrap">
            <table class="rmd-matrix">
              <thead>
                <tr>
                  <th class="rmd-col-no">序号</th>
                  <th class="rmd-col-name">评估指标</th>
                  <th v-for="g in 4" :key="g" class="rmd-col-grade">
                    <span class="rmd-legend-dot" :style="{ background: gradeColor(g) }"></span>{{ g }}级
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ind in assessment.indicators" :key="ind.id">
                  <td class="rmd-col-no"><span class="rmd-no-badge">{{ ind.id }}</span></td>
                  <td class="rmd-col-name">{{ ind.name }}</td>
                  <td v-for="opt in ind.options" :key="opt.grade" class="rmd-col-grade">
                    <div
                      class="rmd-cell"
                      :class="{ 'is-active': opt.grade === ind.grade }"
                      :style="opt.grade === ind.grade ? activeCellStyle(opt.grade) : undefined"
                    >
                      <span>{{ opt.description }}</span>
                      <span v-if="opt.grade === ind.grade" class="rmd-cell-dot" :style="{ background: gradeColor(opt.grade) }"></span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Summary bar -->
        <div class="rmd-summary">
          <div class="rmd-summary-item">
            <span class="rmd-summary-label">综合评分</span>
            <span class="rmd-summary-score" :style="{ color: levelColor }">{{ assessment.comprehensiveScore }}</span>
            <span class="rmd-summary-range">/ 60</span>
          </div>
          <div class="rmd-summary-divider"></div>
          <div class="rmd-summary-item">
            <span class="rmd-summary-label">风险等级</span>
            <span class="rmd-level-badge" :style="{ color: levelColor, background: levelBg, borderColor: levelColor }">
              {{ assessment.riskLevel }}
            </span>
          </div>
          <div class="rmd-summary-note">综合评分为 15 项指标命中等级之和，分值越高风险越大</div>
        </div>
      </div>

      <div v-else class="rmd-empty">
        <el-empty description="请先选择设备以查看风险定量监测" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Close, Aim, Location, SwitchButton, Odometer, Refresh, DataAnalysis } from '@element-plus/icons-vue'
import { getDeviceRiskAssessment, getDeviceVibration } from '@/mock/riskAssessment'
import type { Device } from '@/mock'
import { displayLocationName } from '@/utils/displayNames'

const props = defineProps<{
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const assessDate = '2026-06-05'

const assessment = computed(() =>
  props.device
    ? getDeviceRiskAssessment(props.device)
    : { deviceId: '', indicators: [], comprehensiveScore: 0, riskLevel: '低风险' as const }
)

const vibration = computed(() => (props.device ? getDeviceVibration(props.device) : 0))

const statusMeta = computed(() => {
  switch (props.device?.status) {
    case 'running':     return { text: '运行中', color: 'var(--color-success)', bg: 'var(--color-success-bg)' }
    case 'standby':     return { text: '待机',   color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' }
    case 'maintenance': return { text: '维保中', color: 'var(--color-info)',    bg: 'var(--color-info-bg)' }
    default:            return { text: '停机',   color: 'var(--color-standby)', bg: 'var(--color-standby-bg)' }
  }
})

const GRADE_COLORS: Record<number, { color: string; bg: string }> = {
  1: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  2: { color: 'var(--color-info)',    bg: 'var(--color-info-bg)' },
  3: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  4: { color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)' }
}

function gradeColor(g: number) {
  return GRADE_COLORS[g]?.color ?? 'var(--color-text-muted)'
}

function activeCellStyle(g: number) {
  const c = GRADE_COLORS[g]
  return { color: c.color, background: c.bg, borderColor: c.color }
}

const LEVEL_COLORS: Record<string, { color: string; bg: string }> = {
  低风险:   { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  一般风险: { color: 'var(--color-info)',    bg: 'var(--color-info-bg)' },
  较大风险: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  重大风险: { color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)' }
}

const levelColor = computed(() => LEVEL_COLORS[assessment.value.riskLevel]?.color ?? 'var(--color-text-primary)')
const levelBg    = computed(() => LEVEL_COLORS[assessment.value.riskLevel]?.bg ?? 'var(--color-border-light)')
</script>

<style scoped>
.rmd-drawer {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.rmd-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.rmd-top-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 12px;
  background: rgba(248, 250, 252, 0.88);
  border-bottom: 1px solid var(--color-border-light);
}

.rmd-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rmd-top-icon {
  color: var(--color-primary);
  font-size: 18px;
}

.rmd-top-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.rmd-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rmd-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  overflow: auto;
}

/* ── Status bar ── */
.rmd-status-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 12px 18px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
}

.rmd-status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rmd-status-icon {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.rmd-status-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rmd-status-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.rmd-status-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.rmd-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.rmd-unit {
  font-size: 12px;
  font-weight: 400;
  font-style: normal;
  color: var(--color-text-muted);
}

.rmd-status-divider {
  width: 1px;
  height: 28px;
  background: var(--color-border-light);
}

.rmd-status-update {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ── Matrix panel ── */
.rmd-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  overflow: hidden;
}

.rmd-panel-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid var(--color-border-light);
}

.rmd-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.rmd-panel-icon {
  color: var(--color-primary);
  font-size: 17px;
}

.rmd-count {
  margin-left: 4px;
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-radius: 10px;
}

.rmd-legend {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rmd-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.rmd-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.rmd-matrix-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 14px 14px;
}

.rmd-matrix {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 6px;
  font-size: 13px;
}

.rmd-matrix thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-card-bg);
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: left;
}

.rmd-matrix thead .rmd-col-grade {
  text-align: center;
}

.rmd-col-no {
  width: 56px;
  text-align: center;
}

.rmd-col-name {
  width: 200px;
  color: var(--color-text-primary);
  font-weight: 600;
}

.rmd-col-grade {
  width: 22%;
  padding: 0 5px;
}

.rmd-matrix tbody td {
  vertical-align: middle;
}

.rmd-matrix thead .rmd-col-grade .rmd-legend-dot {
  margin-right: 4px;
}

.rmd-no-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
}

.rmd-cell {
  position: relative;
  min-height: 42px;
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-border-light);
  color: var(--color-text-muted);
  line-height: 1.4;
  transition: all 0.15s;
}

.rmd-cell.is-active {
  font-weight: 600;
}

.rmd-cell-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

/* ── Summary bar ── */
.rmd-summary {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
}

.rmd-summary-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.rmd-summary-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.rmd-summary-score {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}

.rmd-summary-range {
  font-size: 13px;
  color: var(--color-text-muted);
}

.rmd-summary-divider {
  width: 1px;
  height: 26px;
  background: var(--color-border-light);
}

.rmd-level-badge {
  padding: 3px 14px;
  font-size: 14px;
  font-weight: 700;
  border: 1px solid;
  border-radius: 14px;
}

.rmd-summary-note {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-muted);
}

.rmd-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
