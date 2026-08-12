import { create } from 'zustand'

export type FormPanel = 'none' | 'create' | 'edit'

type ContactsUiState = {
  selectedId: string
  panel: FormPanel
  search: string
  setSelectedId: (id: string) => void
  setPanel: (panel: FormPanel) => void
  setSearch: (search: string) => void
}

export const useContactsUiStore = create<ContactsUiState>()((set) => ({
  selectedId: '',
  panel: 'none',
  search: '',
  setSelectedId: (selectedId) => set({ selectedId }),
  setPanel: (panel) => set({ panel }),
  setSearch: (search) => set({ search }),
}))
