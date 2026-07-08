import type { Device } from './index'

export interface RiskIndicatorOption {
  grade: number
  description: string
}

export interface RiskIndicatorSchema {
  id: number
  name: string
  options: RiskIndicatorOption[]
}

export interface RiskIndicatorResult {
  id: number
  name: string
  options: RiskIndicatorOption[]
  /** 命中等级 1-4 */
  grade: number
}

export interface DeviceRiskAssessment {
  deviceId: string
  indicators: RiskIndicatorResult[]
  comprehensiveScore: number
  riskLevel: '低风险' | '一般风险' | '较大风险' | '重大风险'
}

/** 15 项风险评估指标（移植自参考项目 lib/riskData.ts） */
export const indicatorsSchema: RiskIndicatorSchema[] = [
  {
    id: 1,
    name: '现场作业人数',
    options: [
      { grade: 1, description: '＜5人' },
      { grade: 2, description: '[5,8)人' },
      { grade: 3, description: '[8,10)人' },
      { grade: 4, description: '≥10人' }
    ]
  },
  {
    id: 2,
    name: '设备价值',
    options: [
      { grade: 1, description: '＜50万' },
      { grade: 2, description: '[50,100)万' },
      { grade: 3, description: '[100,200)万' },
      { grade: 4, description: '≥200万' }
    ]
  },
  {
    id: 3,
    name: '使用场所',
    options: [
      { grade: 1, description: '其它' },
      { grade: 2, description: '建筑工地' },
      { grade: 3, description: '公共场所' },
      { grade: 4, description: '学校、医院、文物保护区' }
    ]
  },
  {
    id: 4,
    name: '工作级别',
    options: [
      { grade: 1, description: 'A1-A3' },
      { grade: 2, description: 'A4-A5' },
      { grade: 3, description: 'A6-A7' },
      { grade: 4, description: 'A8' }
    ]
  },
  {
    id: 5,
    name: '制造单位资质等级',
    options: [
      { grade: 1, description: 'A级' },
      { grade: 2, description: 'B级' },
      { grade: 3, description: 'C级' },
      { grade: 4, description: '无' }
    ]
  },
  {
    id: 6,
    name: '安装单位资质等级',
    options: [
      { grade: 1, description: 'A级' },
      { grade: 2, description: 'B级' },
      { grade: 3, description: 'C级' },
      { grade: 4, description: '无' }
    ]
  },
  {
    id: 7,
    name: '定期检验情况',
    options: [
      { grade: 1, description: '一次检验合格' },
      { grade: 2, description: '1项不合格项目，复检后合格' },
      { grade: 3, description: '2-3项不合格项目，复检后合格' },
      { grade: 4, description: '大于3项不合格项目，复检后合格' }
    ]
  },
  {
    id: 8,
    name: '设备专职管理情况',
    options: [
      { grade: 1, description: '有专职机构、专管人员' },
      { grade: 2, description: '无专职机构、有专管人员' },
      { grade: 3, description: '有专职机构、无专管人员' },
      { grade: 4, description: '无专职机构、人员' }
    ]
  },
  {
    id: 9,
    name: '设备管理制度及执行记录',
    options: [
      { grade: 1, description: '有安全管理制度、执行记录完好' },
      { grade: 2, description: '有安全管理制度、执行记录不全' },
      { grade: 3, description: '有安全管理制度、无执行记录' },
      { grade: 4, description: '无安全管理制度' }
    ]
  },
  {
    id: 10,
    name: '操作人员持证时间',
    options: [
      { grade: 1, description: '＜3年' },
      { grade: 2, description: '[3,7)年' },
      { grade: 3, description: '[7,10)年' },
      { grade: 4, description: '≥10年' }
    ]
  },
  {
    id: 11,
    name: '定期维护保养及自检',
    options: [
      { grade: 1, description: '≥1次／月，记录完好' },
      { grade: 2, description: '＞1次／月，记录不完整' },
      { grade: 3, description: '1次／月，记录不完整' },
      { grade: 4, description: '＜1次／月' }
    ]
  },
  {
    id: 12,
    name: '使用年限',
    options: [
      { grade: 1, description: '＜5年' },
      { grade: 2, description: '[5,10)年' },
      { grade: 3, description: '[10,15)年' },
      { grade: 4, description: '≥15年' }
    ]
  },
  {
    id: 13,
    name: '年故障次数',
    options: [
      { grade: 1, description: '＜4次' },
      { grade: 2, description: '[4,12)次' },
      { grade: 3, description: '[12,24)次' },
      { grade: 4, description: '≥24次' }
    ]
  },
  {
    id: 14,
    name: '环境条件',
    options: [
      { grade: 1, description: '一般环境条件' },
      { grade: 2, description: '符合特殊环境1项' },
      { grade: 3, description: '符合特殊环境2项' },
      { grade: 4, description: '符合特殊环境2项以上' }
    ]
  },
  {
    id: 15,
    name: '天运行时间（年均）',
    options: [
      { grade: 1, description: '＜4h' },
      { grade: 2, description: '[4,8)h' },
      { grade: 3, description: '[8,12)h' },
      { grade: 4, description: '≥12h' }
    ]
  }
]

/** 与 mock/index.ts 一致的确定性线性同余生成器 */
function mkRng(baseSeed: number) {
  let s = baseSeed
  return (min: number, max: number) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return min + (s % (max - min + 1))
  }
}

function seedFromId(id: string): number {
  return id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

function levelFromScore(score: number): DeviceRiskAssessment['riskLevel'] {
  if (score <= 25) return '低风险'
  if (score <= 35) return '一般风险'
  if (score <= 45) return '较大风险'
  return '重大风险'
}

/** 确定性生成某设备的风险评估（同一设备结果稳定，不随机刷新） */
export function getDeviceRiskAssessment(device: Device): DeviceRiskAssessment {
  const rng = mkRng(seedFromId(device.id) + 7)

  const indicators: RiskIndicatorResult[] = indicatorsSchema.map((schema) => {
    const grade = rng(1, schema.options.length)
    return { id: schema.id, name: schema.name, options: schema.options, grade }
  })

  const comprehensiveScore = indicators.reduce((sum, ind) => sum + ind.grade, 0)

  return {
    deviceId: device.id,
    indicators,
    comprehensiveScore,
    riskLevel: levelFromScore(comprehensiveScore)
  }
}

/** 确定性实时振动值（mm/s），同一设备稳定 */
export function getDeviceVibration(device: Device): number {
  const rng = mkRng(seedFromId(device.id) + 31)
  return rng(80, 420) / 100 // 0.80 ~ 4.20 mm/s
}
