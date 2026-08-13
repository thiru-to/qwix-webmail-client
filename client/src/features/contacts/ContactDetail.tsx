import type { ContactItem } from '@api/types'
import { Building2, Mail, Pencil, Phone } from 'lucide-react'
import { Avatar } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { LabelChips } from '../labels/LabelChips'
import { LabelPicker } from '../labels/LabelPicker'
import { avatarTone, initialsOf } from '../../lib/format'
import { ICON, ICON_STROKE } from '../../lib/icons'

/**
 * Rendered both in the detail pane and inside the dialog, so the two cannot describe a contact
 * differently. `heading` goes off in the dialog, whose own header already carries the name.
 */
export function ContactDetail({
  contact,
  onEdit,
  heading = true,
}: {
  contact?: ContactItem
  onEdit?: () => void
  heading?: boolean
}) {
  if (!contact) return <p className="loading-state">Select a contact to view details.</p>

  return (
    <>
      {heading ? (
      <div className="reader-sender">
        <Avatar initials={initialsOf(contact.name)} tone={avatarTone(contact.id)} size="large" />
        <div className="sender-details">
          <h2>{contact.name}</h2>
          <p>
            {contact.title ?? '—'}
            <br />
            {contact.organization ?? '—'}
          </p>
        </div>
        {onEdit ? (
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil size={ICON.md} strokeWidth={ICON_STROKE} /> Edit
          </Button>
        ) : null}
      </div>
      ) : null}
      <div className="detail-labels">
        <LabelPicker kind="contact" resourceId={contact.id} active={contact.labelIds} />
        <LabelChips ids={contact.labelIds} />
      </div>
      <div className="contact-fields">
        {contact.emails.map((email) => (
          <p key={email.value}>
            <Mail size={ICON.md} strokeWidth={ICON_STROKE} /> {email.value}
            {email.type ? <em>{email.type}</em> : null}
          </p>
        ))}
        {contact.phones.map((phone) => (
          <p key={phone.value}>
            <Phone size={ICON.md} strokeWidth={ICON_STROKE} /> {phone.value}
            {phone.type ? <em>{phone.type}</em> : null}
          </p>
        ))}
        {contact.organization ? (
          <p>
            <Building2 size={ICON.md} strokeWidth={ICON_STROKE} /> {contact.organization}
          </p>
        ) : null}
      </div>
      {contact.note ? (
        <div className="message-body">
          <p>{contact.note}</p>
        </div>
      ) : null}
    </>
  )
}
