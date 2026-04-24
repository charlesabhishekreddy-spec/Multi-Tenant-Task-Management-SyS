import type { AuditLogRecord, LoginResponse, Task, TokenPair, UserRecord } from '../types'

const apiBase = '/api/v1'
const requestTimeoutMs = 10000

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)

  if (!headers.has('Content-Type') && init.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `Request failed with status ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check that the backend is running.')
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function toItemsArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'items' in payload &&
    Array.isArray((payload as { items?: unknown }).items)
  ) {
    return (payload as { items: T[] }).items
  }

  return []
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
  return request<unknown>('/tasks', { method: 'GET' }, token).then((payload) => toItemsArray<Task>(payload))
}

export function createTask(
  token: string,
  payload: { title: string; description?: string; priority?: number; status?: string; assignedTo?: string },
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
  return request<unknown>('/users', { method: 'GET' }, token).then((payload) => toItemsArray<UserRecord>(payload))
}

export function createUser(
  token: string,
  payload: { name: string; email: string; password: string; role: 'ADMIN' | 'MEMBER' },
) {
  return request<UserRecord>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token)
}

export function fetchAuditLogs(token: string) {
  return request<unknown>('/audit-logs', { method: 'GET' }, token).then((payload) => toItemsArray<AuditLogRecord>(payload))
}