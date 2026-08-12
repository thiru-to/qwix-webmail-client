import type { FilterConditions } from '@api/types'
import { create } from 'zustand'

export type SettingsSection =
  | 'appearance'
  | 'mail'
  | 'labels'
  | 'folders'
  | 'identities'
  | 'filters'
  | 'shortcuts'

type SettingsUiState = {
  section: SettingsSection
  /** Seeds the filter form when "filter messages like this" is used from the reader. */
  filterDraft: FilterConditions | null
  setSection: (section: SettingsSection) => void
  setFilterDraft: (draft: FilterConditions | null) => void
}

export const useSettingsUiStore = create<SettingsUiState>()((set) => ({
  section: 'appearance',
  filterDraft: null,
  setSection: (section) => set({ section }),
  setFilterDraft: (filterDraft) => set({ filterDraft }),
}))

export const SETTINGS_SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'mail', label: 'Mail' },
  { id: 'labels', label: 'Labels' },
  { id: 'folders', label: 'Folders' },
  { id: 'identities', label: 'Identities' },
  { id: 'filters', label: 'Filters' },
  { id: 'shortcuts', label: 'Shortcuts' },
]
