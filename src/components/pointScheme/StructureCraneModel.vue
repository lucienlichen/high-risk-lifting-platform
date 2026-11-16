<template>
  <div
    ref="host"
    class="spd-canvas"
    @click="onClick"
    @mouseover="onOver"
    @mouseleave="applyHover(null)"
    v-html="svg"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { craneSvg } from '@/components/pointScheme/craneSvg'
import type { ModelMode } from '@/mock/structurePointDetail'

const props = defineProps<{ mode: ModelMode; pointId: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const host = ref<HTMLElement | null>(null)
const svg = computed(() => craneSvg(props.mode, props.pointId))

function applyHover(id: string | null) {
  const root = host.value
  if (!root) return
  root.querySelectorAll('g[data-ptid]').forEach(node => {
    const pid = node.getAttribute('data-ptid')
    const on = !!id && pid === id
    node.querySelector('.hov')?.setAttribute('visibility', on && pid !== props.pointId ? 'visible' : 'hidden')
    node.querySelector('.loclab')?.setAttribute('visibility', on || pid === props.pointId ? 'visible' : 'hidden')
    if (pid !== props.pointId) node.querySelector('[data-dot]')?.setAttribute('r', on ? '7' : '5.5')
  })
}

function onClick(event: MouseEvent) {
  const id = (event.target as Element).closest?.('[data-ptid]')?.getAttribute('data-ptid')
  if (id) emit('select', id)
}

function onOver(event: MouseEvent) {
  applyHover((event.target as Element).closest?.('[data-ptid]')?.getAttribute('data-ptid') || null)
}

defineExpose({ applyHover })
</script>
