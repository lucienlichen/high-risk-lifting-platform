<template>
  <div class="ps-stage" :class="{ vertical, mechanism: side === 'mechanism' }">
    <svg v-if="side === 'structure' && !vertical" viewBox="0 0 960 168" class="ps-svg" aria-hidden="true">
      <rect x="18" y="62" width="52" height="48" rx="3" class="truck" />
      <rect x="890" y="62" width="52" height="48" rx="3" class="truck" />
      <text x="44" y="90" text-anchor="middle">端梁</text>
      <text x="916" y="90" text-anchor="middle">端梁</text>
      <rect x="64" y="70" width="832" height="34" class="beam" />
      <line x1="64" y1="70" x2="896" y2="70" class="flange" />
      <line x1="64" y1="104" x2="896" y2="104" class="flange" />
      <g class="dim">
        <line x1="70" y1="132" x2="890" y2="132" />
        <g v-for="mark in structMarks" :key="mark.t">
          <line :x1="mark.x" y1="126" :x2="mark.x" y2="138" />
          <text :x="mark.x" y="152" text-anchor="middle">{{ mark.t }}</text>
        </g>
      </g>
    </svg>
    <svg v-else-if="side === 'structure' && vertical" viewBox="0 0 220 360" class="ps-svg" aria-hidden="true">
      <rect x="78" y="16" width="64" height="328" class="beam" />
      <line x1="78" y1="16" x2="78" y2="344" class="flange" />
      <line x1="142" y1="16" x2="142" y2="344" class="flange" />
      <g class="dim">
        <text x="168" y="28">0</text>
        <text x="168" y="108">L/4</text>
        <text x="168" y="186">L/2</text>
        <text x="168" y="264">3L/4</text>
        <text x="168" y="340">L</text>
      </g>
    </svg>
    <svg v-else-if="!vertical" viewBox="0 0 960 168" class="ps-svg" aria-hidden="true">
      <line x1="150" y1="86" x2="860" y2="86" class="shaft" />
      <rect x="36" y="48" width="128" height="76" rx="4" class="box" />
      <text x="100" y="92" text-anchor="middle">电机</text>
      <rect x="176" y="70" width="36" height="32" class="box" />
      <text x="194" y="122" text-anchor="middle" class="tiny">联轴器·制动器</text>
      <rect x="250" y="40" width="210" height="92" rx="4" class="box" />
      <text x="355" y="92" text-anchor="middle">减速器</text>
      <rect x="500" y="58" width="300" height="56" class="box" />
      <line x1="516" y1="72" x2="784" y2="72" class="wire" />
      <line x1="516" y1="86" x2="784" y2="86" class="wire" />
      <line x1="516" y1="100" x2="784" y2="100" class="wire" />
      <text x="650" y="92" text-anchor="middle">卷筒</text>
      <rect x="830" y="62" width="70" height="48" rx="4" class="box" />
      <text x="865" y="90" text-anchor="middle">轴承座</text>
    </svg>
    <svg v-else viewBox="0 0 220 420" class="ps-svg" aria-hidden="true">
      <line x1="78" y1="48" x2="78" y2="390" class="shaft" />
      <rect x="28" y="16" width="100" height="52" rx="4" class="box" />
      <text x="78" y="46" text-anchor="middle">电机</text>
      <rect x="46" y="82" width="64" height="28" class="box" />
      <text x="78" y="100" text-anchor="middle" class="tiny">联轴器·制动器</text>
      <rect x="22" y="126" width="112" height="110" rx="4" class="box" />
      <text x="78" y="186" text-anchor="middle">减速器</text>
      <rect x="30" y="252" width="96" height="78" class="box" />
      <line x1="42" y1="272" x2="114" y2="272" class="wire" />
      <line x1="42" y1="288" x2="114" y2="288" class="wire" />
      <line x1="42" y1="304" x2="114" y2="304" class="wire" />
      <text x="78" y="298" text-anchor="middle">卷筒</text>
      <rect x="40" y="348" width="76" height="40" rx="4" class="box" />
      <text x="78" y="372" text-anchor="middle">轴承座</text>
    </svg>
    <button
      v-for="point in points"
      :key="point.id"
      type="button"
      class="ps-tag"
      :class="[point.status, point.vSide, { on: point.id === selectedId, twin: !point.measured, dim: hiddenIds.includes(point.id) }]"
      :style="place(point)"
      :data-marker="point.id"
      @click="$emit('select', point.id)"
    >
      <i></i>
      <em>{{ point.name }} {{ point.id }} <b>{{ TONE_TEXT[point.status] }}</b></em>
    </button>
  </div>
</template>

<script setup lang="ts">
import { TONE_TEXT, type SchemePoint, type Side } from '@/mock/pointSchemeData'

const props = defineProps<{
  side: Side
  vertical?: boolean
  points: SchemePoint[]
  selectedId: string
  hiddenIds: string[]
}>()
defineEmits<{ select: [id: string] }>()

const structMarks = [
  { t: '0', x: 70 },
  { t: 'L/4', x: 275 },
  { t: 'L/2', x: 480 },
  { t: '3L/4', x: 685 },
  { t: 'L', x: 890 }
]

function place(point: SchemePoint) {
  if (props.vertical) return { left: `${point.vx}%`, top: `${point.vy}%` }
  return { left: `${point.hx}%`, top: `${point.hy}%` }
}
</script>
