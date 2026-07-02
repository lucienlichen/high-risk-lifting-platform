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
