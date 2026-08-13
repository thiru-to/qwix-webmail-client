import type { MessageSummary } from '@api/types'
import { CornerUpLeft, Paperclip, Star, Trash2 } from 'lucide-react'
import { Avatar } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { IconButton } from '../../components/ui/icon-button'
import { LabelChips } from '../labels/LabelChips'
import { addressLabel, avatarTone, formatListDate, initialsOf } from '../../lib/format'
import { ICON, ICON_STROKE } from '../../lib/icons'

type MailCardProps = {
  message: MessageSummary
  selected: boolean
  threadCount?: number
  onSelect: () => void
  onToggleFlag: () => void
  /** Omitted where there is nowhere to delete to — no Trash folder, or this is Trash. */
  onDelete?: () => void
  deleting?: boolean
}

export function MailCard({
  message,
  selected,
  threadCount = 1,
  onSelect,
  onToggleFlag,
  onDelete,
  deleting = false,
}: MailCardProps) {
  const sender = addressLabel(message.from)
  const seed = message.from?.address ?? sender

  return (
    <article
      className={selected ? 'mail-card selected' : message.seen ? 'mail-card' : 'mail-card unread'}
      onClick={onSelect}
      onKeyDown={(event) => event.key === 'Enter' && onSelect()}
      role="button"
      tabIndex={0}
    >
      <Avatar initials={initialsOf(sender)} tone={avatarTone(seed)} />
      <div className="mail-card-content">
        <div className="mail-card-topline">
          <h2>
            {message.subject || '(no subject)'}
            {threadCount > 1 ? <span className="thread-count">{threadCount}</span> : null}
          </h2>
          <time>{formatListDate(message.date)}</time>
        </div>
        <div className="sender-name">{sender}</div>
        <p>{message.from?.address ?? ''}</p>
        <div className="card-meta">
          {message.hasAttachments ? (
            <span className="meta-pill">
              <Paperclip size={ICON.sm} strokeWidth={ICON_STROKE} />
            </span>
          ) : null}
          {message.answered ? (
            <span className="meta-pill">
              <CornerUpLeft size={ICON.sm} strokeWidth={ICON_STROKE} />
            </span>
          ) : null}
          {message.draft ? <Badge>Draft</Badge> : null}
          <LabelChips ids={message.labelIds} />
        </div>
      </div>
      <div className="mail-card-actions">
        <IconButton
          label={message.flagged ? `Unflag ${message.subject}` : `Flag ${message.subject}`}
          className={message.flagged ? 'star-button starred' : 'star-button'}
          pressed={message.flagged}
          onClick={(event) => {
            event.stopPropagation()
            onToggleFlag()
          }}
        >
          <Star size={ICON.lg} strokeWidth={ICON_STROKE} fill={message.flagged ? 'currentColor' : 'none'} />
        </IconButton>
        {onDelete ? (
          <IconButton
            label={`Delete ${message.subject || '(no subject)'}`}
            className="trash-button"
            disabled={deleting}
            onClick={(event) => {
              // The card itself opens the message; without this, deleting also opens what it deleted.
              event.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 size={ICON.lg} strokeWidth={ICON_STROKE} />
          </IconButton>
        ) : null}
      </div>
    </article>
  )
}
