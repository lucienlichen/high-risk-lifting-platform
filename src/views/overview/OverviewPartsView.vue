<template>
  <div class="device-view-root parts-workspace" :class="{ 'is-nest': scheme === 'nest' }">
    <DeviceStrip v-if="card" :code="card.code" :type="card.type || '—'" :tone="tone" :status-label="statusLabels[tone]" :back-label="scheme === 'nest' ? '返回设备卡片' : '返回'" @back="router.push({ name: 'overviewPlant', query })">
      <span v-if="scheme === 'nest'" class="nest-summary">共 {{ partTotal }} 个部件 · 未接入 {{ offTotal }}</span>
      <template #actions>
        <div class="parts-switch" role="tablist" aria-label="部件页方案">
          <button type="button" :class="{ on: scheme === 'legacy' }" @click="setScheme('legacy')">旧版方案</button>
          <button type="button" :class="{ on: scheme === 'nest' }" @click="setScheme('nest')">新版方案</button>
        </div>
        <label><input v-model="alertsOnly" type="checkbox"> 只看报警/异常</label>
        <template v-if="scheme === 'nest'">
          <span class="nest-mode"><button type="button" class="on">全览 · 嵌套</button><button type="button" title="本方案只展示全览嵌套">组织架构</button></span>
        </template>
        <span v-else>全览 · 嵌套</span>
      </template>
    </DeviceStrip>

    <div v-if="card && scheme === 'legacy'" class="parts-scroll">
      <div class="legend-row"><span v-for="status in legend" :key="status"><i class="lg" :class="`lg-${status}`"></i>{{ statusLabels[status] }}</span><span><i class="lg lg-all"></i>专业整体（新增入口）</span><em>五列专业 · 分组聚合 / 结构点位 · 颜色取下级最差 · 底部「整体」进入专业级详情</em></div>
      <div class="cols-5">
        <section v-for="column in columns" :key="column.name" class="spec-col" :class="{ 'is-focus': focused === column.name, 'is-dim': focused && focused !== column.name }">
          <button type="button" class="col-head col-focus" :class="`is-${worstStatus(column.groups.flatMap(g => g.nodes))}`" @click="focusColumn(column.name)">{{ column.name }}</button>
          <div class="col-body" :ref="el => observeColumn(el)">
            <div v-for="group in column.groups" :key="group.name" class="l2-panel" :style="{ '--group-min': `${44 + visibleNodes(group.nodes).length * 46}px` }">
              <button type="button" class="l2-title" @click="open(column.name, group.name, true)">{{ group.name }}</button>
              <div class="l3-stack">
                <button v-for="node in visibleNodes(group.nodes)" :key="node.name" type="button" class="node-card" :class="`is-${node.status}`" :disabled="node.status === 'off'" :title="`${node.name} · ${statusLabels[node.status]}`" @click="open(column.name, node.name, false)"><span class="node-name">{{ node.name }}</span></button>
                <span v-if="!visibleNodes(group.nodes).length" class="muted">暂无报警/异常</span>
              </div>
            </div>
          </div>
          <button type="button" class="whole" :title="`进入${column.name}整体详情`" @click="openOverall(column.name)">
            <span class="st" :style="{ background: stripeColor(column) }"></span>
            <span class="ic" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.4"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg></span>
            <span class="tx"><b>{{ column.name }}整体</b><small>{{ overallMeta(column.name).hint }}</small></span>
            <span class="tag">{{ overallMeta(column.name).kind }}</span>
            <span class="go">›</span>
          </button>
        </section>
      </div>
    </div>

    <div v-else-if="card" class="parts-scroll nest-scroll">
      <div class="nest-board">
        <section v-for="column in columns" :key="column.name" class="nest-col" :class="[`is-${columnTone(column)}`, { 'is-focus': focused === column.name, 'is-dim': focused && focused !== column.name }]">
          <button type="button" class="nest-head" :class="`is-${columnTone(column)}`" @click="focusColumn(column.name)">
            <strong>{{ column.name }}</strong>
            <span>{{ column.groups.length }}组 · {{ flatNodes(column).length }}个部件 · {{ countStatus(flatNodes(column), 'off') }}未接入</span>
          </button>
          <div class="nest-body">
            <article v-for="group in visibleGroups(column)" :key="group.name" class="nest-group" :class="`is-${worstStatus(group.nodes)}`">
              <button type="button" class="nest-group-hd" @click="open(column.name, group.name, true)">
                <span>{{ group.name }}</span>
                <em>{{ group.nodes.length }}个部件</em>
              </button>
              <button v-for="node in visibleNodes(group.nodes)" :key="node.name" type="button" class="nest-row" :class="`is-${node.status}`" :disabled="node.status === 'off'" @click="open(column.name, node.name, false)">
                <i class="nest-dot" :class="node.status"></i>
                <span class="nest-name">{{ node.name }}</span>
                <span v-if="node.status !== 'ok'" class="nest-state">{{ statusLabels[node.status] }}</span>
                <span class="nest-pts">{{ pointCounts.get(keyOf(column.name, node.name)) || 0 }} 点位</span>
                <span v-if="node.status !== 'off'" class="nest-go">›</span>
              </button>
              <p v-if="!visibleNodes(group.nodes).length" class="nest-empty">暂无报警/异常</p>
            </article>
          </div>
        </section>
      </div>
      <div class="legend-row nest-legend">
        <span v-for="status in legend" :key="status"><i class="nest-dot" :class="status"></i>{{ statusLabels[status] }}</span>
        <em>层级：一级专业为列头，二级部件组标题左对齐，三级部件行进入点位详情。颜色取下级最严重状态。</em>
      </div>
    </div>
    <el-empty v-else description="没有这台设备" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount, type ComponentPublicInstance } from 'vue'
import DeviceStrip from '@/components/DeviceStrip.vue'
import { usePartsDevice } from '@/composables/usePartsDevice'
import { statusLabels, structureData, worstStatus, type PartColumn, type PartNode, type PointStatus } from '@/mock/partsPoint'

const { card, columns, query, tone, router, route } = usePartsDevice()
const legend: PointStatus[] = ['alarm', 'warn', 'ok', 'off']
const alertsOnly = ref(false)
const focused = ref('')
const scheme = ref<'legacy' | 'nest'>('legacy')
let timer: ReturnType<typeof setTimeout>

watch(() => route.query.partsScheme, value => {
  scheme.value = value === 'nest' ? 'nest' : 'legacy'
}, { immediate: true })

function setScheme(next: 'legacy' | 'nest') {
  const queryNext = { ...route.query }
  if (next === 'nest') queryNext.partsScheme = 'nest'
  else delete queryNext.partsScheme
  router.replace({ query: queryNext })
}

function focusColumn(name: string) { clearTimeout(timer); focused.value = name; timer = setTimeout(() => { focused.value = '' }, 1400) }
const observer = new ResizeObserver(entries => entries.forEach(entry => {
  const body = entry.target as HTMLElement
  const needed = [...body.querySelectorAll<HTMLElement>('.l2-panel')].reduce((sum, panel) => sum + parseFloat(panel.style.getPropertyValue('--group-min')), 0) + (body.children.length - 1) * 8 + 16
  body.parentElement?.classList.toggle('is-overflow', needed > body.clientHeight)
}))
function observeColumn(el: Element | ComponentPublicInstance | null) { if (el instanceof Element) { observer.unobserve(el); observer.observe(el) } }
onBeforeUnmount(() => { clearTimeout(timer); observer.disconnect() })
function visibleNodes(nodes: PartNode[]) { return alertsOnly.value ? nodes.filter(n => n.status === 'alarm' || n.status === 'warn') : nodes }
function visibleGroups(column: PartColumn) {
  return column.groups.filter(group => !alertsOnly.value || visibleNodes(group.nodes).length)
}
function flatNodes(column: PartColumn) { return column.groups.flatMap(group => group.nodes) }
function columnTone(column: PartColumn) { return worstStatus(flatNodes(column)) }
function countStatus(nodes: PartNode[], status: PointStatus) { return nodes.filter(node => node.status === status).length }
function keyOf(specialty: string, name: string) { return `${specialty}/${name}` }
const allNodes = computed(() => columns.value.flatMap(flatNodes))
const partTotal = computed(() => allNodes.value.length)
const offTotal = computed(() => countStatus(allNodes.value, 'off'))
const pointCounts = computed(() => {
  const map = new Map<string, number>()
  columns.value.forEach(column => column.groups.forEach(group => group.nodes.forEach(node => {
    map.set(keyOf(column.name, node.name), structureData(node, column.name).points.filter(point => point.status !== 'twin').length)
  })))
  return map
})
const overallCatalog: Record<string, { id: string; kind: string; hint: string }> = {
  金属结构: { id: 'metal', kind: '结构', hint: '桥架 · 小车架 全部点位汇总' },
  起升机构: { id: 'hoist', kind: '机构', hint: '主副起升 · 卷筒钢丝绳 · 吊具' },
  运行机构: { id: 'travel', kind: '机构', hint: '大车运行 · 小车运行' },
  电气系统: { id: 'electric', kind: '机构', hint: '供电 · 控制 · 照明与信号' },
  安全防护装置: { id: 'safety', kind: '机构', hint: '限位 · 超载 · 防碰撞' }
}
const stripeColors: Record<PointStatus, string> = { alarm: '#f5222d', warn: '#fa8c16', ok: '#52c41a', off: '#94a3b8', twin: '#94a3b8' }
function overallMeta(name: string) { return overallCatalog[name] || { id: 'metal', kind: '机构', hint: '专业全部测点汇总' } }
function stripeColor(column: PartColumn) { return stripeColors[worstStatus(column.groups.flatMap(group => group.nodes))] }
function openOverall(name: string) {
  router.push({
    name: 'overviewOverall',
    params: { id: card.value!.id },
    query: { ...query.value, prof: overallMeta(name).id, menu: 'health' }
  })
}
function open(specialty: string, part: string, aggregate: boolean) {
  router.push({
    name: 'overviewPoint',
    params: { id: card.value!.id },
    query: { ...query.value, specialty, part, mode: aggregate ? 'aggregate' : 'structure', ...(scheme.value === 'nest' ? { partsScheme: 'nest' } : {}) }
  })
}
</script>
<style scoped src="@/styles/parts-point.css"></style>
