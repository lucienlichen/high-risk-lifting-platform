<template>
  <button type="button" class="ov-card" :class="`is-${card.level}`" @click="emit('open')">
    <span class="ov-card-top">
      <span class="ov-code">{{ card.code }}</span>
      <span class="ov-work" :class="{ 'is-run': card.workLabel === '作业中' }">{{ card.workLabel }}</span>
      <span class="ov-status" :class="`is-${card.level}`">
        <i :class="{ pulse: card.level === 'red' }"></i>{{ levelText(card.level) }}
      </span>
    </span>
    <span class="ov-meta">{{ card.type }} · {{ card.capacityText }} · {{ card.unit }} {{ card.location }}</span>
    <span v-if="card.level === 'red' || card.level === 'yellow'" class="ov-alarm" :class="`is-${card.level}`">
      <b>{{ card.scene || '未标注事故' }}</b>
      <span>{{ card.message }}</span>
    </span>
    <span v-else-if="card.level === 'off'" class="ov-offnote">监测终端离线</span>
    <span v-if="!brief" class="ov-live">
      <span class="ov-live-top">
        <span><b>实时工况</b>　起重量 <b>{{ tons }}</b> / {{ card.ratedTons ?? '—' }} t</span>
        <b :class="loadClass">{{ card.loadPct == null ? '—' : card.loadPct + '%' }}</b>
      </span>
      <span class="ov-track"><i :class="loadClass" :style="{ width: barWidth }"></i></span>
      <span class="ov-metrics">
        <span>起升高度<b>—</b></span>
        <span>大车位置<b>—</b></span>
        <span>今日循环<b>—</b></span>
        <span>安全装置<b :class="safeClass">{{ card.safeText }}</b></span>
      </span>
    </span>
    <span class="ov-counts">
      <span v-for="item in card.counts" :key="item.label" class="ov-count" :class="item.tone">
        <b>{{ item.n }}</b>
        <em>{{ item.label }}</em>
      </span>
    </span>
    <span class="ov-card-foot">
      <span>健康评分 <b :class="healthClass">{{ card.health }}</b></span>
      <span>检验剩余 <b :class="inspClass">{{ inspLabel }}</b></span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { levelText, type OverviewCard } from '@/mock/overviewDemo'

const props = defineProps<{ card: OverviewCard; brief?: boolean }>()
const emit = defineEmits<{ open: [] }>()

const tons = computed(() => props.card.curTons == null ? '—' : props.card.curTons.toFixed(1))
const barWidth = computed(() => `${Math.min(props.card.loadPct ?? 0, 100)}%`)
const loadClass = computed(() => {
  const pct = props.card.loadPct
  if (pct == null) return ''
  if (pct > 100) return 'is-over'
  if (pct >= 90) return 'is-hot'
  return ''
})
const safeClass = computed(() => props.card.safeText === '预警' ? 'bad' : props.card.safeText === '报警' ? 'warn' : 'ok')
const healthClass = computed(() => props.card.riskLevel === 'high' ? 'bad' : props.card.riskLevel === 'medium' ? 'warn' : '')
const inspClass = computed(() => {
  if (props.card.inspStatus === 'overdue' || props.card.inspStatus === 'urgent') return 'bad'
  if (props.card.inspStatus === 'warning') return 'warn'
  return ''
})
const inspLabel = computed(() => {
  if (props.card.inspDays == null) return '—'
  if (props.card.inspDays < 0) return `超期 ${-props.card.inspDays} 天`
  return `${props.card.inspDays} 天`
})
</script>
