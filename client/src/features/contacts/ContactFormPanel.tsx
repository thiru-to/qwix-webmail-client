import { useState, type FormEvent } from 'react'
import type { CreateContactInput } from '../../api/contacts'
import { Button } from '../../components/ui/button'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { SidePanel } from '../../components/ui/side-panel'
import { Spinner } from '../../components/ui/spinner'
import { TextArea } from '../../components/ui/textarea'
import { TonePicker } from '../../components/ui/tone-picker'
import { useContactsUiStore } from '../../stores/contactsUiStore'
import { useCreateContact } from './mutations'

type ValidationErrors = Partial<Record<'name' | 'email', string>>

const toneOptions = [
  { id: 'rose', label: 'Rose' },
  { id: 'green', label: 'Green' },
  { id: 'purple', label: 'Purple' },
  { id: 'orange', label: 'Orange' },
  { id: 'plum', label: 'Plum' },
] satisfies { id: CreateContactInput['avatarTone']; label: string }[]

export function ContactFormPanel() {
  const setCreateOpen = useContactsUiStore((state) => state.setCreateOpen)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [notes, setNotes] = useState('')
  const [avatarTone, setAvatarTone] = useState<CreateContactInput['avatarTone']>('plum')
  const [validation, setValidation] = useState<ValidationErrors>({})
  const { mutateAsync, isPending, error } = useCreateContact()

  function closePanel() {
    setCreateOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextValidation: ValidationErrors = {
      ...(!name.trim() && { name: 'Add a contact name.' }),
      ...(!email.trim() && { email: 'Add an email address.' }),
    }

    setValidation(nextValidation)
    if (Object.keys(nextValidation).length > 0) return

    try {
      await mutateAsync({ name, email, phone, company, role, notes, avatarTone })
    } catch {
      // The mutation error is rendered inline below the form.
    }
  }

  return (
    <SidePanel
      open
      onClose={closePanel}
      eyebrow="Contacts"
      title="New contact"
      className="contact-form-panel"
      footer={
        <div className="contact-form-actions">
          <Button type="submit" form="contact-create-form" disabled={isPending}>
            {isPending ? <Spinner size={14} /> : null}
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={closePanel} disabled={isPending}>
            Discard
          </Button>
        </div>
      }
    >
      <form
        id="contact-create-form"
        className="contact-form"
        onSubmit={(event) => void handleSubmit(event)}
      >
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
        <FormField label="Email" htmlFor="contact-email" error={validation.email}>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setValidation((current) => ({ ...current, email: undefined }))
            }}
            placeholder="name@example.com"
          />
        </FormField>
        <FormField label="Phone" htmlFor="contact-phone">
          <Input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+1 555 0100"
          />
        </FormField>
        <div className="contact-form-row">
          <FormField label="Company" htmlFor="contact-company">
            <Input
              id="contact-company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Company"
            />
          </FormField>
          <FormField label="Role" htmlFor="contact-role">
            <Input
              id="contact-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Role"
            />
          </FormField>
        </div>
        <FormField label="Notes" htmlFor="contact-notes">
          <TextArea
            id="contact-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add contact notes…"
          />
        </FormField>
        <FormField label="Avatar color" htmlFor="contact-avatar-tone">
          <TonePicker
            value={avatarTone}
            onChange={(value) => setAvatarTone(value as CreateContactInput['avatarTone'])}
            options={toneOptions}
            label="Avatar color"
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
