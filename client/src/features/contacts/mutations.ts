import type { ContactInput, ContactUpdate } from '@api/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContact, deleteContact, updateContact } from '../../api/contacts'
import { useContactsUiStore } from '../../stores/contactsUiStore'
import { contactsQueries } from './queries'

export function useCreateContact() {
  const queryClient = useQueryClient()
  const setSelectedId = useContactsUiStore((state) => state.setSelectedId)
  const setPanel = useContactsUiStore((state) => state.setPanel)
  const setSearch = useContactsUiStore((state) => state.setSearch)

  return useMutation({
    mutationFn: (input: ContactInput) => createContact(input),
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({ queryKey: contactsQueries.contacts().queryKey })
      setSearch('')
      setSelectedId(contact.id)
      setPanel('none')
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  const setSelectedId = useContactsUiStore((state) => state.setSelectedId)
  const setPanel = useContactsUiStore((state) => state.setPanel)

  return useMutation({
    mutationFn: (input: ContactUpdate) => updateContact(input),
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({ queryKey: contactsQueries.contacts().queryKey })
      setSelectedId(contact.id)
      setPanel('none')
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  const setSelectedId = useContactsUiStore((state) => state.setSelectedId)
  const setPanel = useContactsUiStore((state) => state.setPanel)

  return useMutation({
    mutationFn: (url: string) => deleteContact(url),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contactsQueries.contacts().queryKey })
      // Nothing left to show for the one that just went.
      setSelectedId('')
      setPanel('none')
    },
  })
}
