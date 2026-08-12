import type { DavObject } from '../dav'
import type { Provider } from './types'

// RFC-conformant behaviour: addressbook-query works, and a SELECT of a missing mailbox is
// tagged NONEXISTENT (imapflow also sets mailboxMissing after verifying a NO response).
export const standard: Provider = {
  name: 'standard',

  ports: { imap: 993, smtp: 587 },

  fetchVCards: async (client, addressBook) => {
    const objects = await client.fetchVCards({ addressBook })
    return objects.map((o) => ({ url: o.url, etag: o.etag, data: o.data as string })) satisfies DavObject[]
  },

  isMissingMailbox: async (_client, _path, err) => {
    const failure = err as { serverResponseCode?: string; mailboxMissing?: boolean }
    return failure?.serverResponseCode === 'NONEXISTENT' || failure?.mailboxMissing === true
  },

  sentFolderNames: ['Sent'],
}
