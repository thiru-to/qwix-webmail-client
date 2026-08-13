import type { MessageSummary } from '@api/types'
import { useMemo } from 'react'
import { Filter, PenLine } from 'lucide-react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { mailQueries } from './queries'
import { useMoveMessage, useRoleFolders, useToggleFlagged } from './mutations'
import { MailCard } from './MailCard'
import { useMailUiStore, type MailFilter } from '../../stores/mailUiStore'
import { Button } from '../../components/ui/button'
import { SearchField } from '../../components/ui/search-field'
import { QueryState } from '../../components/ui/query-state'
import { SkeletonRow } from '../../components/ui/skeleton'
import { Spinner } from '../../components/ui/spinner'
import { addressLabel } from '../../lib/format'
import { buildThreads } from '../../lib/threading'
import { useSettings } from '../settings/queries'
import { ICON, ICON_STROKE } from '../../lib/icons'

const FILTERS: { id: MailFilter; label: string; matches: (message: MessageSummary) => boolean }[] = [
  { id: 'unread', label: 'Unread only', matches: (message) => !message.seen },
  { id: 'attachments', label: 'Has attachments', matches: (message) => message.hasAttachments },
  { id: 'flagged', label: 'Flagged', matches: (message) => message.flagged },
]

export function MessageList() {
  const folder = useMailUiStore((state) => state.folder)
  const search = useMailUiStore((state) => state.search)
  const setSearch = useMailUiStore((state) => state.setSearch)
  const filterOpen = useMailUiStore((state) => state.filterOpen)
  const toggleFilterOpen = useMailUiStore((state) => state.toggleFilterOpen)
  const setFilterOpen = useMailUiStore((state) => state.setFilterOpen)
  const filters = useMailUiStore((state) => state.filters)
  const toggleFilter = useMailUiStore((state) => state.toggleFilter)
  const labelFilter = useMailUiStore((state) => state.labelFilter)
  const settings = useSettings()
  const layoutMode = useMailUiStore((state) => state.layoutMode)
  const selectedUid = useMailUiStore((state) => state.selectedUid)
  const setSelectedUid = useMailUiStore((state) => state.setSelectedUid)
  const setInboxDetailOpen = useMailUiStore((state) => state.setInboxDetailOpen)
  const openCompose = useMailUiStore((state) => state.openCompose)

  const { data, isPending, isError, error, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(mailQueries.messages(folder))
  const { data: folders } = useQuery(mailQueries.folders())
  const toggleFlagged = useToggleFlagged()
  const move = useMoveMessage()
  const { trash } = useRoleFolders()
  // Nothing to offer when the server exposes no Trash, or when this folder already is it.
  const canDelete = !!trash && trash !== folder

  // The path separator is server-specific, so take the leaf name the server already gave us.
  const folderName = folders?.find((entry) => entry.path === folder)?.name ?? folder

  const pages = data?.pages
  const summary = pages?.[0]
  const messages = useMemo(() => pages?.flatMap((page) => page.messages) ?? [], [pages])

  // Both search and filters run over what has been paged in — the API has no query surface for either.
  const visibleMessages = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    const active = FILTERS.filter((filter) => filters.includes(filter.id))

    return messages.filter((message) => {
      if (labelFilter !== null && !message.labelIds.includes(labelFilter)) return false
      if (!active.every((filter) => filter.matches(message))) return false
      if (!normalized) return true
      return [message.subject, addressLabel(message.from), message.from?.address ?? '']
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    })
  }, [filters, labelFilter, messages, search])

  // Threading collapses the filtered list; each row then stands for its newest message.
  const rows = useMemo(
    () =>
      settings.threading
        ? buildThreads(visibleMessages).map((thread) => ({ message: thread.latest, count: thread.messages.length }))
        : visibleMessages.map((message) => ({ message, count: 1 })),
    [settings.threading, visibleMessages],
  )

  return (
    <>
      <div className="search-row">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search loaded mail…"
          label="Search mail"
        />
      </div>

      <div className="inbox-heading">
        <div>
          <div className="eyebrow">{folder.toUpperCase() === 'INBOX' ? 'Primary' : 'Folder view'}</div>
          <h1>{folderName}</h1>
          <p>
            {(summary?.total ?? 0).toLocaleString()} Messages <span>•</span>{' '}
            <strong>{(summary?.unseen ?? 0).toLocaleString()} Unread</strong>
          </p>
        </div>
        <div className="heading-actions">
          <Button size="sm" onClick={() => openCompose()}>
            <PenLine size={ICON.md} strokeWidth={ICON_STROKE} /> Compose
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={filterOpen || filters.length ? 'is-active' : undefined}
            aria-pressed={filterOpen || filters.length > 0}
            onClick={toggleFilterOpen}
          >
            <Filter size={ICON.md} strokeWidth={ICON_STROKE} /> Filter
          </Button>
        </div>
      </div>
      {filterOpen ? (
        <div className="filter-popover">
          <span>Show</span>
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={filters.includes(filter.id) ? 'active' : undefined}
              aria-pressed={filters.includes(filter.id)}
              onClick={() => toggleFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
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
          {rows.length === 0 ? (
            <div className="loading-state">
              {search.trim() || filters.length || labelFilter !== null ? 'No loaded messages match those filters.' : `No messages in ${folderName}.`}
            </div>
          ) : (
            rows.map(({ message, count }) => (
              <MailCard
                key={message.uid}
                message={message}
                threadCount={count}
                selected={layoutMode === 'split' && message.uid === selectedUid}
                onSelect={() => {
                  setSelectedUid(message.uid)
                  setFilterOpen(false)
                  if (layoutMode === 'inbox') setInboxDetailOpen(true)
                }}
                onToggleFlag={() => toggleFlagged.mutate({ uid: message.uid, set: !message.flagged })}
                onDelete={canDelete ? () => move.mutate({ uid: message.uid, to: trash! }) : undefined}
                deleting={move.isPending && move.variables?.uid === message.uid}
              />
            ))
          )}

          {hasNextPage ? (
            <Button
              className="load-more"
              variant="outline"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? <Spinner size={ICON.md} /> : null}
              Load more
            </Button>
          ) : null}
        </QueryState>
      </div>
    </>
  )
}
