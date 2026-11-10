<template>
  <div ref="host" class="ps-canvas-host" :style="{ height: `${Math.round(230 * scale)}px` }">
    <div class="ps-canvas" :style="{ transform: `scale(${scale})` }">
      <template v-if="side === 'structure'">
        <div class="ps-abs" style="left:0;top:186px;width:568px;height:2px;background:#cbd5e1"></div>
        <div class="ps-abs ps-truck" style="left:14px;top:168px;width:50px;height:18px">端梁</div>
        <div class="ps-abs ps-truck" style="left:504px;top:168px;width:50px;height:18px">端梁</div>
        <div class="ps-abs" style="left:34px;top:130px;width:500px;height:38px;background:#dbeafe;border:1.5px solid #60a5fa;border-radius:3px"></div>
        <div v-for="mark in stations" :key="mark.t" class="ps-abs ps-station" :style="{ left: `${mark.x}px` }">{{ mark.t }}</div>
      </template>
      <template v-else>
        <div class="ps-abs ps-part" style="left:16px;top:120px;width:80px;height:60px">电机</div>
        <div class="ps-abs" style="left:96px;top:148px;width:18px;height:4px;background:#64748b;border-radius:2px"></div>
        <div class="ps-abs" style="left:114px;top:138px;width:16px;height:24px;background:#e2e8f0;border:1.5px solid #94a3b8;border-radius:3px"></div>
        <div class="ps-abs ps-small" style="left:84px;top:186px;width:80px">联轴器·制动器</div>
        <div class="ps-abs" style="left:130px;top:148px;width:14px;height:4px;background:#64748b;border-radius:2px"></div>
        <div class="ps-abs ps-part" style="left:144px;top:96px;width:150px;height:112px;justify-content:flex-start;padding-left:6px">减速器</div>
        <div class="ps-abs" style="left:144px;top:120px;width:60px;height:4px;background:#64748b;border-radius:2px"></div>
        <div class="ps-abs" style="left:196px;top:150px;width:60px;height:4px;background:#64748b;border-radius:2px"></div>
        <div class="ps-abs" style="left:250px;top:180px;width:64px;height:4px;background:#64748b;border-radius:2px"></div>
        <div class="ps-abs ps-part ps-drum" style="left:314px;top:140px;width:190px;height:60px">卷筒</div>
        <div class="ps-abs ps-part" style="left:504px;top:132px;width:34px;height:40px"></div>
      </template>
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
  { id: 'M-01', x: 96, y: 150 },
  { id: 'G-01', x: 168, y: 122 },
  { id: 'G-02', x: 222, y: 152 },
  { id: 'G-03', x: 276, y: 182 },
  { id: 'D-01', x: 520, y: 150 }
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
    return spec ? { x: spec.x, y: spec.y, above: true } : { x: 280, y: 140, above: true }
  }
  const spec = STRUCT.find(item => item.id === point.id)
  const pos = spec?.pos ?? 0.5
  const sec = spec?.sec ?? 'top'
  return {
    x: 34 + pos * 500,
    y: sec === 'top' ? 130 : sec === 'bot' ? 168 : 149,
    above: sec === 'top'
  }
}

const marks = computed(() => props.points.map(point => {
  const geo = place(point)
  const color = COLOR[point.status]
  const selected = point.id === props.selectedId
  return {
    id: point.id,
    aria: `${point.id} ${point.name} ${TONE_TEXT[point.status]}`,
    style: {
      left: `${geo.x - 9}px`,
      top: `${geo.y - 9}px`,
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
.ps-truck, .ps-part {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 1px;
  border-radius: 3px;
  font-size: 11px;
}
.ps-truck { background: #e2e8f0; border: 1px solid #94a3b8; color: #475569; line-height: 16px; }
.ps-part { background: #dbeafe; border: 1.5px solid #60a5fa; border-radius: 4px; color: #1e3a8a; font-size: 12px; padding-top: 4px; }
.ps-drum { background: repeating-linear-gradient(90deg, #dbeafe 0 14px, #cfe0fb 14px 16px); }
.ps-small { font-size: 11px; color: #6b7280; text-align: center; }
.ps-station { top: 196px; width: 40px; font-size: 11px; color: #6b7280; text-align: center; }
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
  height: 28px;
  padding: 0 12px;
  border-radius: 14px;
  background: #1677ff;
  color: #fff;
  font-size: 13px;
  white-space: nowrap;
  z-index: 3;
}
.ps-callout b { font-weight: 700; }
.ps-callout span { font-size: 12px; opacity: 0.9; }
</style>
