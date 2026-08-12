import type { CalendarEventItem } from '@api/types'
import { eventTone, type EventTone } from './format'

export type CalendarDay = {
  date: string
  dayOfMonth: number
  inMonth: boolean
  isToday: boolean
  hasEvents: boolean
}

/** A wire event plus the local-time fields the grid and agenda render. */
export type EventView = CalendarEventItem & {
  dateKey: string
  timeLabel: string
  dayLabel: string
  startMinutes: number
  endMinutes: number
  tone: EventTone
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const GRID_START_HOUR = 8
export const GRID_END_HOUR = 18

export const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR + 1 }, (_, index) => {
  const hour = GRID_START_HOUR + index
  return `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}`
})

const pad = (value: number) => String(value).padStart(2, '0')

export const isoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** Midday, so adding days never lands on a DST boundary and shifts the date. */
export const dateFromIso = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`)

export const todayIso = () => isoDate(new Date())

export const addDays = (value: string, days: number) => {
  const date = dateFromIso(value)
  date.setDate(date.getDate() + days)
  return isoDate(date)
}

export const addMonths = (value: string, months: number) => {
  const date = dateFromIso(value)
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  return isoDate(date)
}

const startOfWeek = (value: string) => addDays(value, -dateFromIso(value).getDay())

const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const shortMonthFormat = new Intl.DateTimeFormat(undefined, { month: 'short' })
const fullDayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export const monthLabel = (value: string) => monthFormat.format(dateFromIso(value))

export const fullDayLabel = (value: string) => fullDayFormat.format(dateFromIso(value))

const shortMonthLabel = (month: number, year: number) => shortMonthFormat.format(new Date(year, month, 1))

export function toEventView(event: CalendarEventItem): EventView {
  const start = new Date(event.start)
  const end = new Date(event.end)

  if (event.allDay) {
    const dateKey = event.start.slice(0, 10)
    return {
      ...event,
      dateKey,
      timeLabel: 'All day',
      dayLabel: dayFormat.format(dateFromIso(dateKey)),
      startMinutes: 0,
      endMinutes: 24 * 60,
      tone: eventTone(event.calendarId),
    }
  }

  return {
    ...event,
    dateKey: isoDate(start),
    timeLabel: `${timeFormat.format(start)} – ${timeFormat.format(end)}`,
    dayLabel: dayFormat.format(start),
    startMinutes: start.getHours() * 60 + start.getMinutes(),
    endMinutes: end.getHours() * 60 + end.getMinutes() + (isoDate(end) === isoDate(start) ? 0 : 24 * 60),
    tone: eventTone(event.calendarId),
  }
}

/** Every local date the event touches. All-day ends are exclusive per RFC 5545; timed ends are not. */
export function datesCovered(event: EventView): string[] {
  const last = event.allDay ? addDays(event.end.slice(0, 10), -1) : isoDate(new Date(event.end))
  const dates = [event.dateKey]
  for (let date = event.dateKey; date < last; ) {
    date = addDays(date, 1)
    dates.push(date)
  }
  return dates
}

export function eventDateIndex(events: EventView[]): Set<string> {
  const dates = new Set<string>()
  for (const event of events) for (const date of datesCovered(event)) dates.add(date)
  return dates
}

export const eventsOnDate = (events: EventView[], date: string) =>
  events.filter((event) => datesCovered(event).includes(date))

export function eventsInDates(events: EventView[], dates: string[]): EventView[] {
  const wanted = new Set(dates)
  return events.filter((event) => datesCovered(event).some((date) => wanted.has(date)))
}

function buildCells(start: string, length: number, month: number, events: Set<string>): CalendarDay[] {
  const today = todayIso()
  return Array.from({ length }, (_, index) => {
    const date = addDays(start, index)
    return {
      date,
      dayOfMonth: dateFromIso(date).getDate(),
      inMonth: dateFromIso(date).getMonth() === month,
      isToday: date === today,
      hasEvents: events.has(date),
    }
  })
}

/** Six whole weeks, so the grid never changes height as the user pages through months. */
export function monthGrid(focusDate: string, events: Set<string>): CalendarDay[] {
  const first = dateFromIso(focusDate)
  first.setDate(1)
  return buildCells(startOfWeek(isoDate(first)), 42, first.getMonth(), events)
}

export const weekGrid = (focusDate: string, events: Set<string>) =>
  buildCells(startOfWeek(focusDate), 7, dateFromIso(focusDate).getMonth(), events)

export const fourWeekGrid = (focusDate: string, events: Set<string>) =>
  buildCells(startOfWeek(focusDate), 28, dateFromIso(focusDate).getMonth(), events)

export const dayGrid = (focusDate: string, events: Set<string>) =>
  buildCells(focusDate, 1, dateFromIso(focusDate).getMonth(), events)

export function yearGrid(year: number, events: Set<string>) {
  return Array.from({ length: 12 }, (_, month) => {
    const first = isoDate(new Date(year, month, 1))
    return {
      label: shortMonthLabel(month, year),
      month,
      days: buildCells(startOfWeek(first), 42, month, events),
    }
  })
}

/** The window the events query asks for: the whole visible grid, padded to full weeks. */
export function visibleRange(focusDate: string, view: 'day' | 'week' | 'month' | 'fourWeek' | 'year') {
  if (view === 'year') {
    const year = dateFromIso(focusDate).getFullYear()
    return { start: `${year}-01-01`, end: `${year + 1}-01-01` }
  }
  if (view === 'day') return { start: focusDate, end: addDays(focusDate, 1) }
  if (view === 'week') return { start: startOfWeek(focusDate), end: addDays(startOfWeek(focusDate), 7) }
  if (view === 'fourWeek') return { start: startOfWeek(focusDate), end: addDays(startOfWeek(focusDate), 28) }

  const first = dateFromIso(focusDate)
  first.setDate(1)
  const start = startOfWeek(isoDate(first))
  return { start, end: addDays(start, 42) }
}

export const minutesToTimeInput = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

export function timeInputToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

/** A local wall-clock time on `date`, as the UTC instant the API stores. */
export function localInstant(date: string, minutes: number): string {
  const instant = dateFromIso(date)
  instant.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return instant.toISOString()
}
