import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const now = () => new Date()

// The catalogue of known server setups. Seeded with the built-ins and grown at runtime whenever a
// user successfully configures a server by hand, so the next domain on that host resolves for free.
export const serverConfigs = sqliteTable('server_configs', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  // Selects the quirk handling in src/lib/providers; unknown servers start on 'standard'.
  profile: text().notNull().default('standard'),
  imapHost: text('imap_host').notNull(),
  imapPort: integer('imap_port').notNull(),
  smtpHost: text('smtp_host').notNull(),
  smtpPort: integer('smtp_port').notNull(),
  davUrl: text('dav_url').notNull(),
  builtIn: integer('built_in', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(now),
}, (t) => [uniqueIndex('server_configs_name_idx').on(t.name)])

// Which server a mail domain lives on, learned on first successful login.
export const domains = sqliteTable('domains', {
  domain: text().primaryKey(),
  serverConfigId: integer('server_config_id')
    .notNull()
    .references(() => serverConfigs.id),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }).notNull().$defaultFn(now),
})

export const users = sqliteTable('users', {
  id: integer().primaryKey({ autoIncrement: true }),
  email: text().notNull(),
  domain: text().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(now),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
}, (t) => [uniqueIndex('users_email_idx').on(t.email)])

// Only session metadata is persisted; the mail password never leaves memory.
export const sessions = sqliteTable('sessions', {
  id: text().primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(now),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).notNull().$defaultFn(now),
  userAgent: text('user_agent'),
  ip: text(),
}, (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)])

export const loginAttempts = sqliteTable('login_attempts', {
  id: integer().primaryKey({ autoIncrement: true }),
  email: text().notNull(),
  ip: text().notNull(),
  ok: integer({ mode: 'boolean' }).notNull(),
  at: integer({ mode: 'timestamp' }).notNull().$defaultFn(now),
}, (t) => [index('login_attempts_email_idx').on(t.email, t.at), index('login_attempts_ip_idx').on(t.ip, t.at)])

// Mail, CalDAV and CardDAV own the resources themselves; anything below is ours alone. Labels are the
// first such annotation, and `kind` keeps mail, contacts and events in one place rather than three.
export const labels = sqliteTable('labels', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: text().notNull(),
  color: text().notNull().default('pink'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(now),
}, (t) => [uniqueIndex('labels_user_name_idx').on(t.userId, t.name)])

// `resourceId` is whatever identifies the resource across folders and refetches: a Message-ID for
// mail, the vCard UID for a contact, the iCalendar UID for an event.
export const labelLinks = sqliteTable('label_links', {
  labelId: integer('label_id')
    .notNull()
    .references(() => labels.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  kind: text().notNull(),
  resourceId: text('resource_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(now),
}, (t) => [
  primaryKey({ columns: [t.labelId, t.kind, t.resourceId] }),
  index('label_links_lookup_idx').on(t.userId, t.kind, t.resourceId),
])

// One row per user; every column is a preference the client reads back on load.
export const settings = sqliteTable('settings', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id),
  theme: text().notNull().default('dark'),
  density: text().notNull().default('cozy'),
  threading: integer({ mode: 'boolean' }).notNull().default(false),
  shortcutsEnabled: integer('shortcuts_enabled', { mode: 'boolean' }).notNull().default(true),
  // Senders whose remote images are allowed to load: bare domains or full addresses.
  remoteSenders: text('remote_senders', { mode: 'json' }).notNull().$type<string[]>().default([]),
  // 'always' keeps what every existing user already sees; the allow list only matters on 'allowed'.
  htmlMode: text('html_mode').notNull().default('always'),
  htmlSenders: text('html_senders', { mode: 'json' }).notNull().$type<string[]>().default([]),
  shortcutOverrides: text('shortcut_overrides', { mode: 'json' })
    .notNull()
    .$type<Record<string, string>>()
    .default({}),
})

// Alternate From addresses. Restricted to the account's own domain, since the mail server will
// reject anything else at send time anyway.
export const identities = sqliteTable('identities', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: text().notNull(),
  email: text().notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  // Each identity gets a label of the same name, so its mail can be picked out.
  labelId: integer('label_id').references(() => labels.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(now),
}, (t) => [uniqueIndex('identities_user_email_idx').on(t.userId, t.email)])

export const filters = sqliteTable('filters', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: text().notNull(),
  enabled: integer({ mode: 'boolean' }).notNull().default(true),
  position: integer().notNull().default(0),
  conditions: text({ mode: 'json' }).notNull().$type<Record<string, string>>().default({}),
  actions: text({ mode: 'json' }).notNull().$type<Record<string, unknown>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(now),
}, (t) => [index('filters_user_idx').on(t.userId, t.position)])

// Mail can only be forwarded to an address that answered a code, so a filter cannot be used to
// quietly relay someone's mail somewhere they never agreed to.
export const forwardAddresses = sqliteTable('forward_addresses', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  email: text().notNull(),
  verified: integer({ mode: 'boolean' }).notNull().default(false),
  codeHash: text('code_hash'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  attempts: integer().notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(now),
}, (t) => [uniqueIndex('forward_addresses_user_email_idx').on(t.userId, t.email)])

// IMAP uids only ever climb, so the last one seen is enough to know what is new since the last sweep.
export const filterState = sqliteTable('filter_state', {
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  folder: text().notNull(),
  lastUid: integer('last_uid').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.folder] })])

// Anything the API could not complete because something upstream refused it. Kept so a report of
// "calendar is broken" can be answered without asking the user to reproduce it.
export const upstreamErrors = sqliteTable('upstream_errors', {
  id: integer().primaryKey({ autoIncrement: true }),
  at: integer({ mode: 'timestamp' }).notNull().$defaultFn(now),
  // Route plus message, minus anything varying: repeats of one fault collapse onto one signature.
  signature: text().notNull(),
  method: text().notNull(),
  path: text().notNull(),
  status: integer().notNull(),
  email: text(),
  host: text(),
  message: text().notNull(),
  notifiedAt: integer('notified_at', { mode: 'timestamp' }),
}, (t) => [index('upstream_errors_sig_idx').on(t.signature, t.at), index('upstream_errors_at_idx').on(t.at)])

export type ServerConfig = typeof serverConfigs.$inferSelect
export type User = typeof users.$inferSelect
export type Session = typeof sessions.$inferSelect
export type LabelRow = typeof labels.$inferSelect
export type SettingsRow = typeof settings.$inferSelect
export type IdentityRow = typeof identities.$inferSelect
export type FilterRow = typeof filters.$inferSelect
export type ForwardAddressRow = typeof forwardAddresses.$inferSelect
