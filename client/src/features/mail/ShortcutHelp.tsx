import { X } from 'lucide-react'
import { useShellStore } from '../../stores/shellStore'
import { shortcutKeys } from '../../lib/shortcuts'
import { useSettings } from '../settings/queries'
import { ICON, ICON_STROKE } from '../../lib/icons'

export function ShortcutHelp() {
  const open = useShellStore((state) => state.shortcutsHelpOpen)
  const setOpen = useShellStore((state) => state.setShortcutsHelpOpen)
  const settings = useSettings()
  if (!open) return null

  return (
    <div className="shortcut-help-backdrop" role="dialog" aria-label="Keyboard shortcuts">
      <div className="shortcut-help">
        <div className="shortcut-help-header">
          <h2>Keyboard shortcuts</h2>
          <button type="button" className="close-dialog" aria-label="Close shortcuts" onClick={() => setOpen(false)}>
            <X size={ICON.lg} strokeWidth={ICON_STROKE} />
          </button>
        </div>
        <ul>
          {shortcutKeys(settings.shortcutOverrides).map((shortcut) => (
            <li key={shortcut.id}>
              <span>{shortcut.description}</span>
              <kbd>{shortcut.keys}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
