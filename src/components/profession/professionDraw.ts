import {
  MECH_POINTS, STRUCT_POINTS, TONE_COLOR, addMonth, columnKey, isStruct, pointOf, pointsOf, randomOf, wan,
  type AnyPoint, type MechPoint, type MenuKey, type Prof, type StructPoint, type Tone
} from '@/components/profession/professionOverall'

const NS = 'http://www.w3.org/2000/svg'
function node(name: string, attrs: Record<string, string | number>, parent?: Element) {
  const element = document.createElementNS(NS, name)
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)))
  parent?.appendChild(element)
  return element
}
function text(parent: Element, x: number, y: number, value: string, options: { size?: number; color?: string; anchor?: string; weight?: number } = {}) {
  const element = node('text', { x, y, 'font-size': options.size || 11, fill: options.color || '#64748b', 'text-anchor': options.anchor || 'middle', 'font-weight': options.weight || 400 }, parent)
  element.textContent = value
  return element
}

export function paintModel(host: HTMLElement, prof: Prof, selectedId: string, onPick: (id: string) => void) {
  host.innerHTML = ''
  const svg = node('svg', { viewBox: '0 0 600 590', preserveAspectRatio: 'xMidYMid meet' }, host)
  const scale = 1.5
  const xOf = (value: number) => 300 + (value - 215) * scale
  const widthOf = (start: number, end: number) => xOf(end) - xOf(start)
  const current = pointOf(prof, selectedId)
  const highlight = (name: string) => prof === 'metal' && isStruct(current) && current.comp === name
  const fillOf = (name: string, base: string) => highlight(name) ? '#dbeafe' : base
  ;[[16, '上端梁'], [530, '下端梁']].forEach(([y, label]) => {
    node('rect', { x: xOf(52), y: Number(y), width: widthOf(52, 378), height: 30, rx: 3, fill: fillOf('端梁', '#e2e8f0'), stroke: '#94a3b8' }, svg)
    ;[52, 378].forEach(x => node('circle', { cx: xOf(x), cy: Number(y) + 15, r: 10, fill: '#cbd5e1', stroke: '#64748b' }, svg))
    text(svg, 300, Number(y) + 19, String(label), { color: '#64748b', size: 12 })
  })
  ;[[100, 'A侧主梁'], [290, 'B侧主梁']].forEach(([x, label]) => {
    node('rect', { x: xOf(Number(x)), y: 46, width: widthOf(Number(x), Number(x) + 40), height: 484, rx: 2, fill: fillOf('主梁', '#eef2f7'), stroke: '#94a3b8' }, svg)
    const center = xOf(Number(x) + 20)
    const labelNode = text(svg, center, 140, String(label), { color: '#94a3b8', size: 11 })
    labelNode.setAttribute('transform', `rotate(-90 ${center} 140)`)
  })
  ;[136, 294].forEach(x => node('line', { x1: xOf(x), x2: xOf(x), y1: 50, y2: 526, stroke: highlight('小车轨道') ? '#1677ff' : '#64748b', 'stroke-width': 2, 'stroke-dasharray': '8 3' }, svg))
  const trolley = prof === 'hoist' ? { y: 300, h: 200, dy: 372, dx: 170, dw: 92 } : { y: 420, h: 88, dy: 458, dx: 196, dw: 64 }
  node('rect', { x: xOf(140), y: trolley.y, width: widthOf(140, 290), height: trolley.h, rx: 4, fill: fillOf('小车架', '#f1f5f9'), stroke: '#64748b', 'stroke-width': 1.2 }, svg)
  node('rect', { x: xOf(trolley.dx), y: trolley.dy, width: widthOf(trolley.dx, trolley.dx + trolley.dw), height: 22, rx: 10, fill: '#fff', stroke: '#94a3b8' }, svg)
  text(svg, xOf(trolley.dx + trolley.dw / 2), trolley.dy + 15, '卷筒', { size: 10 })
  text(svg, 300, trolley.y - 5, prof === 'hoist' ? '小车架（起升机构）' : '小车架', { color: '#64748b', size: 11 })
  node('line', { x1: 300, x2: 300, y1: trolley.y + trolley.h, y2: 522, stroke: '#94a3b8', 'stroke-dasharray': '2 2' }, svg)
  if (prof !== 'metal') {
    node('rect', { x: xOf(28), y: 236, width: widthOf(28, 90), height: 150, rx: 3, fill: '#f8fafc', stroke: '#cbd5e1', 'stroke-dasharray': '3 2' }, svg)
    text(svg, xOf(59), 230, '电气室/走台', { size: 10 })
    node('line', { x1: xOf(40), x2: xOf(40), y1: 60, y2: 520, stroke: '#cbd5e1', 'stroke-width': 3 }, svg)
    text(svg, xOf(40) + 4, 58, '滑触线', { size: 10, anchor: 'start' })
  }
  node('rect', { x: xOf(346), y: 272, width: widthOf(346, 394), height: 56, rx: 4, fill: '#f8fafc', stroke: '#cbd5e1' }, svg)
  text(svg, xOf(370), 342, '司机室', { size: 10 })
  text(svg, 300, 586, '俯视示意 · 跨度方向自上而下', { color: '#94a3b8', size: 11 })
  pointsOf(prof).forEach(point => {
    const group = node('g', { style: 'cursor:pointer' }, svg)
    group.addEventListener('click', () => onPick(point.id))
    const title = node('title', {}, group)
    title.textContent = `${point.id} ${point.name}（${point.st}）`
    const color = TONE_COLOR[point.st]
    const selected = point.id === current.id
    const px = xOf(point.x)
    const py = point.y
    if (selected) node('circle', { cx: px, cy: py, r: 13, fill: 'none', stroke: '#1677ff', 'stroke-width': 2.5 }, group)
    if (point.st === 'alarm') node('circle', { cx: px, cy: py, r: 11, fill: color, 'fill-opacity': 0.18 }, group)
    const hollow = prof === 'metal' && isStruct(point) && !point.live
    node('circle', {
      cx: px, cy: py, r: 7,
      fill: point.st === 'off' || hollow ? '#fff' : color,
      stroke: color,
      'stroke-width': hollow ? 2.6 : 1.5,
      'stroke-dasharray': point.st === 'off' ? '2 2' : ''
    }, group)
    if (selected || point.st === 'alarm' || point.st === 'warn') {
      const right = px < 450
      const labelX = right ? px + 16 : px - 16
      const box = point.id.length * 7 + 10
      node('rect', { x: right ? labelX - 2 : labelX - box + 2, y: py - 10, width: box, height: 20, rx: 3, fill: selected ? '#1677ff' : '#fff', stroke: selected ? '#1677ff' : color }, group)
      text(group, right ? labelX + box / 2 - 2 : labelX - box / 2 + 2, py + 4, point.id, { size: 11.5, color: selected ? '#fff' : color, weight: 700 })
    }
  })
}

interface LineSeries { x: number[]; y: number[]; c: string; w?: number; dash?: string; op?: number; area?: boolean; end?: boolean }
interface PlotOptions {
  xmin: number
  xmax: number
  ymin: number
  ymax: number
  log?: boolean
  yt: number[]
  yf?: (value: number) => string
  xt: { v: number; l: string }[]
  bars?: { x0: number; x1: number; y: number; c?: string; lab?: string }[]
  lines?: LineSeries[]
  th?: { v: number; l: string; c: string; la?: string }[]
  vl?: { v: number; l: string; c: string }[]
  dots?: { x: number; y: number; c: string; l?: string; la?: string; r?: number }[]
  padL?: number
  padR?: number
  padB?: number
  yl?: string
}

function plot(host: HTMLElement, options: PlotOptions) {
  host.innerHTML = ''
  const width = host.clientWidth
  const height = host.clientHeight
  if (width < 60 || height < 40) return
  const svg = node('svg', { viewBox: `0 0 ${width} ${height}` }, host)
  const left = options.padL || 46
  const right = options.padR || 12
  const top = 8
  const bottom = options.padB || 24
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const project = (value: number) => options.log ? Math.log10(Math.max(value, 1e-9)) : value
  const xOf = (value: number) => left + (value - options.xmin) / (options.xmax - options.xmin) * plotWidth
  const yOf = (value: number) => top + plotHeight - (project(value) - project(options.ymin)) / (project(options.ymax) - project(options.ymin)) * plotHeight
  options.yt.forEach(value => {
    node('line', { x1: left, x2: left + plotWidth, y1: yOf(value), y2: yOf(value), stroke: '#eef0f3' }, svg)
    text(svg, left - 6, yOf(value) + 4, options.yf ? options.yf(value) : String(value), { anchor: 'end', size: 10.5 })
  })
  options.xt.forEach(tick => text(svg, xOf(tick.v), top + plotHeight + 15, tick.l, { size: 10.5, anchor: tick.v === options.xmin ? 'start' : tick.v === options.xmax ? 'end' : 'middle' }))
  node('line', { x1: left, x2: left, y1: top, y2: top + plotHeight, stroke: '#d1d5db' }, svg)
  node('line', { x1: left, x2: left + plotWidth, y1: top + plotHeight, y2: top + plotHeight, stroke: '#d1d5db' }, svg)
  if (options.yl) text(svg, left + 4, top + 10, options.yl, { anchor: 'start', size: 10, color: '#94a3b8' })
  ;(options.bars || []).forEach(bar => {
    const start = xOf(bar.x0)
    const end = xOf(bar.x1)
    const y = yOf(bar.y)
    node('rect', { x: start + 1, y, width: Math.max(1, end - start - 2), height: top + plotHeight - y, fill: bar.c || '#93c5fd', rx: 1 }, svg)
    if (bar.lab) text(svg, (start + end) / 2, y - 4, bar.lab, { size: 9.5, color: '#1d4ed8', weight: 700 })
  })
  ;(options.lines || []).forEach(series => {
    const path = series.x.map((value, index) => `${index ? 'L' : 'M'}${xOf(value).toFixed(1)},${yOf(series.y[index]).toFixed(1)}`).join('')
    if (series.area) node('path', { d: `${path}L${xOf(series.x[series.x.length - 1])},${top + plotHeight}L${xOf(series.x[0])},${top + plotHeight}Z`, fill: series.c, 'fill-opacity': 0.08 }, svg)
    node('path', { d: path, fill: 'none', stroke: series.c, 'stroke-width': series.w || 1.4, 'stroke-dasharray': series.dash || '', 'stroke-opacity': series.op ?? 1, 'stroke-linejoin': 'round' }, svg)
    if (series.end) {
      const last = series.x.length - 1
      node('circle', { cx: xOf(series.x[last]), cy: yOf(series.y[last]), r: 4, fill: '#fff', stroke: series.c, 'stroke-width': 2 }, svg)
    }
  })
  ;(options.th || []).forEach(mark => {
    const y = yOf(mark.v)
    node('line', { x1: left, x2: left + plotWidth, y1: y, y2: y, stroke: mark.c, 'stroke-dasharray': '6 4', 'stroke-width': 1.3 }, svg)
    text(svg, mark.la === 'start' ? left + 6 : left + plotWidth - 4, y - 5, mark.l, { anchor: mark.la || 'end', size: 10.5, color: mark.c })
  })
  ;(options.vl || []).forEach(mark => {
    const x = xOf(mark.v)
    node('line', { x1: x, x2: x, y1: top, y2: top + plotHeight, stroke: mark.c, 'stroke-dasharray': '3 3' }, svg)
    if (mark.l) text(svg, x + 4, top + 12, mark.l, { anchor: 'start', size: 10.5, color: mark.c })
  })
  ;(options.dots || []).forEach(dot => {
    node('circle', { cx: xOf(dot.x), cy: yOf(dot.y), r: dot.r || 4, fill: dot.c, stroke: '#fff', 'stroke-width': 1.5 }, svg)
    if (dot.l) text(svg, xOf(dot.x) + (dot.la === 'end' ? -7 : 7), yOf(dot.y) - 7, dot.l, { anchor: dot.la || 'start', size: 10.5, color: dot.c, weight: 700 })
  })
}

function block(title: string, desc: string, inner: string, flex = 1) {
  return `<div class="chartblock" style="flex:${flex}"><div><div class="ctitle">${title}</div>${desc ? `<div class="cdesc">${desc}</div>` : ''}</div>${inner}</div>`
}
function rank(list: AnyPoint[], value: (point: AnyPoint) => number, format: (value: number) => string, max: number, selected: string) {
  return `<div class="rank">${list.map(point => `<div class="rankrow${point.id === selected ? ' sel' : ''}"><span>${point.id}</span><div class="rankbg"><div class="rankbar" style="width:${Math.max(2, value(point) / max * 100)}%;background:${point.id === selected ? '#1677ff' : TONE_COLOR[point.st]}"></div></div><span style="text-align:right">${format(value(point))}</span></div>`).join('')}</div>`
}
function kpis(items: [string, string, string?][]) {
  return `<div class="kpirow">${items.map(([label, value, unit]) => `<div class="kpi"><small>${label}</small><b>${value}<em>${unit || ''}</em></b></div>`).join('')}</div>`
}
function nice(value: number) {
  const exponent = Math.pow(10, Math.floor(Math.log10(value)))
  for (const step of [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10]) if (step * exponent >= value) return step * exponent
  return 10 * exponent
}
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']

export function paintAnalysis(host: HTMLElement, prof: Prof, menu: MenuKey, selectedId: string) {
  const point = pointOf(prof, selectedId)
  const key = columnKey(prof, menu)
  const tag = host.parentElement?.querySelector('.selected-tag')
  if (tag) tag.textContent = `${point.id} · ${point.name}`
  if (!isStruct(point) && point.st === 'off') {
    host.innerHTML = '<div class="empty">该部件暂未接入监测</div>'
    return
  }
  if (key === 'health' && isStruct(point)) paintStructHealth(host, point, selectedId)
  else if (key === 'crack' && isStruct(point)) paintCrack(host, point)
  else if (key === 'damage' && isStruct(point)) paintDamage(host, point)
  else if (!isStruct(point)) paintMech(host, prof, key, point)
}

function paintStructHealth(host: HTMLElement, point: StructPoint, selectedId: string) {
  host.innerHTML = block('应力幅–循环次数', `<strong>${point.id}</strong> 累计应力谱（柱）与 S–N 许用循环次数（虚线）`, '<div class="cg" id="ov-g1"></div><div class="chartlegend"><span><i style="border-color:#60a5fa;border-top-width:8px;width:10px"></i>已发生循环次数</span><span><i style="border-color:#dc2626;border-top-style:dashed"></i>S–N 许用循环次数</span></div>', 1.25)
    + kpis([['最大应力幅', point.smax.toFixed(1), 'MPa'], ['应力谱系数', point.km.toFixed(2)], ['累积损伤度', point.D.toFixed(2)]])
    + block('累积损伤度排行', '全部点位前 10', rank([...STRUCT_POINTS].sort((left, right) => right.D - left.D).slice(0, 10), item => (item as StructPoint).D, value => value.toFixed(2), 1, selectedId))
  const random = randomOf(`${point.id}sp`)
  const bins = []
  const top = Math.ceil(point.smax / 10) * 10
  for (let stress = 10; stress <= top; stress += 10) {
    const fraction = Math.exp(-(stress / point.smax) * 7.5)
    bins.push({ x0: stress - 10, x1: stress, y: Math.max(30, point.n * fraction * (0.55 + random() * 0.2)), c: '#93c5fd' })
  }
  const max = Math.max(150, top + 20)
  const snx: number[] = []
  const sny: number[] = []
  for (let stress = 30; stress <= max; stress += 5) { snx.push(stress); sny.push(2e6 * (80 / stress) ** 3) }
  const chart = host.querySelector<HTMLElement>('#ov-g1')
  if (chart) plot(chart, { xmin: 0, xmax: max, ymin: 10, ymax: 1e8, log: true, yt: [1e2, 1e4, 1e6, 1e8], yf: value => `10^${Math.log10(value)}`, xt: [0, 50, 100, 150].map(value => ({ v: value, l: `${value} MPa` })), bars: bins, lines: [{ x: snx, y: sny, c: '#dc2626', dash: '6 4', w: 1.6 }], vl: [{ v: point.smax, l: `最大 ${point.smax.toFixed(0)}`, c: '#1677ff' }] })
}

function paintCrack(host: HTMLElement, point: StructPoint) {
  host.innerHTML = block('测点与数字孪生生成点剩余循环次数曲线', '2026 年 1–11 月 · 选中点位高亮', '<div class="cg" id="ov-g1"></div><div class="chartlegend"><span><i style="border-color:#475569"></i>实测点</span><span><i style="border-color:#a78bfa;border-top-style:dashed"></i>数字孪生生成点</span><span><i style="border-color:#1677ff;border-top-width:3px"></i>选中点位</span></div>', 1.6)
    + kpis([['裂纹萌生寿命', point.L.toFixed(1), '年'], ['剩余循环次数', wan(point.rc), '万次'], ['剩余损伤度', point.rd.toFixed(2)]])
    + block('剩余年限最短的点位', '前 6', rank([...STRUCT_POINTS].sort((left, right) => (left as StructPoint).L - (right as StructPoint).L).slice(0, 6), item => (item as StructPoint).L, value => value.toFixed(1), 9, point.id), 0.8)
  const yearly = (item: StructPoint) => item.rc / item.L
  const lines = STRUCT_POINTS.map(item => {
    const x: number[] = []
    const y: number[] = []
    for (let month = 0; month <= 10; month += 1) { x.push(month); y.push((item.rc + yearly(item) * (10 - month) / 12) / 1e4) }
    const selected = item.id === point.id
    const tone: Tone = item.st
    return { x, y, c: selected ? '#1677ff' : tone === 'alarm' ? '#ef4444' : tone === 'warn' ? '#f59e0b' : item.live ? '#475569' : '#a78bfa', w: selected ? 3 : tone !== 'ok' ? 1.6 : 1, op: selected ? 1 : tone !== 'ok' ? 0.9 : 0.45, dash: item.live ? '' : '4 3', end: selected }
  }).sort((left, right) => (left.w || 1) - (right.w || 1))
  const ymax = Math.ceil(Math.max(...STRUCT_POINTS.map(item => (item.rc + yearly(item) * 10 / 12) / 1e4)) / 100) * 100
  const chart = host.querySelector<HTMLElement>('#ov-g1')
  if (chart) plot(chart, { xmin: 0, xmax: 10, ymin: 0, ymax, yt: [0, ymax / 4, ymax / 2, ymax * 3 / 4, ymax], yf: value => value.toFixed(0), yl: '万次', xt: [0, 2, 4, 6, 8, 10].map(value => ({ v: value, l: `2026-${MONTHS[value]}` })), lines, dots: [{ x: 10, y: point.rc / 1e4, c: '#1677ff', l: point.id, la: 'end' }] })
}

function paintDamage(host: HTMLElement, point: StructPoint) {
  const conclusion = point.st === 'alarm' ? '当前点位声发射信号明显，存在活性缺陷迹象，建议复检' : '当前点位声发射信号不明显，暂未见明显的活性缺陷'
  host.innerHTML = block('各点位声发射撞击数（24h）', '按点位编号排列 · 选中点位蓝色', '<div class="cg" id="ov-g1"></div>')
    + block(`${point.id} 近 7 天声发射幅值`, '每小时最大幅值 · 虚线为 40 dB 阈值', '<div class="cg" id="ov-g2"></div>')
    + `<div class="kpi note" style="color:${point.st === 'alarm' ? '#b91c1c' : '#15803d'}"><small>结论</small>${conclusion}<br>${point.ec}</div>`
  const ordered = [...STRUCT_POINTS].sort((left, right) => left.id < right.id ? -1 : 1)
  const bars = ordered.map((item, index) => ({ x0: index, x1: index + 1, y: item.hits, c: item.id === point.id ? '#1677ff' : item.st === 'alarm' ? '#fca5a5' : item.st === 'warn' ? '#fcd34d' : '#cbd5e1' }))
  const first = host.querySelector<HTMLElement>('#ov-g1')
  if (first) plot(first, { xmin: 0, xmax: ordered.length, ymin: 0, ymax: 200, yt: [0, 50, 100, 150, 200], xt: [{ v: 0.5, l: ordered[0].id }, { v: ordered.length / 2, l: ordered[Math.floor(ordered.length / 2)].id }, { v: ordered.length - 0.5, l: ordered[ordered.length - 1].id }], bars, padB: 22 })
  const random = randomOf(`${point.id}aw`)
  const x: number[] = []
  const y: number[] = []
  const base = point.st === 'alarm' ? 44 : point.st === 'warn' ? 33 : 26
  for (let hour = -167; hour <= 0; hour += 1) {
    const working = ((hour % 24) + 24 + 15) % 24 >= 7
    x.push(hour)
    y.push(Math.min(60, (working ? base + 3 : base - 8) + (random() - 0.5) * 7 + (point.st === 'alarm' && random() < 0.12 ? 8 : 0)))
  }
  const second = host.querySelector<HTMLElement>('#ov-g2')
  if (second) plot(second, { xmin: -167, xmax: 0, ymin: 0, ymax: 60, yt: [0, 20, 40, 60], xt: [-144, -96, -48, 0].map(value => ({ v: value, l: `11-${String(11 + Math.round(value / 24)).padStart(2, '0')}` })), lines: [{ x, y, c: '#7c3aed', w: 1.2 }], th: [{ v: 40, l: '阈值 40 dB', c: '#d97706' }] })
}

function paintMech(host: HTMLElement, prof: Exclude<Prof, 'metal'> | Prof, key: string, point: MechPoint) {
  const up = point.ma > point.mw
  const ymax = nice(up ? Math.max(point.ma * 1.12, point.mv * 1.3) : Math.max(point.mv * 1.15, point.mw * 1.2))
  const marks = [{ v: point.mw, l: `异常 ${point.mw}`, c: '#d97706' }, { v: point.ma, l: `报警 ${point.ma}`, c: '#dc2626' }]
  const ticks = [0, ymax / 4, ymax / 2, ymax * 3 / 4, ymax].map(value => +value.toFixed(2))
  if (key === 'mhealth') {
    host.innerHTML = kpis([[point.mn, String(point.mv), point.mu], ['辅助指标', point.aux.split(' ').slice(1).join(' '), ''], ['健康指数', String(point.hi), '']])
      + block(`${point.mn} · 今日 24 小时`, `<strong>${point.id}</strong> ${point.name} · 单位 ${point.mu}`, '<div class="cg" id="ov-g1"></div>', 1.3)
      + block('健康指数排行', `${prof === 'metal' ? '' : ''}${MECH_NAME(prof)} 全部测点 · 由低到高`, rank(MECH_POINTS[prof as Exclude<Prof, 'metal'>].filter(item => item.st !== 'off').sort((left, right) => left.hi - right.hi).slice(0, 8), item => (item as MechPoint).hi, value => String(value), 100, point.id))
    const random = randomOf(`${point.id}${key}`)
    const x: number[] = []
    const y: number[] = []
    for (let minute = 0; minute <= 930; minute += 10) {
      const working = (minute > 420 && minute < 690) || minute > 780
      x.push(minute)
      y.push(Math.max(0, point.mv * (working ? 1 : 0.55) * (1 + (random() - 0.5) * 0.18)))
    }
    const chart = host.querySelector<HTMLElement>('#ov-g1')
    if (chart) plot(chart, { xmin: 0, xmax: 1440, ymin: 0, ymax, yt: ticks, xt: [0, 6, 12, 18, 24].map(hour => ({ v: hour * 60, l: `${hour}:00` })), lines: [{ x, y, c: '#1677ff', area: true }], th: marks, vl: [{ v: 930, l: '当前 15:30', c: '#1677ff' }] })
  } else if (key === 'mdiag') {
    host.innerHTML = block(`${point.mn} · 近 30 天趋势`, `<strong>${point.id}</strong> ${point.name} · 日均值 · 单位 ${point.mu}`, '<div class="cg" id="ov-g1"></div>', 1.3)
      + `<div class="chartblock" style="flex:.9"><div class="ctitle">诊断结论</div><div class="diag" style="color:${point.st === 'ok' ? '#15803d' : '#b45309'}">${point.diag}</div><div class="diag-body">诊断特征：${point.feat}<br>处置建议：${point.adv}<br>辅助指标：${point.aux}</div><div class="diag-foot">依据 振动 / 温度 / 动作信号 等机构监测数据</div></div>`
    const random = randomOf(`${point.id}${key}`)
    const x: number[] = []
    const y: number[] = []
    const start = point.st === 'ok' ? point.mv : (up ? point.mv * 0.62 : point.mv * 1.2)
    for (let day = -29; day <= 0; day += 1) {
      const progress = (day + 29) / 29
      x.push(day)
      y.push(Math.max(0, (start + (point.mv - start) * progress * progress) * (1 + (random() - 0.5) * 0.08)))
    }
    const chart = host.querySelector<HTMLElement>('#ov-g1')
    if (chart) plot(chart, { xmin: -29, xmax: 0, ymin: 0, ymax, yt: ticks, xt: [-28, -21, -14, -7, 0].map(value => { const date = new Date(2026, 10, 11 + value); return { v: value, l: `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` } }), lines: [{ x, y, c: '#0d9488', area: true, end: true }], th: marks })
  } else {
    host.innerHTML = kpis([['剩余寿命', String(point.life), '月'], ['健康指数', String(point.hi), ''], ['预计维护', addMonth(Math.max(1, point.life - 1)), '']])
      + block('健康指数退化与预测', `<strong>${point.id}</strong> ${point.name} · 实线为历史，虚线为预测，降至 60 视为需维护`, '<div class="cg" id="ov-g1"></div>', 1.4)
      + block('剩余寿命最短的测点', '单位 月', rank(MECH_POINTS[prof as Exclude<Prof, 'metal'>].filter(item => item.st !== 'off').sort((left, right) => left.life - right.life).slice(0, 6), item => (item as MechPoint).life, value => String(value), 60, point.id), 0.9)
    const random = randomOf(`${point.id}${key}`)
    const x: number[] = []
    const y: number[] = []
    const slope = (point.hi - 60) / point.life
    for (let month = -12; month <= 0; month += 1) { x.push(month); y.push(Math.min(100, point.hi - slope * month + (random() - 0.5) * 2 * (month ? 1 : 0))) }
    const horizon = Math.max(12, point.life)
    const chart = host.querySelector<HTMLElement>('#ov-g1')
    if (chart) plot(chart, { xmin: -12, xmax: horizon, ymin: 40, ymax: 100, yt: [40, 60, 80, 100], xt: [{ v: -12, l: '12 个月前' }, { v: 0, l: '当前' }, { v: horizon, l: `+${horizon} 月` }], lines: [{ x, y, c: '#1677ff', w: 2 }, { x: [0, point.life], y: [point.hi, 60], c: '#1677ff', dash: '6 4', w: 1.6 }], th: [{ v: 60, l: '维护阈值 60', c: '#dc2626', la: 'start' }], dots: [{ x: point.life, y: 60, c: '#dc2626', l: `到达阈值 ${addMonth(point.life)}`, la: 'end' }], vl: [{ v: 0, l: '', c: '#94a3b8' }] })
  }
}

function MECH_NAME(prof: Prof) {
  return prof === 'hoist' ? '起升机构' : prof === 'travel' ? '运行机构' : prof === 'electric' ? '电气系统' : prof === 'safety' ? '安全防护装置' : '金属结构'
}
