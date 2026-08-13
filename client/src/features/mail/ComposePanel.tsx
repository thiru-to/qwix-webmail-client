import type { SendAttachment } from '@api/types'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Paperclip, Send, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { ChipInput } from '../../components/ui/chip-input'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import { useQuery } from '@tanstack/react-query'
import { settingsQueries } from '../settings/queries'
import { formatBytes } from '../../lib/format'
import { useMailUiStore } from '../../stores/mailUiStore'
import { useSendMessage } from './mutations'
import { ICON, ICON_STROKE } from '../../lib/icons'

type ValidationErrors = Partial<Record<'to' | 'body' | 'attachments', string>>

/** The API takes attachment bytes as base64, which is the second half of a data URL. */
const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`))
    reader.readAsDataURL(file)
  })

export function ComposePanel() {
  const draft = useMailUiStore((state) => state.composeDraft)
  const closeCompose = useMailUiStore((state) => state.closeCompose)

  const [to, setTo] = useState<string[]>([])
  const [cc, setCc] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [showCopies, setShowCopies] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<SendAttachment[]>([])
  const [validation, setValidation] = useState<ValidationErrors>({})
  const [identityId, setIdentityId] = useState<number | ''>('')
  const { data: identities } = useQuery(settingsQueries.identities())
  const { mutateAsync, isPending, error, reset } = useSendMessage()

  // Reopening seeds the form from the draft — a reply carries recipients, subject and threading.
  useEffect(() => {
    setTo(draft.to ?? [])
    setCc(draft.cc ?? [])
    setBcc(draft.bcc ?? [])
    setSubject(draft.subject ?? '')
    setBody(draft.text ?? '')
    setAttachments([])
    setValidation({})
    // Copies stay tucked away unless the draft already carries some.
    setShowCopies(Boolean(draft.cc?.length || draft.bcc?.length))
    setIdentityId(identities?.find((entry) => entry.isDefault)?.id ?? '')
    reset()
  }, [draft, identities, reset])

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return

    try {
      const encoded = await Promise.all(
        files.map(async (file) => ({
          filename: file.name,
          contentType: file.type || undefined,
          content: await toBase64(file),
        })),
      )
      setAttachments((current) => [...current, ...encoded])
      setValidation((current) => ({ ...current, attachments: undefined }))
    } catch (readError) {
      setValidation((current) => ({ ...current, attachments: (readError as Error).message }))
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextValidation: ValidationErrors = {
      ...(!to.length && { to: 'Add at least one recipient.' }),
      ...(!body.trim() && { body: 'Write a message.' }),
    }

    setValidation(nextValidation)
    if (Object.keys(nextValidation).length > 0) return

    try {
      await mutateAsync({
        identityId: identityId === '' ? undefined : identityId,
        to,
        cc: cc.length ? cc : undefined,
        bcc: bcc.length ? bcc : undefined,
        subject: subject.trim() || undefined,
        text: body,
        inReplyTo: draft.inReplyTo,
        references: draft.references,
        attachments: attachments.length ? attachments : undefined,
      })
    } catch {
      // The mutation error is rendered inline below the form.
    }
  }

  return (
    <section className="reader-panel compose-panel">
      <form className="compose-pane-form" onSubmit={(event) => void handleSend(event)}>
        <div className="compose-header">
          <h1>{subject.trim() || 'New message'}</h1>
          <Button aria-label="Discard message" size="icon" variant="ghost" onClick={closeCompose} disabled={isPending}>
            <X size={ICON.lg} strokeWidth={ICON_STROKE} />
          </Button>
        </div>

        <div className="compose-fields">
          {identities?.length ? (
            <FormField label="From" htmlFor="compose-from">
              <select
                id="compose-from"
                className="ui-input"
                value={identityId}
                onChange={(event) => setIdentityId(event.target.value ? Number(event.target.value) : '')}
              >
                <option value="">My own address</option>
                {identities.map((identity) => (
                  <option key={identity.id} value={identity.id}>
                    {identity.name} &lt;{identity.email}&gt;
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}
          <FormField label="To" htmlFor="compose-to" error={validation.to}>
            <ChipInput
              id="compose-to"
              label="Recipients"
              value={to}
              onChange={(next) => {
                setTo(next)
                setValidation((current) => ({ ...current, to: undefined }))
              }}
              placeholder="name@example.com, then Enter"
            />
          </FormField>

          {showCopies ? (
            <>
              <FormField label="Cc" htmlFor="compose-cc">
                <ChipInput id="compose-cc" label="Cc recipients" value={cc} onChange={setCc} placeholder="Add and press Enter" />
              </FormField>
              <FormField label="Bcc" htmlFor="compose-bcc">
                <ChipInput id="compose-bcc" label="Bcc recipients" value={bcc} onChange={setBcc} placeholder="Add and press Enter" />
              </FormField>
            </>
          ) : (
            <button type="button" className="compose-copies-toggle" onClick={() => setShowCopies(true)}>
              Add Cc / Bcc
            </button>
          )}

          <FormField label="Subject" htmlFor="compose-subject">
            <Input
              id="compose-subject"
              placeholder="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </FormField>
        </div>

        <label className="compose-body-label ui-form-label" htmlFor="compose-body">
          Message
        </label>
        <textarea
          id="compose-body"
          className="ui-textarea compose-body"
          placeholder="Write your message…"
          value={body}
          onChange={(event) => {
            setBody(event.target.value)
            setValidation((current) => ({ ...current, body: undefined }))
          }}
        />
        {validation.body ? (
          <span className="ui-form-error" role="alert">
            {validation.body}
          </span>
        ) : null}

        <div className="compose-attachments">
          <input
            id="compose-attachments"
            type="file"
            multiple
            className="compose-file-input"
            onChange={(event) => void addFiles(event)}
          />
          <label className="attachment-chip" htmlFor="compose-attachments">
            <span className="file-icon">
              <Paperclip size={ICON.md} strokeWidth={ICON_STROKE} />
            </span>
            Attach files
          </label>
          {attachments.map((attachment, index) => (
            <span className="ui-chip" key={`${attachment.filename}-${index}`}>
              {attachment.filename}
              <em>{formatBytes(Math.floor((attachment.content.length * 3) / 4))}</em>
              <button
                type="button"
                aria-label={`Remove ${attachment.filename}`}
                onClick={() => setAttachments((current) => current.filter((_, item) => item !== index))}
              >
                <X size={ICON.xs} strokeWidth={ICON_STROKE} />
              </button>
            </span>
          ))}
        </div>
        {validation.attachments ? (
          <span className="ui-form-error" role="alert">
            {validation.attachments}
          </span>
        ) : null}

        {error ? (
          <p className="ui-form-error" role="alert">
            {error.message}
          </p>
        ) : null}

        <div className="compose-actions">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner size={ICON.md} /> : null}
            Send <Send size={ICON.md} strokeWidth={ICON_STROKE} />
          </Button>
          <Button type="button" variant="ghost" onClick={closeCompose} disabled={isPending}>
            Discard
          </Button>
        </div>
      </form>
    </section>
  )
}
