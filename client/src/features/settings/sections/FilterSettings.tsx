import type { FilterActions, FilterConditions, MailFilter } from '@api/types'
import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Pencil, Play, Trash2, X } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { FormField } from '../../../components/ui/form-field'
import { Input } from '../../../components/ui/input'
import { Spinner } from '../../../components/ui/spinner'
import { labelQueries } from '../../labels/queries'
import { mailQueries } from '../../mail/queries'
import { useSettingsUiStore } from '../../../stores/settingsUiStore'
import { settingsQueries } from '../queries'
import {
  useCreateFilter,
  useDeleteFilter,
  useDeleteForwarder,
  useRequestForwarder,
  useRunFilters,
  useUpdateFilter,
  useVerifyForwarder,
} from '../mutations'

const CONDITION_FIELDS: { id: keyof FilterConditions; label: string; placeholder: string }[] = [
  { id: 'from', label: 'From', placeholder: 'billing@acme.com' },
  { id: 'to', label: 'To', placeholder: 'me@example.com' },
  { id: 'subject', label: 'Subject', placeholder: 'invoice' },
  { id: 'contains', label: 'Has the words', placeholder: 'receipt' },
  { id: 'notContains', label: "Doesn't have", placeholder: 'draft' },
]

const summarise = (filter: MailFilter) => {
  const conditions = CONDITION_FIELDS.filter(({ id }) => filter.conditions[id]).map(
    ({ id, label }) => `${label.toLowerCase()} “${filter.conditions[id]}”`,
  )
  return conditions.join(', ') || 'no conditions'
}

export function FilterSettings() {
  const { data: filters } = useQuery(settingsQueries.filters())
  const filterDraft = useSettingsUiStore((state) => state.filterDraft)
  const [editing, setEditing] = useState<MailFilter | null>(null)

  const update = useUpdateFilter()
  const remove = useDeleteFilter()
  const run = useRunFilters()
  const error = update.error ?? remove.error ?? run.error

  // Remounting on a new draft or a different filter is what seeds the form, so it never needs an
  // effect to copy props into state.
  const formKey = editing ? `edit-${editing.id}` : filterDraft ? `draft-${filterDraft.from ?? ''}` : 'new'

  return (
    <div className="settings-sections">
      <FilterForm key={formKey} editing={editing} draft={filterDraft} onDone={() => setEditing(null)} />

      {run.data ? (
        <p className="settings-hint">
          Scanned {run.data.scanned} new {run.data.scanned === 1 ? 'message' : 'messages'}, {run.data.matched} matched.
        </p>
      ) : null}

      {filters?.length ? (
        <ul className="settings-list">
          {filters.map((filter) => (
            <li key={filter.id}>
              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={filter.enabled}
                  aria-label={`Enable ${filter.name}`}
                  onChange={(event) => update.mutate({ id: filter.id, enabled: event.target.checked })}
                />
              </label>
              <span className="settings-folder-name">
                {filter.name}
                <em>{summarise(filter)}</em>
              </span>
              <button type="button" aria-label={`Edit ${filter.name}`} onClick={() => setEditing(filter)}>
                <Pencil size={14} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                aria-label={`Delete ${filter.name}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(filter.id)}
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="settings-empty">No filters yet.</p>
      )}

      <div className="settings-form-actions">
        <Button type="button" size="sm" variant="outline" onClick={() => run.mutate('INBOX')} disabled={run.isPending}>
          {run.isPending ? <Spinner size={13} /> : <Play size={15} strokeWidth={1.75} />} Run on Inbox
        </Button>
      </div>

      <ForwardingAddresses />

      {error ? (
        <p className="ui-form-error" role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  )
}

type FilterFormProps = {
  editing: MailFilter | null
  draft: FilterConditions | null
  onDone: () => void
}

function FilterForm({ editing, draft, onDone }: FilterFormProps) {
  const { data: forwarders } = useQuery(settingsQueries.forwarders())
  const { data: labels } = useQuery(labelQueries.all())
  const { data: folders } = useQuery(mailQueries.folders())
  const setFilterDraft = useSettingsUiStore((state) => state.setFilterDraft)

  const [name, setName] = useState(
    editing?.name ?? (draft?.from ? `Mail from ${draft.from}` : ''),
  )
  const [conditions, setConditions] = useState<FilterConditions>(editing?.conditions ?? draft ?? {})
  const [actions, setActions] = useState<FilterActions>(editing?.actions ?? {})

  const create = useCreateFilter()
  const update = useUpdateFilter()
  const error = create.error ?? update.error

  function finish() {
    setFilterDraft(null)
    onDone()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = { name: name.trim(), conditions, actions }
    if (editing) update.mutate({ id: editing.id, ...input }, { onSuccess: finish })
    else create.mutate(input, { onSuccess: finish })
  }

  const setCondition = (id: keyof FilterConditions, value: string) =>
    setConditions((current) => ({ ...current, [id]: value || undefined }))

  const toggleAction = (key: keyof FilterActions, on: boolean) =>
    setActions((current) => ({ ...current, [key]: on || undefined }))

  const verified = forwarders?.filter((entry) => entry.verified) ?? []

  return (
    <>
      <form className="settings-form-grid" onSubmit={submit}>
        <FormField label="Filter name" htmlFor="filter-name">
          <Input
            id="filter-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Invoices"
          />
        </FormField>

        <fieldset className="settings-fieldset">
          <legend>When a message matches</legend>
          {CONDITION_FIELDS.map(({ id, label, placeholder }) => (
            <FormField key={id} label={label} htmlFor={`filter-${id}`}>
              <Input
                id={`filter-${id}`}
                value={conditions[id] ?? ''}
                onChange={(event) => setCondition(id, event.target.value)}
                placeholder={placeholder}
              />
            </FormField>
          ))}
        </fieldset>

        <fieldset className="settings-fieldset">
          <legend>Do this</legend>
          <label className="settings-toggle compact">
            <input type="checkbox" checked={!!actions.markRead} onChange={(e) => toggleAction('markRead', e.target.checked)} />
            <span>Mark as read</span>
          </label>
          <label className="settings-toggle compact">
            <input type="checkbox" checked={!!actions.star} onChange={(e) => toggleAction('star', e.target.checked)} />
            <span>Star it</span>
          </label>
          <label className="settings-toggle compact">
            <input type="checkbox" checked={!!actions.archive} onChange={(e) => toggleAction('archive', e.target.checked)} />
            <span>Archive it</span>
          </label>
          <label className="settings-toggle compact">
            <input type="checkbox" checked={!!actions.delete} onChange={(e) => toggleAction('delete', e.target.checked)} />
            <span>Delete it</span>
          </label>

          <FormField label="Apply label" htmlFor="filter-label">
            <select
              id="filter-label"
              className="ui-input"
              value={actions.labelId ?? ''}
              onChange={(event) =>
                setActions((current) => ({ ...current, labelId: event.target.value ? Number(event.target.value) : undefined }))
              }
            >
              <option value="">None</option>
              {labels?.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Move to folder" htmlFor="filter-folder">
            <select
              id="filter-folder"
              className="ui-input"
              value={actions.moveTo ?? ''}
              disabled={!!actions.delete || !!actions.archive}
              onChange={(event) => setActions((current) => ({ ...current, moveTo: event.target.value || undefined }))}
            >
              <option value="">None</option>
              {folders?.map((folder) => (
                <option key={folder.path} value={folder.path}>
                  {folder.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Forward to" htmlFor="filter-forward">
            <select
              id="filter-forward"
              className="ui-input"
              value={actions.forwardTo ?? ''}
              onChange={(event) => setActions((current) => ({ ...current, forwardTo: event.target.value || undefined }))}
            >
              <option value="">None</option>
              {verified.map((entry) => (
                <option key={entry.id} value={entry.email}>
                  {entry.email}
                </option>
              ))}
            </select>
          </FormField>
          {!verified.length ? (
            <p className="settings-hint">Verify an address below before a filter can forward to it.</p>
          ) : null}
        </fieldset>

        <div className="settings-form-actions">
          <Button type="submit" size="sm" disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? <Spinner size={13} /> : <Check size={15} strokeWidth={1.75} />}
            {editing ? 'Save filter' : 'Add filter'}
          </Button>
          {editing || draft ? (
            <Button type="button" size="sm" variant="ghost" onClick={finish}>
              <X size={15} strokeWidth={1.75} /> Cancel
            </Button>
          ) : null}
        </div>
      </form>
      {error ? (
        <p className="ui-form-error" role="alert">
          {error.message}
        </p>
      ) : null}
    </>
  )
}

function ForwardingAddresses() {
  const { data: forwarders } = useQuery(settingsQueries.forwarders())
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [code, setCode] = useState('')

  const request = useRequestForwarder()
  const verify = useVerifyForwarder()
  const remove = useDeleteForwarder()
  const error = request.error ?? verify.error ?? remove.error

  return (
    <section className="settings-block">
      <h3>Forwarding addresses</h3>
      <p className="settings-hint">
        Mail is only forwarded to an address that confirmed a code, so a filter can never quietly relay your
        mail somewhere that never agreed to it.
      </p>

      <form
        className="settings-inline-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!email.trim()) return
          request.mutate(email.trim(), {
            onSuccess: () => {
              setPending(email.trim().toLowerCase())
              setEmail('')
            },
          })
        }}
      >
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="somewhere@else.com"
          aria-label="Forwarding address"
        />
        <Button type="submit" size="sm" disabled={request.isPending}>
          {request.isPending ? <Spinner size={13} /> : null}
          Send code
        </Button>
      </form>

      {pending ? (
        <form
          className="settings-inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            verify.mutate({ email: pending, code }, { onSuccess: () => { setPending(null); setCode('') } })
          }}
        >
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="6-digit code"
            aria-label={`Verification code for ${pending}`}
          />
          <Button type="submit" size="sm" disabled={verify.isPending}>
            {verify.isPending ? <Spinner size={13} /> : null}
            Verify {pending}
          </Button>
        </form>
      ) : null}

      {forwarders?.length ? (
        <ul className="settings-list">
          {forwarders.map((entry) => (
            <li key={entry.id}>
              <span className="settings-folder-name">
                {entry.email}
                <em>{entry.verified ? 'Verified' : 'Awaiting code'}</em>
              </span>
              {!entry.verified ? (
                <button type="button" onClick={() => setPending(entry.email)} aria-label={`Enter code for ${entry.email}`}>
                  <Check size={14} strokeWidth={1.75} />
                </button>
              ) : null}
              <button type="button" aria-label={`Remove ${entry.email}`} onClick={() => remove.mutate(entry.id)}>
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="ui-form-error" role="alert">
          {error.message}
        </p>
      ) : null}
    </section>
  )
}
