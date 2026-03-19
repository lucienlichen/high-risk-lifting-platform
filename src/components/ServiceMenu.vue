<template>
  <div class="service-menu">

    <!-- ── 智能运维 ─────────────────────────────── -->
    <div class="service-group ops-group">
      <!-- 分类标题 -->
      <div class="group-header ops">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
        智能运维
        <span class="group-count">{{ opsServices.length }} 项</span>
      </div>
      <!-- 按钮区 -->
      <div class="group-btns">
        <div
          v-for="svc in opsServices"
          :key="svc.key"
          :class="['service-btn ops-btn', { active: activeService === svc.key, disabled: !hasDevice }]"
          @click="handleClick(svc.key)"
          :title="hasDevice ? svc.label : '请先选择设备'"
        >
          <div class="service-btn-icon">
            <component :is="svc.icon" />
          </div>
          <span class="service-btn-label">{{ svc.label }}</span>
        </div>
      </div>
    </div>

    <!-- ── 竖向分隔线 ─── -->
    <div class="service-divider"></div>

    <!-- ── 事故防控 ─────────────────────────────── -->
    <div class="service-group prevention-group">
      <!-- 分类标题 -->
      <div class="group-header prevention">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        事故防控
        <span class="group-count">{{ preventionServices.length }} 项</span>
      </div>
      <!-- 按钮区 -->
      <div class="group-btns">
        <div
          v-for="svc in preventionServices"
          :key="svc.key"
          :class="['service-btn prevention-btn', { active: activeService === svc.key, disabled: !hasDevice }]"
          @click="handleClick(svc.key)"
          :title="hasDevice ? svc.label : '请先选择设备'"
        >
          <div class="service-btn-icon">
            <component :is="svc.icon" />
          </div>
          <span class="service-btn-label">{{ svc.label }}</span>
        </div>
      </div>
    </div>

    <!-- 未选设备浮层提示 -->
    <div v-if="!hasDevice" class="no-device-overlay">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      请先选择设备以启用智能服务
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import { useSceneStore } from '@/stores/scene'

const store = useSceneStore()

const hasDevice     = computed(() => !!store.currentDeviceId)
const activeService = computed(() => store.activeService)

function handleClick(key: string) {
  if (!hasDevice.value) return
  store.setService(activeService.value === key ? null : key)
}

// ─── SVG Icon factory ─────────────────────────────────────────────────
function icon(els: Array<{ tag: string; attrs: Record<string, unknown> }>) {
  return defineComponent({
    render: () => h('svg', {
      width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', 'stroke-width': 1.6,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }, els.map(e => h(e.tag, e.attrs)))
  })
}

// ─── 智能运维 4 项 ────────────────────────────────────────────────────
const opsServices = [
  {
    key: 'remote',
    label: '远程监测',
    icon: icon([
      { tag: 'rect',     attrs: { x: 2, y: 3, width: 20, height: 14, rx: 2 } },
      { tag: 'line',     attrs: { x1: 8,  y1: 21, x2: 16,    y2: 21 } },
      { tag: 'line',     attrs: { x1: 12, y1: 17, x2: 12,    y2: 21 } },
      { tag: 'polyline', attrs: { points: '7 11 9 9 11 11 13 7 15 10 17 9' } }
    ])
  },
  {
    key: 'health',
    label: '健康评估',
    icon: icon([
      { tag: 'path', attrs: { d: 'M22 12h-4l-3 9L9 3l-3 9H2' } }
    ])
  },
  {
    key: 'crack',
    label: '裂纹预测',
    icon: icon([
      { tag: 'path', attrs: { d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' } }
    ])
  },
  {
    key: 'fault',
    label: '故障诊断',
    icon: icon([
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 3 } },
      { tag: 'path',   attrs: { d: 'M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14' } }
    ])
  }
]

// ─── 事故防控 3 项 ────────────────────────────────────────────────────
const preventionServices = [
  {
    key: 'risk',
    label: '风险监测',
    icon: icon([
      { tag: 'path', attrs: { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' } },
      { tag: 'line', attrs: { x1: 12, y1: 9,  x2: 12,      y2: 13 } },
      { tag: 'line', attrs: { x1: 12, y1: 17, x2: '12.01', y2: 17 } }
    ])
  },
  {
    key: 'hazard',
    label: '隐患排查',
    icon: icon([
      { tag: 'circle', attrs: { cx: 11, cy: 11, r: 8 } },
      { tag: 'line',   attrs: { x1: 21,    y1: 21, x2: 16.65, y2: 16.65 } },
      { tag: 'line',   attrs: { x1: 11,    y1: 8,  x2: 11,    y2: 11 } },
      { tag: 'line',   attrs: { x1: 11,    y1: 14, x2: '11.01', y2: 14 } }
    ])
  },
  {
    key: 'issue',
    label: '问题处理',
    icon: icon([
      { tag: 'path',     attrs: { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
      { tag: 'polyline', attrs: { points: '14 2 14 8 20 8' } },
      { tag: 'polyline', attrs: { points: '9 15 11 17 15 13' } }
    ])
  }
]
</script>

<style scoped>
/* ── 整体容器：轻毛玻璃，撑满宽度 ── */
.service-menu {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  background: rgba(248, 250, 253, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 -2px 16px rgba(15, 23, 42, 0.06);
}

/* ── 分组容器 ── */
.service-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ops-group        { flex: 4; }
.prevention-group { flex: 3; }

/* ── 分类标题行：居中 + 大字号 ── */
.group-header {
  display: flex;
  align-items: center;
  justify-content: center;   /* 居中 */
  gap: 6px;
  padding: 7px 12px 6px;
  font-size: 13.5px;           /* 加大 */
  font-weight: 700;
  letter-spacing: 1px;
  border-bottom: 1px solid transparent;
  white-space: nowrap;
  user-select: none;
}

.group-header.ops {
  color: #1677ff;
  background: rgba(22, 119, 255, 0.06);
  border-bottom-color: rgba(22, 119, 255, 0.14);
}

.group-header.prevention {
  color: #cf1322;
  background: rgba(207, 19, 34, 0.05);
  border-bottom-color: rgba(207, 19, 34, 0.14);
}

.group-count {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.55;
}

/* ── 按钮行：带内边距，按钮间留缝 ── */
.group-btns {
  display: flex;
  flex: 1;
  align-items: stretch;      /* 按钮撑满行高 */
  gap: 7px;
  padding: 10px 12px;
  min-height: 80px;
}

/* ── 服务按钮：左图标 + 右文字，白色底更显眼 ── */
.service-btn {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 14px;           /* 上下由 align-items:stretch 撑开 */
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease,
              border-color 0.16s ease, box-shadow 0.16s ease;
  background: #ffffff;       /* 白色底，清晰可见 */
  border: 1.5px solid #e2e8f0;
  color: #334155;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

/* 智能运维 — hover */
.ops-btn:hover:not(.disabled) {
  background: rgba(22, 119, 255, 0.07);
  border-color: rgba(22, 119, 255, 0.35);
  color: #1677ff;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
}

/* 智能运维 — 选中（加深，更醒目） */
.ops-btn.active {
  background: rgba(22, 119, 255, 0.12);
  border-color: #1677ff;
  border-width: 1.5px;
  color: #1677ff;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(22, 119, 255, 0.20);
}

/* 事故防控 — hover */
.prevention-btn:hover:not(.disabled) {
  background: rgba(207, 19, 34, 0.06);
  border-color: rgba(207, 19, 34, 0.35);
  color: #cf1322;
  box-shadow: 0 2px 8px rgba(207, 19, 34, 0.10);
}

/* 事故防控 — 选中（加深，更醒目） */
.prevention-btn.active {
  background: rgba(207, 19, 34, 0.10);
  border-color: #cf1322;
  border-width: 1.5px;
  color: #cf1322;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(207, 19, 34, 0.16);
}

.service-btn.disabled {
  opacity: 0.36;
  cursor: not-allowed;
  box-shadow: none;
}

/* ── 图标容器（左侧） ── */
.service-btn-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── 文字（右侧） ── */
.service-btn-label {
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 竖向分隔线 ── */
.service-divider {
  width: 1px;
  background: rgba(203, 213, 225, 0.9);
  flex-shrink: 0;
  align-self: stretch;
}

/* ── 未选设备提示（绝对定位，不占位） ── */
.no-device-overlay {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
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
