<template>
  <section class="integration-overview">
    <h2>数据采集与存储</h2>
    <p>当前场景已接入设备 {{ total }} 台，在线 {{ online }} 台。多源监测数据的融合与存储仍为演示口径。</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSceneStore } from '@/stores/scene'
import { getDevices } from '@/mock'

const store = useSceneStore()
const devices = computed(() => getDevices(store.currentScene, 1, 9999).list)
const total = computed(() => devices.value.length)
const online = computed(() => devices.value.filter(device => device.online).length)
</script>

<style scoped>
.integration-overview {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
}

.integration-overview h2 {
  margin-bottom: 6px;
  font-size: 16px;
}

.integration-overview p {
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
