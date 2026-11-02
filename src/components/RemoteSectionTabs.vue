<template>
  <nav class="remote-section-tabs" :aria-label="ariaLabel">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      :title="item.title || item.label"
      :class="['remote-section-tab', { active: item.id === modelValue, 'is-equal': equalWidth }]"
      @click="emit('update:modelValue', item.id)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  items: { id: string; label: string; title?: string }[]
  modelValue: string
  ariaLabel?: string
  /** 与健康监测「结构应力监测」标签同宽，并让本组标签等宽。 */
  equalWidth?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [id: string] }>()
</script>

<style scoped>
.remote-section-tabs {
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  gap: 4px;
  padding: 0 16px;
  background: var(--color-card-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow-x: auto;
}

.remote-section-tabs::-webkit-scrollbar {
  height: 0;
}

.remote-section-tab {
  flex-shrink: 0;
  padding: 12px 18px;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  white-space: nowrap;
}

.remote-section-tab.is-equal {
  width: 126px;
  padding-left: 0;
  padding-right: 0;
  text-align: center;
}

.remote-section-tab:hover {
  color: var(--color-primary);
  background: rgba(22, 119, 255, 0.04);
}

.remote-section-tab.active {
  color: var(--color-primary);
  font-weight: 600;
  border-bottom-color: var(--color-primary);
  background: rgba(22, 119, 255, 0.06);
}
</style>
