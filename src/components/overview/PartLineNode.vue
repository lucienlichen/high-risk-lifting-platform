<template>
  <div class="pl-node">
    <button type="button" class="pl-card" :class="cardClass" :title="node.extra || undefined" @click="emit('open', node)">
      <span class="pl-name">{{ node.name }}</span>
      <span class="pl-sub">{{ subtitle }}</span>
      <span v-if="node.extraCount" class="pl-more">+{{ node.extraCount }}</span>
    </button>
    <template v-if="node.children?.length">
      <span class="pl-stem" aria-hidden="true"></span>
      <div v-if="leavesOnly" class="pl-leaves">
        <span class="pl-stem pl-stem-short" aria-hidden="true"></span>
        <div class="pl-leaf-row">
          <PartLineNode v-for="child in node.children" :key="pathOf(child)" :node="child" :selected="selected" @open="emit('open', $event)" />
        </div>
      </div>
      <div v-else class="pl-kids">
        <div
          v-for="(child, index) in node.children"
          :key="pathOf(child)"
          class="pl-branch"
          :class="{ first: index === 0, last: index === node.children.length - 1, only: node.children.length === 1 }"
        >
          <span class="pl-elbow" aria-hidden="true"></span>
          <PartLineNode :node="child" :selected="selected" @open="emit('open', $event)" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { severityLabel } from '@/config/statusDict'
import { partPathKey, type PartGraphNode } from '@/mock/partGraph'

const props = defineProps<{ node: PartGraphNode; selected?: string }>()
const emit = defineEmits<{ open: [node: PartGraphNode] }>()

const leavesOnly = computed(() => !!props.node.children?.length && props.node.children.every(child => !child.children?.length))
const cardClass = computed(() => [
  `is-${props.node.status}`,
  { 'is-selected': props.selected === pathOf(props.node) }
])
const subtitle = computed(() => {
  const node = props.node
  if (node.status === 'off') return '未接入'
  if (!node.children?.length) {
    return node.services.length ? `${severityLabel(node.status === 'red' ? 'red' : node.status === 'yellow' ? 'yellow' : 'green')} · ${node.services.join(' ')}` : severityLabel(node.status === 'red' ? 'red' : node.status === 'yellow' ? 'yellow' : 'green')
  }
  const parts = [node.red ? `报警 ${node.red}` : '', node.yellow ? `异常 ${node.yellow}` : ''].filter(Boolean)
  return parts.join(' · ') || '正常'
})

function pathOf(node: PartGraphNode) {
  return partPathKey(node)
}
</script>

<style scoped>
.pl-node { display: flex; align-items: flex-start; }
.pl-card {
  position: relative;
  box-sizing: border-box;
  height: 56px;
  min-width: 108px;
  max-width: 220px;
  padding: 0 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1px;
  text-align: left;
  cursor: pointer;
  font: inherit;
  background: #fff;
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
.pl-name { font-size: 13px; font-weight: 600; line-height: 18px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-sub { font-size: 11px; line-height: 15px; opacity: .9; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-more { position: absolute; top: 3px; right: 6px; font-size: 10px; color: #64748b; }
.pl-stem { width: 16px; height: 1.5px; margin-top: 27px; background: #94a3b8; flex: none; }
.pl-stem-short { width: 12px; }
.pl-kids { flex: 1 1 auto; min-width: 0; }
.pl-branch { position: relative; padding-left: 20px; }
.pl-branch:not(.first) { padding-top: 12px; }
.pl-elbow { position: absolute; left: 0; width: 20px; height: 1.5px; background: #94a3b8; }
.pl-branch.first .pl-elbow { top: 27px; }
.pl-branch:not(.first) .pl-elbow { top: 39px; }
.pl-branch:not(.only)::before {
  content: '';
  position: absolute;
  left: 0;
  width: 1.5px;
  background: #94a3b8;
}
.pl-branch.first:not(.last)::before { top: 27px; bottom: 0; }
.pl-branch.last:not(.first)::before { top: 0; height: 39px; }
.pl-branch:not(.first):not(.last)::before { top: 0; bottom: 0; }
.pl-leaves { display: flex; align-items: flex-start; flex: 1 1 auto; min-width: 0; }
.pl-leaf-row {
  border-left: 1.5px solid #94a3b8;
  padding-left: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
@media (prefers-reduced-motion: reduce) {
  .pl-card.is-red,
  .pl-card.is-yellow { animation: none; }
}
</style>
