export interface StructPoint {
  id: string
  name: string
  live: boolean
  sec: 'top' | 'bot' | 'web'
  pos: number
  s: number
  D: number
  L: number
  ae: number
  ec: number
  ph: number
}

export const STRUCT_PTS: StructPoint[] = [
  { id: 'ML-01', name: '跨中上翼缘', live: true, sec: 'top', pos: 0.5, s: 97, D: 0.42, L: 6.2, ae: 31, ec: 0.12, ph: 12 },
  { id: 'ML-02', name: '跨中下翼缘', live: true, sec: 'bot', pos: 0.5, s: 104, D: 0.46, L: 5.8, ae: 33, ec: 0.13, ph: 14 },
  { id: 'ML-03', name: '1/4跨上翼缘', live: true, sec: 'top', pos: 0.25, s: 74, D: 0.31, L: 7.6, ae: 28, ec: 0.11, ph: 11 },
  { id: 'ML-04', name: '1/4跨下翼缘', live: true, sec: 'bot', pos: 0.25, s: 79, D: 0.33, L: 7.3, ae: 29, ec: 0.11, ph: 12 },
  { id: 'ML-05', name: '3/4跨上翼缘', live: true, sec: 'top', pos: 0.75, s: 76, D: 0.32, L: 7.5, ae: 28, ec: 0.1, ph: 10 },
  { id: 'ML-06', name: '3/4跨下翼缘', live: true, sec: 'bot', pos: 0.75, s: 81, D: 0.35, L: 7.1, ae: 30, ec: 0.12, ph: 13 },
  { id: 'ML-07', name: '左端头焊缝', live: false, sec: 'top', pos: 0.04, s: 52, D: 0.24, L: 8.4, ae: 26, ec: 0.09, ph: 9 },
  { id: 'ML-08', name: '支座附近', live: false, sec: 'bot', pos: 0.08, s: 58, D: 0.27, L: 8.1, ae: 27, ec: 0.1, ph: 10 },
  { id: 'ML-09', name: '腹板中部', live: false, sec: 'web', pos: 0.62, s: 66, D: 0.29, L: 7.8, ae: 27, ec: 0.1, ph: 11 },
  { id: 'ML-10', name: '右端头焊缝', live: false, sec: 'top', pos: 0.96, s: 50, D: 0.23, L: 8.5, ae: 26, ec: 0.09, ph: 9 }
]

export const STRUCT_DATES = ['2026-11-11', '2026-11-10', '2026-11-09', '2026-11-08', '2026-11-07', '2026-11-06', '2026-11-05']
export const STRUCT_NOW = 15 * 60 + 30

export function structPoint(id: string) {
  return STRUCT_PTS.find(item => item.id === id) || STRUCT_PTS[0]
}

function rng(seed: number) {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646
  return () => (state = state * 16807 % 2147483647) / 2147483647
}
function hash(text: string) {
  let value = 7
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) % 1000003
  return value
}
function shifts(random: () => number) {
  const jitter = () => Math.round((random() - 0.5) * 40)
  return [[7 * 60 + jitter(), 11 * 60 + 30 + jitter()], [13 * 60 + jitter(), 17 * 60 + 30 + jitter()], [19 * 60 + jitter(), 22 * 60 + jitter()]]
}
const today = (date: string) => date === STRUCT_DATES[0]

export function stressDay(point: StructPoint, date: string) {
  const random = rng(hash(point.id + date + 's'))
  const windows = shifts(random)
  const end = today(date) ? STRUCT_NOW : 1440
  const pairs: [number, number][] = []
  const base = point.s * 0.4
  let cycle = 0
  let cycleLen = 8 + Math.floor(random() * 4)
  let peak = point.s
  for (let minute = 0; minute <= end; minute += 2) {
    const working = windows.some(([start, stop]) => minute >= start && minute <= stop)
    let value = base + (random() - 0.5) * 2.5
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
    pairs.push([minute, Math.round(value * 10) / 10])
  }
  return pairs
}

export function aeDay(point: StructPoint, date: string) {
  const random = rng(hash(point.id + date + 'a'))
  const windows = shifts(random)
  const end = today(date) ? STRUCT_NOW : 1440
  const pairs: [number, number][] = []
  for (let minute = 0; minute <= end; minute += 2) {
    const working = windows.some(([start, stop]) => minute >= start && minute <= stop)
    if (random() < (working ? 0.55 : 0.06)) {
      let amp = point.ae - 6 + random() * 10
      if (random() < 0.02) amp += 4 + random() * 3
      pairs.push([minute, Math.round(Math.min(39.5, amp) * 10) / 10])
    }
  }
  return pairs
}

export function ecDay(point: StructPoint, date: string) {
  const random = rng(hash(point.id + date + 'e'))
  const end = today(date) ? STRUCT_NOW : 1440
  const pairs: [number, number][] = []
  let value = point.ec
  for (let minute = 0; minute <= end; minute += 10) {
    value += (point.ec - value) * 0.2 + (random() - 0.5) * 0.012
    pairs.push([minute, Math.round(value * 1000) / 1000])
  }
  return pairs
}

export function dSeries(point: StructPoint) {
  const random = rng(hash(point.id + 'D'))
  return Array.from({ length: 11 }, (_, index) => {
    const day = index - 10
    return [day, +(point.D - (10 - index) * 0.0016 - (10 - index ? random() * 0.0006 : 0)).toFixed(4)] as [number, number]
  })
}

export function lSeries(point: StructPoint, days: number) {
  const random = rng(hash(point.id + 'L'))
  const all = Array.from({ length: 30 }, (_, index) => {
    const ago = 29 - index
    return [-ago, +(point.L + ago * 0.0035 + (ago ? (random() - 0.5) * 0.006 : 0)).toFixed(3)] as [number, number]
  })
  return all.slice(-days)
}

export function aeWeek(point: StructPoint) {
  const random = rng(hash(point.id + 'aw'))
  return Array.from({ length: 168 }, (_, index) => {
    const hour = index - 167
    const clock = ((hour % 24) + 24 + 15) % 24
    const working = clock >= 7 && clock <= 22
    const value = Math.min(39.2, (working ? point.ae + 1 : point.ae - 9) + (random() - 0.5) * 7 + (random() < 0.03 ? 4 : 0))
    return [hour, Math.round(value * 10) / 10] as [number, number]
  })
}

export function shiftDate(offset: number) {
  const date = new Date('2026-11-11T12:00:00')
  date.setDate(date.getDate() + offset)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function dateLabel(date: string) {
  return `${date.slice(5)}${today(date) ? ' 今天' : ''}`
}
