export type Tone = 'ok' | 'warn' | 'alarm' | 'off'
export type Prof = 'metal' | 'hoist' | 'travel' | 'electric' | 'safety'
export type MenuKey = 'health' | 'crack' | 'damage' | 'diag' | 'life'

export const PROF_NAME: Record<Prof, string> = {
  metal: '金属结构',
  hoist: '起升机构',
  travel: '运行机构',
  electric: '电气系统',
  safety: '安全防护装置'
}
export const STRUCT_MENUS: { key: MenuKey; label: string }[] = [
  { key: 'health', label: '健康评估' },
  { key: 'crack', label: '裂纹预测' },
  { key: 'damage', label: '损伤识别' }
]
export const MECH_MENUS: { key: MenuKey; label: string }[] = [
  { key: 'health', label: '健康评估' },
  { key: 'diag', label: '故障诊断' },
  { key: 'life', label: '剩余寿命' }
]
export const TONE_TEXT: Record<Tone, string> = { ok: '正常', warn: '异常', alarm: '报警', off: '未接入' }
export const TONE_COLOR: Record<Tone, string> = { ok: '#16a34a', warn: '#f59e0b', alarm: '#ef4444', off: '#94a3b8' }

export function isProf(value: string): value is Prof {
  return value in PROF_NAME
}

export interface StructPoint {
  id: string
  name: string
  comp: string
  live: boolean
  x: number
  y: number
  D: number
  s: number
  st: Tone
  smax: number
  smin: number
  km: number
  n: number
  L: number
  rc: number
  rd: number
  hits: number
  amp: number
  act: string
  ae: string
  ec: string
}

export interface MechPoint {
  id: string
  name: string
  comp: string
  grp: string
  x: number
  y: number
  st: Tone
  mn: string
  mv: number
  mu: string
  mw: number
  ma: number
  aux: string
  hi: number
  feat: string
  diag: string
  adv: string
  hrs: number
  life: number
}

export type AnyPoint = StructPoint | MechPoint

function rng(seed: number) {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646
  const next = () => (state = state * 16807 % 2147483647) / 2147483647
  for (let index = 0; index < 6; index += 1) next()
  return next
}
export function hashText(text: string) {
  let value = 7
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) % 1000003
  return value
}
export const hashOf = hashText
export function randomOf(seed: string) { return rng(hashText(seed)) }
export function wan(value: number) { return (value / 1e4).toFixed(1) }
export function addMonth(months: number) {
  const date = new Date(2026, 10, 1)
  date.setMonth(date.getMonth() + months)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
export function detailPoint(id: string) { return /^ML-(0[1-9]|10)$/.test(id) }

const RAW: [string, string, string, number, number, number, number, number, number][] = [
  ['ML-01', 'A侧跨中上翼缘', '主梁', 1, 111, 290, 0.42, 97, 6.2], ['ML-02', 'A侧跨中下翼缘', '主梁', 1, 129, 290, 0.46, 104, 5.8],
  ['ML-03', 'A侧1/4跨上翼缘', '主梁', 1, 111, 175, 0.31, 74, 7.6], ['ML-04', 'A侧1/4跨下翼缘', '主梁', 1, 129, 175, 0.33, 79, 7.3],
  ['ML-05', 'A侧3/4跨上翼缘', '主梁', 1, 111, 405, 0.32, 76, 7.5], ['ML-06', 'A侧3/4跨下翼缘', '主梁', 1, 129, 405, 0.35, 81, 7.1],
  ['ML-07', 'A侧左端头焊缝', '主梁', 0, 120, 78, 0.24, 52, 8.4], ['ML-08', 'A侧支座附近', '主梁', 0, 129, 96, 0.27, 58, 8.1],
  ['ML-09', 'A侧腹板中部', '主梁', 0, 120, 345, 0.29, 66, 7.8], ['ML-10', 'A侧右端头焊缝', '主梁', 0, 120, 502, 0.23, 50, 8.5],
  ['ML-11', 'B侧跨中下翼缘', '主梁', 0, 319, 290, 0.83, 138, 0], ['ML-12', 'B侧1/4跨下翼缘', '主梁', 0, 319, 175, 0.48, 99, 0],
  ['ML-13', 'B侧3/4跨下翼缘', '主梁', 0, 319, 405, 0.44, 95, 0], ['ML-14', 'B侧腹板中部', '主梁', 0, 310, 345, 0.3, 68, 0],
  ['DL-01', '上端梁左连接焊缝', '端梁', 0, 120, 36, 0.26, 55, 0], ['DL-02', '上端梁右连接焊缝', '端梁', 0, 310, 36, 0.25, 54, 0],
  ['DL-03', '下端梁左车轮支座', '端梁', 0, 76, 544, 0.21, 47, 0], ['DL-04', '下端梁右车轮支座', '端梁', 0, 354, 544, 0.22, 48, 0],
  ['XC-01', '主小车架定滑轮梁', '小车架', 0, 215, 446, 0.38, 84, 0], ['XC-02', '主小车架端梁', '小车架', 0, 170, 494, 0.28, 63, 0],
  ['XC-03', '卷筒支座', '小车架', 0, 260, 470, 0.34, 77, 0], ['XC-04', '副小车架连接', '小车架', 0, 180, 436, 0.2, 45, 0],
  ['GD-01', 'B侧轨道压板焊缝', '小车轨道', 0, 297, 230, 0.66, 112, 0], ['GD-02', 'B侧轨道接头', '小车轨道', 0, 297, 360, 0.41, 88, 0]
]

export const STRUCT_POINTS: StructPoint[] = RAW.map(([id, name, comp, live, x, y, damage, stress, life]) => {
  const random = rng(hashText(id))
  const st: Tone = damage >= 0.8 ? 'alarm' : damage >= 0.6 ? 'warn' : 'ok'
  const years = life || +((1 - damage) / damage * 4.5).toFixed(1)
  const cycles = Math.round((105 + random() * 45) * 1e4)
  const factor = +(0.22 + damage * 0.42 + random() * 0.04).toFixed(2)
  const remain = Math.round(cycles * (1 - damage) / damage)
  const hits = st === 'alarm' ? 186 : st === 'warn' ? 44 : Math.round(4 + random() * 14)
  const amp = st === 'alarm' ? 52.6 : st === 'warn' ? 41.8 : +(27 + random() * 9).toFixed(1)
  const act = st === 'alarm' ? '明显' : st === 'warn' ? '轻微' : '不明显'
  const ae = st === 'alarm' ? '存在活性缺陷迹象，建议复检' : '暂未见明显的活性缺陷'
  const ec = st === 'alarm' ? '信号偏移，建议复检' : '该位置未发现裂纹'
  return { id, name, comp, live: !!live, x, y, D: damage, s: stress, st, smax: stress, smin: +(6 + random() * 8).toFixed(1), km: factor, n: cycles, L: years, rc: remain, rd: +(1 - damage).toFixed(2), hits, amp, act, ae, ec }
})

type MechRow = [string, string, string, string, number, number, Tone, string?, number?, string?, number?, number?, string?, number?, string?, string?, string?, number?, number?]
const MECH_RAW: Record<Exclude<Prof, 'metal'>, MechRow[]> = {
  hoist: [
    ['QS-03', '高速轴轴承', '主起升减速器', '主起升', 244, 322, 'warn', '振动有效值', 5.6, 'mm/s', 4.5, 7.1, '温度 71 ℃', 68, '外圈故障特征频率 118 Hz 幅值升高', '轴承外圈早期磨损', '2 周内复测，备轴承', 21400, 7],
    ['QS-09', '钢丝绳绳段', '钢丝绳', '卷筒钢丝绳滑轮', 215, 412, 'warn', '断丝数', 3, '处', 2, 6, '磨损率 4.2 %', 72, '局部磁通异常 3 处', '局部断丝', '按 GB/T 5972 检查', 21400, 9],
    ['QS-01', '驱动端轴承', '主起升电机', '主起升', 186, 322, 'ok', '振动有效值', 2.1, 'mm/s', 4.5, 7.1, '温度 58 ℃', 91, '无明显故障特征', '运行正常', '按计划维保', 21400, 38],
    ['QS-02', '非驱动端轴承', '主起升电机', '主起升', 158, 322, 'ok', '振动有效值', 1.8, 'mm/s', 4.5, 7.1, '温度 55 ℃', 93, '无明显故障特征', '运行正常', '按计划维保', 21400, 40],
    ['QS-04', '低速轴轴承', '主起升减速器', '主起升', 272, 344, 'ok', '振动有效值', 2.9, 'mm/s', 4.5, 7.1, '温度 62 ℃', 84, '啮合频率幅值正常', '运行正常', '按计划维保', 21400, 26],
    ['QS-05', '制动轮', '主起升制动器', '主起升', 214, 322, 'ok', '制动轮温度', 48, '℃', 120, 180, '衬垫余量 76 %', 89, '制动时间 0.42 s', '制动正常', '按计划维保', 21400, 22],
    ['QS-06', '驱动端轴承', '副起升电机', '副起升', 160, 450, 'ok', '振动有效值', 1.6, 'mm/s', 4.5, 7.1, '温度 52 ℃', 94, '无明显故障特征', '运行正常', '按计划维保', 12800, 44],
    ['QS-07', '制动轮', '副起升制动器', '副起升', 190, 450, 'ok', '制动轮温度', 45, '℃', 120, 180, '衬垫余量 81 %', 90, '制动时间 0.39 s', '制动正常', '按计划维保', 12800, 28],
    ['QS-08', '卷筒轴承座', '卷筒', '卷筒钢丝绳滑轮', 274, 384, 'ok', '振动有效值', 2.4, 'mm/s', 4.5, 7.1, '温度 50 ℃', 88, '无明显故障特征', '运行正常', '按计划维保', 21400, 31],
    ['QS-10', '滑轮轴承', '滑轮组', '卷筒钢丝绳滑轮', 250, 450, 'ok', '振动有效值', 1.9, 'mm/s', 4.5, 7.1, '温度 49 ℃', 90, '无明显故障特征', '运行正常', '按计划维保', 21400, 33],
    ['QS-11', '吊钩', '吊钩组', '吊具', 200, 516, 'ok', '开口度变化', 0.4, '%', 5, 10, '表面温度 38 ℃', 95, '开口度稳定', '未见变形', '按计划检查', 21400, 52],
    ['QS-12', '电磁吸盘', '电磁吸盘', '吊具', 232, 516, 'off']
  ],
  travel: [
    ['YX-01', '东侧驱动端轴承', '大车电机', '大车运行', 84, 516, 'ok', '振动有效值', 1.9, 'mm/s', 4.5, 7.1, '温度 54 ℃', 92, '无明显故障特征', '运行正常', '按计划维保', 24600, 41],
    ['YX-02', '西侧驱动端轴承', '大车电机', '大车运行', 346, 516, 'ok', '振动有效值', 2.0, 'mm/s', 4.5, 7.1, '温度 55 ℃', 91, '无明显故障特征', '运行正常', '按计划维保', 24600, 40],
    ['YX-03', '东侧高速轴', '大车减速器', '大车运行', 100, 532, 'ok', '振动有效值', 2.6, 'mm/s', 4.5, 7.1, '温度 60 ℃', 86, '啮合频率幅值正常', '运行正常', '按计划维保', 24600, 29],
    ['YX-04', '西侧高速轴', '大车减速器', '大车运行', 330, 532, 'ok', '振动有效值', 2.4, 'mm/s', 4.5, 7.1, '温度 59 ℃', 87, '啮合频率幅值正常', '运行正常', '按计划维保', 24600, 30],
    ['YX-05', '主动轮轴承', '车轮组', '大车运行', 62, 544, 'ok', '振动有效值', 2.2, 'mm/s', 4.5, 7.1, '温度 47 ℃', 88, '无啃轨特征', '运行正常', '按计划维保', 24600, 27],
    ['YX-06', '从动轮轴承', '车轮组', '大车运行', 368, 36, 'ok', '振动有效值', 1.7, 'mm/s', 4.5, 7.1, '温度 44 ℃', 92, '无啃轨特征', '运行正常', '按计划维保', 24600, 35],
    ['YX-07', '制动轮', '大车制动器', '大车运行', 116, 516, 'ok', '制动轮温度', 42, '℃', 120, 180, '衬垫余量 70 %', 87, '制动时间 0.55 s', '制动正常', '按计划维保', 24600, 20],
    ['YX-08', '驱动端轴承', '小车电机', '小车运行', 150, 476, 'ok', '振动有效值', 1.6, 'mm/s', 4.5, 7.1, '温度 50 ℃', 93, '无明显故障特征', '运行正常', '按计划维保', 19800, 43],
    ['YX-09', '主动轮轴承', '小车车轮', '小车运行', 144, 430, 'ok', '振动有效值', 1.9, 'mm/s', 4.5, 7.1, '温度 45 ℃', 90, '无啃轨特征', '运行正常', '按计划维保', 19800, 36],
    ['YX-10', '缓冲器', '小车缓冲', '小车运行', 286, 62, 'ok', '压缩余量', 92, '%', 70, 50, '复位正常', 94, '复位时间 1.1 s', '缓冲正常', '按计划检查', 19800, 48]
  ],
  electric: [
    ['DQ-04', '主变频器', '变频柜', '控制系统', 60, 300, 'ok', '散热器温度', 58, '℃', 75, 85, '母线电压 540 V', 85, '温升曲线平稳', '运行正常', '清理滤网', 26100, 24],
    ['DQ-05', '副变频器', '变频柜', '控制系统', 60, 326, 'ok', '散热器温度', 52, '℃', 75, 85, '母线电压 538 V', 88, '温升曲线平稳', '运行正常', '按计划维保', 26100, 30],
    ['DQ-01', '集电器接触点', '滑触线', '供电系统', 40, 180, 'ok', '接触点温升', 18, '℃', 40, 60, '电流 182 A', 90, '无拉弧特征', '供电正常', '按计划检查', 26100, 34],
    ['DQ-02', '卷筒电机', '电缆卷筒', '供电系统', 215, 20, 'ok', '振动有效值', 1.4, 'mm/s', 4.5, 7.1, '温度 46 ℃', 92, '无明显故障特征', '运行正常', '按计划维保', 26100, 39],
    ['DQ-03', '柜内温湿度', 'PLC柜', '控制系统', 60, 252, 'ok', '柜内温度', 36, '℃', 50, 60, '湿度 52 %', 93, '通讯心跳正常', '运行正常', '按计划维保', 26100, 46],
    ['DQ-06', '主令控制器', '操作台', '控制系统', 60, 372, 'ok', '绝缘电阻', 210, 'MΩ', 50, 10, '接点电阻 12 mΩ', 91, '无接点烧蚀特征', '运行正常', '按计划检查', 26100, 37],
    ['DQ-07', '照明回路', '大车照明', '照明与信号', 215, 560, 'ok', '回路电流', 6.2, 'A', 9, 12, '绝缘良好', 95, '回路平稳', '运行正常', '按计划检查', 26100, 50],
    ['DQ-08', '无线通讯', '无线通讯', '照明与信号', 370, 300, 'off']
  ],
  safety: [
    ['AF-03', '东侧限位开关', '大车限位', '限位保护', 62, 560, 'warn', '响应时间', 118, 'ms', 100, 200, '动作 34 次/24h', 71, '响应时间较上月偏长 32 %', '触点响应变慢', '检查触点与接线', 24600, 8],
    ['AF-01', '上升限位', '起升限位', '限位保护', 236, 436, 'ok', '响应时间', 42, 'ms', 100, 200, '动作 126 次/24h', 93, '动作一致性良好', '动作正常', '按计划检查', 24600, 40],
    ['AF-02', '下降限位', '起升限位', '限位保护', 196, 436, 'ok', '响应时间', 45, 'ms', 100, 200, '动作 98 次/24h', 92, '动作一致性良好', '动作正常', '按计划检查', 24600, 40],
    ['AF-04', '西侧限位开关', '大车限位', '限位保护', 368, 560, 'ok', '响应时间', 51, 'ms', 100, 200, '动作 31 次/24h', 90, '动作一致性良好', '动作正常', '按计划检查', 24600, 36],
    ['AF-05', '两端限位', '小车限位', '限位保护', 215, 62, 'ok', '响应时间', 48, 'ms', 100, 200, '动作 88 次/24h', 91, '动作一致性良好', '动作正常', '按计划检查', 19800, 38],
    ['AF-06', '称重传感器', '超载限制器', '超载保护', 215, 470, 'ok', '示值误差', 1.8, '%', 3, 5, '零点漂移 0.3 %', 88, '标定曲线稳定', '工作正常', '按期标定', 24600, 18],
    ['AF-07', '激光测距', '激光防撞', '防碰撞', 398, 22, 'off'],
    ['AF-08', '声光报警器', '声光报警', '防碰撞', 370, 300, 'ok', '声压级', 96, 'dB', 85, 75, '自检正常', 94, '自检通过', '工作正常', '按计划检查', 24600, 45]
  ]
}

function asMech(row: MechRow): MechPoint {
  const [id, name, comp, grp, x, y, st, mn, mv, mu, mw, ma, aux, hi, feat, diag, adv, hrs, life] = row
  return { id, name, comp, grp, x, y, st, mn: mn || '', mv: mv || 0, mu: mu || '', mw: mw || 0, ma: ma || 0, aux: aux || '', hi: hi || 0, feat: feat || '', diag: diag || '', adv: adv || '', hrs: hrs || 0, life: life || 0 }
}

export const MECH_POINTS: Record<Exclude<Prof, 'metal'>, MechPoint[]> = {
  hoist: MECH_RAW.hoist.map(asMech),
  travel: MECH_RAW.travel.map(asMech),
  electric: MECH_RAW.electric.map(asMech),
  safety: MECH_RAW.safety.map(asMech)
}

export function isStruct(point: AnyPoint): point is StructPoint {
  return 'live' in point
}

export function pointsOf(prof: Prof): AnyPoint[] {
  return prof === 'metal' ? STRUCT_POINTS : MECH_POINTS[prof]
}

export function defaultPid(prof: Prof) {
  const order: Record<Tone, number> = { alarm: 0, warn: 1, ok: 2, off: 3 }
  const list = pointsOf(prof).filter(point => point.st !== 'off').sort((left, right) => order[left.st] - order[right.st])
  return list[0]?.id || pointsOf(prof)[0].id
}

export function pointOf(prof: Prof, id: string) {
  return pointsOf(prof).find(point => point.id === id) || pointsOf(prof)[0]
}

function stChip(tone: Tone) {
  if (tone === 'off') return '<span class="status off">未接入</span>'
  return `<span class="status ${tone}">${TONE_TEXT[tone]}</span>`
}
function typeChip(live: boolean) {
  return live ? '<span class="status live">实测</span>' : '<span class="status twin">孪生</span>'
}
function cell(html: string, cls = '') {
  return `<td${cls ? ` class="${cls}"` : ''}>${html}</td>`
}

interface ColumnDef {
  title: string
  hint: string
  widths: number[]
  headers: string[]
  row: (point: AnyPoint) => string[]
}

const COLUMNS: Record<string, ColumnDef> = {
  health: {
    title: '点位健康评估', hint: '按部件归类 · 实测与孪生分别按累积损伤度降序',
    widths: [36, 120, 56, 46, 64, 64, 54, 80, 56, 62],
    headers: ['序号', '点位名称', '所属部件', '类型', '最大应力幅<br>(MPa)', '最小应力幅<br>(MPa)', '应力谱<br>系数', '已发生<br>循环次数(万次)', '累积<br>损伤度', '健康状态'],
    row: point => {
      const item = point as StructPoint
      return [item.id, cell(item.name, 'tleft pname'), cell(item.comp), cell(typeChip(item.live)), cell(item.smax.toFixed(1)), cell(item.smin.toFixed(1)), cell(item.km.toFixed(2)), cell(wan(item.n)), cell(item.D.toFixed(2)), cell(stChip(item.st))]
    }
  },
  crack: {
    title: '点位裂纹预测', hint: '按裂纹萌生先后排序（剩余年限升序）',
    widths: [36, 140, 64, 48, 76, 100, 76, 90],
    headers: ['序号', '点位名称', '所属部件', '类型', '剩余损伤度', '剩余循环次数(万次)', '剩余年限(年)', '健康状态'],
    row: point => {
      const item = point as StructPoint
      return [item.id, cell(item.name, 'tleft pname'), cell(item.comp), cell(typeChip(item.live)), cell(item.rd.toFixed(2)), cell(wan(item.rc)), cell(item.L.toFixed(1)), cell(stChip(item.st))]
    }
  },
  damage: {
    title: '点位损伤识别', hint: '依据声发射与涡流监测 · 按声发射活性排序',
    widths: [34, 104, 60, 44, 54, 58, 50, 166, 124],
    headers: ['序号', '点位名称', '所属部件', '类型', '撞击数<br>(24h)', '最大幅值<br>(dB)', '声发射<br>活性', '损伤识别结论', '裂纹判别'],
    row: point => {
      const item = point as StructPoint
      return [item.id, cell(item.name, 'tleft pname'), cell(item.comp), cell(typeChip(item.live)), cell(String(item.hits)), cell(item.amp.toFixed(1)), cell(`<span style="color:${TONE_COLOR[item.st]};font-weight:600">${item.act}</span>`), cell(item.ae, 'tleft') .replace('class="tleft"', `class="tleft" style="color:${item.st === 'alarm' ? '#b91c1c' : '#15803d'}"`), cell(item.ec, 'tleft').replace('class="tleft"', `class="tleft" style="color:${item.st === 'alarm' ? '#b91c1c' : '#15803d'}"`)]
    }
  },
  mhealth: {
    title: '测点健康评估', hint: '按部件分组归类 · 组内按健康指数升序',
    widths: [36, 110, 100, 130, 120, 70, 70],
    headers: ['序号', '测点', '所属部件', '主要监测指标', '辅助指标', '健康指数', '健康状态'],
    row: point => {
      const item = point as MechPoint
      if (item.st === 'off') return [item.id, cell(item.name, 'tleft pname'), cell(item.comp), cell('—'), cell('—'), cell('—'), cell(stChip('off'))]
      return [item.id, cell(item.name, 'tleft pname'), cell(item.comp), cell(`${item.mn} ${item.mv} ${item.mu}`), cell(item.aux), cell(String(item.hi)), cell(stChip(item.st))]
    }
  },
  mdiag: {
    title: '测点故障诊断', hint: '按诊断严重程度排序',
    widths: [34, 92, 88, 180, 118, 128, 58],
    headers: ['序号', '测点', '所属部件', '诊断特征', '诊断结论', '处置建议', '状态'],
    row: point => {
      const item = point as MechPoint
      if (item.st === 'off') return [item.id, cell(item.name, 'tleft pname'), cell(item.comp), cell('—'), cell('未接入'), cell('—'), cell(stChip('off'))]
      const color = item.st === 'ok' ? '#15803d' : '#b45309'
      return [item.id, cell(item.name, 'tleft pname'), cell(item.comp), cell(item.feat, 'tleft wrap'), cell(item.diag, 'tleft wrap').replace('class="tleft wrap"', `class="tleft wrap" style="color:${color}"`), cell(item.adv, 'tleft wrap'), cell(stChip(item.st))]
    }
  },
  mlife: {
    title: '测点剩余寿命', hint: '按剩余寿命升序',
    widths: [36, 120, 110, 100, 100, 110, 70],
    headers: ['序号', '测点', '所属部件', '累计运行(h)', '剩余寿命(月)', '预计维护时间', '健康状态'],
    row: point => {
      const item = point as MechPoint
      if (item.st === 'off') return [item.id, cell(item.name, 'tleft pname'), cell(item.comp), cell('—'), cell('—'), cell('—'), cell(stChip('off'))]
      return [item.id, cell(item.name, 'tleft pname'), cell(item.comp), cell(item.hrs.toLocaleString('en-US')), cell(String(item.life)), cell(addMonth(Math.max(1, item.life - 1))), cell(stChip(item.st))]
    }
  }
}

export function columnKey(prof: Prof, menu: MenuKey) {
  return prof === 'metal' ? menu : `m${menu}`
}

type Row = AnyPoint | { group: string; measured?: number; twin?: number; count?: number }

function ordered(prof: Prof, menu: MenuKey, query: string): Row[] {
  const text = query.trim()
  const list = pointsOf(prof).filter(point => !text || `${point.id}${point.name}${point.comp}`.includes(text))
  const key = columnKey(prof, menu)
  const severity: Record<Tone, number> = { alarm: 0, warn: 1, ok: 2, off: 3 }
  if (key === 'health') {
    const rows: Row[] = []
    ;['主梁', '端梁', '小车架', '小车轨道'].forEach(comp => {
      const group = list.filter((point): point is StructPoint => isStruct(point) && point.comp === comp)
      if (!group.length) return
      const measured = group.filter(point => point.live).sort((left, right) => right.D - left.D)
      const twin = group.filter(point => !point.live).sort((left, right) => right.D - left.D)
      rows.push({ group: comp, measured: measured.length, twin: twin.length })
      rows.push(...measured, ...twin)
    })
    return rows
  }
  if (key === 'crack') return [...list].sort((left, right) => (left as StructPoint).L - (right as StructPoint).L)
  if (key === 'damage') return [...list].sort((left, right) => (right as StructPoint).hits - (left as StructPoint).hits)
  if (key === 'mhealth') {
    const rows: Row[] = []
    const groups = [...new Set(list.map(point => (point as MechPoint).grp))]
    groups.forEach(name => {
      const group = list.filter((point): point is MechPoint => !isStruct(point) && point.grp === name)
        .sort((left, right) => Number(left.st === 'off') - Number(right.st === 'off') || left.hi - right.hi)
      rows.push({ group: name, count: group.length })
      rows.push(...group)
    })
    return rows
  }
  if (key === 'mdiag') return [...list].sort((left, right) => severity[left.st] - severity[right.st] || ((left as MechPoint).hi || 0) - ((right as MechPoint).hi || 0))
  return [...list].sort((left, right) => Number(left.st === 'off') - Number(right.st === 'off') || ((left as MechPoint).life || 0) - ((right as MechPoint).life || 0))
}

export interface OverallTable {
  title: string
  hint: string
  widths: number[]
  headers: string[]
  body: string
  footerLeft: string
  footerRight: string
}

export function buildTable(prof: Prof, menu: MenuKey, query: string, selected: string): OverallTable {
  const column = COLUMNS[columnKey(prof, menu)]
  const rows = ordered(prof, menu, query)
  let index = 0
  const body = rows.map(row => {
    if ('group' in row) {
      const extra = row.measured != null
        ? `<span class="type">实测 ${row.measured}</span> <span class="type twin">孪生 ${row.twin}</span>`
        : `${row.count} 个测点`
      return `<tr class="group"><td colspan="${column.widths.length}"><b>${row.group}</b>${extra}</td></tr>`
    }
    index += 1
    const cells = column.row(row)
    cells[0] = cell(`<span style="color:#64748b">${index}</span>`)
    return `<tr class="pt${row.id === selected ? ' sel' : ''}" data-pid="${row.id}" title="${row.id} ${row.name}">${cells.join('')}</tr>`
  }).join('')
  const all = pointsOf(prof)
  const count = (tone: Tone) => all.filter(point => point.st === tone).length
  const footerRight = `<span class="red">报警 ${count('alarm')}</span> · <span class="orange">异常 ${count('warn')}</span> · 正常 ${count('ok')}${prof === 'metal' ? '' : ` · 未接入 ${count('off')}`}`
  const footerLeft = prof === 'metal'
    ? `共 ${all.length} 个点位 · 实测 ${all.filter(point => isStruct(point) && point.live).length} · 数字孪生生成 ${all.filter(point => isStruct(point) && !point.live).length}`
    : `共 ${all.length} 个测点 · 部件 ${new Set(all.map(point => point.comp)).size} 个`
  return { title: column.title, hint: column.hint, widths: column.widths, headers: column.headers, body, footerLeft, footerRight }
}

export interface PickCard {
  id: string
  name: string
  tone: Tone
  route: string
  values: [string, string, string][]
  conclusion: string
  link: 'point' | 'structure' | 'none'
}

export function describePick(prof: Prof, menu: MenuKey, id: string): PickCard {
  const point = pointOf(prof, id)
  if (isStruct(point)) {
    const values: [string, string, string][] = menu === 'health'
      ? [['累积损伤度', point.D.toFixed(2), ''], ['最大应力幅', point.smax.toFixed(1), 'MPa']]
      : menu === 'crack'
        ? [['剩余年限', point.L.toFixed(1), '年'], ['剩余循环次数', wan(point.rc), '万次']]
        : [['撞击数(24h)', String(point.hits), '次'], ['最大幅值', point.amp.toFixed(1), 'dB']]
    const conclusion = menu === 'damage' ? `${point.ae}；${point.ec}` : menu === 'crack' ? `裂纹萌生寿命 ${point.L.toFixed(1)} 年` : `点位健康状态：${TONE_TEXT[point.st]}`
    return { id: point.id, name: point.name, tone: point.st, route: `金属结构 / ${point.comp} · ${point.live ? '实时监测点' : '数字孪生生成点'}`, values, conclusion, link: detailPoint(point.id) ? 'point' : 'structure' }
  }
  if (point.st === 'off') {
    return { id: point.id, name: point.name, tone: 'off', route: `${PROF_NAME[prof]} / ${point.grp} / ${point.comp}`, values: [['状态', '未接入', ''], ['数据', '—', '']], conclusion: '该部件暂未接入监测', link: 'none' }
  }
  const values: [string, string, string][] = menu === 'life'
    ? [['剩余寿命', String(point.life), '月'], ['健康指数', String(point.hi), '']]
    : [[point.mn, String(point.mv), point.mu], ['健康指数', String(point.hi), '']]
  const conclusion = menu === 'diag' ? `${point.diag}：${point.adv}` : menu === 'life' ? `预计维护时间 ${addMonth(Math.max(1, point.life - 1))}` : `${point.aux} · 健康状态：${TONE_TEXT[point.st]}`
  return { id: point.id, name: point.name, tone: point.st, route: `${PROF_NAME[prof]} / ${point.grp} / ${point.comp}`, values, conclusion, link: 'none' }
}
