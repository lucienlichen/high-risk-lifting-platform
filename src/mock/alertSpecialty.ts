/**
 * 单台设备页按告警专业分栏。
 * 健康监测 / 健康评估 / 裂纹预测 → 结构
 * 故障诊断 → 机构
 * 安全监控 → 电控
 * 风险定量评估、检验 → 其他
 */
import type { OverviewAlarm, OverviewServiceKey } from '@/mock/overviewStatus'
import type { StructureNode } from '@/mock/structureTree'

export type Specialty = 'structure' | 'mechanism' | 'electric' | 'other'

export const SPECIALTIES: { id: Specialty; label: string }[] = [
  { id: 'structure', label: '结构' },
  { id: 'mechanism', label: '机构' },
  { id: 'electric', label: '电控' },
  { id: 'other', label: '其他' }
]

const SERVICE_SPECIALTY: Record<OverviewServiceKey, Specialty> = {
  healthMonitor: 'structure',
  health: 'structure',
  crack: 'structure',
  fault: 'mechanism',
  safety: 'electric',
  risk: 'other'
}

const SOURCE: Record<OverviewServiceKey, string> = {
  healthMonitor: '日常监控',
  health: '健康评估模型',
  crack: '裂纹预测模型',
  fault: '故障诊断',
  safety: '安全监控',
  risk: '风险定量评估'
}

export function specialtyOfService(key: OverviewServiceKey): Specialty {
  return SERVICE_SPECIALTY[key]
}

export function specialtyLabel(id: Specialty): string {
  return SPECIALTIES.find(item => item.id === id)?.label || id
}

export function alertSource(key: OverviewServiceKey): string {
  return SOURCE[key]
}

export function latestAlert(alarms: OverviewAlarm[]): OverviewAlarm | null {
  if (!alarms.length) return null
  return [...alarms].sort((a, b) => b.time.localeCompare(a.time))[0]
}

export function servicesForSpecialty(id: Specialty): OverviewServiceKey[] {
  return (Object.keys(SERVICE_SPECIALTY) as OverviewServiceKey[]).filter(key => SERVICE_SPECIALTY[key] === id)
}

function holds(node: StructureNode, alarmId: string): boolean {
  if (node.alarms.some(alarm => alarm.id === alarmId)) return true
  return node.children.some(child => holds(child, alarmId))
}

export function alertNode(root: StructureNode, alarmId: string): StructureNode | null {
  if (holds(root, alarmId) && root.alarms.some(alarm => alarm.id === alarmId) && root.children.every(child => !holds(child, alarmId))) {
    return root
  }
  const walk = (node: StructureNode): StructureNode | null => {
    if (node.alarms.some(alarm => alarm.id === alarmId)) return node
    for (const child of node.children) {
      const found = walk(child)
      if (found) return found
    }
    return null
  }
  const found = walk(root)
  return found && found.id !== root.id ? found : found
}

export interface ModelRow {
  id: string
  name: string
  depth: number
  hit: boolean
  dim: boolean
}

function categoryNode(root: StructureNode, specialty: Specialty): StructureNode | null {
  const token = specialty === 'structure' ? '.structure' : specialty === 'mechanism' ? '.mechanism' : specialty === 'electric' ? '.electrical' : ''
  if (!token) return null
  return root.children.find(child => child.type !== 'unassigned' && child.id.includes(token)) ?? null
}

/** 只展开当前专业的一层系统；告警所在分支再展开到挂点。 */
export function specialtyRows(root: StructureNode, specialty: Specialty, alertId: string): ModelRow[] {
  if (specialty === 'other') {
    const hitRisk = alertId.endsWith('-risk')
    return [
      { id: 'other-risk', name: '风险定量评估', depth: 0, hit: hitRisk, dim: !!alertId && !hitRisk },
      { id: 'other-inspect', name: '定期检验', depth: 0, hit: false, dim: !!alertId }
    ]
  }
  const category = categoryNode(root, specialty)
  if (!category) return []
  const rows: ModelRow[] = []
  category.children.forEach(child => {
    const onPath = holds(child, alertId)
    rows.push({ id: child.id, name: child.name, depth: 0, hit: child.id === alertId, dim: !!alertId && !onPath })
    if (!onPath) return
    child.children.forEach(grand => {
      const grandPath = holds(grand, alertId)
      rows.push({ id: grand.id, name: grand.name, depth: 1, hit: grand.id === alertId, dim: !!alertId && !grandPath })
      if (!grandPath || grand.id === alertId) return
      grand.children.forEach(part => {
        const partPath = holds(part, alertId)
        rows.push({ id: part.id, name: part.name, depth: 2, hit: part.id === alertId, dim: !!alertId && !partPath })
      })
    })
  })
  return rows
}
