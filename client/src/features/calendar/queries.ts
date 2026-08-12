import { queryOptions } from '@tanstack/react-query'
import { fetchEvents } from '../../api/calendar'
import { toEventView } from '../../lib/calendar'

export const calendarQueries = {
  events: (start: string, end: string) =>
    queryOptions({
      queryKey: ['calendar', 'events', start, end] as const,
      queryFn: () => fetchEvents(start, end),
      select: (page) => page.events.map(toEventView),
    }),
}
