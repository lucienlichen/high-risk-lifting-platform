import type { OverviewCard } from '@/mock/overviewDemo'

/** 示意排序分。只由设备编号稳定生成，不读取报警灯，也不由 15 项矩阵回算。 */
export function demoRiskScore(card: Pick<OverviewCard, 'id' | 'code'>) {
  let hash = 0
  const text = `${card.id}|${card.code}`
  for (const char of text) hash = (hash * 33 + char.charCodeAt(0)) % 997
  return 20 + (hash % 61)
}

/** 演示色带，只方便阅读降序，不是风险等级，也不读取健康报警灯。分值范围 20–80。 */
export function demoRiskBand(score: number): 'high' | 'mid' | 'low' {
  if (score >= 60) return 'high'
  if (score >= 40) return 'mid'
  return 'low'
}

export const DEVICE_MENUS = [
  { key: 'health', label: '健康监测' },
  { key: 'safety', label: '安全监控' },
  { key: 'risk', label: '风险定量监测' },
  { key: 'patrol', label: '日常点巡检数据' },
  { key: 'repair', label: '故障维修数据' },
  { key: 'inspection', label: '检验检测' },
  { key: 'basic', label: '设备基础数据' },
  { key: 'supply', label: '设备制造供给数据' }
] as const

export type DeviceMenuKey = typeof DEVICE_MENUS[number]['key']

export const SAFETY_PARAMS: [string, string, string, string][] = [
  ['起重量', '16.0', 't', '额定参考 50 t'],
  ['起重力矩', '28', '%', '相对额定力矩'],
  ['起升高度 / 下降深度', '14 / 2.93', 'm', '当前高度 / 深度'],
  ['运行行程', '593.8 / 89.3', 'm', '大车 / 小车位置'],
  ['幅度', '—', '', '无幅变机构'],
  ['大车运行偏斜', '3.05', 'mm', '演示限值 10 mm'],
  ['风速', '0.3', 'm/s', '演示限值 10.8 m/s'],
  ['回转角度', '—', '', '无回转机构'],
  ['操作指令', '手动操作', '', '起升 / 大车 / 小车'],
  ['工作时间', '359', 'min', '当班累计'],
  ['累计工作时间', '2413', 'h', '整机累计'],
  ['工作循环', '2822', '次', '本日 14 次']
]

export const SAFETY_STATES: [string, string][] = [
  ['起升机构制动器的开闭', '闭合'],
  ['抗风防滑', '报警'],
  ['联锁保护', '正常'],
  ['门限位', '正常'],
  ['机构之间的运行联锁', '正常'],
  ['同一或不同一轨道运行机构安全信号', '异常'],
  ['供电电缆卷筒', '正常'],
  ['超速保护', '正常']
]

export const RISK_NAMES = [
  '现场作业人数', '设备价值', '使用场所', '工作级别', '制造单位资质等级', '安装单位资质等级',
  '定期检验情况', '设备专职管理情况', '设备管理制度及执行记录', '操作人员持证时间',
  '定期维护保养及自检', '使用年限', '年故障次数', '环境条件', '天运行时间（年均）'
]

export const RISK_BANDS = [
  ['＜5人', '[5,8)人', '[8,10)人', '≥10人'],
  ['＜50万', '[50,100)万', '[100,200)万', '≥200万'],
  ['其它', '建筑工地', '公共场所', '学校、医院、文物保护区'],
  ['A1–A3', 'A4–A5', 'A6–A7', 'A8'],
  ['A级', 'B级', 'C级', '无'],
  ['A级', 'B级', 'C级', '无'],
  ['一次检验合格', '1项不合格项目，复检后合格', '2–3项不合格项目，复检后合格', '大于3项不合格项目，复检后合格'],
  ['有专职机构、专管人员', '无专职机构、有专管人员', '有专职机构、无专管人员', '无专职机构、人员'],
  ['有安全管理制度、执行记录完好', '有安全管理制度、执行记录不全', '有安全管理制度、无执行记录', '无安全管理制度'],
  ['＜3年', '[3,7)年', '[7,10)年', '≥10年'],
  ['＞1次／月，记录完好', '＞1次／月，记录不完整', '1次／月，记录不完整', '＜1次／月'],
  ['＜5年', '[5,10)年', '[10,15)年', '≥15年'],
  ['＜4次', '[4,12)次', '[12,24)次', '≥24次'],
  ['一般环境条件', '符合特殊环境1项', '符合特殊环境2项', '符合特殊环境2项以上'],
  ['＜4h', '[4,8)h', '[8,12)h', '≥12h']
]

/** 矩阵样例选中列，与概览排序分相互独立。 */
export function demoRiskLevels(id: string) {
  let hash = 3
  for (const char of id) hash = (hash * 17 + char.charCodeAt(0)) % 997
  return RISK_NAMES.map((_, index) => 1 + ((hash + index * 5) % 4))
}

export const INSPECTION_CATEGORIES = ['检验报告', '检测报告']
export const SUPPLY_CATEGORIES = ['设计文件', '质量合格证明', '使用维护说明书', '监督检验证明']
