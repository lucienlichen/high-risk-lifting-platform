/**
 * Whole-machine breakdown from the grading decks.
 * Drawn depth is 部件 → 子部件 → 第三级. Segment and 零件与连接件 rows are real nodes.
 * Mechanism parts that the decks place under 驱动装置 / 钢丝绳 / 台车架 are already that third level;
 * their inner 零件 lists are not a fourth column.
 */
import type { SpecialtyId } from '@/config/specialtyDict'

export type PartTemplateId = 'yj' | 'zc' | 'aq' | 'mz'

export interface PartTemplateNode {
  name: string
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

const leaf = (name: string): PartTemplateNode => ({ name })
const group = (name: string, children: PartTemplateNode[]): PartTemplateNode => ({ name, children })
const withParts = (name: string): PartTemplateNode => group(name, [leaf('零件与连接件')])
const girder = (): PartTemplateNode => group('单双主梁', [
  leaf('主梁分段1'),
  leaf('主梁分段2'),
  leaf('主梁分段n'),
  leaf('零件与连接件')
])
const leg = (name: string): PartTemplateNode => group(name, [
  leaf(`${name}分段1`),
  leaf(`${name}分段2`),
  leaf(`${name}分段n`),
  leaf('下横梁'),
  leaf('零件与连接件')
])

const drive = (): PartTemplateNode => group('驱动装置', [
  leaf('电机'),
  leaf('传动轴'),
  leaf('联轴器'),
  leaf('减速器'),
  leaf('制动器')
])
const rope = (): PartTemplateNode => group('钢丝绳卷绕系统', [
  leaf('钢丝绳'),
  leaf('钢丝绳楔套'),
  leaf('滑轮组'),
  leaf('卷筒')
])
const hook = (): PartTemplateNode => leaf('吊钩组')
const hoist = (name: string, pick: PartTemplateNode[]): PartTemplateNode => group(name, [
  drive(),
  rope(),
  group('取物装置', pick)
])
const bogie = (): PartTemplateNode => group('台车架系统', [
  leaf('台车架结构'),
  leaf('轴承箱'),
  leaf('车轮组')
])
const travel = (name: string): PartTemplateNode => group(name, [drive(), bogie()])
const beams = (): PartTemplateNode => group('大车平衡梁', [
  withParts('一级平衡梁'),
  withParts('二级平衡梁'),
  withParts('三级平衡梁')
])
const electric = (): PartTemplateNode[] => [
  group('供电系统', [leaf('电源滑触线与防护'), leaf('集电器'), leaf('电缆卷筒')]),
  group('控制元件', [leaf('隔离开关'), leaf('断路器'), leaf('接触器'), leaf('电阻器'), leaf('控制器'), leaf('控制屏'), leaf('控制线路')])
]
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
          group('桥架', [girder(), withParts('端梁')]),
          group('起升小车', [withParts('主起升小车架'), withParts('副起升小车架')]),
          withParts('大车平衡梁')
        ]
      },
      {
        id: 'hoist',
        nodes: [
          hoist('主起升机构', [hook(), leaf('吊梁')]),
          hoist('副起升机构', [hook(), leaf('吊梁')])
        ]
      },
      { id: 'travel', nodes: [travel('小车运行机构'), travel('大车运行机构')] },
      { id: 'electric', nodes: electric() },
      { id: 'protection', nodes: [...SAFE4, '联锁保护装置', '运行机构防碰撞装置', '超速保护装置'].map(leaf) }
    ]
  },
  {
    id: 'zc',
    label: '造船门式',
    specs: [
      {
        id: 'metal',
        nodes: [
          group('桥架', [girder(), withParts('端梁')]),
          group('支腿', [leg('刚性腿'), leg('柔性腿')]),
          group('起升小车', [withParts('上小车架'), withParts('下小车架')]),
          beams()
        ]
      },
      {
        id: 'hoist',
        nodes: [
          hoist('上小车起升机构', [hook(), leaf('吊梁')]),
          hoist('下小车起升机构', [hook(), leaf('吊梁')])
        ]
      },
      { id: 'travel', nodes: [travel('上小车运行机构'), travel('下小车运行机构'), travel('大车运行机构')] },
      { id: 'electric', nodes: electric() },
      { id: 'protection', nodes: SAFE_PORT.map(leaf) }
    ]
  },
  {
    id: 'aq',
    label: '岸边集装箱',
    specs: [
      {
        id: 'metal',
        nodes: [
          group('主梁', [withParts('前大梁'), withParts('后大梁'), withParts('平面撑杆')]),
          group('拉杆系统', [withParts('前拉杆'), withParts('之间拉杆'), withParts('后拉杆')]),
          group('门架', [
            withParts('梯形架与拉杆'),
            withParts('门架上横梁'),
            withParts('门架立柱'),
            withParts('门架撑杆'),
            withParts('门架下横梁')
          ]),
          withParts('起升小车架'),
          beams()
        ]
      },
      { id: 'hoist', nodes: [hoist('小车起升机构', [leaf('抓斗'), leaf('吊梁')])] },
      { id: 'travel', nodes: [travel('小车运行机构'), travel('大车运行机构')] },
      { id: 'electric', nodes: electric() },
      { id: 'protection', nodes: SAFE_PORT.map(leaf) }
    ]
  },
  {
    id: 'mz',
    label: '门座',
    specs: [
      {
        id: 'metal',
        nodes: [
          group('臂架系统', [withParts('臂架结构'), withParts('拉杆结构'), withParts('象鼻架结构')]),
          group('人字架结构', [withParts('前撑杆结构'), withParts('后拉杆结构')]),
          withParts('转柱结构'),
          withParts('对中平衡重结构'),
          withParts('转台结构'),
          group('门座结构', [withParts('筒体结构'), withParts('门架结构')]),
          beams()
        ]
      },
      {
        id: 'hoist',
        nodes: [
          hoist('主起升机构', [leaf('吸盘'), hook(), leaf('抓斗'), leaf('吊梁')]),
          hoist('副起升机构', [leaf('吸盘'), hook(), leaf('抓斗'), leaf('吊梁')])
        ]
      },
      {
        id: 'travel',
        nodes: [
          group('变幅机构（柔性）', [drive(), rope(), withParts('防后倾装置')]),
          group('回转机构', [drive(), group('回转装置', [leaf('回转小齿轮'), leaf('回转支承')])]),
          travel('行走机构')
        ]
      },
      { id: 'electric', nodes: electric() },
      {
        id: 'protection',
        nodes: [...SAFE4, '幅度限位器', '联锁保护装置', '抗风防滑装置', '风速仪装置', '回转限制器', '运行机构防碰撞装置', '超速保护装置', '供电电缆卷筒安全限位'].map(leaf)
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
