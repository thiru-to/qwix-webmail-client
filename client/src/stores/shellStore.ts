import { create } from 'zustand'

export type ProductView = 'mail' | 'calendar' | 'contacts'

type ShellState = {
  productView: ProductView
  lightMode: boolean
  sidebarCollapsed: boolean
  setProductView: (view: ProductView) => void
  toggleLightMode: () => void
  toggleSidebarCollapsed: () => void
}

export const useShellStore = create<ShellState>()((set) => ({
  productView: 'mail',
  lightMode: false,
  sidebarCollapsed: false,
  setProductView: (productView) => set({ productView }),
  toggleLightMode: () => set((state) => ({ lightMode: !state.lightMode })),
  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
