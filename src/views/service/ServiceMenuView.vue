<template>
  <div class="content-scrollable service-page-shell">
    <div class="service-page">
      <aside class="service-scope-panel">
        <div class="scope-block">
        <div class="scope-label">应用场景</div>
        <el-select
          v-if="canSwitchScene"
          v-model="selectedScene"
          size="small"
          style="width: 100%"
          @change="handleSceneChange"
        >
          <el-option v-for="scene in SCENES" :key="scene.id" :label="scene.name" :value="scene.id" />
        </el-select>
        <div v-else class="scope-scene-static">{{ selectedSceneInfo?.name }}</div>
      </div>

      <div class="permission-tree">
        <template v-for="enterprise in permissionTree" :key="enterprise.id">
          <button
            :class="['tree-node', 'tree-node--group', { active: selectedNode?.id === enterprise.id }]"
            type="button"
            @click="selectNode(enterprise)"
          >
            <span>{{ enterprise.label }}</span>
            <em>{{ enterprise.count }}</em>
          </button>
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
                  @click="toggleDevices(area)"
                >
                    <el-icon><ArrowDown v-if="isExpanded(area.id)" /><ArrowRight v-else /></el-icon>
                  </button>
                </div>
                <div v-if="isExpanded(area.id)" class="tree-device-panel">
                  <button
                    v-for="device in pagedDevices(area)"
                    :key="device.id"
                    :class="['tree-device-node', { active: selectedNode?.deviceId === device.id }]"
                    type="button"
                    @click="selectDeviceNode(device)"
                  >
                    <span>{{ device.name }}</span>
                    <em>{{ device.code }}</em>
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
                  @click="toggleDevices(unit)"
                >
                  <el-icon><ArrowDown v-if="isExpanded(unit.id)" /><ArrowRight v-else /></el-icon>
                </button>
              </div>
              <div v-if="isExpanded(unit.id)" class="tree-device-panel tree-device-panel--unit">
                <button
                  v-for="device in pagedDevices(unit)"
                  :key="device.id"
                  :class="['tree-device-node', { active: selectedNode?.deviceId === device.id }]"
                  type="button"
                  @click="selectDeviceNode(device)"
                >
                  <span>{{ device.name }}</span>
                  <em>{{ device.code }}</em>
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
import { serviceGroups, type ServiceKey } from '@/components/serviceCatalog'
import { useSceneStore } from '@/stores/scene'
import { getDevices, getSceneGroups, SCENES } from '@/mock'
import type { Device, SceneId } from '@/mock'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const store = useSceneStore()
const auth = useAuthStore()

type TreeNodeType = 'group' | 'unit' | 'subsidiary' | 'device'
interface PermissionNode {
  id: string
  type: TreeNodeType
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

const DEVICE_PAGE_SIZE = 12
const selectedScene = ref<SceneId>(store.currentScene)
const selectedNode = ref<PermissionNode | null>(null)
const expandedNodeIds = ref<Set<string>>(new Set())
const openedBranchIds = ref<Set<string>>(new Set())
const devicePages = ref<Record<string, number>>({})
const canSwitchScene = computed(() => auth.role === 'superAdmin')
const selectedSceneInfo = computed(() => SCENES.find(scene => scene.id === selectedScene.value))

const allDevices = computed(() => getDevices(selectedScene.value, 1, 9999).list)
const groupOptions = computed(() => getSceneGroups(selectedScene.value))

function buildDeviceNodes(devices: Device[], limit: number): PermissionNode[] {
  return devices.slice(0, limit).map(device => ({
    id: `device:${device.id}`,
    type: 'device',
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

function shouldShowWorkAreaLevel(unit: string, workAreas: string[]) {
  return unit !== '本部' && workAreas.length > 1
}

function buildNaturalEnterpriseNode(group: string, devices: Device[]): PermissionNode {
  const units = uniqueValues(devices.map(device => device.affiliatedUnit))
  return {
    id: `group:${group}`,
    type: 'group',
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
            id: nodeId('unit', group, unit, workArea),
            type: 'unit',
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

      if (!shouldShowWorkAreaLevel(unit, workAreas)) {
        return [{
          id: nodeId('unit', group, unit),
          type: 'unit',
          label: unit,
          count: unitDevices.length,
          group,
          enterprise: group,
          affiliatedUnit: unit
        }]
      }

      return [{
        id: `unit:${group}:${unit}`,
        type: 'unit',
        label: unit,
        count: unitDevices.length,
        group,
        enterprise: group,
        affiliatedUnit: unit,
        children: workAreas.map(workArea => {
          const areaDevices = unitDevices.filter(device => device.workArea === workArea)
          return {
            id: `area:${group}:${unit}:${workArea}`,
            type: 'subsidiary',
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
  const buildForGroups = (groups: string[]) => groups.map(group => {
    const devices = allDevices.value.filter(device => device.enterprise === group)
    return buildNaturalEnterpriseNode(group, devices)
  })

  if (auth.role === 'factoryAdmin') {
    const group = groupOptions.value[0]
    return buildForGroups(group ? [group] : [])
  }

  if (auth.role === 'groupAdmin') {
    const group = groupOptions.value[0]
    return buildForGroups(group ? [group] : [])
  }

  return buildForGroups(groupOptions.value)
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
  if (role !== 'superAdmin') {
    selectedScene.value = 'metallurgy'
    store.setScene('metallurgy')
  }
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

function handleSceneChange(scene: SceneId) {
  if (!canSwitchScene.value) return
  store.setScene(scene)
  selectedNode.value = null
  expandedNodeIds.value = new Set()
  openedBranchIds.value = new Set()
  devicePages.value = {}
}

function selectNode(node: PermissionNode) {
  selectedNode.value = node
}

function selectDeviceNode(device: Device) {
  selectedNode.value = {
    id: `device:${device.id}`,
    type: 'device',
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
  expandedNodeIds.value = new Set([parentNode.id])
  devicePages.value = { ...devicePages.value, [parentNode.id]: devicePages.value[parentNode.id] ?? 1 }
  if (parentNode.type === 'subsidiary' && parentNode.enterprise && parentNode.affiliatedUnit) {
    const branchId = `unit:${parentNode.enterprise}:${parentNode.affiliatedUnit}`
    openedBranchIds.value = new Set([...openedBranchIds.value, branchId])
  }
}

function devicesForNode(node: PermissionNode) {
  return allDevices.value.filter(device =>
    device.enterprise === node.enterprise &&
    device.affiliatedUnit === node.affiliatedUnit &&
    (!node.workArea || device.workArea === node.workArea)
  )
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
  if (selectedNode.value?.group) query.group = selectedNode.value.group
  if (selectedNode.value?.affiliatedUnit) query.affiliatedUnit = selectedNode.value.affiliatedUnit
  if (selectedNode.value?.workArea) {
    query.subsidiary = selectedNode.value.workArea
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

.scope-block + .scope-block {
  margin-top: 14px;
}

.scope-label {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: 0;
}

.scope-scene-static {
  min-height: 32px;
  padding: 7px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #f8fafc;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 800;
}

:deep(.scope-block .el-select .el-input__inner) {
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text-primary);
}

:deep(.scope-block .el-select .el-input__wrapper) {
  min-height: 38px;
  font-size: 15px;
  font-weight: 800;
}

:deep(.scope-block .el-select .el-select__placeholder),
:deep(.scope-block .el-select .el-input__inner::placeholder) {
  font-size: 15px;
  font-weight: 800;
}

.permission-tree {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: none;
  overflow-y: auto;
  padding-right: 4px;
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
  min-height: 38px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: #ffffff;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.tree-expand-btn:hover {
  border-color: rgba(22, 119, 255, 0.35);
  color: var(--color-primary);
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

.tree-device-node {
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

.tree-device-node.active {
  background: rgba(22, 119, 255, 0.08);
  border-color: rgba(22, 119, 255, 0.3);
  color: var(--color-primary);
}

.tree-device-node span,
.tree-device-node em {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-device-node span {
  font-size: 12px;
  font-weight: 600;
}

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
  gap: 14px;
  min-width: 0;
  align-self: start;
  padding: 16px 18px 24px;
}

.service-section {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
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
  grid-template-columns: repeat(auto-fill, 260px);
  gap: 12px;
  padding: 14px;
}

.service-card {
  width: 260px;
  height: 150px;
  padding: 18px;
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
  font-size: 18px;
  line-height: 1.25;
  font-weight: 800;
  color: var(--color-text-primary);
  white-space: normal;
}

.service-card-desc {
  font-size: 14px;
  line-height: 1.65;
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
