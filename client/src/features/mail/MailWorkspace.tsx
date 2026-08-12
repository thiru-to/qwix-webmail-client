import { PanelLeft, PanelRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { AppShell, ThemeToggle } from '../../components/shell/AppShell'
import { StorageMeter } from '../../components/ui/storage-meter'
import { useMailUiStore } from '../../stores/mailUiStore'
import { useShellStore } from '../../stores/shellStore'
import { mailQueries } from './queries'
import { MailSidebar } from './MailSidebar'
import { MessageList } from './MessageList'
import { ReaderPanel } from './ReaderPanel'
import { ComposeDialog } from './ComposeDialog'
import type { Mail } from '../../api/mail'
import './mail.css'

const emptyMessages: Mail[] = []

export function MailWorkspace() {
  const { data } = useQuery(mailQueries.mailbox())
  const layoutMode = useMailUiStore((state) => state.layoutMode)
  const setLayoutMode = useMailUiStore((state) => state.setLayoutMode)
  const inboxDetailOpen = useMailUiStore((state) => state.inboxDetailOpen)
  const setInboxDetailOpen = useMailUiStore((state) => state.setInboxDetailOpen)
  const selectedId = useMailUiStore((state) => state.selectedId)
  const starredIds = useMailUiStore((state) => state.starredIds)
  const toggleStar = useMailUiStore((state) => state.toggleStar)
  const composeOpen = useMailUiStore((state) => state.composeOpen)
  const setComposeOpen = useMailUiStore((state) => state.setComposeOpen)
  const sidebarCollapsed = useShellStore((state) => state.sidebarCollapsed)

  const messages = data?.messages ?? emptyMessages
  const selectedMail = messages.find((message) => message.id === selectedId) ?? messages[0]
  const showInboxDetail = layoutMode === 'inbox' && inboxDetailOpen

  return (
    <AppShell
      workspaceClassName={layoutMode === 'inbox' ? 'workspace-inbox' : undefined}
      sidebar={<MailSidebar />}
      dock={
        <>
          <div className="sidebar-controls">
            <div className="layout-switcher" aria-label="Inbox layout">
              <button
                className={layoutMode === 'split' ? 'layout-option active' : 'layout-option'}
                type="button"
                onClick={() => setLayoutMode('split')}
                title="Split view"
              >
                <PanelRight size={14} strokeWidth={1.75} /> <span>Split</span>
              </button>
              <button
                className={layoutMode === 'inbox' ? 'layout-option active' : 'layout-option'}
                type="button"
                title="Inbox only"
                onClick={() => {
                  setLayoutMode('inbox')
                  setInboxDetailOpen(false)
                }}
              >
                <PanelLeft size={14} strokeWidth={1.75} /> <span>Inbox</span>
              </button>
            </div>
            <ThemeToggle />
          </div>
          <StorageMeter
            used={data?.account.storageUsed}
            limit={data?.account.storageLimit}
            percent={data?.account.storagePercent}
            collapsedLabel={
              sidebarCollapsed
                ? `${data?.account.storageUsed} / ${data?.account.storageLimit}`
                : undefined
            }
          />
        </>
      }
    >
      <main className={showInboxDetail ? 'inbox-column inbox-reading' : 'inbox-column'}>
        {showInboxDetail ? (
          <ReaderPanel
            mail={selectedMail}
            starred={selectedMail ? starredIds.includes(selectedMail.id) : false}
            onBack={() => setInboxDetailOpen(false)}
            onToggleStar={() => selectedMail && toggleStar(selectedMail.id)}
          />
        ) : (
          <MessageList />
        )}
      </main>

      {layoutMode === 'split' ? (
        <ReaderPanel
          mail={selectedMail}
          starred={selectedMail ? starredIds.includes(selectedMail.id) : false}
          onToggleStar={() => selectedMail && toggleStar(selectedMail.id)}
        />
      ) : null}

      <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
    </AppShell>
  )
}
