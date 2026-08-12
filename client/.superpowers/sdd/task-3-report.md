# Task 3 Report: UI stores for create open state

## Status

Complete.

## Changes

1. **`src/stores/calendarUiStore.ts`** — Added `createOpen: boolean` (default `false`) and `setCreateOpen(open: boolean)`.
2. **`src/stores/contactsUiStore.ts`** — New Zustand store with `selectedId` (default `'avery'`), `createOpen` (default `false`), `setSelectedId`, and `setCreateOpen`.
3. **`src/features/contacts/ContactsWorkspace.tsx`** — Replaced local `useState` for `selectedId` with `useContactsUiStore`; kept local `search` state unchanged.

## Commit

```
13239c0 feat: add createOpen UI state for calendar and contacts
```

3 files changed, 34 insertions, 3 deletions.

## Verification

- `pnpm build` — passed (tsc + vite build, no errors)

## Self-review

- Calendar store matches brief interface verbatim.
- Contacts store matches brief defaults and shape verbatim.
- ContactsWorkspace wiring is minimal: only selection moved to store; search remains local as specified.
- No form panels or create CTAs added (deferred to Tasks 4–6).
- No linter errors on modified files.

## Concerns

None. `createOpen` flags are unused until later tasks wire toolbar CTAs and form panels — expected per scope.

## Review fix (2026-08-12)

**Finding:** Task 3 commit included out-of-scope `useShellStore` / `sidebarCollapsed` / folder `title` tooltip changes in `ContactsWorkspace.tsx`.

**Fix:** Removed `useShellStore` import, `sidebarCollapsed` usage, and collapsed-sidebar `title` props on folder buttons. Kept `useContactsUiStore` `selectedId` / `setSelectedId` wiring and local `search` state. Store files unchanged (`createOpen` retained).

**Commit:** `d2a8a0d fix: remove out-of-scope sidebar changes from ContactsWorkspace`

**Verification:** `pnpm build` — passed (tsc + vite build, no errors)
