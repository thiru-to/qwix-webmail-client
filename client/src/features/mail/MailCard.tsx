import type { MessageSummary } from '@api/types'
import { CornerUpLeft, Paperclip, Star } from 'lucide-react'
import { Avatar } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { IconButton } from '../../components/ui/icon-button'
import { LabelChips } from '../labels/LabelChips'
import { addressLabel, avatarTone, formatListDate, initialsOf } from '../../lib/format'

const stroke = 1.75

type MailCardProps = {
  message: MessageSummary
  selected: boolean
  threadCount?: number
  onSelect: () => void
  onToggleFlag: () => void
}

export function MailCard({ message, selected, threadCount = 1, onSelect, onToggleFlag }: MailCardProps) {
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
              <Paperclip size={13} strokeWidth={stroke} />
            </span>
          ) : null}
          {message.answered ? (
            <span className="meta-pill">
              <CornerUpLeft size={13} strokeWidth={stroke} />
            </span>
          ) : null}
          {message.draft ? <Badge>Draft</Badge> : null}
          <LabelChips ids={message.labelIds} />
        </div>
      </div>
      <IconButton
        label={message.flagged ? `Unflag ${message.subject}` : `Flag ${message.subject}`}
        className={message.flagged ? 'star-button starred' : 'star-button'}
        pressed={message.flagged}
        onClick={(event) => {
          event.stopPropagation()
          onToggleFlag()
        }}
      >
        <Star size={17} strokeWidth={stroke} fill={message.flagged ? 'currentColor' : 'none'} />
      </IconButton>
    </article>
  )
}
