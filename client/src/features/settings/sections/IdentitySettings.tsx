import type { Identity } from '@api/types'
import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Pencil, Star, Trash2, X } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { FormField } from '../../../components/ui/form-field'
import { Input } from '../../../components/ui/input'
import { Spinner } from '../../../components/ui/spinner'
import { authQueries } from '../../auth/queries'
import { settingsQueries } from '../queries'
import { useCreateIdentity, useDeleteIdentity, useUpdateIdentity } from '../mutations'

export function IdentitySettings() {
  const { data: identities } = useQuery(settingsQueries.identities())
  const { data: session } = useQuery(authQueries.session())
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [editing, setEditing] = useState<Identity | null>(null)

  const create = useCreateIdentity()
  const update = useUpdateIdentity()
  const remove = useDeleteIdentity()
  const error = create.error ?? update.error ?? remove.error

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !email.trim()) return
    const input = { name: name.trim(), email: email.trim() }
    const done = () => {
      setName('')
      setEmail('')
      setEditing(null)
    }
    if (editing) update.mutate({ id: editing.id, ...input }, { onSuccess: done })
    else create.mutate(input, { onSuccess: done })
  }

  return (
    <div className="settings-sections">
      <p className="settings-hint">
        An identity must be on <strong>{session?.domain ?? 'your own domain'}</strong> — the mail server will
        refuse to send as anything else. Each one gets a label of the same name.
      </p>

      <form className="settings-form-grid" onSubmit={submit}>
        <FormField label="Display name" htmlFor="identity-name">
          <Input
            id="identity-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Support Team"
          />
        </FormField>
        <FormField label="Address" htmlFor="identity-email">
          <Input
            id="identity-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={`support@${session?.domain ?? 'example.com'}`}
          />
        </FormField>
        <div className="settings-form-actions">
          <Button type="submit" size="sm" disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? <Spinner size={13} /> : <Check size={15} strokeWidth={1.75} />}
            {editing ? 'Save' : 'Add identity'}
          </Button>
          {editing ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(null)
                setName('')
                setEmail('')
              }}
            >
              <X size={15} strokeWidth={1.75} />
            </Button>
          ) : null}
        </div>
      </form>

      {identities?.length ? (
        <ul className="settings-list">
          {identities.map((identity) => (
            <li key={identity.id}>
              <span className="settings-folder-name">
                {identity.name}
                <em>{identity.email}</em>
              </span>
              <button
                type="button"
                aria-label={identity.isDefault ? 'Default identity' : `Make ${identity.name} the default`}
                className={identity.isDefault ? 'settings-default active' : 'settings-default'}
                onClick={() => update.mutate({ id: identity.id, isDefault: true })}
              >
                <Star size={14} strokeWidth={1.75} fill={identity.isDefault ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                aria-label={`Edit ${identity.name}`}
                onClick={() => {
                  setEditing(identity)
                  setName(identity.name)
                  setEmail(identity.email)
                }}
              >
                <Pencil size={14} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                aria-label={`Delete ${identity.name}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(identity.id)}
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="settings-empty">No identities yet — mail is sent from your own address.</p>
      )}

      {error ? (
        <p className="ui-form-error" role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  )
}
