<template>
  <section class="extended-overview">
    <h2>{{ meta?.label || '服务' }}</h2>
    <p>{{ meta?.summary || '该服务内容待确认。' }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { flatServices, type ServiceKey } from '@/components/serviceCatalog'

const props = defineProps<{
  serviceKey: ServiceKey | string
}>()

const meta = computed(() => flatServices.find(item => item.key === props.serviceKey))
</script>

<style scoped>
.extended-overview {
  padding: 20px;
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
}

.extended-overview h2 {
  margin-bottom: 8px;
  font-size: 18px;
}

.extended-overview p {
  color: var(--color-text-secondary);
  line-height: 1.6;
}
</style>