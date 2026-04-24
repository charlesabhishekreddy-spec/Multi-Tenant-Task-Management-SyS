import type { AuditLogRecord, LoginResponse, Task, TokenPair, UserRecord } from '../types'

const apiBase = '/api/v1'

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers)

  if (!headers.has('Content-Type') && init.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function login(payload: { organizationSlug: string; email: string; password: string }) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function refreshToken(payload: TokenPair) {
  return request<{ accessToken: string }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchTasks(token: string) {
  return request<Task[]>('/tasks', { method: 'GET' }, token)
}

export function createTask(
  token: string,
  payload: { title: string; description?: string; priority?: number; status?: string },
) {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token)
}

export function updateTask(
  token: string,
  taskId: string,
  payload: { title?: string; description?: string; status?: string; priority?: number },
) {
  return request<Task>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token)
}

export function deleteTask(token: string, taskId: string) {
  return request<void>(`/tasks/${taskId}`, {
    method: 'DELETE',
  }, token)
}

export function fetchUsers(token: string) {
  return request<UserRecord[]>('/users', { method: 'GET' }, token)
}

export function createUser(
  token: string,
  payload: { email: string; password: string; role: 'ADMIN' | 'MEMBER' },
) {
  return request<UserRecord>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token)
}

export function fetchAuditLogs(token: string) {
  return request<AuditLogRecord[]>('/audit-logs', { method: 'GET' }, token)
}