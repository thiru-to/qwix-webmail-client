import type { Message } from '@api/types'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Info, Star } from 'lucide-react'
import { attachmentUrl } from '../../api/mail'
import { Avatar } from '../../components/ui/avatar'
import { IconButton } from '../../components/ui/icon-button'
import { QueryState } from '../../components/ui/query-state'
import { SkeletonRow } from '../../components/ui/skeleton'
import { LabelChips } from '../labels/LabelChips'
import { useMailUiStore } from '../../stores/mailUiStore'
import {
  addressLabel,
  addressList,
  avatarTone,
  formatBytes,
  formatFullDate,
  formatTime,
  initialsOf,
} from '../../lib/format'
import { ReaderToolbar } from './ReaderToolbar'
import { useSettings } from '../settings/queries'
import { remoteAllowed } from '../../lib/remote'
import { useMarkSeen, useToggleFlagged } from './mutations'
import { mailQueries } from './queries'
import { ICON, ICON_STROKE } from '../../lib/icons'

// Message HTML is attacker-controlled: the sandbox stops scripts, and the CSP stops remote
// loads, so tracking pixels never fire. Inline images are dropped along with them.
const frameHead = (allowRemote: boolean) =>
  '<!doctype html><meta charset="utf-8">' +
  `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:${allowRemote ? ' https:' : ''}; style-src 'unsafe-inline'">` +
  '<base target="_blank">' +
  '<style>html,body{margin:0;padding:0;height:100%}body{font:14px/1.6 system-ui,sans-serif;color:#111;padding:2px}' +
  'img{max-width:100%;height:auto}table{max-width:100%}</style>'

type ReaderPanelProps = { onBack?: () => void }

export function ReaderPanel({ onBack }: ReaderPanelProps) {
  const folder = useMailUiStore((state) => state.folder)
  const selectedUid = useMailUiStore((state) => state.selectedUid)
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(mailQueries.message(folder, selectedUid))

  if (selectedUid === null) {
    return (
      <section className="reader-panel empty-reader">
        <Info size={ICON.xl} strokeWidth={ICON_STROKE} />
        <p>Select a message to read it.</p>
      </section>
    )
  }

  return (
    <section className="reader-panel">
      <QueryState
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        isFetching={isFetching}
        pending={
          <div className="query-pending">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        }
      >
        {data ? <MessageDetail message={data} onBack={onBack} /> : null}
      </QueryState>
    </section>
  )
}

function MessageDetail({ message, onBack }: { message: Message; onBack?: () => void }) {
  const openCompose = useMailUiStore((state) => state.openCompose)
  const settings = useSettings()
  const toggleFlagged = useToggleFlagged()
  const markSeen = useMarkSeen()
  const allowRemote = remoteAllowed(settings.remoteSenders, message.from?.address)

  const seen = message.seen
  const uid = message.uid
  const markSeenMutate = markSeen.mutate

  useEffect(() => {
    if (!seen) markSeenMutate({ uid, set: true })
  }, [markSeenMutate, seen, uid])

  const sender = addressLabel(message.from)
  const attachments = message.attachments.filter((attachment) => !attachment.inline)

  const quoted = () => {
    const body = message.text ?? (message.html ? '[HTML message]' : '')
    return `\n\nOn ${formatFullDate(message.date)}, ${sender} wrote:\n${body
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')}`
  }

  function reply(all = false) {
    const to = message.replyTo.length ? message.replyTo : message.from ? [message.from] : []
    const everyone = [...message.to, ...message.cc].map((address) => address.address)
    const primary = to.map((address) => address.address)
    openCompose({
      to: primary,
      // Reply-all keeps the other recipients but never adds the sender back into Cc.
      cc: all ? [...new Set(everyone)].filter((address) => !primary.includes(address)) : undefined,
      subject: /^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject}`,
      text: quoted(),
      inReplyTo: message.messageId ?? undefined,
      references: message.messageId ? [message.messageId] : undefined,
    })
  }

  function forward() {
    openCompose({
      to: [],
      subject: /^fwd?:/i.test(message.subject) ? message.subject : `Fwd: ${message.subject}`,
      text: `\n\n---------- Forwarded message ----------\nFrom: ${sender} <${message.from?.address ?? ''}>\nDate: ${formatFullDate(message.date)}\nSubject: ${message.subject}\nTo: ${addressList(message.to)}\n\n${message.text ?? '[HTML message]'}`,
      references: message.messageId ? [message.messageId] : undefined,
    })
  }

  return (
    <>
      <div className="reader-subject-row">
        <h1>{message.subject || '(no subject)'}</h1>
        <IconButton
          label={message.flagged ? 'Unflag message' : 'Flag message'}
          className={message.flagged ? 'reader-star starred' : 'reader-star'}
          pressed={message.flagged}
          onClick={() => toggleFlagged.mutate({ uid: message.uid, set: !message.flagged })}
        >
          <Star size={ICON.lg} strokeWidth={ICON_STROKE} fill={message.flagged ? 'currentColor' : 'none'} />
        </IconButton>
      </div>

      <div className="reader-sender">
        <Avatar initials={initialsOf(sender)} tone={avatarTone(message.from?.address ?? sender)} size="large" />
        <div className="sender-details">
          <div className="sender-identity">
            <h2>{sender}</h2>
            <span className="sender-address">&lt;{message.from?.address ?? 'unknown'}&gt;</span>
          </div>
          <p>To {addressList(message.to) || 'undisclosed recipients'}</p>
        </div>
        <div className="reader-meta">
          <div className="reader-date">{formatFullDate(message.date)}</div>
          <time>{formatTime(message.date)}</time>
        </div>
      </div>

      <ReaderToolbar
        message={message}
        onBack={onBack}
        onReply={() => reply(false)}
        onReplyAll={() => reply(true)}
        onForward={forward}
        onMarkSeen={(seen) => markSeen.mutate({ uid: message.uid, set: seen })}
      />
      {message.labelIds.length ? (
        <div className="reader-labels">
          <LabelChips ids={message.labelIds} />
        </div>
      ) : null}

      {message.html ? (
        <iframe
          className="message-frame"
          sandbox=""
          title="Message body"
          srcDoc={frameHead(allowRemote) + message.html}
        />
      ) : (
        <div className="message-body">
          <pre className="message-text">{message.text ?? 'This message has no readable body.'}</pre>
        </div>
      )}

      {attachments.length ? (
        <div className="attachments">
          <div className="attachments-heading">Attachments ({attachments.length})</div>
          <div className="attachment-list">
            {attachments.map((attachment) => (
              <a
                className="attachment-chip"
                key={attachment.part}
                href={attachmentUrl(message.folder, message.uid, attachment.part)}
                download={attachment.filename}
              >
                <span className="file-icon">
                  <FileText size={ICON.md} strokeWidth={ICON_STROKE} />
                </span>
                {attachment.filename ?? attachment.mimeType}
                {attachment.size ? <em>{formatBytes(attachment.size)}</em> : null}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
