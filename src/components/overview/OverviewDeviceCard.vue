<template>
  <button type="button" class="ov-card" :class="`is-${tone}`" :aria-label="`${card.code} ${toneLabel}`" @click="emit('open')">
    <svg class="ov-sil" viewBox="0 0 160 72" aria-hidden="true">
      <g v-if="shape === 'gantry'" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
        <path d="M28 58 V22 H132 V58" />
        <path d="M46 22 V14 H114 V22" />
        <rect x="70" y="14" width="22" height="8" />
        <path d="M81 22 V40" />
        <path d="M74 40 h14 l-2 8 h-10 z" />
      </g>
      <g v-else-if="shape === 'portal'" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
        <path d="M78 58 V34" />
        <path d="M58 58 H98" />
        <path d="M70 34 H86" />
        <path d="M86 34 L128 18" />
        <path d="M128 18 V32" />
        <path d="M122 32 h12 l-2 7 h-8 z" />
        <path d="M48 34 H70" />
      </g>
      <g v-else fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
        <path d="M18 28 H142" />
        <path d="M18 36 H142" />
        <path d="M28 36 V50 M132 36 V50" />
        <path d="M22 50 H36 M126 50 H140" />
        <rect x="68" y="20" width="26" height="8" />
        <path d="M81 28 V46" />
        <path d="M74 46 h14 l-2 8 h-10 z" />
      </g>
    </svg>
    <span class="ov-code" :title="metaTitle">{{ card.code }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OverviewCard } from '@/mock/overviewDemo'

const props = defineProps<{ card: OverviewCard }>()
const emit = defineEmits<{ open: [] }>()

const tone = computed(() => props.card.lamp === 'red' ? 'red' : props.card.lamp === 'yellow' ? 'yellow' : 'green')
const toneLabel = computed(() => tone.value === 'red' ? '红' : tone.value === 'yellow' ? '黄' : '绿')
const shape = computed(() => {
  const type = props.card.type || ''
  if (/门座/.test(type)) return 'portal'
  if (/门式/.test(type)) return 'gantry'
  return 'bridge'
})
const metaTitle = computed(() => [props.card.type, props.card.capacityText, `${props.card.unit} ${props.card.location}`.trim()].filter(Boolean).join(' · '))
</script>
