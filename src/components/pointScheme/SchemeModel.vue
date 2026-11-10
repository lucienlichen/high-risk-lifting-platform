<template>
  <div ref="stageEl" class="ps-stage" :class="{ mechanism: side === 'mechanism' }">
    <svg :viewBox="layout.box" class="ps-svg" preserveAspectRatio="xMidYMid meet" role="img" :aria-label="side === 'structure' ? '结构测点' : '机构测点'">
      <template v-if="side === 'structure'">
        <rect
          v-for="truck in layout.trucks"
          :key="truck.key"
          :x="truck.x"
          :y="truck.y"
          :width="truck.w"
          :height="truck.h"
          rx="3"
          class="truck"
        />
        <text
          v-for="truck in layout.trucks"
          :key="`${truck.key}-tx`"
          :x="truck.x + truck.w / 2"
          :y="truck.y + truck.h / 2"
          text-anchor="middle"
          dominant-baseline="central"
          class="truck-tx"
        >端梁</text>
        <rect :x="layout.beam.x" :y="layout.beam.y" :width="layout.beam.w" :height="layout.beam.h" class="beam" />
        <rect :x="layout.beam.x" :y="layout.beam.y" :width="layout.beam.w" :height="layout.flange" class="flange-plate" />
        <rect :x="layout.beam.x" :y="layout.beam.y + layout.beam.h - layout.flange" :width="layout.beam.w" :height="layout.flange" class="flange-plate" />
        <line
          v-for="web in layout.webs"
          :key="web"
          :x1="web"
          :y1="layout.beam.y + layout.flange"
          :x2="web"
          :y2="layout.beam.y + layout.beam.h - layout.flange"
          class="web"
        />
        <g class="dim">
          <line :x1="layout.beam.x" :y1="layout.stationY" :x2="layout.beam.x + layout.beam.w" :y2="layout.stationY" />
          <template v-for="mark in layout.stations" :key="mark.t">
            <line :x1="mark.x" :y1="layout.stationY - 6" :x2="mark.x" :y2="layout.stationY + 6" />
            <text :x="mark.x" :y="layout.stationY + 16" text-anchor="middle">{{ mark.t }}</text>
          </template>
        </g>
      </template>
      <template v-else>
        <line :x1="layout.shaft.x1" :y1="layout.shaft.y" :x2="layout.shaft.x2" :y2="layout.shaft.y" class="shaft" />
        <g v-for="part in layout.parts" :key="part.key">
          <rect :x="part.x" :y="part.y" :width="part.w" :height="part.h" rx="4" class="box" />
          <template v-if="part.key === 'drum'">
            <line
              v-for="wire in part.wires"
              :key="wire"
              :x1="part.x + 10"
              :y1="wire"
              :x2="part.x + part.w - 10"
              :y2="wire"
              class="wire"
            />
          </template>
        </g>
        <text
          v-for="part in layout.parts"
          :key="`${part.key}-tx`"
          :x="part.x + part.w / 2"
          :y="part.labelY"
          text-anchor="middle"
          class="box-tx"
        >
          <tspan
            v-for="(line, index) in part.lines"
            :key="line"
            :x="part.x + part.w / 2"
            :dy="index === 0 ? 0 : 16"
          >{{ line }}</tspan>
        </text>
      </template>
      <g
        v-for="mark in layout.marks"
        :key="mark.id"
        class="mk"
        :class="[mark.status, { on: mark.id === selectedId, twin: !mark.measured, dim: hiddenIds.includes(mark.id) }]"
        :data-marker="mark.id"
        @click="$emit('select', mark.id)"
      >
        <circle v-if="mark.id === selectedId" class="halo" :cx="mark.x" :cy="mark.y" r="13" />
        <circle class="dot" :cx="mark.x" :cy="mark.y" r="8" />
        <rect class="pill" :x="mark.lx - mark.w / 2" :y="mark.ly - 11" :width="mark.w" height="22" rx="11" />
        <text class="pill-tx" :x="mark.lx" :y="mark.ly" text-anchor="middle" dominant-baseline="central">
          {{ mark.name }} {{ mark.id }} <tspan class="st">{{ TONE_TEXT[mark.status] }}</tspan>
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { TONE_TEXT, type SchemePoint, type Side, type Tone } from '@/mock/pointSchemeData'

const props = defineProps<{
  side: Side
  vertical?: boolean
  points: SchemePoint[]
  selectedId: string
  hiddenIds: string[]
}>()
defineEmits<{ select: [id: string] }>()

const stageEl = ref<HTMLElement | null>(null)
const size = ref({ w: 360, h: 420 })
let observer: ResizeObserver | null = null

function measure() {
  const el = stageEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width))
  const h = Math.max(1, Math.round(rect.height))
  if (w !== size.value.w || h !== size.value.h) size.value = { w, h }
}

onMounted(() => {
  measure()
  if (!stageEl.value) return
  observer = new ResizeObserver(() => measure())
  observer.observe(stageEl.value)
})
onBeforeUnmount(() => observer?.disconnect())

function textWidth(text: string) {
  let width = 18
  for (const char of text) width += char.charCodeAt(0) > 255 ? 12 : 6.8
  return Math.ceil(width)
}

function clampCenter(center: number, width: number, limit: number) {
  return Math.min(Math.max(center, width / 2 + 2), Math.max(width / 2 + 2, limit - width / 2 - 2))
}

const STRUCT = [
  { id: 'ML-07', t: 0.08, band: 'top', row: 2 },
  { id: 'ML-03', t: 0.26, band: 'top', row: 1 },
  { id: 'ML-01', t: 0.5, band: 'top', row: 0 },
  { id: 'ML-05', t: 0.76, band: 'top', row: 1 },
  { id: 'ML-10', t: 0.92, band: 'top', row: 2 },
  { id: 'ML-08', t: 0.12, band: 'bottom', row: 2 },
  { id: 'ML-04', t: 0.34, band: 'bottom', row: 1 },
  { id: 'ML-02', t: 0.5, band: 'bottom', row: 0 },
  { id: 'ML-06', t: 0.86, band: 'bottom', row: 2 },
  { id: 'ML-09', t: 0.63, band: 'web', row: 0 }
] as const

const layout = computed(() => {
  const w = size.value.w
  const h = size.value.h
  const rowH = 24
  if (props.side === 'structure') {
    const stationH = 26
    const topReserve = 4 + rowH * 3
    const bottomReserve = 6 + rowH * 3 + stationH
    const beam = {
      x: 30,
      y: topReserve,
      w: Math.max(80, w - 60),
      h: Math.max(56, h - topReserve - bottomReserve)
    }
    const flange = Math.max(10, Math.round(beam.h * 0.08))
    const trucks = [
      { key: 'L', x: 6, y: beam.y - 12, w: 30, h: beam.h + 24 },
      { key: 'R', x: w - 36, y: beam.y - 12, w: 30, h: beam.h + 24 }
    ]
    const stationY = Math.min(h - 16, beam.y + beam.h + 14 + rowH * 2 + 18)
    const stations = [
      { t: '0', x: beam.x },
      { t: 'L/4', x: beam.x + beam.w * 0.25 },
      { t: 'L/2', x: beam.x + beam.w * 0.5 },
      { t: '3L/4', x: beam.x + beam.w * 0.75 },
      { t: 'L', x: beam.x + beam.w }
    ]
    const webs = [0.25, 0.5, 0.75].map(t => beam.x + beam.w * t)
    const byId = new Map(STRUCT.map(item => [item.id, item]))
    const marks = props.points.flatMap(point => {
      const spec = byId.get(point.id)
      if (!spec) return []
      const x = beam.x + beam.w * spec.t
      const y = spec.band === 'top'
        ? beam.y + flange / 2
        : spec.band === 'bottom'
          ? beam.y + beam.h - flange / 2
          : beam.y + beam.h / 2
      const label = `${point.name} ${point.id} ${TONE_TEXT[point.status]}`
      const pillW = textWidth(label)
      const ly = spec.band === 'top'
        ? beam.y - 14 - spec.row * rowH
        : spec.band === 'bottom'
          ? beam.y + beam.h + 14 + spec.row * rowH
          : y
      const lx = spec.band === 'web'
        ? clampCenter(x + pillW / 2 + 16, pillW, w)
        : clampCenter(x, pillW, w)
      return [{ ...point, x, y, lx, ly, w: pillW, status: point.status as Exclude<Tone, 'na'> }]
    })
    return { box: `0 0 ${w} ${h}`, beam, flange, trucks, stationY, stations, webs, parts: [], shaft: { x1: 0, y: 0, x2: 0 }, marks }
  }

  const topBand = 56
  const botBand = 32
  const gap = 8
  const pad = 8
  const fractions = [0.16, 0.16, 0.26, 0.24, 0.18]
  const specs = [
    { key: 'motor', label: '电机', lines: ['电机'] },
    { key: 'couple', label: '联轴器', lines: ['联轴器', '制动器'] },
    { key: 'reducer', label: '减速器', lines: ['减速器'] },
    { key: 'drum', label: '卷筒', lines: ['卷筒'] },
    { key: 'bearing', label: '轴承座', lines: ['轴承座'] }
  ]
  const inner = Math.max(40, w - pad * 2 - gap * (specs.length - 1))
  let cursor = pad
  const fullH = Math.max(72, h - topBand - botBand)
  const parts = specs.map((spec, index) => {
    const partW = inner * fractions[index]
    const partH = spec.key === 'couple' ? fullH * 0.78 : fullH
    const y = topBand + (fullH - partH) / 2
    const labelShift = spec.key === 'reducer' ? -partH * 0.16 : spec.key === 'drum' ? partH * 0.18 : 0
    const part = {
      ...spec,
      x: cursor,
      y,
      w: partW,
      h: partH,
      labelY: y + partH / 2 + labelShift - (spec.lines.length - 1) * 8,
      wires: [] as number[]
    }
    cursor += partW + gap
    if (spec.key === 'drum') {
      part.wires = [0.28, 0.4, 0.52, 0.64].map(ratio => part.y + part.h * ratio)
    }
    return part
  })
  const byKey = Object.fromEntries(parts.map(part => [part.key, part]))
  const reducer = byKey.reducer
  const motor = byKey.motor
  const bearing = byKey.bearing
  const places: Record<string, { x: number; y: number; ly: number }> = {
    'M-01': { x: motor.x + motor.w * 0.62, y: motor.y + 42, ly: 14 },
    'G-01': { x: reducer.x + reducer.w * 0.32, y: reducer.y + 42, ly: 38 },
    'G-02': { x: reducer.x + reducer.w * 0.38, y: reducer.y + reducer.h - 36, ly: h - 16 },
    'G-03': { x: reducer.x + reducer.w * 0.7, y: reducer.y + reducer.h * 0.66, ly: reducer.y + reducer.h * 0.66 - 28 },
    'D-01': { x: bearing.x + bearing.w * 0.55, y: bearing.y + 42, ly: 14 }
  }
  const marks = props.points.flatMap(point => {
    const place = places[point.id]
    if (!place) return []
    const label = `${point.name} ${point.id} ${TONE_TEXT[point.status]}`
    const pillW = textWidth(label)
    const ly = place.ly
    return [{
      ...point,
      x: place.x,
      y: place.y,
      lx: clampCenter(place.x, pillW, w),
      ly: Math.min(Math.max(ly, 12), h - 12),
      w: pillW,
      status: point.status as Exclude<Tone, 'na'>
    }]
  })
  const shaftY = topBand + fullH / 2
  return {
    box: `0 0 ${w} ${h}`,
    beam: { x: 0, y: 0, w: 0, h: 0 },
    flange: 0,
    trucks: [],
    stationY: 0,
    stations: [],
    webs: [],
    parts,
    shaft: { x1: motor.x + motor.w, y: shaftY, x2: bearing.x, y2: shaftY },
    marks
  }
})
</script>
