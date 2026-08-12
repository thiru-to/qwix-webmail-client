import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type PanelProps = {
  eyebrow?: string
  title?: string
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function Panel({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  const hasHeader = Boolean(eyebrow || title || description || actions)

  return (
    <section className={cn('ui-panel', className)}>
      {hasHeader ? (
        <div className="ui-panel-header">
          <div>
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            {title ? <h1>{title}</h1> : null}
            {description ? <div className="ui-panel-description">{description}</div> : null}
          </div>
          {actions ? <div className="heading-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn('ui-panel-body', bodyClassName)}>{children}</div>
    </section>
  )
}
