export type EventTone = 'rose' | 'green' | 'purple' | 'orange'

export type CalendarEvent = {
  id: string
  title: string
  /** ISO date YYYY-MM-DD */
  date: string
  time: string
  day: string
  location: string
  tone: EventTone
  attendees: string[]
  /** Minutes from midnight */
  startMinutes: number
  endMinutes: number
}

export type CalendarDay = {
  date: string
  dayOfMonth: number
  inMonth: boolean
  isToday: boolean
  hasEvents: boolean
}

export type CalendarData = {
  focusDate: string
  monthLabel: string
  year: number
  weekdays: string[]
  monthDays: CalendarDay[]
  fourWeekDays: CalendarDay[]
  weekDays: CalendarDay[]
  hours: string[]
  yearMonths: { label: string; month: number; days: CalendarDay[] }[]
  events: CalendarEvent[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = [
  '8 AM',
  '9 AM',
  '10 AM',
  '11 AM',
  '12 PM',
  '1 PM',
  '2 PM',
  '3 PM',
  '4 PM',
  '5 PM',
  '6 PM',
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function iso(year: number, monthIndex: number, day: number) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

function buildMonthDays(year: number, monthIndex: number, todayIso: string, eventDates: Set<string>): CalendarDay[] {
  const first = new Date(year, monthIndex, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const prevMonthDays = new Date(year, monthIndex, 0).getDate()
  const cells: CalendarDay[] = []

  for (let i = startPad - 1; i >= 0; i -= 1) {
    const dayOfMonth = prevMonthDays - i
    const date = iso(year, monthIndex - 1, dayOfMonth)
    cells.push({
      date,
      dayOfMonth,
      inMonth: false,
      isToday: date === todayIso,
      hasEvents: eventDates.has(date),
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = iso(year, monthIndex, day)
    cells.push({
      date,
      dayOfMonth: day,
      inMonth: true,
      isToday: date === todayIso,
      hasEvents: eventDates.has(date),
    })
  }

  while (cells.length % 7 !== 0 || cells.length < 35) {
    const dayOfMonth = cells.length - (startPad + daysInMonth) + 1
    const date = iso(year, monthIndex + 1, dayOfMonth)
    cells.push({
      date,
      dayOfMonth,
      inMonth: false,
      isToday: date === todayIso,
      hasEvents: eventDates.has(date),
    })
  }

  return cells
}

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'steering',
    title: 'Q3 Migration Steering',
    date: '2026-08-12',
    time: '10:00 AM – 11:00 AM',
    day: 'Wed · Aug 12',
    location: 'Zoom · Northline',
    tone: 'purple',
    attendees: ['Avery Kim', 'Courtney Henry', 'Jordan Lee'],
    startMinutes: 10 * 60,
    endMinutes: 11 * 60,
  },
  {
    id: 'design-crit',
    title: 'Mail UI Design Critique',
    date: '2026-08-12',
    time: '1:30 PM – 2:15 PM',
    day: 'Wed · Aug 12',
    location: 'Studio B',
    tone: 'rose',
    attendees: ['Priya Shah', 'Courtney Henry'],
    startMinutes: 13 * 60 + 30,
    endMinutes: 14 * 60 + 15,
  },
  {
    id: 'payroll',
    title: 'Payroll sync check',
    date: '2026-08-13',
    time: '9:00 AM – 9:30 AM',
    day: 'Thu · Aug 13',
    location: 'Google Meet',
    tone: 'green',
    attendees: ['Finance Bot', 'Courtney Henry'],
    startMinutes: 9 * 60,
    endMinutes: 9 * 60 + 30,
  },
  {
    id: 'customer-call',
    title: 'Acme renewal call',
    date: '2026-08-14',
    time: '3:00 PM – 3:45 PM',
    day: 'Fri · Aug 14',
    location: 'Phone',
    tone: 'orange',
    attendees: ['Sam Ortiz', 'Courtney Henry'],
    startMinutes: 15 * 60,
    endMinutes: 15 * 60 + 45,
  },
  {
    id: 'standup',
    title: 'Product standup',
    date: '2026-08-10',
    time: '9:15 AM – 9:45 AM',
    day: 'Mon · Aug 10',
    location: 'HQ · Room 4',
    tone: 'green',
    attendees: ['Priya Shah', 'Courtney Henry'],
    startMinutes: 9 * 60 + 15,
    endMinutes: 9 * 60 + 45,
  },
  {
    id: 'board',
    title: 'Board prep',
    date: '2026-08-19',
    time: '11:00 AM – 12:30 PM',
    day: 'Wed · Aug 19',
    location: 'Conference A',
    tone: 'purple',
    attendees: ['Courtney Henry', 'Mina Park'],
    startMinutes: 11 * 60,
    endMinutes: 12 * 60 + 30,
  },
  {
    id: 'offsite',
    title: 'Design offsite half-day',
    date: '2026-08-26',
    time: '1:00 PM – 5:00 PM',
    day: 'Wed · Aug 26',
    location: 'Studio B',
    tone: 'rose',
    attendees: ['Priya Shah', 'Courtney Henry', 'Avery Kim'],
    startMinutes: 13 * 60,
    endMinutes: 17 * 60,
  },
]

const FOCUS = '2026-08-12'
const YEAR = 2026
const MONTH = 7 // August
const eventDates = new Set(calendarEvents.map((event) => event.date))
const monthDays = buildMonthDays(YEAR, MONTH, FOCUS, eventDates)

// Week containing Aug 12 2026 (Sun Aug 9 – Sat Aug 15)
const weekStartIndex = monthDays.findIndex((day) => day.date === '2026-08-09')
const weekDays = monthDays.slice(weekStartIndex, weekStartIndex + 7)

// Four weeks starting Sun Aug 2
const fourStartIndex = monthDays.findIndex((day) => day.date === '2026-08-02')
const fourWeekDays = monthDays.slice(fourStartIndex, fourStartIndex + 28)

const yearMonths = Array.from({ length: 12 }, (_, month) => {
  const label = new Date(YEAR, month, 1).toLocaleString('en-US', { month: 'short' })
  return {
    label,
    month,
    days: buildMonthDays(YEAR, month, FOCUS, eventDates).slice(0, 42),
  }
})

export const calendarData: CalendarData = {
  focusDate: FOCUS,
  monthLabel: 'August 2026',
  year: YEAR,
  weekdays: WEEKDAYS,
  monthDays,
  fourWeekDays,
  weekDays,
  hours: HOURS,
  yearMonths,
  events: calendarEvents,
}

export function eventsForDate(events: CalendarEvent[], date: string) {
  return events.filter((event) => event.date === date)
}

export function eventsForDates(events: CalendarEvent[], dates: string[]) {
  const set = new Set(dates)
  return events.filter((event) => set.has(event.date))
}
