To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000

## Layout

```
src/
  index.ts            app assembly: CORS, route mounting, error handling
  types.ts            wire types — the client imports these as @api/types
  routes/             one module per surface: mail, calendar, contacts, labels
  lib/                transport: dav, imap, smtp, mime, parse, build
  db/                 sessions, the server catalogue, and our own label metadata
  lib/providers/      per-server behaviour; everything vendor-specific lives here
```

## Auth

The mail server is the identity provider — credentials are only valid if IMAP accepts them, so no
password hash is ever stored. A successful login puts the mail password in a process-local map keyed
by session id; **it is never written to disk**, so restarting the server ends every session.

```
POST /auth/login   { email, password, server? }  -> sets an httpOnly cookie
POST /auth/logout                                 -> ends the session, closes its connections
GET  /auth/me                                     -> the signed-in user and its server
```

Which server an address belongs to is discovered once and then remembered:

1. Known domain → its recorded server config, one auth attempt.
2. Unknown domain → each config in the catalogue is tried until one authenticates, and the winning
   domain→server pair is saved for next time.
3. Nothing matched → `422 { error: "manual_config_required" }`. Re-post with a `server` object; on
   success it joins the catalogue, so the next domain on that host resolves for free.

Login is rate limited to 5 failures per 15 minutes, counted per address and per client IP.

## Routes

Everything below `/mail`, `/calendar` and `/contacts` requires a session.

| | |
|---|---|
| `GET /mail/folders` | path, specialUse, total, unseen |
| `GET /mail/messages?folder&limit&offset` | newest-first page, envelope only |
| `GET /mail/message?folder&uid` | bodies + attachment metadata |
| `GET /mail/attachment?folder&uid&part` | raw bytes, always served as a download |
| `POST /mail/flags` | `{ folder, uids, add?, remove? }` |
| `POST /mail/move` | `{ folder, uids, to }` |
| `POST /mail/send` | `{ to, cc?, bcc?, subject, text?, html?, attachments? }` |
| `GET /calendar/calendars` | |
| `GET /calendar/events?start&end&calendar` | |
| `POST /calendar/events` | `{ title, start, end, allDay?, location?, description?, attendees?, calendar? }` |
| `PUT /calendar/events` | the same fields plus `{ url, etag? }` |
| `GET /contacts/addressbooks` | |
| `GET /contacts/list?addressBook` | |
| `POST /contacts/create` | `{ name, firstName?, lastName?, emails?, phones?, organization?, title?, note?, addressBook? }` |
| `PUT /contacts/update` | the same fields plus `{ url, etag? }` |
| `GET /labels` | the signed-in user's labels |
| `POST /labels` | `{ name, color? }` |
| `PATCH /labels/:id` · `DELETE /labels/:id` | rename/recolour, or delete with its links |
| `POST /labels/assign` | `{ labelId, kind, resourceId, on }` |
| `POST /mail/folders` · `PATCH` · `DELETE` | create, rename, or delete a mailbox |
| `GET /settings` · `PATCH /settings` | theme, density, threading, shortcuts, remote-content allow list |
| `GET /identities` · `POST` · `PATCH /:id` · `DELETE /:id` | alternate From addresses |
| `GET /filters` · `POST` · `PATCH /:id` · `DELETE /:id` | rules applied to new mail |
| `POST /filters/run` | `{ folder }` — sweep a folder now |
| `GET /filters/forwarders` · `POST` · `POST /verify` · `DELETE /:id` | verified forwarding addresses |

Creates land in the first collection the account exposes unless `calendar` / `addressBook` names one,
and return the created entity in exactly the shape its `GET` counterpart would. An edit rewrites only
the fields listed above, so `RRULE`, alarms, `ADR`, `BDAY` and anything else the server holds survive
untouched; a changed `etag` comes back as `409` rather than clobbering someone else's write.

## Labels

IMAP, CalDAV and CardDAV own the resources; labels are ours, and live only in SQLite. `kind` is
`message`, `contact` or `event`, and `resourceId` is whatever identifies that resource across
refetches — the **Message-ID** for mail (not the uid, which changes when a message moves), the
vCard UID for a contact, the iCalendar UID for an event. A recurring event is labelled as a series:
the UID prefix is used, so every occurrence carries the label.

Messages, contacts and events all come back with a `labelIds` array, so a page costs one extra
lookup rather than one per row. Mail without a Message-ID simply cannot be labelled.

## Filters

Conditions are `from`, `to`, `subject`, `contains` and `notContains`; every one present must match.
Matching runs on the envelope, not the body — a list page never fetches message text, so `contains`
tests the subject and the addresses. Actions are label, move, mark read, star, archive, delete and
forward.

There is no background worker. Filters run when a folder is listed, over messages whose uid is above
the last one swept (`filter_state`), and `POST /filters/run` does the same on demand. A page that
matched something is re-read before it is returned, so a moved message never lingers in the list.

Forwarding is the only action that sends mail somewhere the account does not control, so the address
must first answer a six-digit code — stored only as a hash, valid 15 minutes, five attempts.

## Deleting a folder

Messages are moved to the destination (Inbox by default) before the mailbox is removed, and the
response reports how many moved. `INBOX` and anything the server marks `SPECIAL-USE` are refused.

## Config

Users bring their own credentials at login, so `.env.local` only seeds the server catalogue. Each
profile name prefixes its entry, and any profile with both hosts set is inserted as a built-in:

```sh
MXROUTE_MAIL_SERVER=...     # IMAP + SMTP host
MXROUTE_DAV_SERVER=...      # CalDAV + CardDAV host
MXROUTE_IMAP_PORT=993       # optional, profile default
MXROUTE_SMTP_PORT=465       # optional, profile default (465 = implicit TLS)
```

| | |
|---|---|
| `CLIENT_ORIGIN` | allowed CORS origins, comma-separated (default `http://localhost:5173`) |
| `DB_FILE` | SQLite path (default `qwix.db`) |
| `NODE_ENV` | `production` sets the `Secure` flag on the session cookie |

Migrations live in `drizzle/` and run at startup. After changing `src/db/schema.ts`, regenerate with
`bunx drizzle-kit generate`.

## Adding a server

Implement `Provider` (`src/lib/providers/types.ts`), spreading `standard` and overriding only what
differs, then register it in `src/lib/providers/index.ts`. Two worked examples:

- `smartermail.ts` overrides vCard fetching (the server rejects `addressbook-query`) and
  missing-mailbox detection (a failed `SELECT` carries no `NONEXISTENT` code). `namecrane.ts` is
  a SmarterMail host, so it is that file plus a name.
- `mxroute.ts` is stock Dovecot, so it only changes the SMTP port and the Sent-folder fallbacks.
