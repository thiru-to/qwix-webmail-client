import { calendarData, type CalendarData } from '../data/mockCalendar'
import { delay, maybeFail } from './client'

export async function fetchCalendar(): Promise<CalendarData> {
  await delay()
  await maybeFail('calendar')
  return calendarData
}
