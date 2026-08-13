import { HTTPException } from 'hono/http-exception'
import { DAVClient, type DAVAddressBook, type DAVCalendar } from 'tsdav'
import { endpoints, provider, type Account } from './account'

export type DavObject = { url: string; etag?: string; data: string }

type AccountType = 'caldav' | 'carddav'

export const connect = async (account: Account, accountType: AccountType) => {
  const client = new DAVClient({
    serverUrl: endpoints(account.config).dav,
    credentials: { username: account.email, password: account.password },
    authMethod: 'Basic',
    defaultAccountType: accountType,
  })
  try {
    await client.login()
  } catch (err) {
    // A working IMAP login says nothing about DAV: the two are separate services and a host may
    // authenticate one and refuse the other. MXroute only accepts DAV for mailboxes whose domain
    // MXes to MXroute, so an address hosted there but delivered elsewhere fails exactly here.
    // Not a 401 — the session itself is fine, and the client signs the user out on one of those.
    if (err instanceof Error && /invalid credentials|401/i.test(err.message)) {
      throw new HTTPException(502, {
        message: `${endpoints(account.config).dav} rejected this account. Calendar and contacts are a separate login from mail — check the account exists there.`,
      })
    }
    throw err
  }
  return client
}

const pool = new Map<string, Promise<DAVClient>>()

// Login is a two-request discovery handshake; hold the session but let a failed one be retried.
export const client = (account: Account, accountType: AccountType) => {
  const id = `${account.key}:${accountType}`
  let pending = pool.get(id)
  if (!pending) {
    pending = connect(account, accountType).catch((err) => {
      pool.delete(id)
      throw err
    })
    pool.set(id, pending)
  }
  return pending
}

export const release = (key: string) => {
  for (const id of pool.keys()) if (id.startsWith(`${key}:`)) pool.delete(id)
}

export const collectionId = (url: string) => url.split('/').filter(Boolean).pop()!

export const fetchCalendarObjects = async (
  client: DAVClient,
  calendar: DAVCalendar,
  range?: { start: Date; end: Date },
  objectUrls?: string[],
) => {
  const objects = await client.fetchCalendarObjects({
    calendar,
    timeRange: range && { start: range.start.toISOString(), end: range.end.toISOString() },
    objectUrls,
  })
  return objects.map((o) => ({ url: o.url, etag: o.etag, data: o.data as string })) satisfies DavObject[]
}

export const fetchVCards = (account: Account, client: DAVClient, addressBook: DAVAddressBook): Promise<DavObject[]> =>
  provider(account).fetchVCards(client, addressBook)
