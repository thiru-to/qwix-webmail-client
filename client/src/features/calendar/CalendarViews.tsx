import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  HOURS,
  WEEKDAYS,
  dateFromIso,
  eventsOnDate,
  type CalendarDay,
  type EventView,
} from '../../lib/calendar'

type GridProps = {
  days: CalendarDay[]
  events: EventView[]
  focusDate: string
  selectedEventId: string
  onSelectDate: (date: string) => void
  onSelectEvent: (id: string) => void
}

export function MonthView({ days, events, focusDate, selectedEventId, onSelectDate, onSelectEvent }: GridProps) {
  return (
    <div className="calendar-view month-view">
      <div className="calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid month-grid">
        {days.map((day) => {
          const dayEvents = eventsOnDate(events, day.date)
          return (
            <div
              key={day.date}
              className={[
                'calendar-day',
                day.inMonth ? '' : 'out-month',
                day.isToday ? 'current' : '',
                day.date === focusDate ? 'focused' : '',
                dayEvents.length ? 'has-events' : '',
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

export function FourWeekView(props: GridProps) {
  return <MonthView {...props} />
}

const GRID_START = GRID_START_HOUR * 60
const GRID_END = GRID_END_HOUR * 60
const GRID_SPAN = GRID_END - GRID_START

function eventStyle(event: EventView) {
  const top = ((Math.max(event.startMinutes, GRID_START) - GRID_START) / GRID_SPAN) * 100
  const bottom = ((GRID_END - Math.min(event.endMinutes, GRID_END)) / GRID_SPAN) * 100
  return { top: `${Math.max(top, 0)}%`, bottom: `${Math.max(bottom, 0)}%` }
}

export function WeekView({ days, events, focusDate, selectedEventId, onSelectDate, onSelectEvent }: GridProps) {
  const allDay = events.filter((event) => event.allDay)

  return (
    <div className="calendar-view week-view">
      <div className="time-grid-header">
        <span className="time-gutter-spacer" />
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`time-grid-day-head ${day.isToday ? 'current' : ''} ${day.date === focusDate ? 'focused' : ''}`}
            onClick={() => onSelectDate(day.date)}
          >
            <span>{WEEKDAYS[dateFromIso(day.date).getDay()]}</span>
            <strong>{day.dayOfMonth}</strong>
          </button>
        ))}
      </div>

      {allDay.length ? (
        <div className="time-grid-allday">
          <span className="time-gutter-spacer">All day</span>
          {days.map((day) => (
            <div key={day.date} className="allday-cell">
              {eventsOnDate(allDay, day.date).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={`calendar-pill ${event.tone} ${event.id === selectedEventId ? 'selected' : ''}`}
                  onClick={() => onSelectEvent(event.id)}
                >
                  {event.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      <div className="time-grid-body">
        <div className="time-gutter">
          {HOURS.map((hour) => (
            <div key={hour} className="time-gutter-slot">
              {hour}
            </div>
          ))}
        </div>
        <div className="time-columns" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((day) => (
            <div key={day.date} className="time-column">
              {HOURS.map((hour) => (
                <div key={hour} className="time-slot" />
              ))}
              {eventsOnDate(events, day.date)
                .filter((event) => !event.allDay)
                .map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={`time-event ${event.tone} ${event.id === selectedEventId ? 'selected' : ''}`}
                    style={eventStyle(event)}
                    onClick={() => onSelectEvent(event.id)}
                  >
                    <strong>{event.title}</strong>
                    <span>{event.timeLabel}</span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DayView(props: GridProps) {
  return (
    <div className="calendar-view day-view">
      <WeekView {...props} />
    </div>
  )
}

type YearViewProps = {
  months: { label: string; month: number; days: CalendarDay[] }[]
  focusDate: string
  onSelectDate: (date: string) => void
}

export function YearView({ months, focusDate, onSelectDate }: YearViewProps) {
  return (
    <div className="calendar-view year-view">
      <div className="year-grid">
        {months.map((month) => (
          <section key={month.label} className="year-month">
            <h3>{month.label}</h3>
            <div className="year-weekdays">
              {WEEKDAYS.map((day) => (
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
