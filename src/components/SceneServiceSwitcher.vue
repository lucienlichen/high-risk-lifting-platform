<template>
  <div class="scene-service-switcher" tabindex="0">
    <button class="scene-service-switcher-trigger" type="button" :title="activeServiceMeta?.label ?? '服务菜单'">
      <span class="scene-service-switcher-label">{{ activeServiceMeta?.label ?? '服务菜单' }}</span>
      <span class="scene-service-switcher-arrow">⌄</span>
    </button>
    <div class="scene-service-switcher-dropdown">
      <div class="scene-service-menu">
        <template v-for="(group, index) in serviceGroups" :key="group.title">
          <div :class="['scene-service-group', `scene-service-group--${group.cls}`]">
            <button
              v-for="svc in group.items"
              :key="svc.key"
              :class="['scene-service-item', { active: activeServiceKey === svc.key }]"
              type="button"
              @click="handleServiceClick(svc.key)"
            >
              <span :class="['scene-service-item-icon', `scene-service-item-icon--${group.cls}`]">
                <component :is="svc.icon" />
              </span>
              <span class="scene-service-item-label">{{ svc.label }}</span>
            </button>
          </div>
          <div v-if="index < serviceGroups.length - 1" class="scene-service-divider"></div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { flatServices, serviceGroups, type ServiceKey } from '@/components/serviceCatalog'
import { useSceneStore } from '@/stores/scene'

const store = useSceneStore()
const activeServiceKey = computed(() => store.activeService as ServiceKey | null)
const activeServiceMeta = computed(() =>
  activeServiceKey.value ? flatServices.find(service => service.key === activeServiceKey.value) : null
)

function handleServiceClick(key: ServiceKey) {
  store.setService(key)
}
</script>

<style scoped>
.scene-service-switcher {
  position: static;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  align-self: center;
  outline: none;
}

.scene-service-switcher-trigger {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-card-bg);
  color: var(--color-primary);
  cursor: pointer;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
}

.scene-service-switcher-trigger:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.scene-service-switcher-label {
  white-space: nowrap;
}

.scene-service-switcher-arrow {
  display: inline-block;
  font-size: 14px;
  transform: translateY(-2px);
}

.scene-service-switcher-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 1px);
  width: auto;
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.scene-service-switcher:hover .scene-service-switcher-dropdown,
.scene-service-switcher:focus-within .scene-service-switcher-dropdown {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.scene-service-menu {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(248, 250, 253, 0.96);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--color-card-shadow);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.scene-service-group {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 6px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: var(--radius-sm);
}

.scene-service-item {
  flex: 1;
  min-width: 0;
  height: 66px;
  padding: 7px 6px;
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-sm);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.scene-service-item:hover,
.scene-service-item.active {
  background: rgba(22, 119, 255, 0.08);
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
}

.scene-service-item.active {
  font-weight: 800;
}

.scene-service-item-icon {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.scene-service-item-label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  line-height: 1.1;
  font-weight: 700;
}

.scene-service-divider {
  width: 1px;
  background: var(--color-border-light);
  flex-shrink: 0;
  align-self: stretch;
}
</style>
