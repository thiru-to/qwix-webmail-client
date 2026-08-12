import { create } from 'zustand'

export type CalendarViewMode = 'month' | 'week' | 'day' | 'year' | 'fourWeek'

type CalendarUiState = {
  viewMode: CalendarViewMode
  focusDate: string
  selectedEventId: string
  createOpen: boolean
  setViewMode: (viewMode: CalendarViewMode) => void
  setFocusDate: (focusDate: string) => void
  setSelectedEventId: (id: string) => void
  setCreateOpen: (open: boolean) => void
}

export const useCalendarUiStore = create<CalendarUiState>()((set) => ({
  viewMode: 'month',
  focusDate: '2026-08-12',
  selectedEventId: 'steering',
  createOpen: false,
  setViewMode: (viewMode) => set({ viewMode }),
  setFocusDate: (focusDate) => set({ focusDate }),
  setSelectedEventId: (selectedEventId) => set({ selectedEventId }),
  setCreateOpen: (createOpen) => set({ createOpen }),
}))

export const calendarViewOptions: { id: CalendarViewMode; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'fourWeek', label: '4 Weeks' },
  { id: 'year', label: 'Year' },
]
