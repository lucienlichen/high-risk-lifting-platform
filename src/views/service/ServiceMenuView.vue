<template>
  <div class="content-scrollable service-page-shell">
    <div class="service-page">
      <aside class="service-scope-panel">
        <div class="permission-tree">
          <section v-for="scene in permissionTree" :key="scene.id" class="scene-tree-section">
            <div class="tree-node-line tree-node-line--scene">
              <button
                :class="['tree-node', 'tree-node--scene', { active: selectedScene === scene.scene }]"
                type="button"
                @click="selectNode(scene)"
              >
                <span class="scene-node-label">
                  <SceneTypeIcon :scene="scene.scene" class="scene-type-icon" />
                  {{ scene.label }}
                </span>
                <em>{{ scene.count }}</em>
              </button>
              <button
                class="tree-expand-btn tree-expand-btn--scene"
                type="button"
                :title="isSceneOpen(scene.scene) ? '收起集团列表' : '展开集团列表'"
                :aria-label="isSceneOpen(scene.scene) ? `收起${scene.label}集团列表` : `展开${scene.label}集团列表`"
                :aria-expanded="isSceneOpen(scene.scene)"
                @click="toggleScene(scene.scene)"
              >
                <el-icon><ArrowDown v-if="isSceneOpen(scene.scene)" /><ArrowRight v-else /></el-icon>
              </button>
            </div>

            <template v-if="isSceneOpen(scene.scene)">
              <template v-for="enterprise in scene.children" :key="enterprise.id">
                <div class="tree-node-line tree-node-line--group">
                  <button
                    :class="['tree-node', 'tree-node--group', { active: selectedNode?.id === enterprise.id }]"
                    type="button"
                    @click="selectNode(enterprise)"
                  >
                    <span>{{ enterprise.label }}</span>
                    <em>{{ enterprise.count }}</em>
                  </button>
                  <button
                    class="tree-expand-btn"
                    type="button"
                    :title="isGroupOpen(enterprise.id) ? '收起下级' : '展开下级'"
                    :aria-label="isGroupOpen(enterprise.id) ? `收起${enterprise.label}下级` : `展开${enterprise.label}下级`"
                    :aria-expanded="isGroupOpen(enterprise.id)"
                    @click="toggleGroup(enterprise.id)"
                  >
                    <el-icon><ArrowDown v-if="isGroupOpen(enterprise.id)" /><ArrowRight v-else /></el-icon>
                  </button>
                </div>
                <template v-if="isGroupOpen(enterprise.id)">
                  <template v-for="unit in enterprise.children" :key="unit.id">
            <template v-if="unit.children?.length">
              <div class="tree-node-line tree-node-line--unit">
                <button
                  :class="['tree-node', 'tree-node--unit', { active: selectedNode?.id === unit.id }]"
                  type="button"
                  @click="selectNode(unit)"
                >
                  <span>{{ unit.label }}</span>
                  <em>{{ unit.count }}</em>
                </button>
                <button
                  class="tree-expand-btn"
                  type="button"
                  :title="isBranchOpen(unit.id) ? '收起' : '展开'"
                  :aria-label="isBranchOpen(unit.id) ? '收起下级' : '展开下级'"
                  :aria-expanded="isBranchOpen(unit.id)"
                  @click="toggleBranch(unit.id)"
                >
                  <el-icon><ArrowDown v-if="isBranchOpen(unit.id)" /><ArrowRight v-else /></el-icon>
                </button>
              </div>
              <template v-if="isBranchOpen(unit.id)">
              <template v-for="area in unit.children" :key="area.id">
                <div class="tree-node-line">
                  <button
                    :class="['tree-node', 'tree-node--subsidiary', { active: selectedNode?.id === area.id }]"
                    type="button"
                    @click="selectNode(area)"
                  >
                    <span>{{ area.label }}</span>
                    <em>{{ area.count }}</em>
                  </button>
                  <button
                  class="tree-expand-btn"
                  type="button"
                  :title="isExpanded(area.id) ? '收起设备' : '展开设备'"
                  :aria-label="isExpanded(area.id) ? '收起设备' : '展开设备'"
                  :aria-expanded="isExpanded(area.id)"
                  @click="toggleDevices(area)"
                >
                    <el-icon><ArrowDown v-if="isExpanded(area.id)" /><ArrowRight v-else /></el-icon>
                  </button>
                </div>
                <div v-if="isExpanded(area.id)" class="tree-device-panel">
                  <button
                    :class="['tree-device-all-node', { active: selectedNode?.id === area.id }]"
                    type="button"
                    @click="selectNode(area)"
                  >
                    <span>全部设备服务</span>
                    <em>{{ area.count }} 台</em>
                  </button>
                  <button
                    v-for="device in pagedDevices(area)"
                    :key="device.id"
                    :class="['tree-device-node', { active: selectedNode?.deviceId === device.id }]"
                    type="button"
                    @click="selectDeviceNode(device, area.scene)"
                  >
                    <span>{{ device.code }}</span>
                  </button>
                  <div v-if="devicePageCount(area) > 1" class="tree-device-pager">
                    <button type="button" :disabled="devicePage(area) <= 1" @click="setDevicePage(area, devicePage(area) - 1)">上一页</button>
                    <span>{{ devicePage(area) }} / {{ devicePageCount(area) }}</span>
                    <button type="button" :disabled="devicePage(area) >= devicePageCount(area)" @click="setDevicePage(area, devicePage(area) + 1)">下一页</button>
                  </div>
                </div>
              </template>
              </template>
            </template>
            <template v-else>
              <div class="tree-node-line tree-node-line--unit">
                <button
                  :class="['tree-node', 'tree-node--unit', { active: selectedNode?.id === unit.id }]"
                  type="button"
                  @click="selectNode(unit)"
                >
                  <span>{{ unit.label }}</span>
                  <em>{{ unit.count }}</em>
                </button>
                <button
                  class="tree-expand-btn"
                  type="button"
                  :title="isExpanded(unit.id) ? '收起设备' : '展开设备'"
                  :aria-label="isExpanded(unit.id) ? '收起设备' : '展开设备'"
                  :aria-expanded="isExpanded(unit.id)"
                  @click="toggleDevices(unit)"
                >
                  <el-icon><ArrowDown v-if="isExpanded(unit.id)" /><ArrowRight v-else /></el-icon>
                </button>
              </div>
              <div v-if="isExpanded(unit.id)" class="tree-device-panel tree-device-panel--unit">
                <button
                  :class="['tree-device-all-node', { active: selectedNode?.id === unit.id }]"
                  type="button"
                  @click="selectNode(unit)"
                >
                  <span>全部设备服务</span>
                  <em>{{ unit.count }} 台</em>
                </button>
                <button
                  v-for="device in pagedDevices(unit)"
                  :key="device.id"
                  :class="['tree-device-node', { active: selectedNode?.deviceId === device.id }]"
                  type="button"
                  @click="selectDeviceNode(device, unit.scene)"
                >
                  <span>{{ device.code }}</span>
                </button>
                <div v-if="devicePageCount(unit) > 1" class="tree-device-pager">
                  <button type="button" :disabled="devicePage(unit) <= 1" @click="setDevicePage(unit, devicePage(unit) - 1)">上一页</button>
                  <span>{{ devicePage(unit) }} / {{ devicePageCount(unit) }}</span>
                  <button type="button" :disabled="devicePage(unit) >= devicePageCount(unit)" @click="setDevicePage(unit, devicePage(unit) + 1)">下一页</button>
                </div>
              </div>
            </template>
                  </template>
                </template>
              </template>
            </template>
          </section>
        </div>
      </aside>

      <main class="service-main">
        <section
          v-for="group in serviceGroups"
          :key="group.title"
          class="service-section"
        >
          <div class="service-section-head">
            <h3>{{ group.title }}</h3>
            <span>{{ group.items.length }} 项服务</span>
          </div>
          <div :class="['service-card-grid', `service-card-grid--${group.cls}`]">
            <button
              v-for="svc in group.items"
              :key="svc.key"
              type="button"
              class="service-card"
              @click="enterService(svc.key)"
            >
              <span class="service-card-head">
                <span :class="['service-card-icon', `service-card-icon--${group.cls}`]">
                  <component :is="svc.icon" />
                </span>
                <span class="service-card-title">{{ svc.label }}</span>
              </span>
              <span class="service-card-body">
                <span class="service-card-desc">{{ svc.summary }}</span>
              </span>
            </button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import SceneTypeIcon from '@/components/SceneTypeIcon.vue'
import { serviceGroups, type ServiceKey } from '@/components/serviceCatalog'
import { useSceneStore } from '@/stores/scene'
import { getDevices, getSceneGroups, SCENES } from '@/mock'
import type { Device, SceneId } from '@/mock'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const store = useSceneStore()
const auth = useAuthStore()

type TreeNodeType = 'scene' | 'group' | 'unit' | 'subsidiary' | 'device'
interface PermissionNode {
  id: string
  type: TreeNodeType
  scene: SceneId
  label: string
  count: number
  code?: string
  group?: string
  subsidiary?: string
  enterprise?: string
  affiliatedUnit?: string
  workArea?: string
  deviceId?: string
  children?: PermissionNode[]
}

interface RoleDeviceScope {
  scene: SceneId
  enterprise?: string
  affiliatedUnit?: string
  workArea?: string
}

const DEVICE_PAGE_SIZE = 12
const ROLE_DEVICE_SCOPES: Record<'groupAdmin' | 'factoryAdmin', RoleDeviceScope> = {
  groupAdmin: {
    scene: 'metallurgy',
    enterprise: '本钢集团'
  },
  factoryAdmin: {
    scene: 'metallurgy',
    enterprise: '本钢集团',
    affiliatedUnit: '板材板块',
    workArea: '炼铁厂'
  }
}

const selectedScene = ref<SceneId>(store.currentScene)
const selectedNode = ref<PermissionNode | null>(null)
const openedSceneIds = ref<Set<SceneId>>(new Set())
const openedGroupIds = ref<Set<string>>(new Set())
const expandedNodeIds = ref<Set<string>>(new Set())
const openedBranchIds = ref<Set<string>>(new Set())
const devicePages = ref<Record<string, number>>({})
const roleDeviceScope = computed<RoleDeviceScope | null>(() => {
  if (auth.role === 'groupAdmin') return ROLE_DEVICE_SCOPES.groupAdmin
  if (auth.role === 'factoryAdmin') return ROLE_DEVICE_SCOPES.factoryAdmin
  return null
})
const visibleScenes = computed(() => {
  const scope = roleDeviceScope.value
  if (!scope) return SCENES
  return SCENES.filter(scene => scene.id === scope.scene)
})

function scopedDevicesForScene(scene: SceneId) {
  const devices = getDevices(scene, 1, 9999).list
  const scope = roleDeviceScope.value
  if (!scope || scope.scene !== scene) return scope ? [] : devices
  return devices.filter(device => {
    if (scope.enterprise && device.enterprise !== scope.enterprise) return false
    if (scope.affiliatedUnit && device.affiliatedUnit !== scope.affiliatedUnit) return false
    if (scope.workArea && device.workArea !== scope.workArea) return false
    return true
  })
}

function groupOptionsForScene(scene: SceneId, devices: Device[]) {
  const visibleGroups = uniqueValues(devices.map(device => device.enterprise))
  const configuredGroups = getSceneGroups(scene)
  return configuredGroups.filter(group => visibleGroups.includes(group))
}

function buildDeviceNodes(scene: SceneId, devices: Device[], limit: number): PermissionNode[] {
  return devices.slice(0, limit).map(device => ({
    id: `device:${scene}:${device.id}`,
    type: 'device',
    scene,
    label: device.name,
    count: 1,
    code: device.code,
    group: device.group,
    subsidiary: device.subsidiary,
    enterprise: device.enterprise,
    affiliatedUnit: device.affiliatedUnit,
    workArea: device.workArea,
    deviceId: device.id
  }))
}

function uniqueValues(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => !!value)))
}

function nodeId(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(':')
}

function shouldShowWorkAreaLevel(unit: string, workAreas: string[], forceWorkAreaLevel = false) {
  return unit !== '本部' && (forceWorkAreaLevel || workAreas.length > 1)
}

const ordinalCharacters = '零一二两三四五六七八九十0-9'
const ordinalPattern = `[${ordinalCharacters}]+`

function parseOrdinal(value: string) {
  if (/^\d+$/.test(value)) return Number(value)

  const normalized = value.replace(/两/g, '二')
  const digits: Record<string, number> = {
    零: 0,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9
  }
  if (normalized === '十') return 10
  const [tensText, onesText] = normalized.split('十')
  if (normalized.includes('十')) {
    const tens = tensText ? digits[tensText] : 1
    const ones = onesText ? digits[onesText] : 0
    return tens === undefined || ones === undefined ? undefined : tens * 10 + ones
  }
  return digits[normalized]
}

type HierarchyNameType = 'branchFactory' | 'factory' | 'workshop' | 'other'

interface UnitSequenceMeta {
  family: string
  sequence: number | undefined
  nameType: HierarchyNameType
  isBase?: boolean
}

function hierarchyNameType(suffix: string | undefined): HierarchyNameType {
  if (suffix === '分厂') return 'branchFactory'
  if (suffix === '厂') return 'factory'
  if (suffix === '车间') return 'workshop'
  return 'other'
}

function hierarchyNameTypeRank(nameType: HierarchyNameType | undefined) {
  const ranks: Record<HierarchyNameType, number> = {
    branchFactory: 0,
    factory: 1,
    workshop: 2,
    other: 3
  }
  return ranks[nameType ?? 'other']
}

function unitSequenceMeta(name: string): UnitSequenceMeta | undefined {
  const normalized = name
    .replace(/有限责任公司|有限公司/g, '')
    .replace(/\s+/g, '')
    .replace(/^大棒材/, '棒材')
    .replace(new RegExp(`^线(?=${ordinalPattern}(?:分厂|厂|车间))`), '线材')
    .replace(new RegExp(`^棒(?=${ordinalPattern}(?:分厂|厂|车间))`), '棒材')

  const familyFirst = normalized.match(
    new RegExp(`^(线材|棒材|炼钢|炼铁|轧钢|烧结|焦化)(${ordinalPattern})?(分厂|厂|车间|作业区)`)
  )
  if (familyFirst) {
    return {
      family: familyFirst[1],
      sequence: familyFirst[2] ? parseOrdinal(familyFirst[2]) : 1,
      nameType: hierarchyNameType(familyFirst[3]),
      isBase: !familyFirst[2]
    }
  }

  const sequenceFirst = normalized.match(
    new RegExp(`^(${ordinalPattern})(?:号|#)?(船坞|坞|高炉|炼钢|炼铁)`)
  )
  if (sequenceFirst) {
    const family = sequenceFirst[2] === '坞' ? '船坞' : sequenceFirst[2]
    return { family, sequence: parseOrdinal(sequenceFirst[1]), nameType: 'other' }
  }

  const shipWorkshop = normalized.match(new RegExp(`^船(${ordinalPattern})(?:分厂|厂|车间)`))
  if (shipWorkshop) {
    return { family: '船舶车间', sequence: parseOrdinal(shipWorkshop[1]), nameType: 'workshop' }
  }

  return undefined
}

function buildNaturalEnterpriseNode(scene: SceneId, group: string, devices: Device[], forceWorkAreaLevel = false): PermissionNode {
  const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' })
  const familyKey = (name: string) => {
    const sequenceMeta = unitSequenceMeta(name)
    if (sequenceMeta) return sequenceMeta.family
    const normalized = name
      .replace(/有限责任公司|有限公司/g, '')
      .replace(/新27米车间|新27m车间/g, '新车间')
      .replace(/南侧新管|新管制车间|新管加工|原管加工/g, '管加工')
    if (normalized.startsWith('大棒材')) return '棒材'
    return normalized
      .replace(/分厂|厂房|车间|仓库/g, '')
      .replace(new RegExp(`${ordinalPattern}`, 'g'), '')
      .replace(/[东西南北中]/g, '')
  }
  const sortHierarchyNames = (
    names: string[],
    scopedDevices: Device[],
    getName: (device: Device) => string | undefined,
    preferred?: string
  ) => {
    const nameCounts = new Map<string, number>()
    const familyCounts = new Map<string, number>()
    scopedDevices.forEach(device => {
      const name = getName(device)
      if (!name) return
      nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1)
      const family = familyKey(name)
      familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1)
    })
    return [...names].sort((a, b) => {
      if (preferred) {
        if (a === preferred) return -1
        if (b === preferred) return 1
      }
      const familyA = familyKey(a)
      const familyB = familyKey(b)
      const familyDiff = (familyCounts.get(familyB) ?? 0) - (familyCounts.get(familyA) ?? 0)
      if (familyDiff) return familyDiff
      const metaA = unitSequenceMeta(a)
      const metaB = unitSequenceMeta(b)
      if (familyA === familyB) {
        const typeDiff = hierarchyNameTypeRank(metaA?.nameType) - hierarchyNameTypeRank(metaB?.nameType)
        if (typeDiff) return typeDiff
        if (metaA?.sequence !== undefined && metaB?.sequence !== undefined) {
          const sequenceDiff = metaA.sequence - metaB.sequence
          if (sequenceDiff) return sequenceDiff
          if (metaA.isBase !== metaB.isBase) return metaA.isBase ? -1 : 1
        } else if (metaA?.sequence !== undefined) {
          return -1
        } else if (metaB?.sequence !== undefined) {
          return 1
        }
      }
      const countDiff = (nameCounts.get(b) ?? 0) - (nameCounts.get(a) ?? 0)
      if (countDiff) return countDiff
      return collator.compare(a, b)
    })
  }
  const preferredUnit: Record<string, string> = {
    青岛港: '青岛新前湾集装箱码头有限责任公司',
    连云港港口: '连云港新海湾码头有限公司'
  }
  const units = sortHierarchyNames(
    uniqueValues(devices.map(device => device.affiliatedUnit)),
    devices,
    device => device.affiliatedUnit,
    preferredUnit[group]
  )
  return {
    id: nodeId('group', scene, group),
    type: 'group',
    scene,
    label: group,
    count: devices.length,
    group,
    enterprise: group,
    children: units.flatMap(unit => {
      const unitDevices = devices.filter(device => device.affiliatedUnit === unit)
      const workAreas = uniqueValues(unitDevices.map(device => device.workArea))
      if (unit === '本部') {
        return workAreas.map(workArea => {
          const areaDevices = unitDevices.filter(device => device.workArea === workArea)
          return {
            id: nodeId('unit', scene, group, unit, workArea),
            type: 'unit',
            scene,
            label: workArea || unit,
            count: areaDevices.length,
            group,
            enterprise: group,
            affiliatedUnit: unit,
            workArea,
            subsidiary: workArea
          }
        })
      }

      if (!shouldShowWorkAreaLevel(unit, workAreas, forceWorkAreaLevel)) {
        return [{
          id: nodeId('unit', scene, group, unit),
          type: 'unit',
          scene,
          label: unit,
          count: unitDevices.length,
          group,
          enterprise: group,
          affiliatedUnit: unit
        }]
      }

      return [{
        id: nodeId('unit', scene, group, unit),
        type: 'unit',
        scene,
        label: unit,
        count: unitDevices.length,
        group,
        enterprise: group,
        affiliatedUnit: unit,
        children: sortHierarchyNames(workAreas, unitDevices, device => device.workArea).map(workArea => {
          const areaDevices = unitDevices.filter(device => device.workArea === workArea)
          return {
            id: nodeId('area', scene, group, unit, workArea),
            type: 'subsidiary',
            scene,
            label: workArea,
            count: areaDevices.length,
            group,
            subsidiary: workArea,
            enterprise: group,
            affiliatedUnit: unit,
            workArea
          }
        })
      }]
    })
  }
}

const permissionTree = computed<PermissionNode[]>(() => {
  return visibleScenes.value.map(scene => {
    const devices = scopedDevicesForScene(scene.id)
    const groups = groupOptionsForScene(scene.id, devices)
    return {
      id: nodeId('scene', scene.id),
      type: 'scene',
      scene: scene.id,
      label: scene.name,
      count: devices.length,
      children: groups.map(group => buildNaturalEnterpriseNode(
        scene.id,
        group,
        devices.filter(device => device.enterprise === group),
        auth.role === 'factoryAdmin' && !!roleDeviceScope.value?.workArea
      ))
    }
  })
})

watch(permissionTree, (tree) => {
  if (!tree[0]) {
    selectedNode.value = null
    return
  }
  if (!selectedNode.value || !findNode(tree, selectedNode.value.id)) {
    selectedNode.value = null
    expandedNodeIds.value = new Set()
    devicePages.value = {}
    return
  }
  if (selectedNode.value.type === 'device') {
    expandDeviceParent(selectedNode.value)
  }
}, { immediate: true })

watch(() => auth.role, (role) => {
  const permittedScenes = visibleScenes.value.map(scene => scene.id)
  const nextScene = role === 'superAdmin' && permittedScenes.includes(selectedScene.value)
    ? selectedScene.value
    : (roleDeviceScope.value?.scene ?? permittedScenes[0] ?? 'metallurgy')
  selectedScene.value = nextScene
  store.setScene(nextScene)
  selectedNode.value = null
  openedSceneIds.value = new Set(permittedScenes)
  openedGroupIds.value = new Set()
  openedBranchIds.value = new Set()
  expandedNodeIds.value = new Set()
  devicePages.value = {}
}, { immediate: true })

function findNode(nodes: PermissionNode[], id: string): PermissionNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const child = node.children ? findNode(node.children, id) : null
    if (child) return child
  }
  return null
}

function isDeviceParentNode(node: PermissionNode) {
  return node.type !== 'group' && !node.children?.length
}

function findDeviceParentNode(nodes: PermissionNode[], deviceNode: PermissionNode): PermissionNode | null {
  for (const node of nodes) {
    if (
      isDeviceParentNode(node) &&
      node.scene === deviceNode.scene &&
      node.enterprise === deviceNode.enterprise &&
      node.affiliatedUnit === deviceNode.affiliatedUnit &&
      (!node.workArea || node.workArea === deviceNode.workArea)
    ) {
      return node
    }
    const child = node.children ? findDeviceParentNode(node.children, deviceNode) : null
    if (child) return child
  }
  return null
}

function activateNodeScene(scene: SceneId) {
  if (!visibleScenes.value.some(item => item.id === scene)) return false
  selectedScene.value = scene
  store.setScene(scene)
  return true
}

function selectNode(node: PermissionNode) {
  if (!activateNodeScene(node.scene)) return
  selectedNode.value = node
}

function selectDeviceNode(device: Device, scene: SceneId) {
  if (!activateNodeScene(scene)) return
  selectedNode.value = {
    id: nodeId('device', scene, device.id),
    type: 'device',
    scene,
    label: device.name,
    count: 1,
    code: device.code,
    group: device.group,
    subsidiary: device.subsidiary,
    enterprise: device.enterprise,
    affiliatedUnit: device.affiliatedUnit,
    workArea: device.workArea,
    deviceId: device.id
  }
  expandDeviceParent(selectedNode.value)
}

function expandDeviceParent(node: PermissionNode) {
  if (!node.enterprise || !node.affiliatedUnit) return
  const parentNode = findDeviceParentNode(permissionTree.value, node)
  if (!parentNode) return
  openedSceneIds.value = new Set([...openedSceneIds.value, node.scene])
  openedGroupIds.value = new Set([
    ...openedGroupIds.value,
    nodeId('group', node.scene, node.enterprise)
  ])
  expandedNodeIds.value = new Set([parentNode.id])
  devicePages.value = { ...devicePages.value, [parentNode.id]: devicePages.value[parentNode.id] ?? 1 }
  if (parentNode.type === 'subsidiary' && parentNode.enterprise && parentNode.affiliatedUnit) {
    const branchId = nodeId('unit', parentNode.scene, parentNode.enterprise, parentNode.affiliatedUnit)
    openedBranchIds.value = new Set([...openedBranchIds.value, branchId])
  }
}

function devicesForNode(node: PermissionNode) {
  return scopedDevicesForScene(node.scene).filter(device =>
    device.enterprise === node.enterprise &&
    device.affiliatedUnit === node.affiliatedUnit &&
    (!node.workArea || device.workArea === node.workArea)
  )
}

function isSceneOpen(scene: SceneId) {
  return openedSceneIds.value.has(scene)
}

function toggleScene(scene: SceneId) {
  const next = new Set(openedSceneIds.value)
  if (next.has(scene)) next.delete(scene)
  else next.add(scene)
  openedSceneIds.value = next
}

function isGroupOpen(nodeId: string) {
  return openedGroupIds.value.has(nodeId)
}

function toggleGroup(nodeId: string) {
  const next = new Set(openedGroupIds.value)
  if (next.has(nodeId)) next.delete(nodeId)
  else next.add(nodeId)
  openedGroupIds.value = next
}

function isExpanded(nodeId: string) {
  return expandedNodeIds.value.has(nodeId)
}

function isBranchOpen(nodeId: string) {
  return openedBranchIds.value.has(nodeId)
}

function toggleBranch(nodeId: string) {
  const next = new Set(openedBranchIds.value)
  if (next.has(nodeId)) next.delete(nodeId)
  else next.add(nodeId)
  openedBranchIds.value = next
}

function toggleDevices(node: PermissionNode) {
  const next = new Set(expandedNodeIds.value)
  if (next.has(node.id)) next.delete(node.id)
  else next.add(node.id)
  expandedNodeIds.value = next
  if (!devicePages.value[node.id]) {
    devicePages.value = { ...devicePages.value, [node.id]: 1 }
  }
}

function devicePage(node: PermissionNode) {
  return devicePages.value[node.id] ?? 1
}

function devicePageCount(node: PermissionNode) {
  return Math.max(1, Math.ceil(devicesForNode(node).length / DEVICE_PAGE_SIZE))
}

function setDevicePage(node: PermissionNode, page: number) {
  const nextPage = Math.min(Math.max(1, page), devicePageCount(node))
  devicePages.value = { ...devicePages.value, [node.id]: nextPage }
}

function pagedDevices(node: PermissionNode) {
  const page = devicePage(node)
  const start = (page - 1) * DEVICE_PAGE_SIZE
  return devicesForNode(node).slice(start, start + DEVICE_PAGE_SIZE)
}

function enterService(key: ServiceKey) {
  store.setService(key)
  store.setScene(selectedScene.value)
  if (selectedNode.value?.type === 'device' && selectedNode.value.deviceId) {
    store.setDevice(selectedNode.value.deviceId, true)
    router.push(`/device/${selectedNode.value.deviceId}`)
    return
  }
  store.setDevice(null, true)
  const query: Record<string, string> = {}
  const scope = roleDeviceScope.value
  const queryGroup = selectedNode.value?.group ?? scope?.enterprise
  const queryAffiliatedUnit = selectedNode.value?.affiliatedUnit ?? scope?.affiliatedUnit
  const queryWorkArea = selectedNode.value?.workArea ?? scope?.workArea
  if (queryGroup) query.group = queryGroup
  if (queryAffiliatedUnit) query.affiliatedUnit = queryAffiliatedUnit
  if (queryWorkArea) {
    query.subsidiary = queryWorkArea
  }
  router.push({ path: `/scene/${selectedScene.value}`, query })
}
</script>

<style scoped>
.service-page-shell {
  padding: 0;
}

.service-page {
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 0;
  align-items: start;
  width: 100%;
  min-height: calc(100vh - var(--header-height));
}

.service-scope-panel {
  position: sticky;
  top: 0;
  align-self: start;
  width: 420px;
  max-width: 420px;
  height: calc(100vh - var(--header-height));
  background: #ffffff;
  border-right: 1px solid var(--color-nav-border);
  box-shadow: 2px 0 10px rgba(15, 23, 42, 0.04);
  padding: 16px;
  overflow: auto;
}

.permission-tree {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: none;
  overflow-y: auto;
  padding-right: 4px;
}

.scene-tree-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scene-tree-section + .scene-tree-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border-light);
}

.tree-node {
  width: 100%;
  box-sizing: border-box;
  min-height: 34px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 58px;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-align: left;
}

.tree-node.active {
  background: rgba(22, 119, 255, 0.08);
  border-color: rgba(22, 119, 255, 0.35);
  color: var(--color-primary);
}

.tree-node:focus-visible,
.tree-expand-btn:focus-visible,
.tree-device-node:focus-visible,
.tree-device-all-node:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.tree-node span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.tree-node em {
  justify-self: end;
  min-width: 46px;
  font-size: 12px;
  font-style: normal;
  text-align: right;
  color: var(--color-text-muted);
}

.tree-node--scene {
  min-height: 48px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--color-primary) 14%, var(--color-card-bg));
  color: var(--color-header-bg);
  font-size: 15px;
  font-weight: 800;
}

.scene-node-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scene-type-icon {
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  color: var(--color-primary);
}

.tree-node--scene em {
  color: var(--color-text-secondary);
  opacity: 1;
}

.tree-node--scene.active {
  background: color-mix(in srgb, var(--color-primary) 22%, var(--color-card-bg));
  border-color: var(--color-primary);
  color: var(--color-header-bg);
}

.tree-node--group {
  min-height: 44px;
  padding: 10px 12px;
  background: #eef4fb;
  font-size: 15px;
  font-weight: 800;
  border-left: 4px solid #1677ff;
}

.tree-node--unit {
  width: calc(100% - 10px);
  min-height: 38px;
  margin-left: 10px;
  padding: 8px 10px 8px 24px;
  background: #f8fafc;
  font-size: 14px;
  font-weight: 700;
  position: relative;
  border-left: 4px solid #8bbcff;
}

.tree-node--unit::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #94a3b8;
  transform: translateY(-50%);
}

.tree-node-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 46px;
  gap: 4px;
  align-items: stretch;
  margin-left: 30px;
  width: calc(100% - 30px);
  box-sizing: border-box;
}

.tree-node-line--scene {
  margin-left: 0;
  width: 100%;
}

.tree-node-line--group {
  margin-left: 10px;
  width: calc(100% - 10px);
}

.tree-node-line--group .tree-node--group {
  width: 100%;
}

.tree-node-line--unit {
  margin-left: 10px;
  width: calc(100% - 10px);
}

.tree-node-line--unit .tree-node--unit {
  width: 100%;
  margin-left: 0;
}

.tree-node--subsidiary {
  min-height: 38px;
  padding: 8px 10px 8px 34px;
  font-size: 14px;
  position: relative;
  background: #ffffff;
  border-left: 4px solid #c7dcff;
}

.tree-node--subsidiary::before {
  content: '';
  position: absolute;
  left: 18px;
  top: 50%;
  width: 6px;
  height: 1px;
  background: #cbd5e1;
}

.tree-expand-btn {
  min-height: 44px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: #ffffff;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.tree-expand-btn--scene {
  min-height: 48px;
  background: color-mix(in srgb, var(--color-primary) 14%, var(--color-card-bg));
  border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-card-bg));
  color: var(--color-primary);
}

.tree-expand-btn:hover {
  border-color: rgba(22, 119, 255, 0.35);
  color: var(--color-primary);
}

.tree-expand-btn--scene:hover {
  background: color-mix(in srgb, var(--color-primary) 22%, var(--color-card-bg));
  border-color: var(--color-primary);
  color: var(--color-primary-hover);
}

.tree-device-panel {
  margin: 2px 0 8px 62px;
  padding: 6px;
  border-left: 1px solid #dbe3ee;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tree-device-panel--unit {
  margin-left: 46px;
}

.tree-device-node,
.tree-device-all-node {
  width: 100%;
  min-height: 32px;
  padding: 6px 8px 6px 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.tree-device-all-node {
  min-height: 34px;
  background: #f8fafc;
  border-color: #e2e8f0;
  color: var(--color-text-primary);
  font-weight: 700;
}

.tree-device-node.active,
.tree-device-all-node.active {
  background: rgba(22, 119, 255, 0.08);
  border-color: rgba(22, 119, 255, 0.3);
  color: var(--color-primary);
}

.tree-device-node span,
.tree-device-node em,
.tree-device-all-node span,
.tree-device-all-node em {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-device-node span,
.tree-device-all-node span {
  font-size: 12px;
  font-weight: 600;
}

.tree-device-all-node em,
.tree-device-node em {
  flex-shrink: 0;
  max-width: 90px;
  font-size: 11px;
  font-style: normal;
  color: var(--color-text-muted);
}

.tree-device-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 2px 0;
  color: var(--color-text-muted);
  font-size: 12px;
}

.tree-device-pager button {
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: #ffffff;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.tree-device-pager button:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.scope-device-entry {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
}

.service-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  align-self: start;
  padding: 16px 18px 24px;
}

.service-section {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  overflow: hidden;
}

.service-section-head {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  background: #f8fafc;
  border-right: 1px solid var(--color-border-light);
}

.service-section-head h3 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text-primary);
}

.service-section-head span {
  font-size: 12px;
  color: var(--color-text-muted);
}

.service-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 240px);
  gap: 12px;
  padding: 14px;
}

.service-card {
  width: 240px;
  height: 138px;
  padding: 16px;
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
  box-shadow: none;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.service-card:hover {
  border-color: rgba(22, 119, 255, 0.35);
  box-shadow: var(--color-card-shadow-hover);
  transform: translateY(-1px);
}

.service-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.service-card-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background: rgba(22, 119, 255, 0.08);
}

.service-card-icon--prevention {
  color: var(--color-danger);
  background: rgba(245, 34, 45, 0.08);
}

.service-card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.service-card-title {
  min-width: 0;
  font-size: 17px;
  line-height: 1.25;
  font-weight: 800;
  color: var(--color-text-primary);
  white-space: normal;
}

.service-card-desc {
  font-size: 13px;
  line-height: 1.55;
  font-weight: 500;
  color: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .service-page,
  .service-section {
    grid-template-columns: 1fr;
  }

  .service-scope-panel {
    position: static;
    width: 100%;
    max-width: none;
    height: auto;
  }

  .service-card-grid {
    grid-template-columns: 1fr;
  }

  .service-card {
    width: 100%;
  }
}
</style>
