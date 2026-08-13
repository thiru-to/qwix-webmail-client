import type { SendInput } from '@api/types'
import { create } from 'zustand'

export type LayoutMode = 'split' | 'inbox'

export type MailFilter = 'unread' | 'attachments' | 'flagged'

type MailUiState = {
  folder: string
  selectedUid: number | null
  /** The app picked the selection, not the user — shown, but not marked read. */
  selectionAuto: boolean
  layoutMode: LayoutMode
  inboxDetailOpen: boolean
  search: string
  filterOpen: boolean
  filters: MailFilter[]
  labelFilter: number | null
  composeOpen: boolean
  /** Seeds the compose form; set when replying, empty for a blank message. */
  composeDraft: Partial<SendInput>
  setFolder: (folder: string) => void
  setSelectedUid: (uid: number | null) => void
  autoSelectUid: (uid: number) => void
  setLayoutMode: (mode: LayoutMode) => void
  setInboxDetailOpen: (open: boolean) => void
  setSearch: (search: string) => void
  toggleFilterOpen: () => void
  setFilterOpen: (open: boolean) => void
  toggleFilter: (filter: MailFilter) => void
  setLabelFilter: (id: number | null) => void
  openCompose: (draft?: Partial<SendInput>) => void
  closeCompose: () => void
}

export const useMailUiStore = create<MailUiState>()((set) => ({
  folder: 'INBOX',
  selectedUid: null,
  selectionAuto: false,
  layoutMode: 'split',
  inboxDetailOpen: false,
  search: '',
  filterOpen: false,
  filters: [],
  labelFilter: null,
  composeOpen: false,
  composeDraft: {},
  // A uid only identifies a message within its own folder.
  setFolder: (folder) => set({ folder, selectedUid: null, selectionAuto: false, inboxDetailOpen: false }),
  setSelectedUid: (selectedUid) => set({ selectedUid, selectionAuto: false }),
  autoSelectUid: (selectedUid) => set({ selectedUid, selectionAuto: true }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
  setInboxDetailOpen: (inboxDetailOpen) => set({ inboxDetailOpen }),
  setSearch: (search) => set({ search }),
  toggleFilterOpen: () => set((state) => ({ filterOpen: !state.filterOpen })),
  setFilterOpen: (filterOpen) => set({ filterOpen }),
  setLabelFilter: (labelFilter) => set({ labelFilter }),
  toggleFilter: (filter) =>
    set((state) => ({
      filters: state.filters.includes(filter)
        ? state.filters.filter((value) => value !== filter)
        : [...state.filters, filter],
    })),
  openCompose: (composeDraft = {}) => set({ composeOpen: true, composeDraft }),
  closeCompose: () => set({ composeOpen: false, composeDraft: {} }),
}))
