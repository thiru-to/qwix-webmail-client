import { create } from 'zustand'

export type CalendarViewMode = 'month' | 'week' | 'day' | 'year' | 'fourWeek'

type CalendarUiState = {
  viewMode: CalendarViewMode
  focusDate: string
  selectedEventId: string
  setViewMode: (viewMode: CalendarViewMode) => void
  setFocusDate: (focusDate: string) => void
  setSelectedEventId: (id: string) => void
}

export const useCalendarUiStore = create<CalendarUiState>()((set) => ({
  viewMode: 'month',
  focusDate: '2026-08-12',
  selectedEventId: 'steering',
  setViewMode: (viewMode) => set({ viewMode }),
  setFocusDate: (focusDate) => set({ focusDate }),
  setSelectedEventId: (selectedEventId) => set({ selectedEventId }),
}))

export const calendarViewOptions: { id: CalendarViewMode; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'fourWeek', label: '4 Weeks' },
  { id: 'year', label: 'Year' },
]
