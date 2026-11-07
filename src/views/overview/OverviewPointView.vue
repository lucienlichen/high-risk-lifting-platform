<template>
  <PointSchemeView @back="back" />
</template>

<script setup lang="ts">
import PointSchemeView from '@/components/pointScheme/PointSchemeView.vue'
import { usePartsDevice } from '@/composables/usePartsDevice'

const { query, router, route } = usePartsDevice()

function back() {
  router.push({ name: 'overviewParts', params: { id: String(route.params.id || '') }, query: query.value })
}
</script>
