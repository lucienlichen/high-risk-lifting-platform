/**
 * 设备卡片判定阈值（暂行）。
 * 以后调规则只改这个文件里的数字，不改页面。
 */
export const OVERVIEW_CARD_RULES = {
  /** 定期检验剩余天数 ≤ 此值（含已超期）时，「检验提醒」记 1。 */
  inspectionRemindWithinDays: 30,
  /** 剩余天数小于此值视为已超期。0 表示 daysUntil < 0。 */
  inspectionOverdueBelowDays: 0,
  /** 已超期的定期检验是否把整机记为异常。 */
  overdueCountsAsAbnormal: true,
  /** 起升重量负载条达到该百分比时变黄。 */
  loadHotPercent: 90,
  /** 起升重量负载条超过该百分比时变红。 */
  loadOverPercent: 100,
  /** 累计吊重的演示日均下限（次/天）。实际日均 = min + hash % span。 */
  liftDailyMin: 8,
  /** 演示日均的散列跨度，使日均落在约 8.0–12.0，与当日吊重作业次数同一量级。 */
  liftDailySpan: 4.1
} as const

/** 挂不到结构树顶层分组时的兜底。风险定量评估算在「其他」。 */
export const ALARM_FALLBACK = {
  otherServices: ['risk', 'safety'] as const,
  structureWords: /主梁|端梁|支腿|焊缝|翼缘|腹板|小车架|连接板|节点/,
  mechanismWords: /减速机|制动器|车轮|啃轨|钢丝绳|电机/,
  structureServices: ['healthMonitor', 'health', 'crack'] as const,
  mechanismServices: ['fault'] as const
}
