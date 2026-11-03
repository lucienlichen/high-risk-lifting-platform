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
    <div v-if="card" class="ov-device-level">
      <span>风险定量 <b>{{ riskLevelText }}</b></span>
      <span>定期检验 <b>{{ inspectLevelText }}</b></span>
    </div>
    <p v-else class="ov-missing">没有这台设备。</p>

    <div v-if="card && workbench" class="device-content-region">
      <RemoteSectionTabs
        :model-value="specialty"
        :items="specialtyTabs"
        equal-width
        aria-label="专业"
        @update:model-value="chooseSpecialty($event as Specialty)"
      />
      <div class="content-scrollable">
        <div class="ov-bench" :class="{ 'is-collapsed': treeCollapsed }">
          <aside class="ov-struct ov-bench-tree" :aria-label="`${specialtyName}模型`">
            <div class="ov-struct-caption">
              <span v-if="!treeCollapsed">{{ specialtyName }}模型</span>
              <button type="button" class="ov-tree-fold" :aria-expanded="!treeCollapsed" @click="treeCollapsed = !treeCollapsed">{{ treeCollapsed ? '›' : '‹' }}</button>
            </div>
            <button
              v-for="row in treeRows"
              :key="row.id"
              type="button"
              class="ov-struct-btn"
              :class="{ active: row.id === selectedPartId }"
              :style="{ paddingLeft: treeCollapsed ? '6px' : `${8 + row.depth * 14}px` }"
              :title="row.name"
              @click="selectPart(row.id)"
            >
              <i class="ov-struct-lamp" :class="row.lamp === 'none' ? 'is-none' : row.lamp === 'yellow' ? 'is-yellow' : 'is-red'"></i>
              <span v-if="!treeCollapsed" class="name">{{ row.name }}</span>
              <span v-if="!treeCollapsed && row.alertCount" class="ov-badges">
                <span class="ov-badge" :class="row.lamp === 'yellow' ? 'yellow' : 'red'">{{ row.alertCount }}</span>
              </span>
            </button>
            <p v-if="!treeRows.length && !treeCollapsed" class="ov-sub">这一专业没有部件。</p>
            <button v-if="!treeCollapsed" type="button" class="ov-spec-full" @click="showFull = !showFull">{{ showFull ? '收起整机模型' : '查看整机模型拆解 →' }}</button>
          </aside>

          <div class="ov-bench-main">
            <section class="ov-twin">
              <div class="ov-section-head">
                <h2>{{ selectedPart?.name || '部件' }} · 三维模型</h2>
                <span class="ov-sub">{{ overlayLabel }}</span>
              </div>
              <div class="ov-stage ov-part-stage">
                <svg viewBox="0 0 640 280" role="img" :aria-label="`${selectedPart?.name || '部件'}三维示意`">
                  <template v-if="specialty === 'metal'">
                    <defs>
                      <linearGradient id="stress" x1="0" x2="1">
                        <stop offset="0" stop-color="#1d4ed8" />
                        <stop offset="0.55" stop-color="#22c55e" />
                        <stop offset="0.82" stop-color="#facc15" />
                        <stop offset="1" stop-color="#ef4444" />
                      </linearGradient>
                    </defs>
                    <polygon points="80,150 140,110 500,110 440,150" fill="url(#stress)" opacity="0.85" />
                    <polygon points="140,110 500,110 500,150 140,150" fill="#16324f" stroke="#7fa6d6" />
                    <polygon points="80,150 140,110 140,150 80,190" fill="#10243c" stroke="#7fa6d6" />
                    <polygon points="80,190 140,150 500,150 440,190" fill="#0c1c33" stroke="#7fa6d6" />
                    <rect v-if="selectedAlert" x="300" y="118" width="70" height="22" fill="none" stroke="#f5222d" stroke-width="2" />
                  </template>
                  <template v-else-if="specialty === 'hoist' || specialty === 'travel'">
                    <rect x="120" y="90" width="120" height="90" rx="8" fill="#16324f" stroke="#7fa6d6" />
                    <circle cx="300" cy="135" r="48" fill="#10243c" stroke="#7fa6d6" />
                    <circle cx="300" cy="135" r="16" fill="none" stroke="#f5222d" />
                    <rect x="380" y="100" width="110" height="70" rx="6" fill="#16324f" stroke="#faad14" />
                    <text x="180" y="80" fill="#94a3b8" font-size="12">电机</text>
                    <text x="276" y="80" fill="#94a3b8" font-size="12">减速机</text>
                    <text x="410" y="80" fill="#94a3b8" font-size="12">制动器</text>
                  </template>
                  <template v-else-if="specialty === 'electric' || specialty === 'protection'">
                    <rect x="160" y="50" width="320" height="180" rx="8" fill="#10243c" stroke="#7fa6d6" />
                    <path d="M190 90 H450 M190 120 H450 M190 150 H450 M190 180 H450" stroke="#334a6b" />
                    <rect x="250" y="78" width="90" height="28" fill="none" stroke="#f5222d" />
                    <text x="320" y="40" fill="#94a3b8" font-size="12" text-anchor="middle">{{ specialtyLabel(specialty) }}</text>
                  </template>
                  <template v-else>
                    <rect x="180" y="60" width="280" height="160" rx="8" fill="#10243c" stroke="#7fa6d6" />
                    <text x="320" y="130" fill="#e2e8f0" font-size="16" text-anchor="middle">风险 / 检验</text>
                    <text x="320" y="156" fill="#94a3b8" font-size="12" text-anchor="middle">{{ selectedPart?.name || '其他' }}</text>
                  </template>
                </svg>
                <button
                  v-for="point in stagePoints"
                  :key="point.id"
                  type="button"
                  class="ov-dot"
                  :class="[`is-${point.kind}`, `is-${point.status}`, { hot: selectedAlert?.pointIds.includes(point.id) }]"
                  :style="{ left: `${point.x}%`, top: `${point.y}%` }"
                  :title="`${point.name} · ${point.kind === 'measured' ? '实测' : '孪生'} · ${point.value}`"
                ></button>
                <div class="ov-stage-foot">
                  <span>{{ overlayLabel }}</span>
                  <span>实心测点为实测，空心为孪生。悬停查看名称。</span>
                </div>
              </div>
            </section>

            <section class="ov-block">
              <div class="ov-section-head">
                <h2>测点表</h2>
                <div class="ov-point-filters">
                  <button type="button" :class="{ on: kindFilter === 'all' }" @click="kindFilter = 'all'; page = 1">全部</button>
                  <button type="button" :class="{ on: kindFilter === 'measured' }" @click="kindFilter = 'measured'; page = 1">实测</button>
                  <button type="button" :class="{ on: kindFilter === 'twin' }" @click="kindFilter = 'twin'; page = 1">孪生</button>
                  <button type="button" :class="{ on: statusFilter === 'all' }" @click="statusFilter = 'all'; page = 1">任意状态</button>
                  <button type="button" :class="{ on: statusFilter === 'warn' }" @click="statusFilter = 'warn'; page = 1">异常</button>
                  <button type="button" :class="{ on: statusFilter === 'danger' }" @click="statusFilter = 'danger'; page = 1">报警</button>
                  <button type="button" :class="{ on: partFilter === 'current' }" @click="partFilter = 'current'; page = 1">当前部件</button>
                  <button type="button" :class="{ on: partFilter === 'all' }" @click="partFilter = 'all'; page = 1">全部部件</button>
                </div>
              </div>
              <el-table :data="pointPage" size="small" empty-text="没有符合条件的测点">
                <el-table-column prop="partName" label="部件" min-width="100" />
                <el-table-column prop="name" label="测点" min-width="140" />
                <el-table-column label="类型" width="80">
                  <template #default="{ row }">{{ row.kind === 'measured' ? '实测' : '孪生' }}</template>
                </el-table-column>
                <el-table-column label="状态" width="80">
                  <template #default="{ row }">{{ statusText(row.status) }}</template>
                </el-table-column>
                <el-table-column prop="value" label="当前值" width="100" />
              </el-table>
              <div class="ov-point-page">
                <el-pagination
                  layout="total, prev, pager, next"
                  :total="filteredPoints.length"
                  :page-size="pageSize"
                  :current-page="page"
                  @current-change="page = $event"
                />
              </div>
            </section>
          </div>

          <aside class="ov-bench-side">
            <section class="ov-block">
              <div class="ov-section-head">
                <h2>{{ specialtyName }}告警</h2>
                <span class="ov-sub">{{ specialtyAlerts.length }} 条 · 按时间</span>
              </div>
              <p v-if="!alertGroups.length" class="ov-sub">这个专业当前没有告警。</p>
              <div v-for="group in alertGroups" :key="group.partId || group.partName" class="ov-alert-group">
                <p class="ov-alert-part">{{ group.partName }}</p>
                <button
                  v-for="alarm in group.alerts"
                  :key="alarm.id"
                  type="button"
                  class="ov-alert-row"
                  :class="{ active: alarm.id === selectedAlertId, 'is-yellow': alarm.level === 'yellow' }"
                  @click="selectAlert(alarm.id)"
                >
                  <i :class="alarm.level === 'yellow' ? 'is-yellow' : 'is-red'"></i>
                  <span>
                    <b>{{ alarm.text }}</b>
                    <em>{{ alarm.time }} · {{ alarm.serviceLabel }}</em>
                  </span>
                </button>
              </div>
            </section>
            <section class="ov-block">
              <div class="ov-section-head">
                <h2>调查证据</h2>
                <span class="ov-sub">{{ selectedAlert ? selectedAlert.serviceLabel : '未选告警' }}</span>
              </div>
              <div v-if="selectedAlert" class="ov-services">
                <div v-for="service in evidenceServices" :key="service.key" class="ov-service" :class="{ focus: service.key === selectedAlert.serviceKey, 'is-red': service.level !== 'normal' }">
                  <span class="name">{{ service.label }}</span>
                  <span class="result">{{ severityText(service.level) }}</span>
                  <span class="detail">{{ service.reason }}</span>
                  <button type="button" @click="openModule(service.key)">进入模块 →</button>
                </div>
              </div>
              <p v-else class="ov-sub">选中一条告警后，这里只保留调查该告警的服务。</p>
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
          </aside>
        </div>

        <div v-if="showFull && structure" class="ov-struct-split">
          <OverviewStructureTree :model="structure" :selected-id="selectedPartId" @select="selectNode" />
          <section class="ov-block">
            <h2>整机模型</h2>
            <p class="ov-sub">整机拆解默认收起。部件三维和测点表仍以上方当前部件为准。</p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DeviceAreaBar from '@/components/DeviceAreaBar.vue'
import DeviceInfoHeader from '@/components/DeviceInfoHeader.vue'
import RemoteSectionTabs from '@/components/RemoteSectionTabs.vue'
import OverviewStructureTree from '@/components/overview/OverviewStructureTree.vue'
import { getDeviceById } from '@/mock'
import { specialtyById } from '@/config/specialtyDict'
import { severityLabel } from '@/config/statusDict'
import { latestAlert, servicesForSpecialty, SPECIALTIES, specialtyLabel, specialtyOfAlarm, type Specialty } from '@/mock/alertSpecialty'
import { getDeviceWorkbench, type DetailAlert, type WorkPoint } from '@/mock/detailWorkbench'
import { getOverviewCard, servicePageKey } from '@/mock/overviewDemo'
import { OVERVIEW_CARD_RULES } from '@/mock/overviewCardRules'
import { notifyStructureNode, type LampLevel, type OverviewServiceKey } from '@/mock/overviewStatus'
import { getDeviceStructure } from '@/mock/structureTree'
import { overviewAccessOf, useAuthStore } from '@/stores/auth'
import { useSceneStore } from '@/stores/scene'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const sceneStore = useSceneStore()
const specialty = ref<Specialty>('metal')
const showFull = ref(false)
const treeCollapsed = ref(false)
const selectedAlertId = ref('')
const selectedPartId = ref('')
const kindFilter = ref<'all' | 'measured' | 'twin'>('all')
const statusFilter = ref<'all' | 'normal' | 'warn' | 'danger'>('all')
const partFilter = ref<'current' | 'all'>('current')
const page = ref(1)
const specialties = SPECIALTIES
const pageSize = OVERVIEW_CARD_RULES.detailPointPageSize
const card = computed(() => getOverviewCard(String(route.params.id || '')))
const ledgerDevice = computed(() => card.value ? getDeviceById(card.value.id) : null)
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
const specialtyTabs = computed(() => SPECIALTIES.map(item => {
  const count = specialtyCount(item.id)
  return { id: item.id, label: count ? `${item.label} (${count})` : item.label }
}))
const headerUnit = computed(() => ledgerDevice.value?.subsidiary || ledgerDevice.value?.group || card.value?.unit || '—')
const headerInstall = computed(() => ledgerDevice.value?.installDate || card.value?.yearText || '—')
const riskLevelText = computed(() => {
  const alarm = card.value?.overview.alarms.find(item => item.serviceKey === 'risk')
  return alarm ? severityLabel(alarm.level) : '正常'
})
const inspectLevelText = computed(() => {
  const current = card.value
  if (!current || current.inspDays == null) return '—'
  if (current.inspOverdue) return `超期 ${-current.inspDays} 天 · 异常`
  if (current.inspRemind) return `剩余 ${current.inspDays} 天 · 提醒`
  return '正常'
})
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
const workbench = computed(() => {
  const current = card.value
  const root = structure.value?.root
  if (!current || !root) return null
  return getDeviceWorkbench(current.id, root, current.overview.alarms)
})
const specialtyName = computed(() => specialtyLabel(specialty.value))
const specialtyAlerts = computed(() => {
  const list = workbench.value?.alerts.filter(alarm => specialtyOfAlarm(alarm) === specialty.value) ?? []
  return [...list].sort((a, b) => b.time.localeCompare(a.time))
})
const alertGroups = computed(() => {
  const groups: { partId: string; partName: string; alerts: DetailAlert[]; newest: string }[] = []
  specialtyAlerts.value.forEach(alarm => {
    const found = groups.find(group => group.partId === alarm.partId && group.partName === alarm.partName)
    if (found) found.alerts.push(alarm)
    else groups.push({ partId: alarm.partId, partName: alarm.partName, alerts: [alarm], newest: alarm.time })
  })
  groups.forEach(group => {
    group.alerts.sort((a, b) => b.time.localeCompare(a.time))
    group.newest = group.alerts[0]?.time || ''
  })
  return groups.sort((a, b) => b.newest.localeCompare(a.newest))
})
const selectedAlert = computed(() => workbench.value?.alerts.find(alarm => alarm.id === selectedAlertId.value) || null)
const specialtyParts = computed(() => workbench.value?.parts.filter(part => part.specialty === specialty.value) ?? [])
const selectedPart = computed(() => workbench.value?.parts.find(part => part.id === selectedPartId.value) || specialtyParts.value[0] || null)
const treeRows = computed(() => {
  const systems = new Map<string, typeof specialtyParts.value>()
  specialtyParts.value.forEach(part => {
    const list = systems.get(part.systemName) ?? []
    list.push(part)
    systems.set(part.systemName, list)
  })
  const rows: { id: string; name: string; depth: number; alertCount: number; lamp: LampLevel | 'none' }[] = []
  systems.forEach((list, systemName) => {
    const alerts = specialtyAlerts.value.filter(alarm => list.some(part => part.id === alarm.partId))
    if (list.length > 1) {
      rows.push({ id: `sys:${systemName}`, name: systemName, depth: 0, alertCount: alerts.length, lamp: worst(alerts) })
    }
    list.forEach(part => {
      const partAlerts = specialtyAlerts.value.filter(alarm => alarm.partId === part.id)
      rows.push({
        id: part.id,
        name: part.name,
        depth: list.length > 1 ? 1 : 0,
        alertCount: partAlerts.length,
        lamp: worst(partAlerts)
      })
    })
  })
  return rows
})
const stagePoints = computed(() => workbench.value?.points.filter(point => point.partId && point.partId === selectedPart.value?.id) ?? [])
const filteredPoints = computed(() => {
  const rows = workbench.value?.points ?? []
  return rows.filter(point => {
    if (kindFilter.value !== 'all' && point.kind !== kindFilter.value) return false
    if (statusFilter.value !== 'all' && point.status !== statusFilter.value) return false
    if (partFilter.value === 'current' && point.partId !== (selectedPart.value?.id || '')) return false
    return true
  }).sort((a, b) => partOrder(a) - partOrder(b) || a.name.localeCompare(b.name, 'zh-CN'))
})
const pointPage = computed(() => filteredPoints.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const evidenceServices = computed(() => {
  const alarm = selectedAlert.value
  const current = card.value
  if (!alarm || !current) return []
  const keys = new Set(servicesForSpecialty(specialtyOfAlarm(alarm) || 'metal'))
  return current.overview.services.filter(service => keys.has(service.key))
})
const otherServices = computed(() => {
  const related = new Set(evidenceServices.value.map(service => service.key))
  if (!selectedAlert.value) return []
  return card.value?.overview.services.filter(service => !related.has(service.key)) ?? []
})
const overlayLabel = computed(() => specialtyById(specialty.value).overlay)

watch(() => card.value?.id, () => {
  showFull.value = false
  treeCollapsed.value = false
  page.value = 1
  const requested = queryText(route.query.spec)
  const known = SPECIALTIES.some(item => item.id === requested)
  const latest = card.value ? latestAlert(card.value.overview.alarms) : null
  specialty.value = known ? requested as Specialty : (latest && specialtyOfAlarm(latest) ? specialtyOfAlarm(latest)! : 'metal')
  applySpecialty(specialty.value, !known)
  const alarmId = queryText(route.query.alarm)
  if (alarmId) {
    const alarm = workbench.value?.alerts.find(item => item.id === alarmId)
    if (alarm && (!specialtyOfAlarm(alarm) || specialtyOfAlarm(alarm) === specialty.value)) selectAlert(alarm.id)
  }
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

function worst(alerts: { level: LampLevel }[]): LampLevel | 'none' {
  if (alerts.some(alarm => alarm.level === 'red')) return 'red'
  if (alerts.some(alarm => alarm.level === 'yellow')) return 'yellow'
  return 'none'
}
function specialtyCount(id: Specialty) {
  return workbench.value?.alerts.filter(alarm => specialtyOfAlarm(alarm) === id).length || 0
}
function specialtyLamp(id: Specialty): LampLevel | 'none' {
  return worst(workbench.value?.alerts.filter(alarm => specialtyOfAlarm(alarm) === id) || [])
}
function partOrder(point: WorkPoint) {
  if (!point.partId) return 2
  return 0
}
function statusText(status: WorkPoint['status']) {
  if (status === 'danger') return '报警'
  if (status === 'warn') return '异常'
  return '正常'
}
function severityText(level: LampLevel) {
  if (level === 'red') return '报警'
  if (level === 'yellow') return '异常'
  return '正常'
}
function firstPart(id: Specialty) {
  return workbench.value?.parts.find(part => part.specialty === id) || null
}
function applySpecialty(id: Specialty, preferGlobalLatest: boolean) {
  const pool = (workbench.value?.alerts || [])
    .filter(alarm => specialtyOfAlarm(alarm) === id)
    .sort((a, b) => b.time.localeCompare(a.time))
  const globalLatest = card.value ? latestAlert(card.value.overview.alarms.filter(alarm => specialtyOfAlarm(alarm))) : null
  const chosen = preferGlobalLatest && globalLatest && specialtyOfAlarm(globalLatest) === id
    ? pool.find(alarm => alarm.id === globalLatest.id) || pool[0]
    : pool[0]
  if (chosen) selectAlert(chosen.id)
  else {
    selectedAlertId.value = ''
    selectedPartId.value = firstPart(id)?.id || ''
    partFilter.value = 'current'
    if (selectedPartId.value) notifyStructureNode(selectedPartId.value)
  }
}
function chooseSpecialty(id: Specialty) {
  specialty.value = id
  page.value = 1
  applySpecialty(id, false)
}
function selectAlert(id: string) {
  const alarm = workbench.value?.alerts.find(item => item.id === id)
  if (!alarm) return
  selectedAlertId.value = alarm.id
  specialty.value = specialtyOfAlarm(alarm) || specialty.value
  if (alarm.partId) selectedPartId.value = alarm.partId
  else selectedPartId.value = firstPart(specialty.value)?.id || ''
  partFilter.value = 'current'
  page.value = 1
  if (selectedPartId.value) notifyStructureNode(selectedPartId.value)
}
function selectPart(id: string) {
  if (id.startsWith('sys:')) {
    const name = id.slice(4)
    const part = specialtyParts.value.find(item => item.systemName === name)
    if (part) selectPart(part.id)
    return
  }
  selectedPartId.value = id
  partFilter.value = 'current'
  page.value = 1
  const linked = specialtyAlerts.value.find(alarm => alarm.partId === id)
  selectedAlertId.value = linked?.id || ''
  notifyStructureNode(id)
}
function selectNode(id: string) {
  notifyStructureNode(id)
}
function queryText(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] || '')
  return String(value || '')
}
function back() {
  const query: Record<string, string> = { spec: specialty.value }
  const enterprise = queryText(route.query.enterprise)
  const unit = queryText(route.query.unit)
  const node = queryText(route.query.node)
  if (enterprise) query.enterprise = enterprise
  if (unit) query.unit = unit
  if (node) query.node = node
  router.push({ name: 'overviewParts', params: { id: String(route.params.id || '') }, query })
}
function openModule(key: OverviewServiceKey) {
  const current = card.value
  if (!current) return
  sceneStore.setScene('metallurgy')
  sceneStore.setService(servicePageKey(key))
  sceneStore.setDevice(current.id, true)
  router.push(`/device/${current.id}`)
}
</script>
