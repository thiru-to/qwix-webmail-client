import {
  AlertCircle,
  Archive,
  Clock3,
  FileText,
  Inbox,
  Send,
  Star,
  Trash2,
  Tag,
  Plus,
  ChevronDown,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { mailQueries } from './queries'
import { useMailUiStore } from '../../stores/mailUiStore'
import { useShellStore } from '../../stores/shellStore'
import { SkeletonRow } from '../../components/ui/skeleton'
import { QueryState } from '../../components/ui/query-state'

const iconMap = {
  inbox: Inbox,
  star: Star,
  clock: Clock3,
  send: Send,
  file: FileText,
  archive: Archive,
  alert: AlertCircle,
  trash: Trash2,
} as const

const stroke = 1.75

function FolderIcon({ name }: { name: keyof typeof iconMap }) {
  const Icon = iconMap[name]
  return <Icon size={18} strokeWidth={stroke} />
}

export function MailSidebar() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(mailQueries.mailbox())
  const activeFolder = useMailUiStore((state) => state.activeFolder)
  const setActiveFolder = useMailUiStore((state) => state.setActiveFolder)
  const setInboxDetailOpen = useMailUiStore((state) => state.setInboxDetailOpen)
  const sidebarCollapsed = useShellStore((state) => state.sidebarCollapsed)

  function selectFolder(name: string) {
    setActiveFolder(name)
    setInboxDetailOpen(false)
  }

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
      <nav className="folder-list" aria-label="Folders">
        {data?.folders.map((folder) => (
          <button
            className={activeFolder === folder.name ? 'folder-item active' : 'folder-item'}
            key={folder.name}
            title={sidebarCollapsed ? folder.name : undefined}
            type="button"
            onClick={() => selectFolder(folder.name)}
          >
            <FolderIcon name={folder.icon as keyof typeof iconMap} />
            <span>{folder.name}</span>
            <span className="folder-count">{folder.count}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-section">
        <button className="section-heading" type="button">
          <span>Other</span>
          <ChevronDown size={14} strokeWidth={stroke} />
        </button>
        <nav className="folder-list" aria-label="Other folders">
          {data?.secondaryFolders.map((folder) => (
            <button
              className="folder-item"
              key={folder.name}
              title={sidebarCollapsed ? folder.name : undefined}
              type="button"
              onClick={() => selectFolder(folder.name)}
            >
              <FolderIcon name={folder.icon as keyof typeof iconMap} />
              <span>{folder.name}</span>
              <span className="folder-count">{folder.count}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-section labels-section">
        <button className="section-heading" type="button">
          <span>Labels</span>
          <ChevronDown size={14} strokeWidth={stroke} />
        </button>
        <nav className="folder-list" aria-label="Labels">
          {data?.labels.map((label) => (
            <button
              className="folder-item"
              key={label.name}
              title={sidebarCollapsed ? label.name : undefined}
              type="button"
              onClick={() => selectFolder(label.name)}
            >
              <Tag size={18} strokeWidth={stroke} className={`label-icon ${label.color}`} />
              <span>{label.name}</span>
              <span className="folder-count">{label.count}</span>
            </button>
          ))}
          <button className="add-label" type="button">
            <Plus size={16} strokeWidth={stroke} /> <span>Add labels</span>
          </button>
        </nav>
      </div>
    </QueryState>
  )
}
