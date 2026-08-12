import type { DAVAddressBook, DAVClient } from 'tsdav'
import type { ImapFlow } from 'imapflow'
import type { DavObject } from '../dav'

// Everything a server can be non-standard about. Add a hook here rather than branching on
// provider name at the call site. Hosts and credentials come from .env.local, read under the
// provider's name as a prefix (mxroute -> MXROUTE_LOGIN, MXROUTE_MAIL_SERVER, ...).
export type Provider = {
  name: string
  /** Default transport ports; overridable per account with <NAME>_IMAP_PORT / <NAME>_SMTP_PORT. */
  ports: { imap: number; smtp: number }
  /** CardDAV collections are enumerated differently by servers that reject the query reports. */
  fetchVCards: (client: DAVClient, addressBook: DAVAddressBook) => Promise<DavObject[]>
  /** Whether a failed mailbox SELECT means the mailbox does not exist, rather than a transport failure. */
  isMissingMailbox: (client: ImapFlow, path: string, err: unknown) => Promise<boolean>
  /** Fallbacks for when the server advertises no \Sent special-use folder. */
  sentFolderNames: string[]
}
