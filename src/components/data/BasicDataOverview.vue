<template>
  <section class="basic-overview">
    <div>
      <span>在册</span>
      <strong>{{ devices.length }}</strong>
    </div>
    <div>
      <span>在用</span>
      <strong>{{ running }}</strong>
    </div>
    <div>
      <span>检修</span>
      <strong>{{ maintenance }}</strong>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Device } from '@/mock'

const props = defineProps<{
  devices: Device[]
}>()

const running = computed(() => props.devices.filter(device => device.status === 'running').length)
const maintenance = computed(() => props.devices.filter(device => device.status === 'maintenance').length)
</script>

<style scoped>
.basic-overview {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.basic-overview div {
  min-width: 96px;
  padding: 10px 12px;
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
}

.basic-overview span {
  display: block;
  color: var(--color-text-muted);
  font-size: 12px;
}

.basic-overview strong {
  font-size: 20px;
}
</style>
