<template>
  <div class="content-scrollable">

    <!-- Scene Header -->
    <div class="scene-header">
      <div class="scene-header-left">
        <div class="scene-header-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1677ff" stroke-width="2" stroke-linecap="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          平台总览 · 设备接入概况
          <span class="scene-header-tag">演示版</span>
        </div>
        <div class="scene-header-desc">
          当前平台已接入冶金起重装备、港口起重装备、造船起重装备、建筑起重装备四大场景，共 {{ totalDevices.toLocaleString() }} 台起重装备，实时监控设备运行状态与风险等级。
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <!-- View toggle -->
        <div class="view-toggle">
          <button :class="['view-toggle-btn', { active: viewMode === 'card' }]" @click="viewMode = 'card'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            卡片视图
          </button>
          <button :class="['view-toggle-btn', { active: viewMode === 'list' }]" @click="viewMode = 'list'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            列表视图
          </button>
        </div>
        <el-button size="small" type="primary" plain @click="router.push(`/scene/${store.currentScene}`)">
          进入场景总览
          <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Stats Row (all 4 scenes) -->
    <div class="home-stats-grid">
      <div
        v-for="scene in SCENES"
        :key="scene.id"
        :class="['home-scene-stat', { active: store.currentScene === scene.id }]"
        @click="handleSceneSelect(scene.id)"
      >
        <div class="home-scene-stat-name">{{ scene.name }}</div>
        <div class="home-scene-stat-value">{{ scene.totalDevices.toLocaleString() }}</div>
        <div class="home-scene-stat-sub">台设备</div>
        <div class="home-scene-stat-bar">
          <div
            class="home-scene-stat-bar-fill"
            :style="{ width: (scene.totalDevices / 1600 * 100) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Current Scene Stats -->
    <div class="stats-row" style="margin-bottom:16px">
      <div class="stat-card accent-primary">
        <div class="stat-card-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
          设备总数
        </div>
        <div class="stat-card-value">{{ stats.total.toLocaleString() }}</div>
        <div class="stat-card-sub">{{ currentSceneInfo?.name }} 场景接入</div>
      </div>
      <div class="stat-card accent-success">
        <div class="stat-card-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>
          在线设备
        </div>
        <div class="stat-card-value">{{ stats.online.toLocaleString() }}</div>
        <div class="stat-card-sub">在线率 {{ onlineRate }}%</div>
      </div>
      <div class="stat-card accent-danger">
        <div class="stat-card-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          高风险设备
        </div>
        <div class="stat-card-value">{{ stats.highRisk.toLocaleString() }}</div>
        <div class="stat-card-sub">需立即关注</div>
      </div>
      <div class="stat-card accent-warning">
        <div class="stat-card-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fa8c16" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
          当日告警
        </div>
        <div class="stat-card-value">{{ stats.alarmToday.toLocaleString() }}</div>
        <div class="stat-card-sub">需及时处置</div>
      </div>
    </div>

    <!-- Card View -->
    <template v-if="viewMode === 'card'">
      <div class="device-grid">
        <div
          v-for="device in deviceList"
          :key="device.id"
          class="device-card"
          @click="handleDeviceClick(device.id)"
        >
          <div class="device-card-header">
            <div>
              <div class="device-card-name">{{ device.name }}</div>
              <div class="device-card-code">{{ device.code }}</div>
            </div>
            <span :class="`badge badge-${device.riskLevel}`">
              <span class="badge-dot"></span>
              {{ riskLabels[device.riskLevel] }}
            </span>
          </div>
          <div class="device-card-body">
            <div class="device-card-row">
              <span class="device-card-row-label">设备类型</span>
              <span>{{ device.type }}</span>
            </div>
            <div class="device-card-row">
              <span class="device-card-row-label">运行状态</span>
              <span :class="`badge badge-${device.status}`">
                <span class="badge-dot"></span>{{ statusLabels[device.status] }}
              </span>
            </div>
            <div class="device-card-row">
              <span class="device-card-row-label">健康评分</span>
              <span :style="{ color: scoreColor(device.healthScore), fontWeight: 600 }">
                {{ device.healthScore }}分
              </span>
            </div>
            <div class="device-card-row">
              <span class="device-card-row-label">当前负荷</span>
              <span>{{ device.status === 'running' ? device.load + '%' : '—' }}</span>
            </div>
          </div>
          <div class="device-card-footer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            最近告警：{{ device.latestAlarmTime ?? '暂无' }}
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrap" style="background:transparent;border:none;margin-top:12px">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="deviceTotal"
          layout="total, prev, pager, next"
          background
          small
          @current-change="loadDevices"
        />
      </div>
    </template>

    <!-- List View -->
    <template v-else>
      <div class="data-table-wrap">
        <el-table
          :data="deviceList"
          style="width:100%"
          @row-click="(row: any) => handleDeviceClick(row.id)"
        >
          <el-table-column prop="name"   label="设备名称"  min-width="200" />
          <el-table-column prop="code"   label="设备编号"  width="130" />
          <el-table-column prop="type"   label="设备类型"  width="160" />
          <el-table-column label="运行状态" width="100">
            <template #default="{ row }">
              <span :class="`badge badge-${row.status}`">
                <span class="badge-dot"></span>{{ statusLabels[row.status] }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="风险等级" width="100">
            <template #default="{ row }">
              <span :class="`badge badge-${row.riskLevel}`">
                <span class="badge-dot"></span>{{ riskLabels[row.riskLevel] }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="健康评分" width="100">
            <template #default="{ row }">
              <span :style="{ color: scoreColor(row.healthScore), fontWeight: 600 }">
                {{ row.healthScore }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="latestAlarmTime" label="最近告警" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.latestAlarmTime ?? '—' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.id)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="deviceTotal"
            layout="total, prev, pager, next"
            background
            small
            @current-change="loadDevices"
          />
        </div>
      </div>
    </template>

    <div style="height:16px"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSceneStore } from '@/stores/scene'
import { getDevices, getSceneStats, SCENES } from '@/mock'
import type { Device, SceneId } from '@/mock'

const router = useRouter()
const store  = useSceneStore()

const viewMode   = ref<'card' | 'list'>('card')
const page       = ref(1)
const pageSize   = 20
const deviceList  = ref<Device[]>([])
const deviceTotal = ref(0)
const stats      = ref({ total: 0, online: 0, offline: 0, highRisk: 0, mediumRisk: 0, alarmToday: 0, maintenance: 0, statusDist: {} as any })

const totalDevices      = computed(() => SCENES.reduce((s, sc) => s + sc.totalDevices, 0))
const currentSceneInfo  = computed(() => SCENES.find(s => s.id === store.currentScene))
const onlineRate        = computed(() => stats.value.total ? Math.round(stats.value.online / stats.value.total * 100) : 0)

const statusLabels: Record<string, string> = { running: '运行中', standby: '待机', stopped: '停机', maintenance: '维修中' }
const riskLabels:   Record<string, string> = { normal: '正常', low: '低风险', medium: '中风险', high: '高风险' }

function scoreColor(s: number) {
  if (s >= 85) return 'var(--color-success)'
  if (s >= 70) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function loadDevices() {
  const res    = getDevices(store.currentScene, page.value, pageSize)
  deviceList.value  = res.list
  deviceTotal.value = res.total
}

function loadStats() {
  stats.value = getSceneStats(store.currentScene)
}

function handleSceneSelect(id: SceneId) {
  store.setScene(id)
  page.value = 1
  loadDevices()
  loadStats()
}

function handleDeviceClick(deviceId: string) {
  store.setDevice(deviceId)
  router.push(`/device/${deviceId}`)
}

onMounted(() => { loadDevices(); loadStats() })
watch(() => store.currentScene, () => { page.value = 1; loadDevices(); loadStats() })
</script>

<style scoped>
.home-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.home-scene-stat {
  background: rgba(255,255,255,0.9);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--color-card-shadow);
}

.home-scene-stat:hover {
  border-color: rgba(22,119,255,0.3);
  box-shadow: var(--color-card-shadow-hover);
}

.home-scene-stat.active {
  border-color: var(--color-primary);
  background: rgba(22,119,255,0.04);
}

.home-scene-stat-name  { font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px; }
.home-scene-stat-value { font-size: 22px; font-weight: 700; color: var(--color-text-primary); line-height: 1; }
.home-scene-stat-sub   { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; margin-bottom: 8px; }

.home-scene-stat-bar {
  height: 3px;
  background: var(--color-border-light);
  border-radius: 2px;
  overflow: hidden;
}

.home-scene-stat-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
  opacity: 0.5;
  transition: width 0.4s ease;
}

.home-scene-stat.active .home-scene-stat-bar-fill { opacity: 1; }
</style>
