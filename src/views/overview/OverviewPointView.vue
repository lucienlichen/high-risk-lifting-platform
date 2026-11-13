<template>
  <PointSchemeView @back="back" />
</template>

<script setup lang="ts">
import PointSchemeView from '@/components/pointScheme/PointSchemeView.vue'
import { usePartsDevice } from '@/composables/usePartsDevice'

const { query, router, route } = usePartsDevice()

function back() {
  const partsScheme = route.query.partsScheme === 'nest' ? 'nest' : ''
  router.push({
    name: 'overviewParts',
    params: { id: String(route.params.id || '') },
    query: { ...query.value, ...(partsScheme ? { partsScheme } : {}) }
  })
}
</script>
