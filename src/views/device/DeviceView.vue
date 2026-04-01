<template>
  <!-- Device detail: data tabs at top, content scrollable, service menu in layout -->
  <div class="device-view-root">

    <!-- ─── Layer 1: Device Info Header — above tabs ─── -->
    <div class="device-info-header device-info-header--compact" v-if="device">
      <div class="device-info-inline">
        <span class="device-info-name-compact">{{ device.name }}</span>
        <span :class="`badge badge-${device.status}`">
          <span class="badge-dot"></span>{{ statusLabels[device.status] }}
        </span>
        <span class="device-info-meta-sep">·</span>
        <span class="device-info-meta-item">编号：{{ device.code }}</span>
        <span class="device-info-meta-item">类型：{{ device.type }}</span>
        <span class="device-info-meta-item">位置：{{ device.location }}</span>
        <span class="device-info-meta-item">使用单位：{{ device.subsidiary || device.group || '—' }}</span>
        <span class="device-info-meta-item">投用：{{ device.installDate }}</span>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0">
        <el-button size="small" @click="router.back()">
          <el-icon class="el-icon--left"><ArrowLeft /></el-icon>返回
        </el-button>
        <el-button size="small" type="primary">
          <el-icon class="el-icon--left"><Refresh /></el-icon>刷新数据
        </el-button>
      </div>
    </div>

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
    <div :class="['content-scrollable', { 'monitor-tab-content': activeTab === 'monitor' }]" style="flex:1">

      <!-- ── 基础信息 ── -->
      <template v-if="activeTab === 'basic'">
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

        <!-- 内容区（与其他标签内容区宽度对齐） -->
        <div class="monitor-workspace-wrapper">
          <!-- 工作循环面板 -->
          <div class="monitor-filter-bar">
            <WorkCyclePicker
              v-model="monitorCycleId"
              v-model:date="monitorOpDate"
              :cycles="monitorWorkCycles"
              :device-id="device?.id ?? ''"
            />
          </div>

          <!-- 内联监测工作区 -->
          <DeviceMonitoringWorkspace
            v-if="device"
            :device="device"
            :hide-op-list="true"
            :model-op-id="monitorOpId"
            :model-op-date="monitorOpDate"
            class="monitor-workspace-inline"
          />
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

      <!-- ── Service Content Panel ── -->
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

    <!-- ─── Layer 4: 远程监测弹出面板 (Bottom Drawer 风格) ─── -->
    <div
      v-if="store.activeService === 'remote'"
      class="remote-monitor-drawer"
    >
      <div class="rm-drawer-body">
        <div class="rm-layout">
          <!-- 全宽：报警流水核心区 -->
          <div class="rm-alarms-pane">
            <div class="rm-pane-header">
              <div class="rm-pane-header-left">
                <span class="rm-pane-title">监控告警列表</span>
                <el-radio-group v-model="alarmFilter" size="small">
                  <el-radio-button value="pending">
                    未处理 <el-tag size="small" type="danger" round style="margin-left:4px;transform:scale(0.9)">{{ mockAlarms.filter(a => a.status === 'pending').length }}</el-tag>
                  </el-radio-button>
                  <el-radio-button value="resolved">历史记录</el-radio-button>
                </el-radio-group>
              </div>
              <div class="rm-pane-header-right">
                <el-button v-if="alarmFilter === 'pending'" type="danger" size="small" plain>
                  <el-icon class="el-icon--left"><Warning /></el-icon>一键消警
                </el-button>
                <el-button size="small" @click="store.setService(null)" circle>
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
            
            <div class="rm-alarms-list">
              <el-table
                v-if="filteredAlarms.length > 0"
                :data="filteredAlarms"
                style="width: 100%; height: 100%"
                row-key="id"
                :expand-row-keys="activeAlarmId ? [activeAlarmId] : []"
                @expand-change="handleExpandChange"
                :row-class-name="tableRowClassName"
                height="100%"
              >
                <!-- 展开列：展示图表 -->
                <el-table-column type="expand">
                  <template #default="{ row }">
                    <div class="rm-alarm-card-body" style="padding: 16px; background: transparent; border-top: none;">
                      <div class="rm-alarm-desc" style="margin-bottom: 12px; padding: 8px 12px; background: rgba(0,0,0,0.02); border-radius: 4px;">
                        <el-icon style="margin-right: 4px; vertical-align: -2px;"><InfoFilled /></el-icon>
                        {{ row.desc }}
                      </div>
                      <div v-if="row.times?.length" class="rm-chart-container">
                        <div ref="alarmChartRef" class="rm-alarm-chart"></div>
                      </div>
                      <div v-else class="rm-no-chart">
                        暂无关联的趋势数据
                      </div>
                    </div>
                  </template>
                </el-table-column>

                <!-- 数据列 -->
                <el-table-column prop="time" label="发生时间" width="160" />
                
                <el-table-column label="告警级别" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.level === 'danger' ? 'danger' : row.level === 'warning' ? 'warning' : 'info'" size="small" effect="light">
                      {{ row.level === 'danger' ? '危险' : row.level === 'warning' ? '警告' : '提示' }}
                    </el-tag>
                  </template>
                </el-table-column>
                
                <el-table-column prop="title" label="告警内容" min-width="200">
                  <template #default="{ row }">
                    <span :class="`rm-text-${row.level}`" style="font-weight: 600;">{{ row.title }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column v-if="alarmFilter === 'resolved'" prop="handler" label="处理人" width="120" />
                <el-table-column v-if="alarmFilter === 'resolved'" prop="resolveTime" label="处理时间" width="160" />
                
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button 
                      v-if="row.status === 'pending'" 
                      type="primary" 
                      link
                      size="small" 
                      @click.stop="resolveAlarm(row)"
                    >
                      处理告警
                    </el-button>
                    <span v-else class="rm-alarm-resolve-info" style="border: none; padding: 0; margin: 0;">已处理</span>
                  </template>
                </el-table-column>
              </el-table>
              
              <div v-else class="rm-empty-state">
                <el-icon :size="40" color="#cbd5e1"><Select /></el-icon>
                <p>当前没有{{ alarmFilter === 'pending' ? '未处理的告警' : '历史告警记录' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, defineComponent, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSceneStore } from '@/stores/scene'
import { Monitor, Warning, Select, Close, InfoFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import DeviceMonitoringWorkspace from '@/components/DeviceMonitoringWorkspace.vue'
import WorkCyclePicker from '@/components/WorkCyclePicker.vue'
import { getDeviceById, getOperationList, getWorkCycles } from '@/mock'
import type { Device, WorkCycle } from '@/mock'

// ─── Sub-component for service panel content ─────────────────────────
const ServiceDetailContent = defineComponent({
  props: {
    service: { type: String, required: true },
    device:  { type: Object as () => Device | null }
  },
  setup(props) {
    const contents: Record<string, string[]> = {
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

const device    = ref<Device | null>(null)
const activeTab = ref('point')

// ── 监测数据工作循环筛选 ──
const monitorOpDate  = ref<Date>(new Date())
/** 下拉选中的 WorkCycle id，'all' 表示全天监测 */
const monitorCycleId = ref<string>('all')

/** 含完整字段的工作循环列表（倒序，最新在前）*/
const monitorWorkCycles = computed((): WorkCycle[] => {
  if (!device.value) return []
  return getWorkCycles(device.value.id, monitorOpDate.value).slice().reverse()
})

/** 用于 workspace 内部过滤的 OperationRecord id：seq-1 映射到 OP-xxx */
const monitorOperationList = computed(() =>
  getOperationList(device.value?.id ?? '', monitorOpDate.value)
)

const monitorOpId = computed(() => {
  if (monitorCycleId.value === 'all') return 'all'
  const cycle = monitorWorkCycles.value.find(c => c.id === monitorCycleId.value)
  if (!cycle) return 'all'
  return monitorOperationList.value[cycle.seq - 1]?.id ?? 'all'
})

// 切换日期时，默认选中最新一次循环
watch(monitorWorkCycles, (list) => {
  monitorCycleId.value = list.length > 0 ? list[0].id : 'all'
})

const dataTabs = [
  { key: 'point',       label: '点巡检数据' },
  { key: 'fault',       label: '故障数据' },
  { key: 'maintenance', label: '检修数据' },
  { key: 'inspect',     label: '检验数据' },
  { key: 'detect',      label: '检测数据' },
  { key: 'risk',        label: '风险数据' },
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

const basicFields = computed(() => device.value ? [
  { label: '设备名称',   value: device.value.name },
  { label: '设备编号',   value: device.value.code },
  { label: '设备类型',   value: device.value.type },
  { label: '所属场景',   value: { metallurgy:'冶金起重装备', port:'港口起重装备', construction:'建筑起重装备', shipbuilding:'造船起重装备' }[device.value.scene] },
  { label: '所在位置',   value: device.value.location },
  { label: '使用单位',   value: device.value.subsidiary || device.value.group || '—' },
  { label: '投用日期',   value: device.value.installDate },
  { label: '累计运行时长', value: `${device.value.operatingHours.toLocaleString()} h` },
] : [])

// ── 远程监测：告警数据模拟与曲线 ──
const activeAlarmId = ref<string>('')
const alarmFilter = ref('pending') // 'pending' | 'resolved'

const mockAlarms = ref([
  { id: 'a1', level: 'danger', time: '10:45:22', title: '大车运行偏斜超限', desc: '大车运行偏斜量达到 12.5mm，超过限值 10mm，已触发安全联锁停机。',
    metric: '大车偏斜量 (mm)', limit: 10,
    times: ['10:40', '10:41', '10:42', '10:43', '10:44', '10:45'],
    values: [4.2, 5.8, 7.5, 9.1, 10.8, 12.5],
    status: 'pending', handler: '', resolveTime: ''
  },
  { id: 'a2', level: 'warning', time: '10:42:15', title: '起升力矩预警', desc: '当前起升力矩达到额定力矩的 92%，请注意载荷变化，避免超载。',
    metric: '起升力矩 (%)', limit: 90,
    times: ['10:37', '10:38', '10:39', '10:40', '10:41', '10:42'],
    values: [65, 78, 85, 88, 90, 92],
    status: 'pending', handler: '', resolveTime: ''
  },
  { id: 'a3', level: 'warning', time: '09:15:00', title: '环境风速过大', desc: '当前风速 9.8m/s，接近限值 10.8m/s，请持续关注气象变化。',
    metric: '环境风速 (m/s)', limit: 10.8,
    times: ['09:10', '09:11', '09:12', '09:13', '09:14', '09:15'],
    values: [6.5, 7.2, 8.5, 8.9, 9.5, 9.8],
    status: 'resolved', handler: '自动恢复', resolveTime: '09:45:00'
  },
  { id: 'a4', level: 'danger', time: '昨天 16:20', title: '制动器异常', desc: '起升机构制动器未完全闭合，存在溜钩风险。',
    metric: '制动器行程', limit: null,
    times: ['16:15', '16:16', '16:17', '16:18', '16:19', '16:20'],
    values: [100, 100, 100, 80, 40, 20],
    status: 'resolved', handler: '李工', resolveTime: '昨天 16:50'
  },
])

const filteredAlarms = computed(() => mockAlarms.value.filter(a => a.status === alarmFilter.value))
const activeAlarm = computed(() => mockAlarms.value.find(a => a.id === activeAlarmId.value))

function handleExpandChange(row: any, expandedRows: any[]) {
  const isExpanded = expandedRows.some(r => r.id === row.id)
  if (isExpanded) {
    activeAlarmId.value = row.id
  } else {
    if (activeAlarmId.value === row.id) {
      activeAlarmId.value = ''
    }
  }
}

function tableRowClassName({ row }: { row: any }) {
  return `rm-table-row-${row.level}`
}

function resolveAlarm(alarm: any) {
  alarm.status = 'resolved'
  alarm.handler = '当前用户'
  const d = new Date()
  alarm.resolveTime = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  if (activeAlarmId.value === alarm.id) activeAlarmId.value = ''
}

// ECharts 实例引用
const alarmChartRef = ref<HTMLElement>()
let alarmChart: echarts.ECharts | null = null

function renderAlarmChart() {
  if (!alarmChartRef.value || !activeAlarm.value || activeAlarm.value.times.length === 0) {
    if (alarmChart) {
      alarmChart.dispose()
      alarmChart = null
    }
    return
  }

  if (!alarmChart) {
    alarmChart = echarts.init(alarmChartRef.value)
  }

  const alarm = activeAlarm.value
  const isDanger = alarm.level === 'danger'
  const color = isDanger ? '#ff4d4f' : '#faad14'
  const areaColor = isDanger ? 'rgba(255, 77, 79, 0.2)' : 'rgba(250, 173, 20, 0.2)'

  alarmChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: alarm.times,
      axisLine: { lineStyle: { color: '#e8edf3' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: alarm.metric,
      nameTextStyle: { color: '#64748b', fontSize: 11, padding: [0, 0, 0, 20] },
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series: [
      {
        name: alarm.metric,
        type: 'line',
        data: alarm.values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: color },
        lineStyle: { color: color, width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: areaColor },
            { offset: 1, color: 'rgba(255,255,255,0)' }
          ])
        },
        markLine: alarm.limit ? {
          data: [{ yAxis: alarm.limit, name: '限值' }],
          lineStyle: { color: '#ff4d4f', type: 'dashed', width: 2 },
          label: { position: 'insideEndTop', formatter: '限值 {c}', color: '#ff4d4f' }
        } : null
      }
    ]
  }, true)
}

watch(activeAlarmId, (newId) => {
  nextTick(() => {
    if (newId) {
      renderAlarmChart()
      setTimeout(() => alarmChart?.resize(), 50)
    } else {
      if (alarmChart) {
        alarmChart.dispose()
        alarmChart = null
      }
    }
  })
})

watch(() => store.activeService, (newVal) => {
  if (newVal === 'remote') {
    // 每次打开面板，默认重置为待处理列表并清空选中状态
    alarmFilter.value = 'pending'
    activeAlarmId.value = ''
  } else {
    if (alarmChart) {
      alarmChart.dispose()
      alarmChart = null
    }
  }
})

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

function applyTabFromQuery() {
  if (route.query.tab === 'monitor') {
    activeTab.value = 'monitor'
    nextTick(() => {
      router.replace({ path: route.path })
    })
  } else {
    activeTab.value = 'point'
  }
}

function loadDevice() {
  const id = route.params.id as string
  device.value = getDeviceById(id)
  if (device.value) {
    store.setDevice(id)
  }
  applyTabFromQuery()
}

onMounted(loadDevice)
watch(() => route.params.id, loadDevice)
watch(
  () => route.query.tab,
  tab => {
    if (tab === 'monitor' && device.value) {
      activeTab.value = 'monitor'
      nextTick(() => {
        router.replace({ path: route.path })
      })
    }
  }
)
</script>

<style scoped>
.device-view-root {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* monitor tab：去掉 padding，flex 纵向布局让工作区可撑满 */
.monitor-tab-content {
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* ── 紧凑单行设备信息头 ── */
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
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.device-info-meta-sep {
  color: var(--color-border);
  font-size: 12px;
}

.device-info-meta-item {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* ── 监测数据筛选栏 ── */
.monitor-filter-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  margin-bottom: 12px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
}


/* ── 内联监测工作区包裹层：提供与其他标签一致的 20px 侧边距 ── */
.monitor-workspace-wrapper {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 内联工作区：还原 dmw-root 的卡片样式（在 wrapper 内正常显示） */
.monitor-workspace-inline {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ── 其他保留样式 ── */
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

/* ════════════════════════════════════════════════════════
   远程监测 Bottom Drawer 样式
   ════════════════════════════════════════════════════════ */
.remote-monitor-drawer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(100% - 50px); /* 留出顶部信息栏高度 */
  background: rgba(248, 250, 252, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(22, 119, 255, 0.2);
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  z-index: 100;
  animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.rm-drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.rm-drawer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.rm-drawer-icon {
  font-size: 18px;
  color: var(--color-primary);
}

.rm-drawer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rm-drawer-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  background: transparent;
}

.rm-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ── 全宽告警流水区 ── */
.rm-alarms-pane {
  flex: 1;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rm-pane-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(248, 250, 252, 0.5);
}

.rm-pane-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.rm-pane-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.rm-alarms-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 告警表格样式 */
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--color-bg-subtle);
  --el-table-border-color: var(--color-border-light);
  --el-table-header-bg-color: rgba(248, 250, 252, 0.5);
  font-size: 13px;
}

:deep(.el-table th.el-table__cell) {
  background-color: var(--el-table-header-bg-color);
  color: var(--color-text-secondary);
  font-weight: 600;
}

:deep(.rm-table-row-danger) {
  border-left: 3px solid var(--color-danger);
}
:deep(.rm-table-row-warning) {
  border-left: 3px solid var(--color-warning);
}
:deep(.rm-table-row-info) {
  border-left: 3px solid var(--color-primary);
}

:deep(.el-table__expanded-cell) {
  padding: 0 !important;
  background-color: var(--color-card-bg) !important;
}

.rm-chart-container {
  margin-top: 12px;
  height: 260px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.rm-alarm-chart {
  width: 100%;
  height: 100%;
}

.rm-no-chart {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  border: 1px dashed var(--color-border-light);
  border-radius: var(--radius-sm);
  min-height: 120px;
}

.rm-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 14px;
  padding: 40px;
}
</style>

