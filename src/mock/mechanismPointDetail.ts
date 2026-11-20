/** 机构点位演示数据。对照算法 PPT 第5–9页，数值均为示意，不是已验证的算法输出。 */

export type MechStatus = 'ok' | 'warn' | 'alarm'
export type FeatureKey = 'kurtosis' | 'severity' | 'rms'
export type BearingStage = 'A' | 'B' | 'C' | 'D'

export interface MechPoint {
  id: string
  name: string
  status: MechStatus
  rpm: number
  bearing: boolean
}

export interface MechAlarm {
  id: string
  pid: string
  level: MechStatus
  from: string
  to: string
  feature: FeatureKey
  title: string
  note: string
}

export const MECH_DEVICE = '3G211-A2'
export const MECH_ORG = '主起升机构'
export const MECH_POINTS: MechPoint[] = [
  { id: 'M-01', name: '电机输出轴', status: 'ok', rpm: 985, bearing: false },
  { id: 'G-01', name: '减速器高速轴', status: 'ok', rpm: 985, bearing: false },
  { id: 'G-02', name: '减速器中间轴', status: 'ok', rpm: 328, bearing: false },
  { id: 'G-03', name: '减速器低速轴', status: 'warn', rpm: 82, bearing: false },
  { id: 'D-01', name: '卷筒轴承座', status: 'ok', rpm: 24, bearing: true }
]

/** PPT 图中有阈值线，但没有给出数值。下列只作示意线。 */
export const FEATURES: Record<FeatureKey, { name: string; unit: string; abnormal: number; danger: number }> = {
  kurtosis: { name: '峭度', unit: '', abnormal: 4, danger: 6 },
  severity: { name: '振动烈度', unit: 'mm/s', abnormal: 4.5, danger: 7.1 },
  rms: { name: '有效值', unit: 'g', abnormal: 2.5, danger: 4 }
}

export const MECH_ALARMS: MechAlarm[] = [
  {
    id: 'VB-001', pid: 'G-03', level: 'warn', feature: 'severity',
    from: '2026-11-07T08:10', to: '2026-11-07T08:40',
    title: '振动烈度短时超过示意异常线',
    note: '历史振动事件。示意异常线不是规范限值。'
  },
  {
    id: 'VB-002', pid: 'G-03', level: 'warn', feature: 'kurtosis',
    from: '2026-11-10T14:00', to: '2026-11-10T14:20',
    title: '峭度短时抬升后回落',
    note: '独立的历史事件。服务抽屉里的当前特征值不使用这段回看窗口。'
  }
]

/** PPT 写 RUL CI (ist): [min, max]，显示取最后一项。图中剩余寿命是 XXX，区间数字为演示。 */
export const BEARING_DEMO = {
  stage: 'B' as BearingStage,
  faultTime: '2026-11-07 09:00',
  inputHours: 24,
  ci: [360, 520] as [number, number],
  pptExampleFault: '2026-01-09 13:56:13',
  pptExampleLife: 'XXX 小时'
}

const STAGE_TEXT: Record<BearingStage, string> = { A: '正常', B: '早期', C: '故障', D: '失效' }

export function mechPoint(id: string) {
  return MECH_POINTS.find(point => point.id === id) || MECH_POINTS[1]
}

export function statusName(status: MechStatus) {
  return status === 'ok' ? '正常' : status === 'warn' ? '异常' : '故障'
}

export function featureBase(point: MechPoint): Record<FeatureKey, number> {
  if (point.status === 'warn') return { kurtosis: 4.6, severity: 4.9, rms: 2.4 }
  if (point.bearing) return { kurtosis: 3.2, severity: 1.8, rms: 0.9 }
  return { kurtosis: 3.1, severity: 2.6, rms: 1.4 }
}

export function mechSummary() {
  const normal = MECH_POINTS.filter(point => point.status === 'ok').length
  const warn = MECH_POINTS.filter(point => point.status === 'warn').length
  const fault = MECH_POINTS.filter(point => point.status === 'alarm').length
  const overall: MechStatus = fault ? 'alarm' : warn ? 'warn' : 'ok'
  return { normal, warn, fault, overall, total: MECH_POINTS.length }
}

export function featureLevel(key: FeatureKey, value: number) {
  const line = FEATURES[key]
  if (value >= line.danger) return '危险'
  if (value >= line.abnormal) return '异常'
  return '正常'
}

export function assessConclusion(point: MechPoint) {
  const base = featureBase(point)
  const hits = (Object.keys(FEATURES) as FeatureKey[]).filter(key => featureLevel(key, base[key]) !== '正常')
  if (!hits.length) return '峭度、振动烈度、有效值均在示意异常线以下'
  return hits.map(key => `${FEATURES[key].name}${featureLevel(key, base[key])}`).join('，')
}

export function monitorConclusion(point: MechPoint) {
  const summary = mechSummary()
  const base = featureBase(point)
  return `机构${statusName(summary.overall)}。本点峭度 ${base.kurtosis.toFixed(1)}，振动烈度 ${base.severity.toFixed(1)} mm/s，有效值 ${base.rms.toFixed(1)} g`
}

export function diagnosisConclusion(point: MechPoint) {
  return point.status === 'warn'
    ? '转频分量偏高，包络阶次出现演示调幅峰。不是轴承几何计算'
    : '转频及二次谐波为主，未见额外阶次峰'
}

export function lifeConclusion(point: MechPoint) {
  if (!point.bearing) return '非轴承测点，不预测轴承寿命'
  return `轴承阶段 ${stageLabel(BEARING_DEMO.stage)}。RUL CI 末项 ${BEARING_DEMO.ci[1]} 小时（演示）`
}

export function stageLabel(stage: BearingStage) {
  return `${stage}-${STAGE_TEXT[stage]}`
}

function hash(text: string) {
  let value = 7
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) % 1000003
  return value
}

function parseDT(value: string) {
  const [date, time] = value.split('T')
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = (time || '00:00').split(':').map(Number)
  return Date.UTC(year, month - 1, day, (hour || 0) + 3, minute || 0)
}

export function featureSeries(point: MechPoint, key: FeatureKey, from: string, to: string) {
  const start = parseDT(from)
  const end = parseDT(to)
  const step = Math.max(15 * 60 * 1000, Math.round((end - start) / 24))
  const base = featureBase(point)[key]
  const labels: string[] = []
  const values: number[] = []
  for (let time = start; time <= end; time += step) {
    const wall = new Date(time - 3 * 3600 * 1000)
    const label = `${String(wall.getUTCMonth() + 1).padStart(2, '0')}-${String(wall.getUTCDate()).padStart(2, '0')} ${String(wall.getUTCHours()).padStart(2, '0')}:${String(wall.getUTCMinutes()).padStart(2, '0')}`
    const wave = Math.sin(time / 3.6e6 + hash(point.id + key) / 10)
    labels.push(label)
    values.push(Number(Math.max(0, base * (1 + wave * 0.06)).toFixed(2)))
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / (values.length || 1)
  return {
    labels,
    values,
    max: values.length ? Math.max(...values) : 0,
    min: values.length ? Math.min(...values) : 0,
    mean
  }
}

export interface Capture {
  time: number[]
  signal: number[]
  angle: number[]
  rpm: number[]
  freq: number[]
  mag: number[]
  order: number[]
  orderMag: number[]
  envOrder: number[]
  envMag: number[]
  shaftHz: number
}

/** 六张图用同一段示意信号。6400 来自诊断图标注，PPT 未说明它是采样率还是特征频率。 */
export function capture(point: MechPoint, seconds = 5): Capture {
  const count = 400
  const shaftHz = point.rpm / 60
  const time: number[] = []
  const signal: number[] = []
  const angle: number[] = []
  const rpm: number[] = []
  const first = point.status === 'warn' ? 0.45 : 0.12
  const second = point.status === 'warn' ? 0.16 : 0.04
  const modulation = point.status === 'warn' ? 0.65 : 0.04
  for (let index = 0; index < count; index += 1) {
    const t = (index / (count - 1)) * seconds
    const carrier = first * Math.sin(2 * Math.PI * shaftHz * t) + second * Math.sin(2 * Math.PI * 2 * shaftHz * t)
    const envelope = 1 + modulation * (0.5 + 0.5 * Math.sin(2 * Math.PI * 3.5 * shaftHz * t))
    time.push(Number(t.toFixed(4)))
    signal.push(Number((carrier * envelope).toFixed(4)))
    angle.push(Number((shaftHz * t).toFixed(3)))
    rpm.push(Number((point.rpm * (1 + 0.008 * Math.sin(2 * Math.PI * 0.3 * t))).toFixed(2)))
  }
  const half = Math.floor(count / 2)
  const freq: number[] = []
  const mag: number[] = []
  const df = 1 / seconds
  for (let bin = 1; bin < half; bin += 1) {
    let real = 0
    let imag = 0
    for (let index = 0; index < count; index += 1) {
      const phase = -2 * Math.PI * bin * index / count
      real += signal[index] * Math.cos(phase)
      imag += signal[index] * Math.sin(phase)
    }
    const frequency = bin * df
    if (frequency > 200) break
    freq.push(Number(frequency.toFixed(2)))
    mag.push(Number((Math.hypot(real, imag) / count).toFixed(4)))
  }
  const order = freq.map(frequency => Number((frequency / shaftHz).toFixed(2)))
  const envelope = signal.map((value, index) => Math.abs(value) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 3.5 * shaftHz * time[index])))
  const envMag: number[] = []
  const envOrder: number[] = []
  for (let bin = 1; bin < half; bin += 1) {
    const frequency = bin * df
    const ord = frequency / shaftHz
    if (ord > 8) break
    let real = 0
    let imag = 0
    for (let index = 0; index < count; index += 1) {
      const phase = -2 * Math.PI * bin * index / count
      real += envelope[index] * Math.cos(phase)
      imag += envelope[index] * Math.sin(phase)
    }
    envOrder.push(Number(ord.toFixed(2)))
    envMag.push(Number((Math.hypot(real, imag) / count).toFixed(4)))
  }
  return { time, signal, angle, rpm, freq, mag, order, orderMag: mag, envOrder, envMag, shaftHz }
}

export function rmsInput(point: MechPoint) {
  const base = featureBase(point).rms
  const labels: string[] = []
  const values: number[] = []
  for (let hour = BEARING_DEMO.inputHours; hour >= 0; hour -= 1) {
    labels.push(`-${hour} h`)
    const wave = Math.sin((BEARING_DEMO.inputHours - hour) / 4)
    values.push(Number((base * (1 + wave * 0.05)).toFixed(3)))
  }
  return { labels, values }
}

export const SAMPLE_RATE_NOTE = '诊断图标注 6400。PPT 未说明这是采样率还是特征频率；六张图按 6400 Hz 对齐频率轴，并降采样绘图。'
