import { create } from 'zustand'

type ContactsUiState = {
  selectedId: string
  createOpen: boolean
  setSelectedId: (id: string) => void
  setCreateOpen: (open: boolean) => void
}

export const useContactsUiStore = create<ContactsUiState>()((set) => ({
  selectedId: 'avery',
  createOpen: false,
  setSelectedId: (selectedId) => set({ selectedId }),
  setCreateOpen: (createOpen) => set({ createOpen }),
}))
