<template>
  <header class="device-strip">
    <button type="button" class="strip-back" @click="$emit('back')">← {{ backLabel || '返回' }}</button>
    <strong class="strip-code">{{ code }}</strong><span class="strip-sep">·</span>
    <span class="strip-type">{{ type }}</span>
    <span class="strip-status" :class="`strip-status--${tone || 'ok'}`"><i aria-hidden="true"></i>{{ statusLabel }}</span>
    <slot />
    <div class="strip-actions"><slot name="actions" /></div>
  </header>
</template>
<script setup lang="ts">
defineProps<{ code: string; type: string; statusLabel: string; tone?: string; backLabel?: string }>()
defineEmits<{ back: [] }>()
</script>
<style scoped>
.device-strip { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 8px 20px; background: var(--color-card-bg); border-bottom: 1px solid var(--color-border); flex-shrink: 0; font-size: 13px; white-space: nowrap; overflow-x: auto; }
.strip-back { height: 28px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-primary); background: var(--color-card-bg); cursor: pointer; font: inherit; }
.strip-back:hover { background: var(--color-primary-light); }
.strip-code { font-size: 15px; font-variant-numeric: tabular-nums; }
.strip-sep { color: var(--color-text-muted); }
.strip-type { color: var(--color-text-secondary); }
.strip-status { display: inline-flex; gap: 7px; align-items: center; font-size: 12px; color: var(--color-success); }
.strip-status i { width: 9px; height: 9px; border-radius: 50%; background: currentColor; }
.strip-status--alarm { color: var(--color-danger); }
.strip-status--warn { color: var(--color-warning); }
.strip-status--off { color: var(--color-text-muted); }
.strip-actions { margin-left: auto; display: flex; align-items: center; gap: 14px; color: var(--color-text-secondary); font-size: 12px; }
</style>
