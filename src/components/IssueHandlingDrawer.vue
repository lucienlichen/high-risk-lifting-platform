<template>
  <div class="ish-drawer">
    <div class="ish-shell">
      <!-- Top bar -->
      <div class="ish-top-bar">
        <div class="ish-top-left">
          <el-icon class="ish-top-icon"><ChatLineSquare /></el-icon>
          <span class="ish-top-title">问题处理</span>
          <span class="ish-top-sub">危险源排查与分析</span>
        </div>
        <div class="ish-actions">
          <el-button size="small" circle @click="emit('close')">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- Category tabs -->
      <div class="ish-tabs">
        <button
          v-for="cat in tree"
          :key="cat.id"
          class="ish-tab"
          :class="{ active: activeCatId === cat.id }"
          @click="switchCategory(cat)"
        >
          <el-icon :size="18"><component :is="cat.icon || 'Warning'" /></el-icon>
          <span>{{ cat.name }}</span>
        </button>
      </div>

      <div class="ish-body">
        <!-- Left: sub-category tree -->
        <aside class="ish-sidebar">
          <template v-for="sub in currentSubs" :key="sub.id">
            <div class="ish-sub-group">
              <button
                class="ish-sub-header"
                :class="{ active: activeSubId === sub.id && !sub.children }"
                @click="toggleSub(sub)"
              >
                <el-icon v-if="sub.children" class="ish-chevron" :size="12">
                  <component :is="expanded.has(sub.id) ? 'ArrowDown' : 'ArrowRight'" />
                </el-icon>
                <span v-else class="ish-chevron-spacer"></span>
                <span class="ish-sub-code">{{ sub.code }}</span>
                <span class="ish-sub-name">{{ sub.name }}</span>
              </button>
              <div v-if="sub.children && expanded.has(sub.id)" class="ish-sub-children">
                <button
                  v-for="child in sub.children"
                  :key="child.id"
                  class="ish-sub-child"
                  :class="{ active: activeSubId === child.id }"
                  @click="selectSub(child)"
                >
                  <span class="ish-sub-code">{{ child.code }}</span>
                  <span class="ish-sub-name">{{ child.name }}</span>
                </button>
              </div>
            </div>
          </template>
        </aside>

        <!-- Right: content -->
        <main class="ish-main">
          <!-- Empty -->
          <div v-if="!activeSubId" class="ish-empty">
            <el-icon :size="48" class="ish-empty-icon"><Warning /></el-icon>
            <p>请从左侧选择危险源分类进行排查</p>
          </div>

          <template v-else>
            <!-- Item list -->
            <div v-if="!analysisTarget" class="ish-item-list">
              <div class="ish-item-list-head">
                <span>{{ activeSubName }} — 危险源清单</span>
                <span class="ish-item-count">{{ items.length }} 项</span>
              </div>
              <button
                v-for="item in items"
                :key="item.id"
                class="ish-item-card"
                @click="startAnalysis(item)"
              >
                <span class="ish-item-no">{{ item.itemNo }})</span>
                <span class="ish-item-desc">{{ item.description }}</span>
                <el-icon class="ish-item-arrow" :size="14"><ArrowRight /></el-icon>
              </button>
              <div v-if="items.length === 0" class="ish-item-empty">暂无危险源数据</div>
            </div>

            <!-- AI analysis -->
            <div v-else class="ish-analysis">
              <button class="ish-back" @click="analysisTarget = null">
                <el-icon><ArrowLeft /></el-icon> 返回列表
              </button>

              <div class="ish-loading" :class="{ done: analysisStep >= 1 }">
                <span v-if="analysisStep === 0" class="ish-dots"><span></span><span></span><span></span></span>
                <span v-if="analysisStep === 0">正在分析危险源...</span>
                <el-icon v-if="analysisStep >= 1" :size="18"><CircleCheck /></el-icon>
                <span v-if="analysisStep >= 1">分析完成</span>
              </div>

              <transition name="ish-fade">
                <div v-if="analysisStep >= 1" class="ish-section">
                  <div class="ish-section-icon" style="color: var(--color-primary);"><el-icon :size="18"><Search /></el-icon></div>
                  <div class="ish-section-content">
                    <h4 class="ish-section-title">危险源描述</h4>
                    <p class="ish-section-text">{{ analysisTarget.description }}</p>
                  </div>
                </div>
              </transition>

              <transition name="ish-fade">
                <div v-if="analysisStep >= 2" class="ish-section">
                  <div class="ish-section-icon" style="color: var(--color-warning);"><el-icon :size="18"><WarningFilled /></el-icon></div>
                  <div class="ish-section-content">
                    <h4 class="ish-section-title">产生原因</h4>
                    <div v-if="causeGroups.length === 0" class="ish-section-text">该危险源为环境因素，无特定产生原因条款</div>
                    <div v-for="group in causeGroups" :key="group.stage" class="ish-cause-group">
                      <div class="ish-cause-stage">
                        <span class="ish-stage-name">{{ group.stage }}</span>
                        <span class="ish-stage-count">{{ group.items.length }}项</span>
                      </div>
                      <div v-for="cause in group.items" :key="cause.code" class="ish-cause-item">
                        <span class="ish-cause-code">{{ cause.code }}</span>
                        <span class="ish-cause-desc">{{ cause.description }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>

              <transition name="ish-fade">
                <div v-if="analysisStep >= 3" class="ish-section">
                  <div class="ish-section-icon" style="color: var(--color-danger);"><el-icon :size="18"><Bell /></el-icon></div>
                  <div class="ish-section-content">
                    <h4 class="ish-section-title">可能导致的危险事件</h4>
                    <div class="ish-event-list">
                      <div v-for="evt in events" :key="evt.code" class="ish-event-tag">
                        <el-icon :size="16"><component :is="evt.icon || 'Warning'" /></el-icon>
                        <span>{{ evt.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </template>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Close, ChatLineSquare, Warning, WarningFilled, ArrowRight, ArrowLeft,
  Search, Bell, CircleCheck
} from '@element-plus/icons-vue'
import {
  getCategoryTree, getItems, getCauses, getEvents
} from '@/mock/hazardSource'
import type { HazardCategory, HazardItem, CauseEntry, EventEntry } from '@/mock/hazardSource'
import type { Device } from '@/mock'

defineProps<{
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const tree = getCategoryTree()
const activeCatId = ref<number | null>(tree.length ? tree[0].id : null)
const activeSubId = ref<number | null>(null)
const expanded = ref<Set<number>>(new Set())
const items = ref<HazardItem[]>([])

const analysisTarget = ref<HazardItem | null>(null)
const analysisStep = ref(-1)
const causes = ref<CauseEntry[]>([])
const events = ref<EventEntry[]>([])

let timers: number[] = []

const currentSubs = computed<HazardCategory[]>(() => {
  return tree.find((c) => c.id === activeCatId.value)?.children ?? []
})

const activeSubName = computed(() => {
  for (const sub of currentSubs.value) {
    if (sub.id === activeSubId.value) return sub.name
    const child = sub.children?.find((c) => c.id === activeSubId.value)
    if (child) return child.name
  }
  return ''
})

const causeGroups = computed(() => {
  const groups = new Map<string, CauseEntry[]>()
  for (const c of causes.value) {
    if (!groups.has(c.stage)) groups.set(c.stage, [])
    groups.get(c.stage)!.push(c)
  }
  return Array.from(groups.entries()).map(([stage, list]) => ({ stage, items: list }))
})

function clearTimers() {
  timers.forEach((t) => window.clearTimeout(t))
  timers = []
}

function switchCategory(cat: HazardCategory) {
  activeCatId.value = cat.id
  activeSubId.value = null
  analysisTarget.value = null
  items.value = []
  expanded.value = new Set()
  clearTimers()
}

function toggleSub(sub: HazardCategory) {
  if (sub.children) {
    const s = new Set(expanded.value)
    if (s.has(sub.id)) s.delete(sub.id)
    else s.add(sub.id)
    expanded.value = s
  } else {
    selectSub(sub)
  }
}

function selectSub(sub: HazardCategory) {
  activeSubId.value = sub.id
  analysisTarget.value = null
  clearTimers()
  items.value = getItems(sub.id)
}

function startAnalysis(item: HazardItem) {
  clearTimers()
  analysisTarget.value = item
  analysisStep.value = 0
  causes.value = []
  events.value = []

  timers.push(window.setTimeout(() => { analysisStep.value = 1 }, 350))
  timers.push(window.setTimeout(() => {
    causes.value = getCauses(item.causeCodes)
    analysisStep.value = 2
  }, 700))
  timers.push(window.setTimeout(() => {
    events.value = getEvents(item.eventCodes)
    analysisStep.value = 3
  }, 1050))
}
</script>

<style scoped>
.ish-drawer {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.ish-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ish-top-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 12px;
  background: rgba(248, 250, 252, 0.88);
  border-bottom: 1px solid var(--color-border-light);
}

.ish-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ish-top-icon {
  color: var(--color-primary);
  font-size: 18px;
}

.ish-top-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.ish-top-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* Tabs */
.ish-tabs {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  background: var(--color-card-bg);
  border-bottom: 1px solid var(--color-border-light);
}

.ish-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ish-tab:hover {
  background: var(--color-nav-hover-bg);
  color: var(--color-text-primary);
}

.ish-tab.active {
  background: var(--color-primary);
  color: #fff;
}

.ish-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

/* Sidebar */
.ish-sidebar {
  width: 240px;
  flex-shrink: 0;
  overflow-y: auto;
  background: var(--color-card-bg);
  border-right: 1px solid var(--color-border-light);
  padding: 8px;
}

.ish-sub-group {
  margin-bottom: 2px;
}

.ish-sub-header,
.ish-sub-child {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.ish-sub-header:hover,
.ish-sub-child:hover {
  background: var(--color-nav-hover-bg);
}

.ish-sub-header.active,
.ish-sub-child.active {
  background: var(--color-warning-bg);
}

.ish-sub-header.active .ish-sub-name,
.ish-sub-child.active .ish-sub-name {
  color: var(--color-warning);
  font-weight: 600;
}

.ish-chevron {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.ish-chevron-spacer {
  width: 12px;
  flex-shrink: 0;
}

.ish-sub-code {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  min-width: 26px;
}

.ish-sub-name {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.ish-sub-children {
  padding-left: 16px;
}

/* Main */
.ish-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.ish-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.ish-empty-icon {
  color: var(--color-border);
}

/* Item list */
.ish-item-list {
  padding: 16px;
}

.ish-item-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.ish-item-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-border-light);
  padding: 2px 10px;
  border-radius: 10px;
}

.ish-item-card {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  text-align: left;
  box-shadow: var(--color-card-shadow);
  transition: all 0.15s;
}

.ish-item-card:hover {
  box-shadow: var(--color-card-shadow-hover);
  border-color: var(--color-primary);
}

.ish-item-no {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-warning);
  flex-shrink: 0;
  min-width: 26px;
}

.ish-item-desc {
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.5;
  flex: 1;
}

.ish-item-arrow {
  flex-shrink: 0;
  color: var(--color-text-muted);
  margin-top: 3px;
}

.ish-item-empty {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
  font-size: 13px;
}

/* Analysis */
.ish-analysis {
  padding: 16px;
}

.ish-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 14px;
  transition: color 0.2s;
}

.ish-back:hover {
  color: var(--color-warning);
}

.ish-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--color-text-secondary);
  box-shadow: var(--color-card-shadow);
  transition: all 0.3s;
}

.ish-loading.done {
  background: var(--color-success-bg);
  border-color: transparent;
  color: var(--color-success);
}

.ish-dots {
  display: flex;
  gap: 4px;
}

.ish-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-muted);
  animation: ish-dot 1.2s infinite ease-in-out;
}

.ish-dots span:nth-child(2) { animation-delay: 0.2s; }
.ish-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes ish-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.ish-section {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  box-shadow: var(--color-card-shadow);
  border-radius: var(--radius-md);
  margin-bottom: 10px;
}

.ish-section-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-content-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ish-section-content {
  flex: 1;
  min-width: 0;
}

.ish-section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.ish-section-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.ish-cause-group {
  margin-bottom: 12px;
}

.ish-cause-stage {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.ish-stage-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-warning);
  background: var(--color-warning-bg);
  padding: 1px 8px;
  border-radius: 4px;
}

.ish-stage-count {
  font-size: 11px;
  color: var(--color-text-muted);
}

.ish-cause-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  line-height: 1.5;
}

.ish-cause-code {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-family: monospace;
  font-size: 11px;
  min-width: 52px;
}

.ish-cause-desc {
  color: var(--color-text-secondary);
}

.ish-event-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ish-event-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-danger-bg);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  font-size: 13px;
  font-weight: 500;
}

.ish-fade-enter-active {
  transition: all 0.35s ease-out;
}

.ish-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
</style>
