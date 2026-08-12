import type { MailAddress } from '@api/types'

const AVATAR_TONES = ['rose', 'plum', 'green', 'orange', 'purple'] as const
const EVENT_TONES = ['rose', 'green', 'purple', 'orange'] as const

export type AvatarTone = (typeof AVATAR_TONES)[number]
export type EventTone = (typeof EVENT_TONES)[number]

// Nothing on the wire carries a colour, so derive one that is at least stable per sender/collection.
function pick<T>(tones: readonly T[], seed: string): T {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) | 0
  return tones[Math.abs(hash) % tones.length]!
}

export const avatarTone = (seed: string) => pick(AVATAR_TONES, seed)

export const eventTone = (seed: string) => pick(EVENT_TONES, seed)

export function initialsOf(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts.at(-1)![0] ?? ''}`.toUpperCase()
}

export const addressLabel = (address: MailAddress | null | undefined) =>
  address?.name?.trim() || address?.address || 'Unknown sender'

export const addressList = (addresses: MailAddress[]) => addresses.map(addressLabel).join(', ')

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const shortFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const longFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export function formatTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : timeFormat.format(date)
}

/** Time for today, day and month for this year, and the year too for anything older. */
export function formatListDate(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return timeFormat.format(date)
  return date.getFullYear() === now.getFullYear() ? shortFormat.format(date) : longFormat.format(date)
}

export function formatFullDate(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : longFormat.format(date)
}

const UNITS = ['B', 'KB', 'MB', 'GB']

export function formatBytes(bytes: number | undefined): string {
  if (!bytes) return ''
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < UNITS.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size < 10 && unit > 0 ? size.toFixed(1) : Math.round(size)} ${UNITS[unit]}`
}
