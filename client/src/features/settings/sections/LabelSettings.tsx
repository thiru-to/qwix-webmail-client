import type { Label, LabelColor } from '@api/types'
import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Spinner } from '../../../components/ui/spinner'
import { useCreateLabel, useDeleteLabel, useUpdateLabel } from '../../labels/mutations'
import { labelQueries } from '../../labels/queries'
import { ICON, ICON_STROKE } from '../../../lib/icons'

const COLORS: LabelColor[] = ['pink', 'amber', 'teal', 'green', 'purple', 'orange']

function ColorPicker({ value, onChange }: { value: LabelColor; onChange: (color: LabelColor) => void }) {
  return (
    <div className="label-colors" role="group" aria-label="Label colour">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          aria-pressed={value === color}
          className={value === color ? `label-swatch ${color} active` : `label-swatch ${color}`}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}

export function LabelSettings() {
  const { data: labels } = useQuery(labelQueries.all())
  const [name, setName] = useState('')
  const [color, setColor] = useState<LabelColor>('pink')
  const [editing, setEditing] = useState<Label | null>(null)

  const create = useCreateLabel()
  const update = useUpdateLabel()
  const remove = useDeleteLabel()
  const error = create.error ?? update.error ?? remove.error

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    if (editing) {
      update.mutate({ id: editing.id, name: name.trim(), color }, { onSuccess: () => setEditing(null) })
    } else {
      create.mutate({ name: name.trim(), color }, { onSuccess: () => setName('') })
    }
  }

  function startEdit(label: Label) {
    setEditing(label)
    setName(label.name)
    setColor(label.color)
  }

  function cancelEdit() {
    setEditing(null)
    setName('')
    setColor('pink')
  }

  return (
    <div className="settings-sections">
      <form className="settings-inline-form settings-label-form" onSubmit={submit}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Label name"
          aria-label={editing ? 'Rename label' : 'New label name'}
        />
        <ColorPicker value={color} onChange={setColor} />
        <Button type="submit" size="sm" disabled={create.isPending || update.isPending}>
          {create.isPending || update.isPending ? <Spinner size={ICON.md} /> : <Check size={ICON.md} strokeWidth={ICON_STROKE} />}
          {editing ? 'Save' : 'Add'}
        </Button>
        {editing ? (
          <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
            <X size={ICON.md} strokeWidth={ICON_STROKE} />
          </Button>
        ) : null}
      </form>

      {labels?.length ? (
        <ul className="settings-list">
          {labels.map((label) => (
            <li key={label.id}>
              <span className={`label-badge ${label.color}`}>
                <span />
                {label.name}
              </span>
              <button type="button" aria-label={`Edit ${label.name}`} onClick={() => startEdit(label)}>
                <Pencil size={ICON.sm} strokeWidth={ICON_STROKE} />
              </button>
              <button
                type="button"
                aria-label={`Delete ${label.name}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(label.id)}
              >
                <Trash2 size={ICON.sm} strokeWidth={ICON_STROKE} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="settings-empty">No labels yet.</p>
      )}

      {error ? (
        <p className="ui-form-error" role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  )
}
