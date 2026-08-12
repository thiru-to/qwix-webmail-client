import type { EventInput, EventUpdate } from '@api/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEvent, updateEvent } from '../../api/calendar'
import { useCalendarUiStore } from '../../stores/calendarUiStore'

function useEventWrite<TInput>(mutationFn: (input: TInput) => Promise<{ id: string }>) {
  const queryClient = useQueryClient()
  const setSelectedEventId = useCalendarUiStore((state) => state.setSelectedEventId)
  const setPanel = useCalendarUiStore((state) => state.setPanel)

  return useMutation({
    mutationFn,
    onSuccess: async (event) => {
      // Every cached range could contain the event, so drop them all rather than guess.
      await queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
      setSelectedEventId(event.id)
      setPanel('none')
    },
  })
}

export const useCreateEvent = () => useEventWrite((input: EventInput) => createEvent(input))

export const useUpdateEvent = () => useEventWrite((input: EventUpdate) => updateEvent(input))
