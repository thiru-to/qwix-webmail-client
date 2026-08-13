import { useInfiniteQuery } from '@tanstack/react-query'
import { PanelLeft, PanelRight } from 'lucide-react'
import { AppShell } from '../../components/shell/AppShell'
import { AccountDock } from '../auth/AccountDock'
import { ShortcutHelp } from './ShortcutHelp'
import { useMailUiStore } from '../../stores/mailUiStore'
import { mailQueries } from './queries'
import { useMailShortcuts } from './useMailShortcuts'
import { useMarkSeen, useMoveMessage, useRoleFolders, useToggleFlagged } from './mutations'
import { MailSidebar } from './MailSidebar'
import { MessageList } from './MessageList'
import { ReaderPanel } from './ReaderPanel'
import { ComposePanel } from './ComposePanel'
import './mail.css'
import { ICON_STROKE } from '../../lib/icons'

export function MailWorkspace() {
  const layoutMode = useMailUiStore((state) => state.layoutMode)
  const setLayoutMode = useMailUiStore((state) => state.setLayoutMode)
  const inboxDetailOpen = useMailUiStore((state) => state.inboxDetailOpen)
  const setInboxDetailOpen = useMailUiStore((state) => state.setInboxDetailOpen)

  const composeOpen = useMailUiStore((state) => state.composeOpen)
  const folder = useMailUiStore((state) => state.folder)
  const selectedUid = useMailUiStore((state) => state.selectedUid)
  const setSelectedUid = useMailUiStore((state) => state.setSelectedUid)
  const showInboxDetail = layoutMode === 'inbox' && (inboxDetailOpen || composeOpen)

  const { data: pages } = useInfiniteQuery(mailQueries.messages(folder))
  const listed = pages?.pages.flatMap((page) => page.messages) ?? []
  const current = listed.find((message) => message.uid === selectedUid)
  const { archive, spam, trash } = useRoleFolders()
  const move = useMoveMessage()
  const toggleFlagged = useToggleFlagged()
  const markSeen = useMarkSeen()

  // Every shortcut acts on the selected message, so each one is a no-op until something is selected.
  const step = (delta: number) => {
    if (!listed.length) return
    const index = listed.findIndex((message) => message.uid === selectedUid)
    const next = listed[Math.min(Math.max(index + delta, 0), listed.length - 1)] ?? listed[0]
    if (next) setSelectedUid(next.uid)
  }

  useMailShortcuts({
    next: () => step(1),
    previous: () => step(-1),
    open: () => layoutMode === 'inbox' && selectedUid !== null && setInboxDetailOpen(true),
    back: () => setInboxDetailOpen(false),
    star: () => current && toggleFlagged.mutate({ uid: current.uid, set: !current.flagged }),
    markRead: () => current && markSeen.mutate({ uid: current.uid, set: true }),
    markUnread: () => current && markSeen.mutate({ uid: current.uid, set: false }),
    archive: () => current && archive && move.mutate({ uid: current.uid, to: archive }),
    spam: () => current && spam && move.mutate({ uid: current.uid, to: spam }),
    trash: () => current && trash && move.mutate({ uid: current.uid, to: trash }),
  })

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
                <PanelRight size={14} strokeWidth={ICON_STROKE} /> <span>Split</span>
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
                <PanelLeft size={14} strokeWidth={ICON_STROKE} /> <span>Inbox</span>
              </button>
            </div>
          </div>
          <AccountDock />
        </>
      }
    >
      <main className={showInboxDetail ? 'inbox-column inbox-reading' : 'inbox-column'}>
        {showInboxDetail ? (
          composeOpen ? (
            <ComposePanel />
          ) : (
            <ReaderPanel onBack={() => setInboxDetailOpen(false)} />
          )
        ) : (
          <MessageList />
        )}
      </main>

      {layoutMode === 'split' ? composeOpen ? <ComposePanel /> : <ReaderPanel /> : null}

      <ShortcutHelp />
    </AppShell>
  )
}
