import { defineComponent, h } from 'vue'

export type ServiceKey =
  | 'integration'
  | 'remote'
  | 'healthMonitor'
  | 'health'
  | 'crack'
  | 'fault'
  | 'point'
  | 'maintain'
  | 'inspect'
  | 'basicdata'
  | 'supply'
  | 'kbDetect'
  | 'kbLaw'
  | 'kbStandard'
  | 'analysis'
  | 'reports'
  | 'training'
  | 'system'
  | 'risk'

export interface ServiceItem {
  key: ServiceKey
  label: string
  summary: string
  icon: ReturnType<typeof defineComponent>
}

export interface ServiceGroup {
  title: string
  cls: 'monitor' | 'diagnosis' | 'maintenance' | 'knowledge' | 'platform'
  items: ServiceItem[]
}

function icon(els: Array<{ tag: string; attrs: Record<string, unknown> }>) {
  return defineComponent({
    render: () => h('svg', {
      width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', 'stroke-width': 1.6,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }, els.map(e => h(e.tag, e.attrs)))
  })
}

export const serviceGroups: ServiceGroup[] = [
  {
    title: '监测检测服务', cls: 'monitor',
    items: [
      { key: 'integration', label: '数据采集与存储服务', summary: '统一接入多源监测数据，完成融合处理与分布式存储管理。', icon: icon([
        { tag: 'ellipse', attrs: { cx: 12, cy: 5, rx: 8, ry: 3 } },
        { tag: 'path', attrs: { d: 'M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5' } },
        { tag: 'path', attrs: { d: 'M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6' } },
        { tag: 'line', attrs: { x1: 2, y1: 8, x2: 6, y2: 8 } },
        { tag: 'line', attrs: { x1: 18, y1: 8, x2: 22, y2: 8 } }
      ]) },
      { key: 'remote', label: '远程监测服务', summary: '远程查看关键监测点、实时状态、趋势曲线与异常预警。', icon: icon([
        { tag: 'rect', attrs: { x: 2, y: 3, width: 20, height: 14, rx: 2 } },
        { tag: 'line', attrs: { x1: 8, y1: 21, x2: 16, y2: 21 } },
        { tag: 'line', attrs: { x1: 12, y1: 17, x2: 12, y2: 21 } },
        { tag: 'polyline', attrs: { points: '7 11 9 9 11 11 13 7 15 10 17 9' } }
      ]) },
      { key: 'healthMonitor', label: '健康监测服务', summary: '汇聚运行状态、监测点位与趋势数据，持续跟踪设备健康变化。', icon: icon([
        { tag: 'path', attrs: { d: 'M22 12h-4l-3 9L9 3l-3 9H2' } }
      ]) },
      { key: 'point', label: '点巡检智能服务', summary: '汇聚日常巡检记录，识别异常频次和隐患趋势。', icon: icon([
        { tag: 'path', attrs: { d: 'M9 11l3 3L22 4' } },
        { tag: 'path', attrs: { d: 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' } }
      ]) },
      { key: 'inspect', label: '检验智能服务', summary: '承接检验检测数据，突出不合格项、复检项和风险项。', icon: icon([
        { tag: 'circle', attrs: { cx: 11, cy: 11, r: 7 } },
        { tag: 'line', attrs: { x1: 21, y1: 21, x2: 16.65, y2: 16.65 } },
        { tag: 'polyline', attrs: { points: '8 11 10.5 13.5 14 9' } }
      ]) }
    ]
  },
  {
    title: '诊断评估服务', cls: 'diagnosis',
    items: [
      { key: 'health', label: '健康评估服务', summary: '融合监测、检验、维修与风险数据，形成设备健康等级和评估结论。', icon: icon([
        { tag: 'path', attrs: { d: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z' } },
        { tag: 'polyline', attrs: { points: '8 12 10.5 14.5 16 9' } }
      ]) },
      { key: 'crack', label: '裂纹预测服务', summary: '基于服役状态和历史损伤数据预测裂纹发展风险。', icon: icon([
        { tag: 'path', attrs: { d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' } }
      ]) },
      { key: 'fault', label: '故障诊断服务', summary: '定位异常来源，给出故障类型、原因研判与处置建议。', icon: icon([
        { tag: 'circle', attrs: { cx: 12, cy: 12, r: 3 } },
        { tag: 'path', attrs: { d: 'M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14' } }
      ]) },
      { key: 'risk', label: '风险定量评估服务', summary: '开展风险定量评估、风险分级研判和防控闭环跟踪。', icon: icon([
        { tag: 'path', attrs: { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' } },
        { tag: 'line', attrs: { x1: 12, y1: 9, x2: 12, y2: 13 } },
        { tag: 'line', attrs: { x1: 12, y1: 17, x2: '12.01', y2: 17 } }
      ]) }
    ]
  },
  {
    title: '维护维修服务', cls: 'maintenance',
    items: [
      { key: 'maintain', label: '维修智能服务', summary: '分析维修闭环、故障部位与备件消耗，辅助维护决策。', icon: icon([
        { tag: 'path', attrs: { d: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2-2 2.7-2.7z' } }
      ]) },
      { key: 'basicdata', label: '基础数据服务', summary: '集中查看设备档案、监管基础信息和关键技术参数。', icon: icon([
        { tag: 'ellipse', attrs: { cx: 12, cy: 5, rx: 8, ry: 3 } },
        { tag: 'path', attrs: { d: 'M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5' } },
        { tag: 'path', attrs: { d: 'M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6' } }
      ]) },
      { key: 'supply', label: '供给服务', summary: '联动制造、供给和质量信息，支撑设备全链条追溯。', icon: icon([
        { tag: 'path', attrs: { d: 'M1 3h15v13H1z' } },
        { tag: 'path', attrs: { d: 'M16 8h4l3 3v5h-7z' } },
        { tag: 'circle', attrs: { cx: 5.5, cy: 18.5, r: 2 } },
        { tag: 'circle', attrs: { cx: 18.5, cy: 18.5, r: 2 } }
      ]) }
    ]
  },
  {
    title: '知识服务', cls: 'knowledge',
    items: [
      { key: 'kbLaw', label: '法律法规知识智能服务', summary: '聚合安全监管法规、标准条文与合规核查依据。', icon: icon([
        { tag: 'line', attrs: { x1: 12, y1: 3, x2: 12, y2: 21 } },
        { tag: 'path', attrs: { d: 'M5 7h14' } },
        { tag: 'path', attrs: { d: 'M7 7l-3 6a3 3 0 0 0 6 0z' } },
        { tag: 'path', attrs: { d: 'M17 7l-3 6a3 3 0 0 0 6 0z' } },
        { tag: 'line', attrs: { x1: 8, y1: 21, x2: 16, y2: 21 } }
      ]) },
      { key: 'kbStandard', label: '常用标准知识智能服务', summary: '沉淀常用标准条款、适用范围与现场执行要点。', icon: icon([
        { tag: 'path', attrs: { d: 'M6 3h11l3 3v15H6z' } },
        { tag: 'path', attrs: { d: 'M17 3v4h4' } },
        { tag: 'line', attrs: { x1: 9, y1: 11, x2: 17, y2: 11 } },
        { tag: 'line', attrs: { x1: 9, y1: 15, x2: 17, y2: 15 } },
        { tag: 'line', attrs: { x1: 9, y1: 19, x2: 14, y2: 19 } }
      ]) },
      { key: 'kbDetect', label: '检验检测知识智能服务', summary: '检索检验检测标准、方法、记录模板与典型案例。', icon: icon([
        { tag: 'path', attrs: { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' } },
        { tag: 'path', attrs: { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' } },
        { tag: 'circle', attrs: { cx: 13, cy: 9, r: 2.4 } },
        { tag: 'line', attrs: { x1: 15, y1: 11, x2: 17, y2: 13 } }
      ]) }
    ]
  },
  {
    title: '分析与平台服务', cls: 'platform',
    items: [
      { key: 'analysis', label: '专题数据分析', summary: '对跨设备、跨点位监测数据进行筛选、融合、对比和趋势分析。', icon: icon([
        { tag: 'polyline', attrs: { points: '3 17 8 12 12 15 18 7 21 10' } },
        { tag: 'line', attrs: { x1: 3, y1: 21, x2: 21, y2: 21 } },
        { tag: 'line', attrs: { x1: 3, y1: 3, x2: 3, y2: 21 } }
      ]) },
      { key: 'reports', label: '报表与模板管理', summary: '自定义监测报表、分析报告和记录模板，并按周期生成归档。', icon: icon([
        { tag: 'path', attrs: { d: 'M6 2h9l4 4v16H6z' } },
        { tag: 'polyline', attrs: { points: '14 2 14 7 19 7' } },
        { tag: 'line', attrs: { x1: 9, y1: 12, x2: 16, y2: 12 } },
        { tag: 'line', attrs: { x1: 9, y1: 16, x2: 16, y2: 16 } }
      ]) },
      { key: 'training', label: '培训实训管理', summary: '管理公司和厂区培训计划、实训过程、考核成绩与复训闭环。', icon: icon([
        { tag: 'path', attrs: { d: 'M3 10l9-5 9 5-9 5z' } },
        { tag: 'path', attrs: { d: 'M7 13v4c3 2 7 2 10 0v-4' } },
        { tag: 'line', attrs: { x1: 21, y1: 10, x2: 21, y2: 16 } }
      ]) },
      { key: 'system', label: '系统管理与审计', summary: '维护用户角色、数据权限、安全策略和操作审计记录。', icon: icon([
        { tag: 'circle', attrs: { cx: 12, cy: 12, r: 3 } },
        { tag: 'path', attrs: { d: 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3.1V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21v4h-.1a1.7 1.7 0 0 0-1.5 1z' } }
      ]) }
    ]
  }
]

export const flatServices = serviceGroups.flatMap(group =>
  group.items.map(item => ({ ...item, groupTitle: group.title, groupClass: group.cls }))
)
