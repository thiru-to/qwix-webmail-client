# Component Reusability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the Qwix Mail monolith into a shared UI kit + app shell + mail/calendar/contacts features, with TanStack Query mock API and Zustand UI stores.

**Architecture:** `App` composes `AppShell`, which renders one product workspace. Domain data flows `fixtures → src/api/* → useQuery`; UI prefs live in Zustand. Shared primitives live in `components/ui`; products never import each other.

**Tech Stack:** React 19, Vite, TypeScript, TanStack Query v5, Zustand, Lucide, existing CSS (co-located by module).

## Global Constraints

- No fixture imports in UI — only `src/api/*` may import `src/data/*`
- Automated Vitest/RTL out of scope; verify with `pnpm build` + manual checklist
- No git repo in workspace — skip commits
- Preserve DM Sans / dark-first visual language; free to normalize repeated patterns
- Client mock API is `client/src/api/` (not sibling `qwix-webmail-client/api/`)

## File map

| Path | Responsibility |
|---|---|
| `src/api/client.ts` | `delay`, `ApiError`, optional fail flag helper |
| `src/api/mail.ts` | `fetchMailbox(): Promise<Mailbox>` |
| `src/api/calendar.ts` | `fetchCalendar(): Promise<CalendarData>` |
| `src/api/contacts.ts` | `fetchContacts(): Promise<ContactsData>` |
| `src/data/mockMail.ts` | Mail fixtures + types (existing) |
| `src/data/mockCalendar.ts` | Calendar fixtures + types |
| `src/data/mockContacts.ts` | Contacts fixtures + types |
| `src/stores/shellStore.ts` | productView, theme, sidebarCollapsed |
| `src/stores/mailUiStore.ts` | selection, layout, search, compose, stars |
| `src/components/ui/*` | Kit primitives + `ui.css` |
| `src/components/shell/*` | AppShell, ProductNav, Sidebar + `shell.css` |
| `src/features/mail/*` | Mail workspace + pieces + queries + `mail.css` |
| `src/features/calendar/*` | Calendar workspace + `calendar.css` |
| `src/features/contacts/*` | Contacts workspace + `contacts.css` |
| `src/components/WorkspaceErrorBoundary.tsx` | Catches workspace render errors |
| `src/App.tsx` | Thin composer |
| `src/main.tsx` | Stable QueryClient + providers |
| `src/App.css` | Remove after styles co-located (or reduce to tokens only) |
| `src/styles/tokens.css` | CSS variables shared across modules |

---

### Task 1: Dependencies + QueryClient + tokens

**Files:**
- Modify: `package.json` (add `zustand`)
- Modify: `src/main.tsx`
- Create: `src/styles/tokens.css`
- Modify: `src/index.css` (import tokens)

- [ ] **Step 1:** Install zustand

```bash
pnpm add zustand
```

- [ ] **Step 2:** Create `src/styles/tokens.css` with existing `:root` variables from `App.css` (canvas, chrome, panel, pink, etc.) plus light-theme overrides currently under `.theme-light` if present.

- [ ] **Step 3:** Update `src/main.tsx` to create a stable QueryClient:

```tsx
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

function Root() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
```

- [ ] **Step 4:** Import tokens from `index.css`: `@import './styles/tokens.css';`

- [ ] **Step 5:** Verify `pnpm build` still passes (App unchanged so far).

---

### Task 2: Mock data + API layer

**Files:**
- Keep: `src/data/mockMail.ts`
- Create: `src/data/mockCalendar.ts`, `src/data/mockContacts.ts`
- Create: `src/api/client.ts`, `src/api/mail.ts`, `src/api/calendar.ts`, `src/api/contacts.ts`

**Interfaces:**
- Produces:
  - `delay(ms?: number): Promise<void>`
  - `fetchMailbox(): Promise<Mailbox>`
  - `fetchCalendar(): Promise<CalendarData>`
  - `fetchContacts(): Promise<ContactsData>`
  - Types: `CalendarEvent`, `CalendarData`, `Contact`, `ContactsData`

- [ ] **Step 1:** Create `src/api/client.ts`:

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Flip to true in devtools to exercise error UI: `globalThis.__QWIX_API_FAIL__ = true` */
declare global {
  // eslint-disable-next-line no-var
  var __QWIX_API_FAIL__: boolean | undefined
}

export async function delay(ms = 450): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function maybeFail(label: string): Promise<void> {
  if (globalThis.__QWIX_API_FAIL__) {
    throw new ApiError(`Mock ${label} request failed`, 503)
  }
}
```

- [ ] **Step 2:** Create calendar/contacts fixtures (3–5 realistic placeholder rows each) and API modules that `await delay(); await maybeFail(...); return fixture`.

- [ ] **Step 3:** `src/api/mail.ts` wraps existing `mailbox` export the same way.

---

### Task 3: Zustand stores

**Files:**
- Create: `src/stores/shellStore.ts`, `src/stores/mailUiStore.ts`

**Interfaces:**
- Produces: `useShellStore`, `useMailUiStore` with selectors

- [ ] **Step 1:** Implement shell store:

```ts
import { create } from 'zustand'

export type ProductView = 'mail' | 'calendar' | 'contacts'

type ShellState = {
  productView: ProductView
  lightMode: boolean
  sidebarCollapsed: boolean
  setProductView: (view: ProductView) => void
  toggleLightMode: () => void
  toggleSidebarCollapsed: () => void
}

export const useShellStore = create<ShellState>()((set) => ({
  productView: 'mail',
  lightMode: false,
  sidebarCollapsed: false,
  setProductView: (productView) => set({ productView }),
  toggleLightMode: () => set((s) => ({ lightMode: !s.lightMode })),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
```

- [ ] **Step 2:** Implement mail UI store with: `selectedId` (default `'stripe-payout'`), `activeFolder` (`'Inbox'`), `layoutMode` (`'split' | 'inbox'`), `inboxDetailOpen`, `search`, `filterOpen`, `composeOpen`, `starredIds` (`['stripe-payout']`), and setters/toggles (`setSelectedId`, `setActiveFolder`, `setLayoutMode`, `setInboxDetailOpen`, `setSearch`, `toggleFilterOpen`, `setComposeOpen`, `toggleStar`).

---

### Task 4: Shared UI kit

**Files:**
- Modify: `src/components/ui/button.tsx`, `badge.tsx`, `input.tsx`
- Create: `icon-button.tsx`, `avatar.tsx`, `dialog.tsx`, `search-field.tsx`, `panel.tsx`, `toolbar.tsx`, `list.tsx`, `skeleton.tsx`, `spinner.tsx`, `storage-meter.tsx`, `query-state.tsx`
- Create: `src/components/ui/ui.css`

**Interfaces:**
- Produces kit components used by shell + all features
- `QueryState` helper: pending → skeletons slot; error → message + Retry with Spinner; else children

- [ ] **Step 1:** Implement primitives with `cn()` and CSS classes in `ui.css` (port relevant rules from `App.css`: `.ui-button*`, `.ui-badge`, `.ui-input`, avatars, dialogs, skeletons, spinner).
- [ ] **Step 2:** `QueryState` props: `{ isPending, isError, error, onRetry, isFetching, pending, children }`.

---

### Task 5: App shell

**Files:**
- Create: `src/components/shell/AppShell.tsx`, `ProductNav.tsx`, `Sidebar.tsx`, `shell.css`
- Create: `src/components/WorkspaceErrorBoundary.tsx`

**Interfaces:**
- Consumes: `useShellStore`, kit (`Button`, `IconButton`, `StorageMeter`, …)
- Produces: `AppShell({ sidebar, children })` — products supply sidebar content + main

- [ ] **Step 1:** Build shell that applies `mail-app` / `theme-light`, workspace grid, brand row, ProductNav, collapse control, theme toggle, dock slot.
- [ ] **Step 2:** Error boundary with reset UI.

---

### Task 6: Mail feature

**Files:**
- Create: `src/features/mail/queries.ts`, `MailWorkspace.tsx`, `MailSidebar.tsx`, `MessageList.tsx`, `MailCard.tsx`, `ReaderPanel.tsx`, `ComposeDialog.tsx`, `mail.css`
- Port behavior from current `App.tsx`

**Interfaces:**
- Consumes: `fetchMailbox`, `useMailUiStore`, `useShellStore` (layout dock pieces), kit
- Produces: `MailWorkspace` as default export for App

- [ ] **Step 1:** `mailQueries.mailbox = queryOptions({ queryKey: ['mailbox'], queryFn: fetchMailbox })`
- [ ] **Step 2:** Extract components; wire QueryState skeletons; Compose via Dialog; layout switcher in sidebar dock when product is mail.

---

### Task 7: Calendar + Contacts placeholders

**Files:**
- Create: `src/features/calendar/queries.ts`, `CalendarWorkspace.tsx`, `calendar.css`
- Create: `src/features/contacts/queries.ts`, `ContactsWorkspace.tsx`, `contacts.css`

- [ ] **Step 1:** Calendar: month header + Toolbar, weekday strip, event `List`/`ListRow`, detail `Panel`; QueryState skeletons.
- [ ] **Step 2:** Contacts: SearchField, contact list, detail panel with Avatar; QueryState skeletons.

---

### Task 8: Wire App + cleanup

**Files:**
- Replace: `src/App.tsx` (thin composer)
- Delete or gut: `src/App.css` after all rules moved
- Ensure imports use co-located CSS from shell/ui/features

- [ ] **Step 1:** App selects workspace from `productView`; passes product-specific sidebar into `AppShell`.
- [ ] **Step 2:** `pnpm build` and `pnpm lint` must pass.
- [ ] **Step 3:** Manual checklist from spec.

---

## Spec coverage

| Spec item | Task |
|---|---|
| UI kit primitives + Skeleton/Spinner | 4 |
| App shell / ProductNav | 5 |
| Mail feature + hooks/stores | 3, 6 |
| Calendar/Contacts full placeholders | 2, 7 |
| TanStack Query + mock API | 1, 2, 6, 7 |
| Zustand shell + mail UI | 3 |
| Error boundary + Retry | 4, 5 |
| Co-located CSS | 4–8 |
| Thin App.tsx | 8 |
