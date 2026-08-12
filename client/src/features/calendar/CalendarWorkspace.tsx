import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, CalendarRange, CalendarClock, Grid3x3, MapPin, Sun, Users } from 'lucide-react'
import { AppShell, ThemeToggle } from '../../components/shell/AppShell'
import { Panel } from '../../components/ui/panel'
import { Toolbar } from '../../components/ui/toolbar'
import { QueryState } from '../../components/ui/query-state'
import { SkeletonRow } from '../../components/ui/skeleton'
import { Button } from '../../components/ui/button'
import { calendarQueries } from './queries'
import { DayView, FourWeekView, MonthView, WeekView, YearView } from './CalendarViews'
import { EventFormPanel } from './EventFormPanel'
import { EventAgenda, EventDetail } from './EventWidgets'
import { eventsForDate, eventsForDates } from '../../data/mockCalendar'
import {
  calendarViewOptions,
  useCalendarUiStore,
  type CalendarViewMode,
} from '../../stores/calendarUiStore'
import './calendar.css'

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

export function CalendarWorkspace() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(calendarQueries.calendar())
  const viewMode = useCalendarUiStore((state) => state.viewMode)
  const setViewMode = useCalendarUiStore((state) => state.setViewMode)
  const focusDate = useCalendarUiStore((state) => state.focusDate)
  const setFocusDate = useCalendarUiStore((state) => state.setFocusDate)
  const selectedEventId = useCalendarUiStore((state) => state.selectedEventId)
  const setSelectedEventId = useCalendarUiStore((state) => state.setSelectedEventId)
  const createOpen = useCalendarUiStore((state) => state.createOpen)
  const setCreateOpen = useCalendarUiStore((state) => state.setCreateOpen)

  const selected = data?.events.find((event) => event.id === selectedEventId) ?? data?.events[0]

  const title = useMemo(() => {
    if (!data) return 'Calendar'
    if (viewMode === 'year') return String(data.year)
    if (viewMode === 'day') {
      const day = data.monthDays.find((item) => item.date === focusDate)
      return day
        ? new Date(`${focusDate}T12:00:00`).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : data.monthLabel
    }
    if (viewMode === 'week') {
      const start = data.weekDays[0]
      const end = data.weekDays[6]
      return `${start?.dayOfMonth ?? ''} – ${end?.dayOfMonth ?? ''} ${data.monthLabel}`
    }
    if (viewMode === 'fourWeek') return `4 weeks · ${data.monthLabel}`
    return data.monthLabel
  }, [data, focusDate, viewMode])

  const agendaEvents = useMemo(() => {
    if (!data) return []
    if (viewMode === 'day') return eventsForDate(data.events, focusDate)
    if (viewMode === 'week') return eventsForDates(
      data.events,
      data.weekDays.map((day) => day.date),
    )
    if (viewMode === 'fourWeek') {
      return eventsForDates(
        data.events,
        data.fourWeekDays.map((day) => day.date),
      )
    }
    if (viewMode === 'year') return data.events
    return eventsForDates(
      data.events,
      data.monthDays.filter((day) => day.inMonth).map((day) => day.date),
    )
  }, [data, focusDate, viewMode])

  function handleSelectDate(date: string) {
    setFocusDate(date)
    if (viewMode === 'year') setViewMode('day')
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
                type="button"
                onClick={() => setViewMode(id)}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span>{label}</span>
              </button>
            )
          })}
          <div className="sidebar-section">
            <button className="folder-item" type="button">
              <Users size={18} strokeWidth={1.75} />
              <span>Team</span>
            </button>
            <button className="folder-item" type="button">
              <MapPin size={18} strokeWidth={1.75} />
              <span>Rooms</span>
            </button>
          </div>
        </nav>
      }
      dock={
        <div className="sidebar-controls">
          <ThemeToggle />
        </div>
      }
    >
      <main className="inbox-column calendar-main">
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
          {data ? (
            <Panel
              eyebrow={viewTitles[viewMode]}
              title={title}
              description="Switch views from the sidebar or the toolbar. Events come from the mock API."
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
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFocusDate(data.focusDate)
                      setViewMode('day')
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCreateOpen(true)
                      if (viewMode === 'year') setViewMode('day')
                    }}
                  >
                    New event
                  </Button>
                </Toolbar>
              }
            >
              {viewMode === 'month' ? (
                <MonthView
                  data={data}
                  days={data.monthDays}
                  focusDate={focusDate}
                  selectedEventId={selectedEventId}
                  onSelectDate={handleSelectDate}
                  onSelectEvent={setSelectedEventId}
                />
              ) : null}
              {viewMode === 'fourWeek' ? (
                <div className="four-week-view">
                  <FourWeekView
                    data={data}
                    days={data.fourWeekDays}
                    focusDate={focusDate}
                    selectedEventId={selectedEventId}
                    onSelectDate={handleSelectDate}
                    onSelectEvent={setSelectedEventId}
                  />
                </div>
              ) : null}
              {viewMode === 'week' ? (
                <WeekView
                  data={data}
                  days={data.weekDays}
                  events={data.events}
                  selectedEventId={selectedEventId}
                  onSelectDate={handleSelectDate}
                  onSelectEvent={setSelectedEventId}
                />
              ) : null}
              {viewMode === 'day' ? (
                <DayView
                  data={data}
                  days={data.monthDays.filter((day) => day.date === focusDate)}
                  events={data.events}
                  selectedEventId={selectedEventId}
                  onSelectDate={handleSelectDate}
                  onSelectEvent={setSelectedEventId}
                />
              ) : null}
              {viewMode === 'year' ? (
                <YearView data={data} focusDate={focusDate} onSelectDate={handleSelectDate} />
              ) : null}

              {viewMode !== 'year' ? (
                <div className="calendar-split">
                  <EventAgenda
                    events={agendaEvents}
                    selectedId={selected?.id}
                    onSelect={setSelectedEventId}
                  />
                  {createOpen ? (
                    <EventFormPanel />
                  ) : (
                    <section className="calendar-detail reader-panel">
                      <EventDetail event={selected} />
                    </section>
                  )}
                </div>
              ) : null}
            </Panel>
          ) : null}
        </QueryState>
      </main>
    </AppShell>
  )
}
