/**
 * 单台详情工作台。告警挂到部件，测点不进结构树。
 * 结构专业在已有结构告警的设备上补足到至少 3 条，只用于详情，不改总览灯。
 */
import { OVERVIEW_CARD_RULES } from '@/mock/overviewCardRules'
import type { OverviewAlarm, OverviewServiceKey } from '@/mock/overviewStatus'
import { OVERVIEW_SERVICES } from '@/mock/overviewStatus'
import type { StructureNode } from '@/mock/structureTree'
import { specialtyOfService, type Specialty } from '@/mock/alertSpecialty'

export interface WorkPart {
  id: string
  name: string
  specialty: Specialty
  depth: number
  systemName: string
}

export interface DetailAlert extends OverviewAlarm {
  partId: string
  partName: string
  pointIds: string[]
}

export interface WorkPoint {
  id: string
  name: string
  partId: string
  partName: string
  kind: 'measured' | 'twin'
  status: 'normal' | 'warn' | 'danger'
  value: string
  x: number
  y: number
}

export interface DeviceWorkbench {
  parts: WorkPart[]
  alerts: DetailAlert[]
  points: WorkPoint[]
}

const EXTRA_STRUCTURE: { match: string; key: OverviewServiceKey; text: string }[] = [
  { match: '端梁', key: 'healthMonitor', text: '端梁连接板应力测点升高，接近损伤阈值' },
  { match: '小车架', key: 'crack', text: '小车架铰点预计裂纹萌生约 14 个月' },
  { match: '平衡梁', key: 'health', text: '大车平衡梁疲劳损伤度升高，结构亚健康' },
  { match: '支腿', key: 'healthMonitor', text: '支腿过渡区应变读数偏高' },
  { match: '轨道', key: 'crack', text: '轨道压板附近出现裂纹扩展迹象' }
]

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619)
  return h >>> 0
}

function specialtyOfNode(id: string): Specialty | null {
  if (id.includes('.structure')) return 'structure'
  if (id.includes('.mechanism')) return 'mechanism'
  if (id.includes('.electrical')) return 'electric'
  return null
}

function isPartType(type: string) {
  return type === 'assembly' || type === 'component'
}

export function collectParts(root: StructureNode): WorkPart[] {
  const parts: WorkPart[] = []
  root.children.forEach(category => {
    const specialty = specialtyOfNode(category.id)
    if (!specialty || category.type === 'unassigned') return
    const walk = (node: StructureNode, systemName: string, depth: number) => {
      const nextSystem = node.type === 'system' ? node.name : systemName
      if (isPartType(node.type)) {
        parts.push({ id: node.id, name: node.name, specialty, depth, systemName: nextSystem })
        return
      }
      if (!node.children.length && node.type === 'system') {
        parts.push({ id: node.id, name: node.name, specialty, depth, systemName: node.name })
        return
      }
      node.children.forEach(child => walk(child, nextSystem, depth + 1))
    }
    category.children.forEach(child => walk(child, child.name, 0))
  })
  return parts
}

function findNode(root: StructureNode, alarmId: string): StructureNode | null {
  if (root.alarms.some(alarm => alarm.id === alarmId)) return root
  for (const child of root.children) {
    const found = findNode(child, alarmId)
    if (found) return found
  }
  return null
}

function partForNode(node: StructureNode | null, parts: WorkPart[]): WorkPart | undefined {
  if (!node) return undefined
  return parts.find(part => part.id === node.id || node.id.startsWith(`${part.id}.`) || part.id.startsWith(`${node.id}.`))
}

function olderTime(time: string, hours: number): string {
  const match = time.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/)
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]))
    : new Date(2026, 9, 20, 8, 0)
  date.setHours(date.getHours() - hours)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function serviceLabel(key: OverviewServiceKey) {
  return OVERVIEW_SERVICES.find(item => item.key === key)?.label || key
}

function supplementStructure(deviceId: string, alerts: DetailAlert[], parts: WorkPart[]) {
  const structure = alerts.filter(alarm => specialtyOfService(alarm.serviceKey) === 'structure')
  if (!structure.length || structure.length >= 3) return
  const used = new Set(structure.map(alarm => alarm.partId))
  const pool = parts.filter(part => part.specialty === 'structure' && !used.has(part.id))
  const picked: WorkPart[] = []
  EXTRA_STRUCTURE.forEach(item => {
    if (picked.length >= 3 - structure.length) return
    const found = pool.find(part => part.name.includes(item.match) && !picked.includes(part))
    if (found) picked.push(found)
  })
  pool.forEach(part => {
    if (picked.length >= 3 - structure.length) return
    if (!picked.includes(part)) picked.push(part)
  })
  const newest = structure.map(alarm => alarm.time).sort().at(-1) || '2026-10-20 08:00'
  picked.forEach((part, index) => {
    const preset = EXTRA_STRUCTURE.find(item => part.name.includes(item.match))
    const key = preset?.key || (index % 2 === 0 ? 'healthMonitor' : 'crack')
    alerts.push({
      id: `${deviceId}-struct-extra-${index}`,
      time: olderTime(newest, (index + 1) * 5),
      serviceKey: key,
      serviceLabel: serviceLabel(key),
      level: 'yellow',
      text: preset?.text || `${part.name}结构状态需复核`,
      accident: '焊缝开裂',
      partId: part.id,
      partName: part.name,
      pointIds: []
    })
  })
}

function pointStatus(seed: number, hot: boolean): WorkPoint['status'] {
  const roll = seed % 100
  if (hot && roll < 18) return 'danger'
  if (roll < (hot ? 36 : 8)) return 'warn'
  if (!hot && roll < 14) return 'warn'
  return 'normal'
}

function pointValue(specialty: Specialty | null, seed: number, status: WorkPoint['status']) {
  if (specialty === 'mechanism') return status === 'danger' ? `${70 + seed % 25} °C` : `${35 + seed % 20} °C`
  if (specialty === 'electric') return status === 'normal' ? '正常' : '异常'
  return `${80 + seed % 80} με`
}

export function buildWorkbench(deviceId: string, root: StructureNode, alarms: OverviewAlarm[]): DeviceWorkbench {
  const parts = collectParts(root)
  const detail: DetailAlert[] = alarms.map(alarm => {
    const node = findNode(root, alarm.id)
    const part = partForNode(node, parts)
    return {
      ...alarm,
      partId: part?.id || '',
      partName: part?.name || '未归属',
      pointIds: []
    }
  })
  supplementStructure(deviceId, detail, parts)

  const measuredTarget = OVERVIEW_CARD_RULES.detailMeasuredPoints
  const twinTarget = OVERVIEW_CARD_RULES.detailTwinPoints
  const points: WorkPoint[] = []
  const hosts = parts.length ? parts : [{ id: `${deviceId}:body`, name: '设备本体', specialty: 'structure' as Specialty, depth: 0, systemName: '设备本体' }]
  if (!parts.length) parts.push(hosts[0])

  for (let index = 0; index < measuredTarget; index += 1) {
    const part = hosts[index % hosts.length]
    const seed = hash(`${deviceId}:measured:${index}`)
    const hot = detail.some(alarm => alarm.partId === part.id)
    const status = pointStatus(seed, hot)
    const point: WorkPoint = {
      id: `${deviceId}-m-${index}`,
      name: `${part.name}实测${index + 1}`,
      partId: part.id,
      partName: part.name,
      kind: 'measured',
      status,
      value: pointValue(part.specialty, seed, status),
      x: 12 + (seed % 76),
      y: 18 + ((seed >> 3) % 64)
    }
    points.push(point)
  }

  const unassigned = Math.round(twinTarget * 0.08)
  for (let index = 0; index < twinTarget; index += 1) {
    const seed = hash(`${deviceId}:twin:${index}`)
    const loose = index < unassigned
    const part = loose ? null : hosts[seed % hosts.length]
    const status = pointStatus(seed >> 2, false)
    points.push({
      id: `${deviceId}-t-${index}`,
      name: loose ? `未归属孪生${index + 1}` : `${part!.name}孪生${(index % 9) + 1}`,
      partId: part?.id || '',
      partName: part?.name || '未归属',
      kind: 'twin',
      status,
      value: pointValue(part?.specialty || null, seed, status),
      x: 8 + (seed % 84),
      y: 12 + ((seed >> 4) % 72)
    })
  }

  detail.forEach(alarm => {
    const onPart = points.filter(point => point.partId === alarm.partId && point.kind === 'measured')
    alarm.pointIds = onPart.slice(0, 2).map(point => point.id)
  })

  return { parts, alerts: detail, points }
}

const cache = new Map<string, DeviceWorkbench>()

export function getDeviceWorkbench(deviceId: string, root: StructureNode, alarms: OverviewAlarm[]): DeviceWorkbench {
  const hit = cache.get(deviceId)
  if (hit) return hit
  const model = buildWorkbench(deviceId, root, alarms)
  cache.set(deviceId, model)
  return model
}
