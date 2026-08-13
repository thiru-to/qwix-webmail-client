import type { Settings } from '@api/types'
import { useMemo } from 'react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { fetchFilters, fetchForwarders } from '../../api/filters'
import { fetchIdentities } from '../../api/identities'
import { fetchSettings } from '../../api/settings'
import { authQueries } from '../auth/queries'

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  density: 'cozy',
  threading: false,
  shortcutsEnabled: true,
  remoteSenders: [],
  htmlMode: 'always',
  htmlSenders: [],
  shortcutOverrides: {},
}

// Stable objects, for the reason spelled out in features/auth/queries.ts.
const settingsOptions = queryOptions({ queryKey: ['settings'] as const, queryFn: fetchSettings })
const identityOptions = queryOptions({ queryKey: ['identities'] as const, queryFn: fetchIdentities })
const filterOptions = queryOptions({ queryKey: ['filters'] as const, queryFn: fetchFilters })
const forwarderOptions = queryOptions({ queryKey: ['forwarders'] as const, queryFn: fetchForwarders })

export const settingsQueries = {
  settings: () => settingsOptions,
  identities: () => identityOptions,
  filters: () => filterOptions,
  forwarders: () => forwarderOptions,
}

/** Settings gate the whole shell, so callers get defaults rather than a loading state. */
export function useSettings(): Settings {
  const { data: session } = useQuery(authQueries.session())
  // Asking before sign-in would 401 and read as an expired session on the login screen. The options
  // object has to be memoised: a fresh literal every render re-notifies the observer, which
  // re-renders, which builds another literal.
  const enabled = Boolean(session)
  const options = useMemo(() => ({ ...settingsOptions, enabled }), [enabled])
  const { data } = useQuery(options)
  return data ?? DEFAULT_SETTINGS
}
