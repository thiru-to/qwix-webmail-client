import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { useSettings } from '../queries'
import { useUpdateSettings } from '../mutations'

export function MailSettings() {
  const settings = useSettings()
  const update = useUpdateSettings()
  const [sender, setSender] = useState('')

  function addSender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = sender.trim().toLowerCase()
    if (!value) return
    update.mutate({ remoteSenders: [...settings.remoteSenders, value] }, { onSuccess: () => setSender('') })
  }

  const remove = (entry: string) =>
    update.mutate({ remoteSenders: settings.remoteSenders.filter((value) => value !== entry) })

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
                  <Trash2 size={14} strokeWidth={1.75} />
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
