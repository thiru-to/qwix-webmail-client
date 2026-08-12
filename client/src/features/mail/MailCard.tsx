import { Paperclip, Star } from 'lucide-react'
import type { Mail } from '../../api/mail'
import { Avatar } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { IconButton } from '../../components/ui/icon-button'

const stroke = 1.75

type MailCardProps = {
  message: Mail
  selected: boolean
  starred: boolean
  onSelect: () => void
  onToggleStar: () => void
}

export function MailCard({ message, selected, starred, onSelect, onToggleStar }: MailCardProps) {
  return (
    <article
      className={selected ? 'mail-card selected' : message.unread ? 'mail-card unread' : 'mail-card'}
      onClick={onSelect}
      onKeyDown={(event) => event.key === 'Enter' && onSelect()}
      role="button"
      tabIndex={0}
    >
      <Avatar initials={message.initials} tone={message.avatarTone} />
      <div className="mail-card-content">
        <div className="mail-card-topline">
          <h2>{message.subject}</h2>
          <time>{message.time}</time>
        </div>
        <div className="sender-name">{message.sender}</div>
        <p>{message.preview}</p>
        <div className="card-meta">
          {message.attachments ? (
            <span className="meta-pill">
              <Paperclip size={13} strokeWidth={stroke} /> {message.attachments.length}
            </span>
          ) : null}
          {message.labels.map((label) => (
            <Badge className={`label-badge ${label.toLowerCase()}`} key={label}>
              <span />
              {label}
            </Badge>
          ))}
        </div>
      </div>
      <IconButton
        label={starred ? `Unstar ${message.subject}` : `Star ${message.subject}`}
        className={starred ? 'star-button starred' : 'star-button'}
        pressed={starred}
        onClick={(event) => {
          event.stopPropagation()
          onToggleStar()
        }}
      >
        <Star size={17} strokeWidth={stroke} fill={starred ? 'currentColor' : 'none'} />
      </IconButton>
    </article>
  )
}
