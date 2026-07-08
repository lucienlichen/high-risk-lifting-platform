<template>
  <div class="content-scrollable">
    <ServiceMenu :require-device="false" class="scene-service-menu" />

    <!-- Scene Header -->
    <div v-if="isHistoryList" class="scene-header scene-header--compact">
      <div class="scene-header-left"></div>
      <div style="display:flex;gap:10px;align-items:center">
        <div class="view-toggle">
          <button :class="['view-toggle-btn', { active: viewMode === 'card' }]" @click="viewMode='card'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            卡片
          </button>
          <button :class="['view-toggle-btn', { active: viewMode === 'list' }]" @click="viewMode='list'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
            列表
          </button>
        </div>
      </div>
    </div>

    <!-- 搜索：居左对齐 -->
    <div v-if="usesDeviceScope" class="filter-bar">
      <div class="filter-bar-right" style="flex: 1; justify-content: flex-start;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        <el-input v-model="filters.name" placeholder="设备名称" size="small" clearable style="width:160px" />
        <el-select v-model="filters.status" placeholder="设备运行状态" size="small" clearable style="width:120px">
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-select v-model="filters.type" placeholder="设备类型" size="small" clearable style="width:160px">
          <el-option v-for="t in deviceTypes" :key="t" :label="t" :value="t" />
        </el-select>
        <el-button size="small" type="primary" @click="applyFilter">
          <el-icon class="el-icon--left"><Search /></el-icon>查询
        </el-button>
        <el-button size="small" @click="resetFilter">重置</el-button>
        <span class="filter-bar-total">共 {{ filteredTotal }} 条记录</span>
      </div>
    </div>

    <!-- 列表 + 分页：同一卡片容器 -->
    <div v-if="isHistoryList" class="scene-list-container">
      <template v-if="viewMode === 'card'">
        <div class="device-grid">
          <div
            v-for="device in pagedDevices"
            :key="device.id"
            class="device-card"
            @click="handleDeviceClick(device.id)"
          >
            <div class="device-card-header">
              <div>
                <div class="device-card-name">{{ device.name }}</div>
                <div class="device-card-code">{{ device.code }}</div>
              </div>
            </div>
            <div class="device-card-body">
              <div class="device-card-row">
                <span class="device-card-row-label">设备类型</span>
                <span>{{ device.type }}</span>
              </div>
              <div class="device-card-row">
                <span class="device-card-row-label">投用日期</span>
                <span>{{ device.installDate }}</span>
              </div>
              <div class="device-card-row device-card-row--tech">
                <span class="device-card-row-label">技术参数前6项</span>
                <span class="device-card-tech">{{ formatTechParams(device.technicalParams) }}</span>
              </div>
              <div class="device-card-row">
                <span class="device-card-row-label">设备运行状态</span>
                <span :class="`badge badge-${device.status}`">
                  <span class="badge-dot"></span>{{ statusLabels[device.status] }}
                </span>
              </div>
              <div class="device-card-row">
                <span class="device-card-row-label">已运行时长(h)</span>
                <span>{{ device.operatingHours.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="data-table-wrap">
          <el-table
            :data="pagedDevices"
            style="width:100%"
            @row-click="(row: any) => handleDeviceClick(row.id)"
          >
            <el-table-column label="序号" width="64" align="center" fixed="left">
              <template #default="{ $index }">
                {{ (currentPage - 1) * pageSize + $index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="code" label="设备编号" width="120" fixed="left" />
            <el-table-column prop="name" label="设备名称" min-width="190" fixed="left" show-overflow-tooltip />
            <el-table-column prop="location" label="使用地点" min-width="150" show-overflow-tooltip />
            <el-table-column
              v-for="col in dataColumns"
              :key="col.key"
              :label="col.label"
              min-width="120"
              align="center"
            >
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click.stop="openData(row, col.key)">
                  <el-icon class="el-icon--left"><View /></el-icon>查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else-if="isRemoteList" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table
          :data="pagedRemoteRows"
          style="width:100%"
          @row-click="(row: RemoteMonitorRow) => handleDeviceClick(row.device.id)"
        >
          <el-table-column label="序号" width="64" align="center" fixed="left">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="code" label="设备编号" width="122" fixed="left" />
          <el-table-column prop="name" label="设备名称" min-width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="type" label="设备类型" min-width="140" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" min-width="150" show-overflow-tooltip />
          <el-table-column label="在线状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.online ? 'success' : 'info'" size="small" effect="light">
                {{ row.online ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="运行状态" width="106" align="center">
            <template #default="{ row }">
              <span :class="`badge badge-${row.device.status}`">
                <span class="badge-dot"></span>{{ statusLabels[row.device.status] }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="pointTotal" label="监测点位" width="92" align="center" />
          <el-table-column label="异常/离线" width="100" align="center">
            <template #default="{ row }">
              <span :class="['remote-count', { warn: row.abnormalCount > 0, offline: row.offlineCount > 0 }]">
                {{ row.abnormalCount }} / {{ row.offlineCount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="最高告警" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="remoteAlarmTagType(row.alarmLevel)" size="small" effect="light">
                {{ remoteAlarmLabels[row.alarmLevel] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="latestAlarmTime" label="最新报警时间" min-width="150" show-overflow-tooltip />
          <el-table-column prop="lastRefresh" label="数据更新时间" min-width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="120" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.device.id)">
                查看监测
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else class="service-list-pending">
      <div class="service-list-pending-icon">
        <component v-if="activeServiceMeta" :is="activeServiceMeta.icon" />
      </div>
      <div class="service-list-pending-body">
        <div class="service-list-pending-title">{{ activeServiceMeta?.label ?? '服务列表' }}</div>
        <div class="service-list-pending-desc">
          {{ activeServiceMeta?.summary ?? '该服务列表内容待确认。' }}
        </div>
        <div class="service-list-pending-note">列表字段与记录口径待确认后接入。</div>
      </div>
    </div>

    <div style="height:16px"></div>

    <!-- 数据查看弹窗 -->
    <DeviceDataDialog v-model="dataDialog.visible" :device="dataDialog.device" :category="dataDialog.category" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { View } from '@element-plus/icons-vue'
import { useSceneStore } from '@/stores/scene'
import { getDevices, getDeviceMonitoringPoints } from '@/mock'
import type { Device, SceneId } from '@/mock'
import DeviceDataDialog from '@/components/data/DeviceDataDialog.vue'
import ServiceMenu from '@/components/ServiceMenu.vue'
import { flatServices, type ServiceKey } from '@/components/serviceCatalog'

// 8 类数据列（每类一个「查看」按钮 → 弹窗）
const dataColumns = [
  { key: 'point',   label: '日常点巡检数据' },
  { key: 'damage',  label: '损伤/故障维修数据' },
  { key: 'control', label: '安全监控数据' },
  { key: 'health',  label: '健康监测数据' },
  { key: 'risk',    label: '风险定量监测数据' },
  { key: 'inspect', label: '检验检测数据' },
  { key: 'basic',   label: '设备监管基础数据' },
  { key: 'supply',  label: '设备制造供给数据' }
]

const dataDialog = reactive<{ visible: boolean; device: Device | null; category: string }>({
  visible: false, device: null, category: 'basic'
})
function openData(device: Device, category: string) {
  dataDialog.device = device
  dataDialog.category = category
  dataDialog.visible = true
}

const router = useRouter()
const route  = useRoute()
const store  = useSceneStore()

const viewMode   = ref<'card' | 'list'>('list')
const filters    = ref({ name: '', status: '', type: '', group: '', affiliatedUnit: '', subsidiary: '' })
const allDevices = ref<Device[]>([])
const currentPage = ref(1)
const pageSize    = ref(20)

const sceneId   = computed(() => (route.params.id as SceneId) || store.currentScene)
const activeServiceKey = computed(() => store.activeService as ServiceKey | null)
const activeServiceMeta = computed(() =>
  activeServiceKey.value ? flatServices.find(s => s.key === activeServiceKey.value) : null
)
const DATA_HISTORY_SERVICES: ServiceKey[] = ['point', 'maintain', 'inspect', 'basicdata', 'supply']
const isRemoteList = computed(() => activeServiceKey.value === 'remote')
const isHistoryList = computed(() =>
  !activeServiceKey.value || DATA_HISTORY_SERVICES.includes(activeServiceKey.value)
)
const usesDeviceScope = computed(() => isHistoryList.value || isRemoteList.value)
watch(isRemoteList, (val) => {
  if (val) viewMode.value = 'list'
}, { immediate: true })

const statusLabels: Record<string, string> = { running:'运行中', standby:'待机', stopped:'停机', maintenance:'维修中' }
const statusOptions = ['running','standby','stopped','maintenance'].map(v => ({ value:v, label:statusLabels[v] }))
/** 技术参数前6项列名（与 mock 中顺序一致） */
const techParamColumnNames = ['额定起重量', '跨度', '起升高度', '工作级别', '起升速度', '运行速度']

const deviceTypes = computed(() => [...new Set(allDevices.value.map(d => d.type))])

const filteredDevices = computed(() =>
  allDevices.value.filter(d => {
    if (filters.value.group      && d.group      !== filters.value.group)      return false
    if (filters.value.affiliatedUnit && d.affiliatedUnit !== filters.value.affiliatedUnit) return false
    if (filters.value.subsidiary && d.subsidiary !== filters.value.subsidiary) return false
    if (filters.value.name       && !d.name.includes(filters.value.name))       return false
    if (filters.value.status     && d.status    !== filters.value.status)       return false
    if (filters.value.type       && d.type      !== filters.value.type)       return false
    return true
  })
)
const filteredTotal = computed(() => filteredDevices.value.length)

const pagedDevices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDevices.value.slice(start, start + pageSize.value)
})

type RemoteAlarmLevel = 'normal' | 'warning' | 'danger' | 'offline'
interface RemoteMonitorRow {
  device: Device
  code: string
  name: string
  type: string
  location: string
  online: boolean
  pointTotal: number
  abnormalCount: number
  offlineCount: number
  alarmLevel: RemoteAlarmLevel
  latestAlarmTime: string
  lastRefresh: string
}

const remoteAlarmLabels: Record<RemoteAlarmLevel, string> = {
  normal: '正常',
  warning: '预警',
  danger: '报警',
  offline: '离线'
}

function remoteAlarmTagType(level: RemoteAlarmLevel) {
  const map: Record<RemoteAlarmLevel, 'success' | 'warning' | 'danger' | 'info'> = {
    normal: 'success',
    warning: 'warning',
    danger: 'danger',
    offline: 'info'
  }
  return map[level]
}

function stableMinuteOffset(id: string) {
  return id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 28
}

function formatRefreshTime(device: Device) {
  const d = new Date()
  d.setMinutes(d.getMinutes() - stableMinuteOffset(device.id))
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function buildRemoteRow(device: Device): RemoteMonitorRow {
  const points = getDeviceMonitoringPoints(device.id)
  const abnormalCount = points.filter(point => point.status === 'abnormal').length
  const offlineCount = points.filter(point => point.status === 'offline').length
  const alarmLevel: RemoteAlarmLevel =
    !device.online ? 'offline' :
    abnormalCount >= 2 || device.riskLevel === 'high' ? 'danger' :
    abnormalCount > 0 || offlineCount > 0 || device.riskLevel === 'medium' ? 'warning' :
    'normal'

  return {
    device,
    code: device.code,
    name: device.name,
    type: device.type,
    location: device.location,
    online: device.online,
    pointTotal: points.length,
    abnormalCount,
    offlineCount,
    alarmLevel,
    latestAlarmTime: device.latestAlarmTime ?? '—',
    lastRefresh: device.online ? formatRefreshTime(device) : '—'
  }
}

const pagedRemoteRows = computed(() =>
  pagedDevices.value.map(device => buildRemoteRow(device))
)

// Reset to page 1 when filters or scene change
watch(filteredDevices, () => { currentPage.value = 1 })

function formatTechParams(params: { name: string; value: string }[] | undefined): string {
  if (!params?.length) return '—'
  return params.map(p => `${p.name}: ${p.value}`).join('；')
}

function applyFilter() { /* reactive computed handles filtering */ }
function resetFilter()  {
  filters.value = {
    ...filters.value,
    name: '',
    status: '',
    type: ''
  }
}

function applyRouteQueryFilters() {
  const group = typeof route.query.group === 'string' ? route.query.group : ''
  const affiliatedUnit = typeof route.query.affiliatedUnit === 'string' ? route.query.affiliatedUnit : ''
  const subsidiary = typeof route.query.subsidiary === 'string' ? route.query.subsidiary : ''
  filters.value = {
    ...filters.value,
    group,
    affiliatedUnit,
    subsidiary
  }
}

function handleDeviceClick(id: string) {
  store.setDevice(id, !!store.activeService)
  router.push(`/device/${id}`)
}

function loadData() {
  const sid = sceneId.value
  store.setScene(sid)
  const res = getDevices(sid, 1, 9999)
  allDevices.value = res.list
  applyRouteQueryFilters()
}

onMounted(loadData)
watch(() => route.params.id, loadData)
watch(() => route.query, applyRouteQueryFilters)
</script>

<style scoped>
.scene-service-menu {
  margin: -4px -4px 16px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
}

.scene-header-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 12px;
}

.scene-header--compact {
  justify-content: flex-end;
  margin-bottom: 12px;
}

.scene-header-badge {
  font-size: 16px;
  font-weight: 700;
  border-radius: var(--radius-full);
  padding: 0 16px;
  height: 28px;
}

.filter-tags-section {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md, 8px);
}
.filter-tags-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
}
.filter-tags-row + .filter-tags-row {
  margin-top: 10px;
}
.filter-tags-label {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  width: 56px;
}
.filter-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.filter-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-content-bg);
  border: 1px solid var(--color-border-light);
  border-radius: 100px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s, border-color 0.2s;
}
.filter-tag:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: rgba(22, 119, 255, 0.06);
}
.filter-tag.active {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.tech-params-cell {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.device-card-row--tech .device-card-tech {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md, 8px);
}

.filter-bar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.filter-bar-total {
  font-size: 12px;
  color: var(--color-text-muted);
}
.scene-list-container {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
}
.scene-list-container .data-table-wrap {
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
.scene-list-container .device-grid {
  padding: 16px;
}
.scene-list-container-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-light);
}
.remote-count {
  font-weight: 700;
  color: var(--color-success);
}
.remote-count.warn {
  color: var(--color-warning);
}
.remote-count.offline {
  color: var(--color-danger);
}
.service-list-pending {
  min-height: 240px;
  padding: 28px 30px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--color-card-shadow);
  display: flex;
  align-items: flex-start;
  gap: 18px;
}
.service-list-pending-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  background: rgba(22, 119, 255, 0.08);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.service-list-pending-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 680px;
}
.service-list-pending-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
}
.service-list-pending-desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}
.service-list-pending-note {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>
