<template>
  <!-- Device detail: data tabs at top, content scrollable, service menu in layout -->
  <div class="device-view-root">

    <!-- ─── Layer 1: Device Info Header — above tabs ─── -->
    <div class="device-info-header device-info-header--compact" v-if="device">
      <div class="device-info-inline">
        <span class="device-info-name-compact">
          <el-icon size="20" color="var(--color-primary)"><Platform /></el-icon>
          {{ device.name }}
        </span>
        <span :class="`badge badge-${device.status}`">
          <span class="badge-dot"></span>{{ statusLabels[device.status] }}
        </span>
        <span class="device-info-meta-sep">·</span>
        <span class="device-info-meta-item">编号：<strong>{{ device.code }}</strong></span>
        <span class="device-info-meta-item">类型：<strong>{{ device.type }}</strong></span>
        <span class="device-info-meta-item">位置：<strong>{{ device.location }}</strong></span>
        <span class="device-info-meta-item">使用单位：<strong>{{ device.subsidiary || device.group || '—' }}</strong></span>
        <span class="device-info-meta-item">投用：<strong>{{ device.installDate }}</strong></span>
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
      <div v-if="store.activeService && store.activeService !== 'remote' && store.activeService !== 'health' && store.activeService !== 'crack'" class="service-content-panel">
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
          <div class="rm-live-pane">
            <div class="rm-pane-header">
              <div class="rm-pane-header-left">
                <span class="rm-pane-title">{{ remotePanelMode === 'live' ? '实时监测报警' : '历史预警记录' }}</span>
                <el-tag :type="currentPendingAlarmCount > 0 ? 'danger' : 'success'" size="small" effect="dark" round>
                  {{ currentPendingAlarmCount > 0 ? `${currentPendingAlarmCount} 项告警中` : '当前无告警' }}
                </el-tag>
              </div>
              <div class="rm-pane-header-right">
                <div class="rm-mode-switch">
                  <button
                    :class="['rm-mode-switch-btn', { active: remotePanelMode === 'live' }]"
                    @click="remotePanelMode = 'live'"
                  >
                    实时监测报警
                  </button>
                  <button
                    :class="['rm-mode-switch-btn', { active: remotePanelMode === 'history' }]"
                    @click="remotePanelMode = 'history'"
                  >
                    历史记录
                  </button>
                </div>
                <el-button size="small" @click="store.setService(null)" circle>
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>

            <div v-if="remotePanelMode === 'live'" class="rm-live-grid">
              <div class="rm-live-column">
                <div class="rm-live-column-head">
                  <span class="rm-live-column-title">参数监控</span>
                  <span class="rm-live-column-sub">电控系统参数监控前 8 项</span>
                </div>
                <div class="rm-live-card-list">
                  <div
                    v-for="card in parameterAlarmCards"
                    :key="card.key"
                    :class="['rm-live-card', `rm-live-card--${card.status}`, { 'is-clickable': card.status === 'alarm' }]"
                    @click="handleLiveCardClick(card)"
                  >
                    <div class="rm-live-card-top">
                      <span class="rm-live-card-label">{{ card.label }}</span>
                      <span :class="['rm-live-indicator', card.status === 'normal' ? 'rm-live-indicator--normal' : 'rm-live-indicator--alert']">
                        <svg v-if="card.status === 'alarm'" class="rm-live-indicator-svg" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M7 15h10l-1.2-7.3A3.8 3.8 0 0 0 12 4.5a3.8 3.8 0 0 0-3.8 3.2z" />
                          <path d="M9 17h6" />
                          <path d="M12 2.5v1.6" />
                          <path d="M4.5 8.5l1.4.8" />
                          <path d="M19.5 8.5l-1.4.8" />
                        </svg>
                      </span>
                    </div>
                    <div class="rm-live-card-value">{{ card.value }}</div>
                    <div class="rm-live-card-bottom">
                      <span class="rm-live-card-sub">{{ card.sub }}</span>
                      <el-tag :type="card.status === 'alarm' ? 'danger' : 'success'" size="small" effect="plain">
                        {{ card.stateText }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rm-live-divider"></div>

              <div class="rm-live-column">
                <div class="rm-live-column-head">
                  <span class="rm-live-column-title">状态监控</span>
                  <span class="rm-live-column-sub">8 项安全状态实时监测</span>
                </div>
                <div class="rm-live-card-list">
                  <div
                    v-for="card in statusAlarmCards"
                    :key="card.key"
                    :class="['rm-live-card', `rm-live-card--${card.status}`, { 'is-clickable': card.status === 'alarm' }]"
                    @click="handleLiveCardClick(card)"
                  >
                    <div class="rm-live-card-top">
                      <span class="rm-live-card-label">{{ card.label }}</span>
                      <span :class="['rm-live-indicator', card.status === 'normal' ? 'rm-live-indicator--normal' : 'rm-live-indicator--alert']">
                        <svg v-if="card.status === 'alarm'" class="rm-live-indicator-svg" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M7 15h10l-1.2-7.3A3.8 3.8 0 0 0 12 4.5a3.8 3.8 0 0 0-3.8 3.2z" />
                          <path d="M9 17h6" />
                          <path d="M12 2.5v1.6" />
                          <path d="M4.5 8.5l1.4.8" />
                          <path d="M19.5 8.5l-1.4.8" />
                        </svg>
                      </span>
                    </div>
                    <div class="rm-live-card-value rm-live-card-value--status">{{ card.value }}</div>
                    <div class="rm-live-card-bottom">
                      <span class="rm-live-card-sub">{{ card.sub }}</span>
                      <el-tag :type="card.status === 'alarm' ? 'danger' : 'success'" size="small" effect="plain">
                        {{ card.stateText }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="rm-history-pane">
              <div class="rm-history-toolbar">
                <el-radio-group v-model="alarmFilter" size="small">
                  <el-radio-button value="pending">
                    未处理记录 <el-tag size="small" type="danger" round style="margin-left:4px;transform:scale(0.9)">{{ mockAlarms.filter(a => a.status === 'pending').length }}</el-tag>
                  </el-radio-button>
                  <el-radio-button value="resolved">历史记录</el-radio-button>
                </el-radio-group>
                <el-button v-if="alarmFilter === 'pending'" type="danger" size="small" plain>
                  <el-icon class="el-icon--left"><Warning /></el-icon>一键消警
                </el-button>
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
                
                <el-table-column prop="source" label="告警来源" min-width="120" show-overflow-tooltip />
                <el-table-column prop="parameter" label="监测参数" min-width="150" show-overflow-tooltip />
                <el-table-column prop="title" label="告警内容" min-width="180" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span :class="`rm-text-${row.level}`" style="font-weight: 600;">{{ row.title }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="currentValue" label="实时值" width="120" />
                <el-table-column prop="limitValue" label="阈值/期望" width="120" />
                <el-table-column prop="duration" label="持续时长" width="110" />
                <el-table-column prop="currentState" label="当前状态" width="120">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.status === 'resolved' ? 'success' : row.level === 'danger' ? 'danger' : 'warning'"
                      size="small"
                      effect="plain"
                    >
                      {{ row.currentState }}
                    </el-tag>
                  </template>
                </el-table-column>
                
                <el-table-column v-if="alarmFilter === 'resolved'" prop="peakValue" label="峰值" width="120" />
                <el-table-column v-if="alarmFilter === 'resolved'" prop="conclusion" label="处理结论" min-width="180" show-overflow-tooltip />
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

    <el-dialog
      v-model="liveAlertDialogVisible"
      width="460px"
      title="报警处理"
      append-to-body
    >
      <div v-if="selectedLiveAlertCard" class="rm-alert-dialog-body">
        <div class="rm-alert-dialog-row">
          <span class="rm-alert-dialog-label">监测项</span>
          <span class="rm-alert-dialog-value">{{ selectedLiveAlertCard.label }}</span>
        </div>
        <div class="rm-alert-dialog-row">
          <span class="rm-alert-dialog-label">当前值</span>
          <span class="rm-alert-dialog-value">{{ selectedLiveAlertCard.value }}</span>
        </div>
        <div class="rm-alert-dialog-row">
          <span class="rm-alert-dialog-label">报警说明</span>
          <span class="rm-alert-dialog-value">{{ selectedLiveAlertCard.sub }}</span>
        </div>
      </div>
      <template #footer>
        <div class="rm-alert-dialog-footer">
          <el-button @click="liveAlertDialogVisible = false">取消</el-button>
          <el-button @click="ignoreLiveAlert">忽略</el-button>
          <el-button type="primary" @click="resolveLiveAlert">已处理</el-button>
        </div>
      </template>
    </el-dialog>

    <HealthAssessmentDrawer
      v-if="store.activeService === 'health'"
      :device="device"
      @close="store.setService(null)"
    />

    <CrackMonitoringDrawer
      v-if="store.activeService === 'crack'"
      :device="device"
      @close="store.setService(null)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, defineComponent, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSceneStore } from '@/stores/scene'
import { Monitor, Warning, Select, Close, InfoFilled, ArrowLeft, Refresh, Platform } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import DeviceMonitoringWorkspace from '@/components/DeviceMonitoringWorkspace.vue'
import HealthAssessmentDrawer from '@/components/HealthAssessmentDrawer.vue'
import CrackMonitoringDrawer from '@/components/CrackMonitoringDrawer.vue'
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
const remotePanelMode = ref('live')

type RemoteAlarmStatus = 'pending' | 'resolved'
type RemoteAlarmLevel = 'danger' | 'warning' | 'info'

interface RemoteAlarmRecord {
  id: string
  level: RemoteAlarmLevel
  time: string
  title: string
  desc: string
  source: string
  parameter: string
  currentValue: string
  limitValue: string
  peakValue: string
  duration: string
  currentState: string
  conclusion: string
  metric: string
  limit: number | null
  times: string[]
  values: number[]
  status: RemoteAlarmStatus
  handler: string
  resolveTime: string
}

type RemoteRealtimeCardStatus = 'normal' | 'alarm'

interface RemoteRealtimeCard {
  key: string
  label: string
  value: string
  sub: string
  stateText: string
  status: RemoteRealtimeCardStatus
  relatedAlarmId?: string
}

const mockAlarms = ref([
  { id: 'a1', level: 'danger', time: '10:45:22', title: '大车运行偏斜超限', desc: '大车运行偏斜量达到 12.5 mm，超过限值 10 mm，已触发联锁保护并建议暂停运行。',
    source: '参数监控', parameter: '大车运行偏斜', currentValue: '12.5 mm', limitValue: '10 mm', peakValue: '12.5 mm', duration: '5 min', currentState: '联锁停机', conclusion: '',
    metric: '大车偏斜量 (mm)', limit: 10,
    times: ['10:40', '10:41', '10:42', '10:43', '10:44', '10:45'],
    values: [4.2, 5.8, 7.5, 9.1, 10.8, 12.5],
    status: 'pending', handler: '', resolveTime: ''
  },
  { id: 'a2', level: 'warning', time: '10:42:15', title: '起重力矩接近限值', desc: '当前起重力矩达到额定力矩的 92%，已经进入预警区间，建议降低载荷并持续观察。',
    source: '参数监控', parameter: '起重力矩', currentValue: '92 %', limitValue: '90 %', peakValue: '92 %', duration: '6 min', currentState: '持续预警', conclusion: '',
    metric: '起重力矩 (%)', limit: 90,
    times: ['10:37', '10:38', '10:39', '10:40', '10:41', '10:42'],
    values: [65, 78, 85, 88, 90, 92],
    status: 'pending', handler: '', resolveTime: ''
  },
  { id: 'a3', level: 'warning', time: '09:15:00', title: '风速接近限值', desc: '风速达到 9.8 m/s，接近 10.8 m/s 限值，系统提示关注环境变化并降低运行节奏。',
    source: '参数监控', parameter: '风速', currentValue: '9.8 m/s', limitValue: '10.8 m/s', peakValue: '10.2 m/s', duration: '8 min', currentState: '已恢复', conclusion: '风速回落后解除预警，恢复正常监控',
    metric: '环境风速 (m/s)', limit: 10.8,
    times: ['09:10', '09:11', '09:12', '09:13', '09:14', '09:15'],
    values: [6.5, 7.2, 8.5, 8.9, 9.5, 9.8],
    status: 'resolved', handler: '自动恢复', resolveTime: '09:45:00'
  },
  { id: 'a4', level: 'danger', time: '昨天 16:20', title: '起升机构制动器开闭异常', desc: '起升机构制动器反馈信号异常，闭合度持续下降，存在溜钩风险，系统已要求现场复位。',
    source: '状态监控', parameter: '起升机构制动器的开闭', currentValue: '40 %', limitValue: '≥ 90 %', peakValue: '40 %', duration: '12 min', currentState: '已闭环', conclusion: '现场复位制动器反馈开关并恢复闭合状态',
    metric: '制动器闭合度 (%)', limit: 90,
    times: ['16:15', '16:16', '16:17', '16:18', '16:19', '16:20'],
    values: [100, 100, 100, 80, 40, 20],
    status: 'resolved', handler: '李工', resolveTime: '昨天 16:50'
  },
  { id: 'a5', level: 'warning', time: '昨天 14:32', title: '超速保护触发预警', desc: '起升机构速度瞬时接近超速保护阈值，系统记录波动并发出预警。',
    source: '状态监控', parameter: '超速保护', currentValue: '1.16 m/s', limitValue: '1.20 m/s', peakValue: '1.18 m/s', duration: '3 min', currentState: '已恢复', conclusion: '调整变频器输出后速度恢复稳定',
    metric: '起升速度 (m/s)', limit: 1.2,
    times: ['14:27', '14:28', '14:29', '14:30', '14:31', '14:32'],
    values: [0.92, 0.98, 1.05, 1.12, 1.18, 1.16],
    status: 'resolved', handler: '张工', resolveTime: '昨天 14:40'
  },
  { id: 'a6', level: 'danger', time: '10:49:08', title: '联锁保护触发报警', desc: '联锁保护检测到机构协同异常，已进入保护状态，建议现场核查联锁链路。',
    source: '状态监控', parameter: '联锁保护', currentValue: '保护触发', limitValue: '正常联锁', peakValue: '保护触发', duration: '2 min', currentState: '保护触发', conclusion: '',
    metric: '联锁状态', limit: null,
    times: ['10:44', '10:45', '10:46', '10:47', '10:48', '10:49'],
    values: [0, 0, 1, 1, 1, 1],
    status: 'pending', handler: '', resolveTime: ''
  },
] as RemoteAlarmRecord[])

const filteredAlarms = computed(() => mockAlarms.value.filter(a => a.status === alarmFilter.value))
const activeAlarm = computed(() => mockAlarms.value.find(a => a.id === activeAlarmId.value))
const currentPendingAlarmCount = computed(() => mockAlarms.value.filter(a => a.status === 'pending').length)
const liveAlertDialogVisible = ref(false)
const selectedLiveAlertCard = ref<RemoteRealtimeCard | null>(null)

function getDeviceSeed(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}

function findPendingAlarm(parameter: string) {
  return mockAlarms.value.find(item => item.status === 'pending' && item.parameter === parameter)
}

const parameterAlarmCards = computed<RemoteRealtimeCard[]>(() => {
  const seed = getDeviceSeed(device.value?.id ?? 'remote')
  const weight = (46 + (seed % 35) / 10).toFixed(1)
  const height = (8 + (seed % 20) / 10).toFixed(1)
  const depth = (0.4 + (seed % 6) / 10).toFixed(1)
  const bridgePos = (35 + (seed % 12) / 10).toFixed(1)
  const trolleyPos = (14 + (seed % 9) / 10).toFixed(1)
  const bridgeTravel = '120'
  const trolleyTravel = '36'
  const amplitude = (18 + (seed % 8) / 10).toFixed(1)
  const rotation = 128 + (seed % 24)
  const skewAlarm = findPendingAlarm('大车运行偏斜')
  const momentAlarm = findPendingAlarm('起重力矩')
  const windHistory = mockAlarms.value.find(item => item.parameter === '风速')

  const weightStatus: RemoteRealtimeCardStatus = momentAlarm ? 'alarm' : 'normal'

  return [
    {
      key: 'liftWeight',
      label: '起重量',
      value: `${weight} t`,
      sub: '额定 50 t',
      stateText: momentAlarm ? '告警' : '正常',
      status: weightStatus,
      relatedAlarmId: momentAlarm?.id
    },
    {
      key: 'moment',
      label: '起重力矩',
      value: momentAlarm?.currentValue ?? '86 %',
      sub: `限值 ${momentAlarm?.limitValue ?? '90 %'}`,
      stateText: momentAlarm ? '告警' : '正常',
      status: momentAlarm ? 'alarm' : 'normal',
      relatedAlarmId: momentAlarm?.id
    },
    {
      key: 'height',
      label: '起升高度 / 下降深度',
      value: `${height} m / ${depth} m`,
      sub: '额定起升 12 m',
      stateText: '正常',
      status: 'normal'
    },
    {
      key: 'travel',
      label: '运行行程',
      value: `大${bridgePos} m · 小${trolleyPos} m`,
      sub: `行程 ${bridgeTravel} / ${trolleyTravel} m`,
      stateText: '正常',
      status: 'normal'
    },
    {
      key: 'amplitude',
      label: '幅度',
      value: `${amplitude} m`,
      sub: '限值 20.0 m',
      stateText: '正常',
      status: 'normal'
    },
    {
      key: 'skew',
      label: '大车运行偏斜',
      value: skewAlarm?.currentValue ?? '6.4 mm',
      sub: `限值 ${skewAlarm?.limitValue ?? '10 mm'}`,
      stateText: skewAlarm ? '告警' : '正常',
      status: skewAlarm ? 'alarm' : 'normal',
      relatedAlarmId: skewAlarm?.id
    },
    {
      key: 'wind',
      label: '风速',
      value: windHistory?.status === 'pending' ? windHistory.currentValue : '8.6 m/s',
      sub: `限值 ${windHistory?.limitValue ?? '10.8 m/s'}`,
      stateText: windHistory?.status === 'pending' ? '告警' : '正常',
      status: windHistory?.status === 'pending' ? 'alarm' : 'normal',
      relatedAlarmId: windHistory?.status === 'pending' ? windHistory.id : undefined
    },
    {
      key: 'rotation',
      label: '回转角度',
      value: `${rotation} °`,
      sub: '相对零位',
      stateText: '正常',
      status: 'normal'
    }
  ]
})

const statusAlarmCards = computed<RemoteRealtimeCard[]>(() => {
  const brakeHistory = mockAlarms.value.find(item => item.parameter === '起升机构制动器的开闭' && item.status === 'pending')
  const interlockAlarm = findPendingAlarm('联锁保护')
  const overspeedHistory = mockAlarms.value.find(item => item.parameter === '超速保护' && item.status === 'pending')

  return [
    {
      key: 'brake',
      label: '起升机构制动器的开闭',
      value: brakeHistory?.currentValue ?? '闭合',
      sub: brakeHistory?.desc ?? '反馈状态正常',
      stateText: brakeHistory ? '告警' : '正常',
      status: brakeHistory ? 'alarm' : 'normal',
      relatedAlarmId: brakeHistory?.id
    },
    {
      key: 'windproof',
      label: '抗风防滑',
      value: '正常',
      sub: '防风夹轨装置在线',
      stateText: '正常',
      status: 'normal'
    },
    {
      key: 'interlock',
      label: '联锁保护',
      value: interlockAlarm?.currentValue ?? '正常',
      sub: interlockAlarm?.desc ?? '机构联锁链路正常',
      stateText: interlockAlarm ? '告警' : '正常',
      status: interlockAlarm ? 'alarm' : 'normal',
      relatedAlarmId: interlockAlarm?.id
    },
    {
      key: 'door',
      label: '门限位',
      value: '正常',
      sub: '门限位开关闭合正常',
      stateText: '正常',
      status: 'normal'
    },
    {
      key: 'mechanism',
      label: '机构之间的运行联锁',
      value: '正常',
      sub: '主/副机构协同状态正常',
      stateText: '正常',
      status: 'normal'
    },
    {
      key: 'railSafety',
      label: '同一或不同一轨道运行机构安全信号',
      value: '正常',
      sub: '轨道安全信号反馈正常',
      stateText: '正常',
      status: 'normal'
    },
    {
      key: 'cableReel',
      label: '供电电缆卷筒',
      value: '正常',
      sub: '收放状态稳定',
      stateText: '正常',
      status: 'normal'
    },
    {
      key: 'overspeed',
      label: '超速保护',
      value: overspeedHistory?.currentValue ?? '正常',
      sub: overspeedHistory?.desc ?? '速度反馈处于可控区间',
      stateText: overspeedHistory ? '告警' : '正常',
      status: overspeedHistory ? 'alarm' : 'normal',
      relatedAlarmId: overspeedHistory?.id
    }
  ]
})

function handleLiveCardClick(card: RemoteRealtimeCard) {
  if (card.status !== 'alarm') return
  selectedLiveAlertCard.value = card
  liveAlertDialogVisible.value = true
}

function updateAlertByAction(action: 'resolved' | 'ignored') {
  const alarmId = selectedLiveAlertCard.value?.relatedAlarmId
  if (!alarmId) {
    liveAlertDialogVisible.value = false
    return
  }
  const alarm = mockAlarms.value.find(item => item.id === alarmId)
  if (!alarm) {
    liveAlertDialogVisible.value = false
    return
  }
  alarm.status = 'resolved'
  alarm.handler = '当前用户'
  alarm.currentState = action === 'resolved' ? '已处理' : '已忽略'
  alarm.conclusion = action === 'resolved' ? '已完成现场处理并转入历史记录' : '已忽略本次告警并转入历史记录'
  const d = new Date()
  alarm.resolveTime = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  liveAlertDialogVisible.value = false
  selectedLiveAlertCard.value = null
}

function resolveLiveAlert() {
  updateAlertByAction('resolved')
}

function ignoreLiveAlert() {
  updateAlertByAction('ignored')
}

function handleExpandChange(row: RemoteAlarmRecord, expandedRows: RemoteAlarmRecord[]) {
  const isExpanded = expandedRows.some(r => r.id === row.id)
  if (isExpanded) {
    activeAlarmId.value = row.id
  } else {
    if (activeAlarmId.value === row.id) {
      activeAlarmId.value = ''
    }
  }
}

function tableRowClassName({ row }: { row: RemoteAlarmRecord }) {
  return `rm-table-row-${row.level}`
}

function resolveAlarm(alarm: RemoteAlarmRecord) {
  alarm.status = 'resolved'
  alarm.handler = '当前用户'
  alarm.currentState = '已处置'
  alarm.conclusion = alarm.conclusion || '已确认告警并转入历史记录'
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

watch(alarmFilter, () => {
  activeAlarmId.value = ''
})

watch(() => store.activeService, (newVal) => {
  if (newVal === 'remote') {
    // 每次打开面板，默认重置为待处理列表并清空选中状态
    remotePanelMode.value = 'live'
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
  height: calc(100% - 50px - 70px); /* 留出顶部信息栏和底部服务菜单的高度 */
  background: rgba(248, 250, 252, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(22, 119, 255, 0.2);
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  z-index: 100;
  animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  margin-bottom: 70px; /* 让出底部 ServiceMenu 的空间 */
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
  padding: 0;
  background: transparent;
}

.rm-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.rm-live-pane {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-card-bg);
  border-top: 1px solid var(--color-card-border);
  border-bottom: 1px solid var(--color-card-border);
  overflow: hidden;
}

.rm-live-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  overflow: auto;
}

.rm-live-divider {
  width: 1px;
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.36), rgba(148, 163, 184, 0.12));
  border-radius: 999px;
}

.rm-live-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rm-live-column-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.rm-live-column-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.rm-live-column-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}

.rm-live-card-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.rm-live-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-subtle);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.rm-live-card--alarm {
  border-color: rgba(255, 77, 79, 0.35);
  box-shadow: 0 4px 14px rgba(255, 77, 79, 0.1);
}

.rm-live-card.is-clickable {
  cursor: pointer;
}

.rm-live-card.is-clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 77, 79, 0.14);
}

.rm-live-card-top,
.rm-live-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.rm-live-card-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.rm-live-card-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text-primary);
}

.rm-live-card-value--status {
  font-size: 18px;
}

.rm-live-card-sub {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.rm-live-indicator {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rm-live-indicator--normal {
  background: #22c55e;
  box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
}

.rm-live-indicator--alert {
  background: transparent;
  box-shadow: none;
  animation: rm-blink 0.9s infinite ease-in-out;
}

.rm-live-indicator-svg {
  width: 30px;
  height: 30px;
  stroke: #ff3b30;
  fill: rgba(255, 59, 48, 0.22);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 4px rgba(255, 59, 48, 0.5));
}

@keyframes rm-blink {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    filter: drop-shadow(0 0 8px rgba(255, 59, 48, 0.6));
  }
  50% {
    opacity: 0.72;
    transform: scale(1.15);
    filter: drop-shadow(0 0 14px rgba(255, 59, 48, 0.95));
  }
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
  padding: 8px 12px;
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

.rm-pane-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rm-mode-switch {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.rm-mode-switch-btn {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
}

.rm-mode-switch-btn.active {
  background: #fff;
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.rm-history-pane {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.rm-history-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 0;
}

.rm-alarms-list {
  flex: 1;
  min-height: 0;
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
  font-size: 14px;
}

:deep(.el-table th.el-table__cell) {
  background-color: var(--el-table-header-bg-color);
  color: var(--color-text-secondary);
  font-weight: 600;
}

:deep(.el-table th.el-table__cell .cell) {
  font-size: 14px;
}

:deep(.el-table .el-table__body .cell) {
  font-size: 14px;
  line-height: 1.45;
}

:deep(.el-radio-button__inner) {
  font-size: 13px;
}

:deep(.el-button) {
  font-size: 13px;
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
  font-size: 14px;
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
  font-size: 15px;
  padding: 40px;
}

.rm-alert-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 6px;
}

.rm-alert-dialog-row {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.rm-alert-dialog-label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.rm-alert-dialog-value {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.rm-alert-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1280px) {
  .rm-live-grid,
  .rm-live-card-list {
    grid-template-columns: 1fr;
  }

  .rm-live-divider {
    display: none;
  }

  .rm-pane-header {
    align-items: flex-start;
  }

  .rm-pane-header-left,
  .rm-pane-header-right,
  .rm-history-toolbar {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
