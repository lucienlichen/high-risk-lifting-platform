/* 危险源排查数据（移植自 RuoYi-xiaozhi hazard_tables.sql，代表性子集） */

export interface HazardCategory {
  id: number
  parentId: number
  name: string
  code: string
  icon?: string
  children?: HazardCategory[]
}

export interface HazardItem {
  id: number
  categoryId: number
  itemNo: number
  description: string
  causeCodes: string[]
  eventCodes: string[]
}

export interface CauseEntry {
  code: string
  stage: string
  description: string
}

export interface EventEntry {
  code: string
  name: string
  icon: string
}

/* ========== 分类（tb_hazard_category） ========== */
const CATEGORIES: HazardCategory[] = [
  // 顶级三大类
  { id: 1, parentId: 0, name: '设备危险源', code: 'equipment', icon: 'SetUp' },
  { id: 2, parentId: 0, name: '人员危险源', code: 'personnel', icon: 'User' },
  { id: 3, parentId: 0, name: '环境危险源', code: 'environment', icon: 'Cloudy' },
  // 设备危险源 子分类
  { id: 11, parentId: 1, name: '金属结构', code: '1' },
  { id: 12, parentId: 1, name: '机构及零部件', code: '2' },
  { id: 13, parentId: 1, name: '液压系统', code: '3' },
  { id: 14, parentId: 1, name: '电气及控制系统', code: '4' },
  { id: 15, parentId: 1, name: '安全防护装置', code: '5' },
  { id: 16, parentId: 1, name: '索具', code: '6' },
  { id: 17, parentId: 1, name: '其他', code: '7' },
  // 金属结构 叶
  { id: 111, parentId: 11, name: '主要受力结构', code: '1.1' },
  { id: 112, parentId: 11, name: '非主要受力结构', code: '1.2' },
  // 机构及零部件 叶（节选）
  { id: 121, parentId: 12, name: '起升机构', code: '2.1' },
  { id: 122, parentId: 12, name: '变幅机构', code: '2.2' },
  { id: 123, parentId: 12, name: '回转机构', code: '2.3' },
  { id: 124, parentId: 12, name: '运行机构', code: '2.4' },
  { id: 126, parentId: 12, name: '钢丝绳', code: '2.6' },
  { id: 127, parentId: 12, name: '吊钩', code: '2.7' },
  { id: 133, parentId: 12, name: '卷筒', code: '2.13' },
  { id: 134, parentId: 12, name: '滑轮', code: '2.14' },
  { id: 135, parentId: 12, name: '制动器', code: '2.15' },
  { id: 137, parentId: 12, name: '车轮', code: '2.17' },
  // 电气及控制系统 叶
  { id: 143, parentId: 14, name: '电气系统', code: '4.1' },
  { id: 144, parentId: 14, name: '控制与操作系统', code: '4.2' },
  { id: 145, parentId: 14, name: '接地与避雷', code: '4.3' },
  // 安全防护装置 叶（节选）
  { id: 151, parentId: 15, name: '限位装置', code: '5.1' },
  { id: 152, parentId: 15, name: '缓冲止挡装置', code: '5.2' },
  { id: 153, parentId: 15, name: '防超载装置', code: '5.3' },
  { id: 155, parentId: 15, name: '抗风防滑装置', code: '5.5' },
  // 索具 叶
  { id: 163, parentId: 16, name: '钢丝绳索具', code: '6.1' },
  { id: 164, parentId: 16, name: '编织吊索', code: '6.2' },
  // 人员危险源 叶
  { id: 21, parentId: 2, name: '起重机司机', code: '1' },
  { id: 22, parentId: 2, name: '指挥人员', code: '2' },
  { id: 23, parentId: 2, name: '吊装工', code: '3' },
  { id: 24, parentId: 2, name: '维护人员', code: '4' },
  // 环境危险源 叶
  { id: 31, parentId: 3, name: '自然环境', code: '1' },
  { id: 32, parentId: 3, name: '作业环境', code: '2' }
]

/* ========== 危险源条目（tb_hazard_item，代表性叶分类） ========== */
const ITEMS: HazardItem[] = [
  // 主要受力结构 (111)
  { id: 1, categoryId: 111, itemNo: 1, description: '过量弹性变形或永久塑性变形', causeCodes: ['8.1.2a', '8.1.2b', '8.1.3a', '8.1.3b', '8.1.3c', '8.1.3i', '8.1.4a', '8.1.4b', '8.1.4d', '8.1.4f'], eventCodes: ['6a', '6c', '6k'] },
  { id: 2, categoryId: 111, itemNo: 2, description: '裂纹、断裂', causeCodes: ['8.1.2a', '8.1.2b', '8.1.3a', '8.1.3b', '8.1.3c', '8.1.3i', '8.1.4a', '8.1.4b', '8.1.4d', '8.1.4f'], eventCodes: ['6a', '6c'] },
  { id: 3, categoryId: 111, itemNo: 3, description: '结构腐蚀，局部出现穿孔', causeCodes: ['8.1.2a', '8.1.3f', '8.1.4a', '8.1.4b', '8.1.4c'], eventCodes: ['6a', '6c'] },
  { id: 4, categoryId: 111, itemNo: 4, description: '主体结构异常振动、晃动', causeCodes: ['8.1.2a', '8.1.2b', '8.1.2c', '8.1.3a', '8.1.3b', '8.1.3c', '8.1.3g', '8.1.3i', '8.1.4a', '8.1.4b', '8.1.4d', '8.1.4f'], eventCodes: ['6a', '6b', '6c', '6d'] },
  { id: 5, categoryId: 111, itemNo: 5, description: '主体结构失稳', causeCodes: ['8.1.2a', '8.1.2b', '8.1.3a', '8.1.3b', '8.1.3c', '8.1.3g', '8.1.4a', '8.1.4b', '8.1.4d', '8.1.4f'], eventCodes: ['6a', '6c'] },
  { id: 7, categoryId: 111, itemNo: 7, description: '焊缝存在裂纹、气孔、固体夹杂、未融合、未焊透等缺陷', causeCodes: ['8.1.2a', '8.1.2b', '8.1.3d', '8.1.3h', '8.1.4a', '8.1.4d'], eventCodes: ['6a', '6c'] },
  { id: 8, categoryId: 111, itemNo: 8, description: '金属结构连接螺栓、销轴等小部件断裂或脱落', causeCodes: ['8.1.2d', '8.1.3a', '8.1.4b', '8.1.4c', '8.1.4d'], eventCodes: ['6a', '6b', '6c'] },
  // 非主要受力结构 (112)
  { id: 21, categoryId: 112, itemNo: 1, description: '司机室、平台、走台、栏杆等变形、开裂或锈蚀', causeCodes: ['8.1.2h', '8.1.3f', '8.1.4b', '8.1.4c'], eventCodes: ['6b', '6p'] },
  { id: 22, categoryId: 112, itemNo: 2, description: '梯子、扶手等连接松动或缺失', causeCodes: ['8.1.2h', '8.1.4b', '8.1.4c'], eventCodes: ['6p'] },
  // 钢丝绳 (126)
  { id: 35, categoryId: 126, itemNo: 1, description: '钢丝绳断丝、断股和断绳等', causeCodes: ['8.1.2d', '8.1.3a', '8.1.4b', '8.1.4c', '8.1.4d'], eventCodes: ['6j'] },
  { id: 36, categoryId: 126, itemNo: 2, description: '钢丝绳直径减小（包括外部磨损、内部磨损和绳芯劣化）', causeCodes: ['8.1.2d', '8.1.3a', '8.1.4b', '8.1.4c', '8.1.4d'], eventCodes: ['6j'] },
  { id: 37, categoryId: 126, itemNo: 3, description: '腐蚀', causeCodes: ['8.1.2d', '8.1.3a', '8.1.4b', '8.1.4c', '8.1.4d'], eventCodes: ['6j'] },
  { id: 38, categoryId: 126, itemNo: 4, description: '变形', causeCodes: ['8.1.2d', '8.1.3a', '8.1.4b', '8.1.4c', '8.1.4d'], eventCodes: ['6j'] },
  { id: 39, categoryId: 126, itemNo: 5, description: '机械损伤、热损伤（包括电弧）等', causeCodes: ['8.1.2d', '8.1.3a', '8.1.4b', '8.1.4c', '8.1.4d'], eventCodes: ['6j'] },
  { id: 40, categoryId: 126, itemNo: 6, description: '钢丝绳的连接、固定不可靠', causeCodes: ['8.1.2d', '8.1.3a', '8.1.4c', '8.1.4d'], eventCodes: ['6j'] },
  // 吊钩 (127)
  { id: 45, categoryId: 127, itemNo: 1, description: '吊钩出现裂纹、危险断面磨损或塑性变形', causeCodes: ['8.1.2d', '8.1.4b', '8.1.4c', '8.1.4d'], eventCodes: ['6j'] },
  { id: 46, categoryId: 127, itemNo: 2, description: '吊钩开口度增大、防脱钩装置失效', causeCodes: ['8.1.2d', '8.1.4b', '8.1.4c'], eventCodes: ['6j'] },
  // 制动器 (135)
  { id: 55, categoryId: 135, itemNo: 1, description: '制动器制动力矩不足、制动间隙超标', causeCodes: ['8.1.2c', '8.1.4b', '8.1.4c'], eventCodes: ['6j', '6f'] },
  { id: 56, categoryId: 135, itemNo: 2, description: '制动衬垫磨损超限、制动轮表面缺陷', causeCodes: ['8.1.4b', '8.1.4c'], eventCodes: ['6j'] },
  // 起重机司机 (21)
  { id: 133, categoryId: 21, itemNo: 1, description: '操作起重机时未得到指挥指令或指挥信号不明', causeCodes: ['8.2a', '8.2b', '8.2c'], eventCodes: ['6a', '6c', '6e', '6f', '6p'] },
  { id: 134, categoryId: 21, itemNo: 2, description: '启动起重机前未进行安全确认、示警', causeCodes: ['8.2a', '8.2b', '8.2c'], eventCodes: ['6a', '6c', '6e', '6f', '6p'] },
  { id: 135, categoryId: 21, itemNo: 3, description: '操作起重机斜牵斜拉', causeCodes: ['8.2a', '8.2b', '8.2c'], eventCodes: ['6a', '6c', '6f'] },
  { id: 136, categoryId: 21, itemNo: 4, description: '超载使用起重机或被吊物质量不明时起吊', causeCodes: ['8.2a', '8.2b', '8.2c'], eventCodes: ['6a', '6c', '6j'] },
  { id: 142, categoryId: 21, itemNo: 10, description: '视力、听力、体力、反应能力不胜任', causeCodes: ['8.2c', '8.2d'], eventCodes: ['6a', '6c', '6f', '6p'] },
  // 作业环境 (32) —— 仅事件，无产生原因
  { id: 181, categoryId: 32, itemNo: 1, description: '周边障碍物危险，包括建筑物、其他起重机、堆垛的货物、树木、车辆或正在进行装卸的船只等', causeCodes: [], eventCodes: ['6a', '6c', '6f'] },
  { id: 182, categoryId: 32, itemNo: 2, description: '周边电磁干扰', causeCodes: [], eventCodes: ['6a', '6c', '6d', '6e', '6f', '6j', '6p'] },
  { id: 183, categoryId: 32, itemNo: 3, description: '易燃、易爆环境', causeCodes: [], eventCodes: ['6o', '6q'] },
  { id: 184, categoryId: 32, itemNo: 4, description: '动力源不稳定', causeCodes: [], eventCodes: ['6f', '6j'] },
  { id: 185, categoryId: 32, itemNo: 5, description: '设备的基础存在开裂、不均匀沉陷、松动等现象', causeCodes: [], eventCodes: ['6a', '6c'] },
  { id: 186, categoryId: 32, itemNo: 6, description: '照明不足', causeCodes: [], eventCodes: ['6f', '6p'] }
]

/* ========== 原因字典（tb_hazard_cause_dict） ========== */
const CAUSE_DICT: Record<string, CauseEntry> = mapByCode([
  { code: '8.1.2a', stage: '设计阶段', description: '整体选型设计不合理，如工况分析不全面，使用条件确认有误，使用等级、起升载荷状态级别判断不准确等' },
  { code: '8.1.2b', stage: '设计阶段', description: '金属结构设计不合理，包括对金属结构件及其连接的强度、刚度、稳定性、疲劳强度等设计不足' },
  { code: '8.1.2c', stage: '设计阶段', description: '机构设计不合理，如传动系统设计考虑不全面，安全系数不足等' },
  { code: '8.1.2d', stage: '设计阶段', description: '机械零部件设计、选型不合理，如强度、刚度、稳定性、硬度、抗疲劳设计考虑不足，材质、型式选择不当等' },
  { code: '8.1.2g', stage: '设计阶段', description: '界限尺寸和净距设计不合理' },
  { code: '8.1.2h', stage: '设计阶段', description: '非主要受力结构（司机室、通道、平台、梯子、栏杆等）设计不符合安全要求' },
  { code: '8.1.3a', stage: '制造安装阶段', description: '原材料、外购外协件不符合设计要求或未按要求进行检验' },
  { code: '8.1.3b', stage: '制造安装阶段', description: '缺少必要的生产工艺，或生产工艺有缺陷' },
  { code: '8.1.3c', stage: '制造安装阶段', description: '零部件未按设计、工艺要求进行生产' },
  { code: '8.1.3d', stage: '制造安装阶段', description: '焊接工艺未得到有效确认，焊接过程未有效控制，焊接材料存储、使用不当，焊缝返修不符合要求' },
  { code: '8.1.3f', stage: '制造安装阶段', description: '预处理、表面喷涂不符合要求' },
  { code: '8.1.3g', stage: '制造安装阶段', description: '装配不符合设计、工艺要求' },
  { code: '8.1.3h', stage: '制造安装阶段', description: '未按要求进行无损检测，或者无损检测方法选择不当，无损检测比例不足' },
  { code: '8.1.3i', stage: '制造安装阶段', description: '生产过程中，未按质量计划等相关要求进行检验' },
  { code: '8.1.4a', stage: '使用阶段', description: '设备选型不符合实际使用要求' },
  { code: '8.1.4b', stage: '使用阶段', description: '材料损伤或老化、部件和整机性能退化或失效' },
  { code: '8.1.4c', stage: '使用阶段', description: '日常检查和维护保养不及时、不到位' },
  { code: '8.1.4d', stage: '使用阶段', description: '超载使用、超强度使用等超设计预期的使用' },
  { code: '8.1.4f', stage: '使用阶段', description: '对结构、机构的擅自改动' },
  { code: '8.2a', stage: '人员管理', description: '安全管理机构设置和人员配备不健全' },
  { code: '8.2b', stage: '人员管理', description: '安全相关管理制度不完善或未落实' },
  { code: '8.2c', stage: '人员管理', description: '人员未经过充分的教育培训' },
  { code: '8.2d', stage: '人员管理', description: '人员能力未经充分确认' }
])

/* ========== 事件字典（tb_hazard_event_dict） ========== */
const EVENT_DICT: Record<string, EventEntry> = mapByCode([
  { code: '6a', name: '结构折断', icon: 'Warning' },
  { code: '6b', name: '部件坠落', icon: 'Bottom' },
  { code: '6c', name: '倾覆', icon: 'Sort' },
  { code: '6d', name: '机构崩裂', icon: 'SetUp' },
  { code: '6e', name: '碾压', icon: 'Van' },
  { code: '6f', name: '碰撞挤压', icon: 'Aim' },
  { code: '6g', name: '切割刺伤', icon: 'Scissor' },
  { code: '6h', name: '卷入', icon: 'RefreshRight' },
  { code: '6i', name: '高压流体喷射', icon: 'Pouring' },
  { code: '6j', name: '载荷掉落', icon: 'Download' },
  { code: '6k', name: '脱轨', icon: 'TrendCharts' },
  { code: '6l', name: '触电', icon: 'Lightning' },
  { code: '6m', name: '弧闪', icon: 'Sunrise' },
  { code: '6n', name: '灼烫', icon: 'Sunny' },
  { code: '6o', name: '火灾', icon: 'Flame' },
  { code: '6p', name: '高处坠落', icon: 'User' },
  { code: '6q', name: '爆炸', icon: 'MagicStick' }
])

function mapByCode<T extends { code: string }>(arr: T[]): Record<string, T> {
  const out: Record<string, T> = {}
  arr.forEach((x) => { out[x.code] = x })
  return out
}

/* ========== 查询函数 ========== */
export function getCategoryTree(): HazardCategory[] {
  const byId = new Map<number, HazardCategory>()
  CATEGORIES.forEach((c) => byId.set(c.id, { ...c, children: [] }))
  const roots: HazardCategory[] = []
  byId.forEach((node) => {
    if (node.parentId === 0) roots.push(node)
    else byId.get(node.parentId)?.children!.push(node)
  })
  // 去掉空 children 数组（叶节点）
  byId.forEach((node) => {
    if (node.children && node.children.length === 0) delete node.children
  })
  return roots
}

export function getItems(categoryId: number): HazardItem[] {
  return ITEMS.filter((i) => i.categoryId === categoryId).sort((a, b) => a.itemNo - b.itemNo)
}

export function getCauses(codes: string[]): CauseEntry[] {
  return codes.map((c) => CAUSE_DICT[c]).filter(Boolean)
}

export function getEvents(codes: string[]): EventEntry[] {
  return codes.map((c) => EVENT_DICT[c]).filter(Boolean)
}
