<template>
  <div class="ov-scroll">
    <div class="ov-page">
      <button type="button" class="ov-back" @click="back">‹ 返回设备安全态势</button>
      <section v-if="card" class="ov-device-head">
        <div>
          <div class="ov-idline">
            <h1>{{ card.name }}</h1>
            <span>{{ card.code }}</span>
            <span class="ov-status" :class="`is-${tone}`">{{ toneLabel }}</span>
          </div>
          <div class="ov-facts">
            <span>{{ card.unit }} · {{ card.location || '—' }}</span>
            <span>额定起重量 <b>{{ card.capacityText }}</b></span>
            <span>类型 <b>{{ card.type || '—' }}</b></span>
          </div>
        </div>
        <div>
          <div class="ov-actions">
            <button type="button" class="primary" @click="demo">派发工单</button>
            <button type="button" @click="demo">现场确认</button>
            <button type="button" @click="demo">标记误报</button>
          </div>
          <p v-if="hint" class="ov-demo-hint">{{ hint }}</p>
        </div>
      </section>
      <p v-else>没有这台设备。</p>

      <template v-if="card">
        <section v-if="hero" class="ov-hero" :class="{ 'is-yellow': hero.level === 'yellow' }">
          <p class="ov-hero-kicker">{{ card.code }} · {{ hero.level === 'red' ? '预警' : '报警' }}</p>
          <h2>{{ hero.text }}</h2>
          <div class="ov-hero-meta">
            <span>发生时间 <b>{{ hero.time }}</b></span>
            <span>数据来源 <b>{{ sourceOf(hero) }}</b></span>
            <span>关联对象 <b>{{ heroLink }}</b></span>
          </div>
        </section>
        <p v-else class="ov-hero-empty">当前没有需要处置的告警。</p>

        <template v-if="hero">
          <nav class="ov-spec-tabs" role="tablist" aria-label="专业">
            <button v-for="item in specialties" :key="item.id" type="button" role="tab" :class="{ active: specialty === item.id }" :aria-selected="specialty === item.id" @click="specialty = item.id">{{ item.label }}</button>
          </nav>
          <div class="ov-workbench">
            <aside class="ov-struct" :aria-label="`${specialtyName}模型`">
              <div class="ov-struct-caption">{{ specialtyName }}模型</div>
              <button
                v-for="row in modelRows"
                :key="row.id"
                type="button"
                class="ov-struct-btn"
                :class="{ active: row.hit, dim: row.dim }"
                :style="{ paddingLeft: `${8 + row.depth * 14}px` }"
                @click="focusRow(row)"
              >
                <span class="ov-struct-twist is-leaf"></span>
                <i class="ov-struct-lamp" :class="row.hit ? 'is-red' : 'is-none'"></i>
                <span class="name" :title="row.name">{{ row.name }}</span>
              </button>
              <p v-if="!modelRows.length" class="ov-sub">这一专业没有单独的结构分支。</p>
              <button type="button" class="ov-spec-full" @click="showFull = !showFull">{{ showFull ? '收起整机模型' : '查看整机模型拆解 →' }}</button>
            </aside>
            <section class="ov-block">
              <div class="ov-section-head">
                <h2>相关服务</h2>
                <span class="ov-sub">{{ specialtyName }} · {{ partName || '整机' }}</span>
              </div>
              <div class="ov-services">
                <div v-for="service in relatedServices" :key="service.key" class="ov-service" :class="{ focus: service.key === hero.serviceKey, 'is-red': service.level !== 'normal' }">
                  <span class="name">{{ service.label }}</span>
                  <span class="result">{{ service.level === 'normal' ? '正常' : '异常' }}</span>
                  <span class="detail">{{ service.reason }}</span>
                  <button type="button" @click="openModule(service.key)">进入模块 →</button>
                </div>
              </div>
              <p v-if="!relatedServices.length" class="ov-sub">这条告警没有对应的调查服务。</p>
              <details class="ov-other-services">
                <summary>其他服务</summary>
                <div class="ov-services">
                  <div v-for="service in otherServices" :key="service.key" class="ov-service">
                    <span class="name">{{ service.label }}</span>
                    <span class="detail">{{ service.reason }}</span>
                    <button type="button" @click="openModule(service.key)">进入模块 →</button>
                  </div>
                </div>
              </details>
            </section>
          </div>
        </template>
        <button v-else type="button" class="ov-spec-full" @click="showFull = !showFull">{{ showFull ? '收起整机模型' : '查看整机模型拆解 →' }}</button>

        <div v-if="showFull && structure" class="ov-struct-split">
          <OverviewStructureTree :model="structure" :selected-id="selectedId" @select="selectNode" />
          <div class="ov-struct-main">
            <section class="ov-block">
              <h2>整机模型</h2>
              <p class="ov-sub">物理结构树默认收起。这里按部件查看，不代替上面的告警调查。</p>
              <p v-if="activeNode" class="ov-sub">当前节点：{{ activeNode }}</p>
            </section>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OverviewStructureTree from '@/components/overview/OverviewStructureTree.vue'
import { alertNode, alertSource, latestAlert, servicesForSpecialty, SPECIALTIES, specialtyLabel, specialtyOfService, specialtyRows, type Specialty } from '@/mock/alertSpecialty'
import { getOverviewCard, servicePageKey } from '@/mock/overviewDemo'
import { notifyStructureNode, type OverviewServiceKey } from '@/mock/overviewStatus'
import { getDeviceStructure } from '@/mock/structureTree'
import { overviewAccessOf, useAuthStore } from '@/stores/auth'
import { useSceneStore } from '@/stores/scene'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const sceneStore = useSceneStore()
const hint = ref('')
const specialty = ref<Specialty>('structure')
const showFull = ref(false)
const selectedId = ref('')
const activeNode = ref('')
let timer = 0

const specialties = SPECIALTIES
const card = computed(() => getOverviewCard(String(route.params.id || '')))
const tone = computed(() => card.value?.lamp === 'red' ? 'red' : card.value?.lamp === 'yellow' ? 'yellow' : 'green')
const toneLabel = computed(() => tone.value === 'red' ? '红' : tone.value === 'yellow' ? '黄' : '绿')
const structure = computed(() => {
  const current = card.value
  if (!current) return null
  return getDeviceStructure({
    id: current.id,
    name: current.name,
    type: current.type,
    capacityText: current.capacityText,
    riskLevel: current.riskLevel
  })
})
const hero = computed(() => card.value ? latestAlert(card.value.overview.alarms) : null)
const heroNode = computed(() => {
  const alarm = hero.value
  const root = structure.value?.root
  if (!alarm || !root) return null
  return alertNode(root, alarm.id)
})
const partName = computed(() => heroNode.value && heroNode.value.id !== structure.value?.rootId ? heroNode.value.name : '')
const heroLink = computed(() => {
  const alarm = hero.value
  if (!alarm) return '—'
  const name = specialtyLabel(specialtyOfService(alarm.serviceKey))
  return partName.value ? `${name} · ${partName.value}` : name
})
const specialtyName = computed(() => specialtyLabel(specialty.value))
const modelRows = computed(() => {
  const root = structure.value?.root
  if (!root) return []
  return specialtyRows(root, specialty.value, hero.value?.id || '')
})
const relatedServices = computed(() => {
  const alarm = hero.value
  const current = card.value
  if (!alarm || !current) return []
  const keys = new Set(servicesForSpecialty(specialtyOfService(alarm.serviceKey)))
  return current.overview.services.filter(service => keys.has(service.key))
})
const otherServices = computed(() => {
  const related = new Set(relatedServices.value.map(service => service.key))
  return card.value?.overview.services.filter(service => !related.has(service.key)) ?? []
})

watch(() => card.value?.id, () => {
  const alarm = hero.value
  specialty.value = alarm ? specialtyOfService(alarm.serviceKey) : 'structure'
  showFull.value = false
  selectedId.value = structure.value?.rootId || ''
  activeNode.value = ''
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

function sourceOf(alarm: { serviceKey: OverviewServiceKey }) {
  return alertSource(alarm.serviceKey)
}
function back() {
  router.push({ name: 'overviewPlant', query: route.query })
}
function demo() {
  hint.value = '演示按钮，尚未接入'
  window.clearTimeout(timer)
  timer = window.setTimeout(() => { hint.value = '' }, 1600)
}
function openModule(key: OverviewServiceKey) {
  const current = card.value
  if (!current) return
  sceneStore.setScene('metallurgy')
  sceneStore.setService(servicePageKey(key))
  sceneStore.setDevice(current.id, true)
  router.push(`/device/${current.id}`)
}
function selectNode(id: string) {
  selectedId.value = id
  activeNode.value = id
  notifyStructureNode(id)
}
function focusRow(row: { id: string; name: string }) {
  activeNode.value = row.name
  if (!row.id.startsWith('other-')) notifyStructureNode(row.id)
}
</script>
