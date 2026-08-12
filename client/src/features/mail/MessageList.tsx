import { useMemo } from 'react'
import { Filter, MoreHorizontal, PenLine } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { mailQueries } from './queries'
import { MailCard } from './MailCard'
import { useMailUiStore } from '../../stores/mailUiStore'
import { Button } from '../../components/ui/button'
import { SearchField } from '../../components/ui/search-field'
import { QueryState } from '../../components/ui/query-state'
import { SkeletonRow } from '../../components/ui/skeleton'
import type { Mail } from '../../data/mockMail'

const emptyMessages: Mail[] = []

export function MessageList() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(mailQueries.mailbox())
  const activeFolder = useMailUiStore((state) => state.activeFolder)
  const search = useMailUiStore((state) => state.search)
  const setSearch = useMailUiStore((state) => state.setSearch)
  const filterOpen = useMailUiStore((state) => state.filterOpen)
  const toggleFilterOpen = useMailUiStore((state) => state.toggleFilterOpen)
  const setFilterOpen = useMailUiStore((state) => state.setFilterOpen)
  const layoutMode = useMailUiStore((state) => state.layoutMode)
  const selectedId = useMailUiStore((state) => state.selectedId)
  const setSelectedId = useMailUiStore((state) => state.setSelectedId)
  const setInboxDetailOpen = useMailUiStore((state) => state.setInboxDetailOpen)
  const setComposeOpen = useMailUiStore((state) => state.setComposeOpen)
  const starredIds = useMailUiStore((state) => state.starredIds)
  const toggleStar = useMailUiStore((state) => state.toggleStar)

  const messages = data?.messages ?? emptyMessages
  const visibleMessages = useMemo(() => {
    const folderMessages = messages.filter((message) => message.folder === activeFolder)
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return folderMessages
    return folderMessages.filter((message) =>
      [message.sender, message.subject, message.preview, ...message.labels]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [activeFolder, messages, search])

  return (
    <>
      <div className="search-row">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search mail here…"
          label="Search mail"
        />
      </div>

      <div className="inbox-heading">
        <div>
          <div className="eyebrow">{activeFolder === 'Inbox' ? 'Primary' : 'Folder view'}</div>
          <h1>{activeFolder}</h1>
          <p>
            {(data?.messages.length ?? 0).toLocaleString()} Messages <span>•</span> <strong>167 Unread</strong>
          </p>
        </div>
        <div className="heading-actions">
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            <PenLine size={16} strokeWidth={1.75} /> Compose
          </Button>
          <button
            className={filterOpen ? 'filter-button active' : 'filter-button'}
            type="button"
            onClick={toggleFilterOpen}
          >
            <Filter size={16} strokeWidth={1.75} /> Filter
          </button>
          <Button aria-label="More inbox actions" className="more-button" size="icon" variant="ghost">
            <MoreHorizontal size={18} strokeWidth={1.75} />
          </Button>
        </div>
      </div>
      {filterOpen ? (
        <div className="filter-popover">
          <span>Show</span>
          <button type="button">Unread only</button>
          <button type="button">Has attachments</button>
          <button type="button">Starred</button>
        </div>
      ) : null}

      <div className="message-list" aria-label="Messages">
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
              <SkeletonRow />
            </div>
          }
        >
          {visibleMessages.length === 0 ? (
            <div className="loading-state">No messages match “{search}”.</div>
          ) : (
            visibleMessages.map((message) => (
              <MailCard
                key={message.id}
                message={message}
                selected={layoutMode === 'split' && message.id === selectedId}
                starred={starredIds.includes(message.id)}
                onSelect={() => {
                  setSelectedId(message.id)
                  setFilterOpen(false)
                  if (layoutMode === 'inbox') setInboxDetailOpen(true)
                }}
                onToggleStar={() => toggleStar(message.id)}
              />
            ))
          )}
        </QueryState>
      </div>
    </>
  )
}
