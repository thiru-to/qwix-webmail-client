import { standard } from './standard'
import type { Provider } from './types'

// DirectAdmin + Dovecot, with calendars and contacts on a separate DAV host (dav.mxroute.com).
// https://docs.mxroute.com/docs/calendarcontacts/caldav.html
export const mxroute: Provider = {
  ...standard,
  name: 'mxroute',

  ports: { imap: 993, smtp: 465 },

  // Dovecot behind DirectAdmin nests mail folders under the INBOX namespace.
  sentFolderNames: ['INBOX.Sent', 'Sent'],
}
