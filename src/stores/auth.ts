import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'hrlp-auth'

export type UserRole = 'superAdmin' | 'groupAdmin' | 'factoryAdmin'

interface PersistedAuth {
  username: string
  role: UserRole
}

function readPersisted(): PersistedAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedAuth) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const persisted = readPersisted()
  const username   = ref<string>(persisted?.username ?? '')
  const role       = ref<UserRole>(persisted?.role ?? 'superAdmin')
  const isLoggedIn = ref<boolean>(!!persisted)

  function resolveRole(name: string): UserRole {
    if (name === 'factory_admin' || name === '分厂管理员') return 'factoryAdmin'
    if (name === 'company_admin' || name === '集团管理员') return 'groupAdmin'
    return 'superAdmin'
  }

  function login(name: string) {
    const nextRole = resolveRole(name)
    username.value   = name
    role.value       = nextRole
    isLoggedIn.value = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: name, role: nextRole }))
  }

  function logout() {
    username.value   = ''
    role.value       = 'superAdmin'
    isLoggedIn.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  return { username, role, isLoggedIn, resolveRole, login, logout }
})
