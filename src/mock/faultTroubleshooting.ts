/*
 * 故障排查服务模拟数据
 *
 * 统计口径与 Intelligent_data_agent_LE 的 SpotCheckDataService.vue 保持一致。
 * 为稳定复现原型截图，数据始终按 crane-1 与 2 份点巡检表生成。
 */

export interface FaultTroubleshootingPartCategory {
  key: string
  name: string
}

/** 起重装备部件结构划分（7 类） */
export const FAULT_TROUBLESHOOTING_PART_CATEGORIES: FaultTroubleshootingPartCategory[] = [
  { key: 'structure', name: '金属结构' },
  { key: 'mechanism', name: '机构及零部件' },
  { key: 'hydraulic', name: '液压系统' },
  { key: 'electric', name: '电气及控制系统' },
  { key: 'safety', name: '安全防护装置' },
  { key: 'rigging', name: '索具' },
  { key: 'other', name: '其他' },
]

/** 7 类部件的 26 个常见巡检问题候选项 */
export const FAULT_TROUBLESHOOTING_PROBLEMS_BY_KEY: Record<string, string[]> = {
  structure: ['过量变形/主梁下挠', '裂纹、断裂', '结构腐蚀穿孔', '焊缝缺陷', '连接螺栓/销轴松动脱落'],
  mechanism: ['钢丝绳断丝、断股', '吊钩磨损变形', '制动间隙超标', '减速机渗油异响', '车轮啃轨', '卷筒/滑轮磨损'],
  hydraulic: ['液压系统渗漏', '油温/油压异常', '密封件老化'],
  electric: ['接触器触点烧蚀', '线缆绝缘老化', '控制操作失灵', '接地与避雷异常'],
  safety: ['限位装置失灵', '缓冲止挡装置损坏', '防超载装置漂移', '抗风防滑装置失效'],
  rigging: ['钢丝绳索具磨损断丝', '编织吊索破损'],
  other: ['安全标识缺失', '随机文件不全'],
}

/** 7 类部件的 31 个常见巡检部位 */
export const FAULT_TROUBLESHOOTING_LOCATIONS_BY_KEY: Record<string, string[]> = {
  structure: ['主梁跨中', '主梁端部', '支腿根部', '端梁连接处', '主梁下翼缘'],
  mechanism: ['起升减速机', '制动器', '大车车轮', '卷筒', '钢丝绳', '吊钩'],
  hydraulic: ['液压泵站', '油缸', '油管接头', '阀组'],
  electric: ['主接触器', '控制柜', '滑触线', '电缆卷筒', '接地装置'],
  safety: ['起升限位', '大车行程限位', '超载限制器', '缓冲器', '抗风防滑装置'],
  rigging: ['钢丝绳索具', '编织吊索', '卸扣'],
  other: ['安全标识', '随机技术文件', '其他附件'],
}

export const FAULT_TROUBLESHOOTING_INSPECTORS = ['张工', '李工', '王工', '赵工'] as const

export type FaultTroubleshootingLevelText = '高' | '中' | '低'
export type FaultTroubleshootingLevelTone = 'high' | 'mid' | 'low'

export interface FaultTroubleshootingLevel {
  text: FaultTroubleshootingLevelText
  tone: FaultTroubleshootingLevelTone
  /** 保留参考项目中的等级样式元数据 */
  cls: string
}

export const FAULT_TROUBLESHOOTING_LEVELS: FaultTroubleshootingLevel[] = [
  { text: '高', tone: 'high', cls: 'bg-red-50 text-danger' },
  { text: '中', tone: 'mid', cls: 'bg-amber-50 text-warning' },
  { text: '低', tone: 'low', cls: 'bg-blue-50 text-brand' },
]

export interface FaultTroubleshootingTextRecord {
  id: string
  problem: string
  location: string
  level: FaultTroubleshootingLevel
  metric: string
  action: string
  date: string
  inspector: string
  source: string
  rawText: string
}

export interface FaultTroubleshootingPartStat {
  key: string
  name: string
  count: number
  topProblems: string[]
  records: FaultTroubleshootingTextRecord[]
}

export type FaultTroubleshootingFileStage = 'raw' | 'cleaned'

export interface FaultTroubleshootingFileMeta {
  id: string
  name: string
  url: string
  kind: 'image'
  mimeType: 'image/jpeg'
  stage: FaultTroubleshootingFileStage
  sourceId?: string
}

export const FAULT_TROUBLESHOOTING_SOURCE_FILES: FaultTroubleshootingFileMeta[] = [
  {
    id: 'fault-troubleshooting-raw-01',
    name: '日常点巡检记录表-01.jpg',
    url: '/mockdata/fault-troubleshooting/日常点巡检记录表01.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    stage: 'raw',
  },
  {
    id: 'fault-troubleshooting-raw-02',
    name: '日常点巡检记录表-02.jpg',
    url: '/mockdata/fault-troubleshooting/日常点巡检记录表-02.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    stage: 'raw',
  },
]

export const FAULT_TROUBLESHOOTING_CLEANED_FILES: FaultTroubleshootingFileMeta[] = [
  {
    id: 'fault-troubleshooting-cleaned-01',
    sourceId: 'fault-troubleshooting-raw-01',
    name: 'WPS扫描件_日常点巡检记录表01.jpg',
    url: '/mockdata/fault-troubleshooting/扫描件/WPS扫描件_日常点巡检记录表01.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    stage: 'cleaned',
  },
  {
    id: 'fault-troubleshooting-cleaned-02',
    sourceId: 'fault-troubleshooting-raw-02',
    name: 'WPS扫描件_日常点巡检记录表-02.jpg',
    url: '/mockdata/fault-troubleshooting/扫描件/WPS扫描件_日常点巡检记录表-02.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    stage: 'cleaned',
  },
]

export interface FaultTroubleshootingBoard {
  /** 当前原型设备；仅用于界面上下文，不改变固定演示统计 */
  deviceId: string
  /** 复现参考截图的固定数据种子 */
  seedId: 'crane-1'
  formCount: number
  items: FaultTroubleshootingPartStat[]
  totalProblems: number
  maxCount: number
  involvedParts: number
  topPart: string
  /** 从各部件记录汇总的 14 条结构化文本记录 */
  records: FaultTroubleshootingTextRecord[]
  sourceFiles: FaultTroubleshootingFileMeta[]
  /** sourceFiles 的语义化别名，便于采集/清洗界面直接使用 */
  rawFiles: FaultTroubleshootingFileMeta[]
  cleanedFiles: FaultTroubleshootingFileMeta[]
}

const FIXED_SEED_ID = 'crane-1' as const
const FIXED_FORM_COUNT = 2

/** 32 位整数散列，与参考服务的 hash 保持一致 */
export const faultTroubleshootingHash = (n: number): number => {
  let x = n >>> 0
  x = Math.imul(x ^ (x >>> 16), 2246822507)
  x = Math.imul(x ^ (x >>> 13), 3266489909)
  x ^= x >>> 16
  return x >>> 0
}

const pad = (n: number) => String(n).padStart(2, '0')

const dateMinusDays = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const has = (value: string, ...keywords: string[]) => keywords.some((keyword) => value.includes(keyword))

/** 按问题关键词生成量化描述 */
export const faultTroubleshootingMetricOf = (problem: string, n: number, levelText: string): string => {
  if (has(problem, '裂纹', '断裂', '断丝', '断股')) return `长约 ${5 + (n % 40)} mm`
  if (has(problem, '腐蚀', '锈', '穿孔')) return `锈蚀面积约 ${8 + (n % 50)} cm²`
  if (has(problem, '磨损', '变形', '啃轨', '下挠')) return `磨损/偏差约 ${2 + (n % 18)} mm`
  if (has(problem, '松动', '脱落', '螺栓', '销轴')) return `${1 + (n % 5)} 处松动`
  if (has(problem, '渗', '漏', '泄')) return `渗漏程度：${levelText === '高' ? '明显' : '轻微'}`
  if (has(problem, '温', '压', '异常')) return `偏离正常约 ${8 + (n % 22)}%`
  if (has(problem, '失灵', '失效', '漂移', '不灵', '缺失', '不全')) return '动作/状态不可靠'
  return `严重程度：${levelText}`
}

/** 按问题关键词生成处理建议 */
export const faultTroubleshootingActionOf = (problem: string): string => {
  if (has(problem, '裂纹', '断裂', '焊缝')) return '探伤确认后补焊或更换'
  if (has(problem, '断丝', '断股', '索具')) return '按报废标准核查，超标立即更换'
  if (has(problem, '腐蚀', '锈', '穿孔')) return '除锈防腐，必要时补板加固'
  if (has(problem, '磨损', '变形', '啃轨', '下挠')) return '检测量值，超限调整或更换'
  if (has(problem, '松动', '脱落', '螺栓', '销轴')) return '按规定扭矩紧固并补齐缺失件'
  if (has(problem, '渗', '漏', '油')) return '更换密封件，补充油液'
  if (has(problem, '温', '压', '异常')) return '检修相关部件并复测参数'
  if (has(problem, '限位', '超载', '漂移', '防滑', '缓冲')) return '校验或重新标定保护装置'
  if (has(problem, '标识')) return '补充、更换安全警示标识'
  if (has(problem, '文件')) return '补全随机技术资料并归档'
  if (has(problem, '触点', '线缆', '绝缘', '接地', '控制')) return '检修电气回路，更换故障元件'
  return '现场复查并制定处理措施'
}

/**
 * 生成故障排查看板。
 *
 * deviceId 仅记录当前页面设备；所有设备都使用固定 crane-1 种子，
 * 以保证稳定得到“2 份 / 14 项 / 7 类 / 高频金属结构”的原型结果。
 */
export function getFaultTroubleshootingBoard(deviceId = FIXED_SEED_ID): FaultTroubleshootingBoard {
  const base = FIXED_SEED_ID
    .split('')
    .reduce((accumulator, char) => ((accumulator * 31 + char.charCodeAt(0)) >>> 0), 5381)

  const parts = FAULT_TROUBLESHOOTING_PART_CATEGORIES.map((category) => ({
    ...category,
    problems: FAULT_TROUBLESHOOTING_PROBLEMS_BY_KEY[category.key] ?? [],
  }))
  const locationFor = (key: string) =>
    FAULT_TROUBLESHOOTING_LOCATIONS_BY_KEY[key] ?? ['主体部位', '连接部位', '关键节点']

  const items = parts
    .map((part, partIndex): FaultTroubleshootingPartStat => {
      let count = 0
      const hits: Record<string, number> = {}
      const records: FaultTroubleshootingTextRecord[] = []
      const locations = locationFor(part.key)

      for (let formIndex = 0; formIndex < FIXED_FORM_COUNT; formIndex += 1) {
        const random = faultTroubleshootingHash(base + partIndex * 131 + formIndex * 17 + 7) % 6
        const addedCount = random < 2 ? 0 : random < 4 ? 1 : random < 5 ? 2 : 3

        for (let issueIndex = 0; issueIndex < addedCount; issueIndex += 1) {
          const problem = part.problems[
            faultTroubleshootingHash(base + partIndex * 911 + formIndex * 53 + issueIndex * 13) % part.problems.length
          ]
          hits[problem] = (hits[problem] || 0) + 1

          const n = faultTroubleshootingHash(base + partIndex * 1009 + formIndex * 211 + issueIndex * 37)
          const location = locations[n % locations.length]
          const level = FAULT_TROUBLESHOOTING_LEVELS[
            faultTroubleshootingHash(base + partIndex * 67 + formIndex * 23 + issueIndex * 11 + 3) % FAULT_TROUBLESHOOTING_LEVELS.length
          ]
          const metric = faultTroubleshootingMetricOf(problem, n, level.text)
          const action = faultTroubleshootingActionOf(problem)
          const date = dateMinusDays(
            faultTroubleshootingHash(base + partIndex * 91 + formIndex * 41 + issueIndex * 7 + 5) % 120,
          )
          const inspector = FAULT_TROUBLESHOOTING_INSPECTORS[
            faultTroubleshootingHash(base + partIndex * 13 + formIndex * 29 + issueIndex * 5 + 1) % FAULT_TROUBLESHOOTING_INSPECTORS.length
          ]
          const source = `点巡检表 #${pad((formIndex % FIXED_FORM_COUNT) + 1)}`

          records.push({
            id: `${part.key}-${formIndex}-${issueIndex}`,
            problem,
            location,
            level,
            metric,
            action,
            date,
            inspector,
            source,
            rawText: `${date}，${inspector}巡检：${location}发现${problem}，${metric}，建议${action}。`,
          })
        }
        count += addedCount
      }

      const topProblems = Object.entries(hits)
        .sort((left, right) => right[1] - left[1])
        .map(([name, problemCount]) => `${name}×${problemCount}`)
      records.sort((left, right) => (left.date < right.date ? 1 : -1))

      return { key: part.key, name: part.name, count, topProblems, records }
    })
    .sort((left, right) => right.count - left.count)

  const totalProblems = items.reduce((sum, item) => sum + item.count, 0)
  const maxCount = Math.max(1, items[0]?.count ?? 1)
  const involvedParts = items.filter((item) => item.count > 0).length
  const topPart = items[0]?.count > 0 ? items[0].name : '—'
  const records = items
    .flatMap((item) => item.records)
    .sort((left, right) => (left.date < right.date ? 1 : -1))

  return {
    deviceId,
    seedId: FIXED_SEED_ID,
    formCount: FIXED_FORM_COUNT,
    items,
    totalProblems,
    maxCount,
    involvedParts,
    topPart,
    records,
    sourceFiles: FAULT_TROUBLESHOOTING_SOURCE_FILES,
    rawFiles: FAULT_TROUBLESHOOTING_SOURCE_FILES,
    cleanedFiles: FAULT_TROUBLESHOOTING_CLEANED_FILES,
  }
}
