<template>
  <!-- Device detail: data tabs at top, content scrollable, service menu in layout -->
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden">

    <!-- ─── Layer 2: Data Category Tabs ─── -->
    <div class="data-tabs">
      <div
        v-for="tab in dataTabs"
        :key="tab.key"
        :class="['data-tab', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >{{ tab.label }}</div>
    </div>

    <!-- ─── Layer 3: Scrollable Core Content ─── -->
    <div class="content-scrollable" style="flex:1">

      <!-- Device Info Header -->
      <div class="device-info-header" v-if="device">
        <div class="device-info-main">
          <div class="device-info-name">
            {{ device.name }}
            <span :class="`badge badge-${device.status}`">
              <span class="badge-dot"></span>{{ statusLabels[device.status] }}
            </span>
            <span :class="`badge badge-${device.riskLevel}`">
              <span class="badge-dot"></span>{{ riskLabels[device.riskLevel] }}
            </span>
          </div>
          <div class="device-info-meta">
            <span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              编号：{{ device.code }}
            </span>
            <span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
              类型：{{ device.type }}
            </span>
            <span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              位置：{{ device.location }}
            </span>
            <span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/></svg>
              制造商：{{ device.manufacturer }}
            </span>
            <span>投用日期：{{ device.installDate }}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <el-button size="small" @click="router.back()">
            <el-icon class="el-icon--left"><ArrowLeft /></el-icon>返回
          </el-button>
          <el-button size="small" type="primary">
            <el-icon class="el-icon--left"><Refresh /></el-icon>刷新数据
          </el-button>
        </div>
      </div>

      <!-- ── 运行数据 ── -->
      <template v-if="activeTab === 'operation'">
        <!-- Metric Cards -->
        <div class="metric-row">
          <div class="metric-card">
            <div class="metric-card-label">运行时长</div>
            <div class="metric-card-value">
              {{ device?.operatingHours.toLocaleString() }}<span class="metric-card-unit">h</span>
            </div>
            <div class="metric-card-trend" style="color:var(--color-success)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>
              累计运行正常
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-card-label">当前负荷</div>
            <div class="metric-card-value" :style="{ color: device?.status === 'running' ? loadColor : 'var(--color-text-secondary)' }">
              {{ device?.status === 'running' ? device.load : '—' }}<span class="metric-card-unit" v-if="device?.status === 'running'">%</span>
            </div>
            <div class="metric-card-trend" :style="{ color: device?.status === 'running' ? loadColor : 'var(--color-text-muted)' }">
              {{ device?.status === 'running' ? (device!.load > 80 ? '⚠ 负荷偏高' : '● 负荷正常') : '设备未运行' }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-card-label">健康评分</div>
            <div class="metric-card-value" :style="{ color: scoreColor(device?.healthScore ?? 0) }">
              {{ device?.healthScore }}<span class="metric-card-unit">分</span>
            </div>
            <div class="metric-card-trend" :style="{ color: scoreColor(device?.healthScore ?? 0) }">
              {{ scoreLabel(device?.healthScore ?? 0) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-card-label">告警次数</div>
            <div class="metric-card-value" style="color:var(--color-warning)">
              {{ alarms.filter(a => a.status === '待处置').length }}<span class="metric-card-unit">条</span>
            </div>
            <div class="metric-card-trend" style="color:var(--color-text-muted)">待处置告警</div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="chart-row">
          <div class="section-card">
            <div class="section-card-header">
              <span class="section-card-title">24h 负荷趋势</span>
              <span style="font-size:11px;color:var(--color-text-muted)">单位：%</span>
            </div>
            <div class="section-card-body" style="padding:8px 12px">
              <div ref="loadChartRef" class="chart-container"></div>
            </div>
          </div>
          <div class="section-card">
            <div class="section-card-header">
              <span class="section-card-title">24h 温度 / 振动监测曲线</span>
            </div>
            <div class="section-card-body" style="padding:8px 12px">
              <div ref="monitorChartRef" class="chart-container"></div>
            </div>
          </div>
        </div>

        <!-- Alarm History Table -->
        <div class="section-card" style="margin-bottom:16px">
          <div class="section-card-header">
            <span class="section-card-title">告警历史记录</span>
            <el-tag size="small" type="warning">{{ alarms.length }} 条</el-tag>
          </div>
          <el-table :data="alarms" style="width:100%" size="small">
            <el-table-column prop="type"        label="告警类型" width="120" />
            <el-table-column label="严重程度"   width="90">
              <template #default="{ row }">
                <span :style="{ color: severityColor(row.severity) }">● {{ row.severity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="time"        label="告警时间"  width="170" />
            <el-table-column label="处置状态"   width="90">
              <template #default="{ row }">
                <span :style="{ color: row.status === '已处置' ? 'var(--color-success)' : 'var(--color-danger)' }">
                  {{ row.status }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" show-overflow-tooltip />
          </el-table>
        </div>
      </template>

      <!-- ── 基础信息 ── -->
      <template v-else-if="activeTab === 'basic'">
        <div class="section-card" style="margin-bottom:14px">
          <div class="section-card-header">
            <span class="section-card-title">设备基本信息</span>
          </div>
          <div class="section-card-body">
            <div class="info-grid">
              <div class="info-item" v-for="f in basicFields" :key="f.label">
                <span class="info-item-label">{{ f.label }}</span>
                <span class="info-item-value">{{ f.value }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="section-card">
          <div class="section-card-header">
            <span class="section-card-title">技术参数</span>
          </div>
          <div class="section-card-body">
            <div class="info-grid">
              <div class="info-item" v-for="f in techFields" :key="f.label">
                <span class="info-item-label">{{ f.label }}</span>
                <span class="info-item-value">{{ f.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ── 故障数据 ── -->
      <template v-else-if="activeTab === 'fault'">
        <div class="section-card">
          <div class="section-card-header">
            <span class="section-card-title">故障记录</span>
            <el-tag size="small" type="danger">{{ faultRecords.length }} 条</el-tag>
          </div>
          <el-table :data="faultRecords" style="width:100%">
            <el-table-column prop="date"        label="发生时间"   width="170" />
            <el-table-column prop="type"        label="故障类型"   width="130" />
            <el-table-column prop="desc"        label="故障描述"   min-width="200" show-overflow-tooltip />
            <el-table-column prop="duration"    label="停机时长"   width="100" />
            <el-table-column prop="resolution"  label="处置措施"   min-width="160" show-overflow-tooltip />
            <el-table-column label="状态"       width="80">
              <template #default="{ row }">
                <span :style="{ color: row.resolved ? 'var(--color-success)' : 'var(--color-danger)' }">
                  {{ row.resolved ? '已修复' : '处理中' }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <!-- ── 监测数据 ── -->
      <template v-else-if="activeTab === 'monitor'">
        <div class="metric-row">
          <div class="metric-card">
            <div class="metric-card-label">当前温度</div>
            <div class="metric-card-value" style="color:var(--color-warning)">72<span class="metric-card-unit">°C</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-card-label">振动加速度</div>
            <div class="metric-card-value">0.82<span class="metric-card-unit">g</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-card-label">噪声分贝</div>
            <div class="metric-card-value">68<span class="metric-card-unit">dB</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-card-label">倾斜角度</div>
            <div class="metric-card-value" style="color:var(--color-success)">0.3<span class="metric-card-unit">°</span></div>
          </div>
        </div>
        <div class="section-card">
          <div class="section-card-header">
            <span class="section-card-title">多维监测曲线</span>
          </div>
          <div class="section-card-body" style="padding:8px 12px">
            <div ref="multiMonitorRef" style="width:100%;height:260px"></div>
          </div>
        </div>
      </template>

      <!-- ── Other Tabs (Placeholder) ── -->
      <template v-else>
        <div class="section-card">
          <div class="empty-placeholder">
            <svg class="empty-placeholder-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <div class="empty-placeholder-text">
              <div style="font-size:15px;font-weight:600;color:var(--color-text-secondary);margin-bottom:6px">
                {{ currentTabLabel }} 数据
              </div>
              <div>该分类数据将在正式版本中提供，演示版暂不展示</div>
            </div>
          </div>
        </div>
      </template>

      <!-- ── Service Content Panel (when service selected) ── -->
      <div v-if="store.activeService" class="service-content-panel">
        <div class="service-content-header">
          <span class="section-card-title">{{ serviceLabels[store.activeService] }} · 智能分析</span>
          <el-button size="small" text @click="store.setService(null)">
            <el-icon><Close /></el-icon>关闭
          </el-button>
        </div>
        <div class="service-content-body">
          <ServiceDetailContent :service="store.activeService" :device="device" />
        </div>
      </div>

      <div style="height:16px"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, defineComponent, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSceneStore } from '@/stores/scene'
import { getDeviceById, getDeviceRunData, getDeviceAlarms } from '@/mock'
import type { Device } from '@/mock'
import * as echarts from 'echarts'

// ─── Sub-component for service panel content ─────────────────────────
const ServiceDetailContent = defineComponent({
  props: {
    service: { type: String, required: true },
    device:  { type: Object as () => Device | null }
  },
  setup(props) {
    const contents: Record<string, string[]> = {
      remote:  ['实时在线状态：正常', '数据采集频率：1Hz', '传感器在线数：12 / 12', '通信延迟：8 ms', '最近数据上报：刚刚'],
      health:  [`综合健康评分：${props.device?.healthScore ?? 0} 分`, '关键部件老化程度：轻微', '润滑状态：良好', '结构应力评估：正常', '建议下次保养：30天后'],
      crack:   ['钢结构裂纹风险：低', '主梁应力分布：正常', '焊缝监测：未发现异常', '疲劳寿命预测：剩余 78%', '建议检测周期：6个月'],
      fault:   ['当前运行状态：正常', '减速器温度：偏高（72°C）', '主电机电流：稳定', '传感器状态：全部在线', '近期故障概率：8%'],
      risk:    [`综合风险等级：${props.device?.riskLevel ?? '—'}`, '安全监测指标：全部正常', '超载记录：近30天 0次', '违规操作：近30天 0次', '风险趋势：稳定'],
      hazard:  ['未处理隐患：2 项', '隐患类型：制动系统磨损、钢丝绳锈蚀', '排查日期：2026-03-15', '整改期限：2026-04-01', '整改责任人：李工'],
      issue:   ['当前问题数：3 项', '紧急问题：1 项（减速器温度超限）', '一般问题：2 项', '本月处理完结率：86%', '待派工单：1 张']
    }
    return () => h('div', { style: 'display:flex;flex-direction:column;gap:6px' },
      (contents[props.service] ?? []).map(text =>
        h('div', { style: 'display:flex;align-items:center;gap:8px;font-size:13px;color:#475569' }, [
          h('span', { style: 'width:6px;height:6px;border-radius:50%;background:#1677ff;flex-shrink:0' }),
          text
        ])
      )
    )
  }
})

const router = useRouter()
const route  = useRoute()
const store  = useSceneStore()

const device     = ref<Device | null>(null)
const alarms     = ref<ReturnType<typeof getDeviceAlarms>>([])
const activeTab  = ref('point')
const runData    = ref<ReturnType<typeof getDeviceRunData>>([])

const loadChartRef    = ref<HTMLElement>()
const monitorChartRef = ref<HTMLElement>()
const multiMonitorRef = ref<HTMLElement>()
let loadChart: echarts.ECharts | null = null
let monitorChart: echarts.ECharts | null = null
let multiChart: echarts.ECharts | null = null

const dataTabs = [
  { key: 'point',       label: '点巡检数据' },
  { key: 'fault',       label: '故障数据' },
  { key: 'maintenance', label: '检修数据' },
  { key: 'inspect',     label: '检验数据' },
  { key: 'detect',      label: '检测数据' },
  { key: 'risk',        label: '风险数据' },
  { key: 'operation',   label: '运行数据' },
  { key: 'measure',     label: '监控数据' },
  { key: 'monitor',     label: '监测数据' },
  { key: 'basic',       label: '基础信息' },
  { key: 'factory',     label: '出厂数据' },
]

const currentTabLabel = computed(() => dataTabs.find(t => t.key === activeTab.value)?.label ?? '')

const statusLabels: Record<string,string> = { running:'运行中', standby:'待机', stopped:'停机', maintenance:'维修中' }
const riskLabels:   Record<string,string> = { normal:'正常', low:'低风险', medium:'中风险', high:'高风险' }
const serviceLabels: Record<string,string> = {
  remote:'远程监测', health:'健康评估', crack:'裂纹预测', fault:'故障诊断',
  risk:'风险监测', hazard:'隐患排查', issue:'问题处理'
}

function scoreColor(s: number) {
  if (s >= 85) return 'var(--color-success)'
  if (s >= 70) return 'var(--color-warning)'
  return 'var(--color-danger)'
}
function scoreLabel(s: number) {
  if (s >= 85) return '● 设备健康'
  if (s >= 70) return '▲ 注意关注'
  return '▼ 需要维护'
}
const loadColor = computed(() => {
  const l = device.value?.load ?? 0
  if (l > 85) return 'var(--color-danger)'
  if (l > 70) return 'var(--color-warning)'
  return 'var(--color-success)'
})
function severityColor(s: string) {
  if (s === '严重') return 'var(--color-danger)'
  if (s === '一般') return 'var(--color-warning)'
  return 'var(--color-text-secondary)'
}

const basicFields = computed(() => device.value ? [
  { label: '设备名称',   value: device.value.name },
  { label: '设备编号',   value: device.value.code },
  { label: '设备类型',   value: device.value.type },
  { label: '所属场景',   value: { metallurgy:'冶金起重装备', port:'港口起重装备', construction:'建筑起重装备', shipbuilding:'造船起重装备' }[device.value.scene] },
  { label: '所在位置',   value: device.value.location },
  { label: '制造商',     value: device.value.manufacturer },
  { label: '投用日期',   value: device.value.installDate },
  { label: '累计运行时长', value: `${device.value.operatingHours.toLocaleString()} h` },
] : [])

const techFields = [
  { label: '额定起重量', value: '50 t' },
  { label: '跨度',       value: '28.5 m' },
  { label: '起升高度',   value: '12 m' },
  { label: '起升速度',   value: '8 m/min' },
  { label: '运行速度',   value: '40 m/min' },
  { label: '工作级别',   value: 'M5' },
  { label: '电动机功率', value: '55 kW' },
  { label: '供电电压',   value: 'AC 380V / 50Hz' },
]

const faultRecords = computed(() => [
  { date:'2026-01-15 14:30', type:'制动器故障', desc:'左侧制动器制动力矩不足', duration:'2.5h', resolution:'更换制动片', resolved:true },
  { date:'2025-12-08 09:15', type:'电气故障',   desc:'变频器过温保护动作', duration:'1.0h', resolution:'清洁散热器，调整参数', resolved:true },
  { date:'2025-11-22 16:45', type:'机械故障',   desc:'减速器异常振动', duration:'4.0h', resolution:'更换轴承', resolved:true },
  { date:'2025-10-30 11:20', type:'传感器故障', desc:'编码器信号丢失', duration:'0.5h', resolution:'重新接线固定', resolved:true },
  { date:'2026-03-10 08:30', type:'电气故障',   desc:'主接触器触点烧蚀', duration:'—', resolution:'等待备件', resolved:false },
])

function initCharts() {
  nextTick(() => {
    if (loadChartRef.value) {
      loadChart?.dispose()
      loadChart = echarts.init(loadChartRef.value)
      loadChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        grid: { left: 36, right: 12, top: 8, bottom: 28 },
        xAxis: {
          type: 'category',
          data: runData.value.map(d => d.time),
          axisLine: { lineStyle: { color: '#e8edf3' } },
          axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        yAxis: {
          type: 'value', min: 0, max: 100,
          axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
          splitLine: { lineStyle: { color: '#f0f4f8' } }
        },
        series: [{
          type: 'line', data: runData.value.map(d => d.load),
          smooth: true, symbol: 'none',
          areaStyle: { color: { type:'linear', x:0,y:0,x2:0,y2:1, colorStops: [{ offset:0, color:'rgba(22,119,255,0.15)' }, { offset:1, color:'rgba(22,119,255,0)' }] } },
          lineStyle: { color: '#1677ff', width: 2 },
          markLine: { silent:true, data: [{ yAxis:80, lineStyle:{ color:'#fa8c16', type:'dashed' } }] }
        }]
      })
    }

    if (monitorChartRef.value) {
      monitorChart?.dispose()
      monitorChart = echarts.init(monitorChartRef.value)
      monitorChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data:['温度(°C)','振动(×0.1g)'], bottom:0, textStyle:{ color:'#94a3b8', fontSize:10 }, itemWidth:12, itemHeight:12 },
        grid: { left: 36, right: 12, top: 8, bottom: 36 },
        xAxis: {
          type: 'category', data: runData.value.map(d => d.time),
          axisLine: { lineStyle: { color: '#e8edf3' } },
          axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        yAxis: { type:'value', axisLabel:{ color:'#94a3b8', fontSize:10 }, splitLine:{ lineStyle:{ color:'#f0f4f8' } } },
        series: [
          { name:'温度(°C)',   type:'line', data:runData.value.map(d => d.temperature), smooth:true, symbol:'none', lineStyle:{ color:'#fa8c16', width:2 } },
          { name:'振动(×0.1g)', type:'line', data:runData.value.map(d => Math.round(d.vibration*10)), smooth:true, symbol:'none', lineStyle:{ color:'#722ed1', width:2 } }
        ]
      })
    }

    if (multiMonitorRef.value && activeTab.value === 'monitor') {
      multiChart?.dispose()
      multiChart = echarts.init(multiMonitorRef.value)
      multiChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data:['温度','噪声','振动'], bottom:0, textStyle:{ color:'#94a3b8', fontSize:10 } },
        grid: { left: 36, right: 12, top: 8, bottom: 36 },
        xAxis: {
          type: 'category', data: runData.value.map(d => d.time),
          axisLine: { lineStyle: { color:'#e8edf3' } }, axisLabel:{ color:'#94a3b8', fontSize:10 }
        },
        yAxis: { type:'value', axisLabel:{ color:'#94a3b8', fontSize:10 }, splitLine:{ lineStyle:{ color:'#f0f4f8' } } },
        series: [
          { name:'温度', type:'line', data:runData.value.map(d=>d.temperature), smooth:true, symbol:'none', lineStyle:{ color:'#fa8c16', width:2 } },
          { name:'噪声', type:'line', data:runData.value.map((_,i)=>60+Math.sin(i/3)*8+Math.random()*4), smooth:true, symbol:'none', lineStyle:{ color:'#1677ff', width:2 } },
          { name:'振动', type:'line', data:runData.value.map(d=>Math.round(d.vibration*100)), smooth:true, symbol:'none', lineStyle:{ color:'#52c41a', width:2 } }
        ]
      })
    }
  })
}

function loadDevice() {
  const id = route.params.id as string
  activeTab.value = 'point'
  device.value = getDeviceById(id)
  if (device.value) {
    store.setDevice(id)
    runData.value = getDeviceRunData(id)
    alarms.value  = getDeviceAlarms(id)
  }
  initCharts()
}

onMounted(loadDevice)
onUnmounted(() => { loadChart?.dispose(); monitorChart?.dispose(); multiChart?.dispose() })
watch(() => route.params.id, loadDevice)
watch(activeTab, initCharts)
</script>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: var(--color-border-light);
  border-radius: var(--radius-sm);
}

.info-item-label {
  font-size: 11px;
  color: var(--color-text-muted);
}

.info-item-value {
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.service-content-panel {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(22,119,255,0.12);
  margin-bottom: 16px;
}

.service-content-header {
  padding: 12px 18px;
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(22,119,255,0.03);
}

.service-content-body {
  padding: 16px 18px;
}
</style>
