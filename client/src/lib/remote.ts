/** Mirrors the server rule: an entry matches a full address or a bare domain. */
export function remoteAllowed(allowed: string[], address: string | null | undefined): boolean {
  if (!address) return false
  const value = address.trim().toLowerCase()
  const domain = value.split('@')[1] ?? ''
  return allowed.some((entry) => entry === value || (Boolean(domain) && entry === domain))
}
