import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContact, type CreateContactInput } from '../../api/contacts'
import { useContactsUiStore } from '../../stores/contactsUiStore'
import { contactsQueries } from './queries'

export function useCreateContact() {
  const queryClient = useQueryClient()
  const setSelectedId = useContactsUiStore((state) => state.setSelectedId)
  const setCreateOpen = useContactsUiStore((state) => state.setCreateOpen)
  const setSearch = useContactsUiStore((state) => state.setSearch)

  return useMutation({
    mutationFn: (input: CreateContactInput) => createContact(input),
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({ queryKey: contactsQueries.contacts().queryKey })
      setSearch('')
      setSelectedId(contact.id)
      setCreateOpen(false)
    },
  })
}
