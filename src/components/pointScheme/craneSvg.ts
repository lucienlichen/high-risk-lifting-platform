import { STRUCTURE_POINTS, type ModelMode, type StructurePoint } from '@/mock/structurePointDetail'

interface Pt { x: number; y: number }
interface Paint { t: string; f: string; s: string; e: string }

const STRESS = ['#1d4ed8', '#2563eb', '#0ea5e9', '#22c55e', '#84cc16', '#facc15', '#fb923c', '#ef4444', '#b91c1c']
const STEEL: Paint = { t: '#9eacba', f: '#748492', s: '#556473', e: '#3a4654' }
const STEEL_D: Paint = { t: '#8b9aaa', f: '#647384', s: '#4a5866', e: '#33404c' }
const RAIL: Paint = { t: '#4b5563', f: '#374151', s: '#1f2937', e: '#111827' }
const YELLOW: Paint = { t: '#f4d03f', f: '#d4a017', s: '#b8860b', e: '#7a5a08' }

function n(value: number) {
  return value.toFixed(1)
}

function xml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function project(x: number, y: number, z: number): Pt {
  return { x: 70 + x * 0.86 + y * 0.52, y: 610 - y * 0.34 - z * 0.88 }
}

function face(pts: Pt[], fill: string, stroke = '#3f4c5a', sw = 0.75, opacity = 1) {
  const d = pts.map((point, index) => `${index ? 'L' : 'M'}${n(point.x)},${n(point.y)}`).join(' ') + ' Z'
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" opacity="${opacity}"/>`
}

function box(x: number, y: number, z: number, dx: number, dy: number, dz: number, cols: Paint) {
  const p = project
  const top = [p(x, y, z + dz), p(x + dx, y, z + dz), p(x + dx, y + dy, z + dz), p(x, y + dy, z + dz)]
  const front = [p(x, y, z), p(x + dx, y, z), p(x + dx, y, z + dz), p(x, y, z + dz)]
  const side = [p(x + dx, y, z), p(x + dx, y + dy, z), p(x + dx, y + dy, z + dz), p(x + dx, y, z + dz)]
  return face(side, cols.s, cols.e) + face(front, cols.f, cols.e) + face(top, cols.t, cols.e)
}

function stressColor(value: number) {
  return STRESS[Math.max(0, Math.min(8, Math.floor(value / 14)))]
}

function stressAt(x: number) {
  const ratio = Math.max(0, 1 - Math.abs(x - 440) / 420)
  return 16 + 98 * Math.pow(ratio, 1.35)
}

function column(x: number, y: number) {
  return box(x, y, 0, 28, 28, 248, { t: '#8b97a4', f: '#6b7784', s: '#545e6a', e: '#3a434d' })
    + box(x - 8, y - 8, 248, 44, 44, 14, { t: '#7d8894', f: '#5c6773', s: '#4a5460', e: '#333c46' })
}

function endTruck(x: number) {
  let svg = box(x, 78, 262, 48, 220, 28, STEEL)
  ;[0, 1, 2, 3].forEach(index => {
    const y = index % 2 === 0 ? 88 : 278
    const center = project(x + 12 + (index < 2 ? 0 : 24), y, 258)
    svg += `<ellipse cx="${n(center.x)}" cy="${n(center.y)}" rx="7" ry="7" fill="#1f2937" stroke="#0f172a"/>`
  })
  return svg + box(x + 8, 96, 290, 32, 184, 10, STEEL_D)
}

function girder(y0: number, name: string, behind: boolean, cloud: boolean) {
  const x0 = 84
  const len = 720
  const width = 48
  const z0 = 278
  const height = 42
  let body = ''
  if (cloud) {
    const segments = 24
    for (let index = 0; index < segments; index += 1) {
      const xa = x0 + len * index / segments
      const dx = len / segments + 0.2
      const value = stressAt(xa + dx / 2) + (behind ? 4 : 0)
      body += box(xa, y0, z0, dx, width, height, { t: stressColor(value), f: stressColor(value - 8), s: stressColor(value - 14), e: '#334155' })
    }
  } else {
    body += box(x0, y0, z0, len, width, height, behind ? STEEL_D : STEEL)
    for (let x = x0 + 36; x < x0 + len - 20; x += 48) {
      body += box(x, y0, z0 + 4, 5, width, height - 8, { t: '#8a99a8', f: '#5e6d7c', s: '#4a5866', e: '#3a4654' })
    }
  }
  body += box(x0 - 2, y0 + 16, z0 + height, len + 4, 10, 6, RAIL)
  body += box(x0 - 8, y0 + 8, z0 + height, 10, 28, 16, YELLOW)
  body += box(x0 + len - 2, y0 + 8, z0 + height, 10, 28, 16, YELLOW)
  const label = project(x0 + 20, y0 + width + 8, z0 + height + 8)
  const wrapped = behind ? body : `<g filter="url(#spdSoft)">${body}</g>`
  return `${wrapped}<text x="${n(label.x)}" y="${n(label.y)}" font-size="13" font-weight="700" fill="${behind ? '#334155' : '#0f2340'}">${name}</text>`
}

function marker(point: StructurePoint, selectedId: string) {
  const z = point.z === 'top' ? 326 : 274
  const at = project(point.x, point.y + (point.z === 'bot' ? -6 : 6), z)
  const color = point.status === 'alarm' ? '#ef4444' : point.status === 'warn' ? '#f59e0b' : '#16a34a'
  const selected = point.id === selectedId
  const above = point.z === 'top'
  const lx = at.x + (point.beam === 'B梁' ? 16 : -16)
  const ly = at.y + (above ? -16 : 18)
  const anchor = point.beam === 'B梁' ? 'start' : 'end'
  return `<g data-ptid="${point.id}" style="cursor:pointer">
    <circle class="hov" cx="${n(at.x)}" cy="${n(at.y)}" r="13" fill="none" stroke="#60a5fa" stroke-width="2" visibility="hidden"/>
    ${selected ? `<circle cx="${n(at.x)}" cy="${n(at.y)}" r="14" fill="none" stroke="#1677ff" stroke-width="2.4"/><circle cx="${n(at.x)}" cy="${n(at.y)}" r="18" fill="none" stroke="#1677ff" stroke-width="1" stroke-dasharray="3 2"/>` : ''}
    <circle data-dot="1" cx="${n(at.x)}" cy="${n(at.y)}" r="${selected ? 7 : 5.5}" fill="${color}" stroke="#fff" stroke-width="1.6"/>
    <text x="${n(lx)}" y="${n(ly)}" text-anchor="${anchor}" font-size="${selected ? 12 : 10}" font-weight="${selected ? 700 : 600}" fill="${selected ? '#0b4fc4' : '#1f2937'}">${point.id}</text>
    <text class="loclab" x="${n(lx)}" y="${n(ly + 12)}" text-anchor="${anchor}" font-size="10" fill="#475569" visibility="${selected ? 'visible' : 'hidden'}">${xml(point.loc)}</text>
  </g>`
}

export function craneSvg(mode: ModelMode, selectedId: string) {
  const cloud = mode === 'cloud'
  const floor = [project(-60, -20, 0), project(960, -20, 0), project(960, 400, 0), project(-60, 400, 0)]
  let grid = ''
  for (let x = 0; x <= 900; x += 60) {
    const a = project(x, 0, 0)
    const b = project(x, 380, 0)
    grid += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="#94a3b8" stroke-width="0.6"/>`
  }
  for (let y = 0; y <= 380; y += 40) {
    const a = project(0, y, 0)
    const b = project(900, y, 0)
    grid += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="#94a3b8" stroke-width="0.6"/>`
  }
  let walk = ''
  for (let x = 110; x <= 780; x += 40) {
    const a = project(x, 288, 324)
    const b = project(x, 288, 348)
    walk += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="#475569" stroke-width="1.2"/>`
  }
  const railA = project(110, 288, 348)
  const railB = project(780, 288, 348)
  walk += `<line x1="${n(railA.x)}" y1="${n(railA.y)}" x2="${n(railB.x)}" y2="${n(railB.y)}" stroke="#475569" stroke-width="1.4"/>`

  const tx = 400
  const ty = 100
  const tz = 326
  let trolley = box(tx, ty, tz, 120, 176, 28, { t: '#c0c9d3', f: '#7d8b99', s: '#5c6b79', e: '#3a4654' })
  trolley += box(tx + 8, ty + 6, tz - 8, 28, 36, 12, STEEL_D)
  trolley += box(tx + 84, ty + 6, tz - 8, 28, 36, 12, STEEL_D)
  trolley += box(tx + 8, ty + 134, tz - 8, 28, 36, 12, STEEL_D)
  trolley += box(tx + 84, ty + 134, tz - 8, 28, 36, 12, STEEL_D)
  trolley += box(tx + 30, ty + 60, tz + 28, 60, 56, 36, { t: '#94a3b8', f: '#64748b', s: '#475569', e: '#1f2937' })
  const drum = project(tx + 60, ty + 88, tz + 64)
  trolley += `<ellipse cx="${n(drum.x)}" cy="${n(drum.y)}" rx="16" ry="11" fill="#334155" stroke="#0f172a"/>`

  const hookTop = project(tx + 60, ty + 88, tz)
  const hook = project(tx + 60, ty + 88, 118)
  const hookBlock = box(tx + 48, ty + 76, 134, 24, 24, 16, YELLOW)
  let festoon = ''
  let prev: Pt | null = null
  for (let index = 0; index < 10; index += 1) {
    const at = project(84 + index * 28, 132, 330)
    if (prev) festoon += `<path d="M${n(prev.x)},${n(prev.y)} Q${n((prev.x + at.x) / 2)},${n(prev.y + 12)} ${n(at.x)},${n(at.y)}" fill="none" stroke="#1f2937" stroke-width="1.2"/>`
    festoon += `<circle cx="${n(at.x)}" cy="${n(at.y)}" r="2.2" fill="#111827"/>`
    prev = at
  }
  const last = project(tx, 132, 330)
  if (prev) festoon += `<path d="M${n(prev.x)},${n(prev.y)} Q${n((prev.x + last.x) / 2)},${n(prev.y + 14)} ${n(last.x)},${n(last.y)}" fill="none" stroke="#1f2937" stroke-width="1.2"/>`

  const cab = box(96, 40, 210, 70, 50, 70, { t: '#dbe3ec', f: '#8ea0b3', s: '#64788c', e: '#334155' })
    + face([project(102, 40, 230), project(158, 40, 230), project(158, 40, 268), project(102, 40, 268)], '#cde6f5', '#334155', 0.8, 0.9)
  const cabAt = project(130, 40, 286)
  const spanA = project(84, -8, 0)
  const spanB = project(804, -8, 0)
  const spanM = project(444, -8, 0)
  const travelA = project(-20, 90, 0)
  const travelB = project(-20, 300, 0)
  let legend = ''
  ;[['#16a34a', '正常'], ['#f59e0b', '异常'], ['#ef4444', '报警']].forEach((item, index) => {
    legend += `<circle cx="${18 + index * 74 + 6}" cy="658" r="5" fill="${item[0]}" stroke="#fff" stroke-width="1.2"/>`
    legend += `<text x="${18 + index * 74 + 16}" y="662" font-size="11" fill="#334155">${item[1]}</text>`
  })
  let scale = ''
  if (cloud) {
    scale += `<text x="1060" y="70" font-size="11" fill="#475569" text-anchor="middle">应力（MPa，演示）</text>`
    STRESS.forEach((color, index) => {
      scale += `<rect x="1046" y="${86 + index * 28}" width="28" height="28" fill="${color}" stroke="#334155" stroke-width="0.4"/>`
    })
    ;[0, 14, 28, 42, 56, 70, 84, 98, 112, 126].forEach((value, index) => {
      scale += `<text x="1080" y="${90 + index * 28}" font-size="10" fill="#475569">${value}</text>`
    })
  }

  return `<svg viewBox="0 0 1180 680" preserveAspectRatio="xMidYMid meet" aria-label="双梁桥机结构模型示意">
    <defs>
      <linearGradient id="spdSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef3f8"/><stop offset="1" stop-color="#d5e0ec"/></linearGradient>
      <linearGradient id="spdFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe6ee"/><stop offset="1" stop-color="#c5ced8"/></linearGradient>
      <filter id="spdSoft"><feDropShadow dx="1.2" dy="2.2" stdDeviation="1.6" flood-color="#0f2340" flood-opacity=".18"/></filter>
    </defs>
    <rect x="0" y="0" width="1180" height="680" fill="url(#spdSky)"/>
    ${face(floor, 'url(#spdFloor)', '#9aa7b5', 0.8)}
    <g opacity=".35">${grid}</g>
    ${column(-40, 20)}${column(-40, 340)}${column(900, 20)}${column(900, 340)}
    ${box(-48, 8, 248, 36, 370, 16, STEEL_D)}${box(900, 8, 248, 36, 370, 16, STEEL_D)}
    ${box(-42, 8, 264, 10, 370, 6, RAIL)}${box(916, 8, 264, 10, 370, 6, RAIL)}
    ${endTruck(36)}${endTruck(804)}
    ${girder(222, 'B梁', true, cloud)}
    ${box(90, 270, 320, 708, 18, 4, { t: '#c5ced6', f: '#8b97a3', s: '#6b7784', e: '#4b5563' })}
    ${walk}
    <g filter="url(#spdSoft)">${trolley}</g>
    <line x1="${n(hookTop.x)}" y1="${n(hookTop.y + 8)}" x2="${n(hook.x)}" y2="${n(hook.y)}" stroke="#111827" stroke-width="1.6"/>
    <line x1="${n(hookTop.x - 6)}" y1="${n(hookTop.y + 8)}" x2="${n(hook.x - 5)}" y2="${n(hook.y)}" stroke="#111827" stroke-width="1.2"/>
    <line x1="${n(hookTop.x + 6)}" y1="${n(hookTop.y + 8)}" x2="${n(hook.x + 5)}" y2="${n(hook.y)}" stroke="#111827" stroke-width="1.2"/>
    ${hookBlock}
    <path d="M${n(hook.x - 2)},${n(hook.y + 14)} C${n(hook.x + 16)},${n(hook.y + 14)} ${n(hook.x + 18)},${n(hook.y + 42)} ${n(hook.x)},${n(hook.y + 44)} C${n(hook.x - 14)},${n(hook.y + 44)} ${n(hook.x - 12)},${n(hook.y + 28)} ${n(hook.x - 2)},${n(hook.y + 28)}" fill="none" stroke="#b45309" stroke-width="4" stroke-linecap="round"/>
    <text x="${n(hook.x + 16)}" y="${n(hook.y + 36)}" font-size="11" fill="#6b7280">吊钩（示意）</text>
    ${festoon}
    ${girder(92, 'A梁', false, cloud)}
    <g filter="url(#spdSoft)">${cab}</g>
    <text x="${n(cabAt.x)}" y="${n(cabAt.y - 6)}" text-anchor="middle" font-size="11" fill="#334155">司机室</text>
    <line x1="${n(spanA.x)}" y1="${n(spanA.y)}" x2="${n(spanB.x)}" y2="${n(spanB.y)}" stroke="#64748b" stroke-width="1"/>
    <text x="${n(spanM.x)}" y="${n(spanM.y + 16)}" text-anchor="middle" font-size="11" fill="#64748b">跨度方向（示意）</text>
    <line x1="${n(travelA.x)}" y1="${n(travelA.y)}" x2="${n(travelB.x)}" y2="${n(travelB.y)}" stroke="#64748b" stroke-width="1"/>
    <text x="${n(travelA.x - 8)}" y="${n((travelA.y + travelB.y) / 2)}" text-anchor="end" font-size="11" fill="#64748b">大车方向</text>
    <text x="18" y="28" font-size="13" fill="#334155" font-weight="600">${cloud ? '整机应力云图（示意 · 演示数据 · 非计算结果）' : '双梁桥式起重机结构模型（示意）'}</text>
    <text x="18" y="46" font-size="11" fill="#64748b">点位按安装位置标注，颜色表示全局状态，不是损伤度等级</text>
    ${scale}
    <g>${STRUCTURE_POINTS.map(point => marker(point, selectedId)).join('')}</g>
    ${legend}
    <text x="240" y="662" font-size="11" fill="#64748b">本图为模型示意，不可当作实测或已校准结果</text>
  </svg>`
}
