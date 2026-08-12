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
  await client.login()
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
