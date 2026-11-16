<template>
  <div ref="scroller" class="ps-rows">
    <div class="ps-row ps-row-hd"><span>编号</span><span>{{ nameLabel }}</span><span>类型</span><span>状态</span></div>
    <button v-for="row in rows" :key="row.id" type="button" class="ps-row" :class="{ on: row.id === selectedId }" :data-point="row.id" @click="$emit('select', row.id)">
      <span class="id">{{ row.id }}</span>
      <span class="name">{{ row.name }}</span>
      <span>{{ row.measured ? '实测' : '孪生' }}</span>
      <span class="ps-pill" :class="row.status">{{ TONE_TEXT[row.status] }}</span>
    </button>
    <p v-if="!rows.length" class="ps-none">无匹配点位</p>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { TONE_TEXT, type SchemePoint } from '@/mock/pointSchemeData'

const props = defineProps<{ rows: SchemePoint[]; selectedId: string; nameLabel: string }>()
defineEmits<{ select: [id: string] }>()

const scroller = ref<HTMLElement | null>(null)

function pinTop() {
  const el = scroller.value
  if (el) el.scrollTop = 0
}

onMounted(() => {
  pinTop()
  nextTick(pinTop)
  requestAnimationFrame(pinTop)
})

watch(() => props.rows.map(row => row.id).join('|'), () => nextTick(pinTop))
</script>
