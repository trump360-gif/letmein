import { create } from 'zustand'
import type { AdminUser } from '@letmein/types'

interface AuthStore {
  admin: AdminUser | null
  setAdmin: (admin: AdminUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  admin: null,
  setAdmin: (admin) => set({ admin }),
  clearAuth: () => set({ admin: null }),
}))
