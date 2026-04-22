import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../types'

interface AuthState {
    token: string | null
    refreshToken: string | null
    user: AuthUser | null
    setAuth: (user: AuthUser) => void
    clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            user: null,
            setAuth: (user) => set({ token: user.accessToken, refreshToken: user.refreshToken, user }),
            clearAuth: () => set({ token: null, refreshToken: null, user: null }),
        }),
        { name: 'rayyon-store-auth' }
    )
)
