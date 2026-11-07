<template>
  <div class="pd-lower-inner">
    <header class="pd-lower-hd">
      <h2>
        <span>{{ point.name }}</span>
        <span class="pd-badge" :class="result">{{ TONE_LABEL[result] }}</span>
        <span>· {{ serviceName }}</span>
        <template v-if="focusing">
          <span class="pd-focus-tag">{{ focusLabel }}</span>
          <span>· 告警聚焦</span>
        </template>
      </h2>
      <span class="pd-kind">服务 · 结果 + 对应数据</span>
      <span class="pd-meta">范围：{{ scope }}</span>
      <span class="pd-meta">更新时间：2026-11-06 11:20（Asia/Shanghai）</span>
      <span class="pd-meta">下区仅随服务 · {{ focusNote }}</span>
    </header>
    <div class="pd-lower-bd">
      <div v-if="canFocus" class="pd-focus-bar">
        <span class="pd-meta">{{ focusLabel }}</span>
        <span class="pd-meta">结果时间：{{ timeText }}</span>
        <span class="pd-meta">关联报警：{{ linkText }}</span>
        <span class="pd-meta">关联数据类：已使用</span>
        <button v-if="result === 'alarm'" type="button" class="pd-btn pd-btn-danger" :disabled="confirmed" @click="ackOpen = true">{{ confirmed ? '报警已确认' : '确认报警' }}</button>
        <span v-else class="pd-meta">异常关注 · 无需确认报警</span>
        <button type="button" class="pd-btn" :class="focusing ? 'pd-btn-primary' : 'pd-btn-ghost'" @click="$emit('toggle')">{{ focusing ? '查看全部' : '仅看告警相关' }}</button>
        <span class="pd-meta">{{ focusing ? '默认只留触发相关' : '已展开完整视图 · 切走再进仍回聚焦' }}</span>
      </div>

      <div v-if="unavailable" class="pd-empty">
        <strong>{{ emptyTitle }}</strong>
        <p>{{ emptyDesc }}</p>
      </div>

      <template v-else-if="service === 'remote'">
        <div v-if="!remoteBlocks.length" class="pd-empty"><strong>远程监测暂无可展示数据</strong><p>当前点位未关联监测数据。</p></div>
        <div v-else class="pd-stack">
          <article v-for="block in remoteBlocks" :key="block.key" class="pd-remote" :class="{ 'is-dim': !block.open }">
            <div class="pd-remote-hd">
              <h3>{{ block.name }}</h3>
              <span v-if="block.key === 'safety'" class="pd-tag" :class="focusing ? 'is-warn' : 'is-ok'">{{ focusing ? '仅超限 / 异常' : '整机参数' }}</span>
              <span v-else-if="block.key === 'health'" class="pd-tag" :class="focusing ? 'is-warn' : 'is-ok'">{{ focusing ? '仅越阈通道' : '当前点时序' }}</span>
              <span v-else class="pd-tag is-muted">{{ block.open ? '已展开' : '折叠' }}</span>
              <button v-if="!block.primary && !focusing" type="button" class="pd-btn pd-btn-ghost" @click="toggleRemote(block.key)">{{ block.open ? '收起' : '展开此类' }}</button>
            </div>
            <div v-if="block.open" class="pd-remote-bd">
              <SafetyBoard v-if="block.key === 'safety'" :mode="focusing ? 'focus' : safetyFull ? 'full' : 'summary'" @expand="safetyFull = true" @collapse="safetyFull = false" />
              <HealthBoard v-else-if="block.key === 'health'" :point="point" :kind="kind" :focus="focusing" :theme="theme" />
              <RiskBoard v-else-if="block.key === 'risk'" :point="point" :scope="scope" :focus="false" :theme="theme" />
              <InspectBoard v-else-if="block.key === 'inspect'" :point="point" />
              <PatrolBoard v-else :point="point" :kind="kind" />
            </div>
            <p v-else class="pd-remote-bd pd-meta">已有记录。点「展开此类」在本服务内查看。</p>
          </article>
        </div>
      </template>

      <template v-else>
        <section v-if="monitor" class="pd-block">
          <div class="pd-block-hd">
            <h3>{{ monitor.title }}</h3>
            <span class="pd-tag is-ok">监测数据</span>
            <span class="pd-meta">本服务关联数据</span>
          </div>
          <div class="pd-block-bd">
            <HealthBoard v-if="monitor.health" :point="point" :kind="kind" :focus="focusing" :theme="theme" />
            <SafetyBoard v-else mode="full" />
          </div>
        </section>
        <section class="pd-block">
          <div class="pd-block-hd is-result">
            <h3>{{ serviceName }} · 结果</h3>
            <span class="pd-tag is-main">结果</span>
          </div>
          <div class="pd-block-bd">
            <p v-if="svc.state === 'partial'" class="pd-note">{{ svc.reason }}。以下为已有内容。</p>
            <AssessResult v-if="service === 'assess'" :point="point" :peers="peers" :kind="kind" :scope="scope" :focus="focusing" :theme="theme" />
            <CrackResult v-else-if="service === 'crack'" :point="point" :peers="peers" :scope="scope" :focus="focusing" :theme="theme" />
            <FaultResult v-else-if="service === 'fault'" :point="point" :kind="kind" :focus="focusing" :theme="theme" @bearing="bearingOpen = true" />
            <SafetyEvalResult v-else :point="point" :kind="kind" :scope="scope" :focus="focusing" :theme="theme" />
          </div>
        </section>
      </template>
    </div>

    <el-dialog v-model="ackOpen" title="确认报警" width="440px" append-to-body>
      <p class="pd-dialog-copy">将记录确认人与确认时间，并关闭本条报警的待处理状态。此操作为确认，不会删除历史记录，也不会停用报警规则。</p>
      <template #footer>
        <el-button @click="ackOpen = false">取消</el-button>
        <el-button type="danger" @click="confirmAck">确认报警</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="bearingOpen" title="轴承寿命预测" width="480px" append-to-body>
      <dl class="pd-facts">
        <div><dt>故障时刻</dt><dd>2026-11-06 10:02</dd></div>
        <div><dt>回取窗口</dt><dd>向前 14 天有效值</dd></div>
        <div><dt>剩余寿命</dt><dd>860 h</dd></div>
        <div><dt>阶段</dt><dd>B 早期</dd></div>
        <div><dt>区间</dt><dd>待接入</dd></div>
      </dl>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { ElMessage } from 'element-plus'
import ServiceEChart from '@/components/ServiceEChart.vue'
import {
  DATA_DEFS, SAFETY_PARAMS, SAFETY_STATUSES, SVC_DEFS, TONE_LABEL,
  alarmLink, hashSeed, resultTime, simSeries, trendOption,
  type DataKey, type DetailPoint, type SvcKey, type TrendSpec
} from '@/mock/pointDetailV3'
const props = defineProps<{
  point: DetailPoint
  peers: DetailPoint[]
  kind: '结构' | '机构'
  scope: string
  service: SvcKey
  expanded: boolean
  confirmed: boolean
}>()
const emit = defineEmits<{ toggle: []; confirm: [] }>()

const ackOpen = ref(false)
const bearingOpen = ref(false)
const safetyFull = ref(false)
const remoteOpen = ref<Partial<Record<DataKey, boolean>>>({})
const assessTab = ref<'fatigue' | 'damage'>('fatigue')

watch(() => [props.point.id, props.service], () => {
  safetyFull.value = false
  remoteOpen.value = {}
  assessTab.value = 'fatigue'
})

const svc = computed(() => props.point.services[props.service])
const result = computed(() => svc.value.result)
const serviceName = computed(() => SVC_DEFS.find(item => item.key === props.service)?.name || '')
const canFocus = computed(() => result.value === 'alarm' || result.value === 'warn')
const focusing = computed(() => canFocus.value && !props.expanded)
const focusLabel = computed(() => result.value === 'alarm' ? '报警证据' : '关注证据')
const focusNote = computed(() => canFocus.value ? (props.expanded ? '已展开全部' : '告警聚焦') : '完整视图')
const timeText = computed(() => resultTime(props.service, result.value))
const linkText = computed(() => alarmLink(props.point, props.service))
const unavailable = computed(() => svc.value.state === 'off' || result.value === 'na')
const emptyTitle = computed(() => {
  if (props.service === 'fault' && props.kind === '结构') return '该结构点位暂未配置故障诊断模型'
  if (props.service === 'crack' && props.kind === '机构') return '裂纹预测不适用'
  return `${serviceName.value}暂不可用`
})
const emptyDesc = computed(() => svc.value.reason || '当前点位未配置该项服务。')

const theme = computed(() => {
  const read = (name: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  }
  return {
    muted: read('--color-text-muted', '#94a3b8'),
    border: read('--color-border', '#e8edf3'),
    danger: read('--color-danger', '#f5222d'),
    warning: read('--color-warning', '#fa8c16'),
    primary: read('--color-primary', '#1677ff'),
    success: read('--color-success', '#52c41a')
  }
})

const remoteBlocks = computed(() => {
  const linked = DATA_DEFS.filter(item => props.point.data.includes(item.key))
  const primary = linked.filter(item => item.key === 'safety' || item.key === 'health')
  const rest = linked.filter(item => item.key !== 'safety' && item.key !== 'health')
  const list = focusing.value ? primary : [...primary, ...rest]
  return list.map(item => {
    const isPrimary = item.key === 'safety' || item.key === 'health'
    return { ...item, primary: isPrimary, open: focusing.value || isPrimary || !!remoteOpen.value[item.key] }
  })
})

function toggleRemote(key: DataKey) {
  remoteOpen.value = { ...remoteOpen.value, [key]: !remoteOpen.value[key] }
}

const monitor = computed(() => {
  if (props.service === 'remote' || unavailable.value) return null
  if (props.service === 'safetyEval') {
    if (props.point.data.includes('risk')) return null
    if (props.point.data.includes('health')) return { title: focusing.value ? '健康监测数据 · 触发时段' : '健康监测数据', health: true }
    return null
  }
  if (props.point.data.includes('health')) return { title: focusing.value ? '健康监测数据 · 触发时段' : '健康监测数据', health: true }
  if (props.point.data.includes('safety')) return { title: '安全监控数据', health: false }
  return null
})

function confirmAck() {
  ackOpen.value = false
  emit('confirm')
}

function optionOf(spec: TrendSpec) {
  return trendOption(spec, theme.value)
}

const SafetyBoard = defineComponent({
  name: 'SafetyBoard',
  props: { mode: { type: String as PropType<'full' | 'summary' | 'focus'>, required: true } },
  emits: ['expand', 'collapse'],
  setup(boardProps, { emit: boardEmit }) {
    const params = computed(() => {
      if (boardProps.mode === 'focus') return SAFETY_PARAMS.filter(item => item.level !== 'ok')
      if (boardProps.mode === 'summary') return SAFETY_PARAMS.slice(0, 6)
      return SAFETY_PARAMS
    })
    const statuses = computed(() => boardProps.mode === 'focus' ? SAFETY_STATUSES.filter(item => item.level !== 'ok') : SAFETY_STATUSES)
    return () => h('div', { class: 'pd-safety' }, [
      boardProps.mode === 'full' ? h('div', { class: 'pd-cycle' }, [
        h('span', '工作日期'),
        h('span', { class: 'pd-chip' }, '2026-11-06'),
        h('span', '工作循环'),
        h('span', { class: 'pd-chip' }, '循环 #1284 · 09:12–09:41'),
        h('span', { class: 'pd-meta' }, '整机工况 · 不按点位裁剪'),
        h('span', { class: 'pd-meta' }, '依据 GB/T 28264—2017')
      ]) : null,
      h('h3', { class: 'pd-subhead' }, boardProps.mode === 'focus' ? '参数监控 · 仅超限项' : '参数监控 · 整机多参数'),
      params.value.length
        ? h('div', { class: boardProps.mode === 'summary' ? 'pd-cards is-summary' : 'pd-cards' }, params.value.map(item => h('div', { class: ['pd-param', item.level !== 'ok' ? `is-${item.level}` : ''] }, [
          h('div', { class: 'k' }, item.name),
          h('div', { class: 'v' }, [item.value, item.unit ? h('span', { class: 'u' }, ` ${item.unit}`) : null])
        ])))
        : h('p', { class: 'pd-meta' }, '暂无超限参数。可点「查看全部」看完整安全监控。'),
      boardProps.mode === 'summary' ? null : h('h3', { class: 'pd-subhead' }, boardProps.mode === 'focus' ? '状态监控 · 仅异常项' : '状态监控'),
      boardProps.mode === 'summary' ? null : (statuses.value.length
        ? h('div', { class: 'pd-status-grid' }, statuses.value.map(item => h('div', { class: 'pd-status-row' }, [
          h('i', { class: ['dot', item.level] }),
          h('span', { class: 'nm' }, item.name),
          h('span', { class: ['st', item.level] }, item.label)
        ])))
        : h('p', { class: 'pd-meta' }, '暂无异常状态。可点「查看全部」看完整状态。')),
      boardProps.mode === 'summary' ? h('div', { class: 'pd-inline' }, [
        h('button', { type: 'button', class: 'pd-btn pd-btn-ghost', onClick: () => boardEmit('expand') }, '展开完整安全监控'),
        h('span', { class: 'pd-meta' }, '摘要 6 项 · 完整含参数卡与状态')
      ]) : null,
      boardProps.mode === 'full' ? h('div', { class: 'pd-inline' }, [
        h('button', { type: 'button', class: 'pd-btn pd-btn-ghost', onClick: () => boardEmit('collapse') }, '收起为摘要')
      ]) : null
    ])
  }
})

const HealthBoard = defineComponent({
  name: 'HealthBoard',
  props: {
    point: { type: Object as PropType<DetailPoint>, required: true },
    kind: { type: String as PropType<'结构' | '机构'>, required: true },
    focus: { type: Boolean, required: true },
    theme: { type: Object as PropType<{ muted: string; border: string; danger: string; warning: string; primary: string; success: string }>, required: true }
  },
  setup(boardProps) {
    return () => {
      const point = boardProps.point
      const alarmAt = point.status === 'alarm' || point.status === 'warn' ? 16 : null
      if (point.multi) {
        if (boardProps.focus) {
          return h('div', [
            cards([['当前点', point.name], ['越阈通道', '振动 · 关注'], ['振动速度', `${point.vib} mm/s`], ['阈值', '异常 4.5 / 危险 7.1']]),
            chart('振动 mm/s · 触发时段', optionOf({
              name: '振动',
              values: simSeries(4 + hashSeed(point.id), 24, 3.2, 1.1, 1.2),
              color: boardProps.theme.danger,
              alarmAt: 16,
              thresholds: [{ value: 4.5, label: '异常', color: boardProps.theme.warning }, { value: 7.1, label: '危险', color: boardProps.theme.danger }]
            }))
          ])
        }
        return h('div', [
          cards([['当前点', point.name], ['温度', `${point.temp} ℃`], ['声音', `${point.sound} dB`], ['振动', `${point.vib} mm/s`]]),
          h('div', { class: 'pd-charts pd-charts-3' }, [
            chart('温度 ℃', optionOf({ name: '温度', values: simSeries(1, 24, point.temp, 2), color: boardProps.theme.warning })),
            chart('声音 dB', optionOf({ name: '声音', values: simSeries(3, 24, point.sound, 4), color: boardProps.theme.primary })),
            chart('振动 mm/s', optionOf({ name: '振动', values: simSeries(4, 24, point.vib, 0.4), color: boardProps.theme.success }))
          ]),
          table(['点位序号', '名称', '参量', '数值', '单位', '时间'], [
            [point.id, point.name, '温度', String(point.temp), '℃', '11:20:04', false],
            [point.id, point.name, '声音', String(point.sound), 'dB', '11:20:04', false],
            [point.id, point.name, '振动', String(point.vib), 'mm/s', '11:20:04', true]
          ])
        ])
      }
      if (boardProps.kind === '机构') {
        return h('div', [
          cards([
            ['当前点', point.name],
            ['振动烈度', `${point.vib} mm/s`],
            ['峭度', String(point.kurtosis)],
            ['温度', `${point.temp} ℃`]
          ]),
          boardProps.focus
            ? chart('振动烈度 · 触发时段', optionOf({
              name: '振动烈度',
              values: simSeries(9 + hashSeed(point.id), 24, point.vib, 0.6, 0.4),
              color: boardProps.theme.warning,
              alarmAt: 16,
              thresholds: [{ value: 4.5, label: '异常', color: boardProps.theme.warning }, { value: 7.1, label: '危险', color: boardProps.theme.danger }]
            }))
            : h('div', { class: 'pd-charts' }, [
              chart('振动时序 · 当前点', optionOf({ name: '振动', values: simSeries(9, 40, point.vib, 0.5), color: boardProps.theme.primary, alarmAt })),
              chart('温度时序 · 当前点', optionOf({ name: '温度', values: simSeries(5, 24, point.temp, 3), color: boardProps.theme.warning }))
            ])
        ])
      }
      const stressRow: Row = [point.id, point.name, '应力', point.stress.toFixed(1), point.stress.toFixed(1), 'MPa', point.status === 'ok' ? '正常' : '关注', true]
      if (boardProps.focus) {
        return h('div', [
          table(['点位序号', '名称', '参数', '触发值', '当前值', '单位', '状态'], [stressRow]),
          chart('应力时序 · 触发时段', optionOf({
            name: '应力',
            values: simSeries(11 + hashSeed(point.id), 24, Math.min(point.stress, 160), 18, 12),
            color: boardProps.theme.danger,
            alarmAt: 16
          })),
          h('p', { class: 'pd-meta' }, '应变等正常通道已折叠。')
        ])
      }
      return h('div', [
        point.status === 'offline' ? h('p', { class: 'pd-note' }, '历史有数据，当前采集中断。') : null,
        table(['点位序号', '名称', '点位类型', '参数', '数值', '单位', '时间'], [
          [point.id, point.name, '实测点', '应力', point.stress.toFixed(1), 'MPa', '11:20:04'],
          [point.id, point.name, '实测点', '应变', String(Math.round(point.strain)), 'με', '11:20:04']
        ]),
        h('div', { class: 'pd-charts' }, [
          chart('应力时序 · 当前点', optionOf({ name: '应力', values: simSeries(11 + hashSeed(point.id), 24, Math.min(point.stress, 160), 18, 12), color: boardProps.theme.danger, alarmAt })),
          chart('应变时序 · 当前点', optionOf({ name: '应变', values: simSeries(12 + hashSeed(point.id), 24, point.strain * 0.35, 40), color: boardProps.theme.primary }))
        ])
      ])
    }
  }
})

const RiskBoard = defineComponent({
  name: 'RiskBoard',
  props: {
    point: { type: Object as PropType<DetailPoint>, required: true },
    scope: { type: String, required: true },
    focus: { type: Boolean, required: true },
    theme: { type: Object as PropType<{ muted: string; border: string; danger: string; warning: string; primary: string; success: string }>, required: true }
  },
  setup(boardProps) {
    return () => h('div', [
      table(['对象范围', '风险项', '来源', '计算时间', '风险值 / 等级', '依据'], boardProps.focus
        ? [[`${boardProps.scope} / ${boardProps.point.name}`, '疲劳损伤超限风险', '风险定量模型 v0.3', '09:18:32', '0.72 / 高', '累积损伤度与载荷谱']]
        : [
          [`${boardProps.scope} / ${boardProps.point.name}`, '疲劳损伤超限风险', '风险定量模型 v0.3', '09:18:32', '0.72 / 高', '累积损伤度与载荷谱'],
          [`${boardProps.scope}（部件共享）`, '限载工况暴露', '风险定量模型 v0.3', '09:18:32', '0.41 / 中', '共享工况超载片段']
        ]),
      chart('风险趋势', optionOf({ name: '风险', values: simSeries(14, 24, 0.4, 0.12, 0.2), color: boardProps.theme.danger, alarmAt: 16 }))
    ])
  }
})

const InspectBoard = defineComponent({
  name: 'InspectBoard',
  props: { point: { type: Object as PropType<DetailPoint>, required: true } },
  setup(boardProps) {
    return () => table(['检测日期', '检测项目', '检测位置', '方法', '结论', '报告'], [
      ['2026-09-18', '超声波探伤', boardProps.point.name, 'UT', '发现线性显示 12 mm', '已归档'],
      ['2026-03-02', '磁粉检测', boardProps.point.name, 'MT', '合格', '已归档']
    ])
  }
})

const PatrolBoard = defineComponent({
  name: 'PatrolBoard',
  props: {
    point: { type: Object as PropType<DetailPoint>, required: true },
    kind: { type: String as PropType<'结构' | '机构'>, required: true }
  },
  setup(boardProps) {
    const gear = boardProps.kind === '机构'
    return () => table(['巡检时间', '巡检项', '检查结果', '异常描述', '人员', '处置状态'], [
      ['2026-11-05 16:40', gear ? '异响 / 温升' : '外观 / 涂层', '异常', gear ? '主动端轻微异响' : '涂层局部起皮，未见可见裂纹', '张工', '已记录'],
      ['2026-10-12 09:10', '现场观察', '正常', '—', '李工', '闭环']
    ])
  }
})

const AssessResult = defineComponent({
  name: 'AssessResult',
  props: {
    point: { type: Object as PropType<DetailPoint>, required: true },
    peers: { type: Array as PropType<DetailPoint[]>, required: true },
    kind: { type: String as PropType<'结构' | '机构'>, required: true },
    scope: { type: String, required: true },
    focus: { type: Boolean, required: true },
    theme: { type: Object as PropType<{ muted: string; border: string; danger: string; warning: string; primary: string; success: string }>, required: true }
  },
  setup(boardProps) {
    const tab = assessTab
    return () => {
      const point = boardProps.point
      const hot = point.services.assess.result
      if (boardProps.kind === '机构') {
        const lines = [
          { name: '振动烈度', values: simSeries(3 + hashSeed(point.id), 20, point.vib, 0.35), color: boardProps.theme.warning, lo: 4.5, hi: 7.1, unit: 'mm/s' }
        ]
        const extra = [
          { name: '峭度', values: simSeries(2, 20, point.kurtosis, 0.4), color: boardProps.theme.primary, lo: 4.5, hi: 6, unit: '' },
          { name: '有效值', values: simSeries(4, 20, point.rms, 0.5), color: boardProps.theme.success, lo: 3.5, hi: 5, unit: 'mm/s' }
        ]
        const shown = boardProps.focus ? lines : [...extra.slice(0, 1), ...lines, extra[1]]
        return h('div', [
          h('p', { class: 'pd-meta' }, boardProps.focus ? '时间范围钉在触发时段' : '时间起点 2026-11-06 09:00 · 时长 2 h · 设备、机构与点位沿用当前页'),
          h('div', { class: shown.length > 1 ? 'pd-charts pd-charts-3' : '' }, shown.map(item => chart(`${item.name}${item.unit ? ' ' + item.unit : ''}`, optionOf({
            name: item.name,
            values: item.values,
            color: item.color,
            alarmAt: item.name === '振动烈度' ? 15 : null,
            thresholds: [{ value: item.lo, label: '异常', color: boardProps.theme.warning }, { value: item.hi, label: '危险', color: boardProps.theme.danger }]
          })))),
          cards([
            ['振动烈度（触发）', `${point.vib} mm/s`],
            ...(boardProps.focus ? [] : [['峭度', String(point.kurtosis)], ['有效值', `${point.rms} mm/s`]] as [string, string][]),
            ['健康状态', TONE_LABEL[hot] || '正常']
          ]),
          h('p', { class: 'pd-meta' }, `结果范围：${boardProps.scope} · 当前点位贡献数据`)
        ])
      }
      const rows = assessRows(point, boardProps.peers, boardProps.focus)
      return h('div', [
        boardProps.focus ? null : h('div', { class: 'pd-tabs' }, [
          h('button', { type: 'button', class: ['pd-tab', tab.value === 'fatigue' ? 'is-on' : ''], onClick: () => { tab.value = 'fatigue' } }, '疲劳损伤'),
          h('button', { type: 'button', class: ['pd-tab', tab.value === 'damage' ? 'is-on' : ''], onClick: () => { tab.value = 'damage' } }, '损伤识别')
        ]),
        !boardProps.focus && tab.value === 'damage'
          ? h('div', [
            cards([['损伤状态', '关注'], ['损伤程度', '中'], ['声发射事件率', '12 /min'], ['维修建议', '加强巡检']]),
            h('div', { class: 'pd-charts' }, [
              chart('应变', optionOf({ name: '应变', values: simSeries(12, 24, 280, 40), color: boardProps.theme.primary })),
              chart('声发射计数', optionOf({ name: '声发射', values: simSeries(13, 24, 8, 4), color: boardProps.theme.warning }))
            ])
          ])
          : h('div', [
            cards([
              ['点位健康状态', TONE_LABEL[hot]],
              ['部件健康状态', hot === 'ok' ? '正常' : '关注'],
              ['累积损伤度（报警时刻）', point.damageAlarm.toFixed(2)],
              ['累积损伤度（当前值）', point.damageNow.toFixed(2)]
            ]),
            h('p', { class: 'pd-meta' }, `结果范围：${boardProps.scope}`),
            table(
              ['序号', '名称', '类型', '最大/最小应力幅', '平均应力', '累计工作时间', '应力谱系数', '已发生循环', '累积损伤度', '点位状态', '部件状态'],
              rows
            ),
            h('div', { class: 'pd-inline' }, [
              boardProps.focus ? null : h('button', { type: 'button', class: 'pd-btn pd-btn-ghost', onClick: () => sortToast(boardProps.peers) }, '查看部件排序'),
              h('button', { type: 'button', class: 'pd-btn pd-btn-ghost', onClick: () => ruleToast() }, '判定条件'),
              h('span', { class: 'pd-meta' }, `结果时间 ${timeText.value} · 关联报警：${linkText.value}`)
            ]),
            boardProps.focus
              ? chart('累积损伤度历程 · 触发量', optionOf({
                name: '累积损伤度',
                values: simSeries(16 + hashSeed(point.id), 20, Math.max(point.damageAlarm - 0.2, 0.2), 0.08, 0.25),
                color: boardProps.theme.danger,
                alarmAt: 16,
                thresholds: [{ value: 0.8, label: '报警线', color: boardProps.theme.danger }]
              }))
              : h('div', { class: 'pd-charts pd-charts-3' }, [
                chart('载荷谱', optionOf({ name: '载荷谱', values: simSeries(5, 20, 40, 8), color: boardProps.theme.success })),
                chart('应力幅 / 循环次数', optionOf({ name: '应力幅', values: simSeries(7, 20, point.stress * 0.7, 20), color: boardProps.theme.primary })),
                chart('累积损伤度历程', optionOf({
                  name: '累积损伤度',
                  values: simSeries(16, 20, Math.max(point.damageAlarm - 0.2, 0.2), 0.08, 0.25),
                  color: boardProps.theme.danger,
                  alarmAt: hot === 'alarm' ? 16 : null,
                  thresholds: [{ value: 0.8, label: '报警线', color: boardProps.theme.danger }]
                }))
              ])
          ])
      ])
    }
  }
})

const CrackResult = defineComponent({
  name: 'CrackResult',
  props: {
    point: { type: Object as PropType<DetailPoint>, required: true },
    peers: { type: Array as PropType<DetailPoint[]>, required: true },
    scope: { type: String, required: true },
    focus: { type: Boolean, required: true },
    theme: { type: Object as PropType<{ muted: string; border: string; danger: string; warning: string; primary: string; success: string }>, required: true }
  },
  setup(boardProps) {
    return () => {
      const point = boardProps.point
      const rows = (boardProps.focus ? [point] : boardProps.peers.filter(item => item.data.includes('health') || item.id === point.id))
        .filter((item, index, list) => list.findIndex(other => other.id === item.id) === index)
        .map(item => [item.id, item.name, '实测点', '0.18', '2.4e5', `${item.years} 年`, item.years < 1 ? '约 2027-08' : '两年以后'] as Row)
      return h('div', [
        cards([
          ['剩余损伤度', '0.18'],
          ['剩余循环次数', '2.4e5'],
          ['剩余年限', `${point.years} 年`],
          ['预测工况', '沿用近 12 个月载荷谱']
        ]),
        h('p', { class: 'pd-meta' }, '色标：不足 1 年标红；1 年至不足 2 年标橙。计算时间 09:18:32。'),
        table(['序号', '名称', '类型', '剩余损伤度', '剩余循环', '剩余年限', '预计裂纹萌生'], rows),
        boardProps.focus
          ? chart('剩余损伤度曲线', optionOf({ name: '剩余损伤度', values: simSeries(19, 20, 0.4, 0.05, -0.15), color: boardProps.theme.primary }))
          : h('div', { class: 'pd-charts' }, [
            chart('剩余循环次数曲线', optionOf({ name: '剩余循环', values: simSeries(18, 20, 6, 0.8, -2), color: boardProps.theme.primary })),
            chart('剩余损伤度曲线', optionOf({ name: '剩余损伤度', values: simSeries(19, 20, 0.4, 0.05, -0.15), color: boardProps.theme.primary }))
          ]),
        h('p', { class: 'pd-meta' }, `结果范围：${boardProps.scope}`)
      ])
    }
  }
})

const FaultResult = defineComponent({
  name: 'FaultResult',
  props: {
    point: { type: Object as PropType<DetailPoint>, required: true },
    kind: { type: String as PropType<'结构' | '机构'>, required: true },
    focus: { type: Boolean, required: true },
    theme: { type: Object as PropType<{ muted: string; border: string; danger: string; warning: string; primary: string; success: string }>, required: true }
  },
  emits: ['bearing'],
  setup(boardProps, { emit: boardEmit }) {
    return () => {
      const hot = boardProps.point.services.fault.result
      const names = boardProps.focus ? ['包络阶次谱', '阶次谱', '转速'] : ['时域', '角域', 'FFT 频谱', '阶次谱', '转速', '包络阶次谱']
      return h('div', [
        h('div', { class: 'pd-conclusion' }, [
          pair('故障部位', hot === 'ok' ? '—' : '主动轴轴承'),
          pair('类型', hot === 'ok' ? '未见异常' : hot === 'warn' ? '早期征兆' : '早期磨损'),
          pair('依据', hot === 'ok' ? '谱图未越线' : '包络阶次谱边频上升'),
          pair('结果时间', timeText.value),
          pair('关联报警', linkText.value)
        ]),
        h('div', { class: 'pd-inline' }, [
          h('span', { class: 'pd-meta' }, boardProps.focus ? '时长 10 s' : '开始时间 10:00 · 时长 10 s'),
          h('button', { type: 'button', class: 'pd-btn pd-btn-ghost', onClick: () => boardEmit('bearing') }, '轴承寿命预测')
        ]),
        h('div', { class: 'pd-charts pd-charts-3' }, names.map((name, index) => chart(name, optionOf({
          name,
          values: simSeries(20 + index + hashSeed(boardProps.point.id), 36, 2 + index, 1.4),
          color: name.includes('包络') && hot !== 'ok' ? boardProps.theme.danger : boardProps.theme.primary,
          alarmAt: name.includes('包络') && hot !== 'ok' ? 24 : null
        }))))
      ])
    }
  }
})

const SafetyEvalResult = defineComponent({
  name: 'SafetyEvalResult',
  props: {
    point: { type: Object as PropType<DetailPoint>, required: true },
    kind: { type: String as PropType<'结构' | '机构'>, required: true },
    scope: { type: String, required: true },
    focus: { type: Boolean, required: true },
    theme: { type: Object as PropType<{ muted: string; border: string; danger: string; warning: string; primary: string; success: string }>, required: true }
  },
  setup(boardProps) {
    return () => {
      const hasRisk = boardProps.point.data.includes('risk')
      const hot = boardProps.point.services.safetyEval.result
      const level = hot === 'alarm' ? '0.72 / 高' : hot === 'warn' ? '0.55 / 中' : '0.22 / 低'
      const history = boardProps.focus
        ? ['2026-11-06 09:18 · 风险升至 0.72 / 高（关联损伤超限）']
        : [
          '2026-11-06 09:18 · 风险升至 0.72 / 高（关联损伤超限）',
          '2026-10-21 14:02 · 风险 0.55 / 中',
          '2026-09-08 11:30 · 风险 0.38 / 中'
        ]
      return h('div', [
        cards([
          ['风险值 / 等级', hasRisk || hot !== 'ok' ? level : '待计算'],
          ['评估对象', `${boardProps.scope} / ${boardProps.point.name}`],
          ['主要风险项', hot === 'ok' ? '未见主要风险项' : boardProps.kind === '机构' ? '机构异常扩大' : '疲劳损伤超限'],
          ['关联报警', linkText.value]
        ]),
        h('div', { class: 'pd-note' }, `判定依据：风险定量模型 v0.3。范围：${boardProps.scope}。`),
        h('h3', { class: 'pd-subhead' }, boardProps.focus ? '历史变化 · 仅本次相关' : '历史变化'),
        h('ul', { class: 'pd-hist' }, history.map(item => h('li', item))),
        hasRisk ? null : h('p', { class: 'pd-meta' }, '无点位关联的整机结论请回部件页查看。'),
        hasRisk ? chart('风险变化', optionOf({ name: '风险', values: simSeries(14 + hashSeed(boardProps.point.id), 24, hot === 'ok' ? 0.2 : 0.45, 0.08, hot === 'ok' ? 0 : 0.2), color: boardProps.theme.danger, alarmAt: hot === 'ok' ? null : 16 })) : null
      ])
    }
  }
})

type Row = (string | boolean)[]

function cards(items: [string, string][]) {
  return h('div', { class: 'pd-cards' }, items.map(([k, v]) => h('div', { class: 'pd-param' }, [h('div', { class: 'k' }, k), h('div', { class: 'v' }, v)])))
}
function chart(title: string, option: ReturnType<typeof optionOf>) {
  return h('div', { class: 'pd-chart' }, [h('h3', title), h(ServiceEChart, { option })])
}
function table(heads: string[], rows: Row[]) {
  return h('div', { class: 'pd-table-wrap' }, [
    h('table', { class: 'pd-table' }, [
      h('thead', h('tr', heads.map(head => h('th', head)))),
      h('tbody', rows.map(row => h('tr', { class: row.includes(true) ? 'is-hl' : '' }, row.filter(cell => typeof cell !== 'boolean').map(cell => h('td', String(cell))))))
    ])
  ])
}
function pair(label: string, value: string) {
  return h('div', { class: 'blk' }, [h('b', label), h('span', value)])
}
function assessRows(point: DetailPoint, peers: DetailPoint[], focus: boolean): Row[] {
  const list = focus ? [point] : peers.filter(item => item.id === point.id || item.data.includes('health'))
  const unique = list.filter((item, index) => list.findIndex(other => other.id === item.id) === index)
  const ordered = [point, ...unique.filter(item => item.id !== point.id)]
  return ordered.map(item => {
    const hot = item.services.assess.result
    return [
      item.id,
      item.name,
      '实测点',
      `${Math.round(item.stress)} / ${Math.round(item.stress * 0.22)} MPa`,
      `${Math.round(item.stress * 0.52)} MPa`,
      '12840 h',
      '0.31',
      '1.26e6',
      item.damageAlarm.toFixed(2),
      TONE_LABEL[hot],
      hot === 'ok' ? '正常' : '关注',
      item.id === point.id
    ]
  })
}
function sortToast(peers: DetailPoint[]) {
  const names = [...peers].sort((a, b) => b.damageAlarm - a.damageAlarm).slice(0, 3).map(item => item.name)
  ElMessage.info(`部件健康状态排序：${names.join(' > ')}`)
}
function ruleToast() {
  ElMessage.info('判定条件：累积损伤度达到 0.8 记为报警')
}
</script>
