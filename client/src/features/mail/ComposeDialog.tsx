import { useState } from 'react'
import { Send } from 'lucide-react'
import { Dialog } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'

type ComposeDialogProps = {
  open: boolean
  onClose: () => void
}

export function ComposeDialog({ open, onClose }: ComposeDialogProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [validation, setValidation] = useState<string | null>(null)

  async function handleSend() {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setValidation('Add a recipient, subject, and message before sending.')
      return
    }
    setValidation(null)
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setSending(false)
    setTo('')
    setSubject('')
    setBody('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="New message"
      title="Compose"
      footer={
        <div className="compose-footer">
          <button className="send-button" type="button" onClick={() => void handleSend()} disabled={sending}>
            {sending ? <Spinner size={14} /> : null}
            Send <Send size={15} strokeWidth={1.75} />
          </button>
          <button className="discard-button" type="button" onClick={onClose}>
            Discard
          </button>
        </div>
      }
    >
      <Input placeholder="To" aria-label="Recipient" value={to} onChange={(event) => setTo(event.target.value)} />
      <Input
        placeholder="Subject"
        aria-label="Subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />
      <textarea
        aria-label="Message"
        placeholder="Write your message…"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      {validation ? <p className="compose-validation">{validation}</p> : null}
    </Dialog>
  )
}
