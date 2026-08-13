import type { LabelKind } from '@api/types'
import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Plus, Tag } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useAssignLabel, useCreateLabel } from './mutations'
import { labelQueries } from './queries'
import { ICON, ICON_STROKE } from '../../lib/icons'

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
  const create = useCreateLabel()
  const [name, setName] = useState('')

  if (!resourceId) return null

  // Created and applied in one go: reaching this form means wanting the label on this message, and
  // making someone create it, close the menu, and reopen it to tick it is a worse version of that.
  async function createAndAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = name.trim()
    if (!value || !resourceId) return
    const label = await create.mutateAsync({ name: value })
    await assign.mutateAsync({ labelId: label.id, kind, resourceId, on: true })
    setName('')
  }

  return (
    <div className="label-picker">
      <Button size="sm" variant="outline" onClick={() => setOpen((current) => !current)}>
        <Tag size={ICON.md} strokeWidth={ICON_STROKE} /> Labels
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
                    {on ? <Check size={ICON.sm} strokeWidth={ICON_STROKE} /> : null}
                  </button>
                )
              })
            ) : (
              <p className="label-picker-empty">No labels yet.</p>
            )}

            <form className="label-picker-create" onSubmit={(event) => void createAndAssign(event)}>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="New label"
                aria-label="New label name"
              />
              <Button type="submit" size="sm" variant="ghost" disabled={create.isPending || assign.isPending}>
                <Plus size={ICON.sm} strokeWidth={ICON_STROKE} />
                Add
              </Button>
            </form>
            {create.error ? (
              <p className="label-picker-error" role="alert">
                {create.error.message}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
