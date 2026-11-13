<template>
  <div v-if="side === 'structure'" ref="host" class="ps-canvas-host" :style="{ height: `${Math.round(230 * scale)}px` }">
    <div class="ps-canvas" :style="{ transform: `scale(${scale})` }">
      <div class="ps-abs" style="left:0;top:186px;width:568px;height:2px;background:#cbd5e1"></div>
      <div class="ps-abs ps-truck" style="left:14px;top:168px;width:50px;height:18px">端梁</div>
      <div class="ps-abs ps-truck" style="left:504px;top:168px;width:50px;height:18px">端梁</div>
      <div class="ps-abs" style="left:34px;top:130px;width:500px;height:38px;background:#dbeafe;border:1.5px solid #60a5fa;border-radius:3px"></div>
      <div v-for="mark in stations" :key="mark.t" class="ps-abs ps-station" :style="{ left: `${mark.x}px` }">{{ mark.t }}</div>
      <div v-if="callout" class="ps-leader" :style="callout.line"></div>
      <button
        v-for="mark in marks"
        :key="mark.id"
        type="button"
        class="ps-dot"
        :class="{ dim: hiddenIds.includes(mark.id) }"
        :style="mark.style"
        :aria-label="mark.aria"
        @click="$emit('select', mark.id)"
        @mouseenter="hoverId = mark.id"
        @mouseleave="hoverId = ''"
      ></button>
      <div v-if="callout" class="ps-callout" :style="callout.box">
        <b>{{ callout.name }}</b>
        <span>{{ callout.id }}</span>
        <span>{{ callout.status }}</span>
      </div>
    </div>
  </div>
  <div v-else ref="host" class="ps-mech">
    <div class="m-motor">电机</div>
    <div class="m-shaft m-shaft-a"></div>
    <div class="m-couple"></div>
    <div class="m-couple-label">联轴器·制动器</div>
    <div class="m-shaft m-shaft-b"></div>
    <div class="m-reducer">减速器</div>
    <div class="m-shaft m-shaft-c"></div>
    <div class="m-shaft m-shaft-d"></div>
    <div class="m-shaft m-shaft-e"></div>
    <div class="m-drum">卷筒</div>
    <div class="m-bearing"></div>
    <div v-if="callout" class="ps-leader" :style="callout.line"></div>
    <button
      v-for="mark in marks"
      :key="mark.id"
      type="button"
      class="ps-dot"
      :class="{ dim: hiddenIds.includes(mark.id) }"
      :style="mark.style"
      :aria-label="mark.aria"
      @click="$emit('select', mark.id)"
      @mouseenter="hoverId = mark.id"
      @mouseleave="hoverId = ''"
    ></button>
    <div v-if="callout" class="ps-callout" :style="callout.box">
      <b>{{ callout.name }}</b>
      <span>{{ callout.id }}</span>
      <span>{{ callout.status }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { TONE_TEXT, type SchemePoint, type Side } from '@/mock/pointSchemeData'

const props = defineProps<{
  side: Side
  vertical?: boolean
  points: SchemePoint[]
  selectedId: string
  hiddenIds: string[]
}>()
defineEmits<{ select: [id: string] }>()

const host = ref<HTMLElement | null>(null)
const width = ref(568)
const hoverId = ref('')
let observer: ResizeObserver | null = null

const STRUCT = [
  { id: 'ML-01', sec: 'top', pos: 0.5 },
  { id: 'ML-02', sec: 'bot', pos: 0.5 },
  { id: 'ML-03', sec: 'top', pos: 0.25 },
  { id: 'ML-04', sec: 'bot', pos: 0.25 },
  { id: 'ML-05', sec: 'top', pos: 0.75 },
  { id: 'ML-06', sec: 'bot', pos: 0.75 },
  { id: 'ML-07', sec: 'top', pos: 0.04 },
  { id: 'ML-08', sec: 'bot', pos: 0.08 },
  { id: 'ML-09', sec: 'web', pos: 0.62 },
  { id: 'ML-10', sec: 'top', pos: 0.96 }
] as const
const MECH = [
  { id: 'M-01', x: 16.9, y: 62 },
  { id: 'G-01', x: 32, y: 46 },
  { id: 'G-02', x: 40, y: 62 },
  { id: 'G-03', x: 50, y: 76 },
  { id: 'D-01', x: 91, y: 62 }
] as const
const COLOR = { ok: '#16a34a', warn: '#f59e0b', alarm: '#e5484d' }
const stations = [
  { t: '0', x: 14 },
  { t: 'L/4', x: 139 },
  { t: 'L/2', x: 264 },
  { t: '3L/4', x: 389 },
  { t: 'L', x: 514 }
]

const scale = computed(() => Math.min(1, width.value / 568))

function place(point: SchemePoint) {
  if (props.side === 'mechanism') {
    const spec = MECH.find(item => item.id === point.id)
    return { x: spec?.x ?? 50, y: spec?.y ?? 60, above: true, unit: '%' as const }
  }
  const spec = STRUCT.find(item => item.id === point.id)
  const pos = spec?.pos ?? 0.5
  const sec = spec?.sec ?? 'top'
  return {
    x: 34 + pos * 500,
    y: sec === 'top' ? 130 : sec === 'bot' ? 168 : 149,
    above: sec === 'top',
    unit: 'px' as const
  }
}

const marks = computed(() => props.points.map(point => {
  const geo = place(point)
  const color = COLOR[point.status]
  const selected = point.id === props.selectedId
  const unit = geo.unit
  return {
    id: point.id,
    aria: `${point.id} ${point.name} ${TONE_TEXT[point.status]}`,
    style: {
      left: `calc(${geo.x}${unit} - 9px)`,
      top: `calc(${geo.y}${unit} - 9px)`,
      borderColor: color,
      background: point.measured ? color : '#fff',
      boxShadow: selected ? '0 0 0 3px #fff, 0 0 0 5px #1677ff' : 'none',
      zIndex: selected ? 2 : 1
    }
  }
}))

const callout = computed(() => {
  const id = hoverId.value && props.points.some(point => point.id === hoverId.value) ? hoverId.value : props.selectedId
  const point = props.points.find(item => item.id === id)
  if (!point || props.hiddenIds.includes(point.id)) return null
  const geo = place(point)
  if (geo.unit === '%') {
    const left = Math.max(22, Math.min(78, geo.x))
    return {
      name: point.name,
      id: point.id,
      status: TONE_TEXT[point.status],
      box: { left: `${left}%`, top: '2px' },
      line: { left: `${geo.x}%`, top: '28px', height: `calc(${geo.y}% - 36px)` }
    }
  }
  const top = geo.above ? geo.y - 66 : geo.y + 26
  const left = Math.max(90, Math.min(478, geo.x))
  const lineTop = geo.above ? top + 28 : geo.y + 9
  const lineHeight = geo.above ? geo.y - 9 - (top + 28) : top - (geo.y + 9)
  return {
    name: point.name,
    id: point.id,
    status: TONE_TEXT[point.status],
    box: { left: `${left}px`, top: `${top}px` },
    line: { left: `${geo.x}px`, top: `${lineTop}px`, height: `${Math.max(0, lineHeight)}px` }
  }
})

function measure() {
  const next = host.value?.clientWidth ?? 568
  if (next > 0 && next !== width.value) width.value = next
}
onMounted(() => {
  measure()
  if (!host.value) return
  observer = new ResizeObserver(() => measure())
  observer.observe(host.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.ps-canvas-host { position: relative; width: 100%; overflow: hidden; }
.ps-canvas { position: absolute; left: 0; top: 0; width: 568px; height: 230px; transform-origin: top left; }
.ps-abs { position: absolute; box-sizing: border-box; }
.ps-truck, .m-motor, .m-reducer, .m-drum, .m-bearing {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  line-height: 16px;
}
.ps-truck { background: #e2e8f0; border: 1px solid #94a3b8; color: #475569; font-size: 11px; padding-top: 1px; border-radius: 3px; }
.ps-station { top: 196px; width: 40px; font-size: 11px; color: #6b7280; text-align: center; }
.ps-mech { position: relative; width: 100%; height: 210px; }
.m-motor, .m-reducer, .m-drum, .m-bearing { position: absolute; box-sizing: border-box; background: #dbeafe; border: 1.5px solid #60a5fa; color: #1e3a8a; padding-top: 4px; }
.m-motor { left: 2%; top: 48%; width: 14%; height: 28%; }
.m-reducer { left: 24%; top: 30%; width: 28%; height: 50%; align-items: flex-end; justify-content: flex-start; padding: 0 0 8px 8px; }
.m-drum { left: 56%; top: 52%; width: 30%; height: 26%; background: repeating-linear-gradient(90deg, #dbeafe 0 14px, #cfe0fb 14px 16px); }
.m-bearing { left: 89%; top: 48%; width: 8%; height: 22%; }
.m-couple { position: absolute; left: 17.5%; top: 56%; width: 4%; height: 14%; background: #e2e8f0; border: 1.5px solid #94a3b8; border-radius: 3px; }
.m-couple-label { position: absolute; left: 1%; top: 80%; width: 20%; text-align: center; font-size: 12px; line-height: 16px; color: #6b7280; }
.m-shaft { position: absolute; height: 4px; background: #64748b; border-radius: 2px; }
.m-shaft-a { left: 16%; top: 61%; width: 2%; }
.m-shaft-b { left: 21.5%; top: 61%; width: 2.5%; }
.m-shaft-c { left: 26%; top: 46%; width: 10%; }
.m-shaft-d { left: 34%; top: 60%; width: 10%; }
.m-shaft-e { left: 44%; top: 74%; width: 8%; }
.ps-dot {
  position: absolute;
  width: 18px;
  height: 18px;
  padding: 0;
  border-radius: 50%;
  border: 3px solid #16a34a;
  box-sizing: border-box;
  cursor: pointer;
}
.ps-dot.dim { opacity: 0.16; pointer-events: none; }
.ps-leader { position: absolute; width: 1.5px; background: #1677ff; }
.ps-callout {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: 13px;
  background: #1677ff;
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  z-index: 3;
}
.ps-callout b { font-weight: 700; }
.ps-callout span { font-size: 12px; opacity: 0.9; }
</style>
