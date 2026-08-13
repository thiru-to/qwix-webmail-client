// Wire types shared with the client — keep this file free of runtime imports.

export type ApiError = { error: string; detail?: string }

export type ServerInput = {
  name: string
  profile?: string
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  davUrl: string
}

export type LoginInput = { email: string; password: string; server?: ServerInput }

export type ServerSummary = { name: string; profile: string; imapHost: string; smtpHost: string; davUrl: string }

export type SessionUser = { email: string; domain: string; server: ServerSummary }

/** 422 from /auth/login: no known server accepted the address, so the client must collect one. */
export type ManualConfigRequired = { error: 'manual_config_required'; domain: string }

export type OkResult = { ok: true }

/** What kind of resource a label is attached to. */
export type LabelKind = 'message' | 'contact' | 'event'

export type LabelColor = 'pink' | 'amber' | 'teal' | 'green' | 'purple' | 'orange'

export type Label = { id: number; name: string; color: LabelColor }

export type LabelInput = { name: string; color?: LabelColor }

export type LabelAssignment = { labelId: number; kind: LabelKind; resourceId: string; on: boolean }

/** Every resource that can carry our own metadata reports the labels currently on it. */
export type Labelled = { labelIds: number[] }

export type MailAddress = { name?: string; address: string }

export type MailFlags = { seen: boolean; flagged: boolean; answered: boolean; draft: boolean }

export type MailFolder = {
  path: string
  name: string
  delimiter: string
  specialUse: string | null
  total: number
  unseen: number
}

export type MailAttachment = {
  part: string
  filename?: string
  mimeType: string
  size?: number
  inline: boolean
  contentId?: string
}

export type MessageSummary = MailFlags &
  Labelled & {
    uid: number
    subject: string
    from: MailAddress | null
    to: MailAddress[]
    date: string | null
    size: number
    hasAttachments: boolean
    /** Stable across folders and refetches, unlike `uid`; this is what labels are keyed on. */
    messageId: string | null
    /** Carried in the envelope, so conversation grouping costs nothing extra. */
    inReplyTo: string | null
  }

export type MessageBodies = { html: string | null; text: string | null }

export type Message = MessageSummary &
  MessageBodies & {
    folder: string
    cc: MailAddress[]
    bcc: MailAddress[]
    replyTo: MailAddress[]
    attachments: MailAttachment[]
  }

export type MessagePage = {
  folder: string
  total: number
  unseen: number
  limit: number
  offset: number
  messages: MessageSummary[]
}

export type FlagsInput = { folder?: string; uids: number[]; add?: string[]; remove?: string[] }

export type MoveInput = { folder?: string; uids: number[]; to: string }

export type SendAttachment = { filename: string; content: string; contentType?: string }

export type SendInput = {
  /** Send as one of the account's identities; omitted means the account's own address. */
  identityId?: number
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject?: string
  text?: string
  html?: string
  inReplyTo?: string
  references?: string[]
  attachments?: SendAttachment[]
}

export type SendResult = { messageId: string; savedTo: string | null }

export type Attendee = { name?: string; email?: string; status?: string }

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  location?: string
  description?: string
  organizer?: Attendee
  attendees: Attendee[]
  recurring: boolean
  url: string
  etag?: string
}

export type Typed = { value: string; type?: string }

export type Contact = {
  id: string
  name: string
  firstName?: string
  lastName?: string
  emails: Typed[]
  phones: Typed[]
  organization?: string
  title?: string
  note?: string
  url: string
  etag?: string
}

export type CalendarSummary = {
  id: string
  name: string | null
  components: string[]
  timezone: string | null
  ctag: string | null
  url: string
}

export type AddressBookSummary = { id: string; name: string | null; ctag: string | null; url: string }

export type CalendarEventItem = CalendarEvent & Labelled & { calendarId: string }

export type ContactItem = Contact & Labelled & { addressBookId: string }

export type EventsResponse = { start: string; end: string; events: CalendarEventItem[] }

export type ContactsResponse = { contacts: ContactItem[] }

/** `start`/`end` are ISO instants, or bare `YYYY-MM-DD` when `allDay` is set. */
export type EventInput = {
  calendar?: string
  title: string
  start: string
  end: string
  allDay?: boolean
  location?: string
  description?: string
  attendees?: Attendee[]
}

export type ContactInput = {
  addressBook?: string
  name: string
  firstName?: string
  lastName?: string
  emails?: Typed[]
  phones?: Typed[]
  organization?: string
  title?: string
  note?: string
}

/** An edit rewrites only the fields we model; everything else in the stored object is preserved. */
export type EventUpdate = EventInput & { url: string; etag?: string }

export type ContactUpdate = ContactInput & { url: string; etag?: string }

export type Theme = 'dark' | 'light'

export type Density = 'compact' | 'cozy' | 'comfortable'

/** When a message's HTML part may be rendered at all, as opposed to its plain-text alternative. */
export type HtmlMode = 'always' | 'allowed' | 'never'

export type Settings = {
  theme: Theme
  density: Density
  /** Group the message list by conversation. Grouping itself happens on the client. */
  threading: boolean
  shortcutsEnabled: boolean
  /** Bare domains or full addresses whose remote images may load. */
  remoteSenders: string[]
  htmlMode: HtmlMode
  /** Bare domains or full addresses whose HTML renders when htmlMode is 'allowed'. */
  htmlSenders: string[]
  shortcutOverrides: Record<string, string>
}

export type SettingsInput = Partial<Settings>

export type Identity = { id: number; name: string; email: string; isDefault: boolean; labelId: number | null }

export type IdentityInput = { name: string; email: string; isDefault?: boolean }

/** Every condition present must match; an absent one is not tested. */
export type FilterConditions = {
  from?: string
  to?: string
  subject?: string
  contains?: string
  notContains?: string
}

export type FilterActions = {
  moveTo?: string
  labelId?: number
  markRead?: boolean
  star?: boolean
  delete?: boolean
  archive?: boolean
  /** Must name a verified forwarding address. */
  forwardTo?: string
}

export type MailFilter = {
  id: number
  name: string
  enabled: boolean
  position: number
  conditions: FilterConditions
  actions: FilterActions
}

export type MailFilterInput = {
  name: string
  enabled?: boolean
  conditions: FilterConditions
  actions: FilterActions
}

export type FilterRunResult = { folder: string; scanned: number; matched: number }

export type ForwardAddress = { id: number; email: string; verified: boolean }

export type ForwardVerifyInput = { email: string; code: string }

export type FolderInput = { path: string }

export type FolderRename = { path: string; to: string }

/** Messages are moved to `moveTo` (default INBOX) before the mailbox goes, so nothing is lost. */
export type FolderDelete = { path: string; moveTo?: string }
