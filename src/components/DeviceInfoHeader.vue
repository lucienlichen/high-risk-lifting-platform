<template>
  <div class="device-info-header device-info-header--compact">
    <div class="device-info-inline">
      <span class="device-info-name-compact">
        <el-icon size="20" color="var(--color-primary)"><Platform /></el-icon>
        {{ name }}
      </span>
      <span :class="`badge badge-${status}`">
        <span class="badge-dot"></span>{{ runStatusLabel(status) }}
      </span>
      <span class="device-info-meta-sep">·</span>
      <span class="device-info-meta-item">编号：<strong>{{ code }}</strong></span>
      <span class="device-info-meta-item">类型：<strong>{{ type }}</strong></span>
      <span class="device-info-meta-item">位置：<strong>{{ location || '—' }}</strong></span>
      <span class="device-info-meta-item">使用单位：<strong>{{ unit || '—' }}</strong></span>
      <span class="device-info-meta-item">投用：<strong>{{ installDate || '—' }}</strong></span>
    </div>
    <div class="device-info-actions">
      <el-button size="small" @click="emit('back')">
        <el-icon class="el-icon--left"><ArrowLeft /></el-icon>返回
      </el-button>
      <el-button size="small" type="primary">
        <el-icon class="el-icon--left"><Refresh /></el-icon>刷新数据
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { runStatusLabel } from '@/config/statusDict'

defineProps<{
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

<style scoped>
.device-info-header--compact {
  padding: 8px 16px;
  margin-bottom: 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
  border-bottom: 1px solid var(--color-border-light);
  box-shadow: none;
  backdrop-filter: none;
  background: var(--color-card-bg);
}

.device-info-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
  flex: 1;
}

.device-info-name-compact {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.5px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-info-meta-sep {
  color: var(--color-border);
  font-size: 14px;
}

.device-info-meta-item {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.device-info-meta-item strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.device-info-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
