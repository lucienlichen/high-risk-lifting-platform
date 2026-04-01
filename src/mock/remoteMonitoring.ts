export type RemoteSectionId =
  | 'stress'
  | 'damage'
  | 'gearbox'
  | 'brake'
  | 'wheel'
  | 'electric'
  | 'rope'

export interface RemoteTrendHistory {
  kind: 'trend'
  times: string[]
  values: number[]
  /** Y 轴名称（数值含义） */
  valueLabel?: string
}

/** 结构损伤等：同一测点下应变与声发射各一条 24h 曲线 */
export interface RemoteDualTrendHistory {
  kind: 'dualTrend'
  strain: RemoteTrendHistory
  acoustic: RemoteTrendHistory
}

/** 减速机：同一测点下温度、声音、振动各一条 24h 曲线 */
export interface RemoteTripleTrendHistory {
  kind: 'tripleTrend'
  temperature: RemoteTrendHistory
  sound: RemoteTrendHistory
  vibration: RemoteTrendHistory
}

export interface RemoteListHistory {
  kind: 'list'
  rows: { time: string; value: string }[]
}

export interface RemotePlaceholderHistory {
  kind: 'placeholder'
  caption: string
}

export type RemoteItemHistory =
  | RemoteTrendHistory
  | RemoteDualTrendHistory
  | RemoteTripleTrendHistory
  | RemoteListHistory
  | RemotePlaceholderHistory

export interface RemoteStatusItem {
  label: string
  value: string
  status: 'normal' | 'warn' | 'danger'
  history: RemoteItemHistory
}

/** 电控监测看板（按文档示意图四块：运行参数 / 挡位 / 三相电流 / 限位安全），仅实时值、无历史曲线 */
export interface ElectricRunningItem {
  label: string
  value: string
}

export interface ElectricGearSlot {
  label: string
  on: boolean
}

export interface ElectricGearBlock {
  title: string
  gearValue: string
  slots: ElectricGearSlot[]
}

export interface ElectricCurrentRow {
  motor: string
  phaseA: string
  phaseB: string
  phaseC: string
}

export interface ElectricLimitItem {
  label: string
  ok: boolean
}

export interface ElectricBoardData {
  running: ElectricRunningItem[]
  gears: ElectricGearBlock[]
  currents: ElectricCurrentRow[]
  limits: ElectricLimitItem[]
}

/** 与 docs/监测数据内容.md 对齐：应力/损伤各 6 点、减速机 2 测点（每点温/声/振三曲线）、车轮 8 点振动、制动/钢丝绳图像占位；电控为 electricBoard */
export interface RemoteMonitoringData {
  lastRefresh: string
  stress: RemoteStatusItem[]
  damage: RemoteStatusItem[]
  gearbox: RemoteStatusItem[]
  wheel: RemoteStatusItem[]
  /** 保留空数组以兼容类型；实际电控数据见 electricBoard */
  electric: RemoteStatusItem[]
  electricBoard: ElectricBoardData
  brake: RemoteStatusItem[]
  rope: RemoteStatusItem[]
}

function hashDeviceId(id: string): number {
  const s = id ?? ''
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}

function labelSalt(label: string): number {
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}

function mkRng(baseSeed: number) {
  let s = baseSeed
  return (min: number, max: number) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return min + (s % (max - min + 1))
  }
}

function pick<T>(rng: ReturnType<typeof mkRng>, arr: readonly T[]): T {
  return arr[rng(0, arr.length - 1)]
}

function statusFromRng(rng: ReturnType<typeof mkRng>): RemoteStatusItem['status'] {
  const r = rng(0, 99)
  if (r < 72) return 'normal'
  if (r < 92) return 'warn'
  return 'danger'
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

function makeTrendHistory(
  rng: ReturnType<typeof mkRng>,
  deviceSeed: number,
  label: string,
  base: number,
  amp: number,
  valueLabel?: string,
  transform?: (v: number) => number
): RemoteTrendHistory {
  const salt = labelSalt(label)
  const values = HOURS_24.map((_, i) => {
    const phase = (i + (deviceSeed ^ salt) % 11) / 3.8
    let v = base + amp * Math.sin(phase) + rng(-2, 2)
    if (transform) v = transform(v)
    return Math.round(v * 100) / 100
  })
  return { kind: 'trend', times: HOURS_24, values, valueLabel }
}

function makeListHistory(
  rng: ReturnType<typeof mkRng>,
  deviceSeed: number,
  label: string,
  options: string[]
): RemoteListHistory {
  const salt = labelSalt(label)
  const rows = HOURS_24.map((time, i) => {
    const r = rng(0, 99) + (deviceSeed + salt + i) % 7
    return { time, value: options[r % options.length] }
  })
  return { kind: 'list', rows }
}

function item(
  rng: ReturnType<typeof mkRng>,
  deviceSeed: number,
  label: string,
  value: string,
  history: RemoteItemHistory
): RemoteStatusItem {
  return { label, value, status: statusFromRng(rng), history }
}

function placeholderItem(label: string, value: string, caption: string): RemoteStatusItem {
  return {
    label,
    value,
    status: 'normal',
    history: { kind: 'placeholder', caption }
  }
}

function buildElectricBoard(seed: number): ElectricBoardData {
  const er = mkRng(seed + 8801)
  const running: ElectricRunningItem[] = [
    { label: '主起重量', value: `${(er(0, 250) / 10).toFixed(1)} 吨` },
    { label: '主起升高度', value: `${(er(0, 280) / 10).toFixed(1)} 米` },
    { label: '主小车位置', value: `${(er(0, 320) / 10).toFixed(1)} 米` },
    { label: '副起重量', value: `${(er(0, 180) / 10).toFixed(1)} 吨` },
    { label: '副起升高度', value: `${(er(0, 220) / 10).toFixed(1)} 米` },
    { label: '副小车位置', value: `${(er(0, 300) / 10).toFixed(1)} 米` },
    { label: '大车位置', value: `${(er(0, 400) / 10).toFixed(1)} 米` },
    { label: '工作循环', value: `${er(0, 9999)}` },
    { label: '工作时间', value: `${(er(0, 12000) / 10).toFixed(1)} h` },
    { label: '累计工作时间', value: `${er(800, 52000)} h` }
  ]

  function gearBlock(title: string, labels: readonly string[]): ElectricGearBlock {
    const active = er(0, labels.length - 1)
    const gearValue = String(er(0, 4))
    return {
      title,
      gearValue,
      slots: labels.map((label, i) => ({ label, on: i === active }))
    }
  }

  const gears: ElectricGearBlock[] = [
    gearBlock('大车档位', ['滑行一档', '二档向左', '二档向右', '三档', '四档']),
    gearBlock('主小车档位', ['滑行一档', '二档向前', '二档向后', '三档', '四档']),
    gearBlock('副小车档位', ['滑行一档', '二档向前', '二档向后', '三档', '四档']),
    gearBlock('主起升档位', ['零位', '上升', '下降', '二档', '三档', '四档']),
    gearBlock('副起升档位', ['零位', '上升', '下降', '二档', '三档', '四档', '五档'])
  ]

  const motorNames = [
    '主起电机1',
    '主起电机2',
    '副起升电机',
    '大车电机1',
    '大车电机2',
    '大车电机3',
    '大车电机4',
    '主小车电机1',
    '主小车电机2',
    '副小车电机'
  ] as const

  const currents: ElectricCurrentRow[] = motorNames.map(name => ({
    motor: name,
    phaseA: `${er(15, 185)} A`,
    phaseB: `${er(12, 182)} A`,
    phaseC: `${er(18, 188)} A`
  }))

  const limitLabels = [
    '主起重锤',
    '副起重锤',
    '主起电机1制动限位1',
    '主起电机1制动限位2',
    '主起电机2制动限位1',
    '主起电机2制动限位2',
    '副起制动器限位1',
    '副起制动器限位2',
    '大车门开关',
    '主起电机1超速',
    '主起电机2超速',
    '副起电机超速',
    '主起上限限位',
    '主起下限限位',
    '副起上限限位',
    '副起下限限位',
    '主小车前限位',
    '主小车后限位',
    '副小车前限位',
    '副小车后限位',
    '大车左限位',
    '大车右限位'
  ] as const

  const limits: ElectricLimitItem[] = limitLabels.map(label => ({
    label,
    ok: er(0, 99) > 8
  }))

  return { running, gears, currents, limits }
}

const STRESS_SITES = [
  '主梁跨中',
  '主梁1/4跨',
  '主梁3/4跨',
  '刚性腿根部',
  '柔性腿根部',
  '小车轨道梁'
] as const

const DAMAGE_SITES = [
  '焊缝热点A',
  '焊缝热点B',
  '主梁下翼缘',
  '端梁连接板',
  '支腿过渡区',
  '小车架铰点'
] as const

export function getRemoteMonitoringData(
  device: { id: string; riskLevel: 'normal' | 'low' | 'medium' | 'high' } | null
): RemoteMonitoringData | null {
  if (!device || device.id == null || device.id === '') return null
  const seed = hashDeviceId(String(device.id))
  const rng = mkRng(seed)

  const stress: RemoteStatusItem[] = STRESS_SITES.map((site, i) => {
    const base = 95 + (seed % 17) / 10 + i * 3.2
    const v = (base + rng(0, 18) / 10).toFixed(1)
    return item(
      rng,
      seed,
      `结构应力·${site}（${i + 1}#）`,
      `${v} με`,
      makeTrendHistory(rng, seed, `应力-${site}`, base, 12, 'με', x => Math.round(x * 10) / 10)
    )
  })

  const damage: RemoteStatusItem[] = DAMAGE_SITES.map((site, i) => {
    const strainBase = 88 + (seed % 13) / 10 + i * 2.5
    const strainV = (strainBase + rng(0, 22) / 10).toFixed(1)
    const aeBase = 30 + (seed % 11) / 5 + i * 2.2
    const aeV = String(Math.round(aeBase + rng(0, 8)))
    const strain = makeTrendHistory(
      rng,
      seed,
      `损伤应变-${site}-${i}`,
      strainBase,
      10,
      'με',
      x => Math.round(x * 10) / 10
    )
    const acoustic = makeTrendHistory(
      rng,
      seed,
      `损伤声发射-${site}-${i}`,
      aeBase,
      9,
      'dB',
      x => Math.round(x)
    )
    return {
      label: `结构损伤监测·${site}（${i + 1}#）`,
      value: `应变 ${strainV} με / 声发射 ${aeV} dB`,
      status: statusFromRng(rng),
      history: { kind: 'dualTrend' as const, strain, acoustic }
    }
  })

  function gearboxPoint(
    unit: '减速机①' | '减速机②',
    tempBase: number,
    tempAmp: number,
    soundBase: number,
    soundAmp: number,
    vibBase: number,
    vibAmp: number
  ): RemoteStatusItem {
    const tempNow = Math.round(tempBase + rng(0, 8))
    const soundNow = Math.round(soundBase + rng(0, 6))
    const vibNow = Math.round((vibBase + rng(0, 15) / 10) * 100) / 100
    const temperature = makeTrendHistory(
      rng,
      seed,
      `${unit}-轴承温度`,
      tempBase,
      tempAmp,
      '°C',
      v => Math.round(v)
    )
    const sound = makeTrendHistory(
      rng,
      seed,
      `${unit}-壳体声`,
      soundBase,
      soundAmp,
      'dB',
      v => Math.round(v)
    )
    const vibration = makeTrendHistory(
      rng,
      seed,
      `${unit}-箱体振动`,
      vibBase,
      vibAmp,
      'mm/s',
      v => Math.round(v * 100) / 100
    )
    return {
      label: `减速机故障监测·${unit}`,
      value: `温度 ${tempNow} °C · 声音 ${soundNow} dB · 振动 ${vibNow} mm/s`,
      status: statusFromRng(rng),
      history: { kind: 'tripleTrend' as const, temperature, sound, vibration }
    }
  }

  const gearbox: RemoteStatusItem[] = [
    gearboxPoint('减速机①', 62, 12, 28, 8, 4.2, 1.8),
    gearboxPoint('减速机②', 58, 11, 26, 7, 3.8, 1.5)
  ]

  function wheelPoint(idx: number): RemoteStatusItem {
    const wheelNo = String(idx + 1).padStart(2, '0')
    const tempBase = 45 + idx * 1.5 + (seed % 9) / 3
    const soundBase = 22 + idx * 0.8 + (seed % 7) / 4
    const vibBase = 2.5 + idx * 0.3 + (seed % 5) / 4
    const tempNow = Math.round(tempBase + rng(0, 6))
    const soundNow = Math.round(soundBase + rng(0, 5))
    const vibNow = Math.round((vibBase + rng(0, 15) / 10) * 100) / 100
    const temperature = makeTrendHistory(rng, seed, `车轮温度-${idx}`, tempBase, 8, '°C', v => Math.round(v))
    const sound = makeTrendHistory(rng, seed, `车轮声音-${idx}`, soundBase, 5, 'dB', v => Math.round(v))
    const vibration = makeTrendHistory(rng, seed, `车轮振动-${idx}`, vibBase, 1.2, 'mm/s', v => Math.round(v * 100) / 100)
    return {
      label: `行走车轮·${wheelNo}#`,
      value: `温度 ${tempNow} °C · 声音 ${soundNow} dB · 振动 ${vibNow} mm/s`,
      status: statusFromRng(rng),
      history: { kind: 'tripleTrend' as const, temperature, sound, vibration }
    }
  }

  const wheel: RemoteStatusItem[] = Array.from({ length: 8 }, (_, i) => wheelPoint(i))

  const electric: RemoteStatusItem[] = []
  const electricBoard = buildElectricBoard(seed)

  const brake: RemoteStatusItem[] = [
    placeholderItem(
      '制动器失效监测',
      '图像监测',
      '制动器失效相关监测方案待定。正式接入后将展示制动器图像/视频及失效判别结果（演示占位）。'
    )
  ]

  const rope: RemoteStatusItem[] = [
    placeholderItem(
      '钢丝绳损伤监测',
      '图像监测',
      '钢丝绳损伤相关监测方案待定。正式接入后将展示绳面图像/视频及损伤识别结果（演示占位）。'
    )
  ]

  const now = new Date()
  now.setMinutes(now.getMinutes() - rng(0, 8))
  const lastRefresh = now.toLocaleString('zh-CN')

  return {
    lastRefresh,
    stress,
    damage,
    gearbox,
    wheel,
    electric,
    electricBoard,
    brake,
    rope
  }
}

/** 单次吊重作业记录 */
export interface OperationRecord {
  id: string
  label: string
  startHour: number
  endHour: number
  /** 结束分钟（0-59），用于精确显示 */
  endMinute: number
  duration: string
  load: string
  status: 'normal' | 'warn' | 'danger'
}

/**
 * 按设备 ID + 日期确定性生成当日吊重作业列表（8-12 次）
 * 作业分布在 06:00-22:00 之间，每次 30-120 分钟
 */
export function getOperationList(deviceId: string, date: Date): OperationRecord[] {
  if (!deviceId) return []
  const dateSeed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  const seed = hashDeviceId(deviceId) ^ dateSeed
  const rng = mkRng(seed)

  const count = 8 + rng(0, 4) // 8-12 次
  const ops: OperationRecord[] = []
  let cursor = 6 * 60 // 06:00 in minutes

  for (let i = 0; i < count; i++) {
    const gap = rng(5, 30) // 间隔 5-30 分钟
    const dur = rng(30, 120) // 持续 30-120 分钟
    const start = cursor + gap
    const end = start + dur
    if (end > 22 * 60) break // 不超过 22:00

    const startHour = Math.floor(start / 60)
    const startMin = start % 60
    const endHour = Math.floor(end / 60)
    const endMin = end % 60
    const load = (20 + rng(0, 800) / 10).toFixed(1)
    const r = rng(0, 99)
    const status: OperationRecord['status'] = r < 75 ? 'normal' : r < 92 ? 'warn' : 'danger'

    ops.push({
      id: `OP-${String(i + 1).padStart(3, '0')}`,
      label: `第 ${i + 1} 次`,
      startHour,
      endHour,
      endMinute: endMin,
      duration: dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60}min` : `${dur}min`,
      load: `${load} t`,
      status
    })

    cursor = end
  }
  return ops
}

export type MonitoringPointStatus = 'online' | 'offline' | 'abnormal'

export interface MonitoringPointRow {
  pointId: string
  name: string
  location: string
  status: MonitoringPointStatus
  lastValue: string
}

export interface TwinInferenceStub {
  placeholderHint: string
  metrics: { label: string; value: string }[]
}

const SUMMARY_TEMPLATE: { name: string; location: string; unit: string }[] = [
  { name: '结构应力', location: '主梁/支腿', unit: 'με' },
  { name: '结构损伤应变', location: '焊缝/翼缘', unit: 'με' },
  { name: '减速机温度', location: '减速机①', unit: '°C' },
  { name: '减速机振动', location: '减速机②', unit: 'mm/s' },
  { name: '制动器失效', location: '制动器', unit: '项' },
  { name: '行走车轮振动', location: '行走机构', unit: 'mm/s' },
  { name: '电控运行参数', location: '电气柜', unit: '套' },
  { name: '三相电流', location: '变频柜', unit: 'A' },
  { name: '钢丝绳损伤', location: '卷扬', unit: '项' }
]

export function getDeviceMonitoringPoints(deviceId: string): MonitoringPointRow[] {
  const rng = mkRng(hashDeviceId(deviceId) + 1701)
  return SUMMARY_TEMPLATE.map((t, i) => {
    const st = rng(0, 99)
    const status: MonitoringPointStatus = st < 78 ? 'online' : st < 92 ? 'abnormal' : 'offline'
    const lastValue =
      status === 'offline'
        ? '—'
        : t.unit === '—'
          ? '图像流'
          : `${(rng(50, 980) / 10).toFixed(2)} ${t.unit}`
    return {
      pointId: `MP-${deviceId.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`,
      name: `${t.location}·${t.name}`,
      location: t.location,
      status,
      lastValue
    }
  })
}

export function getDeviceTwinInferenceStub(deviceId: string): TwinInferenceStub {
  const rng = mkRng(hashDeviceId(deviceId) + 3103)
  return {
    placeholderHint:
      '演示版预留区域：正式环境中将基于各监测点位数据融合推演整机力学状态、安全风险与剩余寿命等指标，并可与数字孪生体联动展示。',
    metrics: [
      { label: '整机健康指数（推演）', value: String(rng(72, 96)) },
      { label: '结构安全裕度（估）', value: `${rng(18, 42)}%` },
      { label: '综合风险趋势', value: pick(rng, ['稳定', '轻微波动', '需关注'] as const) }
    ]
  }
}
