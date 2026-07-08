import type { Device } from './index'

export type HazardCategory = '重大事故隐患' | '一般事故隐患'
export type CheckResult = '有' | '无'

export interface CheckItem {
  id: number
  category: HazardCategory
  /** 排查项目分组 */
  project: string
  /** 排查内容 */
  content: string
}

export interface CheckResultDetail {
  result: CheckResult
  remark: string
}

export interface DeviceCheckRecord {
  id: string
  deviceId: string
  deviceName: string
  year: number
  date: string
  inspector: string
  results: Record<number, CheckResultDetail>
  majorCount: number
  normalCount: number
  aiSuggestion: string
}

/* ========== 64 项隐患排查清单（移植自参考项目 hazardCheckStore） ========== */
export const CHECK_ITEMS: CheckItem[] = [
  { id: 1, category: '重大事故隐患', project: '重大事故隐患排查', content: '未经首次检验。' },
  { id: 2, category: '重大事故隐患', project: '重大事故隐患排查', content: '定期检验 (含首次检验) 的检验结论为 "不合格"。' },
  { id: 3, category: '重大事故隐患', project: '重大事故隐患排查', content: '急停开关缺失或失效。' },
  { id: 4, category: '重大事故隐患', project: '重大事故隐患排查', content: '起重量限制器、起重力矩限制器、防坠安全器缺失或失效。' },
  { id: 5, category: '重大事故隐患', project: '重大事故隐患排查', content: '室外工作的轨道式起重机械防风防滑装置缺失或失效。' },
  { id: 6, category: '一般事故隐患', project: '使用登记状况', content: '设施能否办理使用登记' },
  { id: 7, category: '一般事故隐患', project: '使用登记状况', content: '能否购置合法起重机械' },
  { id: 8, category: '一般事故隐患', project: '使用登记状况', content: '起重机械品种（型式）能否知足使用条件要求' },
  { id: 9, category: '一般事故隐患', project: '使用登记状况', content: '检验合格标记能否按规定标明' },
  { id: 10, category: '一般事故隐患', project: '使用登记状况', content: '能否按规定进行按期查验' },
  { id: 11, category: '一般事故隐患', project: '持证上岗状况', content: '起重机司机、司索和信号指挥人员能否按规定要求进行培训和查核' },
  { id: 12, category: '一般事故隐患', project: '安全管理制度成立情况', content: '能否拟订起重机械操作规程' },
  { id: 13, category: '一般事故隐患', project: '安全管理制度成立情况', content: '能否成立起重机械按期查验和隐患整顿制度' },
  { id: 14, category: '一般事故隐患', project: '安全管理制度成立情况', content: '能否成立起重机械事故防备举措和事故应抢营救方案' },
  { id: 15, category: '一般事故隐患', project: '安全管理制度成立情况', content: '制度能否落实到有关人员' },
  { id: 16, category: '一般事故隐患', project: '安全责任落实状况', content: '能否设置专人负责起重机械安全管理工作' },
  { id: 17, category: '一般事故隐患', project: '安全责任落实状况', content: '起重机械保护养护规程和操作规程掌握状况' },
  { id: 18, category: '一般事故隐患', project: '安全使用状况', content: '起重机械检验合格标记、吨位等能否醒目' },
  { id: 19, category: '一般事故隐患', project: '安全使用状况', content: '危险性较大的吊装或施工场所能否有显然表记' },
  { id: 20, category: '一般事故隐患', project: '安全使用状况', content: '安全地区内能否有无关人员活动' },
  { id: 21, category: '一般事故隐患', project: '安全使用状况', content: '制动器和各样安全保护装置能否齐备、有效' },
  { id: 22, category: '一般事故隐患', project: '安全装置', content: '高度、行程、速度等保护装置能否完好、敏捷靠谱' },
  { id: 23, category: '一般事故隐患', project: '安全装置', content: '各样缓冲装置能否完好、坚固' },
  { id: 24, category: '一般事故隐患', project: '安全装置', content: '紧迫报警装置能否靠谱' },
  { id: 25, category: '一般事故隐患', project: '安全装置', content: '各样连锁保护装置能否靠谱，保证进入起重机的门或司机室门开启时总电源不接通' },
  { id: 26, category: '一般事故隐患', project: '设施本体状况', content: '基础或轨道能否存在破坏、变形' },
  { id: 27, category: '一般事故隐患', project: '设施本体状况', content: '钢构造能否存在破坏、变形、腐化、开裂现象' },
  { id: 28, category: '一般事故隐患', project: '设施本体状况', content: '吊钩有无损害' },
  { id: 29, category: '一般事故隐患', project: '设施本体状况', content: '钢丝绳润滑优秀、无变形，断丝数未超出规定' },
  { id: 30, category: '一般事故隐患', project: '设施本体状况', content: '各样制动器零部件完好优秀，制动装置运转靠谱' },
  { id: 31, category: '一般事故隐患', project: '设施本体状况', content: '电气设施及元件完好固定牢固，接地合规、布线合理无破坏，适配使用环境' },
  { id: 32, category: '一般事故隐患', project: '设施本体状况', content: '驾驶室构造坚固无变形破坏，视线良好、通风优秀' },
  { id: 33, category: '一般事故隐患', project: '起重机的钢丝绳', content: '有安全检验合格证并固定在醒目位置，在有效期内使用' },
  { id: 34, category: '一般事故隐患', project: '起重机的钢丝绳', content: '钢丝绳在一个捻距内，钢丝断数不超出钢丝总数的____%' },
  { id: 35, category: '一般事故隐患', project: '起重机的钢丝绳', content: '钢丝绳磨损使直径较公称直径减小____% 及以上，即使未断丝也需报废更新' },
  { id: 36, category: '一般事故隐患', project: '钢丝绳与卷筒 / 滑轮槽般配', content: '钢丝绳尾端装卡坚固，压板数量不少于____个' },
  { id: 37, category: '一般事故隐患', project: '钢丝绳与卷筒 / 滑轮槽般配', content: '吊钩处于最低点时，卷筒上起码留有____圈' },
  { id: 38, category: '一般事故隐患', project: '滑轮', content: '无裂纹缺损，转动灵巧' },
  { id: 39, category: '一般事故隐患', project: '吊钩', content: '钩体无裂纹，不准补焊' },
  { id: 40, category: '一般事故隐患', project: '制动器', content: '制动器敏捷靠谱，摩擦片磨损不超出原厚度的____%' },
  { id: 41, category: '一般事故隐患', project: '制动器', content: '制动时间不大于____' },
  { id: 42, category: '一般事故隐患', project: '安全防护系统', content: '过卷扬限位器完满靠谱' },
  { id: 43, category: '一般事故隐患', project: '安全防护系统', content: '大小车行程限位器完满靠谱' },
  { id: 44, category: '一般事故隐患', project: '安全防护系统', content: '门窗电气联锁保护装置完满靠谱' },
  { id: 45, category: '一般事故隐患', project: '安全防护系统', content: '终端缓冲器完满靠谱' },
  { id: 46, category: '一般事故隐患', project: '安全防护系统', content: '信号装置齐备完满靠谱' },
  { id: 47, category: '一般事故隐患', project: '安全防护系统', content: '轨道端部阻拦器完满靠谱' },
  { id: 48, category: '一般事故隐患', project: '安全防护系统', content: '轨道接地完满靠谱' },
  { id: 49, category: '一般事故隐患', project: '安全防护系统', content: '转动部位保护罩完满靠谱' },
  { id: 50, category: '一般事故隐患', project: '安全防护系统', content: '滑线保护挡板完满靠谱' },
  { id: 51, category: '一般事故隐患', project: '安全防护系统', content: '护栏完满靠谱' },
  { id: 52, category: '一般事故隐患', project: '吊索具', content: '吊索具上架定点摆放，注明额定承重量和色标，性能完好' },
  { id: 53, category: '一般事故隐患', project: '使用登记状况', content: '安全技术档案能否齐备' },
  { id: 54, category: '一般事故隐患', project: '持证上岗状况', content: '能否成立作业人员培训、查核档案' },
  { id: 55, category: '一般事故隐患', project: '安全管理制度成立情况', content: '能否成立保护养护和平时检查制度' },
  { id: 56, category: '一般事故隐患', project: '安全管理制度成立情况', content: '能否成立安全技术档案管理制度' },
  { id: 57, category: '一般事故隐患', project: '安全管理制度成立情况', content: '能否成立作业人员安全培训制度' },
  { id: 58, category: '一般事故隐患', project: '安全管理制度成立情况', content: '制度能否合适本单位状况' },
  { id: 59, category: '一般事故隐患', project: '安全责任落实状况', content: '单位负责人能否认识国家有关起重机械安全管理法例、规章的有关规定' },
  { id: 60, category: '一般事故隐患', project: '设施本体状况', content: '各传动部分运转正常，润滑优秀' },
  { id: 61, category: '一般事故隐患', project: '设施本体状况', content: '照明能否切合规定' },
  { id: 62, category: '一般事故隐患', project: '钢丝绳与卷筒 / 滑轮槽般配', content: '卷筒终端部位和常绕滑轮部位，绳面应有润滑油' },
  { id: 63, category: '一般事故隐患', project: '安全防护系统', content: '驾驶室地面绝缘垫完满靠谱' },
  { id: 64, category: '一般事故隐患', project: '其余状况', content: '其余需要记录的隐患情况' }
]

/* ========== 分组工具 ========== */
export interface ItemSubGroup {
  title: string
  items: CheckItem[]
}

export const majorItems: CheckItem[] = CHECK_ITEMS.filter((i) => i.category === '重大事故隐患')

export const generalSubGroups: ItemSubGroup[] = (() => {
  const groups = new Map<string, CheckItem[]>()
  CHECK_ITEMS.filter((i) => i.category === '一般事故隐患').forEach((item) => {
    if (!groups.has(item.project)) groups.set(item.project, [])
    groups.get(item.project)!.push(item)
  })
  return Array.from(groups.entries()).map(([title, items]) => ({ title, items }))
})()

/* ========== 确定性记录生成 ========== */
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

const INSPECTORS = ['张工', '李工', '王工', '赵工']
const REMARKS = ['需要整改', '待维修', '需更换部件', '需加强培训']
const CURRENT_YEAR = 2026

function generateAISuggestion(majorCount: number, normalCount: number): string {
  const parts: string[] = []
  if (majorCount > 0) {
    parts.push(
      `检测到 ${majorCount} 项重大事故隐患，建议立即停机整改并上报相关部门。根据《特种设备安全法》第四十条规定，发现重大事故隐患应当立即采取措施消除隐患。`
    )
  } else {
    parts.push('未发现重大事故隐患，设备安全状况良好。')
  }
  if (normalCount > 0) {
    parts.push(`发现 ${normalCount} 项一般事故隐患，建议在30日内完成整改，并做好整改记录。`)
  }
  if (majorCount === 0 && normalCount === 0) {
    parts.push('所有排查项均未发现隐患，设备状况优秀。建议继续做好日常维护和定期检查工作。')
  } else {
    parts.push('请及时制定整改计划，明确责任人和完成时限，并在整改完成后进行复查。')
  }
  return parts.join(' ')
}

/** 确定性生成某设备的隐患排查历史记录（同一设备稳定，不随机刷新） */
export function getDeviceHazardRecords(device: Device): DeviceCheckRecord[] {
  const rng = mkRng(seedFromId(device.id) + 13)
  const recordCount = rng(1, 10) > 6 ? 2 : 1
  const records: DeviceCheckRecord[] = []

  for (let i = 0; i < recordCount; i++) {
    const year = CURRENT_YEAR - i
    const month = rng(1, 12)
    const day = rng(1, 28)
    const results: Record<number, CheckResultDetail> = {}
    let majorCount = 0
    let normalCount = 0

    for (const item of CHECK_ITEMS) {
      // 重大隐患极低概率命中、一般隐患低概率命中
      const threshold = item.category === '重大事故隐患' ? 99 : 92
      const hit = rng(1, 100) > threshold
      const result: CheckResult = hit ? '有' : '无'
      results[item.id] = { result, remark: hit ? REMARKS[rng(0, REMARKS.length - 1)] : '' }
      if (hit) {
        if (item.category === '重大事故隐患') majorCount++
        else normalCount++
      }
    }

    records.push({
      id: `hz-${device.id}-${year}-${i}`,
      deviceId: device.id,
      deviceName: device.name,
      year,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      inspector: INSPECTORS[rng(0, INSPECTORS.length - 1)],
      results,
      majorCount,
      normalCount,
      aiSuggestion: generateAISuggestion(majorCount, normalCount)
    })
  }

  return records.sort((a, b) => b.year - a.year || b.date.localeCompare(a.date))
}
