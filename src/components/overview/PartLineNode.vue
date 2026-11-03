<template>
  <div class="pl-node">
    <div class="pl-cell">
      <button type="button" class="pl-card" :class="cardClass" @click="emit('open', node)">
        <span class="pl-name">{{ node.name }}</span>
        <span class="pl-sub">{{ subtitle }}</span>
      </button>
      <span v-if="node.children?.length" class="pl-out" aria-hidden="true"></span>
    </div>
    <div v-if="node.children?.length" class="pl-kids">
      <div
        v-for="(child, index) in node.children"
        :key="pathOf(child)"
        class="pl-branch"
        :class="{ first: index === 0, last: index === node.children.length - 1, only: node.children.length === 1 }"
      >
        <PartLineNode :node="child" :selected="selected" @open="emit('open', $event)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { severityLabel } from '@/config/statusDict'
import { partPathKey, type PartGraphNode } from '@/mock/partGraph'

const props = defineProps<{ node: PartGraphNode; selected?: string }>()
const emit = defineEmits<{ open: [node: PartGraphNode] }>()

const cardClass = computed(() => [
  `is-${props.node.status}`,
  { 'is-selected': props.selected === pathOf(props.node) }
])
const subtitle = computed(() => {
  const node = props.node
  if (node.status === 'off') return '未接入'
  if (!node.children?.length) {
    const label = severityLabel(node.status === 'red' ? 'red' : node.status === 'yellow' ? 'yellow' : 'green')
    return node.services.length ? `${label} · ${node.services.join(' ')}` : label
  }
  const parts = [node.red ? `报警 ${node.red}` : '', node.yellow ? `异常 ${node.yellow}` : ''].filter(Boolean)
  return parts.join(' · ') || '正常'
})

function pathOf(node: PartGraphNode) {
  return partPathKey(node)
}
</script>

<style scoped>
.pl-node {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
}
.pl-cell {
  grid-column: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}
.pl-out { flex: 1; height: 1.5px; background: #94a3b8; min-width: 12px; }
.pl-card {
  position: relative;
  box-sizing: border-box;
  width: 168px;
  flex: 0 0 168px;
  height: 56px;
  padding: 0 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  text-align: left;
  cursor: pointer;
  font: inherit;
  justify-self: start;
}
.pl-card.is-red {
  --ov-tile-bg: #fff1f0;
  --ov-tile-bg-hot: #ffccc7;
  --ov-tile-glow: rgba(245, 34, 45, .28);
  border: 2px solid #f5222d;
  background: #fff1f0;
  color: #cf1322;
  animation: ov-tile-breathe 1.5s ease-in-out infinite;
}
.pl-card.is-yellow {
  --ov-tile-bg: #fffbe6;
  --ov-tile-bg-hot: #fff1b8;
  --ov-tile-glow: rgba(250, 173, 20, .32);
  border: 2px solid #faad14;
  background: #fffbe6;
  color: #d48806;
  animation: ov-tile-breathe 1.5s ease-in-out infinite;
}
.pl-card.is-green { border: 2px solid #16a34a; background: #f0fdf4; color: #15803d; }
.pl-card.is-off { border: 1.5px dashed #94a3b8; background: #f8fafc; color: #64748b; }
.pl-card.is-selected { outline: 2px solid #0f172a; outline-offset: 2px; }
.pl-name { font-size: 14px; font-weight: 600; line-height: 18px; max-width: 144px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-sub { font-size: 12px; line-height: 16px; max-width: 144px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-kids {
  grid-column: 2 / -1;
  display: grid;
  grid-template-columns: subgrid;
  row-gap: 10px;
  position: relative;
}
.pl-kids::before {
  content: '';
  position: absolute;
  left: -36px;
  top: 50%;
  width: 18px;
  height: 1.5px;
  background: #94a3b8;
}
.pl-branch {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  position: relative;
}
.pl-branch::before,
.pl-branch::after {
  content: '';
  position: absolute;
  background: #94a3b8;
}
.pl-branch::before { left: -18px; width: 1.5px; }
.pl-branch::after { left: -18px; top: 50%; width: 18px; height: 1.5px; }
.pl-branch.first:not(.only)::before { top: 50%; bottom: -5px; }
.pl-branch.last:not(.only)::before { top: -5px; height: calc(50% + 5px); }
.pl-branch:not(.first):not(.last)::before { top: -5px; bottom: -5px; }
.pl-branch.only::before { display: none; }
@media (prefers-reduced-motion: reduce) {
  .pl-card.is-red,
  .pl-card.is-yellow { animation: none; }
}
</style>
