import { ref, watch } from 'vue'

export type OverviewRole = 'super' | 'group' | 'factory'

const STORAGE_KEY = 'overview-demo-role'

function readRole(): OverviewRole {
  const saved = sessionStorage.getItem(STORAGE_KEY)
  if (saved === 'group' || saved === 'factory' || saved === 'super') return saved
  return 'super'
}

export const overviewRole = ref<OverviewRole>(readRole())

watch(overviewRole, role => {
  sessionStorage.setItem(STORAGE_KEY, role)
})

export const ROLE_OPTIONS: { id: OverviewRole; label: string }[] = [
  { id: 'super', label: '超管' },
  { id: 'group', label: '集团 · 本钢' },
  { id: 'factory', label: '分厂 · 炼铁厂' }
]
