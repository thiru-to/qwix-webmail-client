import {
  appendCalendarEvent,
  buildCalendarEvent,
  calendarData,
  type CalendarData,
  type EventTone,
} from '../data/mockCalendar'
import { delay, maybeFail } from './client'

export type CreateEventInput = {
  title: string
  date: string
  startMinutes: number
  endMinutes: number
  location: string
  attendees: string[]
  notes?: string
  tone: EventTone
}

export async function fetchCalendar(): Promise<CalendarData> {
  await delay()
  await maybeFail('calendar')
  return calendarData
}

export async function createEvent(input: CreateEventInput) {
  await delay()
  await maybeFail('createEvent')
  const event = appendCalendarEvent(
    buildCalendarEvent({
      id: `event-${Date.now()}`,
      title: input.title.trim(),
      date: input.date,
      startMinutes: input.startMinutes,
      endMinutes: input.endMinutes,
      location: input.location.trim() || 'TBD',
      tone: input.tone,
      attendees: input.attendees,
      notes: input.notes?.trim() || undefined,
    }),
  )
  return event
}
