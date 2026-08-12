import { create } from 'zustand'

type ContactsUiState = {
  selectedId: string
  createOpen: boolean
  search: string
  setSelectedId: (id: string) => void
  setCreateOpen: (open: boolean) => void
  setSearch: (search: string) => void
}

export const useContactsUiStore = create<ContactsUiState>()((set) => ({
  selectedId: 'avery',
  createOpen: false,
  search: '',
  setSelectedId: (selectedId) => set({ selectedId }),
  setCreateOpen: (createOpen) => set({ createOpen }),
  setSearch: (search) => set({ search }),
}))
