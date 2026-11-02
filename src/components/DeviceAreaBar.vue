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
