import type { Density, Theme } from '@api/types'
import { Moon, Sun } from 'lucide-react'
import { useSettings } from '../queries'
import { useUpdateSettings } from '../mutations'
import { ICON, ICON_STROKE } from '../../../lib/icons'

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
]

const DENSITIES: { id: Density; label: string; hint: string }[] = [
  { id: 'comfortable', label: 'Comfortable', hint: 'Roomy rows, full preview' },
  { id: 'cozy', label: 'Cozy', hint: 'The default balance' },
  { id: 'compact', label: 'Compact', hint: 'More messages on screen' },
]

export function AppearanceSettings() {
  const settings = useSettings()
  const update = useUpdateSettings()

  return (
    <div className="settings-sections">
      <section className="settings-block">
        <h3>Theme</h3>
        <div className="settings-choices">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={settings.theme === id ? 'settings-choice active' : 'settings-choice'}
              onClick={() => update.mutate({ theme: id })}
            >
              <Icon size={ICON.md} strokeWidth={ICON_STROKE} />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <h3>Inbox density</h3>
        <div className="settings-choices">
          {DENSITIES.map(({ id, label, hint }) => (
            <button
              key={id}
              type="button"
              className={settings.density === id ? 'settings-choice active' : 'settings-choice'}
              onClick={() => update.mutate({ density: id })}
            >
              <strong>{label}</strong>
              <span>{hint}</span>
            </button>
          ))}
        </div>
      </section>

      {update.error ? (
        <p className="ui-form-error" role="alert">
          {update.error.message}
        </p>
      ) : null}
    </div>
  )
}
