/**
 * 单台设备物理结构树。
 * 类别模板来自模型管理平台抽出的 modelManageStructureTree.json（2026-10-26）。
 * QB 由 BR 派生，MG 由 GA 派生。零件层不显示，主梁/支腿分段合并到上一级。
 * 节点灯只汇总已绑定的服务告警；测点状态只展示，不向上汇总。
 * 根节点灯等于 getDeviceOverview().overall。
 */
import rawTemplates from '@/mock/data/modelManageStructureTree.json'
import { getRemoteMonitoringData, type RemoteStatusItem } from '@/mock/remoteMonitoring'
import {
  getDeviceOverview,
  LAMP_RANK,
  type LampLevel,
  type OverviewAlarm,
  type OverviewServiceKey
} from '@/mock/overviewStatus'

export type StructureTemplateCode = 'BR' | 'QB' | 'GA' | 'MG' | 'GE' | 'PT'

interface RawNode {
  id: string
  name: string
  type: string
  desc?: string
  children?: RawNode[]
}

export interface StructurePoint {
  name: string
  value: string
  status: 'normal' | 'warn' | 'danger' | 'reading'
}

export interface StructureNode {
  id: string
  name: string
  type: string
  depth: number
  lamp: LampLevel | 'none'
  alarmCount: number
  pointStatus: '' | '预警' | '异常'
  points: StructurePoint[]
  services: OverviewServiceKey[]
  alarms: OverviewAlarm[]
  children: StructureNode[]
}

export interface DeviceStructure {
  template: StructureTemplateCode | null
  templateLabel: string
  rootId: string
  root: StructureNode
}

interface DeviceInput {
  id: string
  name: string
  type: string
  capacityText: string
  riskLevel: 'normal' | 'low' | 'medium' | 'high'
}

const TEMPLATES = rawTemplates as RawNode[]

const SERVICE_SUFFIXES: [string, OverviewServiceKey[]][] = [
  ['structure.bridge.main-girder', ['healthMonitor', 'health', 'crack']],
  ['structure.main-girder', ['healthMonitor', 'health', 'crack']],
  ['structure.bridge.end-girder', ['healthMonitor', 'health', 'crack']],
  ['structure.hoisting-trolley.main-frame', ['healthMonitor', 'health']],
  ['structure.hoisting-trolley.upper-frame', ['healthMonitor', 'health']],
  ['structure.leg', ['healthMonitor', 'health', 'crack']],
  ['drive.motor', ['safety']],
  ['drive.reducer', ['healthMonitor', 'fault']],
  ['drive.brake', ['safety', 'healthMonitor', 'fault']],
  ['rope-winding.wire-rope', ['healthMonitor']],
  ['lifting-device.hook-set', ['safety']],
  ['lifting-device.lifting-beam', ['safety']],
  ['wheel-set', ['healthMonitor', 'fault']],
  ['load-moment-limiter', ['safety']],
  ['lifting-height-limit', ['safety']],
  ['lowering-depth-limit', ['safety']],
  ['travel-limit', ['safety']],
  ['interlock-protection', ['safety']],
  ['anti-collision', ['safety']],
  ['overspeed-protection', ['safety']],
  ['skew-indicator', ['safety']],
  ['wind-skid-protection', ['safety']],
  ['anemometer', ['safety']]
]

/** 与故障诊断抽屉 WHEEL_POS 同一顺序：前 4 个大车，后 4 个小车。 */
const WHEEL_PLACES = [
  '大车主动端·北轨',
  '大车主动端·南轨',
  '大车从动端·北轨',
  '大车从动端·南轨',
  '小车主动端·东侧',
  '小车主动端·西侧',
  '小车从动端·东侧',
  '小车从动端·西侧'
]

const cache = new Map<string, DeviceStructure>()

function clone(node: RawNode): RawNode {
  return { ...node, children: (node.children ?? []).map(clone) }
}

function rewriteId(node: RawNode, from: string, to: string): RawNode {
  const id = node.id === from ? to : node.id.replace(new RegExp(`^${from}\\.`), `${to}.`)
  return { ...node, id, children: (node.children ?? []).map(child => rewriteId(child, from, to)) }
}

function dropIds(node: RawNode, banned: Set<string>): RawNode {
  return {
    ...node,
    children: (node.children ?? []).filter(child => !banned.has(child.id)).map(child => dropIds(child, banned))
  }
}

function rename(node: RawNode, names: Record<string, string>): RawNode {
  return {
    ...node,
    name: names[node.id] ?? node.name,
    children: (node.children ?? []).map(child => rename(child, names))
  }
}

function prune(node: RawNode): RawNode | null {
  if (node.type === 'part') return null
  if (/\.segment(?:-\d+|-n)$/.test(node.id)) return null
  const children = (node.children ?? []).map(prune).filter((child): child is RawNode => !!child)
  const name = node.id.endsWith('.bridge.main-girder') || node.id.endsWith('.structure.main-girder')
    ? '主梁'
    : node.name
  return { ...node, name, children }
}

function sourceTemplate(code: 'BR' | 'GA' | 'GE' | 'PT'): RawNode {
  const found = TEMPLATES.find(item => item.id === code)
  if (!found) throw new Error(`missing structure template ${code}`)
  return clone(found)
}

function qbTemplate(hasAuxHoist: boolean): RawNode {
  let tree = rewriteId(sourceTemplate('BR'), 'BR', 'QB')
  tree.name = '通用桥式起重机'
  const banned = new Set(['QB.structure.hoisting-trolley.auxiliary-frame'])
  if (!hasAuxHoist) banned.add('QB.mechanism.auxiliary-hoist')
  tree = dropIds(tree, banned)
  return tree
}

function mgTemplate(): RawNode {
  let tree = rewriteId(sourceTemplate('GA'), 'GA', 'MG')
  tree.name = '通用门式起重机'
  tree = dropIds(tree, new Set([
    'MG.structure.hoisting-trolley.lower-frame',
    'MG.mechanism.lower-trolley-hoist',
    'MG.mechanism.lower-trolley-travel'
  ]))
  tree = rename(tree, {
    'MG.structure.hoisting-trolley.upper-frame': '小车架',
    'MG.mechanism.upper-trolley-hoist': '起升机构',
    'MG.mechanism.upper-trolley-travel': '小车运行机构'
  })
  return tree
}

export function templateForType(type: string): StructureTemplateCode | null {
  const text = type.trim()
  if (!text || text === 'C' || text === 'B' || /^\d+$/.test(text)) return null
  if (/岸桥|岸边集装箱/.test(text)) return 'GE'
  if (/门座/.test(text)) return 'PT'
  if (/造船门式/.test(text)) return 'GA'
  if (/电动单梁|悬挂/.test(text)) return null
  if (/葫芦/.test(text) && !/桥式|门式/.test(text)) return null
  if (/冶金桥式|铸造/.test(text)) return 'BR'
  if (/桥式/.test(text)) return 'QB'
  if (/门式/.test(text)) return 'MG'
  return null
}

function bridgeTemplate(code: StructureTemplateCode | null) {
  return code === 'BR' || code === 'QB'
}

function suffix(id: string) {
  const index = id.indexOf('.')
  return index < 0 ? '' : id.slice(index + 1)
}

function servicesFor(id: string): OverviewServiceKey[] {
  const path = suffix(id)
  const found = SERVICE_SUFFIXES.find(([key]) => path === key || path.endsWith(`.${key}`) || path.includes(key))
  return found ? [...found[1]] : []
}

function worse(a: LampLevel, b: LampLevel): LampLevel {
  return LAMP_RANK[a] >= LAMP_RANK[b] ? a : b
}

function resolveId(index: Map<string, string>, candidates: string[]): string | null {
  for (const candidate of candidates) {
    const hit = index.get(candidate)
    if (hit) return hit
  }
  return null
}

function alarmTarget(text: string, bridge: boolean): string[] | 'root' | 'unassigned' {
  if (/支腿|刚性腿|柔性腿/.test(text)) {
    if (bridge) return 'unassigned'
    if (/柔性腿/.test(text)) return ['structure.leg.flexible']
    if (/刚性腿|支腿顶部|支腿过渡/.test(text)) return ['structure.leg.rigid', 'structure.leg']
    return ['structure.leg']
  }
  if (/端梁/.test(text)) return ['structure.bridge.end-girder']
  if (/主梁|焊缝热点|翼缘|焊缝开裂/.test(text)) return ['structure.bridge.main-girder', 'structure.main-girder.front-girder', 'structure.main-girder']
  if (/小车架/.test(text)) return ['structure.hoisting-trolley.main-frame', 'structure.hoisting-trolley.upper-frame', 'structure.hoisting-trolley-frame']
  if (/减速机/.test(text)) return ['mechanism.main-hoist.drive.reducer', 'mechanism.upper-trolley-hoist.drive.reducer', 'mechanism.trolley-hoist.drive.reducer']
  if (/制动器/.test(text)) return ['mechanism.main-hoist.drive.brake', 'mechanism.upper-trolley-hoist.drive.brake', 'mechanism.trolley-hoist.drive.brake']
  if (/车轮|啃轨/.test(text)) return ['mechanism.crane-travel.trolley-frame.wheel-set', 'mechanism.travel.trolley-frame.wheel-set']
  if (/起重量超过|力矩百分比|起重力矩/.test(text)) return ['electrical.safety-protection.load-moment-limiter']
  if (/起升高度限位/.test(text)) return ['electrical.safety-protection.lifting-height-limit']
  if (/偏斜/.test(text)) return ['electrical.safety-protection.skew-indicator', 'electrical.safety-protection']
  if (/抗风防滑/.test(text)) return ['electrical.safety-protection.wind-skid-protection', 'electrical.safety-protection']
  if (/风速/.test(text)) return ['electrical.safety-protection.anemometer', 'electrical.safety-protection']
  return 'root'
}

function pointTarget(name: string, bridge: boolean): string[] | 'unassigned' {
  if (/刚性腿/.test(name)) return bridge ? 'unassigned' : ['structure.leg.rigid']
  if (/柔性腿/.test(name)) return bridge ? 'unassigned' : ['structure.leg.flexible']
  if (/支腿/.test(name)) return bridge ? 'unassigned' : ['structure.leg.rigid', 'structure.leg']
  if (/端梁/.test(name)) return ['structure.bridge.end-girder']
  if (/小车架/.test(name)) return ['structure.hoisting-trolley.main-frame', 'structure.hoisting-trolley.upper-frame']
  if (/主梁|焊缝热点|小车轨道梁/.test(name)) return ['structure.bridge.main-girder', 'structure.main-girder']
  if (/减速机/.test(name)) return ['mechanism.main-hoist.drive.reducer', 'mechanism.upper-trolley-hoist.drive.reducer']
  if (/制动器/.test(name)) return ['mechanism.main-hoist.drive.brake', 'mechanism.upper-trolley-hoist.drive.brake']
  if (/钢丝绳/.test(name)) return ['mechanism.main-hoist.rope-winding.wire-rope', 'mechanism.upper-trolley-hoist.rope-winding.wire-rope', 'mechanism.trolley-hoist.rope-winding.wire-rope']
  if (name.startsWith('主起电机')) return ['mechanism.main-hoist.drive.motor', 'mechanism.upper-trolley-hoist.drive.motor']
  if (name === '副起升电机' || name.includes('副起')) {
    if (/制动/.test(name)) return ['mechanism.auxiliary-hoist.drive.brake', 'mechanism.lower-trolley-hoist.drive.brake']
    if (/超速/.test(name)) return ['electrical.safety-protection.overspeed-protection']
    if (/上限|重锤/.test(name)) return ['electrical.safety-protection.lifting-height-limit']
    if (/下限/.test(name)) return ['electrical.safety-protection.lowering-depth-limit']
    return ['mechanism.auxiliary-hoist.drive.motor', 'mechanism.lower-trolley-hoist.drive.motor']
  }
  if (name.startsWith('大车电机')) return ['mechanism.crane-travel.drive.motor', 'mechanism.travel.drive.motor']
  if (name.startsWith('主小车电机')) return ['mechanism.trolley-travel.drive.motor', 'mechanism.upper-trolley-travel.drive.motor']
  if (name === '副小车电机') return ['mechanism.lower-trolley-travel.drive.motor']
  if (/超速/.test(name)) return ['electrical.safety-protection.overspeed-protection']
  if (/上限|重锤/.test(name)) return ['electrical.safety-protection.lifting-height-limit']
  if (/下限/.test(name)) return ['electrical.safety-protection.lowering-depth-limit']
  if (/限位/.test(name)) return ['electrical.safety-protection.travel-limit']
  if (/门开关/.test(name)) return ['electrical.safety-protection.interlock-protection']
  if (/大车/.test(name) && /车轮|轨/.test(name)) return ['mechanism.crane-travel.trolley-frame.wheel-set', 'mechanism.travel.trolley-frame.wheel-set']
  if (/小车/.test(name) && /车轮|侧/.test(name)) return ['mechanism.trolley-travel.trolley-frame.wheel-set', 'mechanism.upper-trolley-travel.trolley-frame.wheel-set']
  return 'unassigned'
}

function indexNodes(node: RawNode, index: Map<string, string>) {
  index.set(suffix(node.id), node.id)
  node.children?.forEach(child => indexNodes(child, index))
}

function toView(node: RawNode, depth: number, alarms: Map<string, OverviewAlarm[]>, points: Map<string, StructurePoint[]>): StructureNode {
  const children = (node.children ?? []).map(child => toView(child, depth + 1, alarms, points))
  const ownAlarms = alarms.get(node.id) ?? []
  const ownPoints = points.get(node.id) ?? []
  let lamp: LampLevel = 'normal'
  ownAlarms.forEach(alarm => { lamp = worse(lamp, alarm.level) })
  children.forEach(child => {
    if (child.lamp !== 'none') lamp = worse(lamp, child.lamp)
  })
  const pointRank = ownPoints.reduce((rank, point) => {
    if (point.status === 'danger') return '异常'
    if (point.status === 'warn' && rank !== '异常') return '预警'
    return rank
  }, '' as '' | '预警' | '异常')
  const services = new Set<OverviewServiceKey>(servicesFor(node.id))
  ownAlarms.forEach(alarm => services.add(alarm.serviceKey))
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    depth,
    lamp: lamp === 'normal' ? 'none' : lamp,
    alarmCount: ownAlarms.length,
    pointStatus: pointRank,
    points: ownPoints,
    services: [...services],
    alarms: ownAlarms,
    children
  }
}

function flattenAlarms(node: StructureNode, into: OverviewAlarm[]) {
  into.push(...node.alarms)
  node.children.forEach(child => flattenAlarms(child, into))
}

function flattenServices(node: StructureNode, into: Set<OverviewServiceKey>) {
  node.services.forEach(key => into.add(key))
  node.children.forEach(child => flattenServices(child, into))
}

export function subtreeAlarms(node: StructureNode): OverviewAlarm[] {
  const list: OverviewAlarm[] = []
  flattenAlarms(node, list)
  return list
}

export function subtreeServices(node: StructureNode): Set<OverviewServiceKey> {
  const set = new Set<OverviewServiceKey>()
  flattenServices(node, set)
  return set
}

export function findStructureNode(node: StructureNode, id: string): StructureNode | null {
  if (node.id === id) return node
  for (const child of node.children) {
    const found = findStructureNode(child, id)
    if (found) return found
  }
  return null
}

function pushPoint(bucket: Map<string, StructurePoint[]>, id: string, point: StructurePoint) {
  const list = bucket.get(id) ?? []
  list.push(point)
  bucket.set(id, list)
}

function placePoint(index: Map<string, string>, unassignedId: string, name: string, bridge: boolean, point: StructurePoint, bucket: Map<string, StructurePoint[]>) {
  const target = pointTarget(name, bridge)
  const id = target === 'unassigned' ? unassignedId : (resolveId(index, target) ?? unassignedId)
  pushPoint(bucket, id, point)
}

export function getDeviceStructure(device: DeviceInput): DeviceStructure {
  const cached = cache.get(device.id)
  if (cached) return cached

  const template = templateForType(device.type)
  const hasAuxHoist = device.capacityText.includes('/')
  const bridge = bridgeTemplate(template)
  let raw: RawNode
  if (template === 'QB') raw = qbTemplate(hasAuxHoist)
  else if (template === 'MG') raw = mgTemplate()
  else if (template === 'BR' || template === 'GA' || template === 'GE' || template === 'PT') raw = sourceTemplate(template)
  else {
    raw = { id: `device:${device.id}`, name: device.type || device.name || '设备', type: 'equipment', children: [] }
  }
  const pruned = prune(raw) ?? raw
  const rootId = pruned.id
  const unassignedId = `${rootId}.unassigned`
  const index = new Map<string, string>()
  indexNodes(pruned, index)

  const overview = getDeviceOverview(device.id)
  const alarmBucket = new Map<string, OverviewAlarm[]>()
  overview.alarms.forEach(alarm => {
    const target = alarmTarget(alarm.text, bridge || template === null)
    let id = rootId
    if (target === 'unassigned') id = unassignedId
    else if (target !== 'root') id = resolveId(index, target) ?? unassignedId
    const list = alarmBucket.get(id) ?? []
    list.push(alarm)
    alarmBucket.set(id, list)
  })

  const pointBucket = new Map<string, StructurePoint[]>()
  const monitoring = getRemoteMonitoringData({ id: device.id, riskLevel: device.riskLevel })
  if (monitoring) {
    const monitored: RemoteStatusItem[] = [
      ...monitoring.stress,
      ...monitoring.damage,
      ...monitoring.gearbox,
      ...monitoring.wheel.map((item, wheelIndex) => ({ ...item, label: WHEEL_PLACES[wheelIndex] ?? item.label })),
      ...monitoring.brake,
      ...monitoring.rope
    ]
    monitored.forEach(item => {
      placePoint(index, unassignedId, item.label, bridge || template === null, {
        name: item.label,
        value: item.value,
        status: item.status
      }, pointBucket)
    })
    monitoring.electricBoard.currents.forEach(row => {
      placePoint(index, unassignedId, row.motor, bridge || template === null, {
        name: row.motor,
        value: `${row.phaseA} / ${row.phaseB} / ${row.phaseC}`,
        status: 'reading'
      }, pointBucket)
    })
    monitoring.electricBoard.limits.forEach(item => {
      placePoint(index, unassignedId, item.label, bridge || template === null, {
        name: item.label,
        value: item.ok ? '正常' : '异常',
        status: item.ok ? 'normal' : 'danger'
      }, pointBucket)
    })
  }

  const unassignedPoints = pointBucket.get(unassignedId) ?? []
  const unassignedAlarms = alarmBucket.get(unassignedId) ?? []
  if (unassignedPoints.length || unassignedAlarms.length || template === null) {
    pruned.children = [
      { id: unassignedId, name: '未归属测点', type: 'unassigned', children: [] },
      ...(pruned.children ?? [])
    ]
  }

  const root = toView(pruned, 0, alarmBucket, pointBucket)
  if (overview.overall === 'normal') root.lamp = 'normal'
  else root.lamp = overview.overall

  const model: DeviceStructure = {
    template,
    templateLabel: template ? `${template} · ${pruned.name}` : '未匹配模板',
    rootId,
    root
  }
  cache.set(device.id, model)
  return model
}
