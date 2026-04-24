import { create } from 'zustand'
import type { LoginResponse, TokenPair } from '../types'
import { login as loginRequest, refreshToken } from '../lib/api'
import { readAuthState, writeAuthState } from '../lib/storage'

type AuthState = {
  session: LoginResponse | null
  isHydrated: boolean
  isAuthenticating: boolean
  error: string | null
  hydrate: () => void
  signIn: (payload: { organizationSlug: string; email: string; password: string }) => Promise<void>
  signOut: () => void
  refresh: () => Promise<string | null>
  setSession: (session: LoginResponse | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isHydrated: false,
  isAuthenticating: false,
  error: null,
  hydrate: () => {
    set({ session: readAuthState(), isHydrated: true })
  },
  signIn: async (payload) => {
    set({ isAuthenticating: true, error: null })

    try {
      const session = await loginRequest(payload)
      writeAuthState(session)
      set({ session, isAuthenticating: false })
    } catch (error) {
      set({ isAuthenticating: false, error: error instanceof Error ? error.message : 'Login failed' })
      throw error
    }
  },
  signOut: () => {
    writeAuthState(null)
    set({ session: null, error: null })
  },
  refresh: async () => {
    const session = get().session

    if (!session) {
      return null
    }

    const refreshed = await refreshToken({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    } satisfies TokenPair)

    const nextSession = {
      ...session,
      accessToken: refreshed.accessToken,
    }

    writeAuthState(nextSession)
    set({ session: nextSession })
    return nextSession.accessToken
  },
  setSession: (session) => {
    writeAuthState(session)
    set({ session })
  },
}))