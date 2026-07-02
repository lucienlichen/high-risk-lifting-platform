<template>
  <div class="sup-panel">
    <div class="sup-scroll">
      <!-- 概览卡 -->
      <div class="sup-cards">
        <div v-for="c in cards" :key="c.label" class="sup-card">
          <div class="sup-card-icon" :style="{ background: c.bg, color: c.color }">
            <el-icon :size="20"><component :is="c.icon" /></el-icon>
          </div>
          <div class="sup-card-body">
            <div class="sup-card-label">{{ c.label }}</div>
            <div class="sup-card-value" :style="{ color: c.color }">
              {{ c.value }}<span class="sup-card-unit">{{ c.unit }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 维度图表 -->
      <div class="sup-charts">
        <div class="sup-chart-card">
          <header class="sup-chart-head"><h4>按起重机类型分布</h4><span>共 {{ data.summary.total }} 台</span></header>
          <div class="sup-chart-body"><ServiceEChart :option="typeOption" /></div>
        </div>
        <div class="sup-chart-card">
          <header class="sup-chart-head"><h4>按工作级别分布</h4><span>GB/T 3811 工作级别（台）</span></header>
          <div class="sup-chart-body"><ServiceEChart :option="levelOption" /></div>
        </div>
        <div class="sup-chart-card sup-chart-wide">
          <header class="sup-chart-head"><h4>按投入时间分布</h4><span>按投用年份统计（台）</span></header>
          <div class="sup-chart-body"><ServiceEChart :option="yearOption" /></div>
        </div>
      </div>

      <!-- 在册设备列表 -->
      <div class="sup-list-card">
        <header class="sup-list-head">
          <h4>在册设备列表</h4>
          <span>共 {{ data.list.length }} 台 · 按投入时间倒序</span>
        </header>
        <el-table :data="data.list" size="small" style="width:100%" max-height="440">
          <el-table-column label="序号" width="64" type="index" />
          <el-table-column prop="code" label="设备编号" width="150">
            <template #default="{ row }"><span class="sup-code">{{ row.code }}</span></template>
          </el-table-column>
          <el-table-column prop="type" label="起重机类型" min-width="130" />
          <el-table-column label="投入时间" width="110">
            <template #default="{ row }">{{ row.year }} 年</template>
          </el-table-column>
          <el-table-column prop="level" label="工作级别" width="100" />
          <el-table-column prop="manufacturer" label="制造商" min-width="120" />
          <el-table-column label="使用状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" size="small" effect="light">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Box, CircleCheck, VideoPause, Delete, Timer } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import ServiceEChart from '@/components/ServiceEChart.vue'
import { getSupervisionFleet, type FleetStatus } from '@/mock'

defineEmits<{ (e: 'close'): void }>()

const data = computed(() => getSupervisionFleet())

const cards = computed(() => [
  { label: '在册设备', value: data.value.summary.total, unit: '台', icon: Box, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  { label: '在用', value: data.value.summary.inUse, unit: '台', icon: CircleCheck, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  { label: '停用', value: data.value.summary.paused, unit: '台', icon: VideoPause, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  { label: '报废', value: data.value.summary.scrapped, unit: '台', icon: Delete, color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
  { label: '平均役龄', value: data.value.summary.avgAge, unit: '年', icon: Timer, color: 'var(--color-text-primary)', bg: '#eef2f7' },
])

const statusTag = (s: FleetStatus) => (s === '在用' ? 'success' : s === '停用' ? 'warning' : 'danger')

const PALETTE = ['#2563EB', '#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6']
const catAxisX = (data: string[]): EChartsOption['xAxis'] => ({
  type: 'category', data, axisTick: { show: false },
  axisLine: { lineStyle: { color: '#E2E8F0' } },
  axisLabel: { fontSize: 10, color: '#94A3B8' },
})
const valAxisY = (): EChartsOption['yAxis'] => ({
  type: 'value', axisLabel: { fontSize: 10, color: '#94A3B8' },
  splitLine: { lineStyle: { color: '#F1F5F9' } },
})

const typeOption = computed<EChartsOption>(() => ({
  color: PALETTE,
  tooltip: { trigger: 'item', confine: true, textStyle: { fontSize: 11 }, formatter: '{b}：{c} 台（{d}%）' },
  legend: { type: 'scroll', bottom: 2, textStyle: { fontSize: 11, color: '#64748B' }, itemWidth: 12, itemHeight: 8 },
  series: [{
    type: 'pie', radius: ['40%', '66%'], center: ['50%', '44%'],
    itemStyle: { borderColor: '#fff', borderWidth: 2 },
    label: { fontSize: 11, color: '#475569', formatter: '{b}\n{c} 台' },
    data: data.value.byType,
  }],
}))

const levelOption = computed<EChartsOption>(() => ({
  grid: { left: 6, right: 14, top: 16, bottom: 6, containLabel: true },
  tooltip: { trigger: 'axis', confine: true, textStyle: { fontSize: 11 }, formatter: '工作级别 {b}：{c0} 台' },
  xAxis: catAxisX(data.value.byLevel.map((d) => d.name)),
  yAxis: valAxisY(),
  series: [{ type: 'bar', barMaxWidth: 30, data: data.value.byLevel.map((d) => d.value), itemStyle: { color: '#7C3AED', borderRadius: [3, 3, 0, 0] } }],
}))

const yearOption = computed<EChartsOption>(() => ({
  grid: { left: 6, right: 14, top: 16, bottom: 6, containLabel: true },
  tooltip: { trigger: 'axis', confine: true, textStyle: { fontSize: 11 }, formatter: '{b} 年：{c0} 台' },
  xAxis: catAxisX(data.value.byYear.map((d) => d.name)),
  yAxis: valAxisY(),
  series: [{ type: 'bar', barMaxWidth: 20, data: data.value.byYear.map((d) => d.value), itemStyle: { color: '#2563EB', borderRadius: [3, 3, 0, 0] } }],
}))
</script>

<style scoped>
.sup-panel { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; background: #f8fafc; }
.sup-scroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 16px; display: flex; flex-direction: column; gap: 16px; }

.sup-cards { flex-shrink: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 1000px) { .sup-cards { grid-template-columns: repeat(2, 1fr); } }
.sup-card { display: flex; align-items: center; gap: 12px; background: var(--color-card-bg); border: 1px solid var(--color-card-border); border-radius: var(--radius-md); box-shadow: var(--color-card-shadow); padding: 14px; }
.sup-card-icon { width: 40px; height: 40px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sup-card-label { font-size: 12px; color: var(--color-text-muted); }
.sup-card-value { font-size: 22px; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; }
.sup-card-unit { font-size: 12px; font-weight: 400; color: var(--color-text-muted); margin-left: 4px; }

.sup-charts { flex-shrink: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.sup-chart-wide { grid-column: 1 / -1; }
.sup-chart-card { background: var(--color-card-bg); border: 1px solid var(--color-card-border); border-radius: var(--radius-md); box-shadow: var(--color-card-shadow); overflow: hidden; display: flex; flex-direction: column; }
.sup-chart-head { height: 44px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border-light); }
.sup-chart-head h4 { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.sup-chart-head span { font-size: 11px; color: var(--color-text-muted); }
.sup-chart-body { height: 280px; padding: 8px; }

.sup-list-card { flex-shrink: 0; background: var(--color-card-bg); border: 1px solid var(--color-card-border); border-radius: var(--radius-md); box-shadow: var(--color-card-shadow); overflow: hidden; }
.sup-list-head { height: 44px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border-light); }
.sup-list-head h4 { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.sup-list-head span { font-size: 11px; color: var(--color-text-muted); }
.sup-code { font-family: monospace; font-weight: 600; color: var(--color-primary); }
</style>
