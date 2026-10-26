<template>
  <el-drawer
    :model-value="open"
    title="设备状态"
    direction="rtl"
    size="440px"
    append-to-body
    @close="emit('close')"
  >
    <template v-if="device">
      <header class="drawer-head">
        <div>
          <h3>{{ device.name }}</h3>
          <p>{{ device.code }} · {{ device.type }}</p>
        </div>
        <span :class="['overall-tag', `is-${overview.overall}`]">{{ lampLabel(overview.overall) }}</span>
      </header>

      <dl class="drawer-meta">
        <div>
          <dt>使用地点</dt>
          <dd>{{ device.location || '—' }}</dd>
        </div>
        <div>
          <dt>所属单位</dt>
          <dd>{{ unitText }}</dd>
        </div>
        <div>
          <dt>可能事故</dt>
          <dd>{{ overview.accident || '当前无红黄项' }}</dd>
        </div>
      </dl>

      <section class="drawer-section">
        <h4>六项服务</h4>
        <ul class="service-list">
          <li v-for="service in overview.services" :key="service.key" :class="`is-${service.level}`">
            <div class="service-list-top">
              <span class="service-name">{{ service.label }}</span>
              <span :class="['lamp-tag', `is-${service.level}`]">{{ lampLabel(service.level) }}</span>
            </div>
            <p>{{ service.reason }}</p>
            <div class="service-list-foot">
              <span v-if="service.accident">{{ service.accident }}</span>
              <button type="button" @click="openDetail(service.key)">查看详情</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="drawer-section">
        <h4>近期报警 / 预警</h4>
        <ul v-if="overview.alarms.length" class="alarm-list">
          <li v-for="alarm in overview.alarms" :key="alarm.id">
            <div class="alarm-top">
              <span :class="['lamp-tag', `is-${alarm.level}`]">{{ lampLabel(alarm.level) }}</span>
              <time>{{ alarm.time }}</time>
            </div>
            <p>{{ alarm.serviceLabel }} · {{ alarm.text }}</p>
            <span class="alarm-accident">{{ alarm.accident }}</span>
          </li>
        </ul>
        <p v-else class="empty-copy">近 30 日没有未关闭的报警或预警。</p>
      </section>

      <section class="drawer-section">
        <h4>应力云图</h4>
        <div class="unity-box">
          <div class="unity-label">Unity3D 模型占位</div>
          <div class="unity-stage">
          <svg viewBox="0 0 360 150" role="img" aria-label="桥式起重机应力云图示意">
            <rect x="18" y="28" width="324" height="10" rx="2" class="beam" />
            <rect x="150" y="18" width="60" height="14" rx="2" class="trolley" />
            <line x1="180" y1="32" x2="180" y2="78" class="rope" />
            <rect x="158" y="78" width="44" height="22" rx="3" class="hook" />
            <line x1="28" y1="38" x2="28" y2="120" class="leg" />
            <line x1="332" y1="38" x2="332" y2="120" class="leg" />
            <line x1="16" y1="120" x2="344" y2="120" class="rail" />
          </svg>
          <button
            v-for="node in structureNodes"
            :key="node.id"
            type="button"
            class="node-hit"
            :style="{ left: node.left, top: node.top }"
            @click="selectNode(node.id, node.label)"
          >{{ node.label }}</button>
          </div>
          <p>示意色块，不是实测应力。模型接入后按结构节点编号联动监测数据。</p>
          <p v-if="activeNode" class="node-current">当前结构节点：{{ activeNode }}</p>
        </div>
      </section>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/mock'
import { useSceneStore } from '@/stores/scene'
import {
  getDeviceOverview,
  lampLabel,
  notifyStructureNode,
  type OverviewServiceKey
} from '@/mock/overviewStatus'

const props = defineProps<{
  device: Device | null
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const sceneStore = useSceneStore()
const activeNode = ref('')

const open = computed(() => !!props.device)
const overview = computed(() => getDeviceOverview(props.device?.id || 'empty'))
const unitText = computed(() => {
  const device = props.device
  if (!device) return '—'
  return [device.enterprise, device.affiliatedUnit, device.workArea].filter(Boolean).join(' / ')
})

const structureNodes = [
  { id: 'girder-mid', label: '主梁', left: '42%', top: '8%' },
  { id: 'leg-left', label: '支腿', left: '6%', top: '48%' },
  { id: 'trolley', label: '小车', left: '46%', top: '34%' }
]

const detailServiceKey: Record<OverviewServiceKey, string> = {
  safety: 'remote',
  healthMonitor: 'healthMonitor',
  health: 'health',
  crack: 'crack',
  fault: 'fault',
  risk: 'risk'
}

watch(() => props.device?.id, () => {
  activeNode.value = ''
})

function selectNode(nodeId: string, label: string) {
  activeNode.value = `${label}（${nodeId}）`
  notifyStructureNode(nodeId)
}

function openDetail(key: OverviewServiceKey) {
  const device = props.device
  if (!device) return
  sceneStore.setScene(device.scene)
  sceneStore.setService(detailServiceKey[key])
  sceneStore.setDevice(device.id, true)
  router.push(`/device/${device.id}`)
}
</script>

<style scoped>
.drawer-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.drawer-head h3 {
  font-size: 18px;
  line-height: 1.3;
}

.drawer-head p,
.drawer-meta dd,
.service-list p,
.alarm-list p,
.unity-box p,
.empty-copy {
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.overall-tag,
.lamp-tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: var(--color-standby-bg);
  color: var(--color-text-secondary);
}

.overall-tag.is-yellow,
.lamp-tag.is-yellow {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.overall-tag.is-red,
.lamp-tag.is-red {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.overall-tag.is-normal,
.lamp-tag.is-normal {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.drawer-meta {
  display: grid;
  gap: 8px;
  margin: 16px 0;
}

.drawer-meta div {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
}

.drawer-meta dt {
  color: var(--color-text-muted);
  font-size: 12px;
}

.drawer-section {
  margin-top: 18px;
}

.drawer-section h4 {
  margin-bottom: 8px;
  font-size: 14px;
}

.service-list,
.alarm-list {
  list-style: none;
  display: grid;
  gap: 8px;
}

.service-list li,
.alarm-list li {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card-bg);
}

.service-list li.is-red,
.alarm-list li:has(.is-red) {
  border-color: var(--color-danger);
}

.service-list li.is-yellow {
  border-color: var(--color-warning);
}

.service-list-top,
.alarm-top,
.service-list-foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.service-name {
  font-weight: 700;
}

.service-list-foot {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 12px;
}

.service-list-foot button,
.node-hit {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 12px;
}

.alarm-top time,
.alarm-accident {
  color: var(--color-text-muted);
  font-size: 12px;
}

.unity-box {
  position: relative;
  padding: 12px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background:
    linear-gradient(180deg, var(--color-danger-bg), var(--color-warning-bg) 42%, var(--color-success-bg));
}

.unity-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.unity-stage {
  position: relative;
  margin: 8px 0;
}

.unity-box svg {
  width: 100%;
  height: 140px;
  display: block;
}

.beam { fill: var(--color-danger); opacity: 0.8; }
.trolley, .hook { fill: var(--color-warning); }
.rope, .leg, .rail { stroke: var(--color-text-secondary); stroke-width: 3; }

.node-hit {
  position: absolute;
  padding: 4px 6px;
  border-radius: 999px;
  background: var(--color-card-bg);
  box-shadow: var(--color-card-shadow);
}

.node-current {
  font-weight: 700;
  color: var(--color-text-primary);
}
</style>
