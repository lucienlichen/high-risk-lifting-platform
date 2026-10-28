<template>
  <svg
    v-if="scene === 'metallurgy'"
    viewBox="0 0 36 36"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <line x1="4" y1="10" x2="32" y2="10" />
    <rect x="12" y="6" width="12" height="4" rx="0.5" />
    <line x1="18" y1="10" x2="18" y2="20" />
    <rect x="13" y="20" width="10" height="6" rx="1" />
    <line x1="4" y1="10" x2="4" y2="30" />
    <line x1="32" y1="10" x2="32" y2="30" />
    <line x1="2" y1="30" x2="34" y2="30" />
    <circle cx="7" cy="30" r="2.5" />
    <circle cx="29" cy="30" r="2.5" />
  </svg>

  <svg
    v-else-if="scene === 'port'"
    viewBox="0 0 36 36"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <line x1="8" y1="4" x2="8" y2="28" />
    <line x1="8" y1="4" x2="28" y2="12" />
    <line x1="8" y1="10" x2="22" y2="16" />
    <line x1="22" y1="12" x2="22" y2="22" />
    <rect x="16" y="22" width="12" height="5" rx="1" />
    <line x1="6" y1="28" x2="32" y2="28" />
    <path d="M4 32 Q18 29 32 32" />
    <line x1="8" y1="28" x2="8" y2="32" />
    <line x1="28" y1="28" x2="28" y2="30" />
  </svg>

  <svg
    v-else-if="scene === 'shipbuilding'"
    viewBox="0 0 36 36"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <line x1="4" y1="14" x2="32" y2="14" />
    <rect x="14" y="8" width="8" height="6" rx="0.5" />
    <line x1="18" y1="14" x2="18" y2="24" />
    <line x1="4" y1="14" x2="4" y2="30" />
    <line x1="32" y1="14" x2="32" y2="30" />
    <line x1="2" y1="30" x2="34" y2="30" />
    <circle cx="6" cy="30" r="2" />
    <circle cx="12" cy="30" r="2" />
    <circle cx="24" cy="30" r="2" />
    <circle cx="30" cy="30" r="2" />
    <path d="M16 24 Q16 28 18 28 Q20 28 20 26" />
  </svg>

  <svg
    v-else
    viewBox="0 0 36 36"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <line x1="16" y1="3" x2="16" y2="32" />
    <line x1="16" y1="3" x2="30" y2="10" />
    <line x1="16" y1="10" x2="6" y2="14" />
    <line x1="16" y1="6" x2="24" y2="10" />
    <line x1="24" y1="10" x2="24" y2="20" />
    <rect x="20" y="20" width="8" height="5" rx="0.5" />
    <line x1="6" y1="14" x2="6" y2="18" />
    <rect x="4" y="18" width="4" height="3" rx="0.5" />
    <line x1="14" y1="32" x2="18" y2="32" />
    <line x1="13" y1="32" x2="12" y2="34" />
    <line x1="19" y1="32" x2="20" y2="34" />
  </svg>
</template>

<script setup lang="ts">
import type { SceneId } from '@/mock'

defineProps<{
  scene: SceneId
}>()
</script>
