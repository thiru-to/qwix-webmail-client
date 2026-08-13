import type { MailFolder } from '@api/types'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Archive,
  FileText,
  Folder,
  Inbox,
  Layers,
  Send,
  Star,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { mailQueries } from './queries'
import { useMailUiStore } from '../../stores/mailUiStore'
import { useShellStore } from '../../stores/shellStore'
import { SkeletonRow } from '../../components/ui/skeleton'
import { QueryState } from '../../components/ui/query-state'
import { LabelSection } from '../labels/LabelSection'
import { ICON_STROKE } from '../../lib/icons'

// Ordered as a mail client presents them; anything without a special use drops into "Other".
const SPECIAL_USE: { use: string; icon: LucideIcon }[] = [
  { use: '\\Inbox', icon: Inbox },
  { use: '\\Drafts', icon: FileText },
  { use: '\\Sent', icon: Send },
  { use: '\\Flagged', icon: Star },
  { use: '\\Archive', icon: Archive },
  { use: '\\Junk', icon: AlertCircle },
  { use: '\\Trash', icon: Trash2 },
  { use: '\\All', icon: Layers },
]

const iconFor = (folder: MailFolder) =>
  SPECIAL_USE.find((entry) => entry.use === folder.specialUse)?.icon ??
  (folder.path.toUpperCase() === 'INBOX' ? Inbox : Folder)

function partition(folders: MailFolder[]) {
  const primary: MailFolder[] = []
  const other: MailFolder[] = []

  for (const folder of folders) {
    const special = SPECIAL_USE.some((entry) => entry.use === folder.specialUse)
    ;(special || folder.path.toUpperCase() === 'INBOX' ? primary : other).push(folder)
  }

  const rank = (folder: MailFolder) => {
    const index = SPECIAL_USE.findIndex((entry) => entry.use === folder.specialUse)
    return index === -1 ? (folder.path.toUpperCase() === 'INBOX' ? 0 : SPECIAL_USE.length) : index
  }

  primary.sort((a, b) => rank(a) - rank(b))
  other.sort((a, b) => a.path.localeCompare(b.path))
  return { primary, other }
}

function FolderList({ folders, label }: { folders: MailFolder[]; label: string }) {
  const activeFolder = useMailUiStore((state) => state.folder)
  const setFolder = useMailUiStore((state) => state.setFolder)
  const sidebarCollapsed = useShellStore((state) => state.sidebarCollapsed)

  return (
    <nav className="folder-list" aria-label={label}>
      {folders.map((folder) => {
        const Icon = iconFor(folder)
        return (
          <button
            className={activeFolder === folder.path ? 'folder-item active' : 'folder-item'}
            key={folder.path}
            title={sidebarCollapsed ? folder.name : undefined}
            type="button"
            onClick={() => setFolder(folder.path)}
          >
            <Icon size={18} strokeWidth={ICON_STROKE} />
            <span>{folder.name}</span>
            <span className="folder-count">{folder.unseen || folder.total || ''}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function MailSidebar() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(mailQueries.folders())
  const { primary, other } = useMemo(() => partition(data ?? []), [data])

  return (
    <QueryState
      isPending={isPending}
      isError={isError}
      error={error}
      onRetry={() => void refetch()}
      isFetching={isFetching}
      pending={
        <div className="query-pending">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      }
    >
      <FolderList folders={primary} label="Folders" />

      {other.length ? (
        <div className="sidebar-section">
          <div className="section-heading">
            <span>Other</span>
          </div>
          <FolderList folders={other} label="Other folders" />
        </div>
      ) : null}

      <LabelSection />
    </QueryState>
  )
}
