import { create } from 'zustand'

// 'view' is a read-only dialog with edit and delete on it; contacts use the same three states.
export type FormPanel = 'none' | 'create' | 'edit' | 'view'

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
