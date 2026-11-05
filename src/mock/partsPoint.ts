import { buildPartGraph } from '@/mock/partGraph'
import type { OverviewCard } from '@/mock/overviewDemo'
export type PointStatus = 'alarm' | 'warn' | 'ok' | 'off' | 'twin'
export interface PartNode { name: string; status: PointStatus }
export interface PartGroup { name: string; nodes: PartNode[] }
export interface PartColumn { name: string; groups: PartGroup[] }
export interface Point { id: string; name: string; status: PointStatus; value: string; unit: string; twin: { x: number; y: number }; group?: string }
export interface SmartService { name: string; hot: boolean; conclusion: string }
interface StructureData { specialty: string; points: Point[]; services: SmartService[]; highlight: string }
export const statusLabels: Record<PointStatus, string> = { alarm: '报警', warn: '异常', ok: '正常', off: '未接入', twin: '孪生' }
const columns: PartColumn[] = [
  {
    "name": "金属结构",
    "groups": [
      {
        "name": "桥架",
        "nodes": [
          {
            "name": "单双主梁",
            "status": "alarm"
          },
          {
            "name": "端梁",
            "status": "ok"
          },
          {
            "name": "走台栏杆",
            "status": "ok"
          },
          {
            "name": "主梁分段/连接",
            "status": "warn"
          },
          {
            "name": "副起升结构",
            "status": "off"
          }
        ]
      },
      {
        "name": "小车架",
        "nodes": [
          {
            "name": "主小车架",
            "status": "ok"
          },
          {
            "name": "副小车架",
            "status": "ok"
          },
          {
            "name": "小车轨道",
            "status": "warn"
          },
          {
            "name": "缓冲器座",
            "status": "ok"
          }
        ]
      }
    ]
  },
  {
    "name": "起升机构",
    "groups": [
      {
        "name": "主起升",
        "nodes": [
          {
            "name": "主起升电机",
            "status": "ok"
          },
          {
            "name": "主起升减速器",
            "status": "warn"
          },
          {
            "name": "主起升制动器",
            "status": "ok"
          }
        ]
      },
      {
        "name": "副起升",
        "nodes": [
          {
            "name": "副起升电机",
            "status": "ok"
          },
          {
            "name": "副起升制动器",
            "status": "ok"
          }
        ]
      },
      {
        "name": "卷筒钢丝绳滑轮",
        "nodes": [
          {
            "name": "卷筒",
            "status": "ok"
          },
          {
            "name": "钢丝绳",
            "status": "warn"
          },
          {
            "name": "滑轮组",
            "status": "ok"
          }
        ]
      },
      {
        "name": "吊具",
        "nodes": [
          {
            "name": "吊钩组",
            "status": "ok"
          },
          {
            "name": "电磁吸盘",
            "status": "off"
          }
        ]
      }
    ]
  },
  {
    "name": "运行机构",
    "groups": [
      {
        "name": "大车运行",
        "nodes": [
          {
            "name": "大车电机",
            "status": "ok"
          },
          {
            "name": "大车减速器",
            "status": "ok"
          },
          {
            "name": "车轮组",
            "status": "ok"
          },
          {
            "name": "大车制动器",
            "status": "ok"
          }
        ]
      },
      {
        "name": "小车运行",
        "nodes": [
          {
            "name": "小车电机",
            "status": "ok"
          },
          {
            "name": "小车车轮",
            "status": "ok"
          },
          {
            "name": "小车缓冲",
            "status": "ok"
          }
        ]
      }
    ]
  },
  {
    "name": "电气系统",
    "groups": [
      {
        "name": "供电系统",
        "nodes": [
          {
            "name": "滑触线",
            "status": "ok"
          },
          {
            "name": "电缆卷筒",
            "status": "ok"
          }
        ]
      },
      {
        "name": "控制系统",
        "nodes": [
          {
            "name": "PLC柜",
            "status": "ok"
          },
          {
            "name": "变频柜",
            "status": "ok"
          },
          {
            "name": "操作台",
            "status": "ok"
          }
        ]
      },
      {
        "name": "照明与信号",
        "nodes": [
          {
            "name": "大车照明",
            "status": "ok"
          },
          {
            "name": "无线通讯",
            "status": "off"
          }
        ]
      }
    ]
  },
  {
    "name": "安全防护装置",
    "groups": [
      {
        "name": "限位保护",
        "nodes": [
          {
            "name": "起升限位",
            "status": "ok"
          },
          {
            "name": "大车限位",
            "status": "warn"
          },
          {
            "name": "小车限位",
            "status": "ok"
          }
        ]
      },
      {
        "name": "超载保护",
        "nodes": [
          {
            "name": "超载限制器",
            "status": "ok"
          }
        ]
      },
      {
        "name": "防碰撞",
        "nodes": [
          {
            "name": "激光防撞",
            "status": "off"
          },
          {
            "name": "声光报警",
            "status": "ok"
          }
        ]
      }
    ]
  }
]
const structures: Record<string, StructureData> = {
  "单双主梁": {
    "specialty": "金属结构",
    "points": [
      {
        "id": "ML-01",
        "name": "跨中上翼缘应变",
        "status": "alarm",
        "value": "312 µε",
        "unit": "应变",
        "twin": {
          "x": 318,
          "y": 118
        }
      },
      {
        "id": "ML-02",
        "name": "跨中下翼缘应变",
        "status": "alarm",
        "value": "298 µε",
        "unit": "应变",
        "twin": {
          "x": 318,
          "y": 168
        }
      },
      {
        "id": "ML-03",
        "name": "1/4跨应变",
        "status": "warn",
        "value": "186 µε",
        "unit": "应变",
        "twin": {
          "x": 220,
          "y": 140
        }
      },
      {
        "id": "ML-04",
        "name": "端头焊缝应变",
        "status": "ok",
        "value": "72 µε",
        "unit": "应变",
        "twin": {
          "x": 110,
          "y": 142
        }
      },
      {
        "id": "ML-05",
        "name": "腹板中部应变",
        "status": "ok",
        "value": "95 µε",
        "unit": "应变",
        "twin": {
          "x": 400,
          "y": 145
        }
      },
      {
        "id": "ML-06",
        "name": "跨中挠度",
        "status": "ok",
        "value": "12.4 mm",
        "unit": "挠度",
        "twin": {
          "x": 318,
          "y": 200
        }
      },
      {
        "id": "ML-07",
        "name": "主梁倾角",
        "status": "twin",
        "value": "0.18°",
        "unit": "孪生",
        "twin": {
          "x": 480,
          "y": 130
        }
      },
      {
        "id": "ML-08",
        "name": "温度补偿",
        "status": "ok",
        "value": "38.2 ℃",
        "unit": "温度",
        "twin": {
          "x": 250,
          "y": 110
        }
      },
      {
        "id": "ML-09",
        "name": "振动测点",
        "status": "ok",
        "value": "1.2 mm/s",
        "unit": "振动",
        "twin": {
          "x": 360,
          "y": 190
        }
      }
    ],
    "services": [
      {
        "name": "健康监测",
        "hot": true,
        "conclusion": "主梁跨中应变持续超限（ML-01/ML-02），健康指数 62，建议限载并复核焊缝。"
      },
      {
        "name": "裂纹预测",
        "hot": true,
        "conclusion": "跨中下翼缘疲劳裂纹萌生概率升高（示意），预测关注区与 ML-02 重合。"
      },
      {
        "name": "远程监测",
        "hot": false,
        "conclusion": "遥测通道正常，采样 1 Hz。"
      },
      {
        "name": "安全评估",
        "hot": false,
        "conclusion": "整机风险等级维持「关注」，未触发停机阈值。"
      },
      {
        "name": "故障诊断",
        "hot": false,
        "conclusion": "暂无机构类故障码关联到本结构。"
      }
    ],
    "highlight": "girder"
  },
  "端梁": {
    "specialty": "金属结构",
    "points": [
      {
        "id": "EB-01",
        "name": "端梁腹板应变",
        "status": "ok",
        "value": "68 µε",
        "unit": "应变",
        "twin": {
          "x": 84,
          "y": 150
        }
      },
      {
        "id": "EB-02",
        "name": "端梁上盖板",
        "status": "ok",
        "value": "55 µε",
        "unit": "应变",
        "twin": {
          "x": 84,
          "y": 128
        }
      },
      {
        "id": "EB-03",
        "name": "角部焊缝",
        "status": "ok",
        "value": "41 µε",
        "unit": "应变",
        "twin": {
          "x": 556,
          "y": 150
        }
      },
      {
        "id": "EB-04",
        "name": "端梁倾角",
        "status": "twin",
        "value": "0.05°",
        "unit": "孪生",
        "twin": {
          "x": 556,
          "y": 175
        }
      }
    ],
    "services": [
      {
        "name": "健康监测",
        "hot": false,
        "conclusion": "端梁健康指数 92。"
      },
      {
        "name": "远程监测",
        "hot": false,
        "conclusion": "通道正常。"
      },
      {
        "name": "安全评估",
        "hot": false,
        "conclusion": "正常。"
      },
      {
        "name": "裂纹预测",
        "hot": false,
        "conclusion": "未见异常。"
      },
      {
        "name": "故障诊断",
        "hot": false,
        "conclusion": "无故障。"
      }
    ],
    "highlight": "endbeam"
  },
  "走台栏杆": {
    "specialty": "金属结构",
    "points": [
      {
        "id": "WK-01",
        "name": "走台振动",
        "status": "ok",
        "value": "0.6 mm/s",
        "unit": "振动",
        "twin": {
          "x": 200,
          "y": 108
        }
      },
      {
        "id": "WK-02",
        "name": "栏杆完整性",
        "status": "ok",
        "value": "正常",
        "unit": "状态",
        "twin": {
          "x": 450,
          "y": 108
        }
      }
    ],
    "services": [
      {
        "name": "远程监测",
        "hot": false,
        "conclusion": "正常。"
      },
      {
        "name": "健康监测",
        "hot": false,
        "conclusion": "正常。"
      },
      {
        "name": "安全评估",
        "hot": false,
        "conclusion": "正常。"
      },
      {
        "name": "裂纹预测",
        "hot": false,
        "conclusion": "不适用。"
      },
      {
        "name": "故障诊断",
        "hot": false,
        "conclusion": "无。"
      }
    ],
    "highlight": "walkway"
  },
  "主梁分段/连接": {
    "specialty": "金属结构",
    "points": [
      {
        "id": "JC-01",
        "name": "连接板应变-左",
        "status": "warn",
        "value": "164 µε",
        "unit": "应变",
        "twin": {
          "x": 280,
          "y": 140
        }
      },
      {
        "id": "JC-02",
        "name": "连接板应变-右",
        "status": "ok",
        "value": "88 µε",
        "unit": "应变",
        "twin": {
          "x": 360,
          "y": 140
        }
      },
      {
        "id": "JC-03",
        "name": "螺栓预紧力",
        "status": "ok",
        "value": "210 kN",
        "unit": "力",
        "twin": {
          "x": 320,
          "y": 160
        }
      },
      {
        "id": "JC-04",
        "name": "对接焊缝 UT",
        "status": "ok",
        "value": "合格",
        "unit": "探伤",
        "twin": {
          "x": 320,
          "y": 120
        }
      },
      {
        "id": "JC-05",
        "name": "错边量",
        "status": "ok",
        "value": "0.6 mm",
        "unit": "几何",
        "twin": {
          "x": 300,
          "y": 180
        }
      },
      {
        "id": "JC-06",
        "name": "连接区温度",
        "status": "twin",
        "value": "41 ℃",
        "unit": "孪生",
        "twin": {
          "x": 340,
          "y": 110
        }
      }
    ],
    "services": [
      {
        "name": "健康监测",
        "hot": false,
        "conclusion": "连接区整体正常。"
      },
      {
        "name": "裂纹预测",
        "hot": false,
        "conclusion": "未见裂纹扩展征兆。"
      },
      {
        "name": "远程监测",
        "hot": false,
        "conclusion": "通道正常。"
      },
      {
        "name": "安全评估",
        "hot": true,
        "conclusion": "JC-01 异常抬升，评估为「关注」，已推送本结构。"
      },
      {
        "name": "故障诊断",
        "hot": false,
        "conclusion": "无关联故障工单。"
      }
    ],
    "highlight": "joint"
  },
  "主起升减速器": {
    "specialty": "起升机构",
    "points": [
      {
        "id": "GR-01",
        "name": "高速轴振动",
        "status": "warn",
        "value": "4.8 mm/s",
        "unit": "振动",
        "twin": {
          "x": 320,
          "y": 100
        }
      },
      {
        "id": "GR-02",
        "name": "低速轴振动",
        "status": "ok",
        "value": "2.1 mm/s",
        "unit": "振动",
        "twin": {
          "x": 320,
          "y": 160
        }
      },
      {
        "id": "GR-03",
        "name": "油温",
        "status": "ok",
        "value": "58 ℃",
        "unit": "温度",
        "twin": {
          "x": 280,
          "y": 130
        }
      },
      {
        "id": "GR-04",
        "name": "油位",
        "status": "ok",
        "value": "正常",
        "unit": "状态",
        "twin": {
          "x": 360,
          "y": 130
        }
      },
      {
        "id": "GR-05",
        "name": "壳体温度",
        "status": "ok",
        "value": "52 ℃",
        "unit": "温度",
        "twin": {
          "x": 300,
          "y": 180
        }
      },
      {
        "id": "GR-06",
        "name": "噪声示意",
        "status": "twin",
        "value": "78 dB",
        "unit": "孪生",
        "twin": {
          "x": 380,
          "y": 150
        }
      }
    ],
    "services": [
      {
        "name": "故障诊断",
        "hot": true,
        "conclusion": "高速轴振动偏高，疑似轴承磨损早期，建议频谱复核。"
      },
      {
        "name": "健康监测",
        "hot": false,
        "conclusion": "减速器健康指数 78。"
      },
      {
        "name": "远程监测",
        "hot": false,
        "conclusion": "通道正常。"
      },
      {
        "name": "安全评估",
        "hot": false,
        "conclusion": "未触发安全停机。"
      },
      {
        "name": "裂纹预测",
        "hot": false,
        "conclusion": "结构件不适用本结论。"
      }
    ],
    "highlight": "hoist"
  }
}
export function worstStatus(nodes: PartNode[]): PointStatus {
  return nodes.some(n => n.status === 'alarm') ? 'alarm' : nodes.some(n => n.status === 'warn') ? 'warn' : nodes.some(n => n.status !== 'off') ? 'ok' : 'off'
}
export function partsForDevice(card: OverviewCard): PartColumn[] {
  // Preserve the existing equipment-specific breakdown outside the approved bridge-crane demo.
  if (!/桥式/.test(card.type || '')) {
    const statusMap = { red: 'alarm', yellow: 'warn', green: 'ok', off: 'off' } as const
    return buildPartGraph(card).map(spec => ({ name: spec.label, groups: spec.nodes.map(group => ({
      name: group.name, nodes: (group.children?.length ? group.children : [group]).map(node => ({ name: node.name, status: statusMap[node.status] }))
    })) }))
  }
  return columns.map(col => ({ ...col, groups: col.groups.map(group => ({ ...group, nodes: group.nodes.map(node => ({ ...node,
    status: card.lamp === 'off' ? 'off' : node.status === 'off' ? 'off' : card.lamp === 'normal' ? 'ok' : card.lamp === 'yellow' && node.status === 'alarm' ? 'warn' : node.status
  })) })) }))
}
export function structureData(node: PartNode, specialty: string): StructureData {
  const source = structures[node.name]
  const status = node.status
  const seed = [...node.name].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 0)
  const points: Point[] = source ? source.points.map(p => ({ ...p, status: status === 'ok' ? (p.status === 'twin' ? 'twin' : 'ok') : status === 'off' ? 'off' : status === 'warn' && p.status === 'alarm' ? 'warn' : p.status,
    value: status === 'off' ? '—' : status === 'ok' && (p.status === 'alarm' || p.status === 'warn') ? '95 µε' : p.value })) : [1, 2, 3].map((i) => ({
      id: `PT-${String(seed % 1000).padStart(3, '0')}-${i}`, name: `${node.name}${['运行状态', '温度', '振动'][i - 1]}`, status: i === 1 ? status : 'ok',
      value: status === 'off' ? '—' : i === 1 ? statusLabels[status] : i === 2 ? '38.2 ℃' : '1.2 mm/s', unit: '示意', twin: { x: 180 + i * 70, y: 120 + i * 18 }
    }))
  const services = (source?.services || ['远程监测', '健康监测', '安全评估', '裂纹预测', '故障诊断'].map((name, i) => ({ name, hot: i === 1 && (status === 'alarm' || status === 'warn'), conclusion: i === 1 && (status === 'alarm' || status === 'warn') ? `${node.name}监测指标超限，建议复核测点并安排检查（示意）。` : `${node.name}监测数据正常。` }))).map(s => ({ ...s,
    hot: s.hot && (status === 'alarm' || status === 'warn'), conclusion: status === 'off' ? '该部件尚未接入监测。' : status === 'ok' ? `${node.name}监测正常，暂无报警推送。` : s.conclusion
  }))
  return { specialty, points, services, highlight: source?.highlight || (specialty === '金属结构' ? 'girder' : 'hoist') }
}
