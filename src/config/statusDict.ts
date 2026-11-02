/**
 * 严重度和运行状态用词。
 * 红 = 报警，黄 = 异常，绿 = 正常。
 * 运行状态只用蓝/灰：运行中、待机、停机、离线。不展示维修中/维保中。
 */
export type SeverityCode = 'red' | 'yellow' | 'green'

export const SEVERITY_DICT: Record<SeverityCode, { label: string; color: string; bg: string }> = {
  red: { label: '报警', color: '#f5222d', bg: '#fff1f0' },
  yellow: { label: '异常', color: '#ad6800', bg: '#fff7e6' },
  green: { label: '正常', color: '#237804', bg: '#f0fae8' }
}

export const RUN_DICT = {
  running: { label: '运行中', color: '#1677ff', bg: '#e6f4ff' },
  standby: { label: '待机', color: '#64748b', bg: '#f1f5f9' },
  stopped: { label: '停机', color: '#64748b', bg: '#f1f5f9' },
  offline: { label: '离线', color: '#64748b', bg: '#f8fafc' }
} as const

export type RunCode = keyof typeof RUN_DICT

export function severityFromLevel(level: string): SeverityCode {
  if (level === 'red' || level === 'danger') return 'red'
  if (level === 'yellow' || level === 'warn' || level === 'warning') return 'yellow'
  return 'green'
}

export function severityLabel(level: string): string {
  return SEVERITY_DICT[severityFromLevel(level)].label
}

/** 台账里的 maintenance 没有数据来源，展示时并入待机。 */
export function normalizeRunStatus(status: string | null | undefined): RunCode {
  if (status === 'running') return 'running'
  if (status === 'stopped') return 'stopped'
  if (status === 'offline' || status === 'off') return 'offline'
  return 'standby'
}

export function runStatusLabel(status: string | null | undefined): string {
  return RUN_DICT[normalizeRunStatus(status)].label
}
