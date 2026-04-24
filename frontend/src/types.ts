export type AuthRole = 'ADMIN' | 'MEMBER'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

export type AuthUser = {
  id: string
  email: string
  role: AuthRole
  organizationId: string
  organization?: {
    id: string
    name: string
    slug: string
  }
}

export type LoginResponse = TokenPair & {
  user: AuthUser
}

export type Task = {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority?: number | null
  createdAt?: string
  updatedAt?: string
  createdBy?: {
    email?: string
  }
  assignedTo?: {
    email?: string
  } | null
}

export type UserRecord = {
  id: string
  email: string
  role: AuthRole
  createdAt?: string
}

export type AuditLogRecord = {
  id: string
  actionType: string
  createdAt?: string
  taskId?: string | null
  performedBy?: {
    email?: string
  }
}