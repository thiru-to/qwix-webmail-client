# Add Items Forms (Mail, Calendar, Contacts) — Design

**Date:** 2026-08-12  
**Status:** Approved for planning  
**App:** Qwix Mail client (`client/`)  
**Depends on:** [Component Reusability & Multi-Product Shell](./2026-08-12-component-reusability-design.md)

## Goal

Add consistent create flows for new email messages, calendar events, and contacts. Persist creates into the mock API so new items appear in product UIs. Polish Compose so it matches the rest of the app.

## Decisions

| Topic | Choice |
|---|---|
| Persistence | Mock API mutations; invalidate Query; select created entity |
| Presentation | Hybrid — Compose = centered modal; Event/Contact = side panels over detail |
| Field richness | Full mock models (incl. Cc/Bcc, attachments stub, attendees, notes, tones) |
| Create CTAs | In-product toolbars only (not shell `primaryAction`) |
| Architecture | Shared create kit + product forms + TanStack mutations |

## Current state

- Mail has a bare `ComposeDialog` (local fake send, no API write, inconsistent styling).
- Calendar and Contacts have no create UI or mutations.
- Mock APIs (`api/mail.ts`, `api/calendar.ts`, `api/contacts.ts`) are read-only.
- Shared `Dialog` exists but is compose-branded and under-polished.
- Mail already uses `mailUi.composeOpen`; calendar/contacts lack create-open state.

## Architecture

```
features/mail
  ComposeDialog (modal) + toolbar Compose CTA
  useCreateMessage → api/mail.createMessage

features/calendar
  EventFormPanel (side panel) + toolbar New event CTA
  useCreateEvent → api/calendar.createEvent

features/contacts
  ContactFormPanel (side panel) + toolbar New contact CTA
  useCreateContact → api/contacts.createContact

components/ui
  Dialog (polished), SidePanel, FormField, TextArea, helpers as needed

stores
  mailUi.composeOpen
  calendarUi.createOpen (+ focusDate prefill)
  contactsUi.createOpen (+ selectedId for consistency)

api/* + data/*
  Mutable in-memory fixtures; create* appends and returns the entity
```

### Seams

1. Shell does not own create CTAs; products place buttons in their own toolbars.
2. Products do not import each other; they share only `components/ui/*`.
3. UI never mutates fixtures directly — writes go through mock API + Query mutations.
4. On success: invalidate product query, select new entity, close form, reset fields.

## Components

### Shared kit (`components/ui/`)

| Module | Role |
|---|---|
| `Dialog` | Polished modal chrome (tokens, spacing, header/footer) for Compose |
| `SidePanel` | Detail-column overlay: eyebrow, title, close, scroll body, sticky footer |
| `FormField` | Label + control + optional hint/error |
| `TextArea` | Multi-line kit primitive |
| Helpers | Only if ≥2 call sites (e.g. chip/token input, tone picker, field row) |

### Mail — `ComposeDialog`

- Toolbar CTA: **Compose** in the mail list/reader toolbar (remove reliance on shell `primaryAction` for this flow).
- Fields: To, Cc, Bcc, Subject, body, attachments stub (filename chips; no upload).
- Footer: Send (spinner while mutating), Discard.
- Visual: labeled fields, clear hierarchy, aligned with `Panel` typography — not bare stacked inputs.

### Calendar — `EventFormPanel`

- Toolbar CTA: **New event** beside Today / view switcher.
- Prefill `date` from `focusDate`.
- Fields: title, date, start/end time, location, attendees, notes, tone.
- Occupies the event detail column while open.

### Contacts — `ContactFormPanel`

- Toolbar CTA: **New contact** on the contacts list panel actions.
- Fields: name, email, phone, company, role, notes, avatar tone.
- Occupies the contact detail column while open.

### Open state

- `useMailUiStore`: existing `composeOpen`
- `useCalendarUiStore`: add `createOpen`
- `useContactsUiStore` (new): `createOpen`, `selectedId` (move selection out of local React state for consistency)

## Data flow & state

### Mock API mutations

Share the existing `delay()` / `maybeFail()` seam.

- **`createMessage(input)`** — Append a `Mail` to in-memory mailbox; surface under **Sent**; bump Sent folder count; return the message. Map compose fields: account as sender, body → `body[]` + `preview`, attachments stub → `attachments`, timestamps = now.
- **`createEvent(input)`** — Append a `CalendarEvent`; derive `day`, `time`, `startMinutes` / `endMinutes` from date + start/end; return the event. Day `hasEvents` remains correct via helpers over `events`.
- **`createContact(input)`** — Append a `Contact`; derive `initials` from name when omitted; return the contact.

Fixtures are mutable module state behind the API. UI still does not import fixtures for writes.

### TanStack Query

- Feature mutation hooks call the create APIs.
- `onSuccess`: invalidate product query key; set selected id; close create UI; reset form.
- Compose success: switch active folder to **Sent** and select the new message.

### Client state

- Zustand owns ephemeral open flags and selection / focus date.
- Form field values stay local in form components; reset on close or success.
- No dirty-state confirmation dialog in this pass.

### Defaults

- Event: `date = focusDate`; start/end default to a sensible next hour slot.
- Contact: default avatar tone; initials from name.
- Mail: sender from mailbox account; preview/body from compose body; time/date = now.

## Error handling & loading

- **Validation:** Required fields via `FormField` errors; block submit until fixed. No toasts.
- **Mutation pending:** Primary action shows `Spinner` and is disabled; form stays open.
- **Mutation error:** Inline error in the form; user can retry submit. Do not close on failure.
- **Discard / close:** Close and reset; no unsaved-changes confirm.
- **Post-success refetch:** Prefer keeping prior Query data; skeletons only if pending is visible.

## Testing (manual)

- [ ] Mail: Compose from toolbar → validate → send → appears in Sent and is selected
- [ ] Calendar: New event → focus date prefilled → save → visible in agenda/grid and selected
- [ ] Contacts: New contact → save → appears in list and selected
- [ ] Force mutation fail → inline error; retry succeeds
- [ ] Side panels match detail chrome; Compose modal matches app tokens
- [ ] Cc/Bcc, attendees, attachments stub, tones round-trip into created entities

## Non-goals

- Real upload / SMTP / backend
- Toast / notification system
- Dirty-state confirm dialogs
- Edit or delete of existing items
- Shell-level create CTA (`primaryAction`)
- Automated Vitest/RTL suite for this pass

## Success criteria

1. All three products can create items from in-product toolbars.
2. Creates persist via mock API and appear in the relevant product UI after invalidation.
3. Compose is visually consistent with the shared kit and app chrome.
4. Event and Contact create UIs use `SidePanel` over the detail column.
5. Validation and mutation errors are inline and recoverable; pending uses `Spinner`.
6. Products remain decoupled; shared UI lives only in `components/ui/`.
