<template>
  <div v-if="bare" class="hierarchy-crumbs">
    <template v-for="(part, index) in parts" :key="`${index}-${part}`">
      <span v-if="index" class="hierarchy-sep">/</span>
      <span class="hierarchy-crumb" :class="{ strong: index === 0 || index === parts.length - 1 }">{{ part }}</span>
    </template>
  </div>
  <div v-else class="top-hierarchy-nav">
    <div class="hierarchy-crumbs">
      <template v-for="(part, index) in parts" :key="`${index}-${part}`">
        <span v-if="index" class="hierarchy-sep">/</span>
        <span class="hierarchy-crumb" :class="{ strong: index === 0 || index === parts.length - 1 }">{{ part }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  parts: string[]
  /** 外层已经是 top-hierarchy-nav 时，只输出面包屑。 */
  bare?: boolean
}>()
</script>

<style scoped>
.top-hierarchy-nav { min-height: 0; padding: 3px 20px; background: var(--color-content-bg); border: 0; box-shadow: none; }
.hierarchy-crumbs { font-size: 11px; color: var(--color-text-muted); }
.hierarchy-crumb.strong { color: var(--color-text-secondary); font-weight: 400; }
</style>
