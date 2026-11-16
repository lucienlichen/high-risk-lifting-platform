const LEG = [122.93, 109.27, 95.615, 81.956, 68.297, 54.637, 40.978, 27.319, 13.659, 0.0001724]
const BAND = ['#0000ff', '#0078ff', '#00c8ff', '#00ffc0', '#00ff3c', '#9cff00', '#ffd800', '#ff7800', '#ff0000']
const bandOf = (value: number) => BAND[Math.max(0, Math.min(8, Math.floor(value / 13.659)))]
const DX = 50
const DY = -28
const YT = 240
const YB = 280
const YG = 455
const LF = 330
const LR = 640
const AX = 560
const AY = 30

function girderStress(x: number, bottom = false) {
  let value = x <= LF ? 42 + 10 * Math.sin(Math.min(1, x / 250) * Math.PI / 2) : x <= LR ? 26 + 8 * (LR - x) / (LR - LF) : 18 + 8 * (960 - x) / 320
  return value + (bottom ? 4 : 0)
}

function line(x1: number, y1: number, x2: number, y2: number, s1: number, s2: number, width: number, parts = 6) {
  let markup = ''
  for (let index = 0; index < parts; index += 1) {
    const start = index / parts
    const end = (index + 1) / parts
    const stress = s1 + (s2 - s1) * (start + end) / 2
    markup += `<line x1="${(x1 + (x2 - x1) * start).toFixed(1)}" y1="${(y1 + (y2 - y1) * start).toFixed(1)}" x2="${(x1 + (x2 - x1) * end).toFixed(1)}" y2="${(y1 + (y2 - y1) * end).toFixed(1)}" stroke="${bandOf(stress)}" stroke-width="${width}" stroke-linecap="round"/>`
  }
  return markup
}

export const STRUCT_CLOUD_POINTS = [
  { id: 'ML-01', n: 1, live: true, x: 480, y: 220 },
  { id: 'ML-02', n: 2, live: true, x: 480, y: 300 },
  { id: 'ML-03', n: 3, live: true, x: 240, y: 220 },
  { id: 'ML-04', n: 4, live: true, x: 240, y: 300 },
  { id: 'ML-05', n: 5, live: true, x: 720, y: 220 },
  { id: 'ML-06', n: 6, live: true, x: 720, y: 300 },
  { id: 'ML-07', n: 7, live: false, x: 38, y: 220 },
  { id: 'ML-08', n: 8, live: false, x: 330, y: 345 },
  { id: 'ML-09', n: 9, live: false, x: 595, y: 260 },
  { id: 'ML-10', n: 10, live: false, x: 922, y: 220 }
]

function pointMarks(selectedId: string, big: boolean) {
  const radius = big ? 12 : 15
  const font = big ? 13 : 17
  return STRUCT_CLOUD_POINTS.map(point => {
    const selected = point.id === selectedId
    let markup = `<g data-pid="${point.id}" style="cursor:pointer">`
    if (selected) {
      markup += `<circle cx="${point.x}" cy="${point.y}" r="${radius + 7}" fill="none" stroke="#1677ff" stroke-width="3"/>`
      markup += `<circle cx="${point.x}" cy="${point.y}" r="${radius + 3.5}" fill="none" stroke="#fff" stroke-width="2.5"/>`
    }
    markup += point.live
      ? `<circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="${selected ? '#1677ff' : '#0f2340'}" stroke="#fff" stroke-width="2"/>`
      : `<rect x="${point.x - radius * 0.8}" y="${point.y - radius * 0.8}" width="${radius * 1.6}" height="${radius * 1.6}" transform="rotate(45 ${point.x} ${point.y})" fill="${selected ? '#dbeafe' : '#fff'}" stroke="${selected ? '#1677ff' : '#0f2340'}" stroke-width="2"/>`
    markup += `<text x="${point.x}" y="${point.y + font * 0.36}" text-anchor="middle" font-size="${font}" font-weight="700" fill="${point.live ? '#fff' : '#0f2340'}">${point.n}</text></g>`
    return markup
  }).join('')
}

export function craneMarkup(selectedId: string, big = false) {
  const segment = (x1: number, y1: number, x2: number, y2: number, s1: number, s2: number, width: number, parts?: number) => line(x1, y1, x2, y2, s1, s2, width, parts)
  const plane = (ox: number, oy: number) => {
    const draw = (x1: number, y1: number, x2: number, y2: number, s1: number, s2: number, width: number, parts?: number) => segment(x1 + ox, y1 + oy, x2 + ox, y2 + oy, s1, s2, width, parts)
    let markup = ''
    markup += draw(290, YG, 690, YG, 6, 3, 9, 8)
    markup += draw(LR, YB, LR, YG, 9, 4, 9)
    markup += draw(LF, YB, LF, YG, 56, 48, 9)
    markup += draw(LF, 300, LR, 430, 24, 18, 3.5)
    markup += draw(LF, 380, LR, 380, 16, 14, 3)
    for (let x = 0; x < 960; x += 40) {
      const up = (x / 40) % 2 === 0
      markup += draw(x, up ? YB : YT, x + 40, up ? YT : YB, girderStress(x + 20) * 0.75, girderStress(x + 20) * 0.75, 2.5, 2)
    }
    for (let x = 0; x < 960; x += 20) {
      markup += draw(x, YT, x + 20, YT, girderStress(x + 10), girderStress(x + 10), 7, 1)
      markup += draw(x, YB, x + 20, YB, girderStress(x + 10, true), girderStress(x + 10, true), 7, 1)
    }
    markup += draw(AX, AY, AX, YT, 86, 92, 6)
    markup += draw(AX, AY, LR, YT, 74, 70, 5)
    markup += draw(AX, AY, 110, YT, 110, 118, 4.5, 10)
    markup += draw(AX, AY, 190, YT, 112, 122.9, 4.5, 10)
    markup += draw(AX, AY, 780, YT, 72, 70, 4)
    markup += draw(AX, AY, 900, YT, 78, 72, 4, 8)
    return markup
  }
  let markup = `<g opacity=".78">${plane(DX, DY)}</g>`
  ;[[0, YT], [0, YB], [LF, YB], [LR, YB], [960, YT], [960, YB], [AX, AY], [290, YG], [690, YG], [LF, YG], [LR, YG]].forEach(([x, y]) => {
    const stress = y === AY ? 90 : y === YG ? 5 : girderStress(x)
    markup += line(x, y, x + DX, y + DY, stress, stress, 3, 1)
  })
  markup += plane(0, 0)
  markup += `<rect x="${AX - 12}" y="${AY - 14}" width="24" height="16" fill="${bandOf(92)}" stroke="#333" stroke-width=".8"/>`
  markup += line(85, YB, 85, 372, 30, 30, 1.6, 1) + line(105, YB, 105, 372, 30, 30, 1.6, 1)
  markup += `<rect x="66" y="372" width="58" height="22" fill="${bandOf(30)}" stroke="#1e3a8a" stroke-width="1"/>`
  markup += `<line x1="260" y1="${YG + 10}" x2="760" y2="${YG + 10}" stroke="#64748b" stroke-width="1" stroke-dasharray="4 4" opacity=".5"/>`
  const font = big ? 15 : 20
  markup += `<g><line x1="168" y1="150" x2="186" y2="232" stroke="#e00" stroke-width="2.2"/><path d="M190,240 L180,224 L194,226Z" fill="#e00"/><rect x="128" y="${150 - font - 8}" width="${font * 3.2}" height="${font + 10}" fill="#fff" stroke="#e00" stroke-width="1.5"/><text x="${128 + font * 1.6}" y="${150 - 6}" text-anchor="middle" font-size="${font}" font-weight="700" fill="#e00">Max</text></g>`
  markup += `<g><line x1="${LR + DX + 80}" y1="${YG + DY + 22}" x2="${LR + DX + 52}" y2="${YG + DY + 6}" stroke="#0000cc" stroke-width="2"/><rect x="${LR + DX + 80}" y="${YG + DY + 12}" width="${font * 2.9}" height="${font + 8}" fill="#fff" stroke="#0000cc" stroke-width="1.5"/><text x="${LR + DX + 80 + font * 1.45}" y="${YG + DY + 12 + font + 2}" text-anchor="middle" font-size="${font}" font-weight="700" fill="#0000cc">Min</text></g>`
  markup += pointMarks(selectedId, big)
  return markup
}

export function legendMarkup(x0: number, y0: number, height: number, font: number) {
  const band = height / 9
  let markup = ''
  for (let index = 0; index < 9; index += 1) markup += `<rect x="${x0}" y="${y0 + index * band}" width="${font * 1.3}" height="${band + 0.5}" fill="${BAND[8 - index]}"/>`
  markup += `<rect x="${x0}" y="${y0}" width="${font * 1.3}" height="${height}" fill="none" stroke="#475569" stroke-width=".8"/>`
  LEG.forEach((value, index) => {
    markup += `<line x1="${x0 + font * 1.3}" x2="${x0 + font * 1.3 + 4}" y1="${y0 + index * band}" y2="${y0 + index * band}" stroke="#475569"/>`
    markup += `<text x="${x0 + font * 1.3 + 7}" y="${y0 + index * band + font * 0.35}" font-size="${font}" fill="#111827">${value}${index === 0 ? ' Max' : index === 9 ? ' Min' : ''}</text>`
  })
  return markup
}

export function cloudSvg(selectedId: string) {
  return `<svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid meet" class="ps-cloud-svg"><defs><linearGradient id="cbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f7fb"/><stop offset="1" stop-color="#d6e2ef"/></linearGradient></defs><rect width="1200" height="520" fill="url(#cbg)"/>${legendMarkup(12, 44, 420, 17)}<text x="12" y="26" font-size="18" font-weight="700" fill="#111827">等效应力 MPa</text><g transform="translate(185,14)">${craneMarkup(selectedId)}</g><text x="1188" y="508" text-anchor="end" font-size="16" fill="#475569">● 实测 1–6　◆ 孪生生成 7–10 · 颜色仅表示应力大小</text></svg>`
}

export function modalCrane(selectedId: string) {
  return craneMarkup(selectedId, true)
}
