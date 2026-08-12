import type { ReactNode } from 'react'
import { Button } from './button'
import { SkeletonRow } from './skeleton'
import { Spinner } from './spinner'

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
    return (
      <div className="query-error" role="alert">
        <p>{error?.message ?? 'Something went wrong.'}</p>
        <Button type="button" onClick={onRetry} disabled={isFetching}>
          {isFetching ? <Spinner size={14} /> : null}
          Retry
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
