import { useState, type FormEvent } from 'react'
import { CalendarPlus } from 'lucide-react'
import type { CreateEventInput } from '../../api/calendar'
import { Button } from '../../components/ui/button'
import { ChipInput } from '../../components/ui/chip-input'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { SidePanel } from '../../components/ui/side-panel'
import { Spinner } from '../../components/ui/spinner'
import { TextArea } from '../../components/ui/textarea'
import { TonePicker } from '../../components/ui/tone-picker'
import { useCalendarUiStore } from '../../stores/calendarUiStore'
import { useCreateEvent } from './mutations'

type ValidationErrors = Partial<Record<'title' | 'date' | 'endMinutes', string>>

const defaultStartMinutes = 10 * 60
const toneOptions = [
  { id: 'rose', label: 'Rose' },
  { id: 'green', label: 'Green' },
  { id: 'purple', label: 'Purple' },
  { id: 'orange', label: 'Orange' },
] satisfies { id: CreateEventInput['tone']; label: string }[]

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

function minutesToTimeInput(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function EventFormPanel() {
  const focusDate = useCalendarUiStore((state) => state.focusDate)
  const setCreateOpen = useCalendarUiStore((state) => state.setCreateOpen)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(focusDate)
  const [startMinutes, setStartMinutes] = useState(defaultStartMinutes)
  const [endMinutes, setEndMinutes] = useState(defaultStartMinutes + 60)
  const [location, setLocation] = useState('')
  const [attendees, setAttendees] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [tone, setTone] = useState<CreateEventInput['tone']>('rose')
  const [validation, setValidation] = useState<ValidationErrors>({})
  const { mutateAsync, isPending, error } = useCreateEvent()

  function closePanel() {
    setCreateOpen(false)
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

    try {
      await mutateAsync({
        title,
        date,
        startMinutes,
        endMinutes,
        location,
        attendees,
        notes,
        tone,
      })
    } catch {
      // The mutation error is rendered inline below the form.
    }
  }

  return (
    <SidePanel
      open
      onClose={closePanel}
      eyebrow="Calendar"
      title="New event"
      className="calendar-event-form-panel"
      footer={
        <div className="calendar-event-form-actions">
          <Button type="submit" form="event-create-form" disabled={isPending}>
            {isPending ? <Spinner size={14} /> : null}
            Save event <CalendarPlus size={15} strokeWidth={1.75} />
          </Button>
          <Button type="button" variant="ghost" onClick={closePanel} disabled={isPending}>
            Discard
          </Button>
        </div>
      }
    >
      <form
        id="event-create-form"
        className="calendar-event-form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <FormField label="Title" htmlFor="event-title" error={validation.title}>
          <Input
            id="event-title"
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Event title"
          />
        </FormField>
        <FormField label="Date" htmlFor="event-date" error={validation.date}>
          <Input
            id="event-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </FormField>
        <div className="calendar-event-time-fields">
          <FormField label="Starts" htmlFor="event-start">
            <Input
              id="event-start"
              type="time"
              value={minutesToTimeInput(startMinutes)}
              onChange={(event) => setStartMinutes(parseTimeToMinutes(event.target.value))}
            />
          </FormField>
          <FormField label="Ends" htmlFor="event-end" error={validation.endMinutes}>
            <Input
              id="event-end"
              type="time"
              value={minutesToTimeInput(endMinutes)}
              onChange={(event) => setEndMinutes(parseTimeToMinutes(event.target.value))}
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
            placeholder="Add attendee and press Enter"
          />
        </FormField>
        <FormField label="Notes" htmlFor="event-notes">
          <TextArea
            id="event-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add event notes…"
          />
        </FormField>
        <FormField label="Color" htmlFor="event-tone">
          <TonePicker
            value={tone}
            onChange={(value) => setTone(value as CreateEventInput['tone'])}
            options={toneOptions}
            label="Event color"
          />
        </FormField>
        {error ? (
          <p className="calendar-event-form-error" role="alert">
            {error.message}
          </p>
        ) : null}
      </form>
    </SidePanel>
  )
}
