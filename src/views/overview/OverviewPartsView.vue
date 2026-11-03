<template>
  <div class="device-view-root">
    <DeviceAreaBar v-if="areaParts.length" :parts="areaParts" />
    <DeviceInfoHeader
      v-if="card"
      :name="card.name"
      :status="headerStatus"
      :code="card.code"
      :type="card.type || '—'"
      :location="card.location"
      :unit="headerUnit"
      :install-date="headerInstall"
      @back="back"
    />
    <p v-else class="ov-missing">没有这台设备。</p>

    <div v-if="card" class="device-content-region">
      <div class="content-scrollable">
        <div class="pl-pills" role="tablist" aria-label="专业">
          <button
            v-for="spec in specs"
            :key="spec.id"
            type="button"
            class="pl-pill"
            :class="[`is-${spec.status}`, { 'is-on': spec.id === activeId }]"
            role="tab"
            :aria-selected="spec.id === activeId"
            @click="choose(spec.id)"
          >
            <span>{{ spec.label }}</span>
            <b v-if="spec.red + spec.yellow">{{ spec.red + spec.yellow }}</b>
          </button>
        </div>

        <section v-if="active" class="pl-board" :aria-label="`${active.label}分解`">
          <div class="pl-scroll">
            <div class="pl-stack">
              <PartLineNode
                v-for="node in active.nodes"
                :key="partPathKey(node)"
                :node="node"
                :selected="selectedPath"
                @open="openNode"
              />
            </div>
          </div>
          <p class="pl-legend">
            <i class="is-red"></i>报警
            <i class="is-yellow"></i>异常
            <i class="is-green"></i>正常
            <i class="is-off"></i>未接入
            <span>右上角 +n 是未画出的零件或分段。</span>
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DeviceAreaBar from '@/components/DeviceAreaBar.vue'
import DeviceInfoHeader from '@/components/DeviceInfoHeader.vue'
import PartLineNode from '@/components/overview/PartLineNode.vue'
import { getDeviceById } from '@/mock'
import type { SpecialtyId } from '@/config/specialtyDict'
import { latestAlert, specialtyOfAlarm } from '@/mock/alertSpecialty'
import { getOverviewCard } from '@/mock/overviewDemo'
import { buildPartGraph, partPathKey, type PartGraphNode } from '@/mock/partGraph'
import { overviewAccessOf, useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activeId = ref<SpecialtyId>('metal')
const card = computed(() => getOverviewCard(String(route.params.id || '')))
const ledgerDevice = computed(() => card.value ? getDeviceById(card.value.id) : null)
const specs = computed(() => card.value ? buildPartGraph(card.value) : [])
const active = computed(() => specs.value.find(item => item.id === activeId.value) || specs.value[0] || null)
const selectedPath = computed(() => queryText(route.query.node))
const headerStatus = computed(() => {
  if (card.value && !card.value.online) return 'offline' as const
  const status = ledgerDevice.value?.status
  if (status === 'running' || status === 'standby' || status === 'stopped') return status
  return card.value?.run === 'running' ? 'running' : 'standby'
})
const areaParts = computed(() => {
  const device = ledgerDevice.value
  if (device) return [device.group, device.affiliatedUnit, device.subsidiary, device.name].filter(Boolean)
  const current = card.value
  if (!current) return []
  return [current.enterpriseLabel, current.sector, current.unit, current.name].filter(Boolean)
})
const headerUnit = computed(() => ledgerDevice.value?.subsidiary || ledgerDevice.value?.group || card.value?.unit || '—')
const headerInstall = computed(() => ledgerDevice.value?.installDate || card.value?.yearText || '—')

watch(() => card.value?.id, () => {
  const requested = queryText(route.query.spec)
  const known = specs.value.some(item => item.id === requested)
  if (known) {
    activeId.value = requested as SpecialtyId
    return
  }
  const latest = card.value ? latestAlert(card.value.overview.alarms) : null
  const fromAlarm = latest ? specialtyOfAlarm(latest) : null
  activeId.value = fromAlarm || 'metal'
}, { immediate: true })

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
function choose(id: SpecialtyId) {
  activeId.value = id
  const query: Record<string, string> = { ...cleanQuery(), spec: id }
  delete query.node
  delete query.alarm
  router.replace({ query })
}
function openNode(node: PartGraphNode) {
  const current = card.value
  if (!current || !active.value) return
  const query: Record<string, string> = {
    ...cleanQuery(),
    spec: active.value.id,
    node: partPathKey(node)
  }
  if (node.alarmId) query.alarm = node.alarmId
  router.push({ name: 'overviewDevice', params: { id: current.id }, query })
}
function cleanQuery(): Record<string, string> {
  const query: Record<string, string> = {}
  const enterprise = queryText(route.query.enterprise)
  const unit = queryText(route.query.unit)
  if (enterprise) query.enterprise = enterprise
  if (unit) query.unit = unit
  return query
}
function back() {
  router.push({ name: 'overviewPlant', query: cleanQuery() })
}
</script>

<style scoped>
.pl-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
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
.pl-board {
  background: var(--color-card-bg);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 16px;
}
.pl-scroll { overflow-x: auto; padding-bottom: 4px; }
.pl-stack { display: flex; flex-direction: column; gap: 18px; width: max-content; min-width: 100%; }
.pl-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin: 14px 0 0; font-size: 12px; color: #64748b; }
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
