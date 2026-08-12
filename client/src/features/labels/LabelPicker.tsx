import type { LabelKind } from '@api/types'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Tag } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { useAssignLabel } from './mutations'
import { labelQueries } from './queries'

type LabelPickerProps = {
  kind: LabelKind
  /** Null when the resource has no stable identity — a message with no Message-ID, say. */
  resourceId: string | null
  active: number[]
}

export function LabelPicker({ kind, resourceId, active }: LabelPickerProps) {
  const [open, setOpen] = useState(false)
  const { data: labels } = useQuery(labelQueries.all())
  const assign = useAssignLabel()

  if (!resourceId) return null

  return (
    <div className="label-picker">
      <Button size="sm" variant="outline" onClick={() => setOpen((current) => !current)}>
        <Tag size={15} strokeWidth={1.75} /> Labels
      </Button>

      {open ? (
        <>
          <button className="label-picker-backdrop" type="button" aria-label="Close labels" onClick={() => setOpen(false)} />
          <div className="label-picker-menu">
            {labels?.length ? (
              labels.map((label) => {
                const on = active.includes(label.id)
                return (
                  <button
                    key={label.id}
                    type="button"
                    className={on ? 'label-option active' : 'label-option'}
                    disabled={assign.isPending}
                    onClick={() => assign.mutate({ labelId: label.id, kind, resourceId, on: !on })}
                  >
                    <span className={`label-dot ${label.color}`} />
                    {label.name}
                    {on ? <Check size={14} strokeWidth={2} /> : null}
                  </button>
                )
              })
            ) : (
              <p className="label-picker-empty">Create a label in the mail sidebar first.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
