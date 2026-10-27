/**
 * 概览三页的展示模型。
 * 整机状态是异常 / 正常 / 离线。异常 = 结构、机构或其他预警，或定期检验已超期。
 * 阈值在 overviewCardRules.ts。
 */
import { getDevices, type Device, type DeviceStatus } from '@/mock'
import type { DemoDeviceRecord } from '@/mock/demoDeviceRecords'
import { SHAGANG_LEGAL_ENTITY, shagangDeviceRecords } from '@/mock/shagangDevices'
import yonggangUnitMap from '@/mock/yonggangUnitMap.json'
import { getInspectionRows } from '@/mock/serviceData'
import { ALARM_FALLBACK, OVERVIEW_CARD_RULES } from '@/mock/overviewCardRules'
import { getOperationList } from '@/mock/remoteMonitoring'
import { alarmTopGroup, getDeviceStructure } from '@/mock/structureTree'
import {
  getDeviceOverview,
  type DeviceOverview,
  type LampLevel,
  type OverviewAlarm,
  type OverviewServiceKey
} from '@/mock/overviewStatus'
import type { ServiceKey } from '@/components/serviceCatalog'

export type CardState = 'abnormal' | 'normal' | 'off'
export type RunState = 'running' | 'stopped'
export type AlarmBucket = 'structure' | 'mechanism' | 'other'

export interface CountCell {
  label: string
  n: number
  tone: 'hot' | 'due' | 'muted'
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
  /** 作业中 / 停机 / 离线 */
  workLabel: string
  /** 在线时的作业状态。离线为 null。 */
  run: RunState | null
  /** 卡片徽标：离线优先，否则异常或正常。 */
  state: CardState
  /** 不含离线。预警或检验超期即为异常。 */
  machine: 'abnormal' | 'normal'
  lamp: LampLevel
  scene: string
  message: string
  loadPct: number | null
  curTons: number | null
  health: number
  riskLevel: Device['riskLevel']
  inspDays: number | null
  inspRemind: boolean
  inspOverdue: boolean
  todayLifts: number | null
  totalLifts: number | null
  liftAvg: number
  counts: CountCell[]
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

function hashId(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return h >>> 0
}

function deviceFromShagang(record: DemoDeviceRecord): Device {
  const n = hashId(record.id)
  const running = n % 100 < 85
  return {
    id: record.id,
    name: record.name,
    code: record.code,
    type: record.type,
    scene: 'metallurgy',
    status: running ? 'running' : 'standby',
    riskLevel: 'normal',
    latestAlarmTime: null,
    online: record.statusText !== '停用',
    healthScore: 80 + (n % 20),
    load: running ? 20 + (n % 70) : 0,
    operatingHours: 200 + (n % 30000),
    manufacturer: record.manufacturer || '未登记',
    installDate: record.installDate || '未登记',
    location: record.location || record.workArea,
    group: record.enterprise,
    subsidiary: record.workArea,
    enterprise: record.enterprise,
    affiliatedUnit: record.affiliatedUnit,
    workArea: record.workArea,
    technicalParams: record.technicalParams
  }
}

function yonggangUnit(device: Device) {
  const map = yonggangUnitMap as Record<string, string>
  const byLocation = device.location ? map[device.location] : undefined
  const byWork = device.workArea ? map[device.workArea] : undefined
  if (byLocation && byLocation !== '未标明厂区') return byLocation
  if (byWork && byWork !== '未标明厂区') return byWork
  return byLocation || byWork || '未标明厂区'
}

export function getOverviewCards(): OverviewCard[] {
  if (cache) return cache
  const ledger = getDevices('metallurgy', 1, 99999).list.filter(device =>
    (device.enterprise === BENGANG && device.affiliatedUnit === '板材板块')
    || device.enterprise === YONGGANG
  )
  const devices = [...ledger, ...shagangDeviceRecords.map(deviceFromShagang)]
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

export function levelText(state: CardState): string {
  if (state === 'abnormal') return '异常'
  if (state === 'off') return '离线'
  return '正常'
}

function fallbackGroup(alarm: OverviewAlarm): AlarmBucket {
  if ((ALARM_FALLBACK.otherServices as readonly string[]).includes(alarm.serviceKey)) return 'other'
  if (ALARM_FALLBACK.structureWords.test(alarm.text)) return 'structure'
  if (ALARM_FALLBACK.mechanismWords.test(alarm.text)) return 'mechanism'
  if ((ALARM_FALLBACK.structureServices as readonly string[]).includes(alarm.serviceKey)) return 'structure'
  if ((ALARM_FALLBACK.mechanismServices as readonly string[]).includes(alarm.serviceKey)) return 'mechanism'
  return 'other'
}

function countCell(label: string, n: number, kind: 'hot' | 'due'): CountCell {
  return { label, n, tone: n > 0 ? kind : 'muted' }
}

function commissioningTime(installDate: string, id: string): number {
  const full = installDate?.match(/((?:19|20)\d{2})-(\d{2})-(\d{2})/)
  if (full) return new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3])).getTime()
  const year = installDate?.match(/(?:19|20)\d{2}/)
  if (year) return new Date(Number(year[0]), 0, 1).getTime()
  const n = hashId(`${id}:commission`)
  return new Date(1998 + (n % 22), n % 12, 1 + (n % 28)).getTime()
}

function liftStats(id: string, installDate: string, online: boolean) {
  const tenths = Math.round(OVERVIEW_CARD_RULES.liftDailySpan * 10)
  const avg = Math.round((OVERVIEW_CARD_RULES.liftDailyMin + (hashId(`${id}:lift-avg`) % (tenths + 1)) / 10) * 10) / 10
  const today = online ? getOperationList(id, new Date()).length : null
  if (!online || today == null) return { today, total: null as number | null, avg }
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const days = Math.max(1, Math.round((start.getTime() - commissioningTime(installDate, id)) / 86400000))
  return { today, total: Math.max(today, Math.round(days * avg)), avg }
}

function toCard(device: Device, inspect?: { daysUntil: number; status: string }): OverviewCard {
  const overview = getDeviceOverview(device.id)
  const capacity = capacityText(device)
  const structure = getDeviceStructure({
    id: device.id,
    name: device.name,
    type: device.type,
    capacityText: capacity,
    riskLevel: device.riskLevel
  })
  const groups: Record<AlarmBucket, number> = { structure: 0, mechanism: 0, other: 0 }
  overview.alarms.forEach(alarm => {
    const top = alarmTopGroup(structure.root, alarm.id)
    groups[top === 'fallback' ? fallbackGroup(alarm) : top] += 1
  })
  const days = inspect ? inspect.daysUntil : null
  const inspRemind = days != null && days <= OVERVIEW_CARD_RULES.inspectionRemindWithinDays
  const inspOverdue = days != null && days < OVERVIEW_CARD_RULES.inspectionOverdueBelowDays
  const alarmAbnormal = groups.structure + groups.mechanism + groups.other > 0
  const machine: 'abnormal' | 'normal' = alarmAbnormal || (inspOverdue && OVERVIEW_CARD_RULES.overdueCountsAsAbnormal) ? 'abnormal' : 'normal'
  const state: CardState = device.online ? machine : 'off'
  const lamp = overview.overall
  const leading = overview.services.find(service => service.level === lamp && service.level !== 'normal')
  const rated = ratedTons(device)
  const loadPct = device.status === 'running' ? device.load : device.online ? 0 : null
  const lifts = liftStats(device.id, device.installDate, device.online)
  const hasRed = overview.alarms.some(alarm => alarm.level === 'red')
  const hasYellow = overview.alarms.some(alarm => alarm.level === 'yellow')
  const order = state === 'off' ? 3 : machine === 'normal' ? 4 : hasRed ? 0 : hasYellow ? 1 : 2
  return {
    id: device.id,
    code: device.code,
    name: device.name,
    type: device.type,
    capacityText: capacity,
    ratedTons: rated,
    spanText: paramText(device, ['跨度']),
    classText: paramText(device, ['工作级别']),
    yearText: yearText(device.installDate),
    enterprise: device.enterprise || '',
    enterpriseLabel: enterpriseLabel(device.enterprise || ''),
    sector: device.enterprise === BENGANG ? (device.affiliatedUnit || '') : '',
    unit: device.enterprise === YONGGANG ? yonggangUnit(device) : (device.workArea || device.affiliatedUnit || '未分组'),
    location: device.location || '',
    online: device.online,
    workLabel: workLabel(device.status, device.online),
    run: device.online ? (device.status === 'running' ? 'running' : 'stopped') : null,
    state,
    machine,
    lamp,
    scene: overview.accident || '',
    message: leading?.reason || '',
    loadPct,
    curTons: rated != null && loadPct != null ? Math.round(rated * loadPct) / 100 : null,
    health: device.healthScore,
    riskLevel: device.riskLevel,
    inspDays: days,
    inspRemind,
    inspOverdue,
    todayLifts: lifts.today,
    totalLifts: lifts.total,
    liftAvg: lifts.avg,
    counts: [
      countCell('结构预警', groups.structure, 'hot'),
      countCell('机构预警', groups.mechanism, 'hot'),
      countCell('其他预警', groups.other, 'hot'),
      countCell('检验提醒', inspRemind ? 1 : 0, 'due')
    ],
    overview,
    order
  }
}

function workLabel(status: DeviceStatus, online: boolean): string {
  if (!online) return '离线'
  if (status === 'running') return '作业中'
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
  abnormal: number
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
      abnormal: 0,
      off: 0,
      online: 0
    }
    row.total += 1
    if (card.state === 'abnormal') row.abnormal += 1
    else if (card.state === 'off') row.off += 1
    if (card.online) row.online += 1
    map.set(key, row)
  })
  return [...map.values()]
}

export function worstUnit(cards: OverviewCard[], enterprise: string): string {
  const rows = rollupUnits(cards.filter(card => card.enterprise === enterprise))
  rows.sort((a, b) => b.abnormal - a.abnormal || b.total - a.total || a.unit.localeCompare(b.unit, 'zh-CN'))
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
