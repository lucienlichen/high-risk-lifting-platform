<template>
  <div class="ps-stage" :class="{ vertical, mechanism: side === 'mechanism' }">
    <svg :viewBox="box" class="ps-svg" role="img" :aria-label="side === 'structure' ? '结构测点' : '机构测点'">
      <template v-if="side === 'structure' && !vertical">
        <rect x="28" y="104" width="46" height="36" rx="2" class="truck" />
        <rect x="966" y="104" width="46" height="36" rx="2" class="truck" />
        <text x="51" y="126" text-anchor="middle" class="truck-tx">端梁</text>
        <text x="989" y="126" text-anchor="middle" class="truck-tx">端梁</text>
        <rect x="68" y="108" width="904" height="28" class="beam" />
        <line x1="68" y1="108" x2="972" y2="108" class="flange" />
        <line x1="68" y1="136" x2="972" y2="136" class="flange" />
        <g class="dim">
          <line x1="78" y1="168" x2="962" y2="168" />
          <template v-for="mark in structStations" :key="mark.t">
            <line :x1="mark.x" y1="162" :x2="mark.x" y2="174" />
            <text :x="mark.x" y="188" text-anchor="middle">{{ mark.t }}</text>
          </template>
        </g>
      </template>
      <template v-else-if="side === 'structure' && vertical">
        <rect x="168" y="18" width="64" height="12" rx="1" class="truck" />
        <rect x="168" y="470" width="64" height="12" rx="1" class="truck" />
        <rect x="186" y="28" width="28" height="444" class="beam" />
        <line x1="186" y1="28" x2="186" y2="472" class="flange" />
        <line x1="214" y1="28" x2="214" y2="472" class="flange" />
      </template>
      <template v-else-if="!vertical">
        <line x1="188" y1="118" x2="900" y2="118" class="shaft" />
        <rect x="36" y="78" width="150" height="80" rx="4" class="box" />
        <text x="111" y="124" text-anchor="middle" class="box-tx">电机</text>
        <rect x="196" y="102" width="34" height="32" class="box" />
        <text x="213" y="152" text-anchor="middle" class="tiny">联轴器·制动器</text>
        <rect x="268" y="62" width="230" height="112" rx="4" class="box" />
        <text x="383" y="124" text-anchor="middle" class="box-tx">减速器</text>
        <line x1="498" y1="150" x2="430" y2="150" class="shaft" />
        <rect x="530" y="86" width="340" height="64" class="box" />
        <line x1="548" y1="104" x2="852" y2="104" class="wire" />
        <line x1="548" y1="118" x2="852" y2="118" class="wire" />
        <line x1="548" y1="132" x2="852" y2="132" class="wire" />
        <text x="700" y="122" text-anchor="middle" class="box-tx">卷筒</text>
        <rect x="888" y="92" width="78" height="52" rx="3" class="box" />
        <text x="927" y="122" text-anchor="middle" class="box-tx">轴承座</text>
      </template>
      <template v-else>
        <line x1="92" y1="78" x2="92" y2="430" class="shaft" />
        <rect x="36" y="16" width="112" height="56" rx="4" class="box" />
        <text x="92" y="48" text-anchor="middle" class="box-tx">电机</text>
        <rect x="68" y="92" width="48" height="26" class="box" />
        <text x="92" y="132" text-anchor="middle" class="tiny">联轴器·制动器</text>
        <rect x="28" y="148" width="128" height="118" rx="4" class="box" />
        <text x="92" y="210" text-anchor="middle" class="box-tx">减速器</text>
        <line x1="40" y1="248" x2="156" y2="248" class="shaft" />
        <rect x="40" y="286" width="104" height="78" class="box" />
        <line x1="52" y1="306" x2="132" y2="306" class="wire" />
        <line x1="52" y1="322" x2="132" y2="322" class="wire" />
        <line x1="52" y1="338" x2="132" y2="338" class="wire" />
        <text x="92" y="330" text-anchor="middle" class="box-tx">卷筒</text>
        <rect x="52" y="384" width="80" height="40" rx="3" class="box" />
        <text x="92" y="408" text-anchor="middle" class="box-tx">轴承座</text>
      </template>
      <g
        v-for="mark in marks"
        :key="mark.id"
        class="mk"
        :class="[mark.status, { on: mark.id === selectedId, twin: !mark.measured, dim: hiddenIds.includes(mark.id) }]"
        :data-marker="mark.id"
        @click="$emit('select', mark.id)"
      >
        <circle v-if="mark.id === selectedId" class="halo" :cx="mark.x" :cy="mark.y" r="9" />
        <circle class="dot" :cx="mark.x" :cy="mark.y" r="5" />
        <rect class="pill" :x="mark.lx - mark.w / 2" :y="mark.ly - 9" :width="mark.w" height="18" rx="9" />
        <text class="pill-tx" :x="mark.lx" :y="mark.ly + 4" text-anchor="middle">
          {{ mark.name }} {{ mark.id }} <tspan class="st">{{ TONE_TEXT[mark.status] }}</tspan>
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TONE_TEXT, type SchemePoint, type Side, type Tone } from '@/mock/pointSchemeData'

const props = defineProps<{
  side: Side
  vertical?: boolean
  points: SchemePoint[]
  selectedId: string
  hiddenIds: string[]
}>()
defineEmits<{ select: [id: string] }>()

const structStations = [
  { t: '0', x: 90 },
  { t: 'L/4', x: 300 },
  { t: 'L/2', x: 520 },
  { t: '3L/4', x: 740 },
  { t: 'L', x: 950 }
]

interface Geom { x: number; y: number; ly: number; edge?: 'left' | 'right'; lx?: number }
const H_STRUCT: Record<string, Geom> = {
  'ML-07': { x: 120, y: 112, ly: 78 },
  'ML-03': { x: 300, y: 112, ly: 78 },
  'ML-01': { x: 520, y: 112, ly: 78 },
  'ML-05': { x: 740, y: 112, ly: 78 },
  'ML-10': { x: 930, y: 112, ly: 78 },
  'ML-08': { x: 200, y: 132, ly: 168 },
  'ML-04': { x: 370, y: 132, ly: 168 },
  'ML-02': { x: 520, y: 132, ly: 176 },
  'ML-06': { x: 780, y: 132, ly: 168 },
  'ML-09': { x: 610, y: 152, ly: 204, edge: 'right', lx: 640 }
}
const V_STRUCT: Record<string, Geom> = {
  'ML-07': { x: 188, y: 72, ly: 72, edge: 'left', lx: 172 },
  'ML-03': { x: 188, y: 168, ly: 168, edge: 'left', lx: 172 },
  'ML-01': { x: 188, y: 264, ly: 264, edge: 'left', lx: 172 },
  'ML-05': { x: 188, y: 360, ly: 360, edge: 'left', lx: 172 },
  'ML-10': { x: 188, y: 448, ly: 448, edge: 'left', lx: 172 },
  'ML-08': { x: 212, y: 72, ly: 72, edge: 'right', lx: 228 },
  'ML-04': { x: 212, y: 168, ly: 168, edge: 'right', lx: 228 },
  'ML-02': { x: 212, y: 264, ly: 264, edge: 'right', lx: 228 },
  'ML-09': { x: 212, y: 320, ly: 320, edge: 'right', lx: 228 },
  'ML-06': { x: 212, y: 416, ly: 416, edge: 'right', lx: 228 }
}
const H_MECH: Record<string, Geom> = {
  'M-01': { x: 196, y: 118, ly: 56 },
  'G-01': { x: 330, y: 118, ly: 40 },
  'G-03': { x: 512, y: 118, ly: 40 },
  'G-02': { x: 400, y: 150, ly: 190 },
  'D-01': { x: 927, y: 100, ly: 52 }
}
const V_MECH: Record<string, Geom> = {
  'M-01': { x: 92, y: 84, ly: 84, edge: 'right', lx: 168 },
  'G-01': { x: 36, y: 176, ly: 176, edge: 'right', lx: 168 },
  'G-02': { x: 92, y: 214, ly: 214, edge: 'right', lx: 168 },
  'G-03': { x: 156, y: 248, ly: 248, edge: 'right', lx: 168 },
  'D-01': { x: 132, y: 404, ly: 404, edge: 'right', lx: 168 }
}

const box = computed(() => {
  if (props.side === 'structure') return props.vertical ? '0 0 420 500' : '0 0 1040 230'
  return props.vertical ? '0 0 340 460' : '0 0 1040 220'
})

function textWidth(text: string) {
  let width = 16
  for (const char of text) width += char.charCodeAt(0) > 127 ? 11 : 6.3
  return width
}

const marks = computed(() => {
  const table = props.side === 'structure'
    ? (props.vertical ? V_STRUCT : H_STRUCT)
    : (props.vertical ? V_MECH : H_MECH)
  return props.points.map(point => {
    const geom = table[point.id]
    const label = `${point.name} ${point.id} ${TONE_TEXT[point.status]}`
    const w = textWidth(label)
    const lx = geom.edge === 'left'
      ? (geom.lx ?? geom.x) - w / 2
      : geom.edge === 'right'
        ? (geom.lx ?? geom.x) + w / 2
        : (geom.lx ?? geom.x)
    return { ...point, ...geom, lx, w, status: point.status as Exclude<Tone, 'na'> }
  })
})
</script>
