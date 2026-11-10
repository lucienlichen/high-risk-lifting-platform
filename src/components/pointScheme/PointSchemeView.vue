<template>
  <div class="ps-page" :data-scheme="scheme" :data-side="side">
    <header class="ps-info">
      <button type="button" class="ps-back" @click="$emit('back')">← 返回部件模型</button>
      <span class="ps-path">{{ pathOf(side) }}</span>
      <span class="ps-cur-label">当前点位</span>
      <strong class="ps-cur-name">{{ active.name }}</strong>
      <span class="ps-id">{{ active.id }}</span>
      <span class="ps-pill" :class="active.status">{{ TONE_TEXT[active.status] }}</span>
      <span class="ps-kind-tag">{{ active.measured ? '实测点' : '孪生点' }}</span>
      <div class="ps-switch">
        <div class="ps-seg" role="tablist" aria-label="点位类型">
          <button type="button" :class="{ on: side === 'structure' }" @click="setSide('structure')">结构点位</button>
          <button type="button" :class="{ on: side === 'mechanism' }" @click="setSide('mechanism')">机构点位</button>
        </div>
        <span class="ps-time">数据更新 2026-11-07 15:30</span>
      </div>
    </header>

    <div class="ps-final">
      <div class="ps-final-left">
        <section class="ps-table-wrap">
          <div class="ps-table-hd">
            <div class="ps-table-hd-top">
              <strong>点位表</strong>
              <span class="ps-count">共 {{ points.length }} 个 · 报警 {{ counts.alarm }} · 异常 {{ counts.warn }}</span>
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
            <span class="ps-count">{{ side === 'structure' ? '主梁 · 立面示意' : '主起升 · 传动链示意' }}</span>
          </div>
          <SchemeModel :side="side" :points="points" :selected-id="active.id" :hidden-ids="hiddenIds" @select="selectPoint" />
          <p class="ps-cap">{{ side === 'structure' ? '上翼缘点位在梁上沿，下翼缘在下沿，腹板在中部；实心为实测点，空心为孪生点' : '电机 → 联轴器 → 减速器 → 卷筒 → 卷筒轴承座；实心为实测点' }}</p>
        </section>
      </div>
      <div class="ps-final-right">
        <section class="ps-panel">
          <div class="ps-dtabs" role="tablist" aria-label="监测数据">
            <button v-for="tab in finalTabs" :key="tab.key" type="button" :class="{ on: dataKey === tab.key }" @click="pickData(tab.key)">{{ tab.name }}</button>
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
import {
  DATA_TABS, TONE_TEXT, WEIGHT_AXIS, WEIGHT_SERIES,
  cardOrder, conditionCards, cycleHead, cyclesFor, defaultPointId, healthStats,
  modelCaption, modelTitle, navKeys, pathOf, pointsOf, serviceViews,
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
const finalTabs: { key: DataKey; name: string }[] = [
  { key: 'health', name: '健康监测' },
  { key: 'safety', name: '安全监控' },
  { key: 'risk', name: '风险监测' },
  { key: 'inspect', name: '检验检测' },
  { key: 'patrol', name: '日常点巡检' }
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

function series(seed: number, count: number, base: number, amp: number) {
  return Array.from({ length: count }, (_, index) => Math.round((base + Math.sin((index + seed) / 2.2) * amp + ((index * 3 + seed) % 5) * amp * 0.15) * 10) / 10)
}
function axisStep(min: number, max: number) {
  const span = Math.max(max - min, 1e-9)
  const raw = span / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const n = raw / pow
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return nice * pow
}

function trendOption(values: number[], labels: string[], color: string, min: number, max: number, marks: { value: number; name: string; color: string }[] = []): EChartsOption {
  return {
    animation: false,
    grid: { left: 4, right: 8, top: 16, bottom: 4, containLabel: true },
    xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 10, color: '#94a3b8', interval: 0, hideOverlap: true }, axisTick: { show: false }, axisLine: { lineStyle: { color: '#e6edf5' } } },
    yAxis: {
      type: 'value',
      min,
      max,
      interval: axisStep(min, max),
      axisLabel: { fontSize: 10, color: '#94a3b8', hideOverlap: true },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [{
      type: 'line', data: values, smooth: 0.25, symbol: 'none', lineStyle: { width: 1.4, color },
      markLine: marks.length ? { symbol: 'none', data: marks.map(mark => ({ yAxis: mark.value, label: { formatter: mark.name, fontSize: 10, color: mark.color }, lineStyle: { type: 'dashed', color: mark.color } })) } : undefined
    }]
  }
}
function num(base: number, point: SchemePoint, digits = 1) {
  if (point.id === 'ML-01' || point.id === 'G-01') return base.toFixed(digits)
  const factor = point.status === 'alarm' ? 1.35 : point.status === 'warn' ? 1.18 : 0.9
  return (base * factor).toFixed(digits)
}

const MonitorBoard = defineComponent({
  name: 'MonitorBoard',
  props: { side: { type: String as PropType<Side>, required: true }, point: { type: Object as PropType<SchemePoint>, required: true } },
  setup(props) {
    const hour = ['14:30', '', '', '14:45', '', '', '15:00', '', '', '15:15', '', '', '15:30']
    return () => {
      const point = props.point
      const tone = point.status
      if (props.side === 'structure') {
        const stress = Number(num(97.2, point))
        return h('div', { class: 'ps-mon-grid cols-3' }, [
          monitor('应力光纤监测数据', tone, '光纤光栅应变 · 50 Hz', [
            ['实时应力', `${num(97.2, point)} MPa`],
            ['今日最大', `${num(142.6, point)} MPa`],
            ['今日最大应力幅', `${num(104.5, point)} MPa`],
            ['今日应力循环', '146 次']
          ], '应力时程 · 近 1 小时', '单位 MPa', trendOption(series(2, 13, stress, 18), hour, '#1677ff', 0, 240, [
            { value: 215, name: '预警 215', color: '#fa8c16' },
            { value: 230, name: '报警 230', color: '#f5222d' }
          ])),
          monitor('疲劳损伤声发射监测数据', tone, '声发射传感器', [
            ['撞击计数率', `${num(3, point, 0)} 次/min`],
            ['最大幅值', `${num(42, point, 0)} dB`]
          ], '声发射幅值 · 近 24 小时', '单位 dB', trendOption(series(4, 8, 36, 6), ['昨日', '', '', '', '', '', '', '今日'], '#722ed1', 0, 100, [
            { value: 60, name: '关注 60 dB', color: '#fa8c16' }
          ])),
          monitor('疲劳裂纹涡流监测数据', 'ok', '涡流传感器', [
            ['涡流信号幅值', `${num(0.12, point, 2)} V`],
            ['相位', '12 °']
          ], '涡流幅值 · 近 7 天', '单位 V', trendOption(series(6, 7, 0.12, 0.03), ['11-01', '', '', '11-04', '', '', '11-07'], '#13c2c2', 0, 1, [
            { value: 0.5, name: '裂纹阈值 0.5 V', color: '#f5222d' }
          ]))
        ])
      }
      return h('div', { class: 'ps-mon-grid cols-2' }, [
        monitor('振动监测数据', tone, 'ICP 加速度传感器（径向）· 25.6 kHz', [
          ['振动有效值', `${num(2.8, point)} mm/s`],
          ['峰值加速度', `${num(1.2, point)} g`],
          ['峭度', num(3.1, point)]
        ], '振动有效值 · 近 1 小时', '单位 mm/s', trendOption(series(3, 13, Number(num(2.8, point)), 0.6), hour, '#1677ff', 0, 9, [
          { value: 4.5, name: '预警 4.5', color: '#fa8c16' }
        ])),
        monitor('转速监测数据', 'ok', '电机编码器', [
          ['转速', '985 r/min'],
          ['波动', '±1.2 %']
        ], '转速 · 近 1 小时', '单位 r/min', trendOption(series(1, 13, 980, 40), hour, '#1677ff', 0, 1200, []))
      ])
    }
  }
})

function monitor(title: string, tone: SchemePoint['status'] | 'ok', sensor: string, stats: [string, string][], chart: string, unit: string, option: EChartsOption) {
  return h('article', { class: 'ps-mon' }, [
    h('header', [h('b', title), h('i', { class: ['ps-pill', tone] }, TONE_TEXT[tone]), h('span', sensor)]),
    h('div', { class: 'ps-mini-metrics' }, stats.map(([label, value]) => h('div', { class: 'ps-mini' }, [h('span', label), h('strong', value)]))),
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
      const tone = point.status
      if (props.side === 'structure') {
        const damage = point.id === 'ML-01' ? '0.42' : num(0.42, point, 2)
        const hot = tone === 'alarm' ? '累积损伤超限' : tone === 'warn' ? '累积损伤接近限值' : 'I 级 健康 · 处置：正常运行'
        return h('div', { class: 'ps-result-grid cols-4' }, [
          result('疲劳累积损伤评估', tone, `D = ${damage}`, hot, [
            ['已发生循环', '6.4×10⁵ 次'],
            ['结果时间', '11-06 09:18']
          ], grades(['I', 'II', 'III', 'IV', 'V'], tone === 'alarm' ? 2 : tone === 'warn' ? 1 : 0), '累积损伤度 D · 今年', trendOption(series(5, 8, Number(damage), 0.04), ['1月', '', '', '', '', '', '', '11月'], '#1677ff', 0, 1, [{ value: 0.8, name: 'II级', color: '#fa8c16' }]), '应力光纤监测数据'),
          result('裂纹预测', tone, point.id === 'ML-01' ? '6.2 年' : `${num(6.2, point)} 年`, '预计裂纹萌生前的剩余寿命', [
            ['剩余损伤度', point.id === 'ML-01' ? '0.58' : num(0.58, point, 2)],
            ['剩余循环', '8.9×10⁵ 次']
          ], grades(['>2 年', '1–2 年', '<1 年'], tone === 'alarm' ? 2 : tone === 'warn' ? 1 : 0), '剩余损伤度 · 今年', trendOption(series(7, 8, 0.5, 0.05), ['1月', '', '', '', '', '', '', '11月'], '#1677ff', 0, 1, []), '应力光纤监测数据'),
          result('疲劳损伤程度诊断', tone, tone === 'ok' ? '未见加速演化' : '损伤活动增强', tone === 'ok' ? '声发射活动平稳，损伤处于稳定累积阶段' : '声发射计数抬升，需关注', [
            ['撞击计数率', `${num(3, point, 0)} 次/min`],
            ['累计能量', '1.2×10³ mV·μs']
          ], null, '日撞击计数率 · 近 14 天', trendOption(series(8, 8, 3, 1.2), ['', '', '', '', '', '', '', '今日'], '#722ed1', 0, 12, [{ value: 8, name: '关注', color: '#fa8c16' }]), '疲劳损伤声发射监测数据'),
          result('裂纹判别', 'ok', '未发现裂纹', '涡流信号低于裂纹阈值 0.5 V', [
            ['涡流信号', `${num(0.12, point, 2)} V`],
            ['最近判别', '11-07 15:00']
          ], null, '涡流幅值 · 近 14 天', trendOption(series(9, 8, 0.12, 0.03), ['', '', '', '', '', '', '', '今日'], '#13c2c2', 0, 0.8, [{ value: 0.5, name: '阈值', color: '#f5222d' }]), '疲劳裂纹涡流监测数据')
        ])
      }
      return h('div', { class: 'ps-result-grid cols-3' }, [
        result('健康评估', tone, `峭度 ${num(3.1, point)}`, tone === 'ok' ? '特征值均在异常线以下，运行良好' : '特征值接近或超过异常线', [
          ['振动烈度', `${num(2.6, point)} mm/s`],
          ['有效值', `${num(2.8, point)} mm/s`]
        ], null, '峭度 · 近 30 天', trendOption(series(4, 10, Number(num(3.1, point)), 0.3), ['', '', '', '', '', '', '', '', '', '今日'], '#722ed1', 0, 8, [
          { value: 6, name: '危险', color: '#f5222d' },
          { value: 4.5, name: '异常', color: '#fa8c16' }
        ]), '振动监测数据'),
        result('寿命预测', 'ok', '1860 天', '置信区间 1620–2050 天 · 约 5.1 年', [
          ['状态阶段', 'A 正常'],
          ['计算时间点', '11-06 09:00']
        ], grades(['A 正常', 'B 早期', 'C 故障', 'D 失效'], 0), '有效值 · 算法入参（近 30 天）', trendOption(series(2, 10, 2.8, 0.25), ['', '', '', '', '', '', '', '', '', '今日'], '#1677ff', 0, 6, [{ value: 4.5, name: '预警', color: '#fa8c16' }]), '振动监测数据'),
        result('故障诊断', tone, tone === 'ok' ? '状态 A 正常' : '特征频率升高', tone === 'ok' ? '各特征频率幅值正常' : '包络谱出现需关注峰值', [
          ['BPFO 58.6 Hz', tone === 'ok' ? '0.08 g' : '0.21 g'],
          ['啮合频率', '377 Hz']
        ], null, 'FFT 频谱 · 0–1000 Hz', trendOption([0.02, 0.04, 0.9, 0.05, 0.08, 0.7, 0.04, 0.2, 0.03, 0.06], ['0', '', '', '', '500', '', '', '', '', '1000'], '#13c2c2', 0, 1, []), '振动 + 转速监测数据')
      ])
    }
  }
})

function grades(labels: string[], on: number) {
  return h('div', { class: 'ps-grade' }, labels.map((label, index) => h('i', { class: index === on ? 'on' : '' }, label)))
}
function result(title: string, tone: SchemePoint['status'] | 'ok', hero: string, line: string, stats: [string, string][], grade: ReturnType<typeof h> | null, chart: string, option: EChartsOption, basis: string) {
  return h('article', { class: 'ps-result' }, [
    h('header', [h('b', title), h('i', { class: ['ps-pill', tone] }, TONE_TEXT[tone])]),
    h('strong', { class: 'ps-hero' }, hero),
    h('p', line),
    h('div', { class: 'ps-mini-metrics' }, stats.map(([label, value]) => h('div', { class: 'ps-mini' }, [h('span', label), h('strong', value)]))),
    grade,
    h('div', { class: 'ps-chart-hd' }, [h('b', chart)]),
    h('div', { class: 'ps-chart' }, [h(SchemeChart, { option })]),
    h('span', { class: 'ps-basis' }, `依据 ${basis}`)
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
