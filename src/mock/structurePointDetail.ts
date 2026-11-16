/** 结构点位详情演示数据。数值均为示意，不是实时监测或计算结果。 */

export type GlobalStatus = 'ok' | 'warn' | 'alarm'
export type SvcId = 'health' | 'crack' | 'ae' | 'eddy'
export type Beam = 'A梁' | 'B梁'
export type ModelMode = 'model' | 'cloud'
export type ModalView = 'current' | 'alarm'
export type GradeKey = 'ok' | 'sub' | 'pending'

export interface StructurePoint {
  id: string
  loc: string
  beam: Beam
  x: number
  y: number
  z: 'top' | 'bot'
  D: number
  L: number
  s: number
  ae: number
  status: GlobalStatus
  aeActive?: boolean
}

export interface AlarmRecord {
  id: string
  pid: string
  svc: SvcId
  level: GlobalStatus
  from: string
  to: string
  title: string
  note: string
}

export interface DemoRecord {
  t: number
  item: string
  val: string
  n?: number
  hit?: boolean
  extra?: string
}

export interface DemoSeries {
  x: number[]
  y: number[]
  recs: DemoRecord[]
  unit: string
  name: string
  th?: number
}

export interface SeriesQuery {
  view: ModalView
  alarm: AlarmRecord | null
  modal: SvcId
}

export interface ServiceCardModel {
  id: SvcId
  name: string
  badge: string
  badgeTone: GradeKey | GlobalStatus
  kpis: { label: string; value: string; small?: boolean; tone?: 'ex-red' | 'ex-orange' }[]
  note?: string
  bar?: number
  conclusion: string
  abnormal: boolean
  pending: boolean
  basis: string
}

export const TZ = 'America/Araguaina，UTC-3'
export const DEMO_AS_OF = `2026-11-16 04:00（${TZ}）`
export const CUR_FROM = '2026-11-15T04:00'
export const CUR_TO = '2026-11-16T04:00'

export const STRUCTURE_POINTS: StructurePoint[] = [
  { id: 'ML-01', loc: 'A梁跨中上翼缘', beam: 'A梁', x: 440, y: 115, z: 'top', D: 0.62, L: 5.4, s: 96, ae: 31, status: 'ok' },
  { id: 'ML-02', loc: 'A梁跨中下翼缘', beam: 'A梁', x: 440, y: 115, z: 'bot', D: 0.58, L: 5.9, s: 102, ae: 46, status: 'warn', aeActive: true },
  { id: 'ML-03', loc: 'A梁1/4跨上翼缘', beam: 'A梁', x: 250, y: 115, z: 'top', D: 0.45, L: 7.4, s: 74, ae: 28, status: 'ok' },
  { id: 'ML-04', loc: 'A梁1/4跨下翼缘', beam: 'A梁', x: 250, y: 115, z: 'bot', D: 0.48, L: 7.1, s: 79, ae: 29, status: 'ok' },
  { id: 'ML-05', loc: 'A梁3/4跨上翼缘', beam: 'A梁', x: 640, y: 115, z: 'top', D: 0.47, L: 7.2, s: 76, ae: 28, status: 'ok' },
  { id: 'ML-06', loc: 'A梁3/4跨下翼缘', beam: 'A梁', x: 640, y: 115, z: 'bot', D: 0.82, L: 3.2, s: 88, ae: 32, status: 'ok' },
  { id: 'ML-07', loc: 'A梁左端头焊缝', beam: 'A梁', x: 90, y: 115, z: 'top', D: 0.40, L: 8.1, s: 52, ae: 26, status: 'ok' },
  { id: 'ML-08', loc: 'A梁右端头焊缝', beam: 'A梁', x: 800, y: 115, z: 'top', D: 0.41, L: 8.0, s: 50, ae: 26, status: 'ok' },
  { id: 'ML-09', loc: 'B梁跨中上翼缘', beam: 'B梁', x: 440, y: 245, z: 'top', D: 0.55, L: 6.2, s: 90, ae: 30, status: 'ok' },
  { id: 'ML-10', loc: 'B梁跨中下翼缘', beam: 'B梁', x: 440, y: 245, z: 'bot', D: 0.82, L: 3.1, s: 94, ae: 33, status: 'ok' },
  { id: 'ML-11', loc: 'B梁1/4跨上翼缘', beam: 'B梁', x: 250, y: 245, z: 'top', D: 0.43, L: 7.6, s: 71, ae: 27, status: 'ok' },
  { id: 'ML-12', loc: 'B梁1/4跨下翼缘', beam: 'B梁', x: 250, y: 245, z: 'bot', D: 0.46, L: 7.3, s: 77, ae: 28, status: 'ok' },
  { id: 'ML-13', loc: 'B梁3/4跨上翼缘', beam: 'B梁', x: 640, y: 245, z: 'top', D: 0.44, L: 7.5, s: 73, ae: 27, status: 'ok' },
  { id: 'ML-14', loc: 'B梁3/4跨下翼缘', beam: 'B梁', x: 640, y: 245, z: 'bot', D: 0.49, L: 7.0, s: 80, ae: 29, status: 'ok' },
  { id: 'ML-15', loc: 'B梁左端头焊缝', beam: 'B梁', x: 90, y: 245, z: 'top', D: 0.38, L: 8.3, s: 48, ae: 25, status: 'ok' },
  { id: 'ML-16', loc: 'B梁右端头焊缝', beam: 'B梁', x: 800, y: 245, z: 'top', D: 0.39, L: 8.2, s: 49, ae: 25, status: 'ok' }
]

export const ALARMS: AlarmRecord[] = [
  {
    id: 'AE-001', pid: 'ML-02', svc: 'ae', level: 'warn', from: '2026-11-14T15:42', to: '2026-11-14T16:18',
    title: '声发射活性升高，存在活跃扩展迹象',
    note: '撞击数与幅值在该时段同步抬升。此为损伤活性诊断事件，与损伤度阈值无关。'
  },
  {
    id: 'AE-002', pid: 'ML-02', svc: 'ae', level: 'warn', from: '2026-11-10T09:05', to: '2026-11-10T09:40',
    title: '声发射撞击数短时增多（随后回落）',
    note: '回看该时段可见幅值短时偏高，之后恢复。独立事件，与损伤度阈值无关。'
  },
  {
    id: 'AE-003', pid: 'ML-10', svc: 'ae', level: 'warn', from: '2026-11-08T20:12', to: '2026-11-08T20:36',
    title: '声发射幅值短时偏高（已恢复）',
    note: '该点位当前全局状态为正常。本条仅用于回看历史异常时段。'
  }
]

export const SERVICES: { id: SvcId; name: string; basis: string }[] = [
  { id: 'health', name: '健康评估', basis: '应力监测数据（演示）' },
  { id: 'crack', name: '裂纹预测', basis: '应力监测数据（演示）' },
  { id: 'ae', name: '损伤活性诊断', basis: '声发射监测数据（演示）' },
  { id: 'eddy', name: '裂纹判别', basis: '涡流监测数据（演示）' }
]

export function structurePoint(id: string) {
  return STRUCTURE_POINTS.find(point => point.id === id) || STRUCTURE_POINTS[0]
}

export function statusName(key: GlobalStatus) {
  return key === 'ok' ? '正常' : key === 'warn' ? '异常' : '报警'
}

export function gradeOf(damage: number): { key: GradeKey; name: string } {
  if (damage < 0.7) return { key: 'ok', name: '健康' }
  if (damage < 1) return { key: 'sub', name: '亚健康' }
  return { key: 'pending', name: '分级待核' }
}

export function remainDamage(point: StructurePoint) {
  return Number((1 - point.D).toFixed(2))
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function parseDT(value: string) {
  const [date, time] = value.split('T')
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = (time || '00:00').split(':').map(Number)
  return Date.UTC(year, month - 1, day, hour + 3, minute || 0, 0)
}

export function fmtDT(ms: number, withTz = true) {
  const wall = new Date(ms - 3 * 3600 * 1000)
  const text = `${wall.getUTCFullYear()}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())} ${pad(wall.getUTCHours())}:${pad(wall.getUTCMinutes())}`
  return withTz ? `${text}（${TZ}）` : text
}

export function fmtRange(from: string, to: string) {
  return `${fmtDT(parseDT(from), false)} 至 ${fmtDT(parseDT(to), false)}`
}

function hash(text: string) {
  let value = 7
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) % 1000003
  return value
}

function rng(seed: number) {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646
  return () => (state = state * 16807 % 2147483647) / 2147483647
}

export function remainCycles(point: StructurePoint) {
  const annual = 10800 + (hash(point.id + 'cyc') % 2400)
  return Math.round(point.L * annual)
}

export function lifeColor(years: number): { tone: '' | 'ex-red' | 'ex-orange' } {
  if (years < 1) return { tone: 'ex-red' }
  if (years < 2) return { tone: 'ex-orange' }
  return { tone: '' }
}

export function lastAeEvent(point: StructurePoint) {
  return ALARMS.filter(alarm => alarm.pid === point.id).sort((left, right) => parseDT(right.to) - parseDT(left.to))[0] || null
}

export function aeCountSince(point: StructurePoint, days: number) {
  const cut = parseDT(CUR_TO) - days * 86400000
  return ALARMS.filter(alarm => alarm.pid === point.id && parseDT(alarm.to) >= cut).length
}

export function quietDays(point: StructurePoint) {
  const event = lastAeEvent(point)
  if (!event) return 14
  return Math.floor((parseDT(CUR_TO) - parseDT(event.to)) / 86400000)
}

export function healthConclusion(point: StructurePoint) {
  const grade = gradeOf(point.D)
  return { text: `D=${point.D.toFixed(2)}，${grade.name}`, grade }
}

export function crackConclusion(point: StructurePoint) {
  const remain = remainDamage(point)
  return { text: `剩余年限 ${point.L.toFixed(1)} 年，剩余损伤度 ${remain.toFixed(2)}`, years: point.L, remain, cycles: remainCycles(point) }
}

export const AE_QUIET = '当前点位声发射信号不明显，暂未见明显的活性缺陷'
export const EDDY_CLEAR = '该位置未发现裂纹'

export function aeConclusion(point: StructurePoint) {
  const event = lastAeEvent(point)
  const lastLabel = event ? fmtDT(parseDT(event.from), false) : ''
  const days = quietDays(point)
  const count = aeCountSince(point, 14)
  if (point.aeActive) {
    return { text: `存在活跃扩展迹象，最近一次活性事件 ${lastLabel}`, bad: true, lastLabel, days, count, event }
  }
  return { text: AE_QUIET, bad: false, lastLabel, days, count, event }
}

export function serviceConclusion(svc: SvcId, point: StructurePoint) {
  if (svc === 'health') return healthConclusion(point).text
  if (svc === 'crack') return crackConclusion(point).text
  if (svc === 'ae') return aeConclusion(point).text
  return EDDY_CLEAR
}

export function serviceCards(point: StructurePoint): ServiceCardModel[] {
  return SERVICES.map(service => {
    if (service.id === 'health') {
      const grade = gradeOf(point.D)
      return {
        id: service.id,
        name: service.name,
        badge: grade.name,
        badgeTone: grade.key,
        kpis: [
          { label: '损伤度 D', value: point.D.toFixed(2) },
          { label: '健康状态', value: grade.name, small: true }
        ],
        bar: Math.max(0, Math.min(1, point.D)) * 100,
        conclusion: healthConclusion(point).text,
        abnormal: false,
        pending: false,
        basis: service.basis
      }
    }
    if (service.id === 'crack') {
      const color = lifeColor(point.L)
      return {
        id: service.id,
        name: service.name,
        badge: '演示数据',
        badgeTone: 'ok',
        kpis: [
          { label: '剩余年限', value: `${point.L.toFixed(1)} 年`, tone: color.tone || undefined },
          { label: '剩余损伤度', value: remainDamage(point).toFixed(2) }
        ],
        note: '配色为示例（＜1 年红、＜2 年橙），不是已批标准，也不表示全局报警',
        conclusion: crackConclusion(point).text,
        abnormal: false,
        pending: false,
        basis: service.basis
      }
    }
    if (service.id === 'ae') {
      const conclusion = aeConclusion(point)
      return {
        id: service.id,
        name: service.name,
        badge: conclusion.bad ? '存在活跃扩展迹象' : AE_QUIET,
        badgeTone: conclusion.bad ? 'warn' : 'ok',
        kpis: [
          { label: '最近活性事件', value: conclusion.lastLabel ? conclusion.lastLabel.slice(5) : '无', small: true },
          { label: '近 14 日事件', value: `${conclusion.count} 次` }
        ],
        conclusion: conclusion.text,
        abnormal: conclusion.bad,
        pending: false,
        basis: service.basis
      }
    }
    return {
      id: service.id,
      name: service.name,
      badge: '未发现裂纹',
      badgeTone: 'ok',
      kpis: [
        { label: '监测方式', value: '柔性涡流阵列', small: true },
        { label: '判别结果', value: '未发现裂纹', small: true }
      ],
      conclusion: EDDY_CLEAR,
      abnormal: false,
      pending: false,
      basis: service.basis
    }
  })
}

export function groupedPoints(query: string, onlyBad: boolean) {
  const text = query.trim().toUpperCase()
  return (['A梁', 'B梁'] as const).map(beam => ({
    beam,
    rows: STRUCTURE_POINTS.filter(point => point.beam === beam
      && (!text || point.id.includes(text) || point.loc.toUpperCase().includes(text))
      && (!onlyBad || point.status !== 'ok'))
  })).filter(group => group.rows.length)
}

export function pointSummary() {
  return {
    total: STRUCTURE_POINTS.length,
    warn: STRUCTURE_POINTS.filter(point => point.status === 'warn').length,
    alarm: STRUCTURE_POINTS.filter(point => point.status === 'alarm').length
  }
}

export function modalConclusion(svc: SvcId, point: StructurePoint, view: ModalView, alarm: AlarmRecord | null) {
  const current = serviceConclusion(svc, point)
  let head = '当前结论（演示）'
  if (view === 'alarm' && alarm) head = `回看结论（${alarm.id} · 非当前）`
  let body = current
  let sub = ''
  if (svc === 'health') {
    if (view === 'alarm' && alarm) body = '本条报警记录不属于健康评估。损伤度分级与报警事件分开，见右侧记录列表或返回当前后查看本点位损伤度。'
    else sub = '健康：D＜0.7；亚健康：0.7≤D＜1。D＝1 及以上分级待核，本示意不用大于或等于 1 的数值，也不把 D 阈值当作报警。健康状态不映射为全局报警。'
  } else if (svc === 'crack') {
    if (view === 'alarm' && alarm) body = '本条报警记录不属于裂纹预测。请在「报警记录」中打开对应的损伤活性诊断回看。'
    else sub = `主成果为剩余年限，同时给出剩余损伤度。剩余循环次数 ${remainCycles(point).toLocaleString('zh-CN')} 次（演示数据，由剩余年限推算）。配色为示例（＜1 年红、＜2 年橙），不是已批标准，也不表示全局报警。不展示裂纹尺寸或扩展曲线。`
  } else if (svc === 'ae') {
    if (view === 'alarm' && alarm) {
      body = alarm.title
      sub = `${alarm.note}　回看时段：${fmtRange(alarm.from, alarm.to)}（${TZ}）。40 dB 仅为示意阈值，不是规范。活性结论不映射为损伤度或全局报警。`
    } else {
      sub = '依据声发射演示数据。图中 40 dB 仅为示意阈值，不是规范，也不写入本结论。活性结论不映射为损伤度或全局报警。'
    }
  } else {
    body = EDDY_CLEAR
    sub = '本能力为柔性涡流阵列，用于判别裂纹长度与大小。本示意不给出裂纹长度或大小，也不绘制阻抗平面或相位曲线。'
  }
  return { head, body, sub, basis: SERVICES.find(item => item.id === svc)?.basis || '' }
}

function shifts(random: () => number) {
  const jitter = () => Math.round((random() - 0.5) * 30)
  return [[7 * 60 + jitter(), 11 * 60 + 30 + jitter()], [13 * 60 + jitter(), 17 * 60 + 30 + jitter()], [19 * 60 + jitter(), 22 * 60 + jitter()]]
}

function inAlarm(ms: number, query: SeriesQuery) {
  if (query.view !== 'alarm' || !query.alarm) return false
  return ms >= parseDT(query.alarm.from) && ms <= parseDT(query.alarm.to)
}

export function stressSeries(point: StructurePoint, from: string, to: string, query: SeriesQuery): DemoSeries {
  const x: number[] = []
  const y: number[] = []
  const recs: DemoRecord[] = []
  const random = rng(hash(point.id + 'stress'))
  const start = parseDT(from)
  const end = parseDT(to)
  const step = end - start > 12 * 3600 * 1000 ? 5 * 60 * 1000 : 60 * 1000
  const dayShifts: Record<string, number[][]> = {}
  const shiftOf = (dayKey: string) => {
    if (!dayShifts[dayKey]) dayShifts[dayKey] = shifts(rng(hash(point.id + 'sh' + dayKey)))
    return dayShifts[dayKey]
  }
  let cycle = 0
  let cycleLen = 8
  let peak = point.s
  const base = point.s * 0.4
  for (let time = start; time <= end; time += step) {
    const wall = new Date(time - 3 * 3600 * 1000)
    const dayKey = `${wall.getUTCFullYear()}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}`
    const minutes = wall.getUTCHours() * 60 + wall.getUTCMinutes()
    const working = shiftOf(dayKey).some(([open, close]) => minutes >= open && minutes <= close)
    let value = base + (random() - 0.5) * 2.4
    if (working) {
      cycle += 1
      if (cycle >= cycleLen) {
        cycle = 0
        cycleLen = 7 + Math.floor(random() * 5)
        peak = point.s * (0.85 + random() * 0.5)
      }
      const phase = cycle / cycleLen
      if (phase > 0.15 && phase < 0.7) value = base + (peak - base) * Math.sin((phase - 0.15) / 0.55 * Math.PI) + (random() - 0.5) * 4
    }
    if (inAlarm(time, query) && query.modal === 'health') value += 6
    x.push(time)
    y.push(Number(value.toFixed(1)))
  }
  let bucket: number | null = null
  let peakValue = -1
  let peakTime = start
  let count = 0
  const flush = () => {
    if (bucket != null) recs.push({ t: peakTime, item: '应力峰值', val: `${peakValue.toFixed(1)} MPa`, n: count })
  }
  x.forEach((time, index) => {
    const next = Math.floor((time - start) / (60 * 60 * 1000))
    if (next !== bucket) {
      flush()
      bucket = next
      peakValue = y[index]
      peakTime = time
      count = 1
    } else {
      count += 1
      if (y[index] > peakValue) {
        peakValue = y[index]
        peakTime = time
      }
    }
  })
  flush()
  return { x, y, recs, unit: 'MPa', name: '应力' }
}

export function aeSeries(point: StructurePoint, from: string, to: string, query: SeriesQuery): DemoSeries {
  const x: number[] = []
  const y: number[] = []
  const recs: DemoRecord[] = []
  const start = parseDT(from)
  const end = parseDT(to)
  const step = end - start > 12 * 3600 * 1000 ? 5 * 60 * 1000 : 60 * 1000
  const random = rng(hash(point.id + 'ae' + from))
  for (let time = start; time <= end; time += step) {
    const wall = new Date(time - 3 * 3600 * 1000)
    const minutes = wall.getUTCHours() * 60 + wall.getUTCMinutes()
    const working = minutes >= 7 * 60 && minutes <= 22 * 60
    let value = Math.max(18, (working ? point.ae : point.ae - 10) + (random() - 0.5) * 6)
    if (inAlarm(time, query)) value = 42 + random() * 10
    if (point.id === 'ML-02' && query.view === 'current' && time >= parseDT('2026-11-16T02:30')) value = 41 + random() * 8
    x.push(time)
    y.push(Number(Math.min(62, value).toFixed(1)))
  }
  let bucket: number | null = null
  let maxValue = -1
  let maxTime = start
  let hits = 0
  let count = 0
  const flush = () => {
    if (bucket != null) recs.push({ t: maxTime, item: '最大幅值', val: `${maxValue.toFixed(1)} dB`, n: count, hit: maxValue >= 40, extra: hits ? `超阈值 ${hits} 次` : '' })
  }
  x.forEach((time, index) => {
    const next = Math.floor((time - start) / (60 * 60 * 1000))
    if (next !== bucket) {
      flush()
      bucket = next
      maxValue = y[index]
      maxTime = time
      hits = y[index] >= 40 ? 1 : 0
      count = 1
    } else {
      count += 1
      if (y[index] > maxValue) {
        maxValue = y[index]
        maxTime = time
      }
      if (y[index] >= 40) hits += 1
    }
  })
  flush()
  return { x, y, recs, unit: 'dB', name: '声发射幅值', th: 40 }
}

export function damageSeries(point: StructurePoint): DemoSeries {
  const x: number[] = []
  const y: number[] = []
  const recs: DemoRecord[] = []
  for (let index = 13; index >= 0; index -= 1) {
    const ms = parseDT('2026-11-16T04:00') - index * 86400000
    const random = rng(hash(point.id + 'D' + index))
    const value = Number((point.D - index * 0.0015 - (index ? random() * 0.0005 : 0)).toFixed(4))
    x.push(ms)
    y.push(value)
    recs.push({ t: ms, item: '损伤度 D', val: value.toFixed(3), n: 1 })
  }
  return { x, y, recs, unit: '', name: '损伤度 D' }
}

export function lifeSeries(point: StructurePoint): DemoSeries {
  const x: number[] = []
  const y: number[] = []
  const recs: DemoRecord[] = []
  for (let index = 13; index >= 0; index -= 1) {
    const ms = parseDT('2026-11-16T04:00') - index * 86400000
    const random = rng(hash(point.id + 'L' + index))
    const value = Number((point.L + index * 0.003 + (index ? (random() - 0.5) * 0.004 : 0)).toFixed(3))
    x.push(ms)
    y.push(value)
    recs.push({ t: ms, item: '剩余年限', val: `${value.toFixed(2)} 年`, n: 1 })
  }
  return { x, y, recs, unit: '年', name: '剩余年限' }
}
