<template>
  <div class="ov-scroll">
    <div class="ov-page">
      <button type="button" class="ov-back" @click="back">‹ 返回设备安全态势</button>
      <section v-if="card" class="ov-device-head">
        <div>
          <div class="ov-idline">
            <h1>{{ card.name }}</h1>
            <span>{{ card.code }}</span>
            <span class="ov-status" :class="`is-${card.level}`">{{ levelText(card.level) }}</span>
            <span class="ov-tag">{{ card.workLabel }}</span>
          </div>
          <div class="ov-facts">
            <span>{{ card.unit }} · {{ card.location || '—' }}</span>
            <span>额定起重量 <b>{{ card.capacityText }}</b></span>
            <span>跨度 <b>{{ card.spanText }}</b></span>
            <span>工作级别 <b>{{ card.classText }}</b></span>
            <span>投用 <b>{{ card.yearText }}</b></span>
            <span>设备负责人 <b>—</b></span>
          </div>
        </div>
        <div>
          <div class="ov-actions">
            <button type="button" class="primary" @click="demo">派发工单</button>
            <button type="button" @click="demo">现场确认</button>
            <button type="button" @click="demo">标记误报</button>
          </div>
          <p v-if="hint" class="ov-demo-hint">{{ hint }}</p>
        </div>
      </section>
      <p v-else>没有这台设备。</p>

      <section v-if="card" class="ov-device-grid">
        <div class="ov-twin">
          <div class="ov-section-head">
            <h2>数字孪生</h2>
            <div class="ov-layers" role="group" aria-label="孪生图层">
              <button v-for="item in layers" :key="item.id" type="button" :class="{ active: layer === item.id }" @click="layer = item.id">{{ item.name }}</button>
            </div>
          </div>
          <div class="ov-stage">
            <svg viewBox="0 0 800 400" role="img" aria-label="桥式起重机结构示意">
              <line x1="40" y1="350" x2="760" y2="350" stroke="#334a6b" stroke-width="2" />
              <rect x="60" y="110" width="680" height="34" fill="none" stroke="#7fa6d6" stroke-width="2" />
              <rect x="60" y="150" width="680" height="34" fill="none" stroke="#7fa6d6" stroke-width="2" />
              <rect v-if="layer === 'stress'" x="250" y="110" width="300" height="74" fill="rgba(148,163,184,.25)" />
              <rect x="330" y="82" width="140" height="28" fill="none" stroke="#a5c4ea" stroke-width="2" />
              <rect x="60" y="100" width="24" height="94" fill="none" stroke="#7fa6d6" stroke-width="2" />
              <rect x="716" y="100" width="24" height="94" fill="none" stroke="#7fa6d6" stroke-width="2" />
              <line x1="380" y1="184" x2="380" y2="270" stroke="#a5c4ea" stroke-width="2" />
              <line x1="420" y1="184" x2="420" y2="270" stroke="#a5c4ea" stroke-width="2" />
              <path d="M360 270 h80 l-12 60 h-56 z" fill="none" stroke="#a5c4ea" stroke-width="2" />
              <text x="400" y="312" fill="#a5c4ea" font-size="13" text-anchor="middle">吊具</text>
            </svg>
            <button v-for="node in nodes" :key="node.id" type="button" class="ov-node" :style="{ left: node.left, top: node.top }" @click="pickNode(node.id, node.label)">{{ node.label }}</button>
            <p v-if="callout" class="ov-callout" :class="{ 'is-yellow': card.level === 'yellow' }">{{ callout }}</p>
            <div class="ov-stage-foot">
              <span>{{ layer === 'stress' ? '应力云图为示意，无实测色标' : 'Unity 3D 模型接入位' }}</span>
              <span v-if="activeNode">当前结构节点：{{ activeNode }}</span>
            </div>
          </div>
          <div class="ov-lives">
            <div>
              <span>当前起重量</span>
              <b>{{ card.curTons == null ? '—' : card.curTons.toFixed(0) }}<em>t</em></b>
            </div>
            <div><span>主起升制动力矩</span><b>—<em></em></b></div>
            <div><span>减速机高速轴温度</span><b>—<em></em></b></div>
            <div><span>主梁跨中应力</span><b>—<em></em></b></div>
            <div><span>大车运行速度</span><b>—<em></em></b></div>
          </div>
        </div>
        <aside class="ov-side">
          <div class="ov-block ov-alert" :class="alertClass">
            <div class="ov-section-head">
              <h2>{{ card.level === 'yellow' ? '报警详情' : card.level === 'red' ? '预警详情' : '当前状态' }}</h2>
              <span v-if="card.scene" class="ov-pill">关联事故：{{ card.scene }}</span>
            </div>
            <p>{{ detailText }}</p>
            <div class="ov-kv">
              <span>发生时间 <b>{{ alarmTime }}</b></span>
              <span>已持续 <b>—</b></span>
              <span>数据来源 <b>{{ sourceText }}</b></span>
              <span>处置状态 <b>—</b></span>
            </div>
            <div>
              <span class="ov-sub">近 7 日曲线</span>
              <div ref="chartEl" class="ov-chart"></div>
            </div>
          </div>
          <div class="ov-block">
            <h2>处置建议</h2>
            <p class="ov-sub">—</p>
          </div>
          <div class="ov-block">
            <h2>处置进度</h2>
            <div v-for="alarm in card.overview.alarms" :key="alarm.id" class="ov-step">
              <i></i>
              <span>{{ alarm.serviceLabel }} · {{ alarm.text }}<em>{{ alarm.time }}</em></span>
            </div>
            <p v-if="!card.overview.alarms.length" class="ov-sub">—</p>
          </div>
        </aside>
      </section>

      <section v-if="card" class="ov-block">
        <div class="ov-section-head">
          <h2>各服务结论速览</h2>
          <span class="ov-sub">结论来自六项服务的概览灯，详情进入原有模块</span>
        </div>
        <div class="ov-services">
          <div v-for="service in card.overview.services" :key="service.key" class="ov-service" :class="`is-${service.level === 'normal' ? 'normal' : service.level}`">
            <span class="name">{{ service.label }}</span>
            <span class="result">{{ lampLabel(service.level) }}</span>
            <span class="detail">{{ service.reason }}</span>
            <button type="button" @click="openModule(service.key)">进入模块 →</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getOverviewCard, levelText, servicePageKey } from '@/mock/overviewDemo'
import { lampLabel, notifyStructureNode, type OverviewServiceKey } from '@/mock/overviewStatus'
import { overviewAccessOf, useAuthStore } from '@/stores/auth'
import { useSceneStore } from '@/stores/scene'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const sceneStore = useSceneStore()
const hint = ref('')
const layer = ref<'stress' | 'motion' | 'points'>('stress')
const activeNode = ref('')
const chartEl = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let timer = 0

const layers = [
  { id: 'stress' as const, name: '应力云图' },
  { id: 'motion' as const, name: '运动状态' },
  { id: 'points' as const, name: '监测点位' }
]
const nodes = [
  { id: 'girder', label: '主梁', left: '46%', top: '18%' },
  { id: 'leg', label: '支腿', left: '8%', top: '42%' },
  { id: 'trolley', label: '小车', left: '48%', top: '36%' }
]

const card = computed(() => getOverviewCard(String(route.params.id || '')))
watch(card, current => {
  const access = overviewAccessOf(auth)
  if (!current || access.kind === 'super') return
  const outsideEnterprise = current.enterprise !== access.enterprise
  const outsideUnit = access.kind === 'factory' && current.unit !== access.unit
  if (!outsideEnterprise && !outsideUnit) return
  router.replace({
    name: 'overviewPlant',
    query: { enterprise: access.enterprise || '', ...(access.unit ? { unit: access.unit } : {}) }
  })
}, { immediate: true })
const alarmTime = computed(() => card.value?.overview.alarms[0]?.time || '—')
const sourceText = computed(() => card.value?.overview.alarms[0]?.serviceLabel || '—')
const detailText = computed(() => {
  const current = card.value
  if (!current) return ''
  if (current.level === 'off') return '设备台账标记为不在线。红黄灯仍按六项服务规则单独计算。'
  if (current.level === 'normal') return '六项服务当前都是正常。'
  return current.message || '—'
})
const callout = computed(() => {
  const current = card.value
  if (!current || (current.level !== 'red' && current.level !== 'yellow')) return ''
  return [current.scene, current.message].filter(Boolean).join(' · ')
})
const alertClass = computed(() => card.value?.level === 'yellow' ? 'is-yellow' : card.value?.level === 'normal' ? 'is-ok' : '')

function back() {
  router.push({ name: 'overviewPlant', query: route.query })
}

function demo() {
  hint.value = '演示按钮，尚未接入'
  window.clearTimeout(timer)
  timer = window.setTimeout(() => { hint.value = '' }, 1600)
}

function openModule(key: OverviewServiceKey) {
  const current = card.value
  if (!current) return
  sceneStore.setScene('metallurgy')
  sceneStore.setService(servicePageKey(key))
  sceneStore.setDevice(current.id, true)
  router.push(`/device/${current.id}`)
}

function draw() {
  if (!chartEl.value) return
  chart?.dispose()
  chart = echarts.init(chartEl.value)
  chart.setOption({
    graphic: [{
      type: 'text',
      left: 'center',
      top: 'middle',
      style: { text: '暂无近 7 日序列', fill: '#64748b', fontSize: 12 }
    }]
  })
}

function pickNode(id: string, label: string) {
  activeNode.value = label
  notifyStructureNode(id)
}
onMounted(draw)
onBeforeUnmount(() => chart?.dispose())
</script>
