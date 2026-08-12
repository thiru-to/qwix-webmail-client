# Task 6 Report: Contacts New Contact side panel

## Status

Complete.

## Changes

1. **`src/features/contacts/mutations.ts`** — Added `useCreateContact()` with contacts query invalidation, created-contact selection, and panel close on success.
2. **`src/features/contacts/ContactFormPanel.tsx`** — Added the full contact form with required name/email validation, all requested fields, five avatar tones including plum, pending state, and inline mutation errors.
3. **`src/features/contacts/ContactsWorkspace.tsx`** — Added the New contact directory action and replaced the contact detail column with the create panel while open.
4. **`src/features/contacts/contacts.css`** — Added scoped side-panel, form, footer, error, and responsive field styles.
5. **`src/api/contacts.ts`** — Re-exported `Contact` and `ContactsData`, allowing contacts UI types to flow through the API boundary.

## Commit

```text
9644d90 feat: add New Contact side panel with mock API persistence
```

5 files changed, 261 insertions, 32 deletions.

## Verification

- `pnpm build` — passed (`tsc -b && vite build`, 1,729 modules transformed).
- IDE lint diagnostics — no errors in the five Task 6 files.
- Browser smoke — New contact opened in the detail column with every requested field and all five tones, showed inline required name/email validation, then persisted and selected a fully populated created contact.

## Self-review

- Contact UI types now come through `api/contacts`; the touched workspace no longer imports fixture types directly.
- Success handling invalidates the contacts query before selecting the created contact and closing the form.
- Required fields and mutation failures remain inline and retryable; controls are disabled while saving.
- The implementation follows the existing Calendar side-panel and mutation patterns without adding dependencies.
- Only the four contacts feature files and the contacts API re-export were committed; unrelated workspace edits remain unstaged.

## Concerns

None. Automated Vitest coverage was intentionally omitted per the task brief.

## Review fix (Important)

**Issue:** After create, `selectedId` was set but detail resolved from search-filtered `visible` first, so an active search hid the newly created contact.

**Fix:** Resolve selection from full `contacts` by `selectedId` before falling back to `visible[0]` / `contacts[0]` in `ContactsWorkspace.tsx`.

**Commit:** `0f144f6` — fix: resolve contact selection from full list after create

**Verification:** `pnpm build` — passed.
