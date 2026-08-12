import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  className?: string
  footer?: ReactNode
}

export function Dialog({ open, onClose, title, eyebrow, children, className, footer }: DialogProps) {
  if (!open) return null

  return (
    <div className="ui-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={cn('ui-dialog', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="ui-dialog-header">
          <div>
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            <h2 id="dialog-title">{title}</h2>
          </div>
          <button aria-label="Close dialog" className="close-dialog" type="button" onClick={onClose}>
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        {children}
        {footer}
      </section>
    </div>
  )
}
