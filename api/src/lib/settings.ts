import { eq } from 'drizzle-orm'
import { db } from '../db'
import { settings } from '../db/schema'
import type { Density, HtmlMode, Settings, SettingsInput, Theme } from '../types'

const THEMES: Theme[] = ['dark', 'light']
const DENSITIES: Density[] = ['compact', 'cozy', 'comfortable']
const HTML_MODES: HtmlMode[] = ['always', 'allowed', 'never']

const DEFAULTS: Settings = {
  theme: 'dark',
  density: 'cozy',
  threading: false,
  shortcutsEnabled: true,
  remoteSenders: [],
  // Rendering HTML is what every account did before this setting existed; defaulting to anything
  // stricter would silently change how everyone's existing mail looks.
  htmlMode: 'always',
  htmlSenders: [],
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
    htmlMode: HTML_MODES.includes(row.htmlMode as HtmlMode) ? (row.htmlMode as HtmlMode) : DEFAULTS.htmlMode,
    htmlSenders: row.htmlSenders ?? [],
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
    htmlMode: input.htmlMode && HTML_MODES.includes(input.htmlMode) ? input.htmlMode : current.htmlMode,
    htmlSenders: input.htmlSenders === undefined ? current.htmlSenders : senderList(input.htmlSenders),
    shortcutOverrides:
      input.shortcutOverrides === undefined ? current.shortcutOverrides : overrides(input.shortcutOverrides),
  }

  db.insert(settings)
    .values({ userId, ...next })
    .onConflictDoUpdate({ target: settings.userId, set: next })
    .run()
  return next
}

/** Whether this sender is on an allow list — remote content or HTML — by address or by domain. */
export const senderAllowed = (allowed: string[], address: string | null | undefined) => {
  if (!address) return false
  const value = address.trim().toLowerCase()
  const domain = value.split('@')[1] ?? ''
  return allowed.some((entry) => entry === value || (Boolean(domain) && entry === domain))
}
