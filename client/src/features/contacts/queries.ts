import { queryOptions } from '@tanstack/react-query'
import { fetchContacts } from '../../api/contacts'

const contactsOptions = queryOptions({ queryKey: ['contacts'] as const, queryFn: fetchContacts })

export const contactsQueries = {
  contacts: () => contactsOptions,
}
