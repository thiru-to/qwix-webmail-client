import ICAL from 'ical.js'
import type { ContactInput, EventInput, Typed } from '../types'

// vCard 3.0, not 4.0: every CardDAV server in the catalogue reads it, and `parse.ts` expects it.
const VCARD_VERSION = '3.0'
const PRODID = '-//Qwix//Webmail//EN'

// Rewritten wholesale on every edit. Anything outside these lists (ADR, BDAY, RRULE, alarms…) is
// left exactly as the server had it, so editing a contact or event never silently drops fields.
const CONTACT_PROPERTIES = ['fn', 'n', 'email', 'tel', 'org', 'title', 'note']
const EVENT_PROPERTIES = ['summary', 'location', 'description', 'attendee']

const typedProperties = (card: ICAL.Component, name: string, entries: Typed[] = []) => {
  for (const { value, type } of entries) {
    if (!value) continue
    const property = new ICAL.Property(name, card)
    property.setValue(value)
    if (type) property.setParameter('type', type)
    card.addProperty(property)
  }
}

function writeContact(card: ICAL.Component, input: ContactInput) {
  for (const property of CONTACT_PROPERTIES) card.removeAllProperties(property)

  card.addPropertyWithValue('fn', input.name)
  card.addPropertyWithValue('n', [input.lastName ?? '', input.firstName ?? '', '', '', ''])
  typedProperties(card, 'email', input.emails)
  typedProperties(card, 'tel', input.phones)
  if (input.organization) card.addPropertyWithValue('org', input.organization)
  if (input.title) card.addPropertyWithValue('title', input.title)
  if (input.note) card.addPropertyWithValue('note', input.note)
}

export const buildVCard = (uid: string, input: ContactInput) => {
  const card = new ICAL.Component('vcard')
  card.addPropertyWithValue('version', VCARD_VERSION)
  card.addPropertyWithValue('uid', uid)
  writeContact(card, input)
  return card.toString()
}

export const updateVCard = (existing: string, input: ContactInput) => {
  const card = new ICAL.Component(ICAL.parse(existing))
  writeContact(card, input)
  return card.toString()
}

// An all-day boundary is a floating date; anything else is pinned to UTC, matching what `parse.ts` reads back.
const boundary = (value: string, allDay: boolean) =>
  allDay ? ICAL.Time.fromDateString(value.slice(0, 10)) : ICAL.Time.fromJSDate(new Date(value), true)

function writeEvent(component: ICAL.Component, input: EventInput) {
  for (const property of EVENT_PROPERTIES) component.removeAllProperties(property)

  const event = new ICAL.Event(component)
  event.summary = input.title
  event.startDate = boundary(input.start, Boolean(input.allDay))
  event.endDate = boundary(input.end, Boolean(input.allDay))
  if (input.location) event.location = input.location
  if (input.description) event.description = input.description
  component.updatePropertyWithValue('dtstamp', ICAL.Time.fromJSDate(new Date(), true))

  for (const attendee of input.attendees ?? []) {
    if (!attendee.email) continue
    const property = new ICAL.Property('attendee', component)
    property.setValue(`mailto:${attendee.email}`)
    if (attendee.name) property.setParameter('cn', attendee.name)
    if (attendee.status) property.setParameter('partstat', attendee.status.toUpperCase())
    component.addProperty(property)
  }
}

export const buildICS = (uid: string, input: EventInput) => {
  const calendar = new ICAL.Component('vcalendar')
  calendar.addPropertyWithValue('version', '2.0')
  calendar.addPropertyWithValue('prodid', PRODID)

  const component = new ICAL.Component('vevent')
  calendar.addSubcomponent(component)
  component.addPropertyWithValue('uid', uid)
  writeEvent(component, input)
  return calendar.toString()
}

export function updateICS(existing: string, input: EventInput) {
  const calendar = new ICAL.Component(ICAL.parse(existing))
  // A modified occurrence carries RECURRENCE-ID; the master is the one without it.
  const master =
    calendar.getAllSubcomponents('vevent').find((vevent) => !vevent.hasProperty('recurrence-id')) ??
    calendar.getFirstSubcomponent('vevent')
  if (!master) throw new Error('Calendar object has no event to update')

  writeEvent(master, input)
  return calendar.toString()
}
