<template>
  <button type="button" class="ov-card" :class="`is-${tone}`" :aria-label="`${card.code} ${toneLabel}`" @click="emit('open')">
    <span class="ov-card-top">
      <svg class="ov-mark" viewBox="0 0 16 16" aria-hidden="true">
        <g v-if="shape === 'gantry'" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M3 13 V5 H13 V13" />
          <path d="M5 5 V3 H11 V5" />
          <path d="M8 5 V9" />
        </g>
        <g v-else-if="shape === 'portal'" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M8 13 V7" />
          <path d="M5 13 H11" />
          <path d="M8 7 L13 4" />
          <path d="M4 7 H8" />
        </g>
        <g v-else fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M2 6 H14" />
          <path d="M2 8 H14" />
          <path d="M4 8 V12 M12 8 V12" />
          <path d="M7 4 H10 V6" />
        </g>
      </svg>
      <span class="ov-code" :title="metaTitle">{{ card.code }}</span>
      <span class="ov-status" :class="`is-${tone}`">{{ toneLabel }}</span>
    </span>
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
const shape = computed(() => {
  const type = props.card.type || ''
  if (/门座/.test(type)) return 'portal'
  if (/门式/.test(type)) return 'gantry'
  return 'bridge'
})
const metaTitle = computed(() => [props.card.type, props.card.capacityText, `${props.card.unit} ${props.card.location}`.trim()].filter(Boolean).join(' · '))
</script>
