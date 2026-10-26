<template>
  <div class="scene-service-switcher" @keydown.esc="open = false">
    <button
      type="button"
      class="scene-service-switcher-trigger"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ currentLabel }}
    </button>
    <div v-if="open" class="scene-service-switcher-dropdown">
      <div v-for="group in serviceGroups" :key="group.title" class="scene-service-switcher-group">
        <p>{{ group.title }}</p>
        <button
          v-for="item in group.items"
          :key="item.key"
          type="button"
          :class="{ active: item.key === activeKey }"
          @click="choose(item.key)"
        >{{ item.label }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { serviceGroups, flatServices, type ServiceKey } from '@/components/serviceCatalog'
import { useSceneStore } from '@/stores/scene'

const store = useSceneStore()
const open = ref(false)
const activeKey = computed(() => store.activeService as ServiceKey | null)
const currentLabel = computed(() =>
  flatServices.find(item => item.key === activeKey.value)?.label || '选择服务'
)

function choose(key: ServiceKey) {
  store.setService(key)
  open.value = false
}

function closeOnOutside(event: MouseEvent) {
  const root = document.querySelector('.scene-service-switcher')
  if (root && event.target instanceof Node && !root.contains(event.target)) open.value = false
}

onMounted(() => document.addEventListener('click', closeOnOutside))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutside))
</script>

<style scoped>
.scene-service-switcher {
  position: relative;
}

.scene-service-switcher-trigger,
.scene-service-switcher-group button {
  cursor: pointer;
}

.scene-service-switcher-trigger {
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
}

.scene-service-switcher-dropdown {
  position: absolute;
  z-index: 20;
  right: 0;
  width: 280px;
  max-height: 420px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
  box-shadow: var(--color-card-shadow-hover);
}

.scene-service-switcher-group p {
  margin: 8px 4px 4px;
  color: var(--color-text-muted);
  font-size: 12px;
}

.scene-service-switcher-group button {
  width: 100%;
  min-height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  text-align: left;
}

.scene-service-switcher-group button.active,
.scene-service-switcher-group button:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}
</style>
