import ICAL from 'ical.js'
import type { DavObject } from './dav'
import type { Attendee, CalendarEvent, Contact, Typed } from '../types'

// All-day values are date-only; everything else is a UTC instant. `end` stays exclusive, per RFC 5545.
const isoOf = (t: ICAL.Time) => (t.isDate ? t.toString() : t.toJSDate().toISOString())

// vCard 3 stacks transport types onto labels (TEL;TYPE=VOICE;TYPE=HOME); keep the label.
const NON_LABEL_TYPES = new Set(['internet', 'pref', 'voice'])

const labelType = (prop: ICAL.Property) => {
  const raw = prop.getParameter('type')
  const types = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((t) => String(t).toLowerCase())
  return types.find((t) => !NON_LABEL_TYPES.has(t)) ?? types[0]
}

const toAttendee = (prop: ICAL.Property): Attendee => {
  const value = String(prop.getFirstValue() ?? '')
  const cn = prop.getParameter('cn')
  const partstat = prop.getParameter('partstat')
  return {
    name: typeof cn === 'string' ? cn : undefined,
    email: value.replace(/^mailto:/i, '') || undefined,
    status: typeof partstat === 'string' ? partstat.toLowerCase() : undefined,
  }
}

const flatten = (value: unknown): string | undefined => {
  const text = Array.isArray(value) ? value.flat(Infinity).filter(Boolean).join(' ') : value
  const trimmed = typeof text === 'string' ? text.trim() : ''
  return trimmed || undefined
}

const buildEvent = (event: ICAL.Event, start: ICAL.Time, end: ICAL.Time, source: DavObject, recurrenceId?: ICAL.Time): CalendarEvent => {
  const organizer = event.component.getFirstProperty('organizer')
  return {
    id: recurrenceId ? `${event.uid}_${recurrenceId.toString()}` : event.uid,
    title: event.summary ?? '',
    start: isoOf(start),
    end: isoOf(end),
    allDay: start.isDate,
    location: event.location || undefined,
    description: event.description || undefined,
    organizer: organizer ? toAttendee(organizer) : undefined,
    attendees: event.attendees.map(toAttendee),
    recurring: Boolean(recurrenceId) || event.isRecurring(),
    url: source.url,
    etag: source.etag,
  }
}

export const parseEvents = (source: DavObject, range?: { start: Date; end: Date }): CalendarEvent[] => {
  const root = new ICAL.Component(ICAL.parse(source.data))

  // SmarterMail ships VTIMEZONE blocks inline; register them or TZID-bearing times resolve as floating.
  for (const vtimezone of root.getAllSubcomponents('vtimezone')) {
    const tzid = vtimezone.getFirstPropertyValue('tzid')
    if (typeof tzid === 'string' && !ICAL.TimezoneService.has(tzid)) {
      ICAL.TimezoneService.register(vtimezone)
    }
  }

  const vevents = root.getAllSubcomponents('vevent')
  const overrides = new Set(
    vevents.filter((v) => v.hasProperty('recurrence-id')).map((v) => String(v.getFirstPropertyValue('recurrence-id'))),
  )

  return vevents.flatMap((vevent) => {
    const event = new ICAL.Event(vevent)
    // A modified occurrence is its own VEVENT keyed by RECURRENCE-ID, and carries no RRULE.
    const recurrenceId = vevent.getFirstPropertyValue('recurrence-id') as ICAL.Time | null
    if (recurrenceId) return [buildEvent(event, event.startDate, event.endDate, source, recurrenceId)]
    if (!event.isRecurring() || !range) return [buildEvent(event, event.startDate, event.endDate, source)]
    return expand(event, source, range, overrides)
  })
}

const MAX_OCCURRENCES = 1000

const expand = (event: ICAL.Event, source: DavObject, range: { start: Date; end: Date }, overrides: Set<string>) => {
  const rangeStart = ICAL.Time.fromJSDate(range.start, true)
  const rangeEnd = ICAL.Time.fromJSDate(range.end, true)
  const iterator = event.iterator()
  const occurrences: CalendarEvent[] = []

  for (let i = 0, next = iterator.next(); next && i < MAX_OCCURRENCES; i++, next = iterator.next()) {
    if (next.compare(rangeEnd) > 0) break
    const detail = event.getOccurrenceDetails(next)
    if (detail.endDate.compare(rangeStart) <= 0) continue
    // A modified instance is carried by its own VEVENT; skip the generated one.
    if (overrides.has(next.toString())) continue
    occurrences.push(buildEvent(event, detail.startDate, detail.endDate, source, next))
  }
  return occurrences
}

export const parseContact = (source: DavObject): Contact | null => {
  const card = new ICAL.Component(ICAL.parse(source.data))
  const uid = card.getFirstPropertyValue('uid')
  const structuredName = card.getFirstPropertyValue('n') as unknown

  const [lastName, firstName] = Array.isArray(structuredName) ? structuredName.map((part) => flatten(part)) : []
  const name = flatten(card.getFirstPropertyValue('fn')) ?? [firstName, lastName].filter(Boolean).join(' ')
  if (!name) return null

  const typed = (kind: string): Typed[] =>
    card
      .getAllProperties(kind)
      .map((prop) => ({ value: String(prop.getFirstValue() ?? '').replace(/^mailto:/i, ''), type: labelType(prop) }))
      .filter((entry) => entry.value)

  return {
    id: typeof uid === 'string' ? uid : source.url,
    name,
    firstName,
    lastName,
    emails: typed('email'),
    phones: typed('tel'),
    organization: flatten(card.getFirstPropertyValue('org')),
    title: flatten(card.getFirstPropertyValue('title')),
    note: flatten(card.getFirstPropertyValue('note')),
    url: source.url,
    etag: source.etag,
  }
}

export const parseContacts = (sources: DavObject[]) => sources.map(parseContact).filter((c): c is Contact => c !== null)
