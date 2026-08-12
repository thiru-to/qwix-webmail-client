import { eq } from 'drizzle-orm'
import { db } from '../db'
import { settings } from '../db/schema'
import type { Density, Settings, SettingsInput, Theme } from '../types'

const THEMES: Theme[] = ['dark', 'light']
const DENSITIES: Density[] = ['compact', 'cozy', 'comfortable']

const DEFAULTS: Settings = {
  theme: 'dark',
  density: 'cozy',
  threading: false,
  shortcutsEnabled: true,
  remoteSenders: [],
  shortcutOverrides: {},
}

/** A bare domain or a full address, lowercased; anything else is dropped. */
const senderList = (raw: unknown): string[] =>
  Array.isArray(raw)
    ? [
        ...new Set(
          raw
            .map((entry) => String(entry ?? '').trim().toLowerCase())
            .filter((entry) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(entry) || /^[^@\s]+\.[^@\s]+$/.test(entry)),
        ),
      ]
    : []

const overrides = (raw: unknown): Record<string, string> =>
  raw && typeof raw === 'object' && !Array.isArray(raw)
    ? Object.fromEntries(
        Object.entries(raw as Record<string, unknown>)
          .filter(([, value]) => typeof value === 'string' && (value as string).length <= 12)
          .map(([key, value]) => [key, String(value)]),
      )
    : {}

export function readSettings(userId: number): Settings {
  const row = db.select().from(settings).where(eq(settings.userId, userId)).get()
  if (!row) return DEFAULTS
  return {
    theme: THEMES.includes(row.theme as Theme) ? (row.theme as Theme) : DEFAULTS.theme,
    density: DENSITIES.includes(row.density as Density) ? (row.density as Density) : DEFAULTS.density,
    threading: row.threading,
    shortcutsEnabled: row.shortcutsEnabled,
    remoteSenders: row.remoteSenders ?? [],
    shortcutOverrides: row.shortcutOverrides ?? {},
  }
}

export function writeSettings(userId: number, input: SettingsInput): Settings {
  const current = readSettings(userId)
  const next: Settings = {
    theme: input.theme && THEMES.includes(input.theme) ? input.theme : current.theme,
    density: input.density && DENSITIES.includes(input.density) ? input.density : current.density,
    threading: typeof input.threading === 'boolean' ? input.threading : current.threading,
    shortcutsEnabled:
      typeof input.shortcutsEnabled === 'boolean' ? input.shortcutsEnabled : current.shortcutsEnabled,
    remoteSenders: input.remoteSenders === undefined ? current.remoteSenders : senderList(input.remoteSenders),
    shortcutOverrides:
      input.shortcutOverrides === undefined ? current.shortcutOverrides : overrides(input.shortcutOverrides),
  }

  db.insert(settings)
    .values({ userId, ...next })
    .onConflictDoUpdate({ target: settings.userId, set: next })
    .run()
  return next
}

/** Whether this sender is on the remote-content allow list, by address or by domain. */
export const remoteAllowed = (allowed: string[], address: string | null | undefined) => {
  if (!address) return false
  const value = address.trim().toLowerCase()
  const domain = value.split('@')[1] ?? ''
  return allowed.some((entry) => entry === value || (Boolean(domain) && entry === domain))
}
