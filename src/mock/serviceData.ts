/*
 * 数据智能服务 · 共享 mock 数据层
 * ─────────────────────────────────────────────
 * 纯前端演示：全部数据按设备 ID / 索引种子确定性生成，无后端、无网络调用。
 * hash 算法与日期工具移植自参考项目 Intelligent_data_agent_LE，保证同一输入渲染一致。
 *
 * 各服务的类型与生成函数按需追加到本文件（点巡检 / 维修 / 检验 / 基础数据 / 供给）。
 */

// ───────────────────────── 确定性工具 ─────────────────────────

/** 32 位整数散列（xorshift 变体），同输入恒定输出 */
export function hash(n: number): number {
  let x = n >>> 0
  x = Math.imul(x ^ (x >>> 16), 2246822507)
  x = Math.imul(x ^ (x >>> 13), 3266489909)
  x ^= x >>> 16
  return x >>> 0
}

/** 由字符串 ID + 盐值派生种子 */
export function seedOf(id: string, salt: number): number {
  return (id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 5381) + salt) >>> 0
}

/** 数字左补零 */
export function pad(n: number, w = 2): string {
  return String(n).padStart(w, '0')
}

/** Date → YYYY-MM-DD */
export function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 今天往前 days 天的日期字符串 */
export function dateMinusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return fmtDate(d)
}

/** 基准日期（Date 或 YYYY-MM-DD 字符串）加 n 天 */
export function addDays(base: Date | string, n: number): string {
  const d = typeof base === 'string'
    ? (() => { const [y, m, day] = base.split('-').map(Number); return new Date(y, m - 1, day) })()
    : new Date(base)
  d.setDate(d.getDate() + n)
  return fmtDate(d)
}

// ───────────────────────── 部件划分常量 ─────────────────────────

export interface PartCategory {
  key: string
  name: string
}

/** 起重设备部件结构划分（7 类），与参考 partStructure 对齐 */
export const PART_CATEGORIES: PartCategory[] = [
  { key: 'structure', name: '金属结构' },
  { key: 'mechanism', name: '机构及零部件' },
  { key: 'hydraulic', name: '液压系统' },
  { key: 'electric', name: '电气及控制系统' },
  { key: 'safety', name: '安全防护装置' },
  { key: 'rigging', name: '索具' },
  { key: 'other', name: '其他' },
]
