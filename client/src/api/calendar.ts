import type { CalendarEventItem, EventInput, EventsResponse, EventUpdate } from '@api/types'
import { request } from './client'

export const fetchEvents = (start: string, end: string) =>
  request<EventsResponse>(`/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)

export const createEvent = (input: EventInput) =>
  request<CalendarEventItem>('/calendar/events', { method: 'POST', body: input })

export const updateEvent = (input: EventUpdate) =>
  request<CalendarEventItem>('/calendar/events', { method: 'PUT', body: input })
