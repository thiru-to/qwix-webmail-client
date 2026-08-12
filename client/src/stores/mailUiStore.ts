import { create } from 'zustand'

export type LayoutMode = 'split' | 'inbox'

type MailUiState = {
  selectedId: string
  activeFolder: string
  layoutMode: LayoutMode
  inboxDetailOpen: boolean
  search: string
  filterOpen: boolean
  composeOpen: boolean
  starredIds: string[]
  setSelectedId: (id: string) => void
  setActiveFolder: (folder: string) => void
  setLayoutMode: (mode: LayoutMode) => void
  setInboxDetailOpen: (open: boolean) => void
  setSearch: (search: string) => void
  toggleFilterOpen: () => void
  setFilterOpen: (open: boolean) => void
  setComposeOpen: (open: boolean) => void
  toggleStar: (id: string) => void
}

export const useMailUiStore = create<MailUiState>()((set) => ({
  selectedId: 'stripe-payout',
  activeFolder: 'Inbox',
  layoutMode: 'split',
  inboxDetailOpen: false,
  search: '',
  filterOpen: false,
  composeOpen: false,
  starredIds: ['stripe-payout'],
  setSelectedId: (selectedId) => set({ selectedId }),
  setActiveFolder: (activeFolder) => set({ activeFolder }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
  setInboxDetailOpen: (inboxDetailOpen) => set({ inboxDetailOpen }),
  setSearch: (search) => set({ search }),
  toggleFilterOpen: () => set((state) => ({ filterOpen: !state.filterOpen })),
  setFilterOpen: (filterOpen) => set({ filterOpen }),
  setComposeOpen: (composeOpen) => set({ composeOpen }),
  toggleStar: (id) =>
    set((state) => ({
      starredIds: state.starredIds.includes(id)
        ? state.starredIds.filter((value) => value !== id)
        : [...state.starredIds, id],
    })),
}))
