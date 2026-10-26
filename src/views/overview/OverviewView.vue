<template>
  <div class="overview-page">
    <header class="overview-toolbar">
      <div class="role-switch" role="group" aria-label="权限模拟">
        <button
          v-for="item in roleOptions"
          :key="item.id"
          type="button"
          :class="{ active: role === item.id }"
          :aria-pressed="role === item.id"
          @click="role = item.id"
        >{{ item.label }}</button>
      </div>
      <p class="legend">
        <span class="dot is-red"></span>红 = 预警（需处置）
        <span class="dot is-yellow"></span>黄 = 报警（需关注）
        <span class="legend-note">红黄措辞待确认</span>
      </p>
      <button
        type="button"
        class="layout-toggle"
        :aria-pressed="plantLayout"
        @click="plantLayout = !plantLayout"
      >厂区平面图</button>
    </header>

    <div class="overview-body">
      <aside class="overview-tree" aria-label="场景与单位">
        <p class="tree-caption">场景 / 区域</p>
        <div v-for="scene in tree" :key="scene.id" class="tree-scene">
          <button
            type="button"
            :class="['tree-row', { active: selectedId === scene.id }]"
            :style="{ paddingLeft: '8px' }"
            @click="selectNode(scene.id)"
          >
            <span>{{ scene.label }}</span>
            <em>{{ scene.devices.length }}</em>
          </button>
          <template v-if="isOpen(scene.id)">
            <div v-for="group in scene.children" :key="group.id">
              <button
                type="button"
                :class="['tree-row', 'is-group', { active: selectedId === group.id }]"
                @click="selectNode(group.id)"
              >
                <span>{{ group.label }}</span>
                <em>{{ group.devices.length }}</em>
              </button>
              <p v-if="group.hint" class="tree-hint">{{ group.hint }}</p>
              <template v-if="isOpen(group.id)">
                <div v-for="child in group.children" :key="child.id">
                  <button
                    type="button"
                    :class="['tree-row', 'is-sector', { active: selectedId === child.id }]"
                    @click="selectNode(child.id)"
                  >
                    <span>{{ child.label }}</span>
                    <em>{{ child.devices.length }}</em>
                  </button>
                  <template v-if="child.children.length && isOpen(child.id)">
                    <button
                      v-for="unit in child.children"
                      :key="unit.id"
                      type="button"
                      :class="['tree-row', 'is-unit', { active: selectedId === unit.id }]"
                      @click="selectNode(unit.id)"
                    >
                      <span>{{ unit.label }}</span>
                      <em>{{ unit.devices.length }}</em>
                    </button>
                  </template>
                </div>
              </template>
            </div>
          </template>
        </div>
      </aside>

      <main class="overview-main">
        <section class="summary-strip" aria-label="红黄汇总">
          <div>
            <p class="scope-title">{{ selected?.label || '设备概览' }}</p>
            <p v-if="selected?.hint" class="scope-hint">{{ selected.hint }}</p>
          </div>
          <div class="summary-counts">
            <div class="count-block is-red">
              <strong>{{ stats.red }}</strong>
              <span>预警</span>
            </div>
            <div class="count-block is-yellow">
              <strong>{{ stats.yellow }}</strong>
              <span>报警</span>
            </div>
          </div>
          <div class="accident-row">
            <button
              v-for="type in accidentTypes"
              :key="type"
              type="button"
              :class="['accident-card', { active: accidentFilter === type }]"
              :aria-pressed="accidentFilter === type"
              @click="toggleAccident(type)"
            >
              <span>{{ type }}</span>
              <strong><b class="is-red">{{ stats.accidents[type].red }}</b> / <b class="is-yellow">{{ stats.accidents[type].yellow }}</b></strong>
            </button>
          </div>
        </section>

        <section v-if="plantLayout" class="plant-placeholder">
          <h3>厂区平面图</h3>
          <p>这一视图已经留好开关。当前没有厂区底图，也没有设备坐标，所以还不能把起重机落到车间平面上。</p>
          <p>接入后，点的颜色仍用六项服务里最严重的状态，红点需要能看出来。</p>
        </section>

        <template v-else-if="selected && !isDeviceScreen">
          <p class="section-lead">选择一个二级单位，查看该单位全部设备。</p>
          <div class="scope-grid">
            <button
              v-for="child in selected.children"
              :key="child.id"
              type="button"
              class="scope-card"
              @click="selectNode(child.id, true)"
            >
              <span class="scope-card-name">{{ child.label }}</span>
              <span v-if="child.hint" class="scope-card-hint">{{ child.hint }}</span>
              <span class="scope-card-stats">
                <b class="is-red">预警 {{ childStats(child).red }}</b>
                <b class="is-yellow">报警 {{ childStats(child).yellow }}</b>
              </span>
            </button>
          </div>
        </template>

        <template v-else-if="selected">
          <div class="filter-row">
            <div class="chip-row" role="group" aria-label="服务筛选">
              <button type="button" :class="{ active: serviceFilter === 'all' }" @click="serviceFilter = 'all'">全部服务</button>
              <button
                v-for="service in services"
                :key="service.key"
                type="button"
                :class="{ active: serviceFilter === service.key }"
                @click="serviceFilter = service.key"
              >{{ service.label }}</button>
            </div>
            <div class="chip-row" role="group" aria-label="严重程度">
              <button type="button" :class="{ active: severityFilter === 'all' }" @click="severityFilter = 'all'">全部设备</button>
              <button type="button" :class="{ active: severityFilter === 'attention' }" @click="severityFilter = 'attention'">红 + 黄</button>
              <button type="button" :class="{ active: severityFilter === 'red' }" @click="severityFilter = 'red'">只看红</button>
            </div>
          </div>
          <p class="section-lead">红、黄设备排在前面。点一台设备查看六项服务，不离开本页。</p>
          <div v-if="visibleDevices.length" class="tile-grid">
            <button
              v-for="item in visibleDevices"
              :key="item.device.id"
              type="button"
              :class="['device-tile', `is-${item.overview.overall}`]"
              @click="activeDevice = item.device"
            >
              <span class="tile-code">{{ item.device.code }}</span>
              <span class="tile-name">{{ item.device.name }}</span>
              <span class="tile-loc">{{ item.device.location }}</span>
              <span class="tile-lamps" :aria-label="lampText(item.overview)">
                <i
                  v-for="service in item.overview.services"
                  :key="service.key"
                  :class="['mini-lamp', `is-${service.level}`]"
                  :title="`${service.label} ${lampLabel(service.level)}`"
                ></i>
              </span>
              <span class="tile-state">{{ item.overview.accident || lampLabel(item.overview.overall) }}</span>
            </button>
          </div>
          <p v-else class="empty-copy">当前筛选下没有设备。</p>
        </template>
      </main>
    </div>

    <OverviewDeviceDrawer :device="activeDevice" @close="activeDevice = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  SCENES,
  getDevices,
  getSceneGroups,
  type Device,
  type SceneId
} from '@/mock'
import { SHAGANG_LEGAL_ENTITY } from '@/mock/shagangDevices'
import {
  ACCIDENT_TYPES,
  LAMP_RANK,
  OVERVIEW_SERVICES,
  getDeviceOverview,
  lampLabel,
  summarizeOverviews,
  type AccidentType,
  type DeviceOverview,
  type OverviewServiceKey
} from '@/mock/overviewStatus'
import OverviewDeviceDrawer from '@/components/overview/OverviewDeviceDrawer.vue'

type DemoRole = 'super' | 'group' | 'factory'
type SeverityFilter = 'all' | 'attention' | 'red'

interface OrgNode {
  id: string
  label: string
  hint?: string
  scene: SceneId
  enterprise?: string
  affiliatedUnit?: string
  workArea?: string
  devices: Device[]
  children: OrgNode[]
}

const roleOptions: { id: DemoRole; label: string }[] = [
  { id: 'super', label: '超管' },
  { id: 'group', label: '集团 · 本钢' },
  { id: 'factory', label: '分厂 · 炼铁厂' }
]

const GROUP_LABEL: Record<string, string> = {
  本钢集团: '本钢',
  江苏永钢集团有限公司: '永钢',
  沙钢: '沙钢'
}

const role = ref<DemoRole>('super')
const selectedId = ref('')
const openIds = ref<Set<string>>(new Set())
const plantLayout = ref(false)
const serviceFilter = ref<'all' | OverviewServiceKey>('all')
const severityFilter = ref<SeverityFilter>('all')
const accidentFilter = ref<AccidentType | null>(null)
const activeDevice = ref<Device | null>(null)

const services = OVERVIEW_SERVICES
const accidentTypes = ACCIDENT_TYPES

const sceneDevices = computed(() => {
  const map = new Map<SceneId, Device[]>()
  SCENES.forEach(scene => {
    map.set(scene.id, getDevices(scene.id, 1, 9999).list.filter(deviceAllowed))
  })
  return map
})

const tree = computed(() =>
  SCENES
    .map(scene => buildScene(scene.id, scene.name, sceneDevices.value.get(scene.id) ?? []))
    .filter(scene => scene.devices.length > 0)
)

const selected = computed(() => findNode(tree.value, selectedId.value))
const isDeviceScreen = computed(() => !!selected.value && selected.value.children.length === 0)
const stats = computed(() => summarizeOverviews((selected.value?.devices ?? []).map(device => device.id)))

const visibleDevices = computed(() => {
  const devices = selected.value?.devices ?? []
  return devices
    .map(device => ({ device, overview: getDeviceOverview(device.id) }))
    .filter(item => matchesFilter(item.overview))
    .sort((a, b) =>
      LAMP_RANK[b.overview.overall] - LAMP_RANK[a.overview.overall]
      || a.device.code.localeCompare(b.device.code, 'zh-CN')
    )
})

watch(role, () => {
  activeDevice.value = null
  plantLayout.value = false
  applyRoleSelection()
}, { immediate: true })

watch(selectedId, () => {
  activeDevice.value = null
})

function deviceAllowed(device: Device) {
  if (role.value === 'super') return true
  if (device.scene !== 'metallurgy' || device.enterprise !== '本钢集团') return false
  if (role.value === 'group') return true
  return device.affiliatedUnit === '板材板块' && device.workArea === '炼铁厂'
}

function applyRoleSelection() {
  const roots = tree.value
  if (role.value === 'factory') {
    const leaf = findMatch(roots, node => node.workArea === '炼铁厂' && node.affiliatedUnit === '板材板块' && node.children.length === 0)
    focusNode(leaf ?? roots[0])
    return
  }
  if (role.value === 'group') {
    const group = findMatch(roots, node => node.enterprise === '本钢集团' && !node.workArea && !node.affiliatedUnit)
    focusNode(group ?? roots[0])
    return
  }
  const scene = roots.find(node => node.scene === 'metallurgy') ?? roots[0]
  openIds.value = new Set(scene ? [scene.id] : [])
  selectedId.value = scene?.id ?? ''
}

function focusNode(node: OrgNode | undefined) {
  if (!node) {
    selectedId.value = ''
    openIds.value = new Set()
    return
  }
  const nextOpen = new Set<string>()
  collectAncestors(tree.value, node.id, nextOpen)
  nextOpen.add(node.id)
  openIds.value = nextOpen
  selectedId.value = node.id
}

function collectAncestors(nodes: OrgNode[], id: string, bucket: Set<string>): boolean {
  for (const node of nodes) {
    if (node.id === id) return true
    if (node.children.length && collectAncestors(node.children, id, bucket)) {
      bucket.add(node.id)
      return true
    }
  }
  return false
}

function buildScene(scene: SceneId, label: string, devices: Device[]): OrgNode {
  const groups = getSceneGroups(scene).filter(group => devices.some(device => device.enterprise === group))
  const children = groups.map(group => buildGroup(scene, group, devices.filter(device => device.enterprise === group)))
  return {
    id: `scene:${scene}`,
    label,
    scene,
    devices,
    children
  }
}

function buildGroup(scene: SceneId, enterprise: string, devices: Device[]): OrgNode {
  const units = unique(devices.map(device => device.affiliatedUnit || '未分组'))
  const orderedUnits = orderNames(units, devices)
  const children = orderedUnits.map(unit => {
    const unitDevices = devices.filter(device => (device.affiliatedUnit || '未分组') === unit)
    const areas = unique(unitDevices.map(device => device.workArea || unit))
    if (areas.length <= 1) {
      return leafNode(scene, enterprise, unit, areas[0] || unit, unitDevices, unitLabel(unit))
    }
    const orderedAreas = orderNames(areas, unitDevices)
    return {
      id: `sector:${scene}:${enterprise}:${unit}`,
      label: unit,
      scene,
      enterprise,
      affiliatedUnit: unit,
      devices: unitDevices,
      children: orderedAreas.map(area => leafNode(
        scene,
        enterprise,
        unit,
        area,
        unitDevices.filter(device => (device.workArea || unit) === area),
        area
      ))
    }
  })
  return {
    id: `group:${scene}:${enterprise}`,
    label: GROUP_LABEL[enterprise] || enterprise,
    hint: groupHint(enterprise),
    scene,
    enterprise,
    devices,
    children
  }
}

function leafNode(scene: SceneId, enterprise: string, unit: string, area: string, devices: Device[], label: string): OrgNode {
  return {
    id: `unit:${scene}:${enterprise}:${unit}:${area}`,
    label,
    scene,
    enterprise,
    affiliatedUnit: unit,
    workArea: area,
    devices,
    children: []
  }
}

function groupHint(enterprise: string) {
  if (enterprise === '本钢集团') return '只保留板材板块'
  if (enterprise === '江苏永钢集团有限公司') return '江苏永钢集团有限公司'
  if (enterprise === '沙钢') return SHAGANG_LEGAL_ENTITY
  return ''
}

function unitLabel(unit: string) {
  return unit
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function orderNames(names: string[], devices: Device[]) {
  const counts = new Map<string, number>()
  devices.forEach(device => {
    const key = device.workArea || device.affiliatedUnit || ''
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return [...names].sort((a, b) => {
    if (a === '待归属') return 1
    if (b === '待归属') return -1
    return (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b, 'zh-CN')
  })
}

function findNode(nodes: OrgNode[], id: string): OrgNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const child = findNode(node.children, id)
    if (child) return child
  }
  return null
}

function findMatch(nodes: OrgNode[], predicate: (node: OrgNode) => boolean): OrgNode | null {
  for (const node of nodes) {
    if (predicate(node)) return node
    const child = findMatch(node.children, predicate)
    if (child) return child
  }
  return null
}

function isOpen(id: string) {
  return openIds.value.has(id)
}

function selectNode(id: string, forceOpen = false) {
  selectedId.value = id
  const next = new Set(openIds.value)
  if (forceOpen || !next.has(id)) next.add(id)
  else {
    const node = findNode(tree.value, id)
    if (node?.children.length) next.delete(id)
  }
  collectAncestors(tree.value, id, next)
  openIds.value = next
}

function childStats(node: OrgNode) {
  return summarizeOverviews(node.devices.map(device => device.id))
}

function toggleAccident(type: AccidentType) {
  accidentFilter.value = accidentFilter.value === type ? null : type
}

function matchesFilter(overview: DeviceOverview) {
  if (severityFilter.value === 'red' && overview.overall !== 'red') return false
  if (severityFilter.value === 'attention' && overview.overall === 'normal') return false
  if (serviceFilter.value !== 'all') {
    const service = overview.services.find(item => item.key === serviceFilter.value)
    if (!service || service.level === 'normal') return false
  }
  if (accidentFilter.value) {
    const hit = overview.services.some(item => item.level !== 'normal' && item.accident === accidentFilter.value)
    if (!hit) return false
  }
  return true
}

function lampText(overview: DeviceOverview) {
  return overview.services.map(service => `${service.label}${lampLabel(service.level)}`).join('，')
}
</script>

<style scoped>
.overview-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-content-bg);
}

.overview-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: var(--color-card-bg);
  border-bottom: 1px solid var(--color-border);
}

.role-switch,
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-switch button,
.chip-row button,
.layout-toggle,
.accident-card,
.scope-card,
.device-tile,
.tree-row {
  cursor: pointer;
}

.role-switch button,
.layout-toggle,
.chip-row button {
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
  font-size: 13px;
}

.role-switch button.active,
.chip-row button.active,
.layout-toggle[aria-pressed='true'] {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-white);
}

.legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.legend-note {
  color: var(--color-text-muted);
}

.dot,
.mini-lamp {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
}

.dot.is-red,
.mini-lamp.is-red,
.count-block.is-red strong,
.is-red {
  color: var(--color-danger);
}

.dot.is-red,
.mini-lamp.is-red {
  background: var(--color-danger);
}

.dot.is-yellow,
.mini-lamp.is-yellow,
.count-block.is-yellow strong,
.is-yellow {
  color: var(--color-warning);
}

.dot.is-yellow,
.mini-lamp.is-yellow {
  background: var(--color-warning);
}

.mini-lamp.is-normal {
  background: var(--color-border-light);
}

.overview-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.overview-tree {
  width: 280px;
  flex-shrink: 0;
  overflow: auto;
  padding: 12px 10px 24px;
  background: var(--color-nav-bg);
  border-right: 1px solid var(--color-nav-border);
}

.tree-caption,
.section-lead,
.empty-copy,
.scope-hint,
.tree-hint,
.scope-card-hint,
.tile-loc {
  color: var(--color-text-muted);
  font-size: 12px;
}

.tree-caption {
  margin: 0 8px 8px;
}

.tree-row {
  width: 100%;
  min-height: 34px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  text-align: left;
}

.tree-row.is-group { padding-left: 18px; }
.tree-row.is-sector { padding-left: 32px; }
.tree-row.is-unit { padding-left: 46px; }

.tree-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-row em {
  font-style: normal;
  font-size: 12px;
  color: var(--color-text-muted);
}

.tree-row.active {
  background: var(--color-nav-active-bg);
  color: var(--color-primary);
  border-color: var(--color-nav-active-border);
}

.tree-hint {
  margin: 0 8px 4px 18px;
}

.overview-main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 16px;
}

.summary-strip {
  display: grid;
  grid-template-columns: minmax(160px, 220px) auto minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  margin-bottom: 14px;
}

.scope-title {
  font-size: 20px;
  font-weight: 750;
}

.summary-counts {
  display: flex;
  gap: 10px;
}

.count-block {
  min-width: 84px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
}

.count-block strong {
  display: block;
  font-size: 26px;
  line-height: 1;
}

.count-block span,
.accident-card span {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.count-block.is-red { background: var(--color-danger-bg); }
.count-block.is-yellow { background: var(--color-warning-bg); }

.accident-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.accident-card {
  padding: 8px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  text-align: left;
}

.accident-card strong {
  display: block;
  margin-top: 4px;
  font-size: 16px;
}

.accident-card.active {
  border-color: var(--color-primary);
  box-shadow: inset 0 0 0 1px var(--color-primary);
}

.section-lead {
  margin-bottom: 10px;
}

.scope-grid,
.tile-grid {
  display: grid;
  gap: 8px;
}

.scope-grid {
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
}

.scope-card {
  display: grid;
  gap: 6px;
  min-height: 86px;
  padding: 12px;
  text-align: left;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-card-border);
  background: var(--color-card-bg);
  box-shadow: var(--color-card-shadow);
}

.scope-card-name {
  font-weight: 700;
}

.scope-card-stats {
  display: flex;
  gap: 10px;
  font-size: 13px;
}

.filter-row {
  display: grid;
  gap: 8px;
  margin-bottom: 8px;
}

.tile-grid {
  grid-template-columns: repeat(auto-fill, minmax(156px, 1fr));
}

.device-tile {
  display: grid;
  gap: 3px;
  min-height: 108px;
  padding: 10px;
  text-align: left;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-muted);
}

.device-tile.is-yellow {
  background: var(--color-warning-bg);
  border-color: var(--color-warning);
  color: var(--color-text-primary);
}

.device-tile.is-red {
  background: var(--color-danger-bg);
  border-color: var(--color-danger);
  color: var(--color-text-primary);
  animation: overview-pulse 1.8s ease-out infinite;
}

.tile-code {
  font-weight: 750;
  font-size: 13px;
  color: inherit;
}

.device-tile.is-normal .tile-code {
  color: var(--color-text-secondary);
}

.tile-name,
.tile-loc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile-lamps {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.tile-state {
  font-size: 12px;
  font-weight: 700;
}

.plant-placeholder,
.empty-copy {
  padding: 28px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
}

.plant-placeholder h3 {
  margin-bottom: 8px;
}

.plant-placeholder p + p {
  margin-top: 8px;
}

@keyframes overview-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-danger) 40%, transparent); }
  100% { box-shadow: 0 0 0 8px transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .device-tile.is-red { animation: none; }
}

@media (max-width: 1100px) {
  .summary-strip,
  .accident-row {
    grid-template-columns: 1fr 1fr;
  }
  .overview-toolbar {
    flex-wrap: wrap;
  }
}
</style>
