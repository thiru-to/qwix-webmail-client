import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMessage, type CreateMessageInput } from '../../api/mail'
import { useMailUiStore } from '../../stores/mailUiStore'
import { mailQueries } from './queries'

export function useCreateMessage() {
  const queryClient = useQueryClient()
  const setSelectedId = useMailUiStore((state) => state.setSelectedId)
  const setActiveFolder = useMailUiStore((state) => state.setActiveFolder)
  const setComposeOpen = useMailUiStore((state) => state.setComposeOpen)

  return useMutation({
    mutationFn: (input: CreateMessageInput) => createMessage(input),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: mailQueries.mailbox().queryKey })
      setActiveFolder('Sent')
      setSelectedId(message.id)
      setComposeOpen(false)
    },
  })
}
