<template>
  <OverviewPlatformView v-if="overviewRole === 'super'" />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import OverviewPlatformView from '@/views/overview/OverviewPlatformView.vue'
import { overviewRole } from '@/stores/overviewRole'
import { BENGANG, getOverviewCards, worstUnit } from '@/mock/overviewDemo'

const router = useRouter()

watch(overviewRole, role => {
  if (role === 'super') return
  const cards = getOverviewCards()
  const unit = role === 'factory' ? '炼铁厂' : worstUnit(cards, BENGANG)
  router.replace({ name: 'overviewPlant', query: { enterprise: BENGANG, unit } })
}, { immediate: true })
</script>
