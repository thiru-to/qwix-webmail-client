import { queryOptions } from '@tanstack/react-query'
import { fetchLabels } from '../../api/labels'

const allOptions = queryOptions({ queryKey: ['labels'] as const, queryFn: fetchLabels })

export const labelQueries = {
  all: () => allOptions,
}
