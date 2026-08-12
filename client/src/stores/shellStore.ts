import { create } from 'zustand'

export type ProductView = 'mail' | 'calendar' | 'contacts' | 'settings'

type ShellState = {
  productView: ProductView
  sidebarCollapsed: boolean
  /** Set when a workspace request 401s, so the login screen can explain why. */
  sessionExpired: boolean
  shortcutsHelpOpen: boolean
  setProductView: (view: ProductView) => void
  toggleSidebarCollapsed: () => void
  setSessionExpired: (expired: boolean) => void
  setShortcutsHelpOpen: (open: boolean) => void
}

export const useShellStore = create<ShellState>()((set) => ({
  productView: 'mail',
  sidebarCollapsed: false,
  sessionExpired: false,
  shortcutsHelpOpen: false,
  setProductView: (productView) => set({ productView }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),
  setShortcutsHelpOpen: (shortcutsHelpOpen) => set({ shortcutsHelpOpen }),
}))
