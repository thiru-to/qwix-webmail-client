# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Qwix is a webmail client for standard IMAP/SMTP/CalDAV/CardDAV servers. Two packages, two package managers, no shared root workspace.

## Commands

```sh
pnpm install && pnpm dev                    # root: both servers via concurrently
cd api    && bun install && bun run dev     # Hono API on :3000, hot reload
cd client && pnpm install && pnpm dev       # Vite on :5173
cd client && pnpm build                     # tsc -b && vite build
cd client && pnpm lint                      # eslint
cd api    && bunx drizzle-kit generate      # after editing src/db/schema.ts
```

No test suite exists. Migrations in `api/drizzle/` run automatically at API startup.

`api/README.md` is the authoritative reference for routes, auth flow, labels, filters, and config — read it before changing anything under `api/`.

## Architecture

The API is a thin, stateless-by-design translation layer: HTTP/JSON in, IMAP/SMTP/CalDAV/CardDAV out. It stores nothing that the mail server owns. SQLite holds only what no mail protocol has: sessions, the server catalogue, labels, settings, identities, filters.

### The mail server is the identity provider

- Login = an IMAP auth attempt. No password hash is stored.
- The live password sits in a process-local `Map` in `api/src/lib/account.ts` keyed by session id, **never on disk**. Restarting the API ends every session (`clearSessions()` at boot).
- `authenticate` middleware (`api/src/lib/auth.ts`) resolves the cookie to an `Account` and sets `c.get('account')`. Every route below `/mail`, `/calendar`, `/contacts`, `/labels`, `/settings`, `/identities`, `/filters` needs it.
- Anything holding per-session resources must register a `release(key)` in `endSession` — currently imap, dav, smtp pools.

### Connection pools are keyed by session

`lib/imap.ts`, `lib/dav.ts`, `lib/smtp.ts` each keep a `Map<accountKey, Promise<Client>>`. Consequences:

- Use `withMailbox(account, path, fn)` for IMAP work — one connection runs one command at a time and the mailbox lock serialises concurrent requests.
- The mailbox is always opened read-write; an `EXAMINE` in the mix silently drops later flag writes.
- A failed connect must delete its pool entry so the next request retries.

### Server quirks live in providers, never at call sites

`api/src/lib/providers/` — `standard.ts` is the base; `smartermail`/`namecrane`/`mxroute` spread it and override only what differs. To handle new non-standard behaviour, add a hook to `Provider` (`providers/types.ts`) and implement it per profile. Do not branch on provider name inside a route. Reach it via `provider(account)`.

`ServerConfig.profile` in SQLite selects the profile; hosts/ports are data, profiles are behaviour.

### Wire types are the contract

`api/src/types.ts` is the single source of truth for request/response shapes. The client imports it type-only via the `@api/*` path alias (`client/tsconfig.app.json`), so no server code reaches the bundle. Changing a response shape means changing this file first, then both sides.

### Labels / filters are ours, not the server's

Labels key on a stable identifier that survives refetch — Message-ID for mail (not uid, which changes on move), vCard UID for contacts, iCalendar UID prefix for events (so a recurring series is labelled once). Use `labelIndex()` for a page, `labelsOf()` for one row — never one query per row.

Filters have no background worker: they run when a folder is listed, over uids above `filter_state`, plus on-demand via `POST /filters/run`.

## Client

React 19 + Vite. No router — `shellStore.productView` picks the workspace in `App.tsx`. No Tailwind despite `cn()` using `tailwind-merge`; styling is hand-written CSS over the tokens in `src/styles/tokens.css`.

### Layering

```
api/*                      one function per endpoint, all through request<T>() in api/client.ts
features/<x>/queries.ts    queryOptions / infiniteQueryOptions objects
features/<x>/mutations.ts  useMutation hooks that own their invalidations
features/<x>/*.tsx         workspace UI
components/ui/*            shared primitives (add one only at ≥2 call sites)
components/shell/*         AppShell, Sidebar, ProductNav
stores/*                   Zustand: ephemeral UI state only
```

Hard rules this layering encodes:

- **Server state is TanStack Query; client state is Zustand.** Never cache server data in a store.
- Components call feature hooks, not `api/*` directly.
- Query option objects are module-level constants (`const folderOptions = queryOptions({...})`) so identity is stable across renders — see the note in `features/auth/queries.ts`.
- A mutation invalidates in its own `onSuccess`; callers don't.
- `request<T>()` sets `credentials: 'include'` (cross-origin cookie) and flips `shellStore.sessionExpired` on a 401 outside `/auth/*`. Don't hand-roll `fetch`.

### Styling

- Every colour, spacing and size comes from a token in `src/styles/tokens.css`; light theme = `.theme-light` overriding the same variables on the root. Never hardcode a hex.
- CSS is per-scope and imported from the component that owns it (`ui.css`, `shell.css`, `mail.css`, …). `App.tsx` imports the always-on ones.
- `cn()` from `src/lib/utils.ts` for conditional classes.

### Reusable pieces to prefer over new code

- `<QueryState>` — pending/error/retry wrapper around any query render.
- `<List>` / `<ListRow>` — every selectable row across mail, contacts, calendar.
- `<Panel>`, `<SidePanel>`, `<Toolbar>`, `<FormField>`, `<ChipInput>`, `<Avatar>`, `<Badge>`, `<Spinner>`, `<Skeleton>`.
- `lib/threading.ts` (union-find over Message-ID + normalised subject), `lib/calendar.ts`, `lib/format.ts`, `lib/remote.ts` (mirrors the server's remote-content rule — keep both in sync), `lib/shortcuts.ts` (Gmail bindings).

## Conventions

- Comments explain *why* — an invariant, a protocol quirk, a workaround. The existing code is dense with these and light on everything else; match that. No docstrings restating signatures.
- Errors: `throw new HTTPException(status, { message })` on the API; the global `onError` in `index.ts` turns anything else into a 502 `ApiError`.
- Validate at the route boundary (see the `integer` / `uidList` helpers in `routes/mail.ts`); don't validate again downstream.
- `api/.env.local` seeds the server catalogue only — users bring their own credentials. It contains real credentials; never print or commit it.
- `api/qwix.db` is a live local database. Don't delete or rewrite it to "reset" state without asking.
