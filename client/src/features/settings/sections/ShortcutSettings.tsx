import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { SHORTCUTS, eventKey } from '../../../lib/shortcuts'
import { useSettings } from '../queries'
import { useUpdateSettings } from '../mutations'
import { ICON_STROKE } from '../../../lib/icons'

export function ShortcutSettings() {
  const settings = useSettings()
  const update = useUpdateSettings()
  const [recording, setRecording] = useState<string | null>(null)

  function record(id: string, event: React.KeyboardEvent) {
    event.preventDefault()
    if (event.key === 'Escape') {
      setRecording(null)
      return
    }
    const key = eventKey(event.nativeEvent)
    if (!key) return
    update.mutate({ shortcutOverrides: { ...settings.shortcutOverrides, [id]: key } })
    setRecording(null)
  }

  const reset = () => update.mutate({ shortcutOverrides: {} })

  return (
    <div className="settings-sections">
      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={settings.shortcutsEnabled}
          onChange={(event) => update.mutate({ shortcutsEnabled: event.target.checked })}
        />
        <span>
          <strong>Enable keyboard shortcuts</strong>
          <em>Gmail bindings. Shortcuts never fire while you are typing in a field.</em>
        </span>
      </label>

      <ul className="settings-list settings-shortcuts">
        {SHORTCUTS.map((shortcut) => {
          const bound = settings.shortcutOverrides[shortcut.id] || shortcut.keys
          return (
            <li key={shortcut.id}>
              <span className="settings-folder-name">{shortcut.description}</span>
              <button
                type="button"
                className={recording === shortcut.id ? 'shortcut-key recording' : 'shortcut-key'}
                aria-label={`Rebind ${shortcut.description}, currently ${bound}`}
                onClick={() => setRecording(shortcut.id)}
                onKeyDown={(event) => recording === shortcut.id && record(shortcut.id, event)}
                onBlur={() => setRecording(null)}
                disabled={!settings.shortcutsEnabled}
              >
                {recording === shortcut.id ? 'Press a key…' : bound}
              </button>
            </li>
          )
        })}
      </ul>

      <Button size="sm" variant="outline" onClick={reset} disabled={update.isPending}>
        <RotateCcw size={15} strokeWidth={ICON_STROKE} /> Reset to defaults
      </Button>

      {update.error ? (
        <p className="ui-form-error" role="alert">
          {update.error.message}
        </p>
      ) : null}
    </div>
  )
}
