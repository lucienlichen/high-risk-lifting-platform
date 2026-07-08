<template>
  <div class="platform-layout">

    <!-- ─── Top Header Bar ─── -->
    <header class="top-bar">
      <div class="top-bar-left">
        <!-- Platform logo mark -->
        <div class="platform-logo" title="服务菜单" @click="router.push('/services')">
          <img src="/logo.png" alt="平台 Logo" />
        </div>
        <div class="platform-title">
          <h1>高风险起重装备智能运维与事故防控云服务平台</h1>
        </div>
      </div>

      <div class="top-bar-right">
        <span class="current-time">{{ currentTime }}</span>

        <div class="top-bar-search-wrap">
          <el-input
            v-model="searchVal"
            size="small"
            placeholder="搜索设备编号 / 名称..."
            class="top-bar-search"
            style="width: 190px"
          >
            <template #prefix>
              <el-icon style="color:rgba(255,255,255,0.4)"><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="notification-btn" title="消息通知">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="notif-dot"></span>
        </div>

        <el-dropdown trigger="click" @command="handleUserCommand">
          <div class="user-info">
            <div class="user-avatar">{{ avatarText }}</div>
            <span class="user-name">{{ displayName }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- ─── Main Body ─── -->
    <div class="main-body">

      <!-- Right Content Area -->
      <main class="content-area">
        <div v-if="showTopHierarchy" class="top-hierarchy-nav">
          <div class="hierarchy-crumbs">
            <span class="hierarchy-crumb strong">{{ currentGroup || currentSceneInfo?.name || '设备范围' }}</span>
            <span v-if="currentAffiliatedUnit" class="hierarchy-sep">/</span>
            <span v-if="currentAffiliatedUnit" class="hierarchy-crumb">{{ currentAffiliatedUnit }}</span>
            <span v-if="currentSubsidiary" class="hierarchy-sep">/</span>
            <span v-if="currentSubsidiary" class="hierarchy-crumb">{{ currentSubsidiary }}</span>
            <span v-if="currentDevice" class="hierarchy-sep">/</span>
            <span v-if="currentDevice" class="hierarchy-crumb strong">{{ currentDevice.name }}</span>
            <span v-if="route.name === 'scene'" class="hierarchy-count">{{ hierarchyDeviceCount }} 台设备</span>
          </div>
        </div>
        <router-view v-slot="{ Component }">
          <component :is="Component" class="route-content" />
        </router-view>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSceneStore } from '@/stores/scene'
import { useAuthStore }  from '@/stores/auth'
import { getDeviceById, getDevices, SCENES } from '@/mock'
import type { SceneId }  from '@/mock'

const router = useRouter()
const route  = useRoute()
const store  = useSceneStore()
const auth   = useAuthStore()

const searchVal    = ref('')
const currentTime  = ref('')
const currentScene = computed(() => store.currentScene)
const showTopHierarchy = computed(() => route.name === 'scene' || route.name === 'device')
const currentSceneInfo = computed(() => SCENES.find(scene => scene.id === currentScene.value))
const currentDevice = computed(() => {
  const id = route.name === 'device'
    ? (route.params.id as string | undefined)
    : store.currentDeviceId ?? undefined
  return id ? getDeviceById(id) : null
})
const currentGroup = computed(() => {
  if (currentDevice.value?.group) return currentDevice.value.group
  return typeof route.query.group === 'string' ? route.query.group : ''
})
const currentSubsidiary = computed(() => {
  if (currentDevice.value?.subsidiary) return currentDevice.value.subsidiary
  return typeof route.query.subsidiary === 'string' ? route.query.subsidiary : ''
})
const currentAffiliatedUnit = computed(() => {
  if (currentDevice.value?.affiliatedUnit) return currentDevice.value.affiliatedUnit
  return typeof route.query.affiliatedUnit === 'string' ? route.query.affiliatedUnit : ''
})
const hierarchyDeviceCount = computed(() => {
  const devices = getDevices(currentScene.value, 1, 9999).list
  return devices.filter(device => {
    if (currentGroup.value && device.group !== currentGroup.value) return false
    if (currentAffiliatedUnit.value && device.affiliatedUnit !== currentAffiliatedUnit.value) return false
    if (currentSubsidiary.value && device.subsidiary !== currentSubsidiary.value) return false
    return true
  }).length
})

const displayName = computed(() => auth.username || '管理员')
const avatarText  = computed(() => displayName.value.charAt(0).toUpperCase())

function handleUserCommand(command: string) {
  if (command === 'logout') {
    auth.logout()
    router.push('/login')
  }
}

let timer: number

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => clearInterval(timer))

function updateTime() {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

function handleSceneClick(id: SceneId) {
  store.setScene(id)
  store.setDevice(null, !!store.activeService)
  if (route.name !== 'scene' || !store.activeService) {
    store.setService(null)
  }
  router.push(`/scene/${id}`)
}

// ─── Inline SVG Icons for Scenes ─────────────────────────────────────
const MetallurgyIcon = defineComponent({
  render: () => h('svg', { width: 36, height: 36, viewBox: '0 0 36 36', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    // Bridge crane silhouette
    h('line', { x1: 4, y1: 10, x2: 32, y2: 10 }),
    h('rect', { x: 12, y: 6, width: 12, height: 4, rx: 0.5 }),
    h('line', { x1: 18, y1: 10, x2: 18, y2: 20 }),
    h('rect', { x: 13, y: 20, width: 10, height: 6, rx: 1 }),
    h('line', { x1: 4, y1: 10, x2: 4, y2: 30 }),
    h('line', { x1: 32, y1: 10, x2: 32, y2: 30 }),
    h('line', { x1: 2, y1: 30, x2: 34, y2: 30 }),
    h('circle', { cx: 7, cy: 30, r: 2.5 }),
    h('circle', { cx: 29, cy: 30, r: 2.5 }),
  ])
})

const PortIcon = defineComponent({
  render: () => h('svg', { width: 36, height: 36, viewBox: '0 0 36 36', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    // Quay crane (ship-to-shore)
    h('line', { x1: 8, y1: 4, x2: 8, y2: 28 }),
    h('line', { x1: 8, y1: 4, x2: 28, y2: 12 }),
    h('line', { x1: 8, y1: 10, x2: 22, y2: 16 }),
    h('line', { x1: 22, y1: 12, x2: 22, y2: 22 }),
    h('rect', { x: 16, y: 22, width: 12, height: 5, rx: 1 }),
    h('line', { x1: 6, y1: 28, x2: 32, y2: 28 }),
    h('path', { d: 'M4 32 Q18 29 32 32' }),
    h('line', { x1: 8, y1: 28, x2: 8, y2: 32 }),
    h('line', { x1: 28, y1: 28, x2: 28, y2: 30 }),
  ])
})

const ConstructionIcon = defineComponent({
  render: () => h('svg', { width: 36, height: 36, viewBox: '0 0 36 36', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    // Tower crane
    h('line', { x1: 16, y1: 3, x2: 16, y2: 32 }),
    h('line', { x1: 16, y1: 3, x2: 30, y2: 10 }),
    h('line', { x1: 16, y1: 10, x2: 6,  y2: 14 }),
    h('line', { x1: 16, y1: 6,  x2: 24, y2: 10 }),
    h('line', { x1: 24, y1: 10, x2: 24, y2: 20 }),
    h('rect', { x: 20, y: 20, width: 8, height: 5, rx: 0.5 }),
    h('line', { x1: 6,  y1: 14, x2: 6,  y2: 18 }),
    h('rect', { x: 4, y: 18, width: 4, height: 3, rx: 0.5 }),
    h('line', { x1: 14, y1: 32, x2: 18, y2: 32 }),
    h('line', { x1: 13, y1: 32, x2: 12, y2: 34 }),
    h('line', { x1: 19, y1: 32, x2: 20, y2: 34 }),
  ])
})

const ShipbuildingIcon = defineComponent({
  render: () => h('svg', { width: 36, height: 36, viewBox: '0 0 36 36', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    // Gantry crane
    h('line', { x1: 4,  y1: 14, x2: 32, y2: 14 }),
    h('rect', { x: 14, y: 8,  width: 8, height: 6, rx: 0.5 }),
    h('line', { x1: 18, y1: 14, x2: 18, y2: 24 }),
    h('line', { x1: 4,  y1: 14, x2: 4,  y2: 30 }),
    h('line', { x1: 32, y1: 14, x2: 32, y2: 30 }),
    h('line', { x1: 2,  y1: 30, x2: 34, y2: 30 }),
    h('circle', { cx: 6,  cy: 30, r: 2 }),
    h('circle', { cx: 12, cy: 30, r: 2 }),
    h('circle', { cx: 24, cy: 30, r: 2 }),
    h('circle', { cx: 30, cy: 30, r: 2 }),
    // Hook
    h('path', { d: 'M16 24 Q16 28 18 28 Q20 28 20 26' }),
  ])
})

const sceneIcons: Record<SceneId, ReturnType<typeof defineComponent>> = {
  metallurgy:   MetallurgyIcon,
  port:         PortIcon,
  construction: ConstructionIcon,
  shipbuilding: ShipbuildingIcon
}
</script>
