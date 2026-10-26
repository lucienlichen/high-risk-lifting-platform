<template>
  <div class="ov-shell">
    <div class="ov-rolebar">
      <button
        v-for="item in ROLE_OPTIONS"
        :key="item.id"
        type="button"
        :class="{ active: overviewRole === item.id }"
        :aria-pressed="overviewRole === item.id"
        @click="setRole(item.id)"
      >{{ item.label }}</button>
      <button v-if="overviewRole === 'super' && route.name !== 'overviewHome'" type="button" class="ov-textbtn" @click="router.push('/overview')">返回平台总览</button>
    </div>
    <router-view class="ov-fill" />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ROLE_OPTIONS, overviewRole, type OverviewRole } from '@/stores/overviewRole'
import { BENGANG, getOverviewCards, worstUnit } from '@/mock/overviewDemo'
import '@/styles/overview.css'

const route = useRoute()
const router = useRouter()

function setRole(role: OverviewRole) {
  overviewRole.value = role
  if (role === 'super') {
    router.push('/overview')
    return
  }
  const unit = role === 'factory' ? '炼铁厂' : worstUnit(getOverviewCards(), BENGANG)
  router.push({ name: 'overviewPlant', query: { enterprise: BENGANG, unit } })
}
</script>
