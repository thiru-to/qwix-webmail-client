import { cn } from '../../lib/utils'

export function Spinner({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn('ui-spinner', className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  )
}
