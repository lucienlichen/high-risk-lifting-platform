export type RemoteSectionId =
  | 'structure'
  | 'mechanism'
  | 'electric'
  | 'rope'
  | 'other'

export interface RemoteTrendHistory {
  kind: 'trend'
  times: string[]
  values: number[]
  /** Y 轴名称（数值含义） */
  valueLabel?: string
}

export interface RemoteListHistory {
  kind: 'list'
  rows: { time: string; value: string }[]
}

export type RemoteItemHistory = RemoteTrendHistory | RemoteListHistory

export interface RemoteStatusItem {
  label: string
  value: string
  status: 'normal' | 'warn' | 'danger'
  history: RemoteItemHistory
}

export interface RemoteMonitoringData {
  lastRefresh: string
  structure: {
    stress: RemoteStatusItem[]
    damage: RemoteStatusItem[]
  }
  mechanism: {
    gearbox: RemoteStatusItem[]
    brake: RemoteStatusItem[]
    wheel: RemoteStatusItem[]
  }
  electric: RemoteStatusItem[]
  rope: RemoteStatusItem[]
  other: RemoteStatusItem[]
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

export function getRemoteMonitoringData(
  device: { id: string; riskLevel: 'normal' | 'low' | 'medium' | 'high' } | null
): RemoteMonitoringData | null {
  if (!device || device.id == null || device.id === '') return null
  const seed = hashDeviceId(String(device.id))
  const rng = mkRng(seed)

  const structure = {
    stress: [
      item(
        rng,
        seed,
        '主梁跨中应力',
        `${(85 + rng(0, 25) / 10).toFixed(1)} MPa`,
        makeTrendHistory(rng, seed, '主梁跨中应力', 88, 12, 'MPa')
      ),
      item(
        rng,
        seed,
        '端梁连接应力',
        `${(42 + rng(0, 18) / 10).toFixed(1)} MPa`,
        makeTrendHistory(rng, seed, '端梁连接应力', 44, 8, 'MPa')
      ),
      item(
        rng,
        seed,
        '刚性腿应力',
        `${(56 + rng(0, 20) / 10).toFixed(1)} MPa`,
        makeTrendHistory(rng, seed, '刚性腿应力', 58, 10, 'MPa')
      )
    ],
    damage: [
      item(
        rng,
        seed,
        '焊缝裂纹指数',
        `${rng(2, 18)} / 100`,
        makeTrendHistory(rng, seed, '焊缝裂纹指数', 10, 6, '指数', v => Math.max(0, Math.min(100, v)))
      ),
      item(
        rng,
        seed,
        '结构模态偏移',
        `${(rng(0, 35) / 10).toFixed(1)} Hz`,
        makeTrendHistory(rng, seed, '结构模态偏移', 3.2, 1.2, 'Hz', v => Math.round(v * 10) / 10)
      ),
      item(
        rng,
        seed,
        '疲劳损伤累积',
        `${rng(12, 48)}%`,
        makeTrendHistory(rng, seed, '疲劳损伤累积', 30, 12, '%', v => Math.max(0, Math.min(100, Math.round(v))))
      )
    ]
  }

  const mechanism = {
    gearbox: [
      item(
        rng,
        seed,
        '减速器轴承温度',
        `${58 + rng(0, 22)} °C`,
        makeTrendHistory(rng, seed, '减速器轴承温度', 68, 14, '°C')
      ),
      item(
        rng,
        seed,
        '齿轮啮合边频能量',
        `${rng(8, 35)} dB`,
        makeTrendHistory(rng, seed, '齿轮啮合边频能量', 22, 10, 'dB')
      ),
      item(
        rng,
        seed,
        '润滑油品质指数',
        pick(rng, ['优', '良', '注意'] as const),
        makeListHistory(rng, seed, '润滑油品质指数', ['优', '良', '注意', '良'])
      )
    ],
    brake: [
      item(
        rng,
        seed,
        '制动轮温升',
        `${32 + rng(0, 40)} °C`,
        makeTrendHistory(rng, seed, '制动轮温升', 48, 18, '°C')
      ),
      item(
        rng,
        seed,
        '制动力矩裕度',
        `${rng(18, 42)}%`,
        makeTrendHistory(rng, seed, '制动力矩裕度', 30, 10, '%', v => Math.max(5, Math.min(95, Math.round(v))))
      ),
      item(
        rng,
        seed,
        '制动响应时间',
        `${(rng(15, 45) / 100).toFixed(2)} s`,
        makeTrendHistory(rng, seed, '制动响应时间', 0.28, 0.12, 's', v => Math.round(v * 100) / 100)
      )
    ],
    wheel: [
      item(
        rng,
        seed,
        '大车车轮多边形指数',
        `${rng(5, 28)}`,
        makeTrendHistory(rng, seed, '大车车轮多边形指数', 16, 8, '指数', v => Math.max(0, Math.round(v)))
      ),
      item(
        rng,
        seed,
        '轮压不均度',
        `${(rng(8, 25) / 10).toFixed(1)} t`,
        makeTrendHistory(rng, seed, '轮压不均度', 1.6, 0.6, 't', v => Math.round(v * 10) / 10)
      ),
      item(
        rng,
        seed,
        '轨道冲击峰值',
        `${rng(12, 48)} kN`,
        makeTrendHistory(rng, seed, '轨道冲击峰值', 30, 14, 'kN', v => Math.max(0, Math.round(v)))
      )
    ]
  }

  const electric: RemoteStatusItem[] = [
    item(
      rng,
      seed,
      '变频器直流母线',
      `${512 + rng(-8, 8)} V`,
      makeTrendHistory(rng, seed, '变频器直流母线', 515, 6, 'V', v => Math.round(v))
    ),
    item(
      rng,
      seed,
      '主起升电流有效值',
      `${rng(80, 185)} A`,
      makeTrendHistory(rng, seed, '主起升电流有效值', 130, 35, 'A', v => Math.max(0, Math.round(v)))
    ),
    item(
      rng,
      seed,
      'PLC 通信丢包率',
      `${(rng(0, 8) / 10).toFixed(1)}%`,
      makeTrendHistory(rng, seed, 'PLC 通信丢包率', 0.35, 0.25, '%', v => Math.max(0, Math.round(v * 10) / 10))
    ),
    item(
      rng,
      seed,
      '急停回路自检',
      pick(rng, ['通过', '通过', '需复核'] as const),
      makeListHistory(rng, seed, '急停回路自检', ['通过', '通过', '通过', '需复核'])
    )
  ]

  const rope: RemoteStatusItem[] = [
    item(
      rng,
      seed,
      '钢丝绳直径损失',
      `${(rng(2, 18) / 10).toFixed(1)}%`,
      makeTrendHistory(rng, seed, '钢丝绳直径损失', 0.8, 0.35, '%', v => Math.max(0, Math.round(v * 10) / 10))
    ),
    item(
      rng,
      seed,
      '断丝计数（估）',
      `${rng(0, 3)} 处`,
      makeTrendHistory(rng, seed, '断丝计数（估）', 1.2, 1.1, '处', v => Math.max(0, Math.min(8, Math.round(v))))
    ),
    item(
      rng,
      seed,
      '润滑状态',
      pick(rng, ['良好', '一般', '需补油'] as const),
      makeListHistory(rng, seed, '润滑状态', ['良好', '良好', '一般', '需补油'])
    ),
    item(
      rng,
      seed,
      '卷筒层间磨损指数',
      `${rng(10, 40)}`,
      makeTrendHistory(rng, seed, '卷筒层间磨损指数', 26, 10, '指数', v => Math.max(0, Math.round(v)))
    )
  ]

  const other: RemoteStatusItem[] = [
    item(
      rng,
      seed,
      '吊钩开口度',
      `${(rng(0, 25) / 10).toFixed(1)} mm`,
      makeTrendHistory(rng, seed, '吊钩开口度', 1.2, 0.5, 'mm', v => Math.max(0, Math.round(v * 10) / 10))
    ),
    item(
      rng,
      seed,
      '缓冲器行程',
      `${rng(80, 120)} mm`,
      makeTrendHistory(rng, seed, '缓冲器行程', 100, 18, 'mm', v => Math.max(0, Math.round(v)))
    ),
    item(
      rng,
      seed,
      '防风锚定状态',
      pick(rng, ['已锚定', '未锚定', '半锚定'] as const),
      makeListHistory(rng, seed, '防风锚定状态', ['已锚定', '已锚定', '半锚定', '未锚定'])
    ),
    item(
      rng,
      seed,
      '风速（顶装）',
      `${(rng(0, 85) / 10).toFixed(1)} m/s`,
      makeTrendHistory(rng, seed, '风速（顶装）', 4.2, 2.5, 'm/s', v => Math.max(0, Math.round(v * 10) / 10))
    )
  ]

  const now = new Date()
  now.setMinutes(now.getMinutes() - rng(0, 8))
  const lastRefresh = now.toLocaleString('zh-CN')

  return {
    lastRefresh,
    structure,
    mechanism,
    electric,
    rope,
    other
  }
}
