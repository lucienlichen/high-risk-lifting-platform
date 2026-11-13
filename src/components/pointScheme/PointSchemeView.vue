<template>
  <div class="ps-page" :data-scheme="scheme" :data-side="side">
    <header class="ps-info">
      <button type="button" class="ps-back" @click="$emit('back')">← 返回部件模型</button>
      <strong class="ps-dev">3G211-A2</strong>
      <span class="ps-path">{{ side === 'structure' ? '冶金桥式起重机 / 金属结构 / 桥架 / 单双主梁' : '冶金桥式起重机 / 起升机构 / 主起升机构 / 驱动装置' }}</span>
      <span class="ps-vbar"></span>
      <span class="ps-cur-label">当前点位</span>
      <strong class="ps-cur-name">{{ active.name }}</strong>
      <span class="ps-id">{{ active.id }}</span>
      <span class="ps-pill" :class="side === 'structure' ? 'ok' : active.status">{{ side === 'structure' ? '正常' : TONE_TEXT[active.status] }}</span>
      <span class="ps-kind-tag" :class="{ live: side === 'structure' && active.measured, twin: side === 'structure' && !active.measured }">{{ side === 'structure' ? (active.measured ? '实时监测点' : '数字孪生生成点') : (active.measured ? '实测点' : '孪生点') }}</span>
      <div class="ps-switch">
        <div class="ps-seg" role="tablist" aria-label="点位类型">
          <button type="button" :class="{ on: side === 'structure' }" @click="setSide('structure')">结构点位</button>
          <button type="button" :class="{ on: side === 'mechanism' }" @click="setSide('mechanism')">机构点位</button>
        </div>
        <span class="ps-time">数据更新 2026-11-07 15:30</span>
      </div>
    </header>

    <StructurePointPane v-if="side === 'structure'" :point-id="active.id" @select="selectPoint" />
    <div v-else class="ps-final">
      <div class="ps-final-left">
        <section class="ps-table-wrap">
          <div class="ps-table-hd">
            <div class="ps-table-hd-top">
              <strong>点位表</strong>
              <span class="ps-count">共 {{ points.length }} 个 · <em class="a">报警 {{ counts.alarm }}</em> · <em class="w">异常 {{ counts.warn }}</em></span>
            </div>
            <div class="ps-table-hd-bot">
              <input v-model="search" class="ps-search" type="search" placeholder="搜索名称或编号" aria-label="搜索名称或编号">
              <label class="ps-check"><input v-model="alarmOnly" type="checkbox"> 仅看报警/异常</label>
            </div>
          </div>
          <SchemeTable :rows="visiblePoints" :selected-id="active.id" name-label="名称" @select="selectPoint" />
        </section>
        <section class="ps-model-wrap">
          <div class="ps-tools">
            <strong>{{ side === 'structure' ? '结构模型' : '机构模型' }}</strong>
            <span class="ps-count">{{ side === 'structure' ? '单双主梁 · 立面示意' : '主起升机构 · 传动链示意' }}</span>
          </div>
          <SchemeModel :side="side" :points="points" :selected-id="active.id" :hidden-ids="hiddenIds" @select="selectPoint" />
          <p class="ps-cap">{{ side === 'structure' ? '上翼缘点位在梁上沿，下翼缘在下沿，腹板在中部；实心为实测点，空心为孪生点' : '电机 → 联轴器 → 减速器 → 卷筒 → 卷筒轴承座；实心为实测点' }}</p>
        </section>
      </div>
      <div class="ps-final-right">
        <section class="ps-panel">
          <div class="ps-dtabs" role="tablist" aria-label="监测数据">
            <button v-for="tab in finalTabs" :key="tab.key" type="button" :class="{ on: dataKey === tab.key, na: !tab.live }" @click="pickData(tab.key)">{{ tab.name }}</button>
          </div>
          <div class="ps-panel-bd">
            <MonitorBoard v-if="dataKey === 'health'" :side="side" :point="active" />
            <DataBody v-else :side="side" :point="active" :data-key="dataKey" :expanded="expanded" @toggle="expanded = !expanded" />
          </div>
        </section>
        <section class="ps-panel">
          <div class="ps-panel-bd">
            <ResultBoard :side="side" :point="active" />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SchemeChart from '@/components/pointScheme/SchemeChart.vue'
import SchemeModel from '@/components/pointScheme/SchemeModel.vue'
import SchemeTable from '@/components/pointScheme/SchemeTable.vue'
import StructurePointPane from '@/components/pointScheme/StructurePointPane.vue'
import {
  DATA_TABS, TONE_TEXT, WEIGHT_AXIS, WEIGHT_SERIES,
  cardOrder, conditionCards, cycleHead, cyclesFor, defaultPointId, healthStats,
  navKeys, pointsOf, serviceViews,
  type DataKey, type SchemeId, type SchemePoint, type Side, type SvcKey, type SvcView, type Tone
} from '@/mock/pointSchemeData'
import type { EChartsOption } from 'echarts'

defineEmits<{ back: [] }>()

const route = useRoute()
const router = useRouter()
const schemes: { id: SchemeId; name: string }[] = [
  { id: 1, name: '方案一' },
  { id: 2, name: '方案二' },
  { id: 3, name: '方案三' }
]

const scheme = ref<SchemeId>(1)
const side = ref<Side>('structure')
const selectedId = ref('ML-01')
const dataKey = ref<DataKey>('health')
const finalTabs: { key: DataKey; name: string; live: boolean }[] = [
  { key: 'health', name: '健康监测', live: true },
  { key: 'safety', name: '安全监控', live: true },
  { key: 'risk', name: '风险监测', live: false },
  { key: 'inspect', name: '检验检测', live: false },
  { key: 'patrol', name: '日常点巡检', live: false }
]
const svcKey = ref<SvcKey>('overview')
const showService = ref(false)
const expanded = ref(false)
const alarmOnly = ref(false)
const search = ref('')

const points = computed(() => pointsOf(side.value))
const active = computed(() => points.value.find(item => item.id === selectedId.value) || points.value[0])
const counts = computed(() => ({
  alarm: points.value.filter(item => item.status === 'alarm').length,
  warn: points.value.filter(item => item.status === 'warn').length
}))
const queryText = computed(() => search.value.trim().toLowerCase())
const matched = (point: SchemePoint) => {
  if (alarmOnly.value && point.status === 'ok') return false
  if (!queryText.value) return true
  return `${point.id}${point.name}`.toLowerCase().includes(queryText.value)
}
const visiblePoints = computed(() => points.value.filter(matched))
const hiddenIds = computed(() => points.value.filter(item => !matched(item)).map(item => item.id))
const views = computed(() => serviceViews(side.value, active.value))
const tones = computed(() => {
  const map = {} as Record<SvcKey, Tone>
  map.overview = views.value.some(item => item.tone === 'alarm') ? 'alarm' : views.value.some(item => item.tone === 'warn') ? 'warn' : 'ok'
  views.value.forEach(item => { map[item.key] = item.tone })
  return map
})

function readRoute() {
  const nextScheme = Number(route.query.scheme)
  scheme.value = nextScheme === 2 || nextScheme === 3 ? nextScheme : 1
  side.value = route.query.side === 'mechanism' ? 'mechanism' : 'structure'
  const id = typeof route.query.pid === 'string' ? route.query.pid : ''
  selectedId.value = points.value.some(item => item.id === id) ? id : defaultPointId(side.value)
}

function writeQuery() {
  const next = {
    ...route.query,
    scheme: String(scheme.value),
    side: side.value,
    pid: active.value.id
  }
  if (next.scheme === route.query.scheme && next.side === route.query.side && next.pid === route.query.pid) return
  router.replace({ query: next })
}

watch(() => [route.query.scheme, route.query.side, route.query.pid], () => {
  readRoute()
  const wantScheme = String(scheme.value)
  const wantId = active.value.id
  if (route.query.scheme === wantScheme && route.query.side === side.value && route.query.pid === wantId) return
  router.replace({ query: { ...route.query, scheme: wantScheme, side: side.value, pid: wantId } })
}, { immediate: true })

function setScheme(id: SchemeId) {
  scheme.value = id
  writeQuery()
}
function setSide(next: Side) {
  if (side.value === next) return
  side.value = next
  selectedId.value = defaultPointId(next)
  dataKey.value = 'health'
  svcKey.value = 'overview'
  showService.value = false
  expanded.value = false
  alarmOnly.value = false
  search.value = ''
  writeQuery()
}
function selectPoint(id: string) {
  selectedId.value = id
  writeQuery()
}
function pickData(key: DataKey) {
  dataKey.value = key
  showService.value = false
}
function pickService(key: SvcKey) {
  svcKey.value = key
  showService.value = true
}

function lineOption(values: number[], color: string, mark?: { value: number; name: string }): EChartsOption {
  return {
    animation: false,
    grid: { left: 28, right: 8, top: 16, bottom: 18 },
    xAxis: { type: 'category', data: values.map((_, index) => index + 1), axisLabel: { show: false }, axisTick: { show: false }, axisLine: { lineStyle: { color: '#e5eaf1' } } },
    yAxis: { type: 'value', axisLabel: { fontSize: 9, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#eef2f6' } } },
    series: [{
      type: 'line', data: values, smooth: 0.25, symbol: 'none', lineStyle: { width: 1.4, color },
      markLine: mark ? { symbol: 'none', data: [{ yAxis: mark.value, label: { formatter: mark.name, fontSize: 9, color: '#fa8c16' }, lineStyle: { type: 'dashed', color: '#fa8c16' } }] } : undefined
    }]
  }
}
function sparkOption(values: number[], color: string, fft = false): EChartsOption {
  return {
    animation: false,
    grid: { left: 1, right: 1, top: 4, bottom: 2 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: values.map((_, index) => index) },
    yAxis: { type: 'value', show: false, scale: true },
    series: [{
      type: 'line',
      data: values,
      smooth: fft ? false : 0.35,
      symbol: 'none',
      sampling: 'lttb',
      lineStyle: { width: 1.15, color },
      areaStyle: fft ? undefined : { color: 'rgba(22,119,255,0.06)' }
    }]
  }
}
function weightOption(): EChartsOption {
  return {
    animation: false,
    grid: { left: 32, right: 12, top: 16, bottom: 22 },
    xAxis: { type: 'category', data: WEIGHT_AXIS, axisLabel: { fontSize: 10, color: '#64748b', interval: 0 }, axisTick: { show: false }, axisLine: { lineStyle: { color: '#e5eaf1' } } },
    yAxis: { type: 'value', min: 0, max: 60, interval: 60, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#eef2f6' } } },
    series: [{
      type: 'line', data: WEIGHT_SERIES, smooth: 0.3, symbol: 'none', lineStyle: { width: 1.6, color: '#1677ff' },
      markLine: { symbol: 'none', data: [{ yAxis: 50, label: { formatter: '额定起重量 50 t', fontSize: 10, color: '#fa8c16' }, lineStyle: { type: 'dashed', color: '#fa8c16' } }] }
    }]
  }
}

function trendOption(values: number[], labels: string[], color: string, min: number, max: number, marks: { value: number; name: string; color: string }[] = []): EChartsOption {
  return {
    animation: false,
    grid: { left: 28, right: 6, top: 16, bottom: 18 },
    xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 10, color: '#94a3b8', interval: 0, hideOverlap: true }, axisTick: { show: false }, axisLine: { lineStyle: { color: '#e6edf5' } } },
    yAxis: {
      type: 'value',
      min,
      max,
      interval: max > min ? max - min : undefined,
      axisLabel: { fontSize: 11, color: '#6b7280', hideOverlap: true },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [{
      type: 'line', data: values, smooth: 0.25, symbol: 'none', lineStyle: { width: 1.4, color },
      markLine: marks.length ? {
        symbol: 'none',
        data: marks.map(mark => ({
          yAxis: mark.value,
          label: { formatter: mark.name, fontSize: 11, color: mark.color, position: 'insideEndTop', backgroundColor: 'rgba(255,255,255,0.92)', padding: [0, 3] },
          lineStyle: { type: 'dashed', color: mark.color, width: 1.5 }
        }))
      } : undefined
    }]
  }
}
type ToneKey = SchemePoint['status']
type Kpi = { label: string; value: string; unit: string; tone?: ToneKey }
const STRUCT_PROFILE = {
  ok: { s: 97.2, mx: 142.6, mn: 38.1, D: 0.42, lv: 0, y: 6.2, rn: '8.9×10⁵', ae: { st: 'ok' as ToneKey, rate: 3, amp: 42, en: '1.2×10³' }, ec: { amp: 0.12, ph: 12 } },
  warn: { s: 151.4, mx: 168.3, mn: 41.0, D: 0.74, lv: 2, y: 3.4, rn: '4.0×10⁵', ae: { st: 'ok' as ToneKey, rate: 5, amp: 47, en: '2.0×10³' }, ec: { amp: 0.15, ph: 14 } },
  alarm: { s: 186.4, mx: 198.3, mn: 41.2, D: 0.88, lv: 3, y: 1.6, rn: '1.8×10⁵', ae: { st: 'warn' as ToneKey, rate: 18, amp: 68, en: '9.6×10³' }, ec: { amp: 0.21, ph: 17 } }
}
const MECH_PROFILE = {
  ok: { rms: 2.8, pk: 1.9, ku: 3.1, vi: 2.6, stage: 0, life: 1860, ci: '1620–2050', bpfo: '0.08 g' },
  warn: { rms: 5.2, pk: 3.6, ku: 4.6, vi: 4.9, stage: 1, life: 410, ci: '320–520', bpfo: '0.41 g' },
  alarm: { rms: 5.2, pk: 3.6, ku: 4.6, vi: 4.9, stage: 1, life: 410, ci: '320–520', bpfo: '0.41 g' }
}
const LV_NAME = ['Ⅰ级 健康', 'Ⅱ级 亚健康', 'Ⅲ级 关注', 'Ⅳ级 高危预警', 'Ⅴ级 失效']
const LV_ACT = ['正常运行', '监测运行', '密切监测', '控载速修', '立即停机']
const STAGE = ['A 正常', 'B 早期', 'C 故障', 'D 失效']
const HOUR = ['14:30', '14:45', '15:00', '15:15', '15:30']

function rndSeries(count: number, seed: number, map: (index: number, random: number) => number) {
  let state = seed
  return Array.from({ length: count }, (_, index) => {
    state = (state * 9301 + 49297) % 233280
    return Math.round(map(index, state / 233280) * 100) / 100
  })
}
function xLabels(count: number, labels: string[]) {
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return labels[0]
    if (index === count - 1) return labels[labels.length - 1]
    const slot = Math.round(index / (count - 1) * (labels.length - 1))
    return index === Math.round(slot / (labels.length - 1) * (count - 1)) ? labels[slot] : ''
  })
}

const MonitorBoard = defineComponent({
  name: 'MonitorBoard',
  props: { side: { type: String as PropType<Side>, required: true }, point: { type: Object as PropType<SchemePoint>, required: true } },
  setup(props) {
    return () => {
      const point = props.point
      if (props.side === 'structure') {
        const data = STRUCT_PROFILE[point.status]
        const stress = rndSeries(48, 11 + point.status.length, (index, random) => (Math.sin(index / 5) > -0.1 ? data.s * 0.82 + random * data.s * 0.3 : data.mn + random * 8))
        const acoustic = rndSeries(36, 17, (index, random) => data.ae.amp * 0.6 + random * data.ae.amp * 0.45 + (data.ae.st === 'warn' ? index * 0.25 : 0))
        const eddy = rndSeries(28, 23, (_, random) => data.ec.amp * 0.8 + random * data.ec.amp * 0.4)
        return h('div', { class: 'ps-mon-grid cols-4' }, [
          monitor('应力光纤监测数据', point.status === 'ok' ? 'ok' : point.status, '光纤光栅应变 · 50 Hz', [
            { label: '实时应力', value: String(data.s), unit: 'MPa', tone: point.status === 'ok' ? undefined : point.status },
            { label: '今日最大', value: String(data.mx), unit: 'MPa' },
            { label: '今日最大应力幅', value: (data.mx - data.mn).toFixed(1), unit: 'MPa' },
            { label: '今日应力循环', value: '146', unit: '次' }
          ], '应力时程 · 近 1 小时', '单位 MPa', trendOption(stress, xLabels(stress.length, HOUR), '#1677ff', 0, 240, [
            { value: 190, name: '预警 190', color: '#b45309' },
            { value: 215, name: '报警 215', color: '#c62828' }
          ]), 2),
          monitor('声发射监测数据', data.ae.st, '声发射传感器', [
            { label: '撞击计数率', value: String(data.ae.rate), unit: '次/min', tone: data.ae.st === 'ok' ? undefined : data.ae.st },
            { label: '最大幅值', value: String(data.ae.amp), unit: 'dB' }
          ], '声发射幅值 · 近 24 小时', '单位 dB', trendOption(acoustic, xLabels(acoustic.length, ['昨日', '', '今日']), '#7c3aed', 0, 100, [
            { value: 60, name: '关注 60 dB', color: '#b45309' }
          ])),
          monitor('疲劳裂纹涡流监测数据', 'ok', '涡流传感器', [
            { label: '涡流信号幅值', value: String(data.ec.amp), unit: 'V' },
            { label: '相位', value: String(data.ec.ph), unit: '°' }
          ], '涡流幅值 · 近 7 天', '单位 V', trendOption(eddy, xLabels(eddy.length, ['11-01', '', '11-07']), '#0d9488', 0, 1, [
            { value: 0.5, name: '裂纹阈值 0.5 V', color: '#c62828' }
          ]))
        ])
      }
      const data = MECH_PROFILE[point.status]
      const vibration = rndSeries(48, 31, (index, random) => (Math.sin(index / 5) > -0.1 ? data.rms * 0.85 + random * data.rms * 0.35 : 0.3 + random * 0.3))
      const speed = rndSeries(48, 37, (index, random) => (Math.sin(index / 5) > -0.1 ? 975 + random * 20 : 0))
      return h('div', { class: 'ps-mon-grid cols-3' }, [
        monitor('振动监测数据', point.status, 'ICP 加速度传感器（径向）· 25.6 kHz', [
          { label: '振动有效值', value: String(data.rms), unit: 'mm/s', tone: point.status === 'ok' ? undefined : point.status },
          { label: '峰值加速度', value: String(data.pk), unit: 'g' },
          { label: '峭度', value: String(data.ku), unit: '', tone: point.status === 'ok' ? undefined : point.status }
        ], '振动有效值 · 近 1 小时', '单位 mm/s', trendOption(vibration, xLabels(vibration.length, HOUR), '#1677ff', 0, 9, [
          { value: 4.5, name: '预警 4.5', color: '#b45309' },
          { value: 7.1, name: '报警 7.1', color: '#c62828' }
        ]), 2),
        monitor('转速监测数据', 'ok', '电机编码器', [
          { label: '转速', value: '985', unit: 'r/min' },
          { label: '波动', value: '±1.2', unit: '%' }
        ], '转速 · 近 1 小时', '单位 r/min', trendOption(speed, xLabels(speed.length, ['14:30', '15:00', '15:30']), '#0f766e', 0, 1200, []))
      ])
    }
  }
})

function monitor(title: string, tone: ToneKey, sensor: string, stats: Kpi[], chart: string, unit: string, option: EChartsOption, span = 1) {
  return h('article', { class: ['ps-mon', tone === 'ok' ? '' : `is-${tone}`, span === 2 ? 'span-2' : ''] }, [
    h('header', [h('b', title), h('i', { class: ['ps-pill', tone] }, TONE_TEXT[tone]), h('span', sensor)]),
    h('div', { class: 'ps-mini-metrics' }, stats.map(item => h('div', { class: 'ps-mini' }, [
      h('span', item.label),
      h('div', [h('strong', { class: item.tone ? `is-${item.tone}` : '' }, item.value), item.unit ? h('em', item.unit) : null])
    ]))),
    h('div', { class: 'ps-chart-hd' }, [h('b', chart), h('span', unit)]),
    h('div', { class: 'ps-chart' }, [h(SchemeChart, { option })])
  ])
}

const ResultBoard = defineComponent({
  name: 'ResultBoard',
  props: { side: { type: String as PropType<Side>, required: true }, point: { type: Object as PropType<SchemePoint>, required: true } },
  setup(props) {
    return () => {
      const point = props.point
      if (props.side === 'structure') {
        const data = STRUCT_PROFILE[point.status]
        const damageTone: ToneKey = data.lv <= 1 ? 'ok' : data.lv === 2 ? 'warn' : 'alarm'
        const yearTone: ToneKey = data.y < 1 ? 'alarm' : data.y < 2 ? 'warn' : 'ok'
        const months = ['1月', '4月', '7月', '11月']
        const damage = rndSeries(11, 41, (index, random) => data.D - 0.09 + index * 0.009 + random * 0.002)
        const remain = rndSeries(11, 47, (index, random) => data.y + 0.9 - index * 0.09 - random * 0.02)
        const hits = rndSeries(14, 53, (index, random) => data.ae.rate * 0.7 + random * data.ae.rate * 0.4 + (data.ae.st === 'warn' ? index * 0.9 : 0))
        const eddy = rndSeries(14, 59, (_, random) => data.ec.amp * 0.85 + random * data.ec.amp * 0.3)
        return h('div', { class: 'ps-result-grid cols-4' }, [
          result('疲劳累积损伤评估', damageTone, `D = ${data.D}`, `${LV_NAME[data.lv]} · 处置：${LV_ACT[data.lv]}`, [
            ['已发生循环', '6.4×10⁵ 次'],
            ['结果时间', '11-06 09:18']
          ], grades(['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'], data.lv, ['#16a34a', '#65a30d', '#d97706', '#ea580c', '#dc2626']), '累积损伤度 D · 今年', trendOption(damage, xLabels(damage.length, months), '#7c3aed', 0, 1, [{ value: 0.7, name: 'Ⅲ级', color: '#b45309' }]), '应力光纤监测数据'),
          result('裂纹预测', yearTone, `${data.y} 年`, '预计裂纹萌生前的剩余寿命', [
            ['剩余损伤度', (1 - data.D).toFixed(2)],
            ['剩余循环', `${data.rn} 次`]
          ], grades(['≥2 年', '1–2 年', '<1 年'], data.y < 1 ? 2 : data.y < 2 ? 1 : 0, ['#16a34a', '#ea580c', '#dc2626']), '剩余年限 · 今年', trendOption(remain, xLabels(remain.length, months), '#0d9488', 0, 8, []), '应力光纤监测数据'),
          result('疲劳损伤程度诊断', data.ae.st, data.ae.st === 'ok' ? '未见加速演化' : '损伤演化加速', data.ae.st === 'ok' ? '声发射活动平稳，损伤处于稳定累积阶段' : '撞击计数率近两周持续上升，建议缩短巡检周期', [
            ['撞击计数率', `${data.ae.rate} 次/min`],
            ['累计能量', `${data.ae.en} mV·μs`]
          ], null, '日撞击计数率 · 近 14 天', trendOption(hits, xLabels(hits.length, ['10-25', '11-01', '11-07']), '#7c3aed', 0, 30, [{ value: 12, name: '关注', color: '#b45309' }]), '声发射监测数据'),
          result('裂纹判别', 'ok', '未发现裂纹', '涡流信号低于裂纹阈值 0.5 V', [
            ['涡流幅值', `${data.ec.amp} V`],
            ['最近判别', '11-07 15:00']
          ], null, '涡流幅值 · 近 14 天', trendOption(eddy, xLabels(eddy.length, ['10-25', '11-01', '11-07']), '#0d9488', 0, 1, [{ value: 0.5, name: '阈值', color: '#c62828' }]), '疲劳裂纹涡流监测数据')
        ])
      }
      const data = MECH_PROFILE[point.status]
      const healthTone: ToneKey = data.ku >= 6 ? 'alarm' : data.ku >= 4 ? 'warn' : 'ok'
      const lifeTone: ToneKey = data.life < 365 ? 'alarm' : data.life < 730 ? 'warn' : 'ok'
      const faultTone: ToneKey = data.stage === 0 ? 'ok' : 'warn'
      const kurtosis = rndSeries(30, 61, (index, random) => data.ku * 0.85 + random * data.ku * 0.25 + (point.status === 'warn' ? index * 0.02 : 0))
      const life = rndSeries(30, 67, (index, random) => data.rms * 0.75 + random * data.rms * 0.2 + (point.status === 'warn' ? index * 0.03 : 0))
      const fft = rndSeries(80, 71, (index, random) => {
        const freq = index * 12.5
        let value = 0.03 + random * 0.03
        ;[[16.4, 0.55], [32.8, 0.25], [58.6, point.status === 'warn' ? 0.5 : 0.08], [377, 0.7], [754, 0.3]].forEach(([peak, amp]) => {
          value += amp * Math.exp(-(((freq - peak) / 8) ** 2))
        })
        return value
      })
      return h('div', { class: 'ps-result-grid cols-3' }, [
        result('健康评估', healthTone, `峭度 ${data.ku}`, healthTone === 'ok' ? '特征值均在异常线以下，运行良好' : '峭度超过异常线 4.0，建议关注', [
          ['振动烈度', `${data.vi} mm/s`],
          ['有效值', `${data.rms} mm/s`]
        ], null, '峭度 · 近 30 天', trendOption(kurtosis, xLabels(kurtosis.length, ['10-08', '10-22', '11-07']), '#7c3aed', 0, 8, [
          { value: 4, name: '异常', color: '#b45309' },
          { value: 6, name: '危险', color: '#c62828' }
        ]), '振动监测数据'),
        result('寿命预测', lifeTone, `${data.life} 天`, `置信区间 ${data.ci} 天 · 约 ${(data.life / 365).toFixed(1)} 年`, [
          ['状态阶段', STAGE[data.stage]],
          ['计算时间点', '11-06 09:00']
        ], grades(['A 正常', 'B 早期', 'C 故障', 'D 失效'], data.stage, ['#16a34a', '#d97706', '#ea580c', '#dc2626']), '有效值 · 算法入参（近 30 天）', trendOption(life, xLabels(life.length, ['10-08', '10-22', '11-06']), '#1677ff', 0, 9, [{ value: 4.5, name: '预警', color: '#b45309' }]), '振动监测数据'),
        result('故障诊断', faultTone, `状态 ${STAGE[data.stage]}`, faultTone === 'ok' ? '各特征频率幅值正常' : '轴承外圈特征频率（BPFO）幅值偏高', [
          ['BPFO 58.6 Hz', data.bpfo],
          ['啮合频率', '377 Hz']
        ], null, 'FFT 频谱 · 0–1000 Hz', trendOption(fft, xLabels(fft.length, ['0', '500', '1000 Hz']), '#0f766e', 0, 1, []), '振动 + 转速监测数据')
      ])
    }
  }
})

function grades(labels: string[], on: number, colors: string[]) {
  return h('div', { class: 'ps-grade' }, labels.map((label, index) => h('i', {
    class: index === on ? 'on' : '',
    style: index === on ? { background: colors[index] } : { background: `${colors[index]}1a` }
  }, label)))
}
function result(title: string, tone: ToneKey, hero: string, line: string, facts: [string, string][], grade: ReturnType<typeof h> | null, chart: string, option: EChartsOption, basis: string) {
  return h('article', { class: ['ps-result', tone === 'ok' ? '' : `is-${tone}`] }, [
    h('header', [h('b', title), h('i', { class: ['ps-pill', tone] }, TONE_TEXT[tone])]),
    h('strong', { class: ['ps-hero', tone === 'ok' ? '' : `is-${tone}`] }, hero),
    h('p', line),
    grade,
    h('div', { class: 'ps-facts' }, facts.map(([label, value]) => h('div', { class: 'ps-fact' }, [h('span', label), h('b', value)]))),
    h('div', { class: 'ps-chart-hd' }, [h('b', chart)]),
    h('div', { class: 'ps-chart' }, [h(SchemeChart, { option })]),
    h('span', { class: 'ps-basis' }, ['依据 ', h('em', basis)])
  ])
}

const DataNav = defineComponent({
  name: 'DataNav',
  props: { dataKey: { type: String as PropType<DataKey>, required: true }, wide: Boolean, hint: String },
  emits: ['pick'],
  setup(props, { emit }) {
    return () => h('div', { class: ['ps-nav', props.wide ? 'is-wide' : ''] }, [
      h('span', { class: 'ps-nav-k' }, '点位数据'),
      ...DATA_TABS.map(item => h('button', {
        type: 'button',
        class: ['ps-tab', props.dataKey === item.key ? 'is-on' : ''],
        onClick: () => emit('pick', item.key)
      }, [
        item.name,
        h('i', { class: ['ps-pill', item.live ? 'live' : 'na'] }, item.live ? '实时' : '未关联')
      ])),
      props.hint ? h('span', { class: 'ps-hint' }, props.hint) : null
    ])
  }
})

const ServiceNav = defineComponent({
  name: 'ServiceNav',
  props: {
    side: { type: String as PropType<Side>, required: true },
    svcKey: { type: String as PropType<SvcKey>, required: true },
    tones: { type: Object as PropType<Record<SvcKey, Tone>>, required: true },
    wide: Boolean,
    hint: String
  },
  emits: ['pick'],
  setup(props, { emit }) {
    const names: Record<SvcKey, string> = { overview: '概览', remote: '远程监测', assess: '健康评估', crack: '裂纹预测', fault: '故障诊断', life: '寿命预测' }
    return () => h('div', { class: ['ps-nav', props.wide ? 'is-wide' : ''] }, [
      h('span', { class: 'ps-nav-k' }, '智能服务'),
      ...navKeys(props.side).map(key => h('button', {
        type: 'button',
        class: ['ps-tab', props.svcKey === key ? 'is-on' : ''],
        onClick: () => emit('pick', key)
      }, [
        names[key],
        h('i', { class: ['ps-pill', props.tones[key]] }, TONE_TEXT[props.tones[key]])
      ])),
      props.hint ? h('span', { class: 'ps-hint' }, props.hint) : null
    ])
  }
})

const DataBody = defineComponent({
  name: 'DataBody',
  props: {
    side: { type: String as PropType<Side>, required: true },
    point: { type: Object as PropType<SchemePoint>, required: true },
    dataKey: { type: String as PropType<DataKey>, required: true },
    expanded: Boolean,
    wrap: Boolean
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    return () => {
      if (props.dataKey !== 'safety' && props.dataKey !== 'health') {
        const tab = DATA_TABS.find(item => item.key === props.dataKey)
        return h('div', { class: 'ps-empty' }, [
          h('strong', `${tab?.name} · 未关联`),
          h('p', `该点位未关联${tab?.name}数据。`)
        ])
      }
      if (props.dataKey === 'health') {
        const stats = healthStats(props.side, props.point)
        const series = serviceViews(props.side, props.point).find(item => item.key === 'remote')!.series
        return h('div', { class: 'ps-data' }, [
          h('div', { class: 'ps-block-hd' }, [
            h('b', '健康监测数据'),
            h('i', { class: 'ps-pill live' }, '实时'),
            h('span', props.side === 'structure' ? '应力与累积损伤通道' : '振动与转速通道')
          ]),
          h('div', { class: 'ps-metrics is-4' }, stats.map(item => h('div', { class: 'ps-metric' }, [h('span', item.label), h('strong', item.value)]))),
          h('div', { class: 'ps-chart' }, [h(SchemeChart, { option: lineOption(series, '#1677ff') })])
        ])
      }
      const cards = conditionCards(props.side)
      const head = cycleHead(props.side)
      const rows = cyclesFor(props.side, props.point)
      const shown = props.expanded ? rows : rows.slice(0, 2)
      return h('div', { class: 'ps-data' }, [
        h('div', { class: 'ps-block-hd' }, [
          h('b', '安全监控数据 · 起重机工况'),
          h('i', { class: 'ps-pill live' }, '实时'),
          h('span', '来自起重机安全监控系统的实时工况')
        ]),
        h('div', { class: 'ps-cycle-hd' }, [
          h('b', '近期工作循环'),
          h('button', { type: 'button', class: 'ps-link', onClick: () => emit('toggle') }, props.expanded ? '收起' : `展开全部（共 ${rows.length} 条）`)
        ]),
        h('div', { class: 'ps-scroll' }, [
          h('table', { class: 'ps-grid' }, [
            h('thead', h('tr', ['循环', '开始', '结束', '最大起重量 t', head.mid, '起升高度 m', head.peak].map(item => h('th', item)))),
            h('tbody', shown.map(row => h('tr', [row.name, row.start, row.end, row.load, row.mid, row.height, row.peak].map(cell => h('td', cell)))))
          ])
        ]),
        h('div', { class: ['ps-metrics', props.wrap ? 'is-wrap' : 'is-6'] }, cards.map(item => h('div', { class: 'ps-metric' }, [
          h('span', item.label),
          h('strong', { class: item.tone || '' }, item.value),
          item.sub ? h('em', item.sub) : null
        ]))),
        h('div', { class: 'ps-chart-hd' }, [h('b', '起重量 · 近 1 小时'), h('span', '单位 t')]),
        h('div', { class: 'ps-chart is-weight' }, [h(SchemeChart, { option: weightOption() })])
      ])
    }
  }
})

const ServiceBody = defineComponent({
  name: 'ServiceBody',
  props: {
    side: { type: String as PropType<Side>, required: true },
    point: { type: Object as PropType<SchemePoint>, required: true },
    svcKey: { type: String as PropType<SvcKey>, required: true },
    scheme: { type: Number as PropType<SchemeId>, required: true }
  },
  emits: ['pick'],
  setup(props, { emit }) {
    const card = (view: SvcView) => h('article', { class: ['ps-svc', view.tone, props.scheme === 3 ? 'is-half' : ''] }, [
      h('header', [
        h('b', view.name),
        h('i', { class: ['ps-pill', view.tone] }, TONE_TEXT[view.tone]),
        h('button', { type: 'button', class: 'ps-link', onClick: () => emit('pick', view.key) }, '详情 →')
      ]),
      h('p', view.summary),
      view.stats.length ? h('div', { class: 'ps-stats' }, view.stats.map(item => h('div', [h('span', item.label), h('strong', item.value)]))) : null,
      view.chart !== 'none' ? h('div', { class: 'ps-spark' }, [h(SchemeChart, { option: sparkOption(view.series, view.color, view.chart === 'fft') })]) : null,
      view.chartTitle ? h('small', view.chartTitle) : null
    ])
    return () => {
      const list = serviceViews(props.side, props.point)
      const order = cardOrder(props.side)
      const usable = list.filter(item => item.tone !== 'na').length
      const alarms = list.filter(item => item.tone === 'alarm').length
      const warns = list.filter(item => item.tone === 'warn').length
      const oks = list.filter(item => item.tone === 'ok').length
      const nas = list.filter(item => item.tone === 'na').length
      if (props.svcKey === 'overview') {
        return h('div', { class: 'ps-services' }, [
          h('div', { class: 'ps-block-hd' }, [
            h('b', '服务概览'),
            h('i', { class: ['ps-pill', alarms ? 'alarm' : warns ? 'warn' : 'ok'] }, TONE_TEXT[alarms ? 'alarm' : warns ? 'warn' : 'ok']),
            h('span', `本点位 ${usable} 项服务：报警 ${alarms} · 异常 ${warns} · 正常 ${oks} · 不适用 ${nas}`),
            h('em', '点击卡片查看详情')
          ]),
          h('div', { class: ['ps-svc-grid', props.scheme === 3 ? 'cols-2' : 'cols-3'] }, order.map(key => card(list.find(item => item.key === key)!)))
        ])
      }
      const view = list.find(item => item.key === props.svcKey)!
      return h('div', { class: 'ps-services' }, [
        h('article', { class: ['ps-svc', 'is-detail', view.tone] }, [
          h('header', [h('b', view.name), h('i', { class: ['ps-pill', view.tone] }, TONE_TEXT[view.tone])]),
          h('p', view.summary),
          view.stats.length ? h('div', { class: 'ps-stats' }, view.stats.map(item => h('div', [h('span', item.label), h('strong', item.value)]))) : null,
          view.chart !== 'none' ? h('div', { class: 'ps-chart' }, [h(SchemeChart, { option: view.chart === 'fft' ? sparkOption(view.series, view.color, true) : lineOption(view.series, view.color) })]) : null,
          view.chartTitle ? h('small', view.chartTitle) : null
        ])
      ])
    }
  }
})
</script>

<style src="@/styles/point-scheme.css"></style>
