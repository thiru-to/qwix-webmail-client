import { cn } from '../../lib/utils'

type SkeletonProps = {
  className?: string
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <span
      className={cn('ui-skeleton', className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('ui-skeleton-text', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={index === lines - 1 ? 'is-short' : undefined} />
      ))}
    </div>
  )
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn('ui-skeleton-row', className)} aria-hidden="true">
      <Skeleton className="ui-skeleton-avatar" />
      <div className="ui-skeleton-row-body">
        <Skeleton className="ui-skeleton-line" />
        <Skeleton className="ui-skeleton-line is-medium" />
        <Skeleton className="ui-skeleton-line is-short" />
      </div>
    </div>
  )
}
