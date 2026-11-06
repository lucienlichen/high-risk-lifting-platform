<template>
  <DeviceStrip :code="code" :type="type" :status-label="severity ? severityLabel(severity) : runStatusLabel(status)" :tone="severity ? ({ red: 'alarm', yellow: 'warn', normal: 'ok', off: 'off' })[severity] : status === 'offline' || status === 'stopped' ? 'off' : status === 'maintenance' ? 'warn' : 'ok'" @back="emit('back')" />
</template>
<script setup lang="ts">
import DeviceStrip from '@/components/DeviceStrip.vue'
import { runStatusLabel, severityLabel } from '@/config/statusDict'
defineProps<{
  severity?: 'red' | 'yellow' | 'normal' | 'off'
  name: string
  status: 'running' | 'standby' | 'stopped' | 'offline' | 'maintenance'
  code: string
  type: string
  location: string
  unit: string
  installDate: string
}>()
const emit = defineEmits<{ back: [] }>()
</script>
