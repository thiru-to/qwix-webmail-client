import { useId, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

type SidePanelProps = {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function SidePanel({ open, onClose, title, eyebrow, children, footer, className }: SidePanelProps) {
  const titleId = useId()

  if (!open) return null
  return (
    <section
      className={cn('ui-side-panel reader-panel', className)}
      role="dialog"
      aria-labelledby={titleId}
    >
      <div className="ui-side-panel-header">
        <div>
          {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
          <h2 id={titleId}>{title}</h2>
        </div>
        <button type="button" className="close-dialog" aria-label="Close panel" onClick={onClose}>
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>
      <div className="ui-side-panel-body">{children}</div>
      {footer ? <div className="ui-side-panel-footer">{footer}</div> : null}
    </section>
  )
}
