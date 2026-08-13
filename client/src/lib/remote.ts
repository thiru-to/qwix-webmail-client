import type { HtmlMode } from '@api/types'

/** Mirrors the server rule: an entry matches a full address or a bare domain. */
export function senderAllowed(allowed: string[], address: string | null | undefined): boolean {
  if (!address) return false
  const value = address.trim().toLowerCase()
  const domain = value.split('@')[1] ?? ''
  return allowed.some((entry) => entry === value || (Boolean(domain) && entry === domain))
}

export const remoteAllowed = senderAllowed

/** Whether this sender's HTML part may be rendered, before any per-message override. */
export function htmlAllowed(mode: HtmlMode, allowed: string[], address: string | null | undefined): boolean {
  if (mode === 'always') return true
  if (mode === 'never') return false
  return senderAllowed(allowed, address)
}

/** What to offer as an allow-list entry for a sender — the domain, since one sender rarely matters. */
export function domainOf(address: string | null | undefined): string | null {
  const domain = address?.trim().toLowerCase().split('@')[1]
  return domain || null
}
