<template>
  <nav class="dev-menu" aria-label="单台设备菜单">
    <button v-for="item in DEVICE_MENUS" :key="item.key" type="button" :class="{ on: item.key === active }" @click="go(item.key)">{{ item.label }}</button>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { DEVICE_MENUS, type DeviceMenuKey } from '@/mock/deviceMenus'

const props = defineProps<{ active: DeviceMenuKey; deviceId: string }>()
const route = useRoute()
const router = useRouter()

function go(key: DeviceMenuKey) {
  const query = Object.fromEntries(['enterprise', 'unit'].flatMap(name => typeof route.query[name] === 'string' ? [[name, route.query[name]]] : []))
  if (key === 'health') {
    router.push({ name: 'overviewParts', params: { id: props.deviceId }, query })
    return
  }
  router.push({ name: 'overviewSection', params: { id: props.deviceId, key }, query })
}
</script>

<style scoped>
.dev-menu { display: flex; gap: 2px; overflow-x: auto; background: var(--color-card-bg, #fff); border-bottom: 1px solid var(--color-border, #e5e7eb); padding: 0 12px; flex: none; }
.dev-menu button { height: 40px; padding: 0 10px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--color-text-secondary, #475569); white-space: nowrap; cursor: pointer; font-size: 13px; }
@media (min-width: 1600px) {
  .dev-menu button { padding: 0 14px; font-size: 14px; }
}
.dev-menu button.on { color: var(--color-primary, #1677ff); border-bottom-color: var(--color-primary, #1677ff); font-weight: 700; }
</style>
