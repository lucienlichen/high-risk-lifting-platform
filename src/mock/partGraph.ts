/**
 * Paint the part template with this device's overview alarms.
 * Parent status is the worst child. Nodes in the grey list stay 未接入 unless an alarm lands on them.
 */
import { templateForDeviceType, type PartTemplateNode } from '@/config/partTemplates'
import { specialtyLabel, type SpecialtyId } from '@/config/specialtyDict'
import type { OverviewCard } from '@/mock/overviewDemo'
import type { LampLevel, OverviewAlarm, OverviewServiceKey } from '@/mock/overviewStatus'

export type PartNodeStatus = 'red' | 'yellow' | 'green' | 'off'

export interface PartGraphNode {
  name: string
  path: string[]
  status: PartNodeStatus
  red: number
  yellow: number
  services: string[]
  alarmId?: string
  children?: PartGraphNode[]
}

export interface PartGraphSpec {
  id: SpecialtyId
  label: string
  status: PartNodeStatus
  red: number
  yellow: number
  nodes: PartGraphNode[]
}

const GREY = new Set(['传动轴', '钢丝绳楔套', '轴承箱', '电阻器', '控制线路', '风速仪装置', '联锁保护装置', '副起升小车架', '三级平衡梁'])

const SERVICE_TAG: Partial<Record<OverviewServiceKey, string>> = {
  safety: '监控',
  healthMonitor: '健康',
  health: '安评',
  crack: '裂纹',
  fault: '诊断'
}

const RANK: Record<PartNodeStatus, number> = { off: 0, green: 1, yellow: 2, red: 3 }

const DEFAULT_LEAF: Record<SpecialtyId, string[]> = {
  metal: ['单双主梁', '前大梁', '臂架结构', '主梁'],
  hoist: ['减速器'],
  travel: ['车轮组'],
  electric: ['控制器'],
  protection: ['起重量（起重力矩）限制器', '运行行程限位器']
}

const KEYWORDS: { test: RegExp; names: string[] }[] = [
  { test: /主梁|下翼缘|跨中|腹板|翼缘/, names: ['单双主梁', '前大梁', '臂架结构'] },
  { test: /端梁/, names: ['端梁'] },
  { test: /小车架/, names: ['主起升小车架', '起升小车架', '上小车架', '副起升小车架'] },
  { test: /平衡梁/, names: ['一级平衡梁', '大车平衡梁'] },
  { test: /支腿|刚性腿/, names: ['刚性腿'] },
  { test: /减速/, names: ['减速器'] },
  { test: /制动/, names: ['制动器'] },
  { test: /钢丝绳/, names: ['钢丝绳'] },
  { test: /吊钩/, names: ['吊钩组'] },
  { test: /车轮|啃轨/, names: ['车轮组'] },
  { test: /变幅/, names: ['变幅机构（柔性）'] },
  { test: /回转/, names: ['回转小齿轮', '回转支承'] },
  { test: /偏斜/, names: ['大车运行偏斜指示器'] },
  { test: /风速/, names: ['风速仪装置'] },
  { test: /防滑|抗风/, names: ['抗风防滑装置'] },
  { test: /超速/, names: ['超速保护装置'] },
  { test: /力矩|起重量|超载/, names: ['起重量（起重力矩）限制器'] },
  { test: /联锁/, names: ['联锁保护装置'] },
  { test: /高度|限位/, names: ['起升高度限位器', '运行行程限位器', '幅度限位器'] },
  { test: /供电|滑触|电缆/, names: ['电源滑触线与防护', '电缆卷筒'] },
  { test: /控制|接触器|断路/, names: ['控制器', '接触器', '断路器'] }
]

function grow(node: PartTemplateNode, path: string[], leaves: PartGraphNode[]): PartGraphNode {
  const next = [...path, node.name]
  if (!node.children?.length) {
    const live: PartGraphNode = {
      name: node.name,
      path: next,
      status: GREY.has(node.name) ? 'off' : 'green',
      red: 0,
      yellow: 0,
      services: []
    }
    leaves.push(live)
    return live
  }
  return {
    name: node.name,
    path: next,
    status: 'green',
    red: 0,
    yellow: 0,
    services: [],
    children: node.children.map(child => grow(child, next, leaves))
  }
}

function normalize(text: string): string {
  return text.replace(/减速机/g, '减速器')
}

function paint(leaf: PartGraphNode, level: LampLevel, tag: string | undefined, alarm: OverviewAlarm) {
  if (level === 'normal') return
  const next: PartNodeStatus = level === 'red' ? 'red' : 'yellow'
  if (RANK[next] >= RANK[leaf.status]) {
    if (RANK[next] > RANK[leaf.status]) leaf.alarmId = alarm.id
    leaf.status = next
  }
  if (!leaf.alarmId) leaf.alarmId = alarm.id
  if (tag && !leaf.services.includes(tag)) leaf.services.push(tag)
}

function findLeaf(leaves: PartGraphNode[], names: string[]): PartGraphNode | undefined {
  for (const name of names) {
    const found = leaves.find(leaf => leaf.name === name || leaf.path.includes(name))
    if (found) return found
  }
  return undefined
}

function rollup(node: PartGraphNode) {
  if (!node.children?.length) {
    node.red = node.status === 'red' ? 1 : 0
    node.yellow = node.status === 'yellow' ? 1 : 0
    return
  }
  node.children.forEach(rollup)
  let status: PartNodeStatus = 'off'
  let red = 0
  let yellow = 0
  const services: string[] = []
  node.children.forEach(child => {
    if (RANK[child.status] > RANK[status]) status = child.status
    red += child.red
    yellow += child.yellow
    child.services.forEach(tag => {
      if (!services.includes(tag)) services.push(tag)
    })
  })
  node.status = status
  node.red = red
  node.yellow = yellow
  node.services = services
}

function forceLamp(leaves: PartGraphNode[], lamp: LampLevel, alarms: OverviewAlarm[]) {
  if (lamp === 'normal') {
    leaves.forEach(leaf => {
      if (leaf.status !== 'off') {
        leaf.status = 'green'
        leaf.services = []
        leaf.alarmId = undefined
      }
    })
    return
  }
  const wanted: PartNodeStatus = lamp === 'red' ? 'red' : 'yellow'
  if (leaves.some(leaf => leaf.status === wanted || (wanted === 'yellow' && leaf.status === 'red'))) return
  const source = alarms.find(alarm => alarm.level === lamp && alarm.serviceKey !== 'risk') || alarms.find(alarm => alarm.level === lamp)
  const hinted = source ? KEYWORDS.find(rule => rule.test.test(normalize(source.text)))?.names : undefined
  const target = (hinted && findLeaf(leaves, hinted))
    || findLeaf(leaves, DEFAULT_LEAF.metal)
    || leaves.find(leaf => leaf.status !== 'off')
  if (!target) return
  if (!source) {
    target.status = wanted
    return
  }
  paint(target, lamp, SERVICE_TAG[source.serviceKey], source)
}

export function buildPartGraph(card: Pick<OverviewCard, 'type' | 'capacityText' | 'lamp' | 'overview'>): PartGraphSpec[] {
  const template = templateForDeviceType(card.type)
  const alarms = card.overview.alarms.filter(alarm => alarm.level !== 'normal')
  return template.specs.map(spec => {
    const leaves: PartGraphNode[] = []
    const nodes = spec.nodes.map(node => grow(node, [], leaves))
    if (card.lamp !== 'normal') {
      alarms.forEach(alarm => {
        const text = normalize(`${alarm.text} ${alarm.serviceLabel}`)
        const rule = KEYWORDS.find(item => item.test.test(text))
        const leaf = rule ? findLeaf(leaves, rule.names) : undefined
        if (!leaf) return
        paint(leaf, alarm.level, SERVICE_TAG[alarm.serviceKey], alarm)
      })
    }
    const specNode: PartGraphSpec = {
      id: spec.id,
      label: specialtyLabel(spec.id),
      status: 'green',
      red: 0,
      yellow: 0,
      nodes
    }
    return { spec: specNode, leaves }
  }).map(({ spec }, _index, all) => {
    if (_index === 0) forceLamp(all.flatMap(item => item.leaves), card.lamp, alarms)
    spec.nodes.forEach(rollup)
    let status: PartNodeStatus = 'off'
    spec.nodes.forEach(node => {
      if (RANK[node.status] > RANK[status]) status = node.status
      spec.red += node.red
      spec.yellow += node.yellow
    })
    spec.status = spec.nodes.length ? status : 'green'
    return spec
  })
}

export function partPathKey(node: { path: string[] }): string {
  return node.path.join('/')
}
