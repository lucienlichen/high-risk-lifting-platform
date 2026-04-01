export type SceneId = 'metallurgy' | 'port' | 'construction' | 'shipbuilding'
export type DeviceStatus = 'running' | 'stopped' | 'maintenance' | 'standby'
export type RiskLevel = 'normal' | 'low' | 'medium' | 'high'

export interface Device {
  id: string
  name: string
  code: string
  type: string
  scene: SceneId
  status: DeviceStatus
  riskLevel: RiskLevel
  latestAlarmTime: string | null
  online: boolean
  healthScore: number
  load: number
  operatingHours: number
  manufacturer: string
  installDate: string
  location: string
  /** 集团（场景演示：港口/冶金/造船/建筑等企业主体） */
  group?: string
  /** 子公司或下属作业单元（港区、车间、分公司等） */
  subsidiary?: string
  /** 技术参数前6项 */
  technicalParams?: { name: string; value: string }[]
}

export interface SceneInfo {
  id: SceneId
  name: string
  description: string
  totalDevices: number
}

export const SCENES: SceneInfo[] = [
  {
    id: 'metallurgy',
    name: '冶金起重装备',
    description: '面向钢铁、有色金属等冶金行业起重装备的智能运维与风险防控服务',
    totalDevices: 1600
  },
  {
    id: 'port',
    name: '港口起重装备',
    description: '面向港口、码头装卸作业起重装备的智能运维与安全监测服务',
    totalDevices: 1000
  },
  {
    id: 'shipbuilding',
    name: '造船起重装备',
    description: '面向船舶建造行业大型起重装备的智能运维与健康评估服务',
    totalDevices: 100
  },
  {
    id: 'construction',
    name: '建筑起重装备',
    description: '面向建筑工地施工起重装备的实时安全监控与风险预警服务',
    totalDevices: 500
  }
]

const DEVICE_TYPES: Record<SceneId, string[]> = {
  metallurgy: ['桥式起重机', '门式起重机', '冶金专用起重机', '电磁起重机', '铸造起重机'],
  port:        ['门座起重机', '岸桥', '轮胎式集装箱门式起重机', '轨道式集装箱门式起重机', '浮式起重机'],
  construction:['塔式起重机', '施工升降机', '履带起重机', '汽车起重机', '动臂式塔吊'],
  shipbuilding: ['造船门式起重机', '龙门起重机', '浮式起重机', '壁行起重机', '悬臂起重机']
}

const NAME_PREFIXES: Record<SceneId, string[]> = {
  metallurgy:   ['炼钢厂', '热轧车间', '冷轧车间', '高炉区', '连铸车间', '轧钢厂', '铸造车间'],
  port:         ['北码头', '南码头', '东港区', '西港区', '集装箱堆场', '散货码头', '石化泊位'],
  construction: ['城投中心', '高铁站', '商业综合体', '地铁站', '桥梁', '写字楼', '地下车库'],
  shipbuilding: ['船台', '下水坞', '船坞', '总装区', '预装车间', '舾装码头', '涂装车间']
}

const MANUFACTURERS = ['太重集团', '大连重工', '徐工集团', '中联重科', '三一重工', '山东冶金机械']
const SCENE_CODES: Record<SceneId, string> = {
  metallurgy: 'YJ', port: 'GK', construction: 'JZ', shipbuilding: 'ZC'
}

/**
 * 各场景企业筛选演示数据：集团 + 下属单元（与 SceneView 标签筛选联动）
 * - 冶金：本溪钢铁、江苏荣刚
 * - 港口：青岛港集团（示例）+ 宁波舟山港集团
 * - 造船：仪征造船厂（示例）+ 外高桥造船
 * - 建筑：中国建筑、上海建工（中国大陆大型建工企业）
 */
const SCENE_ENTERPRISE: Record<
  SceneId,
  { groups: readonly string[]; subsidiaries: Record<string, string[]> }
> = {
  metallurgy: {
    groups: ['本溪钢铁', '江苏荣刚'],
    subsidiaries: {
      '本溪钢铁': ['炼钢一厂', '轧钢二厂', '高炉分厂'],
      '江苏荣刚': ['特钢分公司', '棒线分厂']
    }
  },
  port: {
    groups: ['青岛港集团', '宁波舟山港集团'],
    subsidiaries: {
      '青岛港集团': ['前湾港区', '董家口港区', '黄岛油港区'],
      '宁波舟山港集团': ['北仑港区', '穿山港区', '梅山港区']
    }
  },
  shipbuilding: {
    groups: ['仪征造船厂', '外高桥造船'],
    subsidiaries: {
      '仪征造船厂': ['船体车间', '舾装分厂', '涂装车间'],
      '外高桥造船': ['总装部', '搭载分部', '舾装码头']
    }
  },
  construction: {
    groups: ['中国建筑', '上海建工'],
    subsidiaries: {
      '中国建筑': ['一局华东公司', '三局总承包', '八局基础设施'],
      '上海建工': ['一建集团', '机施集团', '基础集团']
    }
  }
}

/** 技术参数前6项名称（起重装备通用） */
const TECH_PARAM_NAMES = ['额定起重量', '跨度', '起升高度', '工作级别', '起升速度', '运行速度'] as const
const TECH_PARAM_UNITS: Record<string, string> = {
  '额定起重量': 't',
  '跨度': 'm',
  '起升高度': 'm',
  '工作级别': '',
  '起升速度': 'm/min',
  '运行速度': 'm/min'
}

// Deterministic pseudo-random
function mkRng(baseSeed: number) {
  let s = baseSeed
  return (min: number, max: number) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return min + (s % (max - min + 1))
  }
}

function generateDevice(sceneId: SceneId, index: number, rng: ReturnType<typeof mkRng>): Device {
  const types    = DEVICE_TYPES[sceneId]
  const prefixes = NAME_PREFIXES[sceneId]
  const type     = types[rng(0, types.length - 1)]
  const prefix   = prefixes[rng(0, prefixes.length - 1)]
  const mfg      = MANUFACTURERS[rng(0, MANUFACTURERS.length - 1)]

  const r = rng(0, 99)
  const status: DeviceStatus =
    r < 68 ? 'running' :
    r < 82 ? 'standby' :
    r < 93 ? 'stopped' : 'maintenance'

  const online = status === 'running' || status === 'standby'

  const rr = rng(0, 99)
  const riskLevel: RiskLevel =
    rr < 58 ? 'normal' :
    rr < 79 ? 'low' :
    rr < 92 ? 'medium' : 'high'

  const hasAlarm = riskLevel !== 'normal' || rng(0, 9) > 7

  const daysAgo = rng(0, 29)
  const alarmDate = new Date()
  alarmDate.setDate(alarmDate.getDate() - daysAgo)
  alarmDate.setHours(rng(0, 23), rng(0, 59), 0, 0)

  const installYear = 2010 + rng(0, 12)
  const installMonth = rng(1, 12)

  const ent = SCENE_ENTERPRISE[sceneId]
  const g = ent.groups[rng(0, ent.groups.length - 1)]
  const subs = ent.subsidiaries[g]
  const group = g
  const subsidiary = subs[rng(0, subs.length - 1)]

  const technicalParams: { name: string; value: string }[] = TECH_PARAM_NAMES.map((name, i) => {
    const u = TECH_PARAM_UNITS[name]
    const val =
      name === '额定起重量' ? String(rng(5, 200)) :
      name === '跨度' ? String(rng(10, 50)) :
      name === '起升高度' ? String(rng(6, 50)) :
      name === '工作级别' ? `A${rng(3, 8)}` :
      name === '起升速度' ? String(rng(1, 20)) :
      String(rng(10, 80))
    return { name, value: u ? `${val}${u}` : val }
  })

  return {
    id:               `${sceneId}-${String(index).padStart(4, '0')}`,
    name:             `${prefix}-${String(index).padStart(2, '0')}号${type}`,
    code:             `${SCENE_CODES[sceneId]}-${String(index).padStart(5, '0')}`,
    type,
    scene:            sceneId,
    status,
    riskLevel,
    latestAlarmTime:  hasAlarm ? alarmDate.toLocaleString('zh-CN') : null,
    online,
    healthScore:
      riskLevel === 'high'   ? rng(30, 60) :
      riskLevel === 'medium' ? rng(60, 78) :
      riskLevel === 'low'    ? rng(78, 90) : rng(88, 100),
    load:             status === 'running' ? rng(20, 95) : 0,
    operatingHours:   rng(200, 32000),
    manufacturer:     mfg,
    installDate:      `${installYear}-${String(installMonth).padStart(2, '0')}-01`,
    location:         `${prefix}厂区`,
    group,
    subsidiary,
    technicalParams
  }
}

/** 获取场景可选的集团列表 */
export function getSceneGroups(sceneId: SceneId): string[] {
  return [...SCENE_ENTERPRISE[sceneId].groups]
}

/** 获取场景下集团对应的子公司列表；不传 group 时返回该场景全部子公司 */
export function getSceneSubsidiaries(sceneId: SceneId, group?: string): string[] {
  const { subsidiaries } = SCENE_ENTERPRISE[sceneId]
  if (group) return subsidiaries[group] ?? []
  return Object.values(subsidiaries).flat()
}

// Cache generated devices
const cache = new Map<SceneId, Device[]>()

function ensureCache(sceneId: SceneId) {
  if (cache.has(sceneId)) return
  const seeds: Record<SceneId, number> = {
    metallurgy: 101, port: 203, construction: 307, shipbuilding: 409
  }
  const rng     = mkRng(seeds[sceneId])
  const scene   = SCENES.find(s => s.id === sceneId)!
  const count   = Math.min(scene.totalDevices, 200) // generate up to 200 for demo
  const devices: Device[] = []
  for (let i = 1; i <= count; i++) {
    devices.push(generateDevice(sceneId, i, rng))
  }
  cache.set(sceneId, devices)
}

export function getDevices(sceneId: SceneId, page = 1, pageSize = 20) {
  ensureCache(sceneId)
  const all   = cache.get(sceneId)!
  const total = SCENES.find(s => s.id === sceneId)!.totalDevices
  const start = (page - 1) * pageSize
  return { list: all.slice(start, start + pageSize), total, page, pageSize }
}

export function getDeviceById(deviceId: string): Device | null {
  const sceneId = deviceId.split('-')[0] as SceneId
  ensureCache(sceneId)
  return cache.get(sceneId)?.find(d => d.id === deviceId) ?? null
}

export function getSceneStats(sceneId: SceneId) {
  ensureCache(sceneId)
  const all    = cache.get(sceneId)!
  const scene  = SCENES.find(s => s.id === sceneId)!
  const ratio  = scene.totalDevices / all.length

  const scale  = (count: number) => Math.round(count * ratio)
  return {
    total:        scene.totalDevices,
    online:       scale(all.filter(d => d.online).length),
    offline:      scale(all.filter(d => !d.online).length),
    highRisk:     scale(all.filter(d => d.riskLevel === 'high').length),
    mediumRisk:   scale(all.filter(d => d.riskLevel === 'medium').length),
    alarmToday:   scale(all.filter(d => d.latestAlarmTime !== null).length * 3 / 10),
    maintenance:  scale(all.filter(d => d.status === 'maintenance').length),
    statusDist: {
      running:     scale(all.filter(d => d.status === 'running').length),
      standby:     scale(all.filter(d => d.status === 'standby').length),
      stopped:     scale(all.filter(d => d.status === 'stopped').length),
      maintenance: scale(all.filter(d => d.status === 'maintenance').length)
    }
  }
}

// Time-series data for device detail charts
export function getDeviceRunData(deviceId: string) {
  const points = 24
  const base   = deviceId.length * 7
  return Array.from({ length: points }, (_, i) => ({
    time:        `${String(i).padStart(2, '0')}:00`,
    load:        Math.max(5, Math.round(50 + 30 * Math.sin((i + base) / 4) + (Math.random() - 0.5) * 12)),
    temperature: Math.round(62 + 18 * Math.sin((i + base) / 5) + (Math.random() - 0.5) * 4),
    vibration:   parseFloat((0.6 + 0.8 * Math.abs(Math.sin((i + base) / 3)) + Math.random() * 0.2).toFixed(2))
  }))
}

export function getDeviceAlarms(deviceId: string) {
  const types     = ['超载报警', '温度报警', '振动报警', '倾斜报警', '过流报警', '限位报警', '制动失效']
  const severities= ['轻微', '一般', '严重']
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - Math.floor(Math.random() * 30))
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
    return {
      id:          `${deviceId}-alarm-${i}`,
      type:        types[i % types.length],
      severity:    severities[i % severities.length],
      time:        d.toLocaleString('zh-CN'),
      status:      Math.random() > 0.3 ? '已处置' : '待处置',
      description: '设备运行参数超出正常阈值范围，建议及时检查处理'
    }
  }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

export function getTopRiskDevices(sceneId: SceneId) {
  ensureCache(sceneId)
  return (cache.get(sceneId) ?? [])
    .filter(d => d.riskLevel !== 'normal')
    .sort((a, b) => {
      const order: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1, normal: 0 }
      return order[b.riskLevel] - order[a.riskLevel]
    })
    .slice(0, 8)
}

export function getRecentAlarmDevices(sceneId: SceneId) {
  ensureCache(sceneId)
  return (cache.get(sceneId) ?? [])
    .filter(d => d.latestAlarmTime !== null)
    .sort((a, b) => {
      const ta = new Date(a.latestAlarmTime!).getTime()
      const tb = new Date(b.latestAlarmTime!).getTime()
      return tb - ta
    })
    .slice(0, 6)
}

export interface WorkCycle {
  id: string
  seq: number
  startTime: string
  stopTime: string
  loadWeight: number
  liftDuration: number
  totalCycles: number
  totalWorkHours: number
}

/**
 * 按设备 ID + 日期确定性生成工作循环记录（8-15 条）
 */
export function getWorkCycles(deviceId: string, date: Date): WorkCycle[] {
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const seed = deviceId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + parseInt(dateStr, 10) % 10000
  const rng = mkRng(seed)

  // 让历史日期存在稳定的“无工作循环”场景，便于日历底色区分。
  if (rng(0, 99) < 28) {
    return []
  }

  const count = 8 + rng(0, 7)
  const cycles: WorkCycle[] = []
  let hour = rng(6, 8)
  let minute = rng(0, 30)
  let cumulativeCycles = rng(100, 500)
  let cumulativeHours = parseFloat((rng(200, 2000) / 10).toFixed(1))

  for (let i = 0; i < count; i++) {
    const startH = hour
    const startM = minute
    const durationMin = 15 + rng(5, 45)
    minute += durationMin
    if (minute >= 60) { hour += Math.floor(minute / 60); minute = minute % 60 }
    const stopH = hour
    const stopM = minute
    hour += rng(0, 1)
    minute = rng(0, 59)

    const loadWeight = parseFloat((rng(5, 95) + rng(0, 9) / 10).toFixed(1))
    const liftMin = 3 + rng(1, 12)
    cumulativeCycles += rng(1, 5)
    cumulativeHours = parseFloat((cumulativeHours + durationMin / 60).toFixed(1))

    const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    cycles.push({
      id: `${deviceId}-cycle-${dateStr}-${i + 1}`,
      seq: i + 1,
      startTime: `${ymd} ${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
      stopTime: `${ymd} ${String(Math.min(stopH, 23)).padStart(2, '0')}:${String(stopM).padStart(2, '0')}`,
      loadWeight,
      liftDuration: liftMin,
      totalCycles: cumulativeCycles,
      totalWorkHours: cumulativeHours
    })

    if (hour >= 20) break
  }

  return cycles
}

export {
  getOperationList,
  type OperationRecord,
  getRemoteMonitoringData,
  getDeviceMonitoringPoints,
  getDeviceTwinInferenceStub,
  type RemoteMonitoringData,
  type RemoteSectionId,
  type RemoteStatusItem,
  type RemoteItemHistory,
  type RemoteTrendHistory,
  type RemoteDualTrendHistory,
  type RemoteTripleTrendHistory,
  type RemoteListHistory,
  type RemotePlaceholderHistory,
  type MonitoringPointRow,
  type MonitoringPointStatus,
  type TwinInferenceStub,
  type ElectricBoardData,
  type ElectricRunningItem,
  type ElectricGearBlock,
  type ElectricGearSlot,
  type ElectricCurrentRow,
  type ElectricLimitItem
} from './remoteMonitoring'
