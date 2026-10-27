<template>
  <button type="button" class="ov-card" :class="`is-${card.state}`" :aria-label="`${card.code} ${card.workLabel} ${levelText(card.state)}`" @click="emit('open')">
    <span class="ov-run" :class="runClass">
      <svg v-if="card.run === 'running'" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1v6M5 7h6v2a3 3 0 1 1-3 3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" />
      </svg>
      <svg v-else-if="card.run === 'stopped'" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="4" y="3" width="2.4" height="10" rx="0.6" fill="#475569" />
        <rect x="9.6" y="3" width="2.4" height="10" rx="0.6" fill="#475569" />
      </svg>
      <svg v-else width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2.5" y="2.5" width="11" height="11" rx="2" fill="none" stroke="#64748b" stroke-width="1.4" stroke-dasharray="2.2 1.6" />
      </svg>
      {{ card.workLabel }}
      <i v-if="card.run === 'running'" class="ov-breath"></i>
    </span>
    <span class="ov-card-body">
      <span class="ov-card-top">
        <span class="ov-code" :title="metaTitle">{{ card.code }}</span>
        <span class="ov-status" :class="`is-${card.state}`">{{ levelText(card.state) }}</span>
      </span>
      <span v-if="!brief" class="ov-live">
        <span class="ov-lift">
          <span class="ov-lift-top">
            <span>起升重量 <b>{{ tons }}</b><small v-if="card.ratedTons != null"> / {{ card.ratedTons }} t</small></span>
            <b :class="loadClass">{{ card.loadPct == null ? '—' : card.loadPct + '%' }}</b>
          </span>
          <span class="ov-track"><i :class="loadClass" :style="{ width: barWidth }"></i></span>
        </span>
        <span class="ov-hoist" :title="liftTitle">
          <span>吊重次数</span>
          <b>今日 {{ liftText(card.todayLifts) }}</b>
          <b>累计 {{ liftText(card.totalLifts) }}</b>
        </span>
      </span>
      <span class="ov-counts">
        <span v-for="item in card.counts" :key="item.label" class="ov-count" :class="item.tone">
          <b>{{ item.n }}</b>
          <em>{{ item.label }}</em>
        </span>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OVERVIEW_CARD_RULES } from '@/mock/overviewCardRules'
import { levelText, type OverviewCard } from '@/mock/overviewDemo'

const props = defineProps<{ card: OverviewCard; brief?: boolean }>()
const emit = defineEmits<{ open: [] }>()

const metaTitle = computed(() => [props.card.type, props.card.capacityText, `${props.card.unit} ${props.card.location}`.trim()].filter(Boolean).join(' · '))
const tons = computed(() => props.card.curTons == null ? '—' : props.card.curTons.toFixed(1))
const barWidth = computed(() => `${Math.min(props.card.loadPct ?? 0, 100)}%`)
const loadClass = computed(() => {
  const pct = props.card.loadPct
  if (pct == null) return ''
  if (pct > OVERVIEW_CARD_RULES.loadOverPercent) return 'is-over'
  if (pct >= OVERVIEW_CARD_RULES.loadHotPercent) return 'is-hot'
  return ''
})
const runClass = computed(() => {
  if (props.card.run === 'running') return 'is-running'
  if (props.card.run === 'stopped') return 'is-stopped'
  return 'is-off'
})
const liftTitle = computed(() => {
  if (props.card.todayLifts == null) return '离线，不显示吊重次数'
  return `演示派生值。今日 ${props.card.todayLifts} 次为当日吊重作业；累计 ${props.card.totalLifts} 次按投用日期 × 日均 ${props.card.liftAvg} 次估算。`
})

function liftText(value: number | null) {
  if (value == null) return '—'
  if (value >= 10000) {
    const wan = value / 10000
    return `${wan >= 10 ? Math.round(wan) : wan.toFixed(1)}万`
  }
  return `${value}次`
}
</script>
