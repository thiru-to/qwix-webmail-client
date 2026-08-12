import type { CalendarEvent } from '../../data/mockCalendar'
import { List, ListRow } from '../../components/ui/list'
import { MapPin } from 'lucide-react'

export function EventRow({
  event,
  selected,
  onSelect,
}: {
  event: CalendarEvent
  selected: boolean
  onSelect: () => void
}) {
  return (
    <ListRow
      className="calendar-event-row"
      selected={selected}
      onSelect={onSelect}
      leading={<span className={`event-dot ${event.tone}`} />}
    >
      <div className="mail-card-topline">
        <h2>{event.title}</h2>
        <time>{event.day}</time>
      </div>
      <p>{event.time}</p>
      <div className="sender-name">{event.location}</div>
    </ListRow>
  )
}

export function EventDetail({ event }: { event?: CalendarEvent }) {
  if (!event) {
    return <p className="loading-state">Select an event to preview it.</p>
  }

  return (
    <>
      <div className="eyebrow">{event.day}</div>
      <h2>{event.title}</h2>
      <p className="calendar-detail-meta">{event.time}</p>
      <p className="calendar-detail-meta">
        <MapPin size={14} strokeWidth={1.75} /> {event.location}
      </p>
      <div className="calendar-attendees">
        {event.attendees.map((person) => (
          <span key={person}>{person}</span>
        ))}
      </div>
    </>
  )
}

export function EventAgenda({
  events,
  selectedId,
  onSelect,
}: {
  events: CalendarEvent[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  if (events.length === 0) {
    return <div className="loading-state">No events in this range.</div>
  }

  return (
    <List label="Events" className="calendar-events">
      {events.map((event) => (
        <EventRow
          key={event.id}
          event={event}
          selected={event.id === selectedId}
          onSelect={() => onSelect(event.id)}
        />
      ))}
    </List>
  )
}
