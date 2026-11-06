<template>
  <div class="device-view-root parts-workspace">
    <DeviceStrip v-if="card" :code="card.code" :type="card.type || '—'" :tone="tone" :status-label="statusLabels[tone]" @back="router.push({ name: 'overviewPlant', query })">
      <template #actions><label><input v-model="alertsOnly" type="checkbox"> 只看报警/异常</label><span>全览 · 嵌套</span></template>
    </DeviceStrip>
    <div v-if="card" class="parts-scroll">
      <div class="legend-row"><span v-for="status in legend" :key="status"><i class="lg" :class="`lg-${status}`"></i>{{ statusLabels[status] }}</span><em>五列专业 · 分组聚合 / 结构点位 · 颜色取下级最差</em></div>
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
        </section>
      </div>
    </div>
    <el-empty v-else description="没有这台设备" />
  </div>
</template>
<script setup lang="ts">
import { ref, onBeforeUnmount, type ComponentPublicInstance } from 'vue'
import DeviceStrip from '@/components/DeviceStrip.vue'
import { usePartsDevice } from '@/composables/usePartsDevice'
import { statusLabels, worstStatus, type PartNode, type PointStatus } from '@/mock/partsPoint'
const { card, columns, query, tone, router } = usePartsDevice()
const legend: PointStatus[] = ['alarm', 'warn', 'ok', 'off']
const alertsOnly = ref(false)
const focused = ref('')
let timer: ReturnType<typeof setTimeout>
function focusColumn(name: string) { clearTimeout(timer); focused.value = name; timer = setTimeout(() => { focused.value = '' }, 1400) }
const observer = new ResizeObserver(entries => entries.forEach(entry => {
  const body = entry.target as HTMLElement
  const needed = [...body.querySelectorAll<HTMLElement>('.l2-panel')].reduce((sum, panel) => sum + parseFloat(panel.style.getPropertyValue('--group-min')), 0) + (body.children.length - 1) * 8 + 16
  body.parentElement?.classList.toggle('is-overflow', needed > body.clientHeight)
}))
function observeColumn(el: Element | ComponentPublicInstance | null) { if (el instanceof Element) { observer.unobserve(el); observer.observe(el) } }
onBeforeUnmount(() => { clearTimeout(timer); observer.disconnect() })
function visibleNodes(nodes: PartNode[]) { return alertsOnly.value ? nodes.filter(n => n.status === 'alarm' || n.status === 'warn') : nodes }
function open(specialty: string, part: string, aggregate: boolean) {
  router.push({ name: 'overviewPoint', params: { id: card.value!.id }, query: { ...query.value, specialty, part, mode: aggregate ? 'aggregate' : 'structure' } })
}
</script>
<style scoped src="@/styles/parts-point.css"></style>
