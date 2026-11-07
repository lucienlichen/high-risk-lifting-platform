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
        <div class="ps-seg" role="tablist" aria-label="布局方案">
          <button v-for="item in schemes" :key="item.id" type="button" :class="{ on: scheme === item.id }" @click="setScheme(item.id)">{{ item.name }}</button>
        </div>
        <div class="ps-seg" role="tablist" aria-label="点位类型">
          <button type="button" :class="{ on: side === 'structure' }" @click="setSide('structure')">结构点位</button>
          <button type="button" :class="{ on: side === 'mechanism' }" @click="setSide('mechanism')">机构点位</button>
        </div>
        <span class="ps-time">数据更新 2026-11-07 15:30</span>
      </div>
    </header>

    <div class="ps-body" :class="`is-${scheme}`">
      <section v-if="scheme === 2" class="ps-side">
        <div class="ps-side-hd">
          <h2>{{ modelTitle(side) }}</h2>
          <span class="ps-count">共 {{ points.length }} 个 · 报警 {{ counts.alarm }} · 异常 {{ counts.warn }}</span>
        </div>
        <div class="ps-tools">
          <span class="ps-legend"><i class="dot solid"></i>实测点</span>
          <span class="ps-legend"><i class="dot hollow"></i>孪生点</span>
          <label class="ps-check"><input v-model="alarmOnly" type="checkbox"> 仅看报警/异常</label>
          <input v-model="search" class="ps-search" type="search" placeholder="搜索点位" aria-label="搜索点位">
        </div>
        <SchemeModel class="ps-model" vertical :side="side" :points="points" :selected-id="active.id" :hidden-ids="hiddenIds" @select="selectPoint" />
        <p class="ps-cap">{{ modelCaption(side, true) }}</p>
        <div class="ps-table-cap">点位表（与上方模型联动）</div>
        <SchemeTable class="ps-table" :rows="visiblePoints" :selected-id="active.id" name-label="名称" @select="selectPoint" />
      </section>

      <section v-else class="ps-top">
        <div class="ps-table-wrap">
          <div class="ps-tools">
            <strong>点位表</strong>
            <span class="ps-count">共 {{ points.length }} 个点位 · 报警 {{ counts.alarm }} · 异常 {{ counts.warn }}</span>
            <label class="ps-check"><input v-model="alarmOnly" type="checkbox"> 仅看报警/异常</label>
            <input v-model="search" class="ps-search" type="search" placeholder="搜索名称或编号" aria-label="搜索名称或编号">
          </div>
          <SchemeTable :rows="visiblePoints" :selected-id="active.id" name-label="名称" @select="selectPoint" />
        </div>
        <div class="ps-model-wrap">
          <div class="ps-tools">
            <strong>{{ modelTitle(side) }}</strong>
            <span class="ps-legend"><i class="dot solid"></i>实测点</span>
            <span class="ps-legend"><i class="dot hollow"></i>孪生点</span>
            <span class="ps-hint">点位表与模型联动：点表格行或模型标签都可切换点位</span>
          </div>
          <SchemeModel :side="side" :points="points" :selected-id="active.id" :hidden-ids="hiddenIds" @select="selectPoint" />
          <p class="ps-cap">{{ modelCaption(side, false) }}</p>
        </div>
      </section>

      <template v-if="scheme === 1">
        <DataNav :data-key="dataKey" wide hint="五类数据固定显示，未接入的标为“未关联”" @pick="pickData" />
        <ServiceNav :side="side" :svc-key="svcKey" :tones="tones" wide hint="智能服务结果针对本点位；状态颜色与点位、部件报警一致" @pick="pickService" />
        <section class="ps-detail">
          <DataBody v-if="!showService" :side="side" :point="active" :data-key="dataKey" :expanded="expanded" @toggle="expanded = !expanded" />
          <ServiceBody v-else :side="side" :point="active" :svc-key="svcKey" :scheme="scheme" @pick="pickService" />
        </section>
      </template>

      <div v-else class="ps-split" :class="{ stack: scheme === 2 }">
        <section class="ps-panel">
          <DataNav :data-key="dataKey" hint="五类数据固定显示 · 默认安全监控" @pick="pickData" />
          <div class="ps-panel-bd">
            <DataBody :side="side" :point="active" :data-key="dataKey" :expanded="expanded" :wrap="scheme === 3" @toggle="expanded = !expanded" />
          </div>
        </section>
        <section class="ps-panel">
          <ServiceNav :side="side" :svc-key="svcKey" :tones="tones" hint="默认显示全部服务概览 · 结果针对本点位" @pick="pickService" />
          <div class="ps-panel-bd">
            <ServiceBody :side="side" :point="active" :svc-key="svcKey" :scheme="scheme" @pick="pickService" />
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
const dataKey = ref<DataKey>('safety')
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
  dataKey.value = 'safety'
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
      type: 'line', data: values, symbol: 'none', lineStyle: { width: 1.4, color },
      markLine: mark ? { symbol: 'none', data: [{ yAxis: mark.value, label: { formatter: mark.name, fontSize: 9, color: '#fa8c16' }, lineStyle: { type: 'dashed', color: '#fa8c16' } }] } : undefined
    }]
  }
}
function sparkOption(values: number[], color: string, fft = false): EChartsOption {
  return {
    animation: false,
    grid: { left: 2, right: 2, top: 6, bottom: 2 },
    xAxis: { type: 'category', show: false, data: values.map((_, index) => index) },
    yAxis: { type: 'value', show: false },
    series: [{ type: fft ? 'bar' : 'line', data: values, symbol: 'none', barWidth: '60%', itemStyle: { color }, lineStyle: { width: 1.2, color }, areaStyle: fft ? undefined : { color: 'rgba(22,119,255,0.08)' } }]
  }
}
function weightOption(): EChartsOption {
  return {
    animation: false,
    grid: { left: 32, right: 12, top: 16, bottom: 22 },
    xAxis: { type: 'category', data: WEIGHT_AXIS, axisLabel: { fontSize: 10, color: '#64748b', interval: 0 }, axisTick: { show: false }, axisLine: { lineStyle: { color: '#e5eaf1' } } },
    yAxis: { type: 'value', min: 0, max: 60, interval: 60, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#eef2f6' } } },
    series: [{
      type: 'line', data: WEIGHT_SERIES, symbol: 'none', lineStyle: { width: 1.6, color: '#1677ff' },
      markLine: { symbol: 'none', data: [{ yAxis: 50, label: { formatter: '额定起重量 50 t', fontSize: 10, color: '#fa8c16' }, lineStyle: { type: 'dashed', color: '#fa8c16' } }] }
    }]
  }
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
