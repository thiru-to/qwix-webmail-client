import { AppShell } from '../../components/shell/AppShell'
import { Panel } from '../../components/ui/panel'
import { AccountDock } from '../auth/AccountDock'
import { SETTINGS_SECTIONS, useSettingsUiStore } from '../../stores/settingsUiStore'
import { AppearanceSettings } from './sections/AppearanceSettings'
import { FilterSettings } from './sections/FilterSettings'
import { FolderSettings } from './sections/FolderSettings'
import { IdentitySettings } from './sections/IdentitySettings'
import { LabelSettings } from './sections/LabelSettings'
import { MailSettings } from './sections/MailSettings'
import { ShortcutSettings } from './sections/ShortcutSettings'
import './settings.css'

const TITLES: Record<string, { title: string; description: string }> = {
  appearance: { title: 'Appearance', description: 'Theme and how densely the message list is packed.' },
  mail: { title: 'Mail', description: 'Conversation grouping and which senders may load remote images.' },
  labels: { title: 'Labels', description: 'Your own labels, applied to mail, contacts and events.' },
  folders: { title: 'Folders', description: 'Mailboxes on the server. System folders cannot be changed.' },
  identities: { title: 'Identities', description: 'Alternate From addresses on your own domain.' },
  filters: { title: 'Filters', description: 'Rules applied to new mail as it arrives.' },
  shortcuts: { title: 'Keyboard shortcuts', description: 'Gmail bindings by default; each one can be rebound.' },
}

export function SettingsWorkspace() {
  const section = useSettingsUiStore((state) => state.section)
  const setSection = useSettingsUiStore((state) => state.setSection)
  const meta = TITLES[section]!

  return (
    <AppShell
      workspaceClassName="workspace-inbox product-settings"
      sidebar={
        <nav className="folder-list" aria-label="Settings sections">
          {SETTINGS_SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              className={section === id ? 'folder-item active' : 'folder-item'}
              type="button"
              onClick={() => setSection(id)}
            >
              <span>{label}</span>
            </button>
          ))}
        </nav>
      }
      dock={<AccountDock />}
    >
      <main className="inbox-column settings-main">
        <Panel eyebrow="Settings" title={meta.title} description={meta.description}>
          {section === 'appearance' ? <AppearanceSettings /> : null}
          {section === 'mail' ? <MailSettings /> : null}
          {section === 'labels' ? <LabelSettings /> : null}
          {section === 'folders' ? <FolderSettings /> : null}
          {section === 'identities' ? <IdentitySettings /> : null}
          {section === 'filters' ? <FilterSettings /> : null}
          {section === 'shortcuts' ? <ShortcutSettings /> : null}
        </Panel>
      </main>
    </AppShell>
  )
}
