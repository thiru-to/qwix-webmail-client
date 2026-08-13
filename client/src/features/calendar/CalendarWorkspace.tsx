import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Grid3x3, Pencil, Sun, Trash2 } from 'lucide-react'
import { AppShell } from '../../components/shell/AppShell'
import { AccountDock } from '../auth/AccountDock'
import { Panel } from '../../components/ui/panel'
import { Toolbar } from '../../components/ui/toolbar'
import { QueryState } from '../../components/ui/query-state'
import { SkeletonRow } from '../../components/ui/skeleton'
import { Button } from '../../components/ui/button'
import { calendarQueries } from './queries'
import { DayView, FourWeekView, MonthView, WeekView, YearView } from './CalendarViews'
import { Modal } from '../../components/ui/modal'
import { Spinner } from '../../components/ui/spinner'
import { useDeleteEvent } from './mutations'
import { EventFormPanel } from './EventFormPanel'
import { EventAgenda, EventDetail } from './EventWidgets'
import {
  addDays,
  addMonths,
  dateFromIso,
  dayGrid,
  eventDateIndex,
  eventsInDates,
  fourWeekGrid,
  fullDayLabel,
  monthGrid,
  monthLabel,
  todayIso,
  visibleRange,
  weekGrid,
  yearGrid,
  type CalendarDay,
  type EventView,
} from '../../lib/calendar'
import {
  calendarViewOptions,
  useCalendarUiStore,
  type CalendarViewMode,
} from '../../stores/calendarUiStore'
import { useShellStore } from '../../stores/shellStore'
import './calendar.css'
import { ICON, ICON_STROKE } from '../../lib/icons'

const viewIcons: Record<CalendarViewMode, typeof CalendarDays> = {
  day: Sun,
  week: CalendarRange,
  month: CalendarDays,
  fourWeek: Grid3x3,
  year: CalendarClock,
}

const viewTitles: Record<CalendarViewMode, string> = {
  day: 'Day view',
  week: 'Week view',
  month: 'Month view',
  fourWeek: '4 week view',
  year: 'Year view',
}

const step = (focusDate: string, view: CalendarViewMode, direction: 1 | -1) => {
  if (view === 'day') return addDays(focusDate, direction)
  if (view === 'week') return addDays(focusDate, 7 * direction)
  if (view === 'fourWeek') return addDays(focusDate, 28 * direction)
  return addMonths(focusDate, (view === 'year' ? 12 : 1) * direction)
}

function heading(focusDate: string, view: CalendarViewMode, days: CalendarDay[]) {
  if (view === 'year') return String(dateFromIso(focusDate).getFullYear())
  if (view === 'day') return fullDayLabel(focusDate)
  if (view === 'week') return `${days[0]?.dayOfMonth ?? ''} – ${days[6]?.dayOfMonth ?? ''} ${monthLabel(focusDate)}`
  if (view === 'fourWeek') return `4 weeks · ${monthLabel(focusDate)}`
  return monthLabel(focusDate)
}

export function CalendarWorkspace() {
  const viewMode = useCalendarUiStore((state) => state.viewMode)
  const setViewMode = useCalendarUiStore((state) => state.setViewMode)
  const focusDate = useCalendarUiStore((state) => state.focusDate)
  const setFocusDate = useCalendarUiStore((state) => state.setFocusDate)
  const selectedEventId = useCalendarUiStore((state) => state.selectedEventId)
  const setSelectedEventId = useCalendarUiStore((state) => state.setSelectedEventId)
  const panel = useCalendarUiStore((state) => state.panel)
  const setPanel = useCalendarUiStore((state) => state.setPanel)
  const sidebarCollapsed = useShellStore((state) => state.sidebarCollapsed)

  const range = useMemo(() => visibleRange(focusDate, viewMode), [focusDate, viewMode])
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(
    calendarQueries.events(range.start, range.end),
  )

  const events = useMemo<EventView[]>(() => data ?? [], [data])
  const dateIndex = useMemo(() => eventDateIndex(events), [events])

  const days = useMemo(() => {
    if (viewMode === 'day') return dayGrid(focusDate, dateIndex)
    if (viewMode === 'week') return weekGrid(focusDate, dateIndex)
    if (viewMode === 'fourWeek') return fourWeekGrid(focusDate, dateIndex)
    return monthGrid(focusDate, dateIndex)
  }, [dateIndex, focusDate, viewMode])

  const months = useMemo(
    () => (viewMode === 'year' ? yearGrid(dateFromIso(focusDate).getFullYear(), dateIndex) : []),
    [dateIndex, focusDate, viewMode],
  )

  const agendaEvents = useMemo(() => {
    if (viewMode === 'year') return events
    return eventsInDates(
      events,
      days.filter((day) => viewMode !== 'month' || day.inMonth).map((day) => day.date),
    )
  }, [days, events, viewMode])

  const selected = events.find((event) => event.id === selectedEventId) ?? agendaEvents[0] ?? events[0]

  const remove = useDeleteEvent()

  function handleSelectDate(date: string) {
    setFocusDate(date)
    // From the year view a date means "take me there", not "add something".
    if (viewMode === 'year') {
      setViewMode('day')
      return
    }
    // An empty day is only ever clicked to put something on it.
    if (!events.some((event) => event.dateKey === date)) setPanel('create')
  }

  function handleSelectEvent(id: string) {
    setSelectedEventId(id)
    setPanel('view')
  }

  function handleDelete() {
    if (selected?.url) remove.mutate(selected.url)
  }

  return (
    <AppShell
      workspaceClassName="workspace-inbox product-calendar"
      sidebar={
        <nav className="folder-list" aria-label="Calendar views">
          {calendarViewOptions.map(({ id, label }) => {
            const Icon = viewIcons[id]
            return (
              <button
                key={id}
                className={viewMode === id ? 'folder-item active' : 'folder-item'}
                title={sidebarCollapsed ? label : undefined}
                type="button"
                onClick={() => setViewMode(id)}
              >
                <Icon size={ICON.lg} strokeWidth={ICON_STROKE} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      }
      dock={
<AccountDock />
      }
    >
      <main className="inbox-column calendar-main">
        <Panel
          eyebrow={viewTitles[viewMode]}
          title={heading(focusDate, viewMode, days)}
          actions={
            <Toolbar className="calendar-toolbar">
              <div className="view-switcher" aria-label="Calendar view mode">
                {calendarViewOptions.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={viewMode === id ? 'view-option active' : 'view-option'}
                    onClick={() => setViewMode(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button
                aria-label="Previous"
                size="icon"
                variant="ghost"
                onClick={() => setFocusDate(step(focusDate, viewMode, -1))}
              >
                <ChevronLeft size={ICON.lg} strokeWidth={ICON_STROKE} />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setFocusDate(todayIso())}>
                Today
              </Button>
              <Button
                aria-label="Next"
                size="icon"
                variant="ghost"
                onClick={() => setFocusDate(step(focusDate, viewMode, 1))}
              >
                <ChevronRight size={ICON.lg} strokeWidth={ICON_STROKE} />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPanel('create')
                  if (viewMode === 'year') setViewMode('day')
                }}
              >
                New event
              </Button>
            </Toolbar>
          }
        >
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
            {viewMode === 'month' ? (
              <MonthView
                days={days}
                events={events}
                focusDate={focusDate}
                selectedEventId={selectedEventId}
                onSelectDate={handleSelectDate}
                onSelectEvent={handleSelectEvent}
              />
            ) : null}
            {viewMode === 'fourWeek' ? (
              <div className="four-week-view">
                <FourWeekView
                  days={days}
                  events={events}
                  focusDate={focusDate}
                  selectedEventId={selectedEventId}
                  onSelectDate={handleSelectDate}
                  onSelectEvent={handleSelectEvent}
                />
              </div>
            ) : null}
            {viewMode === 'week' ? (
              <WeekView
                days={days}
                events={events}
                focusDate={focusDate}
                selectedEventId={selectedEventId}
                onSelectDate={handleSelectDate}
                onSelectEvent={handleSelectEvent}
              />
            ) : null}
            {viewMode === 'day' ? (
              <DayView
                days={days}
                events={events}
                focusDate={focusDate}
                selectedEventId={selectedEventId}
                onSelectDate={handleSelectDate}
                onSelectEvent={handleSelectEvent}
              />
            ) : null}
            {viewMode === 'year' ? (
              <YearView months={months} focusDate={focusDate} onSelectDate={handleSelectDate} />
            ) : null}

            {viewMode !== 'year' ? (
              <div className="calendar-split">
                <EventAgenda events={agendaEvents} selectedId={selected?.id} onSelect={handleSelectEvent} />
                <section className="calendar-detail reader-panel">
                  <EventDetail event={selected} onEdit={() => setPanel('edit')} />
                </section>
              </div>
            ) : null}
          </QueryState>
        </Panel>

        {panel === 'create' || panel === 'edit' ? (
          <EventFormPanel
            key={panel === 'edit' ? selected?.id : `new-${focusDate}`}
            event={panel === 'edit' ? selected : undefined}
          />
        ) : null}

        {panel === 'view' && selected ? (
          <Modal
            open
            onClose={() => setPanel('none')}
            eyebrow={selected.dayLabel}
            title={selected.title || '(untitled)'}
            footer={
              <>
                <Button variant="ghost" onClick={handleDelete} disabled={remove.isPending}>
                  {remove.isPending ? <Spinner size={ICON.md} /> : <Trash2 size={ICON.md} strokeWidth={ICON_STROKE} />}
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setPanel('edit')}>
                  <Pencil size={ICON.md} strokeWidth={ICON_STROKE} />
                  Edit
                </Button>
              </>
            }
          >
            <EventDetail event={selected} />
            {remove.error ? (
              <p className="ui-form-error" role="alert">
                {remove.error.message}
              </p>
            ) : null}
          </Modal>
        ) : null}
      </main>
    </AppShell>
  )
}
