import { queryOptions } from '@tanstack/react-query'
import { fetchCalendar } from '../../api/calendar'

export const calendarQueries = {
  calendar: () =>
    queryOptions({
      queryKey: ['calendar'] as const,
      queryFn: fetchCalendar,
    }),
}
