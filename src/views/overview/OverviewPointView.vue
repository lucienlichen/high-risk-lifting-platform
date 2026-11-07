<template>
  <div class="pd-page">
    <DeviceStrip v-if="card" :code="card.code" :type="card.type || '—'" :tone="tone" :status-label="statusLabels[tone]" back-label="返回部件模型" @back="back">
      <span class="pd-crumb">设备详情 / {{ kindName }} / <strong>{{ title }}</strong><span v-if="aggregate" class="pd-agg"> · 聚合</span> / 点位详情</span>
    </DeviceStrip>

    <template v-if="card && workspaces.length && activePoint && activeWorkspace">
      <div class="pd-current">
        <span class="pd-current-label">当前点位</span>
        <span class="pd-current-name">{{ activePoint.name }}</span>
        <span class="pd-current-id">{{ activePoint.id }}</span>
        <span class="pd-badge" :class="activePoint.status">{{ TONE_LABEL[activePoint.status] }}</span>
        <span class="pd-current-meta">{{ activePoint.multi ? '实测点 · 温声振多通道' : '实测点' }}</span>
        <span class="pd-current-meta">{{ activeWorkspace.scope }}</span>
      </div>

      <div class="pd-workspace">
        <section class="pd-upper">
          <article class="pd-panel">
            <div class="pd-panel-hd">
              <h2>{{ activeWorkspace.modelTitle }}</h2>
              <div class="pd-tools">
                <span class="pd-legend"><i class="is-real"></i>实测点</span>
                <span class="pd-legend"><i class="is-twin"></i>孪生点</span>
                <button type="button" class="pd-mini" @click="resetView">复位视角</button>
                <button type="button" class="pd-mini" @click="zoomed = !zoomed">放大查看</button>
              </div>
            </div>
            <div class="pd-panel-bd pd-model">
              <svg viewBox="0 0 640 270" :style="{ transform: `scale(${zoomed ? 1.15 : 1})` }" role="img" :aria-label="`${activeWorkspace.modelTitle}测点定位`">
                <g v-if="activeWorkspace.schematic === 'gear'" class="pd-schematic">
                  <rect x="180" y="70" width="280" height="140" rx="16" class="pd-case" />
                  <circle cx="250" cy="140" r="28" class="pd-gear" />
                  <circle cx="390" cy="140" r="28" class="pd-gear" />
                  <rect x="270" y="128" width="100" height="24" class="pd-shaft" />
                  <text x="320" y="248" text-anchor="middle">{{ activeWorkspace.scope }} · 点位定位</text>
                </g>
                <g v-else class="pd-schematic">
                  <rect x="40" y="86" width="28" height="78" rx="4" class="pd-leg" />
                  <rect x="572" y="86" width="28" height="78" rx="4" class="pd-leg" />
                  <rect x="56" y="96" width="528" height="56" rx="8" class="pd-beam" />
                  <text x="320" y="248" text-anchor="middle">{{ activeWorkspace.scope }} · 点位定位</text>
                </g>
                <g v-for="twin in activeWorkspace.twins" :key="twin.id" class="pd-twin" @click="twinHint">
                  <circle :cx="twin.x" :cy="twin.y" r="8" />
                  <text :x="twin.x" :y="twin.y + 3" text-anchor="middle">孪</text>
                  <text :x="twin.x + (twin.lx || 0)" :y="twin.y + (twin.ly || 20)" text-anchor="middle">{{ twin.name }}</text>
                </g>
                <g v-for="point in activeWorkspace.points" :key="point.id" class="pd-mark" :class="`is-${point.status}`" @click="selectPoint(point.id)">
                  <circle :cx="point.x" :cy="point.y" :r="point.id === activePoint.id ? 11 : 8" />
                  <text :x="point.x" :y="point.y + 3" text-anchor="middle" class="pd-mark-id">{{ point.id.split('-')[1] || point.id }}</text>
                  <text :x="point.x + (point.lx || 0)" :y="point.y + (point.ly || -16)" :text-anchor="labelAnchor(point.lx)" class="pd-mark-name">{{ point.name }}</text>
                </g>
              </svg>
              <p class="pd-model-note">实测点可选 · 孪生点仅展示，不进点位列表</p>
            </div>
          </article>

          <article class="pd-panel">
            <div class="pd-panel-hd">
              <h2>点位列表</h2>
              <div class="pd-tools">
                <input v-model="search" class="pd-search" type="search" placeholder="搜索点位" aria-label="搜索点位">
                <label class="pd-check"><input v-model="alarmOnly" type="checkbox"> 仅看报警</label>
              </div>
            </div>
            <div class="pd-panel-bd">
              <div v-for="group in visibleGroups" :key="group.name" class="pd-point-list">
                <p v-if="aggregate" class="pd-group">{{ group.name }}</p>
                <button v-for="point in group.points" :id="`pt-${point.id}`" :key="point.id" type="button" class="pd-point" :class="{ 'is-on': point.id === activePoint.id }" :title="point.name" :aria-pressed="point.id === activePoint.id" @click="selectPoint(point.id)">
                  <span>{{ point.name }}</span>
                  <i class="pd-badge" :class="point.status">{{ TONE_LABEL[point.status] }}</i>
                </button>
              </div>
              <p v-if="!visibleGroups.length" class="pd-empty-inline">无匹配点位</p>
            </div>
          </article>

          <article class="pd-panel">
            <div class="pd-panel-hd">
              <h2>本点数据（只读）</h2>
              <span class="pd-hd-note">有无 · 非切换</span>
            </div>
            <div class="pd-panel-bd">
              <div class="pd-kv-list">
                <div v-for="item in DATA_DEFS" :key="item.key" class="pd-kv" :class="activePoint.data.includes(item.key) ? 'is-on' : 'is-off'" :title="activePoint.data.includes(item.key) ? item.hint : `该点位暂无${item.name}`">
                  <span class="pd-kv-name">{{ item.short }}</span>
                  <span class="pd-kv-pill">{{ activePoint.data.includes(item.key) ? '有' : '无' }}</span>
                  <span class="pd-kv-meta">
                    {{ activePoint.data.includes(item.key) ? '本点已关联' : '本点未关联' }}
                    <em v-if="dataRole(activePoint, serviceKey, item.key)">{{ dataRole(activePoint, serviceKey, item.key) }}</em>
                  </span>
                </div>
              </div>
            </div>
          </article>

          <article class="pd-panel">
            <div class="pd-panel-hd"><h2>服务列表</h2></div>
            <div class="pd-panel-bd">
              <button v-for="item in SVC_DEFS" :key="item.key" type="button" class="pd-svc" :class="[serviceClass(item.key), { 'is-on': serviceKey === item.key }]" :title="serviceTitle(item.key)" @click="selectService(item.key)">
                <span class="pd-svc-main">
                  <span>{{ item.name }}</span>
                  <i class="pd-badge" :class="activePoint.services[item.key].result">{{ TONE_LABEL[activePoint.services[item.key].result] }}</i>
                </span>
                <span class="pd-svc-sub">{{ serviceSub(activePoint, item.key) }}</span>
                <span v-if="activePoint.services[item.key].state === 'partial' || (activePoint.status === 'offline' && activePoint.services[item.key].state !== 'off')" class="pd-svc-tags">
                  <em v-if="activePoint.services[item.key].state === 'partial'">待补数据</em>
                  <em v-if="activePoint.status === 'offline' && activePoint.services[item.key].state !== 'off'">历史结果</em>
                </span>
              </button>
            </div>
          </article>
        </section>

        <PointServicePanel
          :key="`${activePoint.id}:${serviceKey}`"
          class="pd-lower"
          :point="activePoint"
          :peers="activeWorkspace.points"
          :kind="activeWorkspace.kind"
          :scope="activeWorkspace.scope"
          :service="serviceKey"
          :expanded="expanded"
          :confirmed="confirmedId === `${activePoint.id}:${serviceKey}`"
          @toggle="expanded = !expanded"
          @confirm="confirmedId = `${activePoint.id}:${serviceKey}`"
        />
      </div>
    </template>
    <el-empty v-else class="pd-missing" :description="card ? '该结构暂未配置点位' : '未找到该设备或部件'">
      <el-button @click="back">返回部件模型</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import DeviceStrip from '@/components/DeviceStrip.vue'
import PointServicePanel from '@/components/point/PointServicePanel.vue'
import { usePartsDevice } from '@/composables/usePartsDevice'
import { statusLabels, structureData, type PointStatus } from '@/mock/partsPoint'
import {
  DATA_DEFS, SVC_DEFS, TONE_LABEL,
  buildPointWorkspace, dataRole, preferredService, serviceSub, toneRank,
  type PointWorkspace, type SvcKey
} from '@/mock/pointDetailV3'

type GroupWorkspace = PointWorkspace & { name: string }

const { card, columns, query, tone, router, route } = usePartsDevice()
const aggregate = computed(() => route.query.mode === 'aggregate')
const title = computed(() => String(route.query.part || ''))
const column = computed(() => columns.value.find(item => item.name === route.query.specialty))
const kindName = computed(() => column.value?.name === '金属结构' ? '结构' : '机构')

const workspaces = computed<GroupWorkspace[]>(() => {
  const col = column.value
  if (!col) return []
  const nodes = aggregate.value
    ? col.groups.find(group => group.name === title.value)?.nodes || []
    : col.groups.flatMap(group => group.nodes).filter(node => node.name === title.value)
  return nodes.filter(node => node.status !== 'off').map(node => {
    const data = structureData(node, col.name)
    const workspace = buildPointWorkspace({
      partName: node.name,
      specialty: col.name,
      nodeStatus: node.status as PointStatus,
      fallbackPoints: data.points
    })
    return { name: node.name, ...workspace }
  }).filter(group => group.points.length)
})

const flatPoints = computed(() => workspaces.value.flatMap(group => group.points.map(point => ({ ...point, group: group.name }))))
const selectedId = ref('')
const serviceKey = ref<SvcKey>('assess')
const expanded = ref(false)
const search = ref('')
const alarmOnly = ref(false)
const zoomed = ref(false)
const confirmedId = ref('')

const activePoint = computed(() => flatPoints.value.find(point => point.id === selectedId.value) || flatPoints.value[0])
const activeWorkspace = computed(() => workspaces.value.find(group => group.points.some(point => point.id === activePoint.value?.id)) || workspaces.value[0])

const visibleGroups = computed(() => {
  const queryText = search.value.trim()
  return workspaces.value.map(group => ({
    name: group.name,
    points: [...group.points]
      .filter(point => !alarmOnly.value || point.status === 'alarm' || point.status === 'warn')
      .filter(point => !queryText || `${point.name}${point.id}`.includes(queryText))
      .sort((a, b) => toneRank(a.status) - toneRank(b.status) || a.order - b.order)
  })).filter(group => group.points.length)
})

watch(workspaces, groups => {
  const ranked = groups.flatMap(group => group.points).sort((a, b) => toneRank(a.status) - toneRank(b.status) || a.order - b.order)
  const next = ranked[0]
  selectedId.value = next?.id || ''
  serviceKey.value = next ? preferredService(next) : 'remote'
  expanded.value = false
  search.value = ''
  alarmOnly.value = false
  zoomed.value = false
}, { immediate: true })

function selectPoint(id: string) {
  if (id === selectedId.value) return
  selectedId.value = id
  expanded.value = false
  nextTick(() => document.getElementById(`pt-${id}`)?.scrollIntoView({ block: 'nearest' }))
}
function selectService(key: SvcKey) {
  serviceKey.value = key
  expanded.value = false
}
function serviceClass(key: SvcKey) {
  const result = activePoint.value?.services[key].result
  if (result === 'alarm' || result === 'warn' || result === 'ok') return `is-${result}`
  return 'is-na'
}
function serviceTitle(key: SvcKey) {
  const point = activePoint.value
  if (!point) return ''
  const state = point.services[key]
  return [SVC_DEFS.find(item => item.key === key)?.name, TONE_LABEL[state.result], state.hint, state.reason].filter(Boolean).join(' · ')
}
function labelAnchor(lx?: number) {
  if ((lx || 0) <= -12) return 'end'
  if ((lx || 0) >= 12) return 'start'
  return 'middle'
}
function resetView() {
  zoomed.value = false
  ElMessage.success('已复位视角')
}
function twinHint() {
  ElMessage.info('数字孪生点只在模型与结果中呈现，不可选为当前点位')
}
function back() {
  router.push({ name: 'overviewParts', params: { id: route.params.id }, query: query.value })
}
</script>

<style src="@/styles/point-detail-v3.css"></style>
