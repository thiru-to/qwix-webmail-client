import type { ContactItem, Typed } from '@api/types'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { ChipInput } from '../../components/ui/chip-input'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { SidePanel } from '../../components/ui/side-panel'
import { Spinner } from '../../components/ui/spinner'
import { TextArea } from '../../components/ui/textarea'
import { useContactsUiStore } from '../../stores/contactsUiStore'
import { useCreateContact, useUpdateContact } from './mutations'
import { ICON } from '../../lib/icons'

type ValidationErrors = Partial<Record<'name' | 'emails', string>>

/** Keep the vCard TYPE that came with an address; only newly typed ones need a default. */
const retype = (values: string[], existing: Typed[], fallback: string): Typed[] =>
  values.map((value) => ({ value, type: existing.find((entry) => entry.value === value)?.type ?? fallback }))

export function ContactFormPanel({ contact }: { contact?: ContactItem }) {
  const setPanel = useContactsUiStore((state) => state.setPanel)
  const [name, setName] = useState(contact?.name ?? '')
  const [emails, setEmails] = useState<string[]>(contact?.emails.map((entry) => entry.value) ?? [])
  const [phones, setPhones] = useState<string[]>(contact?.phones.map((entry) => entry.value) ?? [])
  const [organization, setOrganization] = useState(contact?.organization ?? '')
  const [title, setTitle] = useState(contact?.title ?? '')
  const [note, setNote] = useState(contact?.note ?? '')
  const [validation, setValidation] = useState<ValidationErrors>({})

  const create = useCreateContact()
  const update = useUpdateContact()
  const { isPending, error } = contact ? update : create

  function closePanel() {
    setPanel('none')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextValidation: ValidationErrors = {
      ...(!name.trim() && { name: 'Add a contact name.' }),
      ...(!emails.length && { emails: 'Add at least one email address.' }),
    }

    setValidation(nextValidation)
    if (Object.keys(nextValidation).length > 0) return

    const input = {
      name: name.trim(),
      emails: retype(emails, contact?.emails ?? [], 'work'),
      phones: retype(phones, contact?.phones ?? [], 'cell'),
      organization: organization.trim() || undefined,
      title: title.trim() || undefined,
      note: note.trim() || undefined,
    }

    try {
      if (contact) await update.mutateAsync({ ...input, url: contact.url, etag: contact.etag })
      else await create.mutateAsync(input)
    } catch {
      // The mutation error is rendered inline below the form.
    }
  }

  return (
    <SidePanel
      open
      onClose={closePanel}
      eyebrow="Contacts"
      title={contact ? 'Edit contact' : 'New contact'}
      className="contact-form-panel"
      footer={
        <div className="contact-form-actions">
          <Button type="submit" form="contact-form" disabled={isPending}>
            {isPending ? <Spinner size={ICON.md} /> : null}
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={closePanel} disabled={isPending}>
            Cancel
          </Button>
        </div>
      }
    >
      <form id="contact-form" className="contact-form" onSubmit={(event) => void handleSubmit(event)}>
        <FormField label="Name" htmlFor="contact-name" error={validation.name}>
          <Input
            id="contact-name"
            autoFocus
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setValidation((current) => ({ ...current, name: undefined }))
            }}
            placeholder="Full name"
          />
        </FormField>
        <FormField label="Email" htmlFor="contact-emails" error={validation.emails}>
          <ChipInput
            id="contact-emails"
            label="Email addresses"
            value={emails}
            onChange={(next) => {
              setEmails(next)
              setValidation((current) => ({ ...current, emails: undefined }))
            }}
            placeholder="name@example.com, then Enter"
          />
        </FormField>
        <FormField label="Phone" htmlFor="contact-phones">
          <ChipInput
            id="contact-phones"
            label="Phone numbers"
            value={phones}
            onChange={setPhones}
            placeholder="+1 555 0100, then Enter"
          />
        </FormField>
        <div className="contact-form-row">
          <FormField label="Company" htmlFor="contact-company">
            <Input
              id="contact-company"
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              placeholder="Company"
            />
          </FormField>
          <FormField label="Role" htmlFor="contact-role">
            <Input
              id="contact-role"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Role"
            />
          </FormField>
        </div>
        <FormField label="Notes" htmlFor="contact-notes">
          <TextArea
            id="contact-notes"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add contact notes…"
          />
        </FormField>
        {error ? (
          <p className="ui-form-error" role="alert">
            {error.message}
          </p>
        ) : null}
      </form>
    </SidePanel>
  )
}
