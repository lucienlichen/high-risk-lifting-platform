<template>
  <div class="fts-panel">
    <div v-if="!board" class="fts-empty" role="status">
      <span class="fts-empty-icon"><el-icon :size="34"><Search /></el-icon></span>
      <h3>请先选择设备</h3>
      <p>选择设备后，可开展设备、人员与环境危险源故障排查。</p>
    </div>

    <div v-else class="fts-scroll">
      <section class="fts-section fts-workspace" aria-labelledby="fts-workspace-title">
        <header class="fts-section-head fts-workspace-head">
          <div class="fts-section-title">
            <el-icon class="fts-title-icon"><ChatDotSquare /></el-icon>
            <h3 id="fts-workspace-title">问题处理</h3>
            <span>危险源排查与分析</span>
          </div>
        </header>

        <div class="fts-tabs" role="tablist" aria-label="危险源类型">
          <button
            v-for="category in categoryTree"
            :id="`fts-tab-${category.id}`"
            :key="category.id"
            type="button"
            role="tab"
            class="fts-tab"
            :class="{ active: activeCategoryId === category.id }"
            :aria-selected="activeCategoryId === category.id"
            :aria-controls="`fts-category-${category.id}`"
            @click="switchCategory(category)"
          >
            <el-icon><component :is="categoryIcons[category.code] || SetUp" /></el-icon>
            {{ category.name }}
          </button>
        </div>

        <div
          :id="activeCategoryId ? `fts-category-${activeCategoryId}` : undefined"
          class="fts-workspace-body"
          role="tabpanel"
          :aria-labelledby="activeCategoryId ? `fts-tab-${activeCategoryId}` : undefined"
        >
          <aside class="fts-tree" aria-label="危险源分类树">
            <div v-for="sub in currentSubcategories" :key="sub.id" class="fts-tree-group">
              <button
                type="button"
                class="fts-tree-node"
                :class="{ active: activeSubcategoryId === sub.id && !sub.children?.length }"
                :aria-expanded="sub.children?.length ? expandedSubcategories.has(sub.id) : undefined"
                :aria-label="sub.children?.length ? `${expandedSubcategories.has(sub.id) ? '收起' : '展开'}${sub.name}` : `查看${sub.name}危险源`"
                @click="toggleSubcategory(sub)"
              >
                <el-icon v-if="sub.children?.length" class="fts-tree-chevron">
                  <ArrowDown v-if="expandedSubcategories.has(sub.id)" />
                  <ArrowRight v-else />
                </el-icon>
                <span v-else class="fts-tree-spacer"></span>
                <span class="fts-tree-code">{{ sub.code }}</span>
                <span class="fts-tree-name">{{ sub.name }}</span>
              </button>
              <div v-if="sub.children?.length && expandedSubcategories.has(sub.id)" class="fts-tree-children">
                <button
                  v-for="child in sub.children"
                  :key="child.id"
                  type="button"
                  class="fts-tree-node fts-tree-child"
                  :class="{ active: activeSubcategoryId === child.id }"
                  :aria-current="activeSubcategoryId === child.id ? 'true' : undefined"
                  :aria-label="`查看${child.name}危险源`"
                  @click="selectSubcategory(child)"
                >
                  <span class="fts-tree-code">{{ child.code }}</span>
                  <span class="fts-tree-name">{{ child.name }}</span>
                </button>
              </div>
            </div>
          </aside>

          <main class="fts-hazard-content" aria-live="polite">
            <div v-if="!activeSubcategoryId" class="fts-content-empty">
              <el-icon :size="36"><Warning /></el-icon>
              <p>请从左侧选择危险源分类进行排查</p>
            </div>

            <div v-else-if="!analysisTarget" class="fts-list-view">
              <div class="fts-list-head">
                <h4>{{ activeSubcategoryName }} — 危险源清单</h4>
                <span>{{ hazardItems.length }} 项</span>
              </div>
              <button
                v-for="item in hazardItems"
                :key="item.id"
                type="button"
                class="fts-hazard-item"
                :aria-label="`分析危险源：${item.description}`"
                @click="startAnalysis(item)"
              >
                <span class="fts-item-number">{{ item.itemNo }})</span>
                <span class="fts-item-description">{{ item.description }}</span>
                <el-icon class="fts-item-arrow"><ArrowRight /></el-icon>
              </button>
              <div v-if="hazardItems.length === 0" class="fts-content-empty fts-content-empty-list">暂无危险源数据</div>
            </div>

            <div v-else class="fts-analysis-view">
              <button type="button" class="fts-back" aria-label="返回危险源清单" @click="backToList">
                <el-icon><Back /></el-icon>返回列表
              </button>

              <div class="fts-analysis-status" :class="{ done: analysisStep >= 1 }" role="status">
                <span v-if="analysisStep === 0" class="fts-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                <el-icon v-else><CircleCheckFilled /></el-icon>
                <span>{{ analysisStep === 0 ? '正在分析危险源…' : '分析完成' }}</span>
              </div>

              <Transition name="fts-reveal">
                <article v-if="analysisStep >= 1" class="fts-analysis-card">
                  <span class="fts-analysis-icon primary"><el-icon><Search /></el-icon></span>
                  <div>
                    <h5>危险源描述</h5>
                    <p>{{ analysisTarget.description }}</p>
                  </div>
                </article>
              </Transition>

              <Transition name="fts-reveal">
                <article v-if="analysisStep >= 2" class="fts-analysis-card">
                  <span class="fts-analysis-icon warning"><el-icon><Warning /></el-icon></span>
                  <div>
                    <h5>产生原因</h5>
                    <p v-if="causeGroups.length === 0">该危险源为环境因素，无特定产生原因条款。</p>
                    <section v-for="group in causeGroups" v-else :key="group.stage" class="fts-cause-group">
                      <div class="fts-cause-head"><strong>{{ group.stage }}</strong><span>{{ group.items.length }} 项</span></div>
                      <div v-for="cause in group.items" :key="cause.code" class="fts-cause-row">
                        <code>{{ cause.code }}</code><span>{{ cause.description }}</span>
                      </div>
                    </section>
                  </div>
                </article>
              </Transition>

              <Transition name="fts-reveal">
                <article v-if="analysisStep >= 3" class="fts-analysis-card">
                  <span class="fts-analysis-icon danger"><el-icon><BellFilled /></el-icon></span>
                  <div>
                    <h5>可能导致的危险事件</h5>
                    <div class="fts-event-list">
                      <span v-for="event in hazardEvents" :key="event.code"><el-icon><WarningFilled /></el-icon>{{ event.name }}</span>
                    </div>
                  </div>
                </article>
              </Transition>
            </div>
          </main>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type Component } from 'vue'
import {
  ArrowDown,
  ArrowRight,
  Back,
  BellFilled,
  ChatDotSquare,
  CircleCheckFilled,
  Cloudy,
  Search,
  SetUp,
  User,
  Warning,
  WarningFilled,
} from '@element-plus/icons-vue'
import type { Device } from '@/mock'
import {
  getFaultTroubleshootingBoard,
  type FaultTroubleshootingBoard,
} from '@/mock/faultTroubleshooting'
import {
  getCategoryTree,
  getCauses,
  getEvents,
  getItems,
  type CauseEntry,
  type EventEntry,
  type HazardCategory,
  type HazardItem,
} from '@/mock/hazardSource'

const props = defineProps<{ device: Device | null }>()
defineEmits<{ (event: 'close'): void }>()

const board = computed<FaultTroubleshootingBoard | null>(() =>
  props.device ? getFaultTroubleshootingBoard(props.device.id) : null,
)

const categoryTree = getCategoryTree()
const categoryIcons: Record<string, Component> = {
  equipment: SetUp,
  personnel: User,
  environment: Cloudy,
}
const activeCategoryId = ref<number | null>(null)
const activeSubcategoryId = ref<number | null>(null)
const expandedSubcategories = ref<Set<number>>(new Set())
const hazardItems = ref<HazardItem[]>([])
const analysisTarget = ref<HazardItem | null>(null)
const analysisStep = ref(-1)
const hazardCauses = ref<CauseEntry[]>([])
const hazardEvents = ref<EventEntry[]>([])
const analysisTimers: number[] = []

const currentSubcategories = computed<HazardCategory[]>(() =>
  categoryTree.find((category) => category.id === activeCategoryId.value)?.children ?? [],
)
const activeSubcategoryName = computed(() => {
  for (const subcategory of currentSubcategories.value) {
    if (subcategory.id === activeSubcategoryId.value) return subcategory.name
    const child = subcategory.children?.find((item) => item.id === activeSubcategoryId.value)
    if (child) return child.name
  }
  return ''
})
const causeGroups = computed(() => {
  const groups = new Map<string, CauseEntry[]>()
  hazardCauses.value.forEach((cause) => {
    if (!groups.has(cause.stage)) groups.set(cause.stage, [])
    groups.get(cause.stage)?.push(cause)
  })
  return Array.from(groups.entries()).map(([stage, items]) => ({ stage, items }))
})

function clearAnalysisTimers() {
  analysisTimers.splice(0).forEach((timer) => window.clearTimeout(timer))
}

function selectSubcategory(subcategory: HazardCategory) {
  activeSubcategoryId.value = subcategory.id
  analysisTarget.value = null
  analysisStep.value = -1
  hazardCauses.value = []
  hazardEvents.value = []
  clearAnalysisTimers()
  hazardItems.value = getItems(subcategory.id)
}

function switchCategory(category: HazardCategory) {
  activeCategoryId.value = category.id
  activeSubcategoryId.value = null
  expandedSubcategories.value = new Set()
  hazardItems.value = []
  analysisTarget.value = null
  analysisStep.value = -1
  clearAnalysisTimers()
}

function toggleSubcategory(subcategory: HazardCategory) {
  if (!subcategory.children?.length) {
    selectSubcategory(subcategory)
    return
  }
  const next = new Set(expandedSubcategories.value)
  next.has(subcategory.id) ? next.delete(subcategory.id) : next.add(subcategory.id)
  expandedSubcategories.value = next
}

function startAnalysis(item: HazardItem) {
  clearAnalysisTimers()
  analysisTarget.value = item
  analysisStep.value = 0
  hazardCauses.value = []
  hazardEvents.value = []
  analysisTimers.push(window.setTimeout(() => { analysisStep.value = 1 }, 350))
  analysisTimers.push(window.setTimeout(() => {
    hazardCauses.value = getCauses(item.causeCodes)
    analysisStep.value = 2
  }, 700))
  analysisTimers.push(window.setTimeout(() => {
    hazardEvents.value = getEvents(item.eventCodes)
    analysisStep.value = 3
  }, 1050))
}

function backToList() {
  clearAnalysisTimers()
  analysisTarget.value = null
  analysisStep.value = -1
}

function resetToDefault() {
  clearAnalysisTimers()
  const equipment = categoryTree[0]
  activeCategoryId.value = equipment?.id ?? null
  const metalStructure = equipment?.children?.[0]
  if (metalStructure?.children?.length) {
    expandedSubcategories.value = new Set([metalStructure.id])
    selectSubcategory(metalStructure.children[0])
  } else if (metalStructure) {
    expandedSubcategories.value = new Set()
    selectSubcategory(metalStructure)
  }
}

watch(() => props.device?.id, resetToDefault, { immediate: true })
onBeforeUnmount(clearAnalysisTimers)
</script>

<style scoped>
.fts-panel {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  min-width: 0;
  min-height: 0;
  background: var(--color-content-bg);
}
.fts-scroll {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.fts-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
  color: var(--color-text-muted);
}
.fts-empty-icon {
  width: 64px;
  height: 64px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
}
.fts-empty h3 { font-size: 15px; color: var(--color-text-primary); }
.fts-empty p { max-width: 420px; font-size: 13px; line-height: 1.7; }

.fts-section {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
}

.fts-section { flex-shrink: 0; overflow: hidden; }
.fts-section-head { min-height: 48px; padding: 0 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--color-border-light); }
.fts-section-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.fts-section-title h3 { font-size: 15px; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; }
.fts-section-title > span { font-size: 12px; color: var(--color-text-muted); }
.fts-title-icon { color: var(--color-primary); }
.fts-title-bar { width: 4px; height: 16px; border-radius: 999px; background: var(--color-primary); }
.fts-section-note { font-size: 11px; color: var(--color-text-muted); text-align: right; }

.fts-workspace { min-height: 640px; flex: 1 0 640px; display: flex; flex-direction: column; }
.fts-workspace-head { flex-shrink: 0; }
.fts-tabs { flex-shrink: 0; display: flex; align-items: center; gap: 8px; min-height: 60px; padding: 8px 14px; border-bottom: 1px solid var(--color-border-light); overflow-x: auto; }
.fts-tab,
.fts-tree-node,
.fts-hazard-item,
.fts-back {
  border: 0;
  font: inherit;
  cursor: pointer;
}
.fts-tab { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 0 18px; border-radius: var(--radius-sm); background: color-mix(in srgb, var(--color-content-bg) 74%, var(--color-card-bg)); color: var(--color-text-secondary); font-size: 13px; font-weight: 600; white-space: nowrap; transition: background-color .2s, color .2s; }
.fts-tab:hover { background: var(--color-primary-light); color: var(--color-primary); }
.fts-tab.active { background: var(--color-primary); color: var(--color-text-white); }
.fts-workspace-body { flex: 1; min-width: 0; min-height: 0; display: flex; }
.fts-tree { width: 252px; flex-shrink: 0; overflow-y: auto; padding: 8px; border-right: 1px solid var(--color-border-light); }
.fts-tree-group { margin-bottom: 2px; }
.fts-tree-node { width: 100%; min-height: 44px; display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: var(--radius-sm); background: transparent; color: var(--color-text-secondary); text-align: left; transition: background-color .2s, color .2s; }
.fts-tree-node:hover { background: color-mix(in srgb, var(--color-content-bg) 72%, var(--color-card-bg)); }
.fts-tree-node.active { background: var(--color-warning-bg); color: var(--color-warning); }
.fts-tree-chevron,
.fts-tree-spacer { width: 14px; flex: 0 0 14px; color: var(--color-text-muted); }
.fts-tree-code { min-width: 30px; flex-shrink: 0; font-size: 11px; font-weight: 700; color: var(--color-text-muted); }
.fts-tree-name { min-width: 0; overflow: hidden; font-size: 13px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.fts-tree-node.active .fts-tree-name { font-weight: 600; }
.fts-tree-children { padding-left: 16px; }
.fts-tree-child { padding-left: 10px; }

.fts-hazard-content { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; }
.fts-content-empty { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 24px; font-size: 13px; color: var(--color-text-muted); text-align: center; }
.fts-content-empty-list { min-height: 180px; }
.fts-list-view,
.fts-analysis-view { padding: 16px; }
.fts-list-head { min-height: 34px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.fts-list-head h4 { font-size: 15px; color: var(--color-text-primary); }
.fts-list-head > span { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 999px; background: color-mix(in srgb, var(--color-content-bg) 78%, var(--color-card-bg)); color: var(--color-text-secondary); font-size: 12px; font-weight: 600; }
.fts-hazard-item { width: 100%; min-height: 48px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; padding: 9px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-card-bg); color: var(--color-text-primary); text-align: left; transition: border-color .2s, box-shadow .2s, background-color .2s; }
.fts-hazard-item:hover { border-color: var(--color-primary); box-shadow: var(--color-card-shadow-hover); background: color-mix(in srgb, var(--color-primary-light) 25%, var(--color-card-bg)); }
.fts-item-number { min-width: 28px; flex-shrink: 0; color: var(--color-warning); font-size: 13px; font-weight: 700; }
.fts-item-description { flex: 1; min-width: 0; font-size: 14px; line-height: 1.6; }
.fts-item-arrow { flex-shrink: 0; color: var(--color-text-muted); }
.fts-hazard-item:hover .fts-item-arrow { color: var(--color-primary); }

.fts-back { min-height: 44px; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 8px; padding: 0 12px; border-radius: var(--radius-sm); background: color-mix(in srgb, var(--color-content-bg) 74%, var(--color-card-bg)); color: var(--color-text-secondary); font-size: 13px; }
.fts-back:hover { color: var(--color-primary); }
.fts-analysis-status { min-height: 48px; display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 0 14px; border-radius: var(--radius-sm); background: color-mix(in srgb, var(--color-content-bg) 74%, var(--color-card-bg)); color: var(--color-text-secondary); font-size: 14px; }
.fts-analysis-status.done { background: var(--color-success-bg); color: var(--color-success); }
.fts-dots { display: inline-flex; gap: 4px; }
.fts-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--color-text-muted); animation: fts-dot 1.2s infinite ease-in-out; }
.fts-dots i:nth-child(2) { animation-delay: .2s; }
.fts-dots i:nth-child(3) { animation-delay: .4s; }
@keyframes fts-dot { 0%, 80%, 100% { transform: scale(.6); opacity: .4; } 40% { transform: scale(1); opacity: 1; } }
.fts-analysis-card { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 14px; margin-bottom: 10px; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-card-bg); box-shadow: var(--color-card-shadow); }
.fts-analysis-icon { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); background: var(--color-content-bg); }
.fts-analysis-icon.primary { color: var(--color-primary); }
.fts-analysis-icon.warning { color: var(--color-warning); }
.fts-analysis-icon.danger { color: var(--color-danger); }
.fts-analysis-card h5 { margin: 1px 0 7px; font-size: 14px; color: var(--color-text-primary); }
.fts-analysis-card p { font-size: 13px; line-height: 1.7; color: var(--color-text-secondary); }
.fts-cause-group { margin-top: 10px; }
.fts-cause-head { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
.fts-cause-head strong { padding: 3px 8px; border-radius: 4px; background: var(--color-warning-bg); color: var(--color-warning); font-size: 12px; }
.fts-cause-head span { font-size: 11px; color: var(--color-text-muted); }
.fts-cause-row { display: grid; grid-template-columns: 66px minmax(0, 1fr); gap: 8px; padding: 5px 0; font-size: 13px; line-height: 1.6; color: var(--color-text-secondary); }
.fts-cause-row code { color: var(--color-text-muted); font-size: 12px; }
.fts-event-list { display: flex; flex-wrap: wrap; gap: 8px; }
.fts-event-list > span { min-height: 32px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: var(--radius-sm); background: var(--color-danger-bg); color: var(--color-danger); font-size: 13px; }
.fts-reveal-enter-active { transition: opacity .3s ease, transform .3s ease; }
.fts-reveal-enter-from { opacity: 0; transform: translateY(10px); }

button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

@media (max-width: 820px) {
  .fts-scroll { padding: 12px; }
  .fts-workspace { min-height: 760px; flex-basis: auto; }
  .fts-workspace-body { flex-direction: column; }
  .fts-tree { width: 100%; max-height: 250px; border-right: 0; border-bottom: 1px solid var(--color-border-light); }
  .fts-hazard-content { min-height: 430px; }
  .fts-section-head { align-items: flex-start; flex-direction: column; padding-top: 10px; padding-bottom: 10px; }
  .fts-section-note { text-align: left; }
}
@media (prefers-reduced-motion: reduce) {
  .fts-tab,
  .fts-tree-node,
  .fts-hazard-item,
  .fts-reveal-enter-active { transition: none; }
  .fts-dots i { animation: none; opacity: .7; transform: none; }
}
</style>
