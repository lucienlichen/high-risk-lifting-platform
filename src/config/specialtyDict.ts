/**
 * 起重机专业划分（GB/T 3811 设计/检验口径）。
 * 详情页、部件树和告警归属都读这里。
 * 风险定量和定期检验不是专业，挂在设备级状态上。
 */
import type { OverviewServiceKey } from '@/mock/overviewStatus'

export type SpecialtyId = 'metal' | 'hoist' | 'travel' | 'electric' | 'protection'

export interface SpecialtyDef {
  id: SpecialtyId
  label: string
  order: number
  /** 详情证据区展示的服务。故障诊断和安全监控按部件再分到两个专业。 */
  services: OverviewServiceKey[]
  overlay: string
}

export const SPECIALTY_DICT: SpecialtyDef[] = [
  { id: 'metal', label: '金属结构', order: 1, services: ['healthMonitor', 'health', 'crack'], overlay: '应力 / 应变云图 · 裂纹位置' },
  { id: 'hoist', label: '起升系统', order: 2, services: ['fault'], overlay: '起升机构 · 振动 / 温度' },
  { id: 'travel', label: '运行机构', order: 3, services: ['fault'], overlay: '运行机构 · 振动 / 温度' },
  { id: 'electric', label: '电气控制', order: 4, services: ['safety'], overlay: '供电 / 变频 / 控制状态' },
  { id: 'protection', label: '安全保护', order: 5, services: ['safety'], overlay: '限制器 / 限位 / 防风防滑' }
]

export function specialtyById(id: SpecialtyId): SpecialtyDef {
  return SPECIALTY_DICT.find(item => item.id === id) || SPECIALTY_DICT[0]
}

export function specialtyLabel(id: SpecialtyId): string {
  return specialtyById(id).label
}

/** 按部件名称和编码归入五个专业。名称优先于编码。 */
export function classifyPart(name: string, id = ''): SpecialtyId {
  if (/司机室|主梁|端梁|小车架|支腿|平衡梁|桥架|翼缘|腹板|轨道梁/.test(name)) return 'metal'
  if (/钢丝绳|滑轮|卷筒|吊钩|吊具|夹钳|钢水包|起升/.test(name)) return 'hoist'
  if (/变幅|回转|大车|小车运行|运行机构|车轮|啃轨/.test(name)) return 'travel'
  if (/限位|防碰|防撞|防风|防滑|急停|超载|起重量限制|风速|联锁|抗风/.test(name)) return 'protection'
  if (/供电|变频|控制|电气|电控|PLC/.test(name)) return 'electric'
  if (/hoist|rope|hook|drum|pulley|lifting-device/.test(id)) return 'hoist'
  if (/travel|slew|luff|wheel/.test(id)) return 'travel'
  if (/limit|anemometer|interlock|skid|collision|overspeed|safety-protection/.test(id)) return 'protection'
  if (/electrical|power|inverter|control/.test(id)) return 'electric'
  if (id.includes('.structure') || /梁|腿|架/.test(name)) return 'metal'
  if (id.includes('.mechanism')) return 'travel'
  return 'electric'
}

export function specialtyOfService(key: OverviewServiceKey, text = ''): SpecialtyId | null {
  if (key === 'healthMonitor' || key === 'health' || key === 'crack') return 'metal'
  if (key === 'risk') return null
  if (key === 'fault') return /钢丝绳|滑轮|卷筒|吊钩|吊具|起升|制动/.test(text) && !/大车|小车运行|车轮|啃轨/.test(text) ? 'hoist' : 'travel'
  if (key === 'safety') return /限位|防碰|防风|防滑|急停|起重量|力矩|风速|联锁/.test(text) ? 'protection' : 'electric'
  return null
}
