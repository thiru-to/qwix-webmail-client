import { ArrowLeft, FileText, Info, Send, Star, X } from 'lucide-react'
import type { Mail } from '../../api/mail'
import { Avatar } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { IconButton } from '../../components/ui/icon-button'

const stroke = 1.75

type ReaderPanelProps = {
  mail?: Mail
  starred: boolean
  onToggleStar: () => void
  onBack?: () => void
}

export function ReaderPanel({ mail, starred, onToggleStar, onBack }: ReaderPanelProps) {
  if (!mail) {
    return (
      <section className="reader-panel empty-reader">
        <Info size={24} strokeWidth={stroke} />
        <p>Select a message to read it.</p>
      </section>
    )
  }

  return (
    <section className="reader-panel">
      <div className="reader-subject-row">
        <h1>{mail.subject}</h1>
        <IconButton
          label={starred ? 'Unstar message' : 'Star message'}
          className={starred ? 'reader-star starred' : 'reader-star'}
          pressed={starred}
          onClick={onToggleStar}
        >
          <Star size={17} strokeWidth={stroke} fill={starred ? 'currentColor' : 'none'} />
        </IconButton>
        {mail.labels.map((label) => (
          <Badge className={`label-badge reader-label ${label.toLowerCase()}`} key={label}>
            <span />
            {label}
            <X size={12} strokeWidth={stroke} />
          </Badge>
        ))}
      </div>
      <div className="reader-sender">
        <Avatar initials={mail.initials} tone={mail.avatarTone} size="large" />
        <div className="sender-details">
          <h2>{mail.sender}</h2>
          <p>
            &lt;{mail.email}&gt;
            <br />
            To me
          </p>
        </div>
      </div>
      <div className="reader-toolbar">
        {onBack ? (
          <Button aria-label="Back to inbox" className="reader-back" size="icon" variant="ghost" onClick={onBack}>
            <ArrowLeft size={18} strokeWidth={stroke} />
          </Button>
        ) : (
          <span className="reader-back-spacer" aria-hidden="true" />
        )}
        <div className="reader-meta">
          <div className="reader-date">{mail.date}</div>
          <time>{mail.time}</time>
        </div>
      </div>
      <div className="message-body">
        {mail.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {mail.attachments ? (
        <div className="attachments">
          <div className="attachments-heading">Attachments ({mail.attachments.length})</div>
          <div className="attachment-list">
            {mail.attachments.map((attachment) => (
              <button className="attachment-chip" key={attachment} type="button">
                <span className="file-icon">
                  <FileText size={15} strokeWidth={stroke} />
                </span>
                {attachment}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="reply-box">
        <div>
          <Send size={15} strokeWidth={stroke} />
          <Badge className="recipient-badge">
            To: <strong>{mail.sender}</strong>
            <X size={12} strokeWidth={stroke} />
          </Badge>
        </div>
        <div className="reply-placeholder">Dear {mail.sender.split(' ')[0]}…</div>
      </div>
    </section>
  )
}
