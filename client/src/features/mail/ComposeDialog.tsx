import { useEffect, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { ChipInput } from '../../components/ui/chip-input'
import { Dialog } from '../../components/ui/dialog'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import { TextArea } from '../../components/ui/textarea'
import { useCreateMessage } from './mutations'

type ComposeDialogProps = {
  open: boolean
  onClose: () => void
}

type ValidationErrors = Partial<Record<'to' | 'subject' | 'body', string>>

export function ComposeDialog({ open, onClose }: ComposeDialogProps) {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [validation, setValidation] = useState<ValidationErrors>({})
  const { mutateAsync, isPending, error, reset } = useCreateMessage()

  useEffect(() => {
    if (open) return
    setTo('')
    setCc([])
    setBcc([])
    setSubject('')
    setBody('')
    setAttachments([])
    setValidation({})
    reset()
  }, [open, reset])

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextValidation: ValidationErrors = {
      ...(!to.trim() && { to: 'Add at least one recipient.' }),
      ...(!subject.trim() && { subject: 'Add a subject.' }),
      ...(!body.trim() && { body: 'Write a message.' }),
    }

    setValidation(nextValidation)
    if (Object.keys(nextValidation).length > 0) {
      return
    }

    try {
      await mutateAsync({
        to: to.trim(),
        cc: cc.length ? cc : undefined,
        bcc: bcc.length ? bcc : undefined,
        subject,
        body,
        attachments: attachments.length ? attachments : undefined,
      })
    } catch {
      // The mutation error is rendered inline below the form.
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="New message"
      title="Compose"
      footer={
        <div className="ui-dialog-footer">
          <Button type="submit" form="compose-form" disabled={isPending}>
            {isPending ? <Spinner size={14} /> : null}
            Send <Send size={15} strokeWidth={1.75} />
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Discard
          </Button>
        </div>
      }
    >
      <form id="compose-form" className="compose-form" onSubmit={(event) => void handleSend(event)}>
        <FormField label="To" htmlFor="compose-to" error={validation.to}>
          <Input
            id="compose-to"
            placeholder="name@example.com"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </FormField>
        <FormField label="Cc" htmlFor="compose-cc">
          <ChipInput
            id="compose-cc"
            label="Cc recipients"
            value={cc}
            onChange={setCc}
            placeholder="Add recipient and press Enter"
          />
        </FormField>
        <FormField label="Bcc" htmlFor="compose-bcc">
          <ChipInput
            id="compose-bcc"
            label="Bcc recipients"
            value={bcc}
            onChange={setBcc}
            placeholder="Add recipient and press Enter"
          />
        </FormField>
        <FormField label="Subject" htmlFor="compose-subject" error={validation.subject}>
          <Input
            id="compose-subject"
            placeholder="Subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </FormField>
        <FormField label="Message" htmlFor="compose-body" error={validation.body}>
          <TextArea
            id="compose-body"
            placeholder="Write your message…"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </FormField>
        <FormField label="Attachments" htmlFor="compose-attachments">
          <ChipInput
            id="compose-attachments"
            label="Attachments"
            value={attachments}
            onChange={setAttachments}
            placeholder="Add filename and press Enter"
          />
        </FormField>
        {error ? (
          <p className="compose-mutation-error" role="alert">
            {error.message}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}
