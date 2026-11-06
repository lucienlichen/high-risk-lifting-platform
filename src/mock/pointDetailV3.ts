import type { EChartsOption } from 'echarts'
import type { Point, PointStatus } from '@/mock/partsPoint'
import { parseReading } from '@/mock/pointTrend'

export type DataKey = 'safety' | 'health' | 'risk' | 'inspect' | 'patrol'
export type SvcKey = 'remote' | 'assess' | 'crack' | 'fault' | 'safetyEval'
export type PointTone = 'alarm' | 'warn' | 'ok' | 'offline'
export type SvcResult = 'alarm' | 'warn' | 'ok' | 'na'
export type SvcAvail = 'on' | 'off' | 'partial'

export interface SvcState {
  state: SvcAvail
  result: SvcResult
  hint?: string
  reason?: string
}

export interface DetailPoint {
  id: string
  name: string
  status: PointTone
  x: number
  y: number
  lx?: number
  ly?: number
  order: number
  data: DataKey[]
  services: Record<SvcKey, SvcState>
  multi?: boolean
  stress: number
  strain: number
  damageAlarm: number
  damageNow: number
  years: number
  vib: number
  kurtosis: number
  rms: number
  temp: number
  sound: number
}

export interface TwinMark {
  id: string
  name: string
  x: number
  y: number
  lx?: number
  ly?: number
}

export interface PointWorkspace {
  partName: string
  kind: '结构' | '机构'
  modelTitle: string
  scope: string
  schematic: 'girder' | 'gear' | 'generic'
  points: DetailPoint[]
  twins: TwinMark[]
}

export const DATA_DEFS: { key: DataKey; name: string; short: string; hint: string }[] = [
  { key: 'safety', name: '安全监控数据', short: '安全监控', hint: '工况与运行安全量' },
  { key: 'health', name: '健康监测数据', short: '健康监测', hint: '应力、应变与声振状态量' },
  { key: 'risk', name: '风险监测数据', short: '风险监测', hint: '风险定量结果及关联量' },
  { key: 'inspect', name: '检验检测数据', short: '检验检测', hint: '检测结论与缺陷记录' },
  { key: 'patrol', name: '日常点巡检数据', short: '日常点巡检', hint: '现场观察与处置' }
]

export const SVC_DEFS: { key: SvcKey; name: string; hint: string }[] = [
  { key: 'remote', name: '远程监测', hint: '监测数据同屏：曲线与最新表' },
  { key: 'assess', name: '健康评估', hint: '损伤度与健康状态' },
  { key: 'crack', name: '裂纹预测', hint: '剩余损伤度、循环次数与年限' },
  { key: 'fault', name: '故障诊断', hint: '谱图与诊断结论' },
  { key: 'safetyEval', name: '安全评估', hint: '风险等级与主要风险项' }
]

export const TONE_LABEL: Record<PointTone | SvcResult, string> = {
  alarm: '报警',
  warn: '异常',
  ok: '正常',
  offline: '离线',
  na: '不适用'
}

export interface SafetyParam {
  name: string
  value: string
  unit: string
  sub: string
  level: 'ok' | 'warn' | 'danger'
}

export const SAFETY_PARAMS: SafetyParam[] = [
  { name: '起重量', value: '16.0', unit: 't', sub: '额定 50 t', level: 'ok' },
  { name: '起重力矩', value: '28', unit: '%', sub: '相对额定力矩', level: 'ok' },
  { name: '起升高度 / 下降深度', value: '6.8 / 0.0', unit: 'm', sub: '额定起升高度 12 m', level: 'ok' },
  { name: '运行行程', value: '大 42.1 · 小 19.2', unit: 'm', sub: '大车 80 m / 小车 28 m', level: 'ok' },
  { name: '幅度', value: '—', unit: '', sub: '无幅变机构', level: 'ok' },
  { name: '大车运行偏斜', value: '11.2', unit: 'mm', sub: '限值 10 mm · 超限', level: 'warn' },
  { name: '风速', value: '0.3', unit: 'm/s', sub: '限值 10.8 m/s', level: 'ok' },
  { name: '回转角度', value: '—', unit: '', sub: '无回转机构', level: 'ok' },
  { name: '操作指令', value: '联动', unit: '', sub: '起升↑ · 大车→ · 小车←', level: 'ok' },
  { name: '工作时间', value: '186', unit: 'min', sub: '当班累计', level: 'ok' },
  { name: '累计工作时间', value: '12840', unit: 'h', sub: '整机累计', level: 'ok' },
  { name: '工作循环', value: '1284', unit: '次', sub: '本日 6 次', level: 'ok' }
]

export const SAFETY_STATUSES: { name: string; level: 'ok' | 'warn' | 'danger'; label: string }[] = [
  { name: '起升机构制动器的开闭', level: 'ok', label: '闭合' },
  { name: '抗风防滑', level: 'ok', label: '正常' },
  { name: '联锁保护', level: 'ok', label: '正常' },
  { name: '门限位', level: 'ok', label: '正常' },
  { name: '机构之间的运行联锁', level: 'ok', label: '正常' },
  { name: '同一或不同一轨道运行机构安全信号', level: 'ok', label: '正常' },
  { name: '供电电缆卷筒', level: 'warn', label: '异常' },
  { name: '超速保护', level: 'ok', label: '正常' }
]

const SVC_KEYS: SvcKey[] = ['remote', 'assess', 'crack', 'fault', 'safetyEval']

function on(result: SvcResult, hint?: string): SvcState {
  return { state: 'on', result, hint }
}
function off(reason: string): SvcState {
  return { state: 'off', result: 'na', reason }
}
function partial(result: SvcResult, reason: string): SvcState {
  return { state: 'partial', result, reason }
}

function metrics(over: Partial<DetailPoint> & Pick<DetailPoint, 'id' | 'name' | 'status' | 'x' | 'y' | 'order' | 'data' | 'services'>): DetailPoint {
  return {
    lx: 0,
    ly: -16,
    stress: 142,
    strain: 710,
    damageAlarm: 0.31,
    damageNow: 0.32,
    years: 4.6,
    vib: 1.8,
    kurtosis: 3.1,
    rms: 2.1,
    temp: 42,
    sound: 68,
    ...over
  }
}

const STRUCTURE_FAULT = off('该结构点位暂未配置故障诊断模型')
const NO_RISK = off('缺少风险监测数据')
const NO_CRACK_GEAR = off('不适用于当前机构测点')

function girderCatalog(): PointWorkspace {
  return {
    partName: '单双主梁',
    kind: '结构',
    modelTitle: '结构模型',
    scope: '单双主梁',
    schematic: 'girder',
    twins: [
      { id: 'TW-01', name: '孪生-跨中应力核', x: 348, y: 132, lx: 52, ly: 18 },
      { id: 'TW-02', name: '孪生-1/4跨应力', x: 232, y: 132, lx: -52, ly: 18 }
    ],
    points: [
      metrics({
        id: 'ML-01', name: '跨中上翼缘', status: 'alarm', x: 308, y: 76, lx: 0, ly: -18, order: 1,
        data: ['safety', 'health'],
        stress: 186.4, strain: 892, damageAlarm: 0.82, damageNow: 0.83, years: 0.8,
        services: {
          remote: on('ok', '监测量正常，点位报警来自健康评估'),
          assess: on('alarm', '累积损伤度超限 · 2026-11-06 09:18'),
          crack: on('warn', '剩余年限 0.8 年'),
          fault: STRUCTURE_FAULT,
          safetyEval: NO_RISK
        }
      }),
      metrics({
        id: 'ML-02', name: '跨中下翼缘', status: 'alarm', x: 308, y: 180, lx: 0, ly: 22, order: 2,
        data: ['safety', 'health', 'risk', 'inspect'],
        stress: 172, strain: 710, damageAlarm: 0.8, damageNow: 0.81, years: 1.1, vib: 2.4,
        services: {
          remote: on('warn', '大车偏斜超限 · 供电电缆卷筒异常'),
          assess: on('alarm', '累积损伤度超限'),
          crack: on('warn', '剩余年限 1.1 年'),
          fault: STRUCTURE_FAULT,
          safetyEval: on('alarm', '疲劳损伤超限风险 0.72')
        }
      }),
      metrics({
        id: 'ML-03', name: '1/4跨上翼缘', status: 'warn', x: 188, y: 76, lx: 0, ly: -18, order: 3,
        data: ['safety', 'health'],
        stress: 154, strain: 640, damageAlarm: 0.64, damageNow: 0.65, years: 1.6,
        services: {
          remote: on('ok', '监测量正常'),
          assess: on('warn', '累积损伤度关注'),
          crack: partial('ok', '应力历史偏短，预测待补数据'),
          fault: STRUCTURE_FAULT,
          safetyEval: NO_RISK
        }
      }),
      metrics({
        id: 'ML-10', name: '跨中温声振', status: 'ok', x: 400, y: 70, lx: 10, ly: -18, order: 4, multi: true,
        data: ['safety', 'health'],
        temp: 38.6, sound: 71.2, vib: 1.8, stress: 40, strain: 120,
        services: {
          remote: on('ok', '温声振通道正常'),
          assess: on('ok', '健康状态正常'),
          crack: off('温声振通道不作为裂纹预测主数据'),
          fault: STRUCTURE_FAULT,
          safetyEval: NO_RISK
        }
      }),
      metrics({
        id: 'ML-04', name: '端头焊缝', status: 'ok', x: 86, y: 124, lx: 0, ly: -18, order: 5,
        data: ['inspect', 'patrol'],
        services: {
          remote: off('无运行安全监控量关联'),
          assess: partial('ok', '仅有检测与巡检记录，缺少应力历程'),
          crack: partial('ok', '已有焊缝检测，缺少完整应力历程'),
          fault: STRUCTURE_FAULT,
          safetyEval: partial('ok', '可作检测记录，风险定量待补')
        }
      }),
      metrics({
        id: 'ML-05', name: '腹板中部', status: 'ok', x: 458, y: 124, lx: 0, ly: -18, order: 6,
        data: ['health'], stress: 96, strain: 410, damageAlarm: 0.22, damageNow: 0.22, years: 6.4,
        services: {
          remote: on('ok', '监测量正常'),
          assess: on('ok', '健康状态正常'),
          crack: on('ok', '剩余年限 6.4 年'),
          fault: STRUCTURE_FAULT,
          safetyEval: NO_RISK
        }
      }),
      metrics({
        id: 'ML-06', name: '跨中挠度点', status: 'ok', x: 370, y: 214, lx: 36, ly: 6, order: 7,
        data: ['safety', 'health'], stress: 88, strain: 360, years: 8,
        services: {
          remote: on('ok', '监测量正常'),
          assess: on('ok', '健康状态正常'),
          crack: off('挠度测点不直接参与裂纹预测'),
          fault: STRUCTURE_FAULT,
          safetyEval: NO_RISK
        }
      }),
      metrics({
        id: 'ML-08', name: '1/4跨下翼缘', status: 'ok', x: 188, y: 180, lx: 0, ly: 22, order: 8,
        data: ['health', 'patrol'], stress: 102, strain: 480, damageAlarm: 0.18, damageNow: 0.19, years: 7.2,
        services: {
          remote: on('ok', '监测量正常'),
          assess: on('ok', '健康状态正常'),
          crack: on('ok', '剩余年限 7.2 年'),
          fault: STRUCTURE_FAULT,
          safetyEval: NO_RISK
        }
      }),
      metrics({
        id: 'ML-09', name: '支座附近', status: 'offline', x: 548, y: 124, lx: 0, ly: 22, order: 9,
        data: ['health'], stress: 110, strain: 450,
        services: {
          remote: partial('ok', '采集中断，可查看历史结果'),
          assess: partial('ok', '仅有历史评估结果，当前数据不足'),
          crack: off('缺少有效应力历史'),
          fault: STRUCTURE_FAULT,
          safetyEval: NO_RISK
        }
      })
    ]
  }
}

function gearCatalog(): PointWorkspace {
  return {
    partName: '主起升减速器',
    kind: '机构',
    modelTitle: '机构传动链',
    scope: '主起升减速器',
    schematic: 'gear',
    twins: [{ id: 'TW-G1', name: '孪生-啮合应力', x: 320, y: 128, lx: 0, ly: -14 }],
    points: [
      metrics({
        id: 'GR-01', name: '减速箱主动轴轴承座', status: 'warn', x: 220, y: 108, lx: -18, ly: -16, order: 1,
        data: ['safety', 'health', 'patrol'],
        vib: 4.8, kurtosis: 3.6, rms: 2.9, temp: 58.4, stress: 40, strain: 80,
        services: {
          remote: on('ok', '监测量正常'),
          assess: on('warn', '振动烈度超关注阈值'),
          crack: NO_CRACK_GEAR,
          fault: on('alarm', '主动轴轴承早期磨损征兆 · 2026-11-06 10:02'),
          safetyEval: partial('ok', '可作状态退化记录，风险定量待补')
        }
      }),
      metrics({
        id: 'GR-02', name: '减速箱输出轴轴承座', status: 'ok', x: 420, y: 108, lx: 18, ly: -16, order: 2,
        data: ['safety', 'health'], vib: 2.1, kurtosis: 3.0, rms: 1.6, temp: 49,
        services: {
          remote: on('ok', '监测量正常'),
          assess: on('ok', '健康状态正常'),
          crack: NO_CRACK_GEAR,
          fault: on('ok', '未见故障特征'),
          safetyEval: NO_RISK
        }
      }),
      metrics({
        id: 'GR-03', name: '高速轴齿轮啮合区', status: 'ok', x: 320, y: 156, lx: 0, ly: 22, order: 3,
        data: ['health'], vib: 2.4, kurtosis: 3.2, rms: 1.8, temp: 51,
        services: {
          remote: on('ok', '监测量正常'),
          assess: on('ok', '健康状态正常'),
          crack: NO_CRACK_GEAR,
          fault: on('ok', '未见故障特征'),
          safetyEval: NO_RISK
        }
      }),
      metrics({
        id: 'GR-04', name: '油池温度点', status: 'ok', x: 320, y: 196, lx: 0, ly: 18, order: 4,
        data: ['safety', 'health'], temp: 56, vib: 0.4,
        services: {
          remote: on('ok', '温度正常'),
          assess: on('ok', '健康状态正常'),
          crack: NO_CRACK_GEAR,
          fault: off('温度点未配置诊断模型'),
          safetyEval: NO_RISK
        }
      }),
      metrics({
        id: 'GR-05', name: '箱体垂直测点', status: 'ok', x: 468, y: 156, lx: 16, ly: 0, order: 5,
        data: ['health'], vib: 1.6, kurtosis: 3.0, rms: 1.2, temp: 46,
        services: {
          remote: on('ok', '监测量正常'),
          assess: on('ok', '健康状态正常'),
          crack: NO_CRACK_GEAR,
          fault: on('ok', '未见故障特征'),
          safetyEval: NO_RISK
        }
      }),
      metrics({
        id: 'GR-06', name: '箱体轴向测点', status: 'offline', x: 172, y: 156, lx: -16, ly: 0, order: 6,
        data: [],
        services: {
          remote: off('该点位暂无关联数据'),
          assess: off('该点位暂无关联数据'),
          crack: NO_CRACK_GEAR,
          fault: off('缺少振动采样'),
          safetyEval: off('该点位暂无关联数据')
        }
      })
    ]
  }
}

function softenState(state: SvcState, node: PointStatus): SvcState {
  if (node === 'off') return off('该部件尚未接入监测')
  let result = state.result
  if (node === 'ok' && (result === 'alarm' || result === 'warn')) result = 'ok'
  if (node === 'warn' && result === 'alarm') result = 'warn'
  const hint = result === 'ok' && (state.result === 'alarm' || state.result === 'warn')
    ? '结果在正常范围内'
    : result === 'warn' && state.result === 'alarm'
      ? (state.hint || '结果超关注阈值')
      : state.hint
  return { ...state, result, hint }
}

function softenPoint(point: DetailPoint, node: PointStatus): DetailPoint {
  const services = {} as Record<SvcKey, SvcState>
  SVC_KEYS.forEach(key => { services[key] = softenState(point.services[key], node) })
  let status = point.status
  if (node === 'off') status = 'offline'
  else if (node === 'ok' && status !== 'offline') status = 'ok'
  else if (node === 'warn' && status === 'alarm') status = 'warn'
  return { ...point, status, services }
}

function softenWorkspace(workspace: PointWorkspace, node: PointStatus): PointWorkspace {
  // 部件为报警/异常时保留各服务自己的结论（点位异常仍可对应故障诊断报警）。
  // 部件为正常或未接入时，不再带出告警结论。
  if (node === 'alarm' || node === 'warn') return workspace
  return { ...workspace, points: workspace.points.map(point => softenPoint(point, node)) }
}

function toneOf(status: PointStatus): PointTone {
  if (status === 'alarm') return 'alarm'
  if (status === 'warn') return 'warn'
  if (status === 'off') return 'offline'
  return 'ok'
}

function dataKeysFor(point: Point): DataKey[] {
  const text = `${point.name}${point.unit || ''}${(point.channels || []).map(channel => channel.name).join('')}`
  const keys: DataKey[] = []
  if (/应变|应力|振动|温度|挠度|声|温声振/.test(text) || (point.channels?.length || 0) > 0) {
    keys.push('safety', 'health')
  }
  if (/探伤|焊缝|检测|UT/.test(text)) keys.push('inspect')
  if (/巡检|外观|油位|渗漏/.test(text)) keys.push('patrol')
  if (!keys.length) keys.push('health')
  return [...new Set(keys)]
}

function servicesFor(kind: '结构' | '机构', tone: PointTone, data: DataKey[]): Record<SvcKey, SvcState> {
  const structure = kind === '结构'
  const hot = tone === 'alarm' || tone === 'warn'
  const hasHealth = data.includes('health')
  const hasSafety = data.includes('safety')
  return {
    remote: hasHealth || hasSafety
      ? on('ok', '监测量正常')
      : off('无运行安全监控量关联'),
    assess: hasHealth
      ? on(structure && hot ? tone : 'ok', structure && tone === 'alarm' ? '累积损伤度超限' : structure && tone === 'warn' ? '累积损伤度关注' : '健康状态正常')
      : partial('ok', '缺少应力历程'),
    crack: structure
      ? (hasHealth
        ? on(tone === 'alarm' ? 'warn' : 'ok', tone === 'alarm' ? '剩余年限 0.8 年' : '剩余年限充裕')
        : partial('ok', '缺少完整应力历程'))
      : NO_CRACK_GEAR,
    fault: structure
      ? STRUCTURE_FAULT
      : (hasHealth
        ? on(tone === 'alarm' ? 'alarm' : tone === 'warn' ? 'warn' : 'ok', hot ? '轴承早期磨损征兆' : '未见故障特征')
        : off('缺少振动采样')),
    safetyEval: data.includes('risk')
      ? on(tone === 'alarm' ? 'alarm' : 'ok', tone === 'alarm' ? '疲劳损伤超限风险 0.72' : '风险处于正常范围')
      : NO_RISK
  }
}

function fromFallback(partName: string, specialty: string, points: Point[]): PointWorkspace {
  const kind: '结构' | '机构' = specialty === '金属结构' ? '结构' : '机构'
  const measured = points.filter(point => point.status !== 'twin')
  const twins = points.filter(point => point.status === 'twin').map(point => ({
    id: point.id,
    name: point.name,
    x: point.twin.x,
    y: point.twin.y
  }))
  return {
    partName,
    kind,
    modelTitle: kind === '结构' ? '结构模型' : '机构传动链',
    scope: partName,
    schematic: kind === '结构' ? 'generic' : 'gear',
    twins,
    points: measured.map((point, index) => {
      const tone = toneOf(point.status)
      const data = dataKeysFor(point)
      const reading = parseReading(point.value)
      const strain = reading ?? 120
      const stress = /应变/.test(point.unit || point.name) ? Math.round(strain * 0.21 * 10) / 10 : (reading ?? 40)
      const lead = point.channels?.find(channel => channel.status === 'alarm' || channel.status === 'warn') || point.channels?.[0]
      return metrics({
        id: point.id,
        name: point.name.replace(/应变$/, '').replace(/示意$/, '') || point.name,
        status: tone,
        x: point.twin.x,
        y: point.twin.y,
        order: index + 1,
        data,
        multi: (point.channels?.length || 0) > 1,
        stress,
        strain,
        damageAlarm: tone === 'alarm' ? 0.82 : tone === 'warn' ? 0.64 : 0.22,
        damageNow: tone === 'alarm' ? 0.83 : tone === 'warn' ? 0.65 : 0.22,
        years: tone === 'alarm' ? 0.8 : tone === 'warn' ? 1.4 : 6.2,
        vib: lead && /振/.test(lead.name) ? (parseReading(lead.value) ?? 1.8) : ( /振/.test(point.unit || '') ? (reading ?? 1.8) : 1.8),
        temp: lead && /温/.test(lead.name) ? (parseReading(lead.value) ?? 42) : 42,
        sound: lead && /声/.test(lead.name) ? (parseReading(lead.value) ?? 70) : 70,
        services: servicesFor(kind, tone, data)
      })
    })
  }
}

export function buildPointWorkspace(options: {
  partName: string
  specialty: string
  nodeStatus: PointStatus
  fallbackPoints: Point[]
}): PointWorkspace {
  if (options.partName === '单双主梁') return softenWorkspace(girderCatalog(), options.nodeStatus)
  if (options.partName === '主起升减速器') return softenWorkspace(gearCatalog(), options.nodeStatus)
  return fromFallback(options.partName, options.specialty, options.fallbackPoints)
}

export function toneRank(status: PointTone): number {
  if (status === 'alarm') return 0
  if (status === 'warn') return 1
  if (status === 'ok') return 2
  return 3
}

export function preferredService(point: DetailPoint): SvcKey {
  const alarm = SVC_KEYS.find(key => point.services[key].result === 'alarm' && point.services[key].state !== 'off')
  if (alarm) return alarm
  const warn = SVC_KEYS.find(key => point.services[key].result === 'warn' && point.services[key].state !== 'off')
  if (warn) return warn
  if (point.services.remote.state !== 'off') return 'remote'
  return SVC_KEYS.find(key => point.services[key].state !== 'off') || 'remote'
}

export function serviceSub(point: DetailPoint, key: SvcKey): string {
  const state = point.services[key]
  const fallback = SVC_DEFS.find(item => item.key === key)?.hint || ''
  if (state.reason && state.state !== 'on') return state.reason
  return state.hint || fallback
}

export function dataRole(point: DetailPoint, svc: SvcKey, key: DataKey): '' | '已使用' | '关联' | '补充' {
  if (!point.data.includes(key)) return ''
  if (svc === 'remote' || svc === 'assess' || svc === 'crack') {
    if (key === 'health') return '已使用'
    if (key === 'safety') return '关联'
    if (key === 'inspect' && svc !== 'remote') return '关联'
  }
  if (svc === 'fault') {
    if (key === 'health') return '已使用'
    if (key === 'safety') return '关联'
    if (key === 'patrol') return '补充'
  }
  if (svc === 'safetyEval') {
    if (key === 'risk') return '已使用'
    if (key === 'health' && !point.data.includes('risk')) return '已使用'
    if (key === 'inspect' || key === 'patrol') return '关联'
  }
  return ''
}

export function alarmLink(point: DetailPoint, svc: SvcKey): string {
  const state = point.services[svc]
  if (state.result !== 'alarm' && state.result !== 'warn') return '无'
  return (state.hint || '关联结果').split('·')[0].trim()
}

export function resultTime(svc: SvcKey, result: SvcResult): string {
  if (result === 'ok' || result === 'na') return '2026-11-06 11:20:04'
  if (svc === 'fault') return '2026-11-06 10:02:11'
  return '2026-11-06 09:18:32'
}

export function simSeries(seed: number, count: number, base: number, amp: number, bias = 0): number[] {
  const values: number[] = []
  for (let index = 0; index < count; index += 1) {
    const y = base + Math.sin((index + seed) / 3.2) * amp + ((index * 17 + seed * 13) % 7) - 3 + (bias * index) / count
    values.push(Number(y.toFixed(3)))
  }
  return values
}

export function hashSeed(text: string): number {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) | 0
  return Math.abs(hash % 97)
}

export interface TrendSpec {
  name: string
  values: number[]
  color: string
  alarmAt?: number | null
  thresholds?: { value: number; label: string; color: string }[]
}

export function trendOption(spec: TrendSpec, theme: { muted: string; border: string; danger: string }): EChartsOption {
  const labels = spec.values.map((_, index) => String(index + 1))
  const minV = Math.min(...spec.values)
  const maxV = Math.max(...spec.values)
  const span = maxV - minV || 1
  let yMin = minV - span * 0.15
  let yMax = maxV + span * 0.22
  spec.thresholds?.forEach(item => {
    yMin = Math.min(yMin, item.value - span * 0.05)
    yMax = Math.max(yMax, item.value + span * 0.08)
  })
  const alarmLabel = spec.alarmAt != null ? labels[spec.alarmAt] : ''
  return {
    animationDuration: 420,
    grid: { left: 48, right: 16, top: 16, bottom: 22 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: {
        fontSize: 10,
        color: theme.muted,
        interval: (index: number) => index === 0 || index === labels.length - 1 || index === Math.floor((labels.length - 1) / 2)
      },
      axisLine: { lineStyle: { color: theme.border } }
    },
    yAxis: {
      type: 'value',
      min: Number(yMin.toFixed(3)),
      max: Number(yMax.toFixed(3)),
      axisLabel: { fontSize: 10, color: theme.muted },
      splitLine: { lineStyle: { color: theme.border } }
    },
    series: [{
      name: spec.name,
      type: 'line',
      smooth: 0.25,
      symbol: 'none',
      data: spec.values,
      lineStyle: { width: 2, color: spec.color },
      areaStyle: { color: spec.color, opacity: 0.14 },
      markLine: {
        symbol: 'none',
        silent: true,
        data: [
          ...(spec.thresholds || []).map(item => ({
            yAxis: item.value,
            label: { formatter: item.label, color: item.color, fontSize: 10 },
            lineStyle: { type: 'dashed' as const, color: item.color }
          })),
          ...(alarmLabel ? [{
            xAxis: alarmLabel,
            label: { formatter: '报警时刻', color: theme.danger, fontSize: 10 },
            lineStyle: { type: 'dashed' as const, color: theme.danger }
          }] : [])
        ]
      },
      markPoint: spec.alarmAt != null ? {
        symbol: 'circle',
        symbolSize: 9,
        itemStyle: { color: theme.danger },
        data: [{ coord: [labels[spec.alarmAt], spec.values[spec.alarmAt]] }]
      } : undefined
    }]
  }
}
