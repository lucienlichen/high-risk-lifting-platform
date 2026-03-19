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
  /** 集团，仅部分场景有（如冶金） */
  group?: string
  /** 子公司，仅部分场景有 */
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

/** 冶金场景演示：集团与子公司 */
const METALLURGY_GROUPS = ['本溪钢铁', '江苏荣刚'] as const
const METALLURGY_SUBSIDIARIES: Record<string, string[]> = {
  '本溪钢铁': ['炼钢一厂', '轧钢二厂', '高炉分厂'],
  '江苏荣刚': ['特钢分公司', '棒线分厂']
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

  let group: string | undefined
  let subsidiary: string | undefined
  if (sceneId === 'metallurgy') {
    const g = METALLURGY_GROUPS[rng(0, METALLURGY_GROUPS.length - 1)]
    group = g
    const subs = METALLURGY_SUBSIDIARIES[g]
    subsidiary = subs[rng(0, subs.length - 1)]
  }

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

/** 获取场景可选的集团列表（如冶金：本溪钢铁、江苏荣刚） */
export function getSceneGroups(sceneId: SceneId): string[] {
  if (sceneId === 'metallurgy') return [...METALLURGY_GROUPS]
  return []
}

/** 获取场景下集团对应的子公司列表；不传 group 时返回该场景全部子公司 */
export function getSceneSubsidiaries(sceneId: SceneId, group?: string): string[] {
  if (sceneId !== 'metallurgy') return []
  if (group) return METALLURGY_SUBSIDIARIES[group] ?? []
  return Object.values(METALLURGY_SUBSIDIARIES).flat()
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
