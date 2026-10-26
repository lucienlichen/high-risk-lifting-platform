<template>
  <div class="service-menu">
    <template v-for="(group, gi) in serviceGroups" :key="group.title">
      <div :class="['service-group', `sg-${group.cls}`]">
        <div class="group-btns">
          <div
            v-for="svc in group.items"
            :key="svc.key"
            :class="['service-btn', `${group.cls}-btn`, { active: activeService === svc.key, disabled: !canUseService }]"
            @click="handleClick(svc.key)"
            :title="canUseService ? svc.label : '请先选择设备'"
          >
            <div class="service-btn-icon">
              <component :is="svc.icon" />
            </div>
            <span class="service-btn-label">{{ svc.label }}</span>
          </div>
        </div>
      </div>
      <div v-if="gi < serviceGroups.length - 1" class="service-divider"></div>
    </template>

    <!-- 未选设备浮层提示 -->
    <div v-if="props.requireDevice && !hasDevice" class="no-device-overlay">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      请先选择设备以启用智能服务
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSceneStore } from '@/stores/scene'
import { serviceGroups, type ServiceKey } from '@/components/serviceCatalog'

const store = useSceneStore()

const props = withDefaults(defineProps<{
  requireDevice?: boolean
}>(), {
  requireDevice: true
})

const hasDevice     = computed(() => !!store.currentDeviceId)
const canUseService = computed(() => !props.requireDevice || hasDevice.value)
const activeService = computed(() => store.activeService)

function handleClick(key: ServiceKey) {
  if (!canUseService.value) return
  store.setService(activeService.value === key && props.requireDevice ? null : key)
}
</script>

<style scoped>
.service-menu {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(248, 250, 253, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 2px 16px rgba(15, 23, 42, 0.06);
}

.service-group {
  display: flex;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.45);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.8), 0 2px 6px rgba(0, 0, 0, 0.02);
}

.sg-monitor     { flex: 4; }
.sg-diagnosis   { flex: 3; }
.sg-maintenance { flex: 3; }
.sg-knowledge   { flex: 3; }
.sg-platform    { flex: 3; }

.group-btns {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 6px;
}

.service-btn {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 4px;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  color: #334155;
  user-select: none;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.monitor-btn:hover:not(.disabled),
.diagnosis-btn:hover:not(.disabled),
.maintenance-btn:hover:not(.disabled),
.knowledge-btn:hover:not(.disabled),
.platform-btn:hover:not(.disabled) {
  background: rgba(22, 119, 255, 0.07);
  border-color: rgba(22, 119, 255, 0.35);
  color: #1677ff;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
}

.monitor-btn.active,
.diagnosis-btn.active,
.maintenance-btn.active,
.knowledge-btn.active,
.platform-btn.active {
  background: rgba(22, 119, 255, 0.12);
  border-color: #1677ff;
  color: #1677ff;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(22, 119, 255, 0.20);
}

.service-btn.disabled {
  opacity: 0.36;
  cursor: not-allowed;
  box-shadow: none;
}

.service-btn-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.service-btn-label {
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.service-divider {
  width: 1px;
  background: rgba(203, 213, 225, 0.9);
  flex-shrink: 0;
  align-self: stretch;
}

.no-device-overlay {
  position: absolute;
  right: 16px;
  top: -30px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #94a3b8;
  background: rgba(248, 250, 253, 0.90);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 100px;
  padding: 5px 14px;
  pointer-events: none;
  white-space: nowrap;
  backdrop-filter: blur(8px);
}
</style>
