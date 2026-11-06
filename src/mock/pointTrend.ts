import type { Point, PointStatus } from '@/mock/partsPoint'

export interface PointTrend {
  labels: string[]
  values: number[]
  warn: number
  alarm: number
  yMin: number
  yMax: number
}

/** Sample spacing of the demo curve. The readings table uses the same clock. */
export const TREND_STEP_MINUTES = 30
const POINT_COUNT = 48
/** Newest rows shown under the curve (within the requested 10–20). */
export const TREND_TABLE_ROWS = 16

/** Preset warn / alarm bands for channels whose demo readings share a scale. */
const UNIT_LIMITS: Record<string, { warn: number; alarm: number }> = {
  应变: { warn: 160, alarm: 280 },
  振动: { warn: 4.5, alarm: 7.1 },
  温度: { warn: 70, alarm: 85 },
  力: { warn: 240, alarm: 300 },
  几何: { warn: 1.5, alarm: 2.5 },
  孪生: { warn: 1, alarm: 1.6 },
  挠度: { warn: 20, alarm: 30 }
}

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function parseReading(value: string): number | null {
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const n = Number(match[0])
  return Number.isFinite(n) ? n : null
}

export function readingSuffix(value: string): string {
  const match = value.match(/-?\d+(?:\.\d+)?\s*(.*)$/)
  return (match?.[1] || '').trim()
}

export function formatTrendNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3
  return n.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

function roundNice(n: number, ref: number): number {
  const abs = Math.max(Math.abs(ref), 1e-6)
  const digits = abs >= 100 ? 1 : abs >= 10 ? 2 : abs >= 1 ? 3 : 4
  const f = 10 ** digits
  return Math.round(n * f) / f
}

function limitsFor(status: PointStatus, unit: string, reading: number | null) {
  const preset = UNIT_LIMITS[unit]
  if (reading != null && preset) {
    const plausible = reading < preset.alarm * 3 && reading > preset.warn * 0.02
    if (plausible) return { warn: preset.warn, alarm: preset.alarm, current: reading }
  }
  if (reading != null && reading !== 0) {
    const scale = Math.abs(reading)
    if (status === 'alarm') {
      const alarm = scale * 0.92
      return { warn: alarm * 0.64, alarm, current: reading }
    }
    if (status === 'warn') {
      const warn = scale * 0.9
      return { warn, alarm: scale * 1.35, current: reading }
    }
    const warn = scale * 1.5
    return { warn, alarm: warn * 1.45, current: reading }
  }
  const current = status === 'alarm' ? 96 : status === 'warn' ? 76 : status === 'off' ? 0 : 42
  return { warn: 70, alarm: 90, current }
}

/** Clock time of sample `index` (0 = oldest) in a series that ends at `end`. */
export function trendSampleTime(end: Date, index: number, count = POINT_COUNT): Date {
  return new Date(end.getTime() - (count - 1 - index) * TREND_STEP_MINUTES * 60 * 1000)
}

function readingStatus(value: number, status: PointStatus, warn: number, alarm: number): PointStatus {
  if (status === 'off' || status === 'twin') return status
  if (value >= alarm) return 'alarm'
  if (value >= warn) return 'warn'
  return 'ok'
}

export interface TrendTableRow {
  at: Date
  value: number
  status: PointStatus
}

/** Newest-first slice of the same series drawn on the chart. */
export function latestTrendRows(trend: PointTrend, end: Date, pointStatus: PointStatus, limit = TREND_TABLE_ROWS): TrendTableRow[] {
  const count = trend.values.length
  const rows: TrendTableRow[] = []
  for (let i = count - 1; i >= 0 && rows.length < limit; i--) {
    const value = trend.values[i]
    rows.push({
      at: trendSampleTime(end, i, count),
      value,
      status: readingStatus(value, pointStatus, trend.warn, trend.alarm)
    })
  }
  return rows
}

/**
 * Deterministic 24h demo series. Shape depends on point id, status, and an optional
 * tab variant (`health` / `safety`) so the two time-series tabs are not identical.
 * The last sample is always the point's current reading.
 */
export function buildPointTrend(point: Pick<Point, 'id' | 'status' | 'value' | 'unit'>, end: Date, variant = 'health'): PointTrend {
  let { warn, alarm, current } = limitsFor(point.status, point.unit, parseReading(point.value))
  if (!(warn < alarm)) {
    const mid = Math.max(Math.abs(warn), Math.abs(alarm), 1)
    warn = mid * 0.7
    alarm = mid
  }
  const salt = variant || 'health'
  const rand = mulberry32(hashString(`${point.id}|${point.status}|${salt}`))
  const amp = Math.max(Math.abs(alarm - warn) * 0.22, Math.abs(current) * 0.04, 0.02)
  const phase = (hashString(`${point.id}|${salt}`) % 628) / 100
  const labels: string[] = []
  const values: number[] = []

  for (let i = 0; i < POINT_COUNT; i++) {
    const at = trendSampleTime(end, i, POINT_COUNT)
    labels.push(`${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`)
    const wave = Math.sin(i / 5 + phase) * amp * 0.7 + Math.sin(i / 13 + phase * 0.5) * amp * 0.3
    const noise = (rand() - 0.5) * amp
    const t = i / (POINT_COUNT - 1)
    let level = current
    if (point.status === 'alarm') {
      const start = warn * 0.78
      const climb = t < 0.62 ? 0 : Math.pow((t - 0.62) / 0.38, 1.2)
      level = start + (current - start) * climb + wave * (1 - climb * 0.5) + noise
      if (t < 0.75) level = Math.min(level, alarm * 0.96)
    } else if (point.status === 'warn') {
      const start = warn * 0.72
      const climb = t < 0.7 ? (t / 0.7) * 0.35 : 0.35 + ((t - 0.7) / 0.3) * 0.65
      level = Math.min(start + (current - start) * climb + wave + noise, alarm * 0.98)
    } else if (point.status === 'off') {
      level = 0
    } else {
      const ceiling = warn * 0.92
      const base = Math.min(current, ceiling * 0.75)
      level = Math.min(base + wave * 0.55 + noise * 0.6, ceiling)
    }
    values.push(roundNice(Math.max(level, 0), current || warn || 1))
  }
  if (point.status !== 'off') values[POINT_COUNT - 1] = roundNice(current, current || 1)

  const warnRounded = roundNice(warn, warn || 1)
  const alarmRounded = roundNice(alarm, alarm || 1)
  const low = Math.min(...values, warnRounded, alarmRounded)
  const high = Math.max(...values, warnRounded, alarmRounded)
  const pad = (high - low) * 0.14 || Math.abs(high) * 0.1 || 1
  return {
    labels,
    values,
    warn: warnRounded,
    alarm: alarmRounded,
    yMin: roundNice(Math.max(0, low - pad), warnRounded || 1),
    yMax: roundNice(high + pad, warnRounded || 1)
  }
}
