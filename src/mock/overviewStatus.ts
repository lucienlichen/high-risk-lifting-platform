/**
 * 设备概览的统一状态。
 * 每项服务给出 正常 / 黄 / 红，设备取最严重的一项。
 * 黄 = 报警，红 = 预警，与常见习惯相反，待业务确认。
 * 分布按设备编号确定性生成：多数正常，少量黄，极少红。
 * 不复用各服务列表里“几乎全红”的占位规则。
 */

export type LampLevel = 'normal' | 'yellow' | 'red'

export type OverviewServiceKey =
  | 'safety'
  | 'healthMonitor'
  | 'health'
  | 'crack'
  | 'fault'
  | 'risk'

export type AccidentType = '钢水包倾覆' | '焊缝开裂' | '倒塌' | '坠落'

export interface OverviewServiceMeta {
  key: OverviewServiceKey
  label: string
  short: string
}

export const OVERVIEW_SERVICES: readonly OverviewServiceMeta[] = [
  { key: 'safety', label: '安全监控', short: '安' },
  { key: 'healthMonitor', label: '健康监测', short: '监' },
  { key: 'health', label: '健康评估', short: '评' },
  { key: 'crack', label: '裂纹预测', short: '裂' },
  { key: 'fault', label: '故障诊断', short: '诊' },
  { key: 'risk', label: '风险定量评估', short: '风' }
]

export const ACCIDENT_TYPES: readonly AccidentType[] = ['钢水包倾覆', '焊缝开裂', '倒塌', '坠落']

export const LAMP_RANK: Record<LampLevel, number> = { normal: 0, yellow: 1, red: 2 }

/**
 * 厂区平面图接入开关。没有底图和设备坐标时保持 false。
 * 页面上的开关只打开占位视图，不改变此常量。
 */
export const PLANT_LAYOUT_READY = false

/** 应力云图结构节点回传。Unity 接入后赋值。 */
export const structureViewerHook: {
  onStructureNodeSelect?: (nodeId: string) => void
} = {}

export function notifyStructureNode(nodeId: string) {
  structureViewerHook.onStructureNodeSelect?.(nodeId)
}

export interface ServiceLamp {
  key: OverviewServiceKey
  label: string
  short: string
  level: LampLevel
  reason: string
  accident: AccidentType | null
}

export interface OverviewAlarm {
  id: string
  time: string
  serviceKey: OverviewServiceKey
  serviceLabel: string
  level: LampLevel
  text: string
  accident: AccidentType
}

export interface DeviceOverview {
  overall: LampLevel
  services: ServiceLamp[]
  accident: AccidentType | null
  alarms: OverviewAlarm[]
}

interface ReasonItem {
  text: string
  accident: AccidentType
}

const REASONS: Record<OverviewServiceKey, Record<'yellow' | 'red', readonly ReasonItem[]>> = {
  safety: {
    yellow: [
      { text: '起重力矩达到额定值的 86%，接近限值', accident: '钢水包倾覆' },
      { text: '大车运行偏斜 7.4 mm，已超过限值的 70%', accident: '钢水包倾覆' },
      { text: '风速 8.6 m/s，达到限值 10.8 m/s 的 80%', accident: '倒塌' }
    ],
    red: [
      { text: '起重量超过额定值，力矩百分比高于 100%', accident: '钢水包倾覆' },
      { text: '抗风防滑装置报警', accident: '倒塌' },
      { text: '起升高度限位联锁异常', accident: '坠落' }
    ]
  },
  healthMonitor: {
    yellow: [
      { text: '主梁跨中应力测点预警', accident: '焊缝开裂' },
      { text: '焊缝热点声发射活动增强', accident: '焊缝开裂' }
    ],
    red: [
      { text: '主梁下翼缘应力测点异常', accident: '焊缝开裂' },
      { text: '支腿过渡区声发射测点异常', accident: '倒塌' }
    ]
  },
  health: {
    yellow: [
      { text: '主梁累积疲劳损伤度 0.74，结构亚健康', accident: '焊缝开裂' },
      { text: '端梁损伤程度轻度', accident: '倒塌' }
    ],
    red: [
      { text: '支腿结构健康状态异常，损伤程度中度', accident: '倒塌' },
      { text: '主梁结构健康状态异常', accident: '焊缝开裂' }
    ]
  },
  crack: {
    yellow: [
      { text: '主梁下翼缘预计裂纹萌生约 11 个月', accident: '焊缝开裂' },
      { text: '端梁连接板预计裂纹萌生约 9 个月', accident: '焊缝开裂' }
    ],
    red: [
      { text: '端梁腹板预计裂纹萌生约 5 个月', accident: '焊缝开裂' },
      { text: '支腿顶部节点预计裂纹萌生约 4 个月', accident: '倒塌' }
    ]
  },
  fault: {
    yellow: [
      { text: '起升减速机低速轴亚健康，振动偏高', accident: '坠落' },
      { text: '制动器闸瓦轻度磨损，评级亚健康', accident: '钢水包倾覆' },
      { text: '行走车轮踏面磨损不均，评级亚健康', accident: '倒塌' }
    ],
    red: [
      { text: '制动器闸瓦过度磨损，评级高风险', accident: '坠落' },
      { text: '起升减速机存在轴承损坏特征，评级高风险', accident: '钢水包倾覆' },
      { text: '行走车轮严重啃轨，评级高风险', accident: '倒塌' }
    ]
  },
  risk: {
    yellow: [
      { text: '综合分 32/60，进入中风险段，主要指标为现场作业人数', accident: '钢水包倾覆' },
      { text: '综合分 34/60，进入中风险段，主要指标为使用年限', accident: '焊缝开裂' }
    ],
    red: [
      { text: '综合分 48/60，进入高风险段，主要指标为年故障次数', accident: '坠落' },
      { text: '综合分 46/60，进入高风险段，主要指标为定期检验情况', accident: '倒塌' }
    ]
  }
}

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function alarmTime(deviceId: string, salt: number): string {
  const value = hash(`${deviceId}:time:${salt}`)
  const day = 26 - (value % 10)
  const hour = 7 + (value % 14)
  const minute = (value >> 5) % 60
  return `2026-10-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function reasonFor(key: OverviewServiceKey, level: 'yellow' | 'red', deviceId: string): ReasonItem {
  const list = REASONS[key][level]
  return list[hash(`${deviceId}:${key}:${level}`) % list.length]
}

function blankLamp(meta: OverviewServiceMeta): ServiceLamp {
  return { ...meta, level: 'normal', reason: '未见需关注项', accident: null }
}

const cache = new Map<string, DeviceOverview>()

export function getDeviceOverview(deviceId: string): DeviceOverview {
  const cached = cache.get(deviceId)
  if (cached) return cached

  const services = OVERVIEW_SERVICES.map(blankLamp)
  const roll = hash(`${deviceId}:lamp`) % 1000
  const primaryIndex = hash(`${deviceId}:svc`) % services.length
  let overall: LampLevel = 'normal'

  if (roll < 18) {
    overall = 'red'
    const reason = reasonFor(services[primaryIndex].key, 'red', deviceId)
    services[primaryIndex] = { ...services[primaryIndex], level: 'red', reason: reason.text, accident: reason.accident }
    if (hash(`${deviceId}:sec`) % 100 < 35) {
      let secondary = hash(`${deviceId}:svc2`) % services.length
      if (secondary === primaryIndex) secondary = (secondary + 1) % services.length
      const extra = reasonFor(services[secondary].key, 'yellow', deviceId)
      services[secondary] = { ...services[secondary], level: 'yellow', reason: extra.text, accident: extra.accident }
    }
  } else if (roll < 110) {
    overall = 'yellow'
    const reason = reasonFor(services[primaryIndex].key, 'yellow', deviceId)
    services[primaryIndex] = { ...services[primaryIndex], level: 'yellow', reason: reason.text, accident: reason.accident }
  }

  const leading = [...services].sort((a, b) => LAMP_RANK[b.level] - LAMP_RANK[a.level] || serviceOrder(a.key) - serviceOrder(b.key))[0]
  const accident = leading && leading.level !== 'normal' ? leading.accident : null
  const alarms: OverviewAlarm[] = services
    .filter(item => item.level !== 'normal' && item.accident)
    .map((item, index) => ({
      id: `${deviceId}-${item.key}`,
      time: alarmTime(deviceId, index + 1),
      serviceKey: item.key,
      serviceLabel: item.label,
      level: item.level,
      text: item.reason,
      accident: item.accident as AccidentType
    }))
    .sort((a, b) => LAMP_RANK[b.level] - LAMP_RANK[a.level] || b.time.localeCompare(a.time))

  const overview: DeviceOverview = { overall, services, accident, alarms }
  cache.set(deviceId, overview)
  return overview
}

function serviceOrder(key: OverviewServiceKey) {
  return OVERVIEW_SERVICES.findIndex(item => item.key === key)
}

export function lampLabel(level: LampLevel): string {
  if (level === 'red') return '预警'
  if (level === 'yellow') return '报警'
  return '正常'
}

export interface ScopeLampStats {
  total: number
  red: number
  yellow: number
  accidents: Record<AccidentType, { red: number; yellow: number }>
}

export function summarizeOverviews(deviceIds: string[]): ScopeLampStats {
  const accidents = Object.fromEntries(ACCIDENT_TYPES.map(type => [type, { red: 0, yellow: 0 }])) as ScopeLampStats['accidents']
  let red = 0
  let yellow = 0
  deviceIds.forEach(id => {
    const overview = getDeviceOverview(id)
    if (overview.overall === 'red') red += 1
    else if (overview.overall === 'yellow') yellow += 1
    const byAccident: Partial<Record<AccidentType, LampLevel>> = {}
    overview.services.forEach(service => {
      if (!service.accident || service.level === 'normal') return
      const current = byAccident[service.accident] ?? 'normal'
      if (LAMP_RANK[service.level] > LAMP_RANK[current]) byAccident[service.accident] = service.level
    })
    ACCIDENT_TYPES.forEach(type => {
      const level = byAccident[type]
      if (level === 'red') accidents[type].red += 1
      else if (level === 'yellow') accidents[type].yellow += 1
    })
  })
  return { total: deviceIds.length, red, yellow, accidents }
}
