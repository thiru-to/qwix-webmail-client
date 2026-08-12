import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function List({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div className={cn('ui-list', className)} aria-label={label}>
      {children}
    </div>
  )
}

type ListRowProps = HTMLAttributes<HTMLElement> & {
  selected?: boolean
  unread?: boolean
  onSelect?: () => void
  leading?: ReactNode
  trailing?: ReactNode
  children: ReactNode
}

export function ListRow({
  selected,
  unread,
  onSelect,
  leading,
  trailing,
  children,
  className,
  ...props
}: ListRowProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect?.()
    }
  }

  return (
    <article
      className={cn('ui-list-row', selected && 'selected', unread && 'unread', className)}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      {...props}
    >
      {leading}
      <div className="ui-list-row-content">{children}</div>
      {trailing}
    </article>
  )
}
