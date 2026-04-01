<template>
  <div class="content-scrollable">

    <!-- Scene Header -->
    <div class="scene-header">
      <div class="scene-header-left">
        <div class="scene-header-title">
          {{ sceneInfo?.name }}场景起重机接入数量
        </div>
      </div>
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

    <!-- 集团 / 子公司 标签筛选（两行横向） -->
    <div v-if="sceneGroups.length" class="filter-tags-section">
      <div class="filter-tags-row">
        <span class="filter-tags-label">集团：</span>
        <div class="filter-tags-wrap">
          <span
            v-for="g in groupTagOptions"
            :key="'g-' + g.value"
            :class="['filter-tag', { active: filters.group === g.value }]"
            @click="filters.group = g.value; filters.subsidiary = ''"
          >{{ g.label }}</span>
        </div>
      </div>
      <div class="filter-tags-row">
        <span class="filter-tags-label">子公司：</span>
        <div class="filter-tags-wrap">
          <span
            v-for="s in subsidiaryTagOptions"
            :key="'s-' + s.value"
            :class="['filter-tag', { active: filters.subsidiary === s.value }]"
            @click="filters.subsidiary = s.value"
          >{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- 统计（左） + 搜索（右）：同一行 -->
    <div class="filter-bar filter-bar-with-stats">
      <div class="filter-bar-stats scene-list-footer">
        <span class="scene-list-footer-item">
          <span class="scene-list-footer-label">设备总数</span>
          <span class="scene-list-footer-value">{{ listFooterTotal }}</span>
        </span>
        <span class="scene-list-footer-item">
          <span class="scene-list-footer-label">运行中设备数</span>
          <span class="scene-list-footer-value scene-list-footer-value--running">{{ listFooterRunning }}</span>
        </span>
        <span class="scene-list-footer-item">
          <span class="scene-list-footer-label">未运行设备数</span>
          <span class="scene-list-footer-value scene-list-footer-value--stopped">{{ listFooterStopped }}</span>
        </span>
      </div>
      <div class="filter-bar-right">
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
        <span class="filter-bar-total">共 {{ filteredTotal }} 台设备</span>
      </div>
    </div>

    <!-- 列表 + 分页：同一卡片容器 -->
    <div class="scene-list-container">
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
            <el-table-column label="序号" width="72" align="center">
              <template #default="{ $index }">
                {{ (currentPage - 1) * pageSize + $index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="code" label="设备编号" width="130" />
            <el-table-column prop="name" label="设备名称" min-width="200" />
            <el-table-column prop="type" label="设备类型" width="160" />
            <el-table-column prop="installDate" label="投用日期" width="110" />
            <el-table-column
              v-for="(paramName, idx) in techParamColumnNames"
              :key="paramName"
              :label="paramName"
              width="100"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ row.technicalParams?.[idx]?.value ?? '—' }}
              </template>
            </el-table-column>
            <el-table-column label="设备运行状态" width="110">
              <template #default="{ row }">
                <span :class="`badge badge-${row.status}`">
                  <span class="badge-dot"></span>{{ statusLabels[row.status] }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="已运行时长(h)" width="120">
              <template #default="{ row }">{{ row.operatingHours.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.id)">详情</el-button>
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

    <div style="height:16px"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSceneStore } from '@/stores/scene'
import { getDevices, getSceneGroups, getSceneSubsidiaries, SCENES } from '@/mock'
import type { Device, SceneId } from '@/mock'

const router = useRouter()
const route  = useRoute()
const store  = useSceneStore()

const viewMode   = ref<'card' | 'list'>('list')
const filters    = ref({ name: '', status: '', type: '', group: '', subsidiary: '' })
const allDevices = ref<Device[]>([])
const currentPage = ref(1)
const pageSize    = ref(20)

const sceneId   = computed(() => (route.params.id as SceneId) || store.currentScene)
const sceneInfo = computed(() => SCENES.find(s => s.id === sceneId.value))
const sceneGroups = computed(() => getSceneGroups(sceneId.value))
const subsidiaryOptions = computed(() =>
  filters.value.group
    ? getSceneSubsidiaries(sceneId.value, filters.value.group)
    : getSceneSubsidiaries(sceneId.value)
)
const groupTagOptions = computed(() => [
  { label: '全部', value: '' },
  ...sceneGroups.value.map(g => ({ label: g, value: g }))
])
const subsidiaryTagOptions = computed(() => [
  { label: '全部', value: '' },
  ...subsidiaryOptions.value.map(s => ({ label: s, value: s }))
])

const statusLabels: Record<string, string> = { running:'运行中', standby:'待机', stopped:'停机', maintenance:'维修中' }
const statusOptions = ['running','standby','stopped','maintenance'].map(v => ({ value:v, label:statusLabels[v] }))
/** 技术参数前6项列名（与 mock 中顺序一致） */
const techParamColumnNames = ['额定起重量', '跨度', '起升高度', '工作级别', '起升速度', '运行速度']

const deviceTypes = computed(() => [...new Set(allDevices.value.map(d => d.type))])

const filteredDevices = computed(() =>
  allDevices.value.filter(d => {
    if (filters.value.group      && d.group      !== filters.value.group)      return false
    if (filters.value.subsidiary && d.subsidiary !== filters.value.subsidiary) return false
    if (filters.value.name       && !d.name.includes(filters.value.name))       return false
    if (filters.value.status     && d.status    !== filters.value.status)       return false
    if (filters.value.type       && d.type      !== filters.value.type)       return false
    return true
  })
)
const filteredTotal = computed(() => filteredDevices.value.length)
const listFooterTotal   = computed(() => filteredTotal.value)
const listFooterRunning = computed(() => filteredDevices.value.filter(d => d.status === 'running').length)
const listFooterStopped = computed(() => filteredDevices.value.filter(d => d.status !== 'running').length)

const pagedDevices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDevices.value.slice(start, start + pageSize.value)
})

// Reset to page 1 when filters or scene change
watch(filteredDevices, () => { currentPage.value = 1 })

function formatTechParams(params: { name: string; value: string }[] | undefined): string {
  if (!params?.length) return '—'
  return params.map(p => `${p.name}: ${p.value}`).join('；')
}

function applyFilter() { /* reactive computed handles filtering */ }
function resetFilter()  { filters.value = { name:'', status:'', type:'', group:'', subsidiary:'' } }

function handleDeviceClick(id: string) {
  store.setDevice(id)
  router.push(`/device/${id}`)
}

function loadData() {
  const sid = sceneId.value
  store.setScene(sid)
  const res = getDevices(sid, 1, 9999)
  allDevices.value = res.list
}

onMounted(loadData)
watch(() => route.params.id, loadData)
</script>

<style scoped>
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
.filter-bar-with-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.filter-bar-stats {
  flex-shrink: 0;
}
.filter-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
  justify-content: flex-end;
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
.scene-list-footer {
  display: flex;
  gap: 32px;
  align-items: center;
  font-size: 13px;
}
.scene-list-footer-item {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}
.scene-list-footer-label {
  color: var(--color-text-muted);
}
.scene-list-footer-value {
  font-weight: 600;
  color: var(--color-text-primary);
}
.scene-list-footer-value--running {
  color: var(--color-success);
}
.scene-list-footer-value--stopped {
  color: var(--color-text-secondary);
}
</style>
