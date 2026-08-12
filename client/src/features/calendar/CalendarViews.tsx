import type { CalendarData, CalendarDay, CalendarEvent } from '../../data/mockCalendar'
import { eventsForDate } from '../../data/mockCalendar'

type MonthViewProps = {
  data: CalendarData
  days: CalendarDay[]
  focusDate: string
  onSelectDate: (date: string) => void
  onSelectEvent: (id: string) => void
  selectedEventId: string
}

export function MonthView({
  data,
  days,
  focusDate,
  onSelectDate,
  onSelectEvent,
  selectedEventId,
}: MonthViewProps) {
  return (
    <div className="calendar-view month-view">
      <div className="calendar-weekdays">
        {data.weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid month-grid">
        {days.map((day) => {
          const dayEvents = eventsForDate(data.events, day.date)
          return (
            <div
              key={day.date}
              className={[
                'calendar-day',
                day.inMonth ? '' : 'out-month',
                day.isToday ? 'current' : '',
                day.date === focusDate ? 'focused' : '',
                day.hasEvents ? 'has-events' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(day.date)}
            >
              <button
                type="button"
                className="calendar-day-select"
                aria-label={`Select ${day.date}`}
                aria-pressed={day.date === focusDate}
                onClick={(click) => {
                  click.stopPropagation()
                  onSelectDate(day.date)
                }}
              >
                <span className="calendar-day-number">{day.dayOfMonth}</span>
              </button>
              <div className="calendar-day-events">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={`calendar-pill ${event.tone} ${event.id === selectedEventId ? 'selected' : ''}`}
                    onClick={(click) => {
                      click.stopPropagation()
                      onSelectEvent(event.id)
                    }}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 ? (
                  <span className="calendar-more">+{dayEvents.length - 3} more</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FourWeekView(props: MonthViewProps) {
  return <MonthView {...props} />
}

type TimeGridProps = {
  data: CalendarData
  days: CalendarDay[]
  events: CalendarEvent[]
  selectedEventId: string
  onSelectEvent: (id: string) => void
  onSelectDate: (date: string) => void
}

const GRID_START = 8 * 60
const GRID_END = 18 * 60
const GRID_SPAN = GRID_END - GRID_START

function eventStyle(event: CalendarEvent) {
  const top = ((Math.max(event.startMinutes, GRID_START) - GRID_START) / GRID_SPAN) * 100
  const bottom = ((GRID_END - Math.min(event.endMinutes, GRID_END)) / GRID_SPAN) * 100
  return {
    top: `${top}%`,
    bottom: `${Math.max(bottom, 0)}%`,
  }
}

export function WeekView({ data, days, events, selectedEventId, onSelectEvent, onSelectDate }: TimeGridProps) {
  return (
    <div className="calendar-view week-view">
      <div className="time-grid-header">
        <span className="time-gutter-spacer" />
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`time-grid-day-head ${day.isToday ? 'current' : ''} ${day.date === data.focusDate ? 'focused' : ''}`}
            onClick={() => onSelectDate(day.date)}
          >
            <span>{data.weekdays[new Date(`${day.date}T12:00:00`).getDay()]}</span>
            <strong>{day.dayOfMonth}</strong>
          </button>
        ))}
      </div>
      <div className="time-grid-body">
        <div className="time-gutter">
          {data.hours.map((hour) => (
            <div key={hour} className="time-gutter-slot">
              {hour}
            </div>
          ))}
        </div>
        <div className="time-columns" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((day) => {
            const dayEvents = events.filter((event) => event.date === day.date)
            return (
              <div key={day.date} className="time-column">
                {data.hours.map((hour) => (
                  <div key={hour} className="time-slot" />
                ))}
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={`time-event ${event.tone} ${event.id === selectedEventId ? 'selected' : ''}`}
                    style={eventStyle(event)}
                    onClick={() => onSelectEvent(event.id)}
                  >
                    <strong>{event.title}</strong>
                    <span>{event.time}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function DayView({ data, days, events, selectedEventId, onSelectEvent, onSelectDate }: TimeGridProps) {
  return (
    <div className="calendar-view day-view">
      <WeekView
        data={data}
        days={days}
        events={events}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        onSelectDate={onSelectDate}
      />
    </div>
  )
}

type YearViewProps = {
  data: CalendarData
  focusDate: string
  onSelectDate: (date: string) => void
}

export function YearView({ data, focusDate, onSelectDate }: YearViewProps) {
  return (
    <div className="calendar-view year-view">
      <div className="year-grid">
        {data.yearMonths.map((month) => (
          <section key={month.label} className="year-month">
            <h3>{month.label}</h3>
            <div className="year-weekdays">
              {data.weekdays.map((day) => (
                <span key={day}>{day[0]}</span>
              ))}
            </div>
            <div className="year-days">
              {month.days.map((day) => (
                <button
                  key={`${month.label}-${day.date}`}
                  type="button"
                  className={[
                    'year-day',
                    day.inMonth ? '' : 'out-month',
                    day.isToday ? 'current' : '',
                    day.date === focusDate ? 'focused' : '',
                    day.hasEvents ? 'has-events' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSelectDate(day.date)}
                >
                  {day.dayOfMonth}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
