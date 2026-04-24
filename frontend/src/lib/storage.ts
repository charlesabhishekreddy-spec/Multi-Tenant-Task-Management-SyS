import type { AuditLogRecord, LoginResponse, Task, UserRecord } from '../types'

const authKey = 'iit-task-manager-auth'
const dashboardCacheVersion = 2

export type DashboardCache = {
  version: number
  tasks: Task[]
  users: UserRecord[]
  auditLogs: AuditLogRecord[]
  updatedAt: string
}

type DashboardScope = {
  organizationId: string
  userId: string
}

function getDashboardCacheKey(scope: DashboardScope) {
  return `iit-task-manager-dashboard:${scope.organizationId}:${scope.userId}`
}

export function readAuthState(): LoginResponse | null {
  const raw = localStorage.getItem(authKey)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as LoginResponse
  } catch {
    localStorage.removeItem(authKey)
    return null
  }
}

export function writeAuthState(state: LoginResponse | null) {
  if (!state) {
    localStorage.removeItem(authKey)
    return
  }

  localStorage.setItem(authKey, JSON.stringify(state))
}

export function readDashboardCache(scope: DashboardScope): DashboardCache | null {
  const raw = localStorage.getItem(getDashboardCacheKey(scope))

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as DashboardCache
    if (
      parsed.version !== dashboardCacheVersion ||
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.users) ||
      !Array.isArray(parsed.auditLogs)
    ) {
      localStorage.removeItem(getDashboardCacheKey(scope))
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(getDashboardCacheKey(scope))
    return null
  }
}

export function writeDashboardCache(scope: DashboardScope, cache: Omit<DashboardCache, 'version' | 'updatedAt'>): DashboardCache {
  const payload: DashboardCache = {
    version: dashboardCacheVersion,
    ...cache,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(getDashboardCacheKey(scope), JSON.stringify(payload))
  return payload
}