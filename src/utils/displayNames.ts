/**
 * 本地铜陵补丁引用了本模块，但 diff 未包含源文件。
 * 这里按原名返回，避免改动既有页面上的企业、单位和地点文案。
 */
export function displayEnterpriseName(name?: string | null): string {
  return name?.trim() || ''
}

export function displayAffiliatedUnitName(name?: string | null, _index?: number): string {
  return name?.trim() || ''
}

export function displayWorkAreaName(name?: string | null, _index?: number): string {
  return name?.trim() || ''
}

export function displayLocationName(name?: string | null): string {
  return name?.trim() || ''
}
