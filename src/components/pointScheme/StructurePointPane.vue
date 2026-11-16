<template>
  <div class="ps-final ps-struct">
    <div class="ps-struct-left">
      <section class="ps-struct-card ps-struct-table">
        <div class="ps-struct-hd">
          <div class="ps-struct-hd-top">
            <strong>点位表</strong>
            <span>共 {{ summary.total }} 个 · 实时监测 {{ summary.live }} · 数字孪生生成 {{ summary.twin }} · <em class="a">报警 {{ summary.alarm }}</em> · <em class="w">异常 {{ summary.warn }}</em></span>
          </div>
          <div class="ps-struct-hd-bot">
            <input v-model="query" type="search" placeholder="搜索名称或编号" aria-label="搜索名称或编号">
            <label><input v-model="alarmOnly" type="checkbox">仅看报警/异常</label>
          </div>
        </div>
        <div class="ps-struct-colhd"><span>类型</span><span>编号</span><span>名称</span><span>状态</span></div>
        <div class="ps-struct-body">
          <p v-if="alarmOnly" class="ps-struct-empty">当前没有报警/异常点位</p>
          <template v-else>
            <div v-for="group in groups" :key="group.key" class="ps-struct-grp" :class="group.cls">
              <div class="gt"><span v-html="group.title"></span><small>{{ group.rows.length }} 个</small></div>
              <div class="rows">
                <button v-for="row in group.rows" :key="row.id" type="button" class="row" :class="{ sel: row.id === pointId }" @click="$emit('select', row.id)" @mouseenter="hoverId = row.id" @mouseleave="hoverId = ''">
                  <span>{{ row.id }}</span>
                  <span class="nm">{{ row.name }}</span>
                  <span class="chip" :class="row.tone">{{ row.toneText }}</span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </section>
      <section class="ps-struct-card ps-struct-model">
        <div class="ps-struct-model-hd"><strong>结构模型</strong><span>单双主梁 · 立面示意 · 点位安装位置</span></div>
        <svg class="ps-struct-beam" viewBox="0 0 640 220" @mouseleave="hoverId = ''">
          <rect x="46" y="78" width="548" height="52" rx="3" fill="#dbeafe" stroke="#60a5fa" stroke-width="1.5" />
          <line x1="46" y1="104" x2="594" y2="104" stroke="#93c5fd" stroke-dasharray="4 4" />
          <rect x="14" y="130" width="56" height="20" rx="3" fill="#e2e8f0" stroke="#94a3b8" />
          <rect x="570" y="130" width="56" height="20" rx="3" fill="#e2e8f0" stroke="#94a3b8" />
          <text x="42" y="144" text-anchor="middle" font-size="11" fill="#475569">端梁</text>
          <text x="598" y="144" text-anchor="middle" font-size="11" fill="#475569">端梁</text>
          <line x1="0" y1="150" x2="640" y2="150" stroke="#cbd5e1" stroke-width="2" />
          <text v-for="(label, index) in ['0', 'L/4', 'L/2', '3L/4', 'L']" :key="label" :x="46 + 548 * index / 4" y="188" text-anchor="middle" font-size="11" fill="#6b7280">{{ label }}</text>
          <g v-for="mark in modelMarks" :key="mark.id" class="mk" @click="$emit('select', mark.id)" @mouseenter="hoverId = mark.id">
            <line v-if="mark.sec !== 'web'" :x1="mark.x" :x2="mark.x" :y1="mark.sec === 'top' ? 70 : 138" :y2="mark.sec === 'top' ? 48 : 168" :stroke="mark.active ? '#1677ff' : '#cbd5e1'" :stroke-width="mark.active ? 1.5 : 1" />
            <circle v-if="mark.active" :cx="mark.x" :cy="mark.y" r="13" fill="none" stroke="#1677ff" stroke-width="2" />
            <circle :cx="mark.x" :cy="mark.y" r="7.5" :fill="mark.live ? '#16a34a' : '#fff'" stroke="#16a34a" stroke-width="3" />
            <text v-if="!mark.active" :x="mark.sec === 'web' ? mark.x + 14 : mark.x" :y="mark.sec === 'web' ? mark.y + 4 : mark.sec === 'top' ? 44 : 176" :text-anchor="mark.sec === 'web' ? 'start' : 'middle'" font-size="12" font-weight="700" fill="#15803d">{{ mark.id }}</text>
            <g v-else>
              <line :x1="mark.x" :x2="mark.x" :y1="mark.y + (mark.sec === 'bot' ? 8 : -8)" :y2="mark.bubbleY + 28" stroke="#1677ff" stroke-width="1.5" />
              <rect :x="mark.bubbleX" :y="mark.bubbleY" :width="mark.bubbleW" height="28" rx="14" fill="#1677ff" />
              <text :x="mark.bubbleX + mark.bubbleW / 2" :y="mark.bubbleY + 19" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">{{ mark.bubble }}</text>
            </g>
          </g>
        </svg>
        <div class="ps-struct-legend">
          <span><i class="solid"></i>实时监测点位</span>
          <span><i class="hollow"></i>数字孪生生成点位</span>
          <span>上翼缘点在梁上沿，下翼缘在下沿，腹板在中部</span>
        </div>
      </section>
    </div>
    <div class="ps-struct-right">
      <section class="ps-struct-card ps-struct-sec data">
        <nav class="ps-struct-menu">
          <button type="button" :class="menuClass('health')" @click="dataMenu = 'health'">健康监测</button>
          <button type="button" :class="menuClass('safety')" @click="dataMenu = 'safety'">安全监控</button>
          <button type="button" :class="menuClass('risk')" @click="dataMenu = 'risk'">风险监测</button>
          <button type="button" :class="menuClass('inspect')" @click="dataMenu = 'inspect'">检验检测</button>
          <button type="button" :class="menuClass('patrol')" @click="dataMenu = 'patrol'">日常点巡检</button>
          <span>监测数据</span>
        </nav>
        <div v-if="dataMenu === 'health'" class="ps-struct-grid">
          <article class="ps-struct-box span2">
            <div class="bh side">
              <span class="d"><span class="bt">应力光纤监测数据</span><b>{{ stressTab === 'cloud' ? '2026-11-11' : stressDate }}</b></span>
              <span class="r">历史数据
                <select v-model="stressDate" :disabled="stressTab === 'cloud'">
                  <option v-for="date in dates" :key="date" :value="date">{{ dateLabel(date) }}</option>
                </select>
              </span>
            </div>
            <div class="tabs">
              <div class="seg">
                <button type="button" :class="{ on: stressTab === 'ts' }" @click="stressTab = 'ts'">应力时程曲线</button>
                <button type="button" :class="{ on: stressTab === 'cloud' }" @click="stressTab = 'cloud'">当前应力云图</button>
              </div>
              <span>{{ stressTab === 'cloud' ? '整机 · 当前时刻 15:30 · 点击放大' : '光纤光栅应变 · 单位 MPa' }}</span>
            </div>
            <div v-if="stressTab === 'ts'" class="chart"><SchemeChart :option="stressOption" /></div>
            <div v-else class="chart cloud" @click="onCloudClick">
              <div v-html="cloudHtml"></div>
              <button type="button" class="zbtn" @click.stop="openModal">⤢ 放大</button>
            </div>
          </article>
          <article class="ps-struct-box">
            <div class="bh side titleline"><span class="bt">声发射监测数据</span></div>
            <div class="bh side"><span class="d"><b>{{ aeDate }}</b></span><span class="r">历史数据
              <select v-model="aeDate"><option v-for="date in dates" :key="date" :value="date">{{ dateLabel(date) }}</option></select>
            </span></div>
            <div class="tabs"><span>每次撞击幅值 · 单位 dB</span></div>
            <div class="chart"><SchemeChart :option="aeOption" /></div>
          </article>
          <article class="ps-struct-box">
            <div class="bh side titleline"><span class="bt">疲劳裂纹涡流监测数据</span></div>
            <div class="bh side"><span class="d"><b>{{ ecDate }}</b></span><span class="r">历史数据
              <select v-model="ecDate"><option v-for="date in dates" :key="date" :value="date">{{ dateLabel(date) }}</option></select>
            </span></div>
            <div class="tabs"><span>涡流信号幅值 · 单位 V</span></div>
            <div class="chart"><SchemeChart :option="ecOption" /></div>
          </article>
        </div>
        <div v-else-if="dataMenu === 'safety'" class="ps-struct-safety">
          <div class="ps-struct-grid3">
            <article class="ps-struct-box">
              <div class="bh side">
                <span class="d"><span class="bt">起升高度</span><b>{{ heightDate }}</b></span>
                <span class="r">历史数据
                  <select v-model="heightDate"><option v-for="date in dates" :key="date" :value="date">{{ dateLabel(date) }}</option></select>
                </span>
              </div>
              <div class="tabs"><span class="ps-share">整机共享工况</span><span class="u">单位 m</span></div>
              <div class="chart"><SchemeChart :option="heightOption" /></div>
            </article>
            <article class="ps-struct-box">
              <div class="bh side">
                <span class="d"><span class="bt">起升载荷</span><b>{{ loadDate }}</b></span>
                <span class="r">历史数据
                  <select v-model="loadDate"><option v-for="date in dates" :key="date" :value="date">{{ dateLabel(date) }}</option></select>
                </span>
              </div>
              <div class="tabs"><span class="ps-share">整机共享工况</span><span class="u">单位 t</span></div>
              <div class="chart"><SchemeChart :option="loadOption" /></div>
            </article>
            <article class="ps-struct-box">
              <div class="bh side">
                <span class="d"><span class="bt">小车位置</span><b>{{ trolleyDate }}</b></span>
                <span class="r">历史数据
                  <select v-model="trolleyDate"><option v-for="date in dates" :key="date" :value="date">{{ dateLabel(date) }}</option></select>
                </span>
              </div>
              <div class="tabs"><span class="ps-share">整机共享工况</span><span class="u">单位 m</span></div>
              <div class="chart"><SchemeChart :option="trolleyOption" /></div>
            </article>
          </div>
        </div>
        <p v-else class="ps-struct-empty-tab">该页签示意本次未做</p>
      </section>
      <section class="ps-struct-card ps-struct-sec svc">
        <template v-if="dataMenu !== 'safety'">
        <nav class="ps-svcmenu" aria-label="服务">
          <button type="button">健康评估</button>
          <button type="button">裂纹预测</button>
          <button type="button">损伤程度诊断</button>
          <button type="button">裂纹判别</button>
        </nav>
        <div class="ps-struct-grid">
          <article class="ps-struct-box">
            <div class="tabs"><span class="left">疲劳损伤度 D · 按天</span></div>
            <div class="chart"><SchemeChart :option="damageOption" /></div>
            <div class="concl"><div class="big">疲劳损伤度 D = {{ point.D.toFixed(2) }}</div><div class="line2">点位健康状态：<b>健康</b></div></div>
            <div class="basis">依据<em>应力光纤监测数据</em></div>
          </article>
          <article class="ps-struct-box">
            <div class="tabs"><span class="left">裂纹萌生寿命 · 按天</span>
              <div class="zoom">
                <button v-for="days in [7, 14, 30]" :key="days" type="button" :class="{ on: zoom === days }" @click="zoom = days">{{ days }}天</button>
              </div>
            </div>
            <div class="chart" title="滚轮可缩放天数" @wheel.prevent="onLifeWheel"><SchemeChart :option="lifeOption" /></div>
            <div class="concl"><div class="big">裂纹萌生寿命 {{ point.L.toFixed(1) }} 年</div></div>
            <div class="basis">依据<em>应力光纤监测数据</em></div>
          </article>
          <article class="ps-struct-box">
            <div class="tabs"><span class="left">声发射幅值 · 近 7 天（每小时最大）</span></div>
            <div class="chart"><SchemeChart :option="aeWeekOption" /></div>
            <div class="concl"><p class="qual">当前点位声发射信号不明显，<b>暂未见明显的活性缺陷</b></p></div>
            <div class="basis">依据<em>声发射监测数据</em></div>
          </article>
          <article class="ps-struct-box">
            <div class="tabs"><span class="left">涡流阻抗平面（相位图）</span></div>
            <div class="chart phase" v-html="phaseSvg"></div>
            <div class="concl"><div class="big ok">该位置未发现裂纹</div></div>
            <div class="basis">依据<em>疲劳裂纹涡流监测数据</em></div>
          </article>
        </div>
        </template>
        <div v-else class="ps-svc-tbd"><b>安全监控对应服务（待定）</b><span>服务内容待确认</span></div>
      </section>
    </div>
    <div v-if="modal" class="ps-cloud-mask" @click.self="closeModal">
      <div class="ps-cloud-modal" role="dialog" aria-label="整机当前应力云图">
        <div class="mhd">
          <strong>整机当前应力云图</strong>
          <span>3G211-A2 · 2026-11-11 15:30 · 滚轮缩放，拖拽平移</span>
          <div class="tools">
            <button type="button" @click="zoomBy(1 / 1.25)">＋</button>
            <em>{{ zoomText }}</em>
            <button type="button" @click="zoomBy(1.25)">－</button>
            <button type="button" @click="resetView">复位</button>
            <button type="button" class="x" @click="closeModal">✕</button>
          </div>
        </div>
        <div class="mbody" @wheel.prevent="onModalWheel" @mousedown="onDragStart">
          <svg class="ps-crane" :viewBox="`${view.x} ${view.y} ${view.w} ${view.h}`" preserveAspectRatio="xMidYMid meet" @click="onModalClick" v-html="modalMarkup"></svg>
          <div class="mtitle">
            <b>H: 前拉杆</b>
            <div>等效应力</div>
            <div>Type: Equivalent (von-Mises) Stress</div>
            <div>Unit: MPa</div>
            <div>Time: 2026-11-11 15:30</div>
            <p>数字孪生示意图 · 非有限元计算结果 · 当前点位 {{ point.id }} {{ point.name }}</p>
          </div>
          <svg class="mleg" viewBox="0 0 120 210" v-html="modalLegend"></svg>
          <div class="mscale"><i></i><i class="w"></i><i></i><i class="w"></i><b>0</b><b>2e+04</b><b>4e+04</b><b>6e+04</b><b>8e+04 (mm)</b></div>
          <svg class="maxis" viewBox="0 0 110 100">
            <line x1="40" y1="70" x2="96" y2="70" stroke="#dc2626" stroke-width="3" />
            <text x="100" y="75" font-size="14" fill="#dc2626">X</text>
            <line x1="40" y1="70" x2="40" y2="14" stroke="#16a34a" stroke-width="3" />
            <text x="35" y="10" font-size="14" fill="#16a34a">Y</text>
            <line x1="40" y1="70" x2="12" y2="92" stroke="#2563eb" stroke-width="3" />
            <text x="0" y="98" font-size="14" fill="#2563eb">Z</text>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import SchemeChart from '@/components/pointScheme/SchemeChart.vue'
import { cloudSvg, legendMarkup, modalCrane } from '@/components/pointScheme/stressCloud'
import {
  STRUCT_DATES, STRUCT_NOW, STRUCT_PTS, aeDay, aeWeek, dateLabel, dSeries, dutyDay, ecDay, lSeries, shiftDate, stressDay, structPoint
} from '@/components/pointScheme/structureMock'

const props = defineProps<{ pointId: string }>()
const emit = defineEmits<{ select: [id: string] }>()

const query = ref('')
const alarmOnly = ref(false)
const hoverId = ref('')
type DataMenu = 'health' | 'safety' | 'risk' | 'inspect' | 'patrol'
const dataMenu = ref<DataMenu>('health')
const stressTab = ref<'ts' | 'cloud'>('ts')
const stressDate = ref(STRUCT_DATES[0])
const aeDate = ref(STRUCT_DATES[0])
const ecDate = ref(STRUCT_DATES[0])
const heightDate = ref(STRUCT_DATES[0])
const loadDate = ref(STRUCT_DATES[0])
const trolleyDate = ref(STRUCT_DATES[0])
const zoom = ref(7)
const modal = ref(false)
const dates = STRUCT_DATES
const view0 = { x: -460, y: -30, w: 1500, h: 680 }
const view = ref({ ...view0 })
let drag: { x: number; y: number; vx: number; vy: number } | null = null
let dragged = false

const point = computed(() => structPoint(props.pointId))
const zoomText = computed(() => `${Math.round(view0.w / view.value.w * 100)}%`)
const cloudHtml = computed(() => cloudSvg(props.pointId))
const modalMarkup = computed(() => modalCrane(props.pointId))
const modalLegend = computed(() => legendMarkup(2, 6, 188, 12))

function withTone<T extends { id: string }>(point: T) {
  return { ...point, tone: 'ok', toneText: '正常' }
}

const summary = computed(() => {
  const rows = STRUCT_PTS.map(withTone)
  return {
    total: rows.length,
    live: rows.filter(item => item.live).length,
    twin: rows.filter(item => !item.live).length,
    alarm: rows.filter(item => item.tone === 'alarm').length,
    warn: rows.filter(item => item.tone === 'warn').length
  }
})

const groups = computed(() => {
  const text = query.value.trim()
  const match = (id: string, name: string) => !text || id.includes(text.toUpperCase()) || name.includes(text)
  return [
    { key: 'live', cls: 'g1', title: '实时监测<br>点位', rows: STRUCT_PTS.filter(item => item.live && match(item.id, item.name)).map(withTone) },
    { key: 'twin', cls: 'g2', title: '数字孪生<br>生成点位', rows: STRUCT_PTS.filter(item => !item.live && match(item.id, item.name)).map(withTone) }
  ].filter(group => group.rows.length)
})

const modelMarks = computed(() => STRUCT_PTS.map(item => {
  const x = 46 + item.pos * 548
  const y = item.sec === 'top' ? 78 : item.sec === 'bot' ? 130 : 104
  const active = item.id === props.pointId || item.id === hoverId.value
  const bubble = `${item.id} ${item.name} · ${item.live ? '实测' : '孪生'}`
  const bubbleW = bubble.length * 13 + 22
  const bubbleX = Math.max(4, Math.min(640 - bubbleW - 4, x - bubbleW / 2))
  const bubbleY = item.sec === 'bot' ? 156 : 8
  return { ...item, x, y, active, bubble, bubbleW, bubbleX, bubbleY }
}))

function dayOption(pairs: [number, number][], color: string, max: number, date: string, scatter = false, area = false, hours = [0, 4, 8, 12, 16, 20, 24]): EChartsOption {
  const today = date === STRUCT_DATES[0]
  return {
    animation: false,
    grid: { left: 42, right: 16, top: 22, bottom: 28 },
    tooltip: { trigger: 'axis', formatter: (items: unknown) => {
      const row = (items as { value: [number, number] }[])[0]
      if (!row) return ''
      const minute = row.value[0]
      return `${date.slice(5)} ${Math.floor(minute / 60)}:${String(Math.round(minute % 60)).padStart(2, '0')}<br>${row.value[1]}`
    } },
    xAxis: { type: 'value', min: 0, max: 1440, interval: hours[1] * 60, axisLabel: { formatter: (value: number) => `${String(Math.round(value / 60)).padStart(2, '0')}:00`, fontSize: 11, color: '#6b7280' }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max, axisLabel: { fontSize: 11, color: '#6b7280' }, splitLine: { lineStyle: { color: '#eef0f3' } } },
    series: [{
      type: scatter ? 'scatter' : 'line',
      data: pairs,
      symbolSize: scatter ? 4 : 0,
      showSymbol: scatter,
      smooth: false,
      lineStyle: { width: 1.4, color },
      itemStyle: { color, opacity: scatter ? 0.55 : 1 },
      areaStyle: area ? { color, opacity: 0.08 } : undefined,
      markLine: today ? { symbol: 'none', data: [{ xAxis: STRUCT_NOW, label: { formatter: '当前 15:30', fontSize: 11, color: '#1677ff' }, lineStyle: { type: 'dashed', color: '#1677ff' } }] } : undefined
    }]
  }
}

function menuClass(key: DataMenu) {
  if (dataMenu.value === key) return 'on'
  return key === 'health' || key === 'safety' ? 'ok' : ''
}

function dutyOption(pairs: [number, number][], color: string, max: number, interval: number, date: string, label: string, unit: string, digits: number): EChartsOption {
  const isToday = date === STRUCT_DATES[0]
  return {
    animation: false,
    grid: { left: 42, right: 12, top: 18, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter: (items: unknown) => {
        const row = (items as { value: [number, number] }[])[0]
        if (!row) return ''
        const minute = Math.round(row.value[0])
        const clock = `${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, '0')}`
        return `${date.slice(5)} ${clock}<br>${label} ${row.value[1].toFixed(digits)} ${unit}`
      }
    },
    xAxis: {
      type: 'value', min: 0, max: 1440, interval: 240,
      axisLabel: { formatter: (value: number) => `${Math.round(value / 60)}:00`, fontSize: 11, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value', min: 0, max, interval,
      axisLabel: { fontSize: 11, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      splitLine: { lineStyle: { color: '#eef0f3' } }
    },
    series: [{
      type: 'line',
      data: pairs,
      symbol: 'none',
      lineStyle: { width: 1.5, color },
      itemStyle: { color },
      areaStyle: { color, opacity: 0.08 },
      markLine: isToday ? {
        symbol: 'none',
        silent: true,
        data: [{
          xAxis: STRUCT_NOW,
          label: { formatter: '当前 15:30', fontSize: 11, color: '#1677ff', position: 'insideEndTop', rotate: 0 },
          lineStyle: { type: 'dashed', color: '#1677ff', width: 1 }
        }]
      } : undefined
    }]
  }
}

const heightSeries = computed(() => dutyDay(heightDate.value))
const loadSeries = computed(() => dutyDay(loadDate.value))
const trolleySeries = computed(() => dutyDay(trolleyDate.value))
const heightOption = computed(() => dutyOption(heightSeries.value.height, '#1677ff', 20, 5, heightDate.value, '起升高度', 'm', 2))
const loadOption = computed(() => dutyOption(loadSeries.value.load, '#d97706', 50, 10, loadDate.value, '起升载荷', 't', 1))
const trolleyOption = computed(() => dutyOption(trolleySeries.value.trolley, '#0d9488', 28, 10, trolleyDate.value, '小车位置', 'm', 2))
const stressOption = computed(() => dayOption(stressDay(point.value, stressDate.value), '#1677ff', 200, stressDate.value))
const aeOption = computed(() => dayOption(aeDay(point.value, aeDate.value), '#7c3aed', 80, aeDate.value, true, false, [0, 6, 12, 18, 24]))
const ecOption = computed(() => dayOption(ecDay(point.value, ecDate.value), '#0d9488', 0.3, ecDate.value, false, true, [0, 6, 12, 18, 24]))

const damageOption = computed(() => {
  const pairs = dSeries(point.value)
  return {
    animation: false,
    grid: { left: 46, right: 12, top: 12, bottom: 28 },
    xAxis: { type: 'value', min: -10, max: 0, axisLabel: { formatter: (value: number) => shiftDate(value), fontSize: 11, color: '#6b7280' } },
    yAxis: { type: 'value', min: Math.floor((Math.min(...pairs.map(item => item[1])) - 0.01) * 100) / 100, max: Math.ceil((point.value.D + 0.006) * 100) / 100, axisLabel: { fontSize: 11, color: '#6b7280', formatter: (value: number) => value.toFixed(2) }, splitLine: { lineStyle: { color: '#eef0f3' } } },
    series: [{ type: 'line', data: pairs, symbol: 'none', lineStyle: { width: 2, color: '#7c3aed' }, areaStyle: { color: '#7c3aed', opacity: 0.08 } }]
  } as EChartsOption
})

const lifeOption = computed(() => {
  const pairs = lSeries(point.value, zoom.value)
  const step = zoom.value <= 8 ? 2 : zoom.value <= 16 ? 4 : 7
  const min = Math.floor((point.value.L - 0.02) * 100) / 100
  const max = Math.ceil((Math.max(...pairs.map(item => item[1])) + 0.01) * 100) / 100
  return {
    animation: false,
    grid: { left: 46, right: 12, top: 12, bottom: 28 },
    tooltip: { trigger: 'axis', formatter: (items: unknown) => { const row = (items as { value: [number, number] }[])[0]; return row ? `${shiftDate(Math.round(row.value[0]))}<br>裂纹萌生寿命 ${row.value[1].toFixed(2)} 年` : '' } },
    xAxis: { type: 'value', min: -(zoom.value - 1), max: 0, interval: step, axisLabel: { formatter: (value: number) => shiftDate(Math.round(value)), fontSize: 11, color: '#6b7280' } },
    yAxis: { type: 'value', min, max, interval: max - min <= 0.08 ? 0.02 : undefined, axisLabel: { fontSize: 11, color: '#6b7280', formatter: (value: number) => value.toFixed(2) }, splitLine: { lineStyle: { color: '#eef0f3' } } },
    series: [{ type: 'line', data: pairs, symbol: 'none', lineStyle: { width: 2, color: '#0d9488' }, areaStyle: { color: '#0d9488', opacity: 0.08 } }]
  } as EChartsOption
})

const aeWeekOption = computed(() => ({
  animation: false,
  grid: { left: 36, right: 12, top: 16, bottom: 28 },
  xAxis: { type: 'value', min: -167, max: 0, axisLabel: { formatter: (value: number) => shiftDate(Math.round(value / 24)), fontSize: 11, color: '#6b7280' }, splitLine: { show: false } },
  yAxis: { type: 'value', min: 0, max: 60, axisLabel: { fontSize: 11, color: '#6b7280' }, splitLine: { lineStyle: { color: '#eef0f3' } } },
  series: [{
    type: 'line', data: aeWeek(point.value), symbol: 'none', lineStyle: { width: 1.2, color: '#7c3aed' },
    markLine: { symbol: 'none', data: [{ yAxis: 40, label: { formatter: '阈值 40 dB', color: '#d97706', fontSize: 11, position: 'insideEndTop' }, lineStyle: { type: 'dashed', color: '#d97706' } }] }
  }]
} as EChartsOption))

const phaseSvg = computed(() => {
  const amp = point.value.ec
  const phase = point.value.ph * Math.PI / 180
  let path = ''
  for (let index = 0; index <= 80; index += 1) {
    const turn = index / 80 * Math.PI * 2
    const along = amp * Math.sin(turn)
    const across = amp * 0.18 * Math.sin(2 * turn)
    const x = 160 + (along * Math.cos(phase) - across * Math.sin(phase)) * 120
    const y = 120 - (along * Math.sin(phase) + across * Math.cos(phase)) * 120
    path += `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
  }
  return `<svg viewBox="0 0 320 240" class="phase-svg"><rect x="40" y="10" width="240" height="210" fill="#fff" stroke="#e5e7eb"/><line x1="40" y1="115" x2="280" y2="115" stroke="#d1d5db"/><line x1="160" y1="10" x2="160" y2="220" stroke="#d1d5db"/><path d="M${160 + 60 * Math.cos(40 * Math.PI / 180)},${115 - 60 * Math.sin(40 * Math.PI / 180)} L${160 + 110 * Math.cos(40 * Math.PI / 180)},${115 - 110 * Math.sin(40 * Math.PI / 180)} A110,110 0 0 0 ${160 + 110 * Math.cos(140 * Math.PI / 180)},${115 - 110 * Math.sin(140 * Math.PI / 180)} L${160 + 60 * Math.cos(140 * Math.PI / 180)},${115 - 60 * Math.sin(140 * Math.PI / 180)} A60,60 0 0 1 ${160 + 60 * Math.cos(40 * Math.PI / 180)},${115 - 60 * Math.sin(40 * Math.PI / 180)}Z" fill="#fee2e2" fill-opacity=".7"/><text x="160" y="28" text-anchor="middle" font-size="11" fill="#c62828">裂纹判别区</text><circle cx="160" cy="115" r="60" fill="none" stroke="#e5484d" stroke-dasharray="6 4"/><text x="214" y="168" font-size="11" fill="#c62828">阈值 0.5 V</text><path d="${path}" fill="none" stroke="#0d9488" stroke-width="2"/><text x="270" y="110" text-anchor="end" font-size="10" fill="#6b7280">实部</text><text x="166" y="24" font-size="10" fill="#6b7280">虚部</text><text x="48" y="208" font-size="11" fill="#0f766e">幅值 ${amp.toFixed(2)} V · 相位 ${point.value.ph}°</text></svg>`
})

function onLifeWheel(event: WheelEvent) {
  zoom.value = Math.max(4, Math.min(30, zoom.value + (event.deltaY > 0 ? 2 : -2)))
}
function openModal() {
  modal.value = true
  view.value = { ...view0 }
}
function closeModal() { modal.value = false }
function onCloudClick(event: MouseEvent) {
  const node = (event.target as Element).closest('[data-pid]')
  if (node) emit('select', node.getAttribute('data-pid') || props.pointId)
  else openModal()
}
function zoomBy(factor: number) {
  const centerX = view.value.x + view.value.w / 2
  const centerY = view.value.y + view.value.h / 2
  zoomAt(centerX, centerY, factor)
}
function zoomAt(centerX: number, centerY: number, factor: number) {
  const next = Math.max(view0.w / 6, Math.min(view0.w * 1.5, view.value.w * factor))
  const ratio = next / view.value.w
  view.value = { x: centerX - (centerX - view.value.x) * ratio, y: centerY - (centerY - view.value.y) * ratio, w: next, h: view.value.h * ratio }
}
function resetView() { view.value = { ...view0 } }
function onModalWheel(event: WheelEvent) {
  const target = event.currentTarget as HTMLElement
  const bounds = target.getBoundingClientRect()
  const scale = Math.max(view.value.w / bounds.width, view.value.h / bounds.height)
  zoomAt(view.value.x + view.value.w / 2 + (event.clientX - bounds.left - bounds.width / 2) * scale, view.value.y + view.value.h / 2 + (event.clientY - bounds.top - bounds.height / 2) * scale, event.deltaY > 0 ? 1.15 : 1 / 1.15)
}
function onDragStart(event: MouseEvent) {
  drag = { x: event.clientX, y: event.clientY, vx: view.value.x, vy: view.value.y }
  dragged = false
}
function onDragMove(event: MouseEvent) {
  if (!drag || !modal.value) return
  const bounds = document.querySelector('.ps-cloud-modal .mbody')?.getBoundingClientRect()
  if (!bounds) return
  const scale = Math.max(view.value.w / bounds.width, view.value.h / bounds.height)
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true
  view.value = { ...view.value, x: drag.vx - dx * scale, y: drag.vy - dy * scale }
}
function onDragEnd() { drag = null }
function onModalClick(event: MouseEvent) {
  if (dragged) return
  const node = (event.target as Element).closest('[data-pid]')
  if (node) emit('select', node.getAttribute('data-pid') || props.pointId)
}
function onKey(event: KeyboardEvent) { if (event.key === 'Escape') closeModal() }
onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
})
</script>
