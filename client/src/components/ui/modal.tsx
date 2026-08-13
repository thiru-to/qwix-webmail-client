import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ICON, ICON_STROKE } from '../../lib/icons'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Same props as SidePanel, so a surface can move between the two by changing the import. */
export function Modal({ open, onClose, title, eyebrow, children, footer, className }: ModalProps) {
  const titleId = useId()

  // Escape closes it from anywhere, including from inside a field, which a backdrop click cannot do.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="ui-modal-layer">
      {/* A button rather than a div: dismissing by clicking away should also work from the keyboard. */}
      <button type="button" className="ui-modal-backdrop" aria-label="Close" onClick={onClose} />
      <section className={cn('ui-modal', className)} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="ui-modal-header">
          <div>
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="close-dialog" aria-label="Close" onClick={onClose}>
            <X size={ICON.lg} strokeWidth={ICON_STROKE} />
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
        {footer ? <div className="ui-modal-footer">{footer}</div> : null}
      </section>
    </div>
  )
}
