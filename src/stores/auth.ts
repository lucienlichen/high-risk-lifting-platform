import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { BENGANG, SHAGANG, YONGGANG } from '@/mock/overviewDemo'

const STORAGE_KEY = 'hrlp-auth'

export type UserRole = 'superAdmin' | 'groupAdmin' | 'factoryAdmin'

export interface DemoAccount {
  username: string
  label: string
  scopeLabel: string
  role: UserRole
  enterprise: string | null
  unit: string | null
}

/** 演示账号。未知账号仍按超级管理员进入，和原来的「任意非空账号可登录」一致。 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: 'group_admin', label: '超级管理员', scopeLabel: '全部', role: 'superAdmin', enterprise: null, unit: null },
  { username: 'admin', label: '超级管理员', scopeLabel: '全部', role: 'superAdmin', enterprise: null, unit: null },
  { username: 'company_admin', label: '集团管理员', scopeLabel: '本钢板材', role: 'groupAdmin', enterprise: BENGANG, unit: null },
  { username: 'yonggang_admin', label: '集团管理员', scopeLabel: '永钢', role: 'groupAdmin', enterprise: YONGGANG, unit: null },
  { username: 'shagang_admin', label: '集团管理员', scopeLabel: '沙钢', role: 'groupAdmin', enterprise: SHAGANG, unit: null },
  { username: 'factory_admin', label: '分厂管理员', scopeLabel: '本钢 · 炼铁厂', role: 'factoryAdmin', enterprise: BENGANG, unit: '炼铁厂' },
  { username: 'yonggang_factory', label: '分厂管理员', scopeLabel: '永钢 · 炼钢三厂', role: 'factoryAdmin', enterprise: YONGGANG, unit: '炼钢三厂' },
  { username: 'shagang_factory', label: '分厂管理员', scopeLabel: '沙钢 · 钢板总厂', role: 'factoryAdmin', enterprise: SHAGANG, unit: '钢板总厂' }
]

export interface OverviewAccess {
  kind: 'super' | 'group' | 'factory'
  enterprise: string | null
  unit: string | null
}

interface PersistedAuth {
  username: string
  role: UserRole
  enterprise: string | null
  unit: string | null
}

export function accountForUsername(name: string): DemoAccount {
  const found = DEMO_ACCOUNTS.find(item => item.username === name)
  if (found) return found
  if (name === '超级管理员') return DEMO_ACCOUNTS[0]
  if (name === '集团管理员' || name === '公司管理员') return DEMO_ACCOUNTS[2]
  if (name === '分厂管理员' || name === '厂区管理员') return DEMO_ACCOUNTS[5]
  return { username: name, label: '超级管理员', scopeLabel: '全部', role: 'superAdmin', enterprise: null, unit: null }
}

function readPersisted(): PersistedAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedAuth>
    if (!parsed.username || typeof parsed.username !== 'string') return null
    const known = DEMO_ACCOUNTS.find(item => item.username === parsed.username)
    if (known) {
      const next: PersistedAuth = {
        username: known.username,
        role: known.role,
        enterprise: known.enterprise,
        unit: known.unit
      }
      const stale = parsed.role !== next.role || parsed.enterprise !== next.enterprise || parsed.unit !== next.unit
      if (stale) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    }
    if (!parsed.role || !('enterprise' in parsed)) {
      const account = accountForUsername(parsed.username)
      return { username: parsed.username, role: account.role, enterprise: account.enterprise, unit: account.unit }
    }
    return {
      username: parsed.username,
      role: parsed.role,
      enterprise: parsed.enterprise ?? null,
      unit: parsed.unit ?? null
    }
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const persisted = readPersisted()
  const username = ref(persisted?.username ?? '')
  const role = ref<UserRole>(persisted?.role ?? 'superAdmin')
  const enterprise = ref<string | null>(persisted?.enterprise ?? null)
  const unit = ref<string | null>(persisted?.unit ?? null)
  const isLoggedIn = ref(!!persisted)
  const devOverride = ref<OverviewAccess | null>(null)

  function persist() {
    const payload: PersistedAuth = {
      username: username.value,
      role: role.value,
      enterprise: enterprise.value,
      unit: unit.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  function resolveRole(name: string): UserRole {
    return accountForUsername(name).role
  }

  function login(name: string) {
    const account = accountForUsername(name)
    username.value = name
    role.value = account.role
    enterprise.value = account.enterprise
    unit.value = account.unit
    isLoggedIn.value = true
    devOverride.value = null
    persist()
  }

  function logout() {
    username.value = ''
    role.value = 'superAdmin'
    enterprise.value = null
    unit.value = null
    isLoggedIn.value = false
    devOverride.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { username, role, enterprise, unit, isLoggedIn, devOverride, resolveRole, login, logout }
})

export function overviewAccessOf(auth: {
  role: UserRole
  enterprise: string | null
  unit: string | null
  devOverride: OverviewAccess | null
}): OverviewAccess {
  if (import.meta.env.DEV && auth.devOverride) return auth.devOverride
  if (auth.role === 'factoryAdmin') return { kind: 'factory', enterprise: auth.enterprise, unit: auth.unit }
  if (auth.role === 'groupAdmin') return { kind: 'group', enterprise: auth.enterprise, unit: null }
  return { kind: 'super', enterprise: null, unit: null }
}

export function landingLocation(): RouteLocationRaw {
  const auth = useAuthStore()
  const access = overviewAccessOf(auth)
  if (access.kind === 'super') return { path: '/services' }
  return {
    name: 'overviewPlant',
    query: {
      enterprise: access.enterprise || '',
      ...(access.unit ? { unit: access.unit } : {})
    }
  }
}
