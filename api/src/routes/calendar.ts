import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Account } from '../lib/account'
import type { Vars } from '../lib/auth'
import { buildICS, updateICS } from '../lib/build'
import { client, collectionId, fetchCalendarObjects } from '../lib/dav'
import { labelIndex, labelsOf } from '../lib/labels'
import { parseEvents } from '../lib/parse'
import type {
  CalendarEventItem,
  CalendarSummary,
  EventInput,
  EventsResponse,
  EventUpdate,
} from '../types'

const calendar = new Hono<Vars>()

const DEFAULT_RANGE_MONTHS = 1

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}/

const eventInput = (raw: Partial<EventInput>): EventInput => {
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) throw new HTTPException(400, { message: 'title is required' })

  const start = new Date(raw.start ?? '')
  const end = new Date(raw.end ?? '')
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new HTTPException(400, { message: 'start and end must be parseable dates' })
  }
  if (start >= end) throw new HTTPException(400, { message: 'start must be before end' })

  // An all-day boundary must stay the calendar day the caller named; normalising it through UTC would shift it.
  if (raw.allDay) {
    if (!DATE_ONLY.test(raw.start!) || !DATE_ONLY.test(raw.end!)) {
      throw new HTTPException(400, { message: 'an all-day start and end must begin with YYYY-MM-DD' })
    }
    return { ...raw, title, start: raw.start!.slice(0, 10), end: raw.end!.slice(0, 10) }
  }
  return { ...raw, title, start: start.toISOString(), end: end.toISOString() }
}

const parseRange = (startParam?: string, endParam?: string) => {
  const now = new Date()
  const start = startParam ? new Date(startParam) : new Date(now.getFullYear(), now.getMonth() - DEFAULT_RANGE_MONTHS, 1)
  const end = endParam ? new Date(endParam) : new Date(now.getFullYear(), now.getMonth() + DEFAULT_RANGE_MONTHS + 1, 0)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new HTTPException(400, { message: 'start and end must be parseable dates' })
  }
  if (start >= end) throw new HTTPException(400, { message: 'start must be before end' })
  return { start, end }
}

const eventCalendars = async (account: Account, only?: string) => {
  const caldav = await client(account, 'caldav')
  const all = await caldav.fetchCalendars()
  const scoped = only ? all.filter((c) => collectionId(c.url) === only) : all
  if (only && !scoped.length) throw new HTTPException(404, { message: `No calendar with id ${only}` })
  // A VTODO-only collection is a real calendar that simply holds no events.
  return { caldav, calendars: scoped.filter((c) => c.components?.includes('VEVENT')) }
}

calendar.get('/calendars', async (c) => {
  const caldav = await client(c.get('account'), 'caldav')
  const calendars = await caldav.fetchCalendars()
  const summaries: CalendarSummary[] = calendars.map((cal) => ({
    id: collectionId(cal.url),
    name: (cal.displayName as string | undefined) ?? null,
    components: cal.components ?? [],
    timezone: cal.timezone ?? null,
    ctag: cal.ctag ?? null,
    url: cal.url,
  }))
  return c.json(summaries)
})

calendar.get('/events', async (c) => {
  const range = parseRange(c.req.query('start'), c.req.query('end'))
  const { caldav, calendars } = await eventCalendars(c.get('account'), c.req.query('calendar'))

  const parsed = (
    await Promise.all(
      calendars.map(async (cal) => {
        const objects = await fetchCalendarObjects(caldav, cal, range)
        const id = collectionId(cal.url)
        return objects.flatMap((object) => parseEvents(object, range).map((event) => ({ ...event, calendarId: id })))
      }),
    )
  ).flat()

  const index = labelIndex(c.get('account').userId, 'event', parsed.map((event) => event.id))
  const events: EventsResponse['events'] = parsed.map((event) => ({
    ...event,
    labelIds: labelsOf(index, 'event', event.id),
  }))

  events.sort((a, b) => a.start.localeCompare(b.start))
  return c.json<EventsResponse>({ start: range.start.toISOString(), end: range.end.toISOString(), events })
})

calendar.post('/events', async (c) => {
  const input = eventInput((await c.req.json()) as Partial<EventInput>)
  const { caldav, calendars } = await eventCalendars(c.get('account'), input.calendar)
  const target = calendars[0]
  if (!target) throw new HTTPException(404, { message: 'No calendar accepts events' })

  const uid = crypto.randomUUID()
  const filename = `${uid}.ics`
  const data = buildICS(uid, input)
  const response = await caldav.createCalendarObject({ calendar: target, iCalString: data, filename })
  if (!response.ok) {
    throw new HTTPException(502, { message: `Calendar rejected the event (${response.status})` })
  }

  // Round-tripping what we just wrote keeps a created event byte-identical to one that came back from a read.
  const url = new URL(filename, target.url).href
  const [event] = parseEvents({ url, etag: response.headers.get('etag') ?? undefined, data })
  return c.json<CalendarEventItem>({ ...event!, calendarId: collectionId(target.url), labelIds: [] }, 201)
})

calendar.put('/events', async (c) => {
  const account = c.get('account')
  const raw = (await c.req.json()) as Partial<EventUpdate>
  if (typeof raw.url !== 'string' || !raw.url) throw new HTTPException(400, { message: 'url is required' })
  const input = eventInput(raw)

  const caldav = await client(account, 'caldav')
  const all = await caldav.fetchCalendars()
  // Match by URL prefix so an edit lands in the collection the event already lives in.
  const target = all.find((cal) => raw.url!.startsWith(cal.url))
  if (!target) throw new HTTPException(404, { message: 'No calendar holds that event' })

  const [existing] = await fetchCalendarObjects(caldav, target, undefined, [raw.url])
  if (!existing) throw new HTTPException(404, { message: 'That event no longer exists' })

  // Rewriting only the fields we model preserves RRULE, alarms and modified occurrences.
  const data = updateICS(existing.data, input)
  const response = await caldav.updateCalendarObject({
    calendarObject: { url: raw.url, etag: raw.etag ?? existing.etag, data },
  })
  if (response.status === 412) {
    throw new HTTPException(409, { message: 'That event changed elsewhere; reload and try again' })
  }
  if (!response.ok) throw new HTTPException(502, { message: `Calendar rejected the edit (${response.status})` })

  const [event] = parseEvents({ url: raw.url, etag: response.headers.get('etag') ?? undefined, data })
  const index = labelIndex(account.userId, 'event', [event!.id])
  return c.json<CalendarEventItem>({
    ...event!,
    calendarId: collectionId(target.url),
    labelIds: labelsOf(index, 'event', event!.id),
  })
})

export default calendar
