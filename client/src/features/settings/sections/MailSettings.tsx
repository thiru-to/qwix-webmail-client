import type { HtmlMode } from '@api/types'
import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { useSettings } from '../queries'
import { useUpdateSettings } from '../mutations'
import { ICON, ICON_STROKE } from '../../../lib/icons'

const HTML_MODES: { id: HtmlMode; label: string; hint: string }[] = [
  { id: 'always', label: 'Show formatted messages', hint: 'Mail renders as the sender designed it.' },
  { id: 'allowed', label: 'Only from senders I allow', hint: 'Everything else arrives as plain text.' },
  { id: 'never', label: 'Always plain text', hint: 'No message renders its formatting.' },
]

export function MailSettings() {
  const settings = useSettings()
  const update = useUpdateSettings()
  const [sender, setSender] = useState('')
  const [htmlSender, setHtmlSender] = useState('')

  function addSender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = sender.trim().toLowerCase()
    if (!value) return
    update.mutate({ remoteSenders: [...settings.remoteSenders, value] }, { onSuccess: () => setSender('') })
  }

  const remove = (entry: string) =>
    update.mutate({ remoteSenders: settings.remoteSenders.filter((value) => value !== entry) })

  function addHtmlSender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = htmlSender.trim().toLowerCase()
    if (!value) return
    update.mutate({ htmlSenders: [...settings.htmlSenders, value] }, { onSuccess: () => setHtmlSender('') })
  }

  const removeHtmlSender = (entry: string) =>
    update.mutate({ htmlSenders: settings.htmlSenders.filter((value) => value !== entry) })

  return (
    <div className="settings-sections">
      <section className="settings-block">
        <h3>Conversations</h3>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={settings.threading}
            onChange={(event) => update.mutate({ threading: event.target.checked })}
          />
          <span>
            <strong>Group messages by conversation</strong>
            <em>Replies are collapsed into the thread they belong to.</em>
          </span>
        </label>
      </section>

      <section className="settings-block">
        <h3>Formatted messages</h3>
        <p className="settings-hint">
          HTML mail can be laid out to mislead — a link that reads as one address and points at
          another. Plain text cannot. Any message can still be opened once without changing this.
        </p>
        {HTML_MODES.map((mode) => (
          <label className="settings-toggle" key={mode.id}>
            <input
              type="radio"
              name="html-mode"
              checked={settings.htmlMode === mode.id}
              onChange={() => update.mutate({ htmlMode: mode.id })}
            />
            <span>
              <strong>{mode.label}</strong>
              <em>{mode.hint}</em>
            </span>
          </label>
        ))}

        {settings.htmlMode === 'allowed' ? (
          <>
            <form className="settings-inline-form" onSubmit={addHtmlSender}>
              <Input
                value={htmlSender}
                onChange={(event) => setHtmlSender(event.target.value)}
                placeholder="newsletter@example.com or example.com"
                aria-label="Show formatted messages from"
              />
              <Button type="submit" size="sm" disabled={update.isPending}>
                Allow
              </Button>
            </form>
            {settings.htmlSenders.length ? (
              <ul className="settings-list">
                {settings.htmlSenders.map((entry) => (
                  <li key={entry}>
                    <span>{entry}</span>
                    <button type="button" aria-label={`Remove ${entry}`} onClick={() => removeHtmlSender(entry)}>
                      <Trash2 size={ICON.sm} strokeWidth={ICON_STROKE} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="settings-empty">No senders allowed yet — everything shows as plain text.</p>
            )}
          </>
        ) : null}
      </section>

      <section className="settings-block">
        <h3>Remote content</h3>
        <p className="settings-hint">
          Images are blocked by default so senders cannot tell when you opened a message. Add an address or a
          bare domain to let its images load.
        </p>
        <form className="settings-inline-form" onSubmit={addSender}>
          <Input
            value={sender}
            onChange={(event) => setSender(event.target.value)}
            placeholder="newsletter@example.com or example.com"
            aria-label="Allow remote images from"
          />
          <Button type="submit" size="sm" disabled={update.isPending}>
            Allow
          </Button>
        </form>
        {settings.remoteSenders.length ? (
          <ul className="settings-list">
            {settings.remoteSenders.map((entry) => (
              <li key={entry}>
                <span>{entry}</span>
                <button type="button" aria-label={`Remove ${entry}`} onClick={() => remove(entry)}>
                  <Trash2 size={ICON.sm} strokeWidth={ICON_STROKE} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="settings-empty">No senders allowed yet.</p>
        )}
      </section>

      {update.error ? (
        <p className="ui-form-error" role="alert">
          {update.error.message}
        </p>
      ) : null}
    </div>
  )
}
