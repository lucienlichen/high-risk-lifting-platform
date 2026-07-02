/*
 * 数据智能服务 · 共享 mock 数据层
 * ─────────────────────────────────────────────
 * 纯前端演示：全部数据按设备 ID / 索引种子确定性生成，无后端、无网络调用。
 * hash 算法与日期工具移植自参考项目 Intelligent_data_agent_LE，保证同一输入渲染一致。
 *
 * 各服务的类型与生成函数按需追加到本文件（点巡检 / 维修 / 检验 / 基础数据 / 供给）。
 */

// ───────────────────────── 确定性工具 ─────────────────────────

/** 32 位整数散列（xorshift 变体），同输入恒定输出 */
export function hash(n: number): number {
  let x = n >>> 0
  x = Math.imul(x ^ (x >>> 16), 2246822507)
  x = Math.imul(x ^ (x >>> 13), 3266489909)
  x ^= x >>> 16
  return x >>> 0
}

/** 由字符串 ID + 盐值派生种子 */
export function seedOf(id: string, salt: number): number {
  return (id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 5381) + salt) >>> 0
}

/** 数字左补零 */
export function pad(n: number, w = 2): string {
  return String(n).padStart(w, '0')
}

/** Date → YYYY-MM-DD */
export function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 今天往前 days 天的日期字符串 */
export function dateMinusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return fmtDate(d)
}

/** 基准日期（Date 或 YYYY-MM-DD 字符串）加 n 天 */
export function addDays(base: Date | string, n: number): string {
  const d = typeof base === 'string'
    ? (() => { const [y, m, day] = base.split('-').map(Number); return new Date(y, m - 1, day) })()
    : new Date(base)
  d.setDate(d.getDate() + n)
  return fmtDate(d)
}

// ───────────────────────── 部件划分常量 ─────────────────────────

export interface PartCategory {
  key: string
  name: string
}

/** 起重设备部件结构划分（7 类），与参考 partStructure 对齐 */
export const PART_CATEGORIES: PartCategory[] = [
  { key: 'structure', name: '金属结构' },
  { key: 'mechanism', name: '机构及零部件' },
  { key: 'hydraulic', name: '液压系统' },
  { key: 'electric', name: '电气及控制系统' },
  { key: 'safety', name: '安全防护装置' },
  { key: 'rigging', name: '索具' },
  { key: 'other', name: '其他' },
]

// ═════════════════════════ 点巡检智能服务 ═════════════════════════
// 基于日常点巡检数据：按部件统计发现问题次数 + 原始文本→结构化信息抽取

/** 各部件常见巡检问题项 */
const SPOT_PROBLEMS_BY_KEY: Record<string, string[]> = {
  structure: ['过量变形/主梁下挠', '裂纹、断裂', '结构腐蚀穿孔', '焊缝缺陷', '连接螺栓/销轴松动脱落'],
  mechanism: ['钢丝绳断丝、断股', '吊钩磨损变形', '制动间隙超标', '减速机渗油异响', '车轮啃轨', '卷筒/滑轮磨损'],
  hydraulic: ['液压系统渗漏', '油温/油压异常', '密封件老化'],
  electric: ['接触器触点烧蚀', '线缆绝缘老化', '控制操作失灵', '接地与避雷异常'],
  safety: ['限位装置失灵', '缓冲止挡装置损坏', '防超载装置漂移', '抗风防滑装置失效'],
  rigging: ['钢丝绳索具磨损断丝', '编织吊索破损'],
  other: ['安全标识缺失', '随机文件不全'],
}

/** 各部件常见巡检部位（抽取「部位」结构化字段用） */
const SPOT_LOCS: Record<string, string[]> = {
  structure: ['主梁跨中', '主梁端部', '支腿根部', '端梁连接处', '主梁下翼缘'],
  mechanism: ['起升减速机', '制动器', '大车车轮', '卷筒', '钢丝绳', '吊钩'],
  hydraulic: ['液压泵站', '油缸', '油管接头', '阀组'],
  electric: ['主接触器', '控制柜', '滑触线', '电缆卷筒', '接地装置'],
  safety: ['起升限位', '大车行程限位', '超载限制器', '缓冲器', '抗风防滑装置'],
  rigging: ['钢丝绳索具', '编织吊索', '卸扣'],
  other: ['安全标识', '随机技术文件', '其他附件'],
}

const SPOT_INSPECTORS = ['张工', '李工', '王工', '赵工']

export type SpotLevelTone = 'high' | 'mid' | 'low'
const SPOT_LEVELS: { text: string; tone: SpotLevelTone }[] = [
  { text: '高', tone: 'high' },
  { text: '中', tone: 'mid' },
  { text: '低', tone: 'low' },
]

const kwHas = (s: string, ...kw: string[]) => kw.some((k) => s.includes(k))

/** 按问题关键词给出量化描述 */
function spotMetricOf(problem: string, n: number, lvlText: string): string {
  if (kwHas(problem, '裂纹', '断裂', '断丝', '断股')) return `长约 ${5 + (n % 40)} mm`
  if (kwHas(problem, '腐蚀', '锈', '穿孔')) return `锈蚀面积约 ${8 + (n % 50)} cm²`
  if (kwHas(problem, '磨损', '变形', '啃轨', '下挠')) return `磨损/偏差约 ${2 + (n % 18)} mm`
  if (kwHas(problem, '松动', '脱落', '螺栓', '销轴')) return `${1 + (n % 5)} 处松动`
  if (kwHas(problem, '渗', '漏', '泄')) return `渗漏程度：${lvlText === '高' ? '明显' : '轻微'}`
  if (kwHas(problem, '温', '压', '异常')) return `偏离正常约 ${8 + (n % 22)}%`
  if (kwHas(problem, '失灵', '失效', '漂移', '不灵', '缺失', '不全')) return '动作/状态不可靠'
  return `严重程度：${lvlText}`
}

/** 按问题关键词给出处理建议 */
function spotActionOf(problem: string): string {
  if (kwHas(problem, '裂纹', '断裂', '焊缝')) return '探伤确认后补焊或更换'
  if (kwHas(problem, '断丝', '断股', '索具')) return '按报废标准核查，超标立即更换'
  if (kwHas(problem, '腐蚀', '锈', '穿孔')) return '除锈防腐，必要时补板加固'
  if (kwHas(problem, '磨损', '变形', '啃轨', '下挠')) return '检测量值，超限调整或更换'
  if (kwHas(problem, '松动', '脱落', '螺栓', '销轴')) return '按规定扭矩紧固并补齐缺失件'
  if (kwHas(problem, '渗', '漏', '油')) return '更换密封件，补充油液'
  if (kwHas(problem, '温', '压', '异常')) return '检修相关部件并复测参数'
  if (kwHas(problem, '限位', '超载', '漂移', '防滑', '缓冲')) return '校验或重新标定保护装置'
  if (kwHas(problem, '标识')) return '补充、更换安全警示标识'
  if (kwHas(problem, '文件')) return '补全随机技术资料并归档'
  if (kwHas(problem, '触点', '线缆', '绝缘', '接地', '控制')) return '检修电气回路，更换故障元件'
  return '现场复查并制定处理措施'
}

export interface SpotTextRecord {
  id: string
  problem: string
  location: string
  level: { text: string; tone: SpotLevelTone }
  metric: string
  action: string
  date: string
  inspector: string
  source: string
  rawText: string
}

export interface SpotPartStat {
  key: string
  name: string
  count: number
  topProblems: string[]
  records: SpotTextRecord[]
}

export interface SpotCheckBoard {
  formCount: number
  items: SpotPartStat[]
  totalProblems: number
  maxCount: number
  involvedParts: number
  topPart: string
}

/** 生成某设备的点巡检问题看板（确定性） */
export function getSpotCheckBoard(deviceId: string): SpotCheckBoard {
  const base = seedOf(deviceId, 0)
  // 以设备种子确定「已分析点巡检表份数」（6~14 份），代替参考中的上传文件数
  const formCount = 6 + (hash(base + 999) % 9)

  const parts = PART_CATEGORIES.map((c) => ({ ...c, problems: SPOT_PROBLEMS_BY_KEY[c.key] ?? [] }))
  const locFor = (key: string) => SPOT_LOCS[key] ?? ['主体部位', '连接部位', '关键节点']

  const items: SpotPartStat[] = parts
    .map((p, i) => {
      let count = 0
      const hits: Record<string, number> = {}
      const records: SpotTextRecord[] = []
      const locs = locFor(p.key)
      for (let j = 0; j < formCount; j++) {
        const r = hash(base + i * 131 + j * 17 + 7) % 6
        const add = r < 2 ? 0 : r < 4 ? 1 : r < 5 ? 2 : 3
        for (let k = 0; k < add; k++) {
          const prob = p.problems[hash(base + i * 911 + j * 53 + k * 13) % p.problems.length]
          hits[prob] = (hits[prob] || 0) + 1
          const n = hash(base + i * 1009 + j * 211 + k * 37)
          const location = locs[n % locs.length]
          const level = SPOT_LEVELS[hash(base + i * 67 + j * 23 + k * 11 + 3) % SPOT_LEVELS.length]
          const metric = spotMetricOf(prob, n, level.text)
          const action = spotActionOf(prob)
          const date = dateMinusDays(hash(base + i * 91 + j * 41 + k * 7 + 5) % 120)
          const inspector = SPOT_INSPECTORS[hash(base + i * 13 + j * 29 + k * 5 + 1) % SPOT_INSPECTORS.length]
          const source = `点巡检表 #${pad((j % formCount) + 1)}`
          records.push({
            id: `${p.key}-${j}-${k}`,
            problem: prob, location, level, metric, action, date, inspector, source,
            rawText: `${date}，${inspector}巡检：${location}发现${prob}，${metric}，建议${action}。`,
          })
        }
        count += add
      }
      const topProblems = Object.entries(hits)
        .sort((a, b) => b[1] - a[1])
        .map(([name, n]) => `${name}×${n}`)
      records.sort((a, b) => (a.date < b.date ? 1 : -1))
      return { key: p.key, name: p.name, count, topProblems, records }
    })
    .sort((a, b) => b.count - a.count)

  const totalProblems = items.reduce((s, x) => s + x.count, 0)
  const maxCount = Math.max(1, items[0]?.count ?? 1)
  const involvedParts = items.filter((i) => i.count > 0).length
  const topPart = items[0]?.count > 0 ? items[0].name : '—'
  return { formCount, items, totalProblems, maxCount, involvedParts, topPart }
}

// ═════════════════════════ 维修智能服务 ═════════════════════════
// 基于损伤/故障维修数据：按部件分组的历史维修记录 + AI 更换/维保建议

interface FaultDef { damage: string; content: string }

/** 维修分组（在部件基础上把「机构」拆出电机/减速机/制动器，共 9 组） */
const REPAIR_GROUPS: { key: string; name: string; faults: FaultDef[] }[] = [
  { key: 'structure', name: '金属结构', faults: [
    { damage: '主梁下挠超标', content: '主梁起拱矫正并加固补强，复测下挠值合格' },
    { damage: '主受力构件焊缝裂纹', content: '裂纹清根后补焊，焊后磁粉探伤合格' },
    { damage: '结构腐蚀、局部穿孔', content: '除锈补板，重做防腐涂层' },
    { damage: '连接螺栓、销轴松动脱落', content: '按规定扭矩重新紧固并更换缺失螺栓' },
  ] },
  { key: 'mechanism', name: '机构及零部件', faults: [
    { damage: '钢丝绳断丝、断股超标', content: '更换同规格钢丝绳并按规范润滑' },
    { damage: '吊钩磨损、开口度超标', content: '更换吊钩，复测危险断面与开口度合格' },
    { damage: '大车车轮啃轨', content: '调整大车同步与车轮安装精度，整修轨道' },
    { damage: '联轴器磨损、对中超差', content: '更换联轴器弹性件并重新对中' },
    { damage: '卷筒磨损、绳槽损伤', content: '补焊车槽或更换卷筒，复测绳槽合格' },
  ] },
  { key: 'motor', name: '电机', faults: [
    { damage: '电机绕组过热、绝缘下降', content: '清理通风、复测绝缘，必要时重绕或更换电机' },
    { damage: '电机轴承磨损异响', content: '更换损坏轴承并补充润滑' },
    { damage: '电机振动超标', content: '校正动平衡与对中，更换损坏部件' },
    { damage: '电机过流、堵转', content: '排查机械卡阻与负载，更换故障元件' },
  ] },
  { key: 'reducer', name: '减速机', faults: [
    { damage: '减速机渗油', content: '更换油封与密封垫，补充润滑油' },
    { damage: '减速机运行异响', content: '检查更换损坏齿轮、轴承' },
    { damage: '齿轮磨损、点蚀', content: '更换磨损齿轮副，保证润滑' },
    { damage: '减速机轴承损坏', content: '更换损坏轴承并复测运行' },
  ] },
  { key: 'brake', name: '制动器', faults: [
    { damage: '制动间隙超标、制动力不足', content: '调整制动间隙，更换磨损闸瓦' },
    { damage: '闸瓦、制动盘磨损', content: '更换磨损闸瓦与制动盘' },
    { damage: '制动弹簧疲劳失效', content: '更换疲劳失效的制动弹簧' },
    { damage: '推动器、电磁铁动作不良', content: '检修或更换推动器、电磁铁' },
  ] },
  { key: 'electric', name: '电气及控制系统', faults: [
    { damage: '接触器触点烧蚀', content: '更换接触器主触点（整体更换接触器）' },
    { damage: '动力、控制线缆绝缘老化', content: '更换老化线缆，检测绝缘电阻合格' },
    { damage: '控制操作失灵', content: '检修控制回路，更换故障元件' },
    { damage: '变频器故障报警', content: '排查并更换故障模块，备份恢复参数' },
  ] },
  { key: 'safety', name: '安全保护装置', faults: [
    { damage: '限位装置失灵', content: '更换限位开关，校验动作可靠' },
    { damage: '缓冲止挡装置损坏', content: '更换缓冲器，修复限位挡块' },
    { damage: '防超载装置示值漂移', content: '重新标定超载保护，更换载荷传感器' },
    { damage: '抗风防滑装置失效', content: '检修或更换夹轨器、锚定装置' },
  ] },
  { key: 'rigging', name: '索具', faults: [
    { damage: '钢丝绳索具磨损、断丝', content: '按报废标准报废并更换索具' },
    { damage: '编织吊索破损', content: '更换编织吊索' },
    { damage: '卸扣、吊环变形', content: '变形超标更换卸扣、吊环' },
  ] },
  { key: 'other', name: '其他', faults: [
    { damage: '安全标识缺失、模糊', content: '补充、更换安全警示标识' },
    { damage: '随机技术文件不全', content: '补全随机技术资料并归档' },
    { damage: '走台、护栏损坏', content: '修复或更换损坏的走台、护栏' },
  ] },
]

/** 各损伤/故障对应「更换 / 维保」建议知识库 */
const REPAIR_ADVICE: Record<string, { replace: string; maintain: string }> = {
  主梁下挠超标: { replace: '下挠超 GB/T 限值时起拱矫正或加固补强', maintain: '每季度复测下挠，避免长期满载作业' },
  主受力构件焊缝裂纹: { replace: '裂纹清根补焊，必要时更换该节段', maintain: '主受力焊缝定期磁粉/超声探伤并建档' },
  '结构腐蚀、局部穿孔': { replace: '穿孔部位补板加固，整体除锈重做防腐', maintain: '每年检查涂层并补涂，改善积水通风' },
  '连接螺栓、销轴松动脱落': { replace: '更换失效的高强螺栓与销轴', maintain: '按扭矩定期复紧并做防松标记' },
  '钢丝绳断丝、断股超标': { replace: '达到报废标准的钢丝绳立即整根更换', maintain: '每周检查断丝并按规范润滑' },
  '吊钩磨损、开口度超标': { replace: '开口度或危险断面超标时更换吊钩', maintain: '每月测量开口度，检查防脱钩装置' },
  大车车轮啃轨: { replace: '啃轨严重时更换车轮并整修轨道', maintain: '定期检测大车同步与跨度' },
  '联轴器磨损、对中超差': { replace: '更换磨损的联轴器弹性件并重新对中', maintain: '定期检查对中精度与连接紧固' },
  '卷筒磨损、绳槽损伤': { replace: '绳槽损伤超限时补焊车槽或更换卷筒', maintain: '定期检查绳槽与排绳情况' },
  '电机绕组过热、绝缘下降': { replace: '绝缘不合格时重绕或更换电机', maintain: '定期测绝缘、清理通风并监测温升' },
  电机轴承磨损异响: { replace: '更换损坏轴承', maintain: '定期润滑并监测振动、温度' },
  电机振动超标: { replace: '校正动平衡或更换损坏部件', maintain: '定期做振动检测与对中校验' },
  '电机过流、堵转': { replace: '排查机械卡阻与负载，更换故障元件', maintain: '核对负载，定期检查保护整定值' },
  减速机渗油: { replace: '更换失效油封与密封垫', maintain: '定期检查油位、油质' },
  减速机运行异响: { replace: '更换损坏齿轮、轴承', maintain: '按周期换油并监听运行声响' },
  '齿轮磨损、点蚀': { replace: '磨损或点蚀超限时更换齿轮副', maintain: '保证润滑，定期检查齿面' },
  减速机轴承损坏: { replace: '更换损坏轴承', maintain: '定期润滑与振动检测' },
  '制动间隙超标、制动力不足': { replace: '更换磨损闸瓦、制动片', maintain: '每月调整制动间隙，检查弹簧与推动器' },
  '闸瓦、制动盘磨损': { replace: '更换磨损的闸瓦与制动盘', maintain: '定期测厚，保持制动面清洁' },
  制动弹簧疲劳失效: { replace: '更换疲劳失效的制动弹簧', maintain: '定期检查弹簧力与行程' },
  '推动器、电磁铁动作不良': { replace: '检修或更换推动器、电磁铁', maintain: '定期试验动作灵活与可靠性' },
  接触器触点烧蚀: { replace: '更换烧蚀触点或整体更换接触器', maintain: '定期检查触点与负载容量' },
  '动力、控制线缆绝缘老化': { replace: '更换老化、破损线缆', maintain: '定期检测绝缘电阻，加固防护' },
  控制操作失灵: { replace: '更换故障控制元件', maintain: '定期检修控制回路与操作机构' },
  变频器故障报警: { replace: '排查并更换故障模块，必要时整机更换', maintain: '保持散热清洁，定期备份参数' },
  限位装置失灵: { replace: '更换失灵限位开关', maintain: '每月校验各限位动作可靠性' },
  缓冲止挡装置损坏: { replace: '更换破损缓冲器', maintain: '定期检查缓冲器与限位挡块' },
  防超载装置示值漂移: { replace: '更换漂移的载荷传感器', maintain: '按周期重新标定超载保护' },
  抗风防滑装置失效: { replace: '检修或更换夹轨器、锚定装置', maintain: '定期试验夹紧力，大风后检查' },
  '钢丝绳索具磨损、断丝': { replace: '达到报废标准的索具立即更换', maintain: '每次使用前检查索具并建台账' },
  编织吊索破损: { replace: '更换破损编织吊索', maintain: '使用前检查吊索，避免锐边割伤' },
  '卸扣、吊环变形': { replace: '变形超标时更换卸扣、吊环', maintain: '定期检查并按额定载荷使用' },
  '安全标识缺失、模糊': { replace: '补充、更换缺失或模糊的安全标识', maintain: '定期巡查标识完好性' },
  随机技术文件不全: { replace: '补全缺失的随机技术资料', maintain: '建立设备档案并定期核查' },
  '走台、护栏损坏': { replace: '修复或更换损坏的走台、护栏', maintain: '定期检查防护设施完好性' },
}
const repairAdviceOf = (damage: string) =>
  REPAIR_ADVICE[damage] ?? { replace: '按检测结果更换达到报废标准的部件', maintain: '纳入定期维保计划并跟踪复查' }

const REPAIR_HANDLERS = ['设备维修班', '专业维保单位', '厂内机电组']
const REPAIR_URGENT_KW = ['裂纹', '断丝', '断股', '吊钩', '制动', '超载', '索具', '穿孔', '下挠', '过热', '堵转', '疲劳']
const REPAIR_MID_KW = ['磨损', '啃轨', '渗', '漏', '老化', '松动', '异响', '变形', '漂移', '脱落', '振动', '点蚀', '烧蚀', '失效', '故障']
const repairUrgencyOf = (damage: string): { base: number; level: '高' | '中' | '低' } => {
  if (REPAIR_URGENT_KW.some((k) => damage.includes(k))) return { base: 60, level: '高' }
  if (REPAIR_MID_KW.some((k) => damage.includes(k))) return { base: 150, level: '中' }
  return { base: 300, level: '低' }
}
const REPAIR_LEVEL_RANK: Record<string, number> = { 高: 3, 中: 2, 低: 1 }

export interface RepairRecord { id: string; date: string; damage: string; content: string; handler: string; downtime: number }
export interface RepairGroupAdvice {
  urgency: '高' | '中' | '低'
  topDamage: string
  kinds: number
  summary: string
  replace: string
  suggestTime: string
  overdue: boolean
  maintain: string
}
export interface RepairGroup { key: string; name: string; records: RepairRecord[]; advice: RepairGroupAdvice }

function buildRepairAdvice(records: RepairRecord[], todayStr: string): RepairGroupAdvice {
  const byDamage: Record<string, { count: number; latest: string }> = {}
  records.forEach((r) => {
    const e = byDamage[r.damage] ?? { count: 0, latest: '0000-00-00' }
    e.count += 1
    if (r.date > e.latest) e.latest = r.date
    byDamage[r.damage] = e
  })
  const rank = Object.entries(byDamage)
    .map(([damage, info]) => ({ damage, count: info.count, latest: info.latest, u: repairUrgencyOf(damage) }))
    .sort((a, b) => (REPAIR_LEVEL_RANK[b.u.level] - REPAIR_LEVEL_RANK[a.u.level]) || (b.count - a.count))
  const primary = rank[0]
  const kinds = rank.length
  const cycle = Math.max(20, Math.round(primary.u.base / Math.min(primary.count, 4)))
  const due = addDays(primary.latest, cycle)
  const overdue = due <= todayStr
  const suggestTime = overdue
    ? `已达建议更换周期（参考 ${due}），建议尽快安排更换`
    : `建议于 ${due} 前完成更换`
  const pa = repairAdviceOf(primary.damage)
  return {
    urgency: primary.u.level,
    topDamage: primary.damage,
    kinds,
    summary: `该分组共 ${records.length} 条历史维修记录，重点为「${primary.damage}」（出现 ${primary.count} 次）${kinds > 1 ? `，另涉及其余 ${kinds - 1} 类损伤 / 故障` : ''}。`,
    replace: kinds > 1
      ? `${pa.replace}；其余 ${kinds - 1} 类损伤 / 故障建议结合检测结果按报废标准一并处理。`
      : pa.replace,
    suggestTime,
    overdue,
    maintain: `${pa.maintain}；建立该分组维保台账，按周期巡检并记录。`,
  }
}

/** 生成某设备按部件分组的历史维修记录 + 每组 AI 建议（确定性） */
export function getRepairGroups(deviceId: string): RepairGroup[] {
  const base = seedOf(deviceId, 4200)
  const todayStr = fmtDate(new Date())
  return REPAIR_GROUPS.map((g, gi) => {
    const n = 12 + (hash(base + gi * 131 + 1) % 11) // 12~22 条
    const records: RepairRecord[] = []
    for (let i = 0; i < n; i++) {
      const f = g.faults[hash(base + gi * 97 + i * 31 + 2) % g.faults.length]
      records.push({
        id: `${deviceId}-${g.key}-${i}`,
        date: dateMinusDays(hash(base + gi * 17 + i * 13 + 5) % 540),
        damage: f.damage,
        content: f.content,
        handler: REPAIR_HANDLERS[hash(base + gi * 7 + i * 97 + 11) % REPAIR_HANDLERS.length],
        downtime: 2 + (hash(base + gi * 5 + i * 113 + 13) % 22),
      })
    }
    records.sort((a, b) => (a.date < b.date ? 1 : -1))
    return { key: g.key, name: g.name, records, advice: buildRepairAdvice(records, todayStr) }
  })
}
