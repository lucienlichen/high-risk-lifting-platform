/**
 * 概览三页的展示模型。
 * 设备来自冶金台账，红黄来自 overviewStatus 的草案规则。
 * 不使用设计稿里的占位编号、条数和告警文案。
 */
import { getDevices, type Device, type DeviceStatus } from '@/mock'
import { SHAGANG_LEGAL_ENTITY } from '@/mock/shagangDevices'
import { getInspectionRows } from '@/mock/serviceData'
import {
  getDeviceOverview,
  lampLabel,
  type DeviceOverview,
  type LampLevel,
  type OverviewAlarm,
  type OverviewServiceKey
} from '@/mock/overviewStatus'
import type { ServiceKey } from '@/components/serviceCatalog'

export type CardLevel = 'red' | 'yellow' | 'off' | 'normal'

export interface CountCell {
  label: string
  n: number
  tone: 'red' | 'yellow' | 'muted'
}

export interface OverviewCard {
  id: string
  code: string
  name: string
  type: string
  capacityText: string
  ratedTons: number | null
  spanText: string
  classText: string
  yearText: string
  enterprise: string
  enterpriseLabel: string
  sector: string
  unit: string
  location: string
  online: boolean
  workLabel: string
  level: CardLevel
  lamp: LampLevel
  scene: string
  message: string
  loadPct: number | null
  curTons: number | null
  health: number
  riskLevel: Device['riskLevel']
  inspDays: number | null
  inspStatus: string
  counts: CountCell[]
  safeText: string
  overview: DeviceOverview
  order: number
}

export const BENGANG = '本钢集团'
export const YONGGANG = '江苏永钢集团有限公司'
export const SHAGANG = '沙钢'

const SERVICE_PAGE: Record<OverviewServiceKey, ServiceKey> = {
  safety: 'remote',
  healthMonitor: 'healthMonitor',
  health: 'health',
  crack: 'crack',
  fault: 'fault',
  risk: 'risk'
}

let cache: OverviewCard[] | null = null

export function getOverviewCards(): OverviewCard[] {
  if (cache) return cache
  const devices = getDevices('metallurgy', 1, 99999).list.filter(device =>
    (device.enterprise === BENGANG && device.affiliatedUnit === '板材板块')
    || device.enterprise === YONGGANG
    || device.enterprise === SHAGANG
  )
  const inspect = new Map(getInspectionRows(devices.map(device => ({ id: device.id, name: device.name })), 'inspection').map(row => [row.deviceId, row]))
  cache = devices.map(device => toCard(device, inspect.get(device.id)))
  return cache
}

export function getOverviewCard(id: string): OverviewCard | null {
  return getOverviewCards().find(card => card.id === id) ?? null
}

export function servicePageKey(key: OverviewServiceKey): ServiceKey {
  return SERVICE_PAGE[key]
}

export function enterpriseLabel(enterprise: string): string {
  if (enterprise === BENGANG) return '本钢集团'
  if (enterprise === YONGGANG) return '江苏永钢集团'
  if (enterprise === SHAGANG) return '沙钢'
  return enterprise
}

export function levelText(level: CardLevel): string {
  if (level === 'red') return '红色预警'
  if (level === 'yellow') return '黄色报警'
  if (level === 'off') return '离线'
  return '正常'
}

function toCard(device: Device, inspect?: { daysUntil: number; status: string }): OverviewCard {
  const overview = getDeviceOverview(device.id)
  const lamp = overview.overall
  const level: CardLevel = lamp === 'red' ? 'red' : lamp === 'yellow' ? 'yellow' : device.online ? 'normal' : 'off'
  const leading = overview.services.find(service => service.level === lamp && service.level !== 'normal')
  const safety = overview.services.find(service => service.key === 'safety')
  const rated = ratedTons(device)
  const loadPct = device.status === 'running' ? device.load : device.online ? 0 : null
  const counts = countCells(overview)
  return {
    id: device.id,
    code: device.code,
    name: device.name,
    type: device.type,
    capacityText: capacityText(device),
    ratedTons: rated,
    spanText: paramText(device, ['跨度']),
    classText: paramText(device, ['工作级别']),
    yearText: yearText(device.installDate),
    enterprise: device.enterprise || '',
    enterpriseLabel: enterpriseLabel(device.enterprise || ''),
    sector: device.enterprise === BENGANG ? (device.affiliatedUnit || '') : '',
    unit: device.workArea || device.affiliatedUnit || '未分组',
    location: device.location || '',
    online: device.online,
    workLabel: workLabel(device.status, device.online),
    level,
    lamp,
    scene: overview.accident || '',
    message: leading?.reason || '',
    loadPct,
    curTons: rated != null && loadPct != null ? Math.round(rated * loadPct) / 100 : null,
    health: device.healthScore,
    riskLevel: device.riskLevel,
    inspDays: inspect ? inspect.daysUntil : null,
    inspStatus: inspect?.status || '',
    counts,
    safeText: !safety || safety.level === 'normal' ? '正常' : lampLabel(safety.level),
    overview,
    order: level === 'red' ? 0 : level === 'yellow' ? 1 : level === 'off' ? 2 : 3
  }
}

function countCells(overview: DeviceOverview): CountCell[] {
  const pick = (key: OverviewServiceKey, label: string): CountCell => {
    const service = overview.services.find(item => item.key === key)
    const on = !!service && service.level !== 'normal'
    return { label, n: on ? 1 : 0, tone: !on ? 'muted' : service!.level === 'red' ? 'red' : 'yellow' }
  }
  return [
    pick('healthMonitor', '监测预警'),
    pick('health', '健康评估'),
    pick('crack', '裂纹预测'),
    pick('fault', '故障诊断')
  ]
}

function workLabel(status: DeviceStatus, online: boolean): string {
  if (!online) return '离线'
  if (status === 'running') return '作业中'
  if (status === 'standby') return '待机'
  if (status === 'maintenance') return '检修'
  return '停机'
}

function paramText(device: Device, names: string[]): string {
  const value = device.technicalParams?.find(item => names.includes(item.name))?.value?.trim()
  return value || '—'
}

function capacityText(device: Device): string {
  const raw = device.technicalParams?.find(item => item.name === '额定起重量' || item.name === '起重量')?.value?.trim()
  if (!raw) return '—'
  return /t|吨/i.test(raw) ? raw.replace('吨', 't') : `${raw}t`
}

function ratedTons(device: Device): number | null {
  const raw = capacityText(device)
  const value = parseFloat(raw)
  return Number.isFinite(value) ? value : null
}

function yearText(installDate: string): string {
  const year = installDate?.match(/20\d{2}|19\d{2}/)
  if (year) return year[0]
  if (!installDate || installDate.includes('未')) return '—'
  return installDate
}

export interface UnitRollup {
  enterprise: string
  sector: string
  unit: string
  total: number
  red: number
  yellow: number
  off: number
  online: number
}

export function rollupUnits(cards: OverviewCard[]): UnitRollup[] {
  const map = new Map<string, UnitRollup>()
  cards.forEach(card => {
    const key = `${card.enterprise}::${card.unit}`
    const row = map.get(key) ?? {
      enterprise: card.enterprise,
      sector: card.sector,
      unit: card.unit,
      total: 0,
      red: 0,
      yellow: 0,
      off: 0,
      online: 0
    }
    row.total += 1
    if (card.level === 'red') row.red += 1
    else if (card.level === 'yellow') row.yellow += 1
    else if (card.level === 'off') row.off += 1
    if (card.online) row.online += 1
    map.set(key, row)
  })
  return [...map.values()]
}

export function worstUnit(cards: OverviewCard[], enterprise: string): string {
  const rows = rollupUnits(cards.filter(card => card.enterprise === enterprise))
  rows.sort((a, b) => b.red - a.red || b.yellow - a.yellow || b.total - a.total || a.unit.localeCompare(b.unit, 'zh-CN'))
  return rows[0]?.unit || ''
}

export function sortCards(cards: OverviewCard[]): OverviewCard[] {
  return [...cards].sort((a, b) => a.order - b.order || a.code.localeCompare(b.code, 'zh-CN'))
}

export function primaryAlarm(card: OverviewCard): OverviewAlarm | null {
  return card.overview.alarms[0] ?? null
}

export function legalHint(enterprise: string): string {
  if (enterprise === SHAGANG) return SHAGANG_LEGAL_ENTITY
  if (enterprise === YONGGANG) return '江苏永钢集团有限公司'
  if (enterprise === BENGANG) return '只含板材板块'
  return ''
}
