import type { ReactNode } from 'react'
import { ApiError } from '../../api/client'
import { Button } from './button'
import { SkeletonRow } from './skeleton'
import { Spinner } from './spinner'
import { ICON } from '../../lib/icons'

type QueryStateProps = {
  isPending: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  isFetching?: boolean
  pending?: ReactNode
  children: ReactNode
}

export function QueryState({
  isPending,
  isError,
  error,
  onRetry,
  isFetching = false,
  pending,
  children,
}: QueryStateProps) {
  if (isPending) {
    return (
      <>
        {pending ?? (
          <div className="query-pending" aria-busy="true">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}
      </>
    )
  }

  if (isError) {
    // A 5xx is the mail host refusing us, not the user mistyping something — say so, and say it is
    // already being looked at. The server logs and reports every one of these, so that is not a
    // polite fiction. A dropped connection (status 0) never reached the server, so it claims neither.
    const upstream = error instanceof ApiError && error.status >= 500

    return (
      <div className="query-error" role="alert">
        {upstream ? (
          <>
            <p className="query-error-title">This didn't load, and it isn't something you did.</p>
            <p>{error.message}</p>
            <p className="query-error-note">Reported to the administrator.</p>
          </>
        ) : (
          <p>{error?.message ?? 'Something went wrong.'}</p>
        )}
        <Button type="button" onClick={onRetry} disabled={isFetching}>
          {isFetching ? <Spinner size={ICON.md} /> : null}
          Retry
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
