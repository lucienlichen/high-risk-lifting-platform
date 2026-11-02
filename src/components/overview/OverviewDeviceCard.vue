<template>
  <button type="button" class="ov-card" :class="`is-${tone}`" :aria-label="`${card.code} ${toneLabel}`" :title="metaTitle" @click="emit('open')">
    <svg class="ov-silhouette" viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <g v-if="shape === 'gantry'">
        <path d="M16 34 V12 H48 V34" />
        <path d="M10 34 H54" />
        <path d="M26 12 V8 H38 V12" />
        <path d="M32 12 V22" />
        <path d="M32 22 C32 28 40 28 40 22" />
      </g>
      <g v-else-if="shape === 'jib'">
        <path d="M26 34 V16" />
        <path d="M16 34 H38" />
        <path d="M26 16 L52 6" />
        <path d="M14 18 H26" />
        <path d="M20 22 H32 V28 H20 Z" />
        <path d="M46 10 V20" />
        <path d="M46 20 C46 26 54 26 54 20" />
      </g>
      <g v-else-if="shape === 'bridge'">
        <path d="M4 14 H60" />
        <path d="M4 18 H60" />
        <path d="M10 18 V28 M16 18 V28 M8 28 H18" />
        <path d="M48 18 V28 M54 18 V28 M46 28 H56" />
        <path d="M26 10 H38 V14" />
        <path d="M32 14 V24" />
        <path d="M32 24 C32 30 40 30 40 24" />
      </g>
      <g v-else>
        <path d="M32 6 V16" />
        <path d="M22 8 H42" />
        <path d="M24 14 H40" />
        <path d="M32 16 C32 30 48 30 48 18" />
        <path d="M48 18 H42" />
      </g>
    </svg>
    <span class="ov-code">{{ card.code }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { severityLabel } from '@/config/statusDict'
import type { OverviewCard } from '@/mock/overviewDemo'

const props = defineProps<{ card: OverviewCard }>()
const emit = defineEmits<{ open: [] }>()

const tone = computed(() => props.card.lamp === 'red' ? 'red' : props.card.lamp === 'yellow' ? 'yellow' : 'green')
const toneLabel = computed(() => severityLabel(tone.value))
const shape = computed(() => craneShape(props.card.type || ''))
const metaTitle = computed(() => [props.card.code, props.card.type, props.card.capacityText, `${props.card.unit} ${props.card.location}`.trim()].filter(Boolean).join(' · '))

/** 门式优先于桥式，避免「门式单梁」被画成桥机。认不出的类型用吊钩。 */
function craneShape(type: string): 'bridge' | 'gantry' | 'jib' | 'hook' {
  if (/门式|装卸桥|岸边/.test(type)) return 'gantry'
  if (/门座|臂架|塔式|轮胎|流动|履带|汽车|随车|固定式/.test(type)) return 'jib'
  if (/桥式|单梁|双梁|悬挂|天车/.test(type)) return 'bridge'
  return 'hook'
}
</script>
