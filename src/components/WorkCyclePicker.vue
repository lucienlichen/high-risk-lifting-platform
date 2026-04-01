<template>
  <div class="wcp-root">

    <!-- ① 工作日期（标题在左，日期值在右） -->
      <div class="wcp-block wcp-block--date">
        <span class="wcp-block-label">工作日期</span>
        <span class="wcp-date-value">{{ formattedDate }}</span>
      </div>

      <!-- ② 工作循环列表（标题在左，表头+列表在右） -->
      <div class="wcp-block wcp-block--cycles">
      <span class="wcp-block-label wcp-block-label--side">工作循环</span>
      <div class="wcp-cycles-content">
        <!-- 表头 -->
        <div class="wcp-cycle-header">
          <span class="wcp-cr-seq">循环次数</span>
          <span class="wcp-cr-time">开始时间</span>
          <span class="wcp-cr-time">停止时间</span>
          <span class="wcp-cr-field">工作时长</span>
          <span class="wcp-cr-field">吊重重量</span>
        </div>
        <!-- 数据行 -->
        <div class="wcp-cycle-list">
          <div
            v-for="c in cycles"
            :key="c.id"
            class="wcp-cycle-row"
            :class="{ 'wcp-cycle-row--active': modelValue === c.id }"
            @click="emit('update:modelValue', c.id)"
          >
            <span class="wcp-cr-seq">{{ c.seq }} 次</span>
            <span class="wcp-cr-time">{{ timeOf(c.startTime) }}</span>
            <span class="wcp-cr-time">{{ timeOf(c.stopTime) }}</span>
            <span class="wcp-cr-field">{{ c.liftDuration }} min</span>
            <span class="wcp-cr-field">{{ c.loadWeight }} t</span>
          </div>
        </div>
        </div>
      </div>

      <!-- ③ 历史数据（点击弹出日历，按颜色区分工作状态） -->
      <div class="wcp-block wcp-block--history">
      <el-popover
        v-model:visible="calendarVisible"
        placement="bottom-end"
        :width="360"
        trigger="click"
        popper-class="wcp-cal-popper"
        @show="onCalendarShow"
      >
        <template #reference>
          <div class="wcp-history-btn" :class="{ 'wcp-history-btn--active': calendarVisible }">
            <el-icon><Calendar /></el-icon>
            <span>历史数据</span>
          </div>
        </template>
        <!-- 日历面板 -->
        <div class="wcp-cal-wrap">
          <el-calendar v-model="calendarInnerDate">
            <template #date-cell="{ data }">
              <div
                class="wcp-cal-cell"
                :class="{
                  'wcp-cal-cell--other': data.type !== 'current-month',
                  'wcp-cal-cell--worked': isPastDay(data.day) && hasWorked(data.day),
                  'wcp-cal-cell--idle': isPastDay(data.day) && !hasWorked(data.day),
                  'wcp-cal-cell--working': isToday(data.day) && hasWorked(data.day),
                  'wcp-cal-cell--today': isToday(data.day),
                  'wcp-cal-cell--selected': isSelectedDate(data.day),
                }"
                @click.stop="selectDate(data.day)"
              >
                <span class="wcp-cal-num">{{ dayNum(data.day) }}</span>
                <span v-if="isToday(data.day) && hasWorked(data.day)" class="wcp-cal-dot" />
              </div>
            </template>
          </el-calendar>
        </div>
      </el-popover>
    </div>

      <!-- ④ 累计统计 -->
      <div class="wcp-block wcp-block--stat">
        <span class="wcp-block-label">累计循环次数</span>
      <span class="wcp-stat-value">{{ latestCumCycles }}<em> 次</em></span>
    </div>

    <div class="wcp-block wcp-block--stat">
        <span class="wcp-block-label">累计工作时间</span>
        <span class="wcp-stat-value">{{ latestCumHours }}<em> h</em></span>
      </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Calendar } from '@element-plus/icons-vue'
import { getWorkCycles } from '@/mock'
import type { WorkCycle } from '@/mock'

const props = defineProps<{
  modelValue: string     // 'all' | WorkCycle.id
  cycles: WorkCycle[]
  date: Date
  deviceId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
  (e: 'update:date', date: Date): void
}>()

// ── 日历状态 ──────────────────────────────────────
const calendarVisible = ref(false)
const calendarInnerDate = ref(new Date(props.date))
const monthWorkDays = ref<Record<string, boolean>>({})
let lastComputedKey = ''

watch(() => props.date, (d) => {
  calendarInnerDate.value = new Date(d)
})

// 月份变化时补充计算历史工作状态
watch(calendarInnerDate, (d) => {
  const key = `${d.getFullYear()}-${d.getMonth()}`
  if (key !== lastComputedKey) {
    lastComputedKey = key
    computeRangeWorkdays(d)
  }
})

/** 计算以 center 为中心前后各一个月的工作状态 */
function computeRangeWorkdays(center: Date) {
  const workedDays: Record<string, boolean> = {}
  for (let offset = -1; offset <= 1; offset++) {
    const base = new Date(center.getFullYear(), center.getMonth() + offset, 1)
    const year = base.getFullYear()
    const month = base.getMonth()
    const days = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d)
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      workedDays[key] = getWorkCycles(props.deviceId, date).length > 0
    }
  }
  monthWorkDays.value = { ...monthWorkDays.value, ...workedDays }
}

function onCalendarShow() {
  computeRangeWorkdays(calendarInnerDate.value)
}

function selectDate(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  emit('update:date', new Date(y, m - 1, d))
  calendarVisible.value = false
}

// ── 工具函数 ──────────────────────────────────────
const formattedDate = computed(() => {
  const d = props.date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function timeOf(dt: string) {
  return dt.split(' ').pop() ?? dt
}

function dayNum(day: string) {
  return parseInt(day.split('-')[2], 10)
}

function isToday(day: string) {
  const t = new Date()
  return day === `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

function isSelectedDate(day: string) {
  return day === formattedDate.value
}

function hasWorked(day: string) {
  return !!monthWorkDays.value[day]
}

function isPastDay(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

const latestCumCycles = computed(() =>
  props.cycles.length > 0 ? props.cycles[0].totalCycles : '—'
)
const latestCumHours = computed(() =>
  props.cycles.length > 0 ? props.cycles[0].totalWorkHours : '—'
)
</script>

<style scoped>
/* ── 根容器：横向分栏 ── */
.wcp-root {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 0;
}

/* ── 竖线分隔 ── */
.wcp-vline {
  width: 1px;
  background: var(--color-border-light);
  align-self: stretch;
  flex-shrink: 0;
  margin: 6px 0;
}

/* ── 通用 block ── */
.wcp-block {
  display: flex;
  align-items: center;
  padding: 4px 16px;
}

.wcp-block-label {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  line-height: 1;
}

/* 左侧竖向标题：自身垂直居中 */
.wcp-block-label--side {
  align-self: center;
  margin-right: 10px;
  flex-shrink: 0;
}

/* ── ① 工作日期（横排：标题在左，日期值在右） ── */
.wcp-block--date {
  flex-direction: row;
  gap: 10px;
  flex-shrink: 0;
}

.wcp-date-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
  letter-spacing: 0.5px;
}

/* ── ② 工作循环列表（横排：标题在左，内容区撑满） ── */
.wcp-block--cycles {
  flex: 1;
  flex-direction: row;
  min-width: 0;
  overflow: hidden;
  align-items: center;
}

/* 表头+列表的容器，撑满剩余宽度 */
.wcp-cycles-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

/* 表头行 */
.wcp-cycle-header {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr 1fr 1fr;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  width: 100%;
  height: 26px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid var(--color-border-light);
}

.wcp-cycle-header .wcp-cr-seq,
.wcp-cycle-header .wcp-cr-time,
.wcp-cycle-header .wcp-cr-field {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.wcp-cycle-list {
  max-height: 56px; /* 精确 2 行（每行 28px） */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.wcp-cycle-list::-webkit-scrollbar {
  width: 4px;
}

.wcp-cycle-list::-webkit-scrollbar-track {
  background: transparent;
}

.wcp-cycle-list::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
  border-radius: 2px;
}

.wcp-cycle-row {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr 1fr 1fr;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  width: 100%;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.12s;
  height: 28px;
  flex-shrink: 0;
}

.wcp-cycle-row:hover {
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
}

.wcp-cycle-row--active {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.wcp-cycle-row--active .wcp-cr-seq {
  color: var(--color-primary);
}

.wcp-cr-seq {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  white-space: nowrap;
  min-width: 0;
}

.wcp-cr-time {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  min-width: 0;
}

.wcp-cr-field {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  min-width: 0;
}

.wcp-cr-field em {
  font-style: normal;
  color: var(--color-text-muted);
}

/* ── ③ 历史数据 ── */
.wcp-block--history {
  flex-shrink: 0;
  align-items: center;
  padding: 4px 20px;
}

.wcp-history-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 12px;
  border: 1px solid var(--color-border-light);
  transition: all 0.15s;
  white-space: nowrap;
  user-select: none;
}

.wcp-history-btn .el-icon {
  font-size: 16px;
}

.wcp-history-btn:hover,
.wcp-history-btn--active {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
}

/* ── ④ 统计（横排：标题在左，数值在右） ── */
.wcp-block--stat {
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
}

.wcp-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.wcp-stat-value em {
  font-style: normal;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-muted);
  margin-left: 2px;
}

/* ── 日历面板容器 ── */
.wcp-cal-wrap {
  padding: 0;
}
</style>

<!-- 全局：覆盖 el-calendar 默认样式，使其在 popover 中紧凑显示 -->
<style>
.wcp-cal-popper {
  padding: 0 !important;
}

.wcp-cal-popper .el-calendar {
  --el-calendar-border: none;
  border: none;
}

.wcp-cal-popper .el-calendar__header {
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.wcp-cal-popper .el-calendar__body {
  padding: 6px 8px 8px;
}

.wcp-cal-popper .el-calendar-table thead th {
  font-size: 11px;
  padding: 4px 0;
  color: var(--el-text-color-secondary);
}

.wcp-cal-popper .el-calendar-table td {
  border: none !important;
}

.wcp-cal-popper .el-calendar-table td.is-selected .el-calendar-day,
.wcp-cal-popper .el-calendar-table td .el-calendar-day {
  padding: 0;
  height: auto;
}

/* 自定义日期格 */
.wcp-cal-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s, box-shadow 0.12s;
}

.wcp-cal-cell:hover {
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.wcp-cal-cell--other .wcp-cal-num {
  color: var(--el-text-color-placeholder);
}

.wcp-cal-cell--worked {
  background: color-mix(in srgb, #22c55e 20%, white);
}

.wcp-cal-cell--worked:hover {
  background: color-mix(in srgb, #22c55e 28%, white);
}

.wcp-cal-cell--idle {
  background: color-mix(in srgb, #94a3b8 24%, white);
}

.wcp-cal-cell--idle:hover {
  background: color-mix(in srgb, #94a3b8 34%, white);
}

.wcp-cal-cell--working {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #16a34a 58%, white);
  background: color-mix(in srgb, #22c55e 34%, white);
}

.wcp-cal-cell--today .wcp-cal-num {
  color: var(--el-color-primary);
  font-weight: 700;
}

.wcp-cal-cell--selected {
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.wcp-cal-cell--selected.wcp-cal-cell--worked {
  background: color-mix(in srgb, var(--el-color-primary) 10%, #22c55e 24%);
}

.wcp-cal-cell--selected.wcp-cal-cell--idle {
  background: color-mix(in srgb, var(--el-color-primary) 8%, #94a3b8 28%);
}

.wcp-cal-cell--selected.wcp-cal-cell--working {
  background: color-mix(in srgb, var(--el-color-primary) 8%, #22c55e 38%);
}

.wcp-cal-cell--selected .wcp-cal-num {
  color: var(--el-color-primary);
  font-weight: 700;
}

.wcp-cal-num {
  font-size: 13px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.wcp-cal-dot {
  position: absolute;
  bottom: 5px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
  box-shadow: 0 0 0 2px color-mix(in srgb, #22c55e 28%, white);
}
</style>
