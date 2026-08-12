import { create } from 'zustand'
import { todayIso } from '../lib/calendar'
import type { FormPanel } from './contactsUiStore'

export type { FormPanel }

export type CalendarViewMode = 'month' | 'week' | 'day' | 'year' | 'fourWeek'

type CalendarUiState = {
  viewMode: CalendarViewMode
  focusDate: string
  selectedEventId: string
  panel: FormPanel
  setViewMode: (viewMode: CalendarViewMode) => void
  setFocusDate: (focusDate: string) => void
  setSelectedEventId: (id: string) => void
  setPanel: (panel: FormPanel) => void
}

export const useCalendarUiStore = create<CalendarUiState>()((set) => ({
  viewMode: 'month',
  focusDate: todayIso(),
  selectedEventId: '',
  panel: 'none',
  setViewMode: (viewMode) => set({ viewMode }),
  setFocusDate: (focusDate) => set({ focusDate }),
  setSelectedEventId: (selectedEventId) => set({ selectedEventId }),
  setPanel: (panel) => set({ panel }),
}))

export const calendarViewOptions: { id: CalendarViewMode; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'fourWeek', label: '4 Weeks' },
  { id: 'year', label: 'Year' },
]
