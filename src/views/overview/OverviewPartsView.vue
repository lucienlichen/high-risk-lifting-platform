<template>
  <div class="device-view-root">
    <header v-if="card" class="pl-head">
      <button type="button" class="pl-back" @click="back">返回</button>
      <span>{{ card.code }}</span>
      <span>{{ card.type || '—' }}</span>
      <span class="pl-lamp" :class="`is-${card.lamp === 'normal' ? 'green' : card.lamp}`">{{ severityLabel(card.lamp) }}</span>
    </header>
    <p v-else class="ov-missing">没有这台设备。</p>

    <div v-if="card" class="device-content-region">
      <div class="content-scrollable">
        <div class="pl-pills" role="tablist" aria-label="专业">
          <button type="button" class="pl-pill pl-all" :class="{ 'is-on': !filterId }" :aria-selected="!filterId" @click="showAll">全部专业</button>
          <button
            v-for="spec in specs"
            :key="spec.id"
            type="button"
            class="pl-pill"
            :class="[`is-${spec.status}`, { 'is-on': spec.id === filterId, 'is-alert': spec.id === alertSpecId && spec.id !== filterId }]"
            role="tab"
            :aria-selected="spec.id === filterId"
            @click="choose(spec.id)"
          >
            <span>{{ spec.label }}</span>
            <b v-if="spec.red + spec.yellow">{{ spec.red + spec.yellow }}</b>
          </button>
        </div>

        <section
          v-for="spec in shown"
          :key="spec.id"
          class="pl-section"
          :class="{ 'is-alert': spec.id === alertSpecId }"
          :aria-label="`${spec.label}分解`"
        >
          <h2 class="pl-section-title" :class="`is-${spec.status}`">{{ spec.label }}</h2>
          <div class="pl-forest" :style="{ '--cols': String(columnsOf(spec.nodes)) }">
            <PartLineNode
              v-for="node in spec.nodes"
              :key="partPathKey(node)"
              :node="node"
              :selected="selectedPath"
              @open="openNode(spec.id, $event)"
            />
          </div>
        </section>
        <p class="pl-legend">
          <i class="is-red"></i>报警
          <i class="is-yellow"></i>异常
          <i class="is-green"></i>正常
          <i class="is-off"></i>未接入
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PartLineNode from '@/components/overview/PartLineNode.vue'
import type { SpecialtyId } from '@/config/specialtyDict'
import { severityLabel } from '@/config/statusDict'
import { latestAlert, specialtyOfAlarm } from '@/mock/alertSpecialty'
import { getOverviewCard } from '@/mock/overviewDemo'
import { buildPartGraph, partPathKey, type PartGraphNode } from '@/mock/partGraph'
import { overviewAccessOf, useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const card = computed(() => getOverviewCard(String(route.params.id || '')))
const specs = computed(() => card.value ? buildPartGraph(card.value) : [])
const filterId = computed(() => {
  const requested = queryText(route.query.spec)
  return specs.value.some(item => item.id === requested) ? requested as SpecialtyId : null
})
const shown = computed(() => filterId.value ? specs.value.filter(item => item.id === filterId.value) : specs.value)
const selectedPath = computed(() => queryText(route.query.node))
const alertSpecId = computed(() => {
  const latest = card.value ? latestAlert(card.value.overview.alarms) : null
  const id = latest ? specialtyOfAlarm(latest) : null
  return id
})

watch(card, current => {
  const access = overviewAccessOf(auth)
  if (!current || access.kind === 'super') return
  const outsideEnterprise = current.enterprise !== access.enterprise
  const outsideUnit = access.kind === 'factory' && current.unit !== access.unit
  if (!outsideEnterprise && !outsideUnit) return
  router.replace({
    name: 'overviewPlant',
    query: { enterprise: access.enterprise || '', ...(access.unit ? { unit: access.unit } : {}) }
  })
}, { immediate: true })

function queryText(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] || '')
  return String(value || '')
}
function columnsOf(nodes: PartGraphNode[]): number {
  const depth = (node: PartGraphNode): number => node.children?.length ? 1 + Math.max(...node.children.map(depth)) : 1
  return Math.max(1, ...nodes.map(depth))
}
function cleanQuery(): Record<string, string> {
  const query: Record<string, string> = {}
  const enterprise = queryText(route.query.enterprise)
  const unit = queryText(route.query.unit)
  if (enterprise) query.enterprise = enterprise
  if (unit) query.unit = unit
  return query
}
function showAll() {
  router.replace({ query: cleanQuery() })
}
function choose(id: SpecialtyId) {
  if (filterId.value === id) {
    showAll()
    return
  }
  router.replace({ query: { ...cleanQuery(), spec: id } })
}
function openNode(specId: SpecialtyId, node: PartGraphNode) {
  const current = card.value
  if (!current) return
  const query: Record<string, string> = {
    ...cleanQuery(),
    spec: specId,
    node: partPathKey(node),
    parts: filterId.value || 'all'
  }
  if (node.alarmId) query.alarm = node.alarmId
  router.push({ name: 'overviewDevice', params: { id: current.id }, query })
}
function back() {
  router.push({ name: 'overviewPlant', query: cleanQuery() })
}
</script>

<style scoped>
.pl-head {
  height: 36px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px;
  font-size: 13px;
  color: #8c8c8c;
  background: transparent;
  flex: none;
}
.pl-back {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  color: #8c8c8c;
  cursor: pointer;
}
.pl-lamp { display: inline-flex; align-items: center; gap: 6px; }
.pl-lamp::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.pl-lamp.is-red { color: #f5222d; }
.pl-lamp.is-yellow { color: #d48806; }
.pl-lamp.is-green { color: #16a34a; }
.pl-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.pl-pill {
  height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  border: 2px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.pl-all.is-on { background: #0f172a; border-color: #0f172a; color: #fff; }
.pl-pill b {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: currentColor;
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}
.pl-pill.is-red {
  --ov-tile-bg: #fff1f0;
  --ov-tile-bg-hot: #ffccc7;
  --ov-tile-glow: rgba(245, 34, 45, .28);
  border-color: #f5222d;
  background: #fff1f0;
  color: #cf1322;
  animation: ov-tile-breathe 1.5s ease-in-out infinite;
}
.pl-pill.is-yellow {
  --ov-tile-bg: #fffbe6;
  --ov-tile-bg-hot: #fff1b8;
  --ov-tile-glow: rgba(250, 173, 20, .32);
  border-color: #faad14;
  background: #fffbe6;
  color: #d48806;
  animation: ov-tile-breathe 1.5s ease-in-out infinite;
}
.pl-pill.is-green { border-color: #16a34a; background: #f0fdf4; color: #15803d; }
.pl-pill.is-off { border: 1.5px dashed #94a3b8; background: #f8fafc; color: #64748b; }
.pl-pill.is-on { color: #fff; animation-name: ov-glow-breathe; }
.pl-pill.is-red.is-on { background: #f5222d; }
.pl-pill.is-yellow.is-on { background: #faad14; color: #3d2600; }
.pl-pill.is-yellow.is-on b { background: #3d2600; color: #fff; }
.pl-pill.is-green.is-on { background: #16a34a; }
.pl-pill.is-on b { background: #fff; color: inherit; }
.pl-section { margin-bottom: 22px; }
.pl-section-title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
  color: #334155;
}
.pl-section-title.is-red { color: #cf1322; }
.pl-section-title.is-yellow { color: #d48806; }
.pl-section-title.is-green { color: #15803d; }
.pl-section.is-alert .pl-section-title { box-shadow: inset 3px 0 0 currentColor; padding-left: 8px; }
.pl-forest {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(160px, 1fr));
  column-gap: 36px;
  row-gap: 12px;
  width: 100%;
  align-items: center;
}
.pl-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin: 4px 0 0; font-size: 12px; color: #64748b; }
.pl-legend i { width: 14px; height: 14px; border-radius: 4px; box-sizing: border-box; display: inline-block; }
.pl-legend i.is-red { border: 2px solid #f5222d; background: #fff1f0; }
.pl-legend i.is-yellow { border: 2px solid #faad14; background: #fffbe6; }
.pl-legend i.is-green { border: 2px solid #16a34a; background: #f0fdf4; }
.pl-legend i.is-off { border: 1.5px dashed #94a3b8; background: #f8fafc; }
@keyframes ov-glow-breathe {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50% { box-shadow: 0 0 12px 1px var(--ov-tile-glow); }
}
@media (prefers-reduced-motion: reduce) {
  .pl-pill.is-red,
  .pl-pill.is-yellow { animation: none; }
}
</style>
