import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEvent, type CreateEventInput } from '../../api/calendar'
import { useCalendarUiStore } from '../../stores/calendarUiStore'
import { calendarQueries } from './queries'

export function useCreateEvent() {
  const queryClient = useQueryClient()
  const setSelectedEventId = useCalendarUiStore((state) => state.setSelectedEventId)
  const setCreateOpen = useCalendarUiStore((state) => state.setCreateOpen)

  return useMutation({
    mutationFn: (input: CreateEventInput) => createEvent(input),
    onSuccess: async (event) => {
      await queryClient.invalidateQueries({ queryKey: calendarQueries.calendar().queryKey })
      setSelectedEventId(event.id)
      setCreateOpen(false)
    },
  })
}
