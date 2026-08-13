import type { Attendee } from '@api/types'
import { MapPin, Pencil, Repeat } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { List, ListRow } from '../../components/ui/list'
import { LabelChips } from '../labels/LabelChips'
import { LabelPicker } from '../labels/LabelPicker'
import type { EventView } from '../../lib/calendar'
import { ICON, ICON_STROKE } from '../../lib/icons'

const attendeeLabel = (attendee: Attendee) => attendee.name ?? attendee.email ?? 'Unknown'

export function EventRow({
  event,
  selected,
  onSelect,
}: {
  event: EventView
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
        <h2>{event.title || '(untitled)'}</h2>
        <time>{event.dayLabel}</time>
      </div>
      <p>{event.timeLabel}</p>
      <div className="sender-name">{event.location ?? ''}</div>
    </ListRow>
  )
}

// `heading` off inside a dialog, whose own header already carries the date and title.
export function EventDetail({
  event,
  onEdit,
  heading = true,
}: {
  event?: EventView
  onEdit?: () => void
  heading?: boolean
}) {
  if (!event) {
    return <p className="loading-state">Select an event to preview it.</p>
  }

  return (
    <>
      {heading ? (
      <div className="calendar-detail-head">
        <div>
          <div className="eyebrow">{event.dayLabel}</div>
          <h2>{event.title || '(untitled)'}</h2>
        </div>
        {onEdit ? (
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil size={ICON.md} strokeWidth={ICON_STROKE} /> Edit
          </Button>
        ) : null}
      </div>
      ) : null}
      <p className="calendar-detail-meta">
        {event.timeLabel}
        {event.recurring ? <Repeat size={ICON.sm} strokeWidth={ICON_STROKE} /> : null}
      </p>
      {event.location ? (
        <p className="calendar-detail-meta">
          <MapPin size={ICON.sm} strokeWidth={ICON_STROKE} /> {event.location}
        </p>
      ) : null}
      {event.attendees.length ? (
        <div className="calendar-attendees">
          {event.attendees.map((attendee) => (
            <span key={attendee.email ?? attendeeLabel(attendee)}>{attendeeLabel(attendee)}</span>
          ))}
        </div>
      ) : null}
      <div className="detail-labels">
        <LabelPicker kind="event" resourceId={event.id} active={event.labelIds} />
        <LabelChips ids={event.labelIds} />
      </div>
      {event.description ? (
        <div className="message-body">
          <p>{event.description}</p>
        </div>
      ) : null}
    </>
  )
}

export function EventAgenda({
  events,
  selectedId,
  onSelect,
}: {
  events: EventView[]
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
