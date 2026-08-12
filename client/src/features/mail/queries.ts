import { queryOptions } from '@tanstack/react-query'
import { fetchMailbox } from '../../api/mail'

export const mailQueries = {
  mailbox: () =>
    queryOptions({
      queryKey: ['mailbox'] as const,
      queryFn: fetchMailbox,
    }),
}
