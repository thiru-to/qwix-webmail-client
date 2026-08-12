import type { LabelColor } from '@api/types'
import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Tag, Trash2, X } from 'lucide-react'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import { useMailUiStore } from '../../stores/mailUiStore'
import { useShellStore } from '../../stores/shellStore'
import { useCreateLabel, useDeleteLabel } from './mutations'
import { labelQueries } from './queries'

const COLORS: LabelColor[] = ['pink', 'amber', 'teal', 'green', 'purple', 'orange']

export function LabelSection() {
  const { data: labels } = useQuery(labelQueries.all())
  const labelFilter = useMailUiStore((state) => state.labelFilter)
  const setLabelFilter = useMailUiStore((state) => state.setLabelFilter)
  const sidebarCollapsed = useShellStore((state) => state.sidebarCollapsed)

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState<LabelColor>('pink')
  const create = useCreateLabel()
  const remove = useDeleteLabel()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    create.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName('')
          setAdding(false)
        },
      },
    )
  }

  return (
    <div className="sidebar-section labels-section">
      <div className="section-heading">
        <span>Labels</span>
      </div>

      <nav className="folder-list" aria-label="Labels">
        {labels?.map((label) => (
          <div className="label-row" key={label.id}>
            <button
              className={labelFilter === label.id ? 'folder-item active' : 'folder-item'}
              title={sidebarCollapsed ? label.name : undefined}
              type="button"
              onClick={() => setLabelFilter(labelFilter === label.id ? null : label.id)}
            >
              <Tag size={18} strokeWidth={1.75} className={`label-icon ${label.color}`} />
              <span>{label.name}</span>
            </button>
            <button
              className="label-delete"
              type="button"
              aria-label={`Delete label ${label.name}`}
              disabled={remove.isPending}
              onClick={() => remove.mutate(label.id)}
            >
              <Trash2 size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}

        {adding ? (
          <form className="label-create" onSubmit={submit}>
            <Input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Label name"
              aria-label="New label name"
            />
            <div className="label-colors" role="group" aria-label="Label colour">
              {COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-label={option}
                  aria-pressed={color === option}
                  className={color === option ? `label-swatch ${option} active` : `label-swatch ${option}`}
                  onClick={() => setColor(option)}
                />
              ))}
            </div>
            {create.error ? (
              <p className="ui-form-error" role="alert">
                {create.error.message}
              </p>
            ) : null}
            <div className="label-create-actions">
              <button type="submit" className="add-label" disabled={create.isPending}>
                {create.isPending ? <Spinner size={13} /> : <Plus size={15} strokeWidth={1.75} />} Save
              </button>
              <button type="button" className="label-delete" aria-label="Cancel" onClick={() => setAdding(false)}>
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
          </form>
        ) : (
          <button className="add-label" type="button" onClick={() => setAdding(true)}>
            <Plus size={16} strokeWidth={1.75} /> <span>Add label</span>
          </button>
        )}
      </nav>
    </div>
  )
}
