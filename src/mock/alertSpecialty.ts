/**
 * 详情页专业入口。划分规则在 src/config/specialtyDict.ts。
 */
import type { OverviewAlarm, OverviewServiceKey } from '@/mock/overviewStatus'
import { SPECIALTY_DICT, classifyPart, specialtyById, specialtyLabel, specialtyOfService, type SpecialtyId } from '@/config/specialtyDict'

export type Specialty = SpecialtyId

export const SPECIALTIES = SPECIALTY_DICT.map(item => ({ id: item.id, label: item.label }))

export { specialtyLabel, specialtyOfService, classifyPart }

export function alertSource(key: OverviewServiceKey): string {
  const source: Record<OverviewServiceKey, string> = {
    healthMonitor: '日常监控',
    health: '健康评估模型',
    crack: '裂纹预测模型',
    fault: '故障诊断',
    safety: '安全监控',
    risk: '风险定量评估'
  }
  return source[key]
}

export function latestAlert(alarms: OverviewAlarm[]): OverviewAlarm | null {
  if (!alarms.length) return null
  return [...alarms].sort((a, b) => b.time.localeCompare(a.time))[0]
}

export function servicesForSpecialty(id: Specialty): OverviewServiceKey[] {
  return [...specialtyById(id).services]
}

export function specialtyOfAlarm(alarm: { serviceKey: OverviewServiceKey; text: string; partName?: string; partId?: string }): Specialty | null {
  if (alarm.serviceKey === 'risk') return null
  if (alarm.partName && alarm.partName !== '未归属') return classifyPart(alarm.partName, alarm.partId || '')
  return specialtyOfService(alarm.serviceKey, alarm.text)
}
