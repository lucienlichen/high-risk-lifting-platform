export type Side = 'structure' | 'mechanism'
export type SchemeId = 1 | 2 | 3
export type Tone = 'ok' | 'warn' | 'alarm' | 'na'
export type DataKey = 'safety' | 'health' | 'risk' | 'inspect' | 'patrol'
export type SvcKey = 'overview' | 'remote' | 'assess' | 'crack' | 'fault' | 'life'

export interface SchemePoint {
  id: string
  name: string
  measured: boolean
  status: Exclude<Tone, 'na'>
}

export interface CycleRow {
  name: string
  start: string
  end: string
  load: string
  mid: string
  height: string
  peak: string
}

export interface StatItem {
  label: string
  value: string
  sub?: string
  tone?: 'blue' | 'green'
}

export interface SvcView {
  key: Exclude<SvcKey, 'overview'>
  name: string
  tone: Tone
  summary: string
  stats: { label: string; value: string }[]
  chartTitle: string
  chart: 'line' | 'fft' | 'none'
  series: number[]
  color: string
}

export const TONE_TEXT: Record<Tone, string> = {
  ok: '正常',
  warn: '异常',
  alarm: '报警',
  na: '不适用'
}

export const DATA_TABS: { key: DataKey; name: string; live: boolean }[] = [
  { key: 'safety', name: '安全监控', live: true },
  { key: 'health', name: '健康监测', live: true },
  { key: 'risk', name: '风险监测', live: false },
  { key: 'inspect', name: '检验检测', live: false },
  { key: 'patrol', name: '日常点巡检', live: false }
]

export const STRUCTURE_POINTS: SchemePoint[] = [
  { id: 'ML-01', name: '跨中上翼缘', measured: true, status: 'ok' },
  { id: 'ML-02', name: '跨中下翼缘', measured: true, status: 'alarm' },
  { id: 'ML-03', name: '1/4跨上翼缘', measured: true, status: 'warn' },
  { id: 'ML-04', name: '1/4跨下翼缘', measured: true, status: 'ok' },
  { id: 'ML-05', name: '3/4跨上翼缘', measured: true, status: 'ok' },
  { id: 'ML-06', name: '3/4跨下翼缘', measured: true, status: 'ok' },
  { id: 'ML-07', name: '左端头焊缝', measured: true, status: 'ok' },
  { id: 'ML-08', name: '支座附近', measured: false, status: 'ok' },
  { id: 'ML-09', name: '腹板中部', measured: false, status: 'ok' },
  { id: 'ML-10', name: '右端头焊缝', measured: false, status: 'ok' }
]

export const MECHANISM_POINTS: SchemePoint[] = [
  { id: 'M-01', name: '电机输出轴', measured: true, status: 'ok' },
  { id: 'G-01', name: '减速器高速轴', measured: true, status: 'ok' },
  { id: 'G-02', name: '减速器中间轴', measured: true, status: 'ok' },
  { id: 'G-03', name: '减速器低速轴', measured: true, status: 'warn' },
  { id: 'D-01', name: '卷筒轴承座', measured: true, status: 'ok' }
]

const STRUCT_CYCLES: CycleRow[] = [
  { name: '当前（进行中）', start: '15:28', end: '—', load: '33.1', mid: '18.4', height: '12.6', peak: '142.6' },
  { name: '上一循环', start: '15:19', end: '15:26', load: '30.8', mid: '17.9', height: '11.8', peak: '136.3' },
  { name: '第 3 循环', start: '15:02', end: '15:11', load: '28.4', mid: '16.2', height: '11.1', peak: '128.4' },
  { name: '第 4 循环', start: '14:41', end: '14:52', load: '31.6', mid: '19.1', height: '12.2', peak: '139.2' },
  { name: '第 5 循环', start: '14:18', end: '14:29', load: '26.9', mid: '15.4', height: '10.6', peak: '121.7' }
]

const MECH_CYCLES: CycleRow[] = [
  { name: '当前（进行中）', start: '15:28', end: '—', load: '33.1', mid: '8.4', height: '12.6', peak: '3.6' },
  { name: '上一循环', start: '15:19', end: '15:26', load: '30.8', mid: '8.1', height: '11.8', peak: '3.5' },
  { name: '第 3 循环', start: '15:02', end: '15:11', load: '28.4', mid: '7.6', height: '11.1', peak: '3.2' },
  { name: '第 4 循环', start: '14:41', end: '14:52', load: '31.6', mid: '8.0', height: '12.2', peak: '3.4' },
  { name: '第 5 循环', start: '14:18', end: '14:29', load: '26.9', mid: '7.2', height: '10.6', peak: '2.9' }
]

export const WEIGHT_SERIES = [22, 31, 27, 18, 24, 36, 30, 20, 34, 41, 29, 18, 33]
export const WEIGHT_AXIS = ['14:30', '', '', '14:45', '', '', '15:00', '', '', '15:15', '', '', '15:30']

export function pointsOf(side: Side): SchemePoint[] {
  return side === 'structure' ? STRUCTURE_POINTS : MECHANISM_POINTS
}

export function defaultPointId(side: Side): string {
  return side === 'structure' ? 'ML-01' : 'G-01'
}

export function pathOf(side: Side): string {
  return side === 'structure'
    ? '3G211-A2 冶金桥式起重机 / 金属结构 / 桥架 / 单双主梁'
    : '3G211-A2 冶金桥式起重机 / 起升机构 / 主起升机构 / 驱动装置'
}

export function modelTitle(side: Side): string {
  return side === 'structure' ? '结构模型 · 点位（单双主梁）' : '机构模型 · 点位（主起升机构传动链）'
}

export function modelCaption(side: Side, vertical: boolean): string {
  if (side === 'structure') {
    return vertical
      ? '单双主梁（竖向，自上而下 0→L）：左侧上翼缘，右侧下翼缘与腹板'
      : '单双主梁 · 立面示意：上翼缘点位标在梁上方，下翼缘点位标在梁下方，腹板点位标在最下一行'
  }
  return vertical
    ? '传动链（自上而下）：电机 → 联轴器 → 减速器 → 卷筒 → 轴承座'
    : '主起升机构 · 传动链示意：电机 → 联轴器 → 减速器 → 卷筒 → 卷筒轴承座'
}

export function conditionCards(side: Side): StatItem[] {
  if (side === 'structure') {
    return [
      { label: '起重量', value: '32.5 t', sub: '额定 50 t · 65%' },
      { label: '起升高度', value: '12.4 m' },
      { label: '小车位置', value: '18.6 m', sub: '距左端，接近跨中' },
      { label: '大车位置', value: '126.3 m' },
      { label: '运行状态', value: '起升中', tone: 'blue' },
      { label: '今日工作循环', value: '146 次', tone: 'green' }
    ]
  }
  return [
    { label: '起重量', value: '32.5 t', sub: '额定 50 t · 65%' },
    { label: '起升速度', value: '8.2 m/min' },
    { label: '起升高度', value: '12.4 m' },
    { label: '运行状态', value: '起升中', tone: 'blue' },
    { label: '今日运行时长', value: '6.2 h' },
    { label: '今日启停', value: '146 次', tone: 'green' }
  ]
}

export function cycleHead(side: Side): { mid: string; peak: string } {
  return side === 'structure'
    ? { mid: '小车位置 m', peak: '本点峰值应力 MPa' }
    : { mid: '起升速度 m/min', peak: '本点峰值有效值 mm/s' }
}

function wave(seed: number, count: number, base: number, amp: number): number[] {
  return Array.from({ length: count }, (_, index) => {
    const y = base + Math.sin((index + seed) / 2.3) * amp + ((index * 5 + seed) % 4) - 1.5
    return Math.round(y * 10) / 10
  })
}

function fft(seed: number): number[] {
  return Array.from({ length: 56 }, (_, index) => {
    const peak = [6, 12, 18, 27, 36].some(item => Math.abs(index - item - (seed % 3)) <= 0)
    return peak ? Math.round((0.55 + (seed % 4) * 0.08) * 100) / 100 : Math.round((0.02 + (index % 5) * 0.008) * 100) / 100
  })
}

function factor(point: SchemePoint): number {
  if (point.id === 'ML-01' || point.id === 'G-01') return 1
  if (point.status === 'alarm') return 1.32
  if (point.status === 'warn') return 1.16
  const salt = [...point.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return 0.86 + (salt % 12) / 100
}

function num(value: string, scale: number, digits: number): string {
  return (Number(value) * scale).toFixed(digits)
}

export function cyclesFor(side: Side, point: SchemePoint): CycleRow[] {
  const scale = point.id === 'ML-01' || point.id === 'G-01' ? 1 : factor(point)
  const source = side === 'structure' ? STRUCT_CYCLES : MECH_CYCLES
  const digits = side === 'structure' ? 1 : 1
  return source.map(row => ({ ...row, peak: scale === 1 ? row.peak : num(row.peak, scale, digits) }))
}

function toneOf(point: SchemePoint, applicable: boolean): Tone {
  if (!applicable) return 'na'
  return point.status
}

function exceed(point: SchemePoint): string {
  if (point.status === 'alarm') return '2次'
  if (point.status === 'warn') return '1次'
  return '0次'
}

export function serviceViews(side: Side, point: SchemePoint): SvcView[] {
  const scale = factor(point)
  if (side === 'structure') {
    const stress = point.id === 'ML-01' ? 97.2 : Math.round(97.2 * scale * 10) / 10
    const max = point.id === 'ML-01' ? 142.6 : Math.round(142.6 * scale * 10) / 10
    const damage = point.id === 'ML-01' ? 0.42 : Math.round(0.42 * scale * 100) / 100
    const years = point.id === 'ML-01' ? 6.2 : Math.round((6.2 / scale) * 10) / 10
    const remain = point.id === 'ML-01' ? 0.58 : Math.max(0.12, Math.round((0.58 / scale) * 100) / 100)
    const loops = point.id === 'ML-01' ? '6.4×10⁵' : point.status === 'alarm' ? '1.1×10⁶' : '6.4×10⁵'
    const crackLoops = point.id === 'ML-01' ? '8.9×10⁵' : point.status === 'alarm' ? '2.4×10⁵' : '8.9×10⁵'
    const hot = point.status
    const stressLine = hot === 'alarm' ? '当前应力高于预警值，近 24 h 有超限' : hot === 'warn' ? '当前应力接近预警值' : '监测量正常：当前应力低于预警值，近 24 h 无超限'
    const healthLine = hot === 'ok'
      ? '累积损伤度 D=0.42 · Ⅰ级 健康 · 处置：正常运行 · 结果时间 2026-11-06 09:18'
      : `累积损伤度 D=${damage.toFixed(2)} · ${hot === 'alarm' ? 'Ⅲ级 报警' : 'Ⅱ级 关注'} · 结果时间 2026-11-06 09:18`
    return [
      {
        key: 'remote', name: '远程监测', tone: toneOf(point, true), summary: stressLine,
        stats: [
          { label: '当前应力', value: `${stress} MPa` },
          { label: '近 24 h 超限', value: exceed(point) },
          { label: '近 24 h 最大', value: `${max} MPa` }
        ],
        chartTitle: '每小时最大应力 · 近 24 小时 · 依据：健康监测 · 应力 · 安全监控 · 工况',
        chart: 'line', series: wave(3, 24, stress, 12), color: '#1677ff'
      },
      {
        key: 'assess', name: '健康评估', tone: toneOf(point, true), summary: healthLine,
        stats: [
          { label: '累积损伤度 D', value: damage.toFixed(2) },
          { label: '健康等级', value: hot === 'alarm' ? 'Ⅲ级 报警' : hot === 'warn' ? 'Ⅱ级 关注' : 'Ⅰ级 健康' },
          { label: '已发生循环', value: `${loops} 次` }
        ],
        chartTitle: '累积损伤度 D · 今年（月度） · 依据：健康监测 · 应力 · 安全监控 · 载荷谱',
        chart: 'line', series: wave(6, 12, damage, damage * 0.15), color: '#1677ff'
      },
      {
        key: 'crack', name: '裂纹预测', tone: toneOf(point, true),
        summary: `剩余年限 ${years} 年 · 剩余损伤度 ${remain} · 剩余循环 ${crackLoops}`,
        stats: [
          { label: '剩余年限', value: `${years} 年` },
          { label: '剩余损伤度', value: String(remain) },
          { label: '剩余循环次数', value: `${crackLoops} 次` }
        ],
        chartTitle: '剩余损伤度 · 今年（月度） · 依据：健康监测 · 应力 · 安全监控 · 载荷谱',
        chart: 'line', series: wave(8, 12, remain, 0.04), color: '#1677ff'
      },
      {
        key: 'fault', name: '故障诊断', tone: 'na', summary: '该服务不适用于结构测点',
        stats: [], chartTitle: '', chart: 'none', series: [], color: '#1677ff'
      }
    ]
  }
  const rms = point.id === 'G-01' ? 2.8 : Math.round(2.8 * scale * 10) / 10
  const kurt = point.id === 'G-01' ? 3.1 : Math.round(3.1 * scale * 10) / 10
  const severe = point.id === 'G-01' ? 2.6 : Math.round(2.6 * scale * 10) / 10
  const speed = point.id === 'G-01' ? 985 : 960 + (point.id.charCodeAt(0) % 40)
  const hot = point.status
  const vibeLine = hot === 'ok'
    ? '振动有效值 2.8 mm/s，低于预警值 4.5 mm/s'
    : `振动有效值 ${rms} mm/s，${hot === 'alarm' ? '高于' : '接近'}预警值 4.5 mm/s`
  return [
    {
      key: 'remote', name: '远程监测', tone: toneOf(point, true), summary: vibeLine,
      stats: [
        { label: '振动有效值', value: `${rms} mm/s` },
        { label: '近 24 h 超限', value: exceed(point) },
        { label: '转速', value: `${speed} r/min` }
      ],
      chartTitle: '每小时振动有效值 · 近 24 小时 · 依据：健康监测 · 振动 · 健康监测 · 转速',
      chart: 'line', series: wave(4, 24, rms, 0.35), color: '#1677ff'
    },
    {
      key: 'assess', name: '健康评估', tone: toneOf(point, true),
      summary: hot === 'ok' ? '特征量均在预警线以下，运行状态良好' : '特征量接近或超过关注阈值',
      stats: [
        { label: '峭度', value: kurt.toFixed(1) },
        { label: '振动烈度', value: `${severe} mm/s` },
        { label: '有效值', value: `${rms} mm/s` }
      ],
      chartTitle: '峭度 · 近 30 天 · 依据：健康监测 · 振动',
      chart: 'line', series: wave(5, 30, kurt, 0.25), color: '#1677ff'
    },
    {
      key: 'crack', name: '裂纹预测', tone: 'na', summary: '该服务不适用于机构测点',
      stats: [], chartTitle: '', chart: 'none', series: [], color: '#1677ff'
    },
    {
      key: 'fault', name: '故障诊断', tone: toneOf(point, true),
      summary: hot === 'ok' ? '状态 A 正常 · 各特征频率幅值正常' : '频谱出现需关注的特征频率',
      stats: [
        { label: '诊断状态', value: hot === 'ok' ? 'A 正常' : hot === 'warn' ? 'B 关注' : 'C 报警' },
        { label: 'BPFO 幅值', value: hot === 'ok' ? '0.08 g' : '0.21 g' },
        { label: '1X 转频', value: '16.4 Hz' }
      ],
      chartTitle: 'FFT 频谱 · 0–1000 Hz · 依据：健康监测 · 振动 · 健康监测 · 转速',
      chart: 'fft', series: fft(point.id.length), color: '#1677ff'
    },
    {
      key: 'life', name: '寿命预测', tone: 'ok',
      summary: '剩余寿命 1860 天（置信区间 1620–2050 天）· 状态阶段 A 正常',
      stats: [
        { label: '剩余寿命', value: '1860 天' },
        { label: '状态阶段', value: 'A 正常' },
        { label: '置信区间', value: '1620–2050 天' }
      ],
      chartTitle: '有效值 · 算法入参（近 30 天） · 依据：健康监测 · 振动',
      chart: 'line', series: wave(9, 30, rms, 0.2), color: '#1677ff'
    }
  ]
}

export function cardOrder(side: Side): SvcView['key'][] {
  return side === 'structure'
    ? ['remote', 'assess', 'crack', 'fault']
    : ['remote', 'assess', 'fault', 'life', 'crack']
}

export function navKeys(side: Side): SvcKey[] {
  return side === 'structure'
    ? ['overview', 'remote', 'assess', 'crack', 'fault']
    : ['overview', 'remote', 'assess', 'crack', 'fault', 'life']
}

export function healthStats(side: Side, point: SchemePoint): { label: string; value: string }[] {
  const view = serviceViews(side, point)
  if (side === 'structure') {
    const remote = view.find(item => item.key === 'remote')!
    const assess = view.find(item => item.key === 'assess')!
    return [
      { label: '当前应力', value: remote.stats[0].value },
      { label: '近 24 h 最大', value: remote.stats[2].value },
      { label: '累积损伤度', value: assess.stats[0].value }
    ]
  }
  const remote = view.find(item => item.key === 'remote')!
  const assess = view.find(item => item.key === 'assess')!
  return [
    { label: '振动有效值', value: remote.stats[0].value },
    { label: '振动烈度', value: assess.stats[1].value },
    { label: '峭度', value: assess.stats[0].value },
    { label: '转速', value: remote.stats[2].value }
  ]
}
