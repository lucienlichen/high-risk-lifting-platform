<template>
  <div class="device-view-root parts-workspace">
    <DeviceStrip v-if="card" :code="card.code" :type="card.type || '—'" :tone="tone" :status-label="statusLabels[tone]" back-label="返回部件模型" @back="back">
      <span class="crumb-struct">{{ column?.name }} / <strong>{{ title }}</strong><span v-if="aggregate" class="agg-badge">· 聚合</span></span>
    </DeviceStrip>
    <div v-if="card && groups.length" class="point-body">
      <div class="point-tri">
        <aside class="panel panel-points">
          <div class="panel-h"><h3>测点列表</h3><span class="muted">{{ points.length }} 个{{ aggregate ? ' · 分组' : '' }}</span></div>
          <ul class="point-list">
            <template v-for="group in groups" :key="group.name">
              <li v-if="aggregate" class="point-group-title">{{ group.name }}</li>
              <li v-for="point in group.points" :key="point.id">
                <button :ref="el => rememberRow(point.id, el)" type="button" class="point-item" :class="[`is-${point.status}`, { 'is-active': selectedId === point.id }]" :title="`${point.id} ${point.name} · ${point.unit}`" :aria-pressed="selectedId === point.id" @click="selectPoint(point.id)"><i class="pbar"></i><span class="pname">{{ point.id }} {{ point.name }}</span><span class="pval">{{ point.value }}</span><span class="pst">{{ statusLabels[point.status] }}</span></button>
              </li>
            </template>
          </ul>
        </aside>
        <section class="panel panel-twin">
          <div class="panel-h"><h3>{{ title }} · {{ aggregate ? '聚合 · 组高亮示意' : '结构示意' }}</h3><span class="muted">非真 3D · SVG 示意</span></div>
          <div class="twin-stage">
            <svg viewBox="0 0 640 320" class="twin-svg" role="img" :aria-label="`${title}结构测点示意`">
              <line x1="40" y1="250" x2="600" y2="250" class="schematic-rail" />
              <rect x="70" y="130" width="28" height="120" rx="2" class="schematic-leg"/><rect x="542" y="130" width="28" height="120" rx="2" class="schematic-leg"/>
              <rect x="90" y="122" width="460" height="40" rx="3" class="schematic-beam"/>
              <template v-for="(region, index) in highlightRegions" :key="index">
                <rect :x="region.x" :y="region.y" :width="region.w" :height="region.h" rx="4" class="highlight-region" :class="{ 'highlight-aggregate': aggregate && index === 0 }" :style="{ color: `var(--color-${region.tone})` }" />
              </template>
              <rect x="290" y="78" width="60" height="42" rx="3" class="schematic-trolley"/>
              <text x="320" y="104" text-anchor="middle" fill="currentColor" font-size="11">小车</text>
              <line x1="320" y1="120" x2="320" y2="210" class="schematic-rope"/>
              <path d="M308 210 h24 l-4 14 h-16 z" class="schematic-hook"/>
              <text x="320" y="40" text-anchor="middle" fill="currentColor" font-size="14" font-weight="700">{{ title }} · {{ aggregate ? '聚合高亮' : '高亮区' }}</text>
              <text x="320" y="292" text-anchor="middle" class="schematic-caption" font-size="11">起重机 · 侧视示意（模拟数据）</text>
              <g v-for="point in points" :key="point.id" class="twin-pt" tabindex="0" role="button" :aria-label="`${point.id} ${point.name}`" :aria-pressed="selectedId === point.id" :style="{ color: pointColor(point.status) }" @click="selectPoint(point.id, true)" @keydown.enter.prevent="selectPoint(point.id, true)" @keydown.space.prevent="selectPoint(point.id, true)">
                <circle :cx="point.twin.x" :cy="point.twin.y" :r="selectedId === point.id ? 8 : 6" fill="currentColor" class="point-circle"/>
                <circle v-if="selectedId === point.id" :cx="point.twin.x" :cy="point.twin.y" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/>
                <title>{{ point.id }} {{ point.name }}</title>
              </g>
            </svg>
          </div>
        </section>
        <aside class="panel panel-svc">
          <div class="panel-h"><h3>智能服务</h3><span class="muted">{{ aggregate ? '推送组内任一报警置顶' : '推送本结构报警置顶' }}</span></div>
          <div class="svc-list">
            <button v-for="service in services" :key="service.name" type="button" class="svc-card" :class="{ 'is-hot': service.hot }" :aria-label="`打开${service.name}`" @click="openService(service.name)">
              <span class="svc-head"><i class="sdot"></i><span>{{ service.name }}</span><span class="svc-tag">{{ service.hot ? aggregate ? '组内报警' : '推送报警' : '正常' }}</span><span class="chev">进入</span></span>
              <span class="svc-body">{{ service.conclusion }}</span>
            </button>
          </div>
        </aside>
      </div>
      <section class="panel panel-base">
        <div class="tabs" role="tablist" aria-label="部件数据"><button v-for="tab in tabs" :id="`tab-${tab.key}`" :key="tab.key" type="button" class="tab" :class="{ 'is-on': activeTab === tab.key }" role="tab" :aria-selected="activeTab === tab.key" :aria-controls="`pane-${tab.key}`" @click="activeTab = tab.key">{{ tab.label }}</button></div>
        <div v-if="seriesTab" :id="`pane-${activeTab}`" class="tab-pane" role="tabpanel" :aria-labelledby="`tab-${activeTab}`">
          <template v-if="selectedPoint && trend">
            <div class="point-chart" role="img" :aria-label="`${selectedPoint.id} ${selectedPoint.name}${activeTabLabel}近24小时模拟曲线`">
              <ServiceEChart :key="`${activeTab}-${selectedPoint.id}`" :option="chartOption" />
            </div>
            <div class="point-readings">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>采集时间</th>
                    <th>测点编号</th>
                    <th>测点名称</th>
                    <th>数值</th>
                    <th>单位</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in readingRows" :key="`${activeTab}-${row.time}`">
                    <td>{{ row.time }}</td>
                    <td>{{ selectedPoint.id }}</td>
                    <td>{{ selectedPoint.name }}</td>
                    <td>{{ row.value }}</td>
                    <td>{{ row.unit }}</td>
                    <td><span class="tag" :class="row.status">{{ statusLabels[row.status] }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <p v-else class="muted point-pick">请选择测点</p>
        </div>
        <div v-else :id="`pane-${activeTab}`" class="tab-pane" role="tabpanel" :aria-labelledby="`tab-${activeTab}`">
          <el-empty class="point-empty" description="暂无数据" :image-size="72" />
        </div>
      </section>
    </div>
    <el-empty v-else description="未找到该设备或部件"><el-button @click="back">返回部件模型</el-button></el-empty>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch, type ComponentPublicInstance } from 'vue'
import type { EChartsOption } from 'echarts'
import DeviceStrip from '@/components/DeviceStrip.vue'
import ServiceEChart from '@/components/ServiceEChart.vue'
import type { ServiceKey } from '@/components/serviceCatalog'
import { usePartsDevice } from '@/composables/usePartsDevice'
import { structureData, statusLabels, worstStatus, type PointStatus, type SmartService } from '@/mock/partsPoint'
import { buildPointTrend, formatTrendNumber, latestTrendRows, readingSuffix } from '@/mock/pointTrend'
import { useSceneStore } from '@/stores/scene'
const { card, columns, query, tone, router, route } = usePartsDevice()
const sceneStore = useSceneStore()
const SERVICE_BY_NAME: Record<string, ServiceKey> = {
  健康监测: 'healthMonitor',
  远程监测: 'remote',
  裂纹预测: 'crack',
  故障诊断: 'fault',
  安全评估: 'risk'
}
const aggregate = computed(() => route.query.mode === 'aggregate')
const title = computed(() => String(route.query.part || ''))
const column = computed(() => columns.value.find(c => c.name === route.query.specialty))
const groups = computed(() => {
  const col = column.value
  if (!col) return []
  const nodes = aggregate.value ? col.groups.find(g => g.name === title.value)?.nodes : col.groups.flatMap(g => g.nodes).filter(n => n.name === title.value)
  return (nodes || []).filter(n => n.status !== 'off').map(node => ({ name: node.name, ...structureData(node, col.name), points: structureData(node, col.name).points.map(p => ({ ...p, group: node.name })) }))
})
const points = computed(() => groups.value.flatMap(g => g.points))
const selectedId = ref('')
const selectedPoint = computed(() => points.value.find(p => p.id === selectedId.value))
const services = computed(() => {
  const merged = new Map<string, SmartService>()
  groups.value.forEach(g => g.services.forEach(service => {
    const prior = merged.get(service.name)
    if (!prior || service.hot) merged.set(service.name, { ...service, hot: service.hot || !!prior?.hot, conclusion: service.hot && aggregate.value ? `「${g.name}」${service.conclusion}${prior?.hot ? ' ' + prior.conclusion : ''}` : service.conclusion })
  }))
  return [...merged.values()].sort((a, b) => Number(b.hot) - Number(a.hot))
})
const activeTab = ref('health')
const tabs = [
  { key: 'health', label: '健康监测', series: true },
  { key: 'safety', label: '安全监控', series: true },
  { key: 'patrol', label: '日常点巡检数据', series: false },
  { key: 'repair', label: '损伤/故障维修数据', series: false },
  { key: 'inspect', label: '检验检测数据', series: false },
  { key: 'supervise', label: '设备监管基础数据', series: false },
  { key: 'supply', label: '设备制造供给数据', series: false },
  { key: 'risk', label: '风险定量监测数据', series: false }
]
const seriesTab = computed(() => tabs.find(tab => tab.key === activeTab.value)?.series === true)
const activeTabLabel = computed(() => tabs.find(tab => tab.key === activeTab.value)?.label || '')
const rank = (s: PointStatus) => s === 'alarm' ? 0 : s === 'warn' ? 1 : 2
const sortedPoints = computed(() => aggregate.value ? [...points.value].sort((a, b) => rank(a.status) - rank(b.status)) : points.value)
const collectedDate = new Date()
const trend = computed(() => selectedPoint.value && seriesTab.value ? buildPointTrend(selectedPoint.value, collectedDate, activeTab.value) : null)
const readingRows = computed(() => {
  const point = selectedPoint.value
  const series = trend.value
  if (!point || !series) return []
  const unit = readingSuffix(point.value) || point.unit
  return latestTrendRows(series, collectedDate, point.status).map(row => ({
    time: row.at.toLocaleString('sv-SE').slice(0, 16),
    value: formatTrendNumber(row.value),
    unit,
    status: row.status
  }))
})
const chartOption = computed<EChartsOption>(() => {
  const point = selectedPoint.value
  const series = trend.value
  if (!point || !series) return { series: [] }
  const stroke = token(STATUS_TOKEN[point.status], STATUS_FALLBACK[point.status])
  const suffix = readingSuffix(point.value)
  return {
    animationDuration: 420,
    title: {
      text: `${point.id} ${point.name} · 近 24h 模拟曲线`,
      left: 8,
      top: 4,
      textStyle: { fontSize: 12, fontWeight: 600, color: token('--color-text-secondary', '#475569') }
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: value => `${formatTrendNumber(Number(value))}${suffix ? ' ' + suffix : ''}`
    },
    grid: { left: 48, right: 16, top: 32, bottom: 24 },
    xAxis: {
      type: 'category',
      data: series.labels,
      boundaryGap: false,
      axisLabel: { fontSize: 10, color: token('--color-text-muted', '#94a3b8'), interval: 7 },
      axisLine: { lineStyle: { color: token('--color-border', '#e8edf3') } }
    },
    yAxis: {
      type: 'value',
      min: series.yMin,
      max: series.yMax,
      axisLabel: { fontSize: 10, color: token('--color-text-muted', '#94a3b8') },
      splitLine: { lineStyle: { color: '#e8eef5' } }
    },
    series: [{
      name: point.name,
      type: 'line',
      smooth: 0.25,
      symbol: 'none',
      data: series.values,
      lineStyle: { width: 2, color: stroke },
      areaStyle: { color: withAlpha(stroke, 0.16) },
      markLine: {
        symbol: 'none',
        silent: true,
        data: [
          { yAxis: series.warn, lineStyle: { type: 'dashed', color: token('--color-warning', '#fa8c16') }, label: { formatter: '异常阈值', position: 'insideStartTop', color: '#d46b08', fontSize: 10 } },
          { yAxis: series.alarm, lineStyle: { type: 'dashed', color: token('--color-danger', '#f5222d') }, label: { formatter: '报警阈值', position: 'insideEndTop', color: '#cf1322', fontSize: 10 } }
        ]
      }
    }]
  }
})
watch(groups, () => { selectedId.value = sortedPoints.value[0]?.id || ''; activeTab.value = 'health' }, { immediate: true })
const rows = new Map<string, Element>()
function rememberRow(id: string, el: Element | ComponentPublicInstance | null) { if (el instanceof Element) rows.set(id, el); else rows.delete(id) }
function selectPoint(id: string, scroll = false) { selectedId.value = id; if (scroll) rows.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }
function openService(name: string) {
  const key = SERVICE_BY_NAME[name]
  const id = String(route.params.id || '')
  if (!key || !id) return
  sceneStore.setService(key)
  sceneStore.setDevice(id, true)
  router.push({ path: `/device/${id}` })
}
function back() { router.push({ name: 'overviewParts', params: { id: route.params.id }, query: query.value }) }
const STATUS_TOKEN: Record<PointStatus, string> = { alarm: '--color-danger', warn: '--color-warning', ok: '--color-success', twin: '--color-primary', off: '--color-text-muted' }
const STATUS_FALLBACK: Record<PointStatus, string> = { alarm: '#f5222d', warn: '#fa8c16', ok: '#52c41a', twin: '#1677ff', off: '#94a3b8' }
function token(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}
function withAlpha(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) return hex
  return `rgba(${r},${g},${b},${alpha})`
}
function pointColor(status: PointStatus) { return `var(--color-${({ alarm: 'danger', warn: 'warning', ok: 'success', twin: 'primary', off: 'text-muted' })[status]})` }
const highlightRegions = computed(() => {
  if (aggregate.value) return [{ x: 60, y: 105, w: 520, h: 150, tone: 'primary' }, ...groups.value.flatMap(g => g.highlight === 'endbeam' ? [regionFor(g.highlight, worstStatus(g.points)), { ...regionFor(g.highlight, worstStatus(g.points)), x: 536 }] : [regionFor(g.highlight, worstStatus(g.points))])]
  const group = groups.value[0]
  const region = regionFor(group?.highlight || 'girder', worstStatus(group?.points || []))
  return group?.highlight === 'endbeam' ? [region, { ...region, x: 536 }] : [region]
})
function regionFor(mode: string, status: PointStatus) {
  const map: Record<string, { x: number; y: number; w: number; h: number }> = { girder: { x: 90, y: 118, w: 460, h: 48 }, joint: { x: 270, y: 118, w: 100, h: 48 }, hoist: { x: 280, y: 70, w: 80, h: 55 }, endbeam: { x: 68, y: 128, w: 36, h: 120 }, walkway: { x: 100, y: 100, w: 440, h: 18 } }
  return { ...(map[mode] || map.girder), tone: status === 'alarm' ? 'danger' : status === 'warn' ? 'warning' : 'success' }
}
</script>
<style scoped src="@/styles/parts-point.css"></style>
<style scoped>
.crumb-struct { font-size: 13px; color: var(--color-text-secondary); }
.schematic-rail { stroke: var(--color-text-muted); stroke-width: 6; }
.schematic-leg { fill: var(--color-header-bg2); stroke: var(--color-text-muted); }
.schematic-beam { fill: var(--color-primary); fill-opacity: .4; stroke: var(--color-text-muted); }
.schematic-trolley { fill: var(--color-primary); stroke: var(--color-primary-light); }
.schematic-rope { stroke: var(--color-primary-light); stroke-width: 2; stroke-dasharray: 4 3; }
.schematic-hook { fill: var(--color-warning); stroke: var(--color-text-white); }
.schematic-caption { fill: var(--color-text-muted); }
.highlight-region { fill: currentColor; fill-opacity: .2; stroke: currentColor; stroke-width: 2; }
.highlight-aggregate { stroke-dasharray: 6 4; }
.point-circle { stroke: var(--color-text-white); stroke-width: 2; }
.point-chart :deep(.svc-echart) { min-height: 0; height: 156px; }
.panel-base .tabs { overflow-x: auto; }
.panel-base .tab { flex: 0 0 auto; white-space: nowrap; padding: 0 12px; }
.point-readings {
  max-height: 320px;
  overflow: auto;
  border: 1px solid var(--parts-color-22);
  border-radius: 8px;
}
.point-readings .data-table th { position: sticky; top: 0; z-index: 1; }
.point-pick { margin: 8px 2px 12px; }
.point-empty { padding: 12px 0 20px; }
</style>
