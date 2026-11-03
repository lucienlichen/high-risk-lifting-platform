/**
 * Whole-machine part breakdown from the grading decks.
 * Three drawn levels: 部件 → 子部件 → 元件. `extra` is the hidden 4th level (零件 / 分段).
 */
import type { SpecialtyId } from '@/config/specialtyDict'

export type PartTemplateId = 'yj' | 'zc' | 'aq' | 'mz'

export interface PartTemplateNode {
  name: string
  /** Hidden next level, shown as +n and not drawn. */
  extra?: string
  children?: PartTemplateNode[]
}

export interface PartTemplateSpec {
  id: SpecialtyId
  nodes: PartTemplateNode[]
}

export interface PartTemplate {
  id: PartTemplateId
  label: string
  specs: PartTemplateSpec[]
}

const PARTS = '零件与连接件'
const leaf = (name: string, extra?: string): PartTemplateNode => ({ name, extra })
const group = (name: string, children: PartTemplateNode[], extra?: string): PartTemplateNode => ({ name, children, extra })

const drive = (): PartTemplateNode => group('驱动装置', [
  leaf('电机'),
  leaf('传动轴'),
  leaf('联轴器'),
  leaf('减速器', '齿轮箱轴承等零件'),
  leaf('制动器', '制动盘等零件与连接件')
])
const rope = (): PartTemplateNode => group('钢丝绳卷绕系统', [
  leaf('钢丝绳'),
  leaf('钢丝绳楔套'),
  leaf('滑轮组', '滑轮销轴轴承等零件'),
  leaf('卷筒', PARTS)
])
const hook = (): PartTemplateNode => leaf('吊钩组', '吊钩滑轮组等零部件')
const hoist = (name: string, pick: PartTemplateNode[]): PartTemplateNode => group(name, [drive(), rope(), group('取物装置', pick)])
const bogie = (): PartTemplateNode => group('台车架系统', [
  leaf('台车架结构', '零件'),
  leaf('轴承箱', PARTS),
  leaf('车轮组', '主动车轮零件、被动车轮零件')
])
const travel = (name: string): PartTemplateNode => group(name, [drive(), bogie()])
const electric = (): PartTemplateNode[] => [
  group('供电系统', [leaf('电源滑触线与防护'), leaf('集电器'), leaf('电缆卷筒')]),
  group('控制元件', [leaf('隔离开关'), leaf('断路器'), leaf('接触器'), leaf('电阻器'), leaf('控制器'), leaf('控制屏'), leaf('控制线路')])
]
const beams = (): PartTemplateNode => group('大车平衡梁', [
  leaf('一级平衡梁', PARTS),
  leaf('二级平衡梁', PARTS),
  leaf('三级平衡梁', PARTS)
])
const SAFE4 = ['起重量（起重力矩）限制器', '起升高度限位器', '下降深度限位器', '运行行程限位器']
const SAFE_PORT = [...SAFE4, '大车运行偏斜指示器', '联锁保护装置', '抗风防滑装置', '风速仪装置', '运行机构防碰撞装置', '超速保护装置', '供电电缆卷筒安全限位']

export const PART_TEMPLATES: PartTemplate[] = [
  {
    id: 'yj',
    label: '冶金桥式',
    specs: [
      {
        id: 'metal',
        nodes: [
          group('桥架', [leaf('单双主梁', '主梁分段1…n（各含零件与连接件）'), leaf('端梁', PARTS)]),
          group('起升小车', [leaf('主起升小车架', PARTS), leaf('副起升小车架', PARTS)]),
          leaf('大车平衡梁', PARTS)
        ]
      },
      {
        id: 'hoist',
        nodes: [hoist('主起升机构', [hook(), leaf('吊梁', PARTS)]), hoist('副起升机构', [hook(), leaf('吊梁', PARTS)])]
      },
      { id: 'travel', nodes: [travel('小车运行机构'), travel('大车运行机构')] },
      { id: 'electric', nodes: electric() },
      { id: 'protection', nodes: [...SAFE4, '联锁保护装置', '运行机构防碰撞装置', '超速保护装置'].map(name => leaf(name)) }
    ]
  },
  {
    id: 'zc',
    label: '造船门式',
    specs: [
      {
        id: 'metal',
        nodes: [
          group('桥架', [leaf('单双主梁', '主梁分段1…n（各含零件与连接件）'), leaf('端梁', PARTS)]),
          group('支腿', [leaf('刚性腿', '刚性腿分段1…n、下横梁'), leaf('柔性腿', '柔性腿分段1…n、下横梁')]),
          group('起升小车', [leaf('上小车架', PARTS), leaf('下小车架', PARTS)]),
          beams()
        ]
      },
      {
        id: 'hoist',
        nodes: [hoist('上小车起升机构', [hook(), leaf('吊梁', PARTS)]), hoist('下小车起升机构', [hook(), leaf('吊梁', PARTS)])]
      },
      { id: 'travel', nodes: [travel('上小车运行机构'), travel('下小车运行机构'), travel('大车运行机构')] },
      { id: 'electric', nodes: electric() },
      { id: 'protection', nodes: SAFE_PORT.map(name => leaf(name)) }
    ]
  },
  {
    id: 'aq',
    label: '岸边集装箱',
    specs: [
      {
        id: 'metal',
        nodes: [
          group('主梁', [leaf('前大梁', PARTS), leaf('后大梁', PARTS), leaf('平面撑杆', PARTS)]),
          group('拉杆系统', [leaf('前拉杆', PARTS), leaf('之间拉杆', PARTS), leaf('后拉杆', PARTS)]),
          group('门架', [leaf('梯形架与拉杆', PARTS), leaf('门架上横梁', PARTS), leaf('门架立柱', PARTS), leaf('门架撑杆', PARTS), leaf('门架下横梁', PARTS)]),
          leaf('起升小车架', PARTS),
          beams()
        ]
      },
      { id: 'hoist', nodes: [hoist('小车起升机构', [leaf('抓斗', PARTS), leaf('吊梁', PARTS)])] },
      { id: 'travel', nodes: [travel('小车运行机构'), travel('大车运行机构')] },
      { id: 'electric', nodes: electric() },
      { id: 'protection', nodes: SAFE_PORT.map(name => leaf(name)) }
    ]
  },
  {
    id: 'mz',
    label: '门座',
    specs: [
      {
        id: 'metal',
        nodes: [
          group('臂架系统', [leaf('臂架结构', PARTS), leaf('拉杆结构', PARTS), leaf('象鼻架结构', PARTS)]),
          group('人字架结构', [leaf('前撑杆结构', PARTS), leaf('后拉杆结构', PARTS)]),
          leaf('转柱结构', PARTS),
          leaf('对中平衡重结构', PARTS),
          leaf('转台结构', PARTS),
          group('门座结构', [leaf('筒体结构', PARTS), leaf('门架结构', PARTS)]),
          beams()
        ]
      },
      {
        id: 'hoist',
        nodes: [
          hoist('主起升机构', [leaf('吸盘', PARTS), hook(), leaf('抓斗', PARTS), leaf('吊梁', PARTS)]),
          hoist('副起升机构', [leaf('吸盘', PARTS), hook(), leaf('抓斗', PARTS), leaf('吊梁', PARTS)])
        ]
      },
      {
        id: 'travel',
        nodes: [
          group('变幅机构（柔性）', [drive(), rope(), leaf('防后倾装置', PARTS)]),
          group('回转机构', [drive(), group('回转装置', [leaf('回转小齿轮', '零件'), leaf('回转支承', PARTS)])]),
          travel('行走机构')
        ]
      },
      { id: 'electric', nodes: electric() },
      {
        id: 'protection',
        nodes: [...SAFE4, '幅度限位器', '联锁保护装置', '抗风防滑装置', '风速仪装置', '回转限制器', '运行机构防碰撞装置', '超速保护装置', '供电电缆卷筒安全限位'].map(name => leaf(name))
      }
    ]
  }
]

/** 桥式一族用冶金桥式；认不出的类型也回落到冶金桥式。 */
export function templateForDeviceType(type: string): PartTemplate {
  const text = type || ''
  let id: PartTemplateId = 'yj'
  if (/岸边|岸桥/.test(text)) id = 'aq'
  else if (/门式|装卸桥|造船/.test(text)) id = 'zc'
  else if (/门座|臂架|塔式|流动|履带|轮胎/.test(text)) id = 'mz'
  else if (/桥式|单梁|双梁|天车|冶金/.test(text)) id = 'yj'
  return PART_TEMPLATES.find(item => item.id === id) || PART_TEMPLATES[0]
}

export function extraCount(extra: string): string {
  return extra.includes('分段') ? 'n' : String(extra.split('、').length)
}
