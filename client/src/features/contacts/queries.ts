import { queryOptions } from '@tanstack/react-query'
import { fetchContacts } from '../../api/contacts'

export const contactsQueries = {
  contacts: () =>
    queryOptions({
      queryKey: ['contacts'] as const,
      queryFn: fetchContacts,
    }),
}
