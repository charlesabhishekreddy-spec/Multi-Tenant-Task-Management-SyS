import type { LoginResponse } from '../types'

const authKey = 'iit-task-manager-auth'

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