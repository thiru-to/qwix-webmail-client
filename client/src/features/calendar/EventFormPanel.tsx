import { useState, type FormEvent } from 'react'
import { CalendarPlus } from 'lucide-react'
import type { EventView } from '../../lib/calendar'
import { Button } from '../../components/ui/button'
import { ChipInput } from '../../components/ui/chip-input'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { Modal } from '../../components/ui/modal'
import { Spinner } from '../../components/ui/spinner'
import { TextArea } from '../../components/ui/textarea'
import { localInstant, minutesToTimeInput, timeInputToMinutes } from '../../lib/calendar'
import { useCalendarUiStore } from '../../stores/calendarUiStore'
import { useCreateEvent, useUpdateEvent } from './mutations'
import { ICON, ICON_STROKE } from '../../lib/icons'

type ValidationErrors = Partial<Record<'title' | 'date' | 'endMinutes', string>>

const DEFAULT_START_MINUTES = 10 * 60

export function EventFormPanel({ event: editing }: { event?: EventView }) {
  const focusDate = useCalendarUiStore((state) => state.focusDate)
  const setPanel = useCalendarUiStore((state) => state.setPanel)
  const [title, setTitle] = useState(editing?.title ?? '')
  const [date, setDate] = useState(editing?.dateKey ?? focusDate)
  const [startMinutes, setStartMinutes] = useState(editing?.startMinutes ?? DEFAULT_START_MINUTES)
  const [endMinutes, setEndMinutes] = useState(editing?.endMinutes ?? DEFAULT_START_MINUTES + 60)
  const [location, setLocation] = useState(editing?.location ?? '')
  const [attendees, setAttendees] = useState<string[]>(
    editing?.attendees.map((attendee) => attendee.email ?? '').filter(Boolean) ?? [],
  )
  const [description, setDescription] = useState(editing?.description ?? '')
  const [validation, setValidation] = useState<ValidationErrors>({})

  const create = useCreateEvent()
  const update = useUpdateEvent()
  const { isPending, error } = editing ? update : create

  function closePanel() {
    setPanel('none')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextValidation: ValidationErrors = {
      ...(!title.trim() && { title: 'Add an event title.' }),
      ...(!date && { date: 'Choose an event date.' }),
      ...(endMinutes <= startMinutes && { endMinutes: 'End time must be after start time.' }),
    }

    setValidation(nextValidation)
    if (Object.keys(nextValidation).length > 0) return

    const input = {
      title: title.trim(),
      start: localInstant(date, startMinutes),
      end: localInstant(date, endMinutes),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      attendees: attendees.map((email) => ({ email })),
    }

    try {
      if (editing) await update.mutateAsync({ ...input, url: editing.url, etag: editing.etag })
      else await create.mutateAsync(input)
    } catch {
      // The mutation error is rendered inline below the form.
    }
  }

  return (
    <Modal
      open
      onClose={closePanel}
      eyebrow="Calendar"
      title={editing ? 'Edit event' : 'New event'}
      className="calendar-event-form-panel"
      footer={
        <div className="calendar-event-form-actions">
          <Button type="submit" form="event-create-form" disabled={isPending}>
            {isPending ? <Spinner size={ICON.md} /> : null}
            Save event <CalendarPlus size={ICON.md} strokeWidth={ICON_STROKE} />
          </Button>
          <Button type="button" variant="ghost" onClick={closePanel} disabled={isPending}>
            Cancel
          </Button>
        </div>
      }
    >
      <form
        id="event-create-form"
        className="calendar-event-form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        {editing?.recurring ? (
          <p className="form-note">This event repeats — saving changes every occurrence in the series.</p>
        ) : null}
        <FormField label="Title" htmlFor="event-title" error={validation.title}>
          <Input
            id="event-title"
            autoFocus
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              setValidation((current) => ({ ...current, title: undefined }))
            }}
            placeholder="Event title"
          />
        </FormField>
        <FormField label="Date" htmlFor="event-date" error={validation.date}>
          <Input
            id="event-date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setValidation((current) => ({ ...current, date: undefined }))
            }}
          />
        </FormField>
        <div className="calendar-event-time-fields">
          <FormField label="Starts" htmlFor="event-start">
            <Input
              id="event-start"
              type="time"
              value={minutesToTimeInput(startMinutes)}
              onChange={(event) => {
                setStartMinutes(timeInputToMinutes(event.target.value))
                setValidation((current) => ({ ...current, endMinutes: undefined }))
              }}
            />
          </FormField>
          <FormField label="Ends" htmlFor="event-end" error={validation.endMinutes}>
            <Input
              id="event-end"
              type="time"
              value={minutesToTimeInput(endMinutes)}
              onChange={(event) => {
                setEndMinutes(timeInputToMinutes(event.target.value))
                setValidation((current) => ({ ...current, endMinutes: undefined }))
              }}
            />
          </FormField>
        </div>
        <FormField label="Location" htmlFor="event-location">
          <Input
            id="event-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Room or video link"
          />
        </FormField>
        <FormField label="Attendees" htmlFor="event-attendees">
          <ChipInput
            id="event-attendees"
            label="Event attendees"
            value={attendees}
            onChange={setAttendees}
            placeholder="Add an email and press Enter"
          />
        </FormField>
        <FormField label="Description" htmlFor="event-notes">
          <TextArea
            id="event-notes"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add event notes…"
          />
        </FormField>
        {error ? (
          <p className="ui-form-error" role="alert">
            {error.message}
          </p>
        ) : null}
      </form>
    </Modal>
  )
}
