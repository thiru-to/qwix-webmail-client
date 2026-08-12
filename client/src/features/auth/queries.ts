import { queryOptions } from '@tanstack/react-query'
import { fetchSession } from '../../api/auth'
import { ApiError } from '../../api/client'

export const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401

/**
 * Built once, and resolving to `null` rather than throwing when signed out. Both matter: a query
 * that sits in an error state with no data is stale forever, so every extra observer on it kicks
 * off another fetch, and the re-render adds another — a signed-out visitor spins on /auth/me.
 */
const sessionOptions = queryOptions({
  queryKey: ['session'] as const,
  queryFn: fetchSession,
  staleTime: Infinity,
  // The session only changes when we sign in or out, and both paths write the cache themselves.
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
})

export const authQueries = {
  session: () => sessionOptions,
}
