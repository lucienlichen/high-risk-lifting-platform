<template>
  <aside class="ov-struct" aria-label="物理结构模型">
    <div class="ov-struct-caption">物理结构模型</div>
    <div class="ov-struct-meta">{{ model.templateLabel }}</div>
    <button
      v-for="row in rows"
      :key="row.node.id"
      type="button"
      class="ov-struct-btn"
      :class="{ active: row.node.id === selectedId }"
      :style="{ paddingLeft: `${8 + row.node.depth * 14}px` }"
      @click="emit('select', row.node.id)"
    >
      <span
        v-if="row.node.children.length"
        class="ov-struct-twist"
        :aria-expanded="row.open"
        @click.stop="toggle(row.node.id)"
      >{{ row.open ? '▾' : '▸' }}</span>
      <span v-else class="ov-struct-twist is-leaf"></span>
      <i class="ov-struct-lamp" :class="`is-${displayLamp(row.node.lamp)}`" :title="lampTitle(row.node.lamp)"></i>
      <span class="name" :title="row.node.name">{{ row.node.name }}</span>
      <span class="ov-badges">
        <span v-if="row.node.alarmCount" class="ov-badge red">{{ row.node.alarmCount }}</span>
        <span v-if="row.node.pointStatus" class="ov-struct-point" :title="`测点${row.node.pointStatus}，不计入结构灯`">{{ row.node.pointStatus === '异常' ? '测异常' : '测预警' }}</span>
      </span>
    </button>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { lampLabel, type LampLevel } from '@/mock/overviewStatus'
import { type DeviceStructure, type StructureNode } from '@/mock/structureTree'

const props = defineProps<{ model: DeviceStructure; selectedId: string }>()
const emit = defineEmits<{ select: [id: string] }>()

const openIds = ref<Set<string>>(new Set())

function nodesWithLamp(node: StructureNode, into: string[]) {
  if (node.lamp === 'red' || node.lamp === 'yellow') into.push(node.id)
  node.children.forEach(child => nodesWithLamp(child, into))
}

function ancestorIds(node: StructureNode, target: Set<string>, trail: string[]): boolean {
  const next = [...trail, node.id]
  if (target.has(node.id)) {
    next.forEach(id => openIds.value.add(id))
    return true
  }
  return node.children.some(child => ancestorIds(child, target, next))
}

function expandTo(ids: string[]) {
  ancestorIds(props.model.root, new Set(ids), [])
  openIds.value = new Set(openIds.value)
}

watch(() => props.model.rootId, () => {
  const next = new Set<string>([props.model.rootId])
  props.model.root.children.forEach(child => next.add(child.id))
  openIds.value = next
  const ids: string[] = []
  nodesWithLamp(props.model.root, ids)
  expandTo(ids)
}, { immediate: true })

watch(() => props.selectedId, id => {
  if (id) expandTo([id])
})

const rows = computed(() => {
  const list: { node: StructureNode; open: boolean }[] = []
  const walk = (node: StructureNode) => {
    const open = openIds.value.has(node.id)
    list.push({ node, open })
    if (open) node.children.forEach(walk)
  }
  walk(props.model.root)
  return list
})

function toggle(id: string) {
  const next = new Set(openIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openIds.value = next
}

function displayLamp(lamp: LampLevel | 'none') {
  if (lamp === 'red' || lamp === 'yellow') return 'red'
  return lamp
}

function lampTitle(lamp: LampLevel | 'none') {
  if (lamp === 'none') return '没有绑定告警'
  return lampLabel(lamp)
}
</script>
