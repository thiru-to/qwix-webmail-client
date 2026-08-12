# Component Reusability & Multi-Product Shell — Design

**Date:** 2026-08-12  
**Status:** Approved for planning  
**App:** Qwix Mail client (`client/`)

## Goal

Restructure the monolith so components are reusable across Mail, Calendar, and Contacts: a deep shared UI kit, a shared app shell, product feature modules, TanStack Query + mock API for server state, and Zustand for client UI state. Visual language may be normalized for stronger reuse (not pixel-frozen).

## Current state

- Nearly all UI lives in `src/App.tsx` (~405 lines) with local `MailCard`, `ReaderPanel`, `ComposeDialog`.
- Shared UI is thin: `Button`, `Badge`, `Input` under `components/ui/`.
- Styles concentrated in `App.css` (~613 lines).
- TanStack Query is already wired in `main.tsx` but queries the in-memory `mailbox` fixture directly.
- Calendar/Contacts exist only as product-nav stubs.

## Architecture

```
App
 └─ AppShell (shared chrome: brand, product nav, theme, collapse)
      ├─ MailWorkspace        ← features/mail
      ├─ CalendarWorkspace    ← features/calendar (full placeholder UI)
      └─ ContactsWorkspace    ← features/contacts (full placeholder UI)

components/ui/*   ← deep shared kit
components/shell/*← AppShell, ProductNav, Sidebar frame
stores/*          ← Zustand (shell + mail UI)
api/*             ← mock API client (async, delay, typed)
hooks/ or feature hooks ← useQuery wrappers over api/*
data/*            ← fixtures consumed only by api/*
```

### Seams

1. **Shell ↔ product:** `AppShell` knows `activeProduct` and renders one workspace; it does not import mail/calendar/contacts internals.
2. **Product ↔ kit:** Feature modules compose UI kit primitives; products do not import each other.
3. **Product ↔ data:** Feature hooks call the mock API via TanStack Query. UI never imports fixtures directly.
4. **Server vs client state:** Query owns async/cacheable domain data; Zustand owns ephemeral UI/workspace prefs.

`App.tsx` becomes a thin composer: providers → shell → active workspace.

## Components & modules

### Shared UI kit (`components/ui/`)

Add primitives only when there are ≥2 real call sites across products (or clear shell + product reuse):

| Module | Interface | Hides |
|---|---|---|
| `Button`, `Badge`, `Input` | Existing variants, cleaned | Styles |
| `IconButton` | `aria-label`, icon, pressed/active | Star/theme/collapse/back chrome |
| `Avatar` | initials, tone, size | Avatar markup/CSS |
| `Dialog` | open, onClose, title, children | Backdrop, basic dismiss behavior |
| `SearchField` | value, onChange, placeholder | Search chrome + clear |
| `Panel` | title, eyebrow, actions, children | Heading/reader frames |
| `Toolbar` | children | Action row layout |
| `List` / `ListRow` | selected, unread, onSelect, slots | Message/contact/event rows |
| `Skeleton` / `SkeletonText` / `SkeletonRow` | size/variant | Loading placeholders |
| `Spinner` | size | In-flight button/action indicator |
| `StorageMeter` | used, limit, percent | Meter UI (shell dock) |

### Shell (`components/shell/`)

- `AppShell` — layout grid, sidebar collapse, theme class on root
- `ProductNav` — switches mail / calendar / contacts
- `Sidebar` frame — scroll region + dock slot; products fill nav content

### Mail (`features/mail/`)

- `MailSidebar`, `MessageList`, `MailCard`, `ReaderPanel`, `ComposeDialog`
- Query: mailbox via mock API
- Zustand: selection, folder, layout mode, inbox detail, search, filter, compose, local stars

### Calendar (`features/calendar/`)

- Full placeholder UI: month header, week/day strip, event list using kit primitives
- Mock events + Query hook over mock API

### Contacts (`features/contacts/`)

- Full placeholder UI: searchable contact list + detail pane using kit primitives
- Mock contacts + Query hook over mock API

### Styles

Co-locate CSS by module (shell / mail / calendar / contacts / ui) instead of one mega `App.css`. Preserve the overall visual language; normalize repeated patterns into kit classes freely.

## Data flow & state

### TanStack Query + mock API

- Keep `QueryClientProvider` in `main.tsx` with a stable `QueryClient` instance.
- Client mock API lives in `client/src/api/` (not the empty sibling `qwix-webmail-client/api/` package):
  - `client.ts` — shared `delay()`, error helpers
  - `mail.ts` / `calendar.ts` / `contacts.ts` — async typed fetchers backed by fixtures
- Feature query options/hooks call these API functions as `queryFn`s (prefer `queryOptions` factories where practical).
- Fixtures stay under `src/data/`; only the API layer imports them.
- When a real backend exists, swap `queryFn` implementations behind the same API module interfaces — UI and stores stay unchanged.

### Zustand (chosen over Jotai)

Related UI clusters (shell + mail selection/layout) fit typed stores with selectors better than many independent atoms. Keeps a hard seam with Query.

- `useShellStore` — `productView`, `lightMode`, `sidebarCollapsed` (+ actions)
- `useMailUiStore` — `selectedId`, `activeFolder`, `layoutMode`, `inboxDetailOpen`, `search`, `filterOpen`, `composeOpen`, `starredIds` (+ actions)

Jotai is deferred unless fine-grained derived atoms become necessary later.

## Error handling & loading UX

### Query states

- **Pending:** Skeleton placeholders that preserve list/panel layout (`Skeleton`, `SkeletonRow`, etc.).
- **Error:** Inline error in the product workspace with **Retry** (`refetch`). Retry button may show a `Spinner` while refetching.
- **Empty (success, zero rows):** Distinct empty copy (search miss, no events, no contacts).

### Actions

- Compose/discard/close remain local UI actions.
- Empty send may no-op or show light inline validation (no toast system in this pass).
- `Spinner` on discrete in-flight actions only (Retry, Send) — not as a full-page replacement.

### Boundaries

Lightweight error boundary around the active workspace so a product crash does not take down shell/nav.

## Testing

Out of scope for automated Vitest/RTL in this pass, but seams must stay testable:

- Mock API is the async test seam (fixtures, forced rejects).
- Zustand actions assertable in isolation.
- UI kit remains presentational.

**Manual checklist for this pass:**

- [ ] Switch Mail / Calendar / Contacts
- [ ] Collapse sidebar; theme toggle
- [ ] Mail split vs inbox layout; open/read; search empty
- [ ] Force mock API reject → error + Retry
- [ ] Skeletons visible during pending
- [ ] Open/close compose
- [ ] Calendar and Contacts placeholders render (skeleton → data)

## Non-goals

- Real backend / auth
- Pixel-perfect freeze of current CSS
- Toast/notification system
- Full automated test suite
- Jotai or jotai-tanstack-query integration
- Routing library (product switch stays in Zustand for this pass)

## Success criteria

1. `App.tsx` is a thin composer; product UI lives under `features/*`.
2. Shared kit + shell are the only cross-product UI dependencies.
3. Domain data loads through TanStack Query → mock API (no fixture imports in UI).
4. Client UI prefs live in Zustand stores with selectors.
5. Calendar and Contacts ship full placeholder UIs using the kit.
6. Loading uses skeletons; actions use spinners; errors are recoverable via Retry.
