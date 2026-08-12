# Add Items Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship create flows for mail, calendar events, and contacts that persist via mock API mutations, with a polished Compose modal and SidePanel forms for events/contacts.

**Architecture:** Shared form kit (`FormField`, `TextArea`, `ChipInput`, `TonePicker`, polished `Dialog`, new `SidePanel`) plus product-owned forms. Writes go through `create*` mock APIs; TanStack mutations invalidate queries, select the new entity, and close the form. Create CTAs live in product toolbars only.

**Tech Stack:** React 19, Vite, TypeScript, TanStack Query v5 (`useMutation` + `queryOptions`), Zustand, Lucide, existing CSS tokens / co-located module CSS.

## Global Constraints

- No fixture imports in UI — only `src/api/*` may import `src/data/*`
- Automated Vitest/RTL out of scope; verify with `pnpm build` + manual checklist from the spec
- Products must not import each other; share only `components/ui/*`
- No toast system; validation and mutation errors are inline
- No dirty-state confirm; Discard/close resets
- No shell `primaryAction` for create CTAs
- Commit after each task

## File map

| Path | Responsibility |
|---|---|
| `src/data/mockMail.ts` | Add `folder`, optional `cc`/`bcc`; keep fixtures mutable via API |
| `src/data/mockCalendar.ts` | Export helpers to append events + mark `hasEvents` |
| `src/data/mockContacts.ts` | Keep contacts array appendable |
| `src/api/mail.ts` | `createMessage` |
| `src/api/calendar.ts` | `createEvent` |
| `src/api/contacts.ts` | `createContact` |
| `src/components/ui/form-field.tsx` | Labeled field + error |
| `src/components/ui/textarea.tsx` | Kit textarea |
| `src/components/ui/chip-input.tsx` | Token/chip entry for attendees & attachments |
| `src/components/ui/tone-picker.tsx` | Tone / avatarTone selection |
| `src/components/ui/side-panel.tsx` | Detail-column create panel chrome |
| `src/components/ui/dialog.tsx` | Polished modal (tokenized classes) |
| `src/components/ui/ui.css` | Styles for form kit, dialog, side panel |
| `src/stores/calendarUiStore.ts` | Add `createOpen` |
| `src/stores/contactsUiStore.ts` | `createOpen` + `selectedId` |
| `src/features/mail/ComposeDialog.tsx` | Polished compose + mutation |
| `src/features/mail/MailWorkspace.tsx` | Toolbar Compose CTA (drop shell primaryAction) |
| `src/features/mail/MessageList.tsx` | Filter by `folder` / `activeFolder`; Compose button in heading |
| `src/features/mail/mutations.ts` | `useCreateMessage` |
| `src/features/calendar/EventFormPanel.tsx` | New event side panel |
| `src/features/calendar/CalendarWorkspace.tsx` | New event CTA + panel mount |
| `src/features/calendar/mutations.ts` | `useCreateEvent` |
| `src/features/contacts/ContactFormPanel.tsx` | New contact side panel |
| `src/features/contacts/ContactsWorkspace.tsx` | Wire store, CTA, panel |
| `src/features/contacts/mutations.ts` | `useCreateContact` |
| `src/features/mail/mail.css` / `calendar.css` / `contacts.css` | Product-specific form tweaks |

---

### Task 1: Mutable fixtures + create mock APIs

**Files:**
- Modify: `src/data/mockMail.ts`
- Modify: `src/data/mockCalendar.ts`
- Modify: `src/data/mockContacts.ts`
- Modify: `src/api/mail.ts`
- Modify: `src/api/calendar.ts`
- Modify: `src/api/contacts.ts`

**Interfaces:**
- Produces:
  - `CreateMessageInput`, `createMessage(input): Promise<Mail>`
  - `CreateEventInput`, `createEvent(input): Promise<CalendarEvent>`
  - `CreateContactInput`, `createContact(input): Promise<Contact>`
  - `Mail.folder: string`; optional `cc?: string[]`; `bcc?: string[]`

- [ ] **Step 1: Extend `Mail` and seed `folder: 'Inbox'` on existing messages**

In `src/data/mockMail.ts`, update the type and every message object:

```ts
export type Mail = {
  id: string
  sender: string
  email: string
  initials: string
  avatarTone: string
  subject: string
  preview: string
  time: string
  date: string
  unread?: boolean
  starred?: boolean
  labels: MailLabel[]
  attachments?: string[]
  body: string[]
  folder: string
  cc?: string[]
  bcc?: string[]
}
```

Add `folder: 'Inbox'` to each existing message in `mailbox.messages`.

Export a mutable reference if needed — `mailbox` is already a mutable object; keep mutating `mailbox.messages` and `mailbox.folders` in the API layer.

- [ ] **Step 2: Add calendar append helper**

In `src/data/mockCalendar.ts`, add:

```ts
export function appendCalendarEvent(event: CalendarEvent): CalendarEvent {
  calendarEvents.push(event)
  for (const day of [
    ...calendarData.monthDays,
    ...calendarData.fourWeekDays,
    ...calendarData.weekDays,
    ...calendarData.yearMonths.flatMap((m) => m.days),
  ]) {
    if (day.date === event.date) day.hasEvents = true
  }
  return event
}

function formatEventTime(startMinutes: number, endMinutes: number): string {
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 === 0 ? 12 : h % 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
  }
  return `${fmt(startMinutes)} – ${fmt(endMinutes)}`
}

function formatEventDay(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', ' ·')
}

export function buildCalendarEvent(input: {
  id: string
  title: string
  date: string
  startMinutes: number
  endMinutes: number
  location: string
  tone: EventTone
  attendees: string[]
}): CalendarEvent {
  return {
    ...input,
    time: formatEventTime(input.startMinutes, input.endMinutes),
    day: formatEventDay(input.date),
  }
}
```

Ensure `calendarEvents` is a `let`/`const` array that `calendarData.events` references (same array identity) so pushes show up on fetch.

- [ ] **Step 3: Add contact initials helper**

In `src/data/mockContacts.ts`:

```ts
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
}

export function appendContact(contact: Contact): Contact {
  contactsData.contacts.push(contact)
  return contact
}
```

- [ ] **Step 4: Implement `createMessage` in `src/api/mail.ts`**

```ts
import { mailbox, type Mail } from '../data/mockMail'
import { delay, maybeFail } from './client'

export type CreateMessageInput = {
  to: string
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  attachments?: string[]
}

export async function fetchMailbox() {
  await delay()
  await maybeFail('mailbox')
  return mailbox
}

export async function createMessage(input: CreateMessageInput): Promise<Mail> {
  await delay()
  await maybeFail('createMessage')
  const now = new Date()
  const bodyLines = input.body.split(/\n/).filter((line) => line.length > 0)
  const message: Mail = {
    id: `sent-${now.getTime()}`,
    sender: mailbox.account.name,
    email: mailbox.account.email,
    initials: mailbox.account.name
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    avatarTone: 'plum',
    subject: input.subject.trim(),
    preview: input.body.trim().slice(0, 120),
    time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    date: 'Today',
    labels: [],
    attachments: input.attachments?.length ? input.attachments : undefined,
    body: bodyLines.length ? bodyLines : [input.body.trim()],
    folder: 'Sent',
    cc: input.cc?.length ? input.cc : undefined,
    bcc: input.bcc?.length ? input.bcc : undefined,
  }
  mailbox.messages.unshift(message)
  const sent = mailbox.folders.find((f) => f.name === 'Sent')
  if (sent) sent.count += 1
  return message
}
```

- [ ] **Step 5: Implement `createEvent` in `src/api/calendar.ts`**

```ts
import {
  appendCalendarEvent,
  buildCalendarEvent,
  calendarData,
  type CalendarData,
  type EventTone,
} from '../data/mockCalendar'
import { delay, maybeFail } from './client'

export type CreateEventInput = {
  title: string
  date: string
  startMinutes: number
  endMinutes: number
  location: string
  attendees: string[]
  notes?: string
  tone: EventTone
}

export async function fetchCalendar(): Promise<CalendarData> {
  await delay()
  await maybeFail('calendar')
  return calendarData
}

export async function createEvent(input: CreateEventInput) {
  await delay()
  await maybeFail('createEvent')
  const event = appendCalendarEvent(
    buildCalendarEvent({
      id: `event-${Date.now()}`,
      title: input.title.trim(),
      date: input.date,
      startMinutes: input.startMinutes,
      endMinutes: input.endMinutes,
      location: input.location.trim() || 'TBD',
      tone: input.tone,
      attendees: input.attendees,
    }),
  )
  // notes are UI-only for this pass unless you add a notes field to CalendarEvent;
  // prefer extending CalendarEvent with optional notes?: string and set it here.
  return event
}
```

Also add optional `notes?: string` to `CalendarEvent` in `mockCalendar.ts` and pass `input.notes` through `buildCalendarEvent` / append.

- [ ] **Step 6: Implement `createContact` in `src/api/contacts.ts`**

```ts
import {
  appendContact,
  contactsData,
  initialsFromName,
  type Contact,
  type ContactsData,
} from '../data/mockContacts'
import { delay, maybeFail } from './client'

export type CreateContactInput = {
  name: string
  email: string
  phone: string
  company: string
  role: string
  notes: string
  avatarTone: Contact['avatarTone']
}

export async function fetchContacts(): Promise<ContactsData> {
  await delay()
  await maybeFail('contacts')
  return contactsData
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  await delay()
  await maybeFail('createContact')
  return appendContact({
    id: `contact-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    company: input.company.trim(),
    role: input.role.trim(),
    notes: input.notes.trim(),
    avatarTone: input.avatarTone,
    initials: initialsFromName(input.name),
  })
}
```

- [ ] **Step 7: Verify build**

```bash
pnpm build
```

Expected: success (types compile).

- [ ] **Step 8: Commit**

```bash
git add src/data/mockMail.ts src/data/mockCalendar.ts src/data/mockContacts.ts src/api/mail.ts src/api/calendar.ts src/api/contacts.ts
git commit -m "$(cat <<'EOF'
feat: add mock create APIs for mail, events, and contacts

Make fixtures mutable and expose typed create* helpers so product forms can persist new items through TanStack mutations.
EOF
)"
```

---

### Task 2: Shared form kit + SidePanel + Dialog polish

**Files:**
- Create: `src/components/ui/form-field.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/chip-input.tsx`
- Create: `src/components/ui/tone-picker.tsx`
- Create: `src/components/ui/side-panel.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/ui.css`
- Modify: `src/App.css` (remove compose-dialog styles that move into `ui.css`, or leave and override — prefer migrating compose-* dialog rules into `ui.css` under `ui-dialog` / `ui-side-panel`)

**Interfaces:**
- Produces:
  - `FormField({ label, htmlFor, error?, children })`
  - `TextArea(props)` with class `ui-textarea`
  - `ChipInput({ value: string[]; onChange; placeholder; label })`
  - `TonePicker({ value; onChange; options: { id: string; label: string }[] })`
  - `SidePanel({ open; onClose; eyebrow?; title; children; footer? })`
  - `Dialog` keeps same props; class names become `ui-dialog-backdrop` / `ui-dialog`

- [ ] **Step 1: Create `form-field.tsx`**

```tsx
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type FormFieldProps = {
  label: string
  htmlFor: string
  error?: string | null
  children: ReactNode
  className?: string
}

export function FormField({ label, htmlFor, error, children, className }: FormFieldProps) {
  return (
    <label className={cn('ui-form-field', className)} htmlFor={htmlFor}>
      <span className="ui-form-label">{label}</span>
      {children}
      {error ? <span className="ui-form-error">{error}</span> : null}
    </label>
  )
}
```

- [ ] **Step 2: Create `textarea.tsx`**

```tsx
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('ui-textarea', className)} {...props} />
}
```

- [ ] **Step 3: Create `chip-input.tsx`**

Enter adds a chip; Backspace on empty input removes last chip; each chip has remove button.

```tsx
import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

type ChipInputProps = {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  className?: string
}

export function ChipInput({ id, value, onChange, placeholder, className }: ChipInputProps) {
  const [draft, setDraft] = useState('')

  function commit(raw: string) {
    const next = raw.trim()
    if (!next || value.includes(next)) {
      setDraft('')
      return
    }
    onChange([...value, next])
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit(draft)
    }
    if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className={cn('ui-chip-input', className)}>
      {value.map((chip) => (
        <span key={chip} className="ui-chip">
          {chip}
          <button
            type="button"
            aria-label={`Remove ${chip}`}
            onClick={() => onChange(value.filter((item) => item !== chip))}
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length ? undefined : placeholder}
      />
    </div>
  )
}
```

- [ ] **Step 4: Create `tone-picker.tsx`**

```tsx
import { cn } from '../../lib/utils'

type ToneOption = { id: string; label: string }

type TonePickerProps = {
  value: string
  onChange: (value: string) => void
  options: ToneOption[]
  label?: string
}

export function TonePicker({ value, onChange, options, label = 'Color' }: TonePickerProps) {
  return (
    <div className="ui-tone-picker" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={cn('ui-tone-swatch', `tone-${option.id}`, value === option.id && 'active')}
          aria-pressed={value === option.id}
          aria-label={option.label}
          onClick={() => onChange(option.id)}
        />
      ))}
    </div>
  )
}
```

Add `.tone-rose`, `.tone-green`, `.tone-purple`, `.tone-orange`, `.tone-plum` background colors in `ui.css`.

- [ ] **Step 5: Create `side-panel.tsx`**

```tsx
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

type SidePanelProps = {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function SidePanel({ open, onClose, title, eyebrow, children, footer, className }: SidePanelProps) {
  if (!open) return null
  return (
    <section className={cn('ui-side-panel reader-panel', className)} role="dialog" aria-modal="true" aria-labelledby="side-panel-title">
      <div className="ui-side-panel-header">
        <div>
          {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
          <h2 id="side-panel-title">{title}</h2>
        </div>
        <button type="button" className="close-dialog" aria-label="Close panel" onClick={onClose}>
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>
      <div className="ui-side-panel-body">{children}</div>
      {footer ? <div className="ui-side-panel-footer">{footer}</div> : null}
    </section>
  )
}
```

- [ ] **Step 6: Polish `dialog.tsx`**

Rename classes to `ui-dialog-backdrop`, `ui-dialog`, `ui-dialog-header` (keep `close-dialog` or rename to `ui-dialog-close`). Preserve props API.

- [ ] **Step 7: Add CSS in `ui.css`**

Include styles for:
- `.ui-form-field`, `.ui-form-label`, `.ui-form-error`
- `.ui-textarea` and denser `.ui-input` when inside forms (`.ui-form-field .ui-input`)
- `.ui-chip-input`, `.ui-chip`
- `.ui-tone-picker`, `.ui-tone-swatch`
- `.ui-dialog-backdrop`, `.ui-dialog`, footer actions
- `.ui-side-panel` filling the detail column (`display:flex; flex-direction:column; min-height:0; height:100%`), sticky footer

Use CSS variables from `tokens.css` (`--panel`, `--line`, `--pink`, `--text`, `--muted`). Match light theme with `.theme-light` overrides.

Migrate existing `.compose-backdrop` / `.compose-dialog` rules from `App.css` into these new classes (delete or leave unused old rules).

- [ ] **Step 8: Verify build**

```bash
pnpm build
```

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/ src/App.css
git commit -m "$(cat <<'EOF'
feat: add shared form kit, SidePanel, and polished Dialog

Provide FormField, TextArea, ChipInput, and TonePicker so product create flows share consistent chrome and validation UI.
EOF
)"
```

---

### Task 3: UI stores for create open state

**Files:**
- Modify: `src/stores/calendarUiStore.ts`
- Create: `src/stores/contactsUiStore.ts`
- Modify: `src/features/contacts/ContactsWorkspace.tsx` (switch `selectedId` to store)

**Interfaces:**
- Produces:
  - `calendarUi.createOpen: boolean` + `setCreateOpen`
  - `useContactsUiStore`: `{ selectedId, createOpen, setSelectedId, setCreateOpen }`

- [ ] **Step 1: Extend calendar store**

```ts
type CalendarUiState = {
  viewMode: CalendarViewMode
  focusDate: string
  selectedEventId: string
  createOpen: boolean
  setViewMode: (viewMode: CalendarViewMode) => void
  setFocusDate: (focusDate: string) => void
  setSelectedEventId: (id: string) => void
  setCreateOpen: (open: boolean) => void
}

// defaults: createOpen: false
```

- [ ] **Step 2: Create contacts store**

```ts
import { create } from 'zustand'

type ContactsUiState = {
  selectedId: string
  createOpen: boolean
  setSelectedId: (id: string) => void
  setCreateOpen: (open: boolean) => void
}

export const useContactsUiStore = create<ContactsUiState>()((set) => ({
  selectedId: 'avery',
  createOpen: false,
  setSelectedId: (selectedId) => set({ selectedId }),
  setCreateOpen: (createOpen) => set({ createOpen }),
}))
```

- [ ] **Step 3: Wire ContactsWorkspace to the store**

Replace `useState` for `selectedId` with `useContactsUiStore`. Keep local `search` state.

- [ ] **Step 4: Verify build + Commit**

```bash
pnpm build
git add src/stores/calendarUiStore.ts src/stores/contactsUiStore.ts src/features/contacts/ContactsWorkspace.tsx
git commit -m "$(cat <<'EOF'
feat: add createOpen UI state for calendar and contacts

Centralize selection and create-panel flags in Zustand so form panels can open from product toolbars.
EOF
)"
```

---

### Task 4: Polished Compose + mail create mutation

**Files:**
- Create: `src/features/mail/mutations.ts`
- Modify: `src/features/mail/ComposeDialog.tsx`
- Modify: `src/features/mail/MailWorkspace.tsx`
- Modify: `src/features/mail/MessageList.tsx`
- Modify: `src/features/mail/mail.css`

**Interfaces:**
- Consumes: `createMessage`, `FormField`, `TextArea`, `ChipInput`, `Dialog`, `mailQueries.mailbox`
- Produces: `useCreateMessage()` mutation hook

- [ ] **Step 1: Create `mutations.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMessage, type CreateMessageInput } from '../../api/mail'
import { mailQueries } from './queries'
import { useMailUiStore } from '../../stores/mailUiStore'

export function useCreateMessage() {
  const queryClient = useQueryClient()
  const setSelectedId = useMailUiStore((s) => s.setSelectedId)
  const setActiveFolder = useMailUiStore((s) => s.setActiveFolder)
  const setComposeOpen = useMailUiStore((s) => s.setComposeOpen)

  return useMutation({
    mutationFn: (input: CreateMessageInput) => createMessage(input),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: mailQueries.mailbox().queryKey })
      setActiveFolder('Sent')
      setSelectedId(message.id)
      setComposeOpen(false)
    },
  })
}
```

- [ ] **Step 2: Rewrite `ComposeDialog.tsx`**

Fields: To, Cc, Bcc (ChipInput or text — use ChipInput for Cc/Bcc/attachments; To can be `Input` or ChipInput single). Subject `Input`. Body `TextArea`. Attachments `ChipInput` (placeholder “Add filename and press Enter”).

Validation: require To, Subject, Body — set per-field errors via `FormField`.

On Send: call `mutateAsync`; show `Spinner` on button; on mutation error show inline `mutation.error.message`.

Reset local state when `open` becomes false (effect) and after success (mutation closes).

Use polished `Dialog` eyebrow “New message” title “Compose”.

Footer: primary Send (`Button` or existing send styles under `ui-dialog-footer`), Discard closes.

- [ ] **Step 3: Move Compose CTA into MessageList heading actions**

In `MessageList.tsx` heading-actions, add:

```tsx
<Button size="sm" onClick={() => setComposeOpen(true)}>
  <PenLine size={16} strokeWidth={1.75} /> Compose
</Button>
```

In `MailWorkspace.tsx`, remove `primaryAction={...}` prop from `AppShell`. Keep `<ComposeDialog ... />` mounted.

- [ ] **Step 4: Filter messages by folder**

In `MessageList.tsx` `visibleMessages`:

```ts
const folderMessages = messages.filter((message) => message.folder === activeFolder)
// then apply search filter to folderMessages
```

- [ ] **Step 5: Style polish in `mail.css`**

Ensure compose form spacing uses kit classes; remove obsolete rules if migrated.

- [ ] **Step 6: Verify build + manual smoke**

```bash
pnpm build
pnpm dev
```

Manual: Compose → fill fields → Send → Sent folder shows message selected.

- [ ] **Step 7: Commit**

```bash
git add src/features/mail/
git commit -m "$(cat <<'EOF'
feat: polish Compose and persist sent messages via mock API

Move the Compose CTA into the mail toolbar, validate full compose fields, and append Sent messages through createMessage.
EOF
)"
```

---

### Task 5: Calendar New Event side panel

**Files:**
- Create: `src/features/calendar/mutations.ts`
- Create: `src/features/calendar/EventFormPanel.tsx`
- Modify: `src/features/calendar/CalendarWorkspace.tsx`
- Modify: `src/features/calendar/calendar.css`

**Interfaces:**
- Consumes: `createEvent`, `SidePanel`, form kit, `calendarUi.focusDate` / `createOpen`
- Produces: `useCreateEvent()`, `EventFormPanel`

- [ ] **Step 1: Create `mutations.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEvent, type CreateEventInput } from '../../api/calendar'
import { calendarQueries } from './queries'
import { useCalendarUiStore } from '../../stores/calendarUiStore'

export function useCreateEvent() {
  const queryClient = useQueryClient()
  const setSelectedEventId = useCalendarUiStore((s) => s.setSelectedEventId)
  const setCreateOpen = useCalendarUiStore((s) => s.setCreateOpen)

  return useMutation({
    mutationFn: (input: CreateEventInput) => createEvent(input),
    onSuccess: async (event) => {
      await queryClient.invalidateQueries({ queryKey: calendarQueries.calendar().queryKey })
      setSelectedEventId(event.id)
      setCreateOpen(false)
    },
  })
}
```

- [ ] **Step 2: Create `EventFormPanel.tsx`**

When `createOpen`:
- Prefill `date` from `focusDate`
- Default `startMinutes` = next whole hour from “now” clamped to 8:00–17:00 mock range, or fixed `10 * 60`; `endMinutes = startMinutes + 60`
- Fields: title, date (`type="date"`), start time, end time (time inputs mapped to minutes), location, attendees (`ChipInput`), notes (`TextArea`), tone (`TonePicker` with rose/green/purple/orange)
- Validate title + date + end > start
- Footer: Save event / Discard
- Render with `SidePanel` replacing the detail column content

Helper to parse `HH:MM` → minutes:

```ts
function parseTimeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function minutesToTimeInput(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}
```

- [ ] **Step 3: Wire CalendarWorkspace**

In toolbar actions, add:

```tsx
<Button size="sm" onClick={() => setCreateOpen(true)}>
  New event
</Button>
```

In the detail column area:

```tsx
{createOpen ? (
  <EventFormPanel />
) : (
  <section className="calendar-detail reader-panel">
    <EventDetail event={selected} />
  </section>
)}
```

- [ ] **Step 4: CSS tweaks** in `calendar.css` for side panel inside `.calendar-split`

- [ ] **Step 5: Verify build + manual smoke + Commit**

```bash
pnpm build
git add src/features/calendar/ src/stores/calendarUiStore.ts
git commit -m "$(cat <<'EOF'
feat: add New Event side panel with mock API persistence

Let users create calendar events from the toolbar; save appends via createEvent and selects the new event in the detail pane.
EOF
)"
```

---

### Task 6: Contacts New Contact side panel

**Files:**
- Create: `src/features/contacts/mutations.ts`
- Create: `src/features/contacts/ContactFormPanel.tsx`
- Modify: `src/features/contacts/ContactsWorkspace.tsx`
- Modify: `src/features/contacts/contacts.css`

**Interfaces:**
- Consumes: `createContact`, `SidePanel`, form kit, `contactsUi`
- Produces: `useCreateContact()`, `ContactFormPanel`

- [ ] **Step 1: Create `mutations.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContact, type CreateContactInput } from '../../api/contacts'
import { contactsQueries } from './queries'
import { useContactsUiStore } from '../../stores/contactsUiStore'

export function useCreateContact() {
  const queryClient = useQueryClient()
  const setSelectedId = useContactsUiStore((s) => s.setSelectedId)
  const setCreateOpen = useContactsUiStore((s) => s.setCreateOpen)

  return useMutation({
    mutationFn: (input: CreateContactInput) => createContact(input),
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({ queryKey: contactsQueries.contacts().queryKey })
      setSelectedId(contact.id)
      setCreateOpen(false)
    },
  })
}
```

- [ ] **Step 2: Create `ContactFormPanel.tsx`**

Fields: name, email, phone, company, role, notes, avatarTone (TonePicker including plum). Required: name + email. Footer Save / Discard.

- [ ] **Step 3: Wire ContactsWorkspace**

Panel actions:

```tsx
actions={
  <Button size="sm" onClick={() => setCreateOpen(true)}>
    New contact
  </Button>
}
```

Detail column:

```tsx
{createOpen ? <ContactFormPanel /> : (/* existing detail */)}
```

- [ ] **Step 4: Verify build + manual smoke + Commit**

```bash
pnpm build
git add src/features/contacts/ src/stores/contactsUiStore.ts
git commit -m "$(cat <<'EOF'
feat: add New Contact side panel with mock API persistence

Create contacts from the directory toolbar; saves append via createContact and select the new row in the detail pane.
EOF
)"
```

---

### Task 7: End-to-end polish pass

**Files:**
- Touch as needed: `src/components/ui/ui.css`, product CSS, light-theme overrides

- [ ] **Step 1: Manual checklist from the spec**

- [ ] Mail Compose from toolbar → validate → send → Sent + selected
- [ ] Calendar New event → focus date prefilled → save → agenda/grid + selected
- [ ] Contacts New contact → save → list + selected
- [ ] In console: `globalThis.__QWIX_API_FAIL__ = true` then submit → inline error; set `false` and retry → success
- [ ] Side panels match detail chrome; Compose matches tokens in dark + light
- [ ] Cc/Bcc, attendees, attachments, tones round-trip

- [ ] **Step 2: Fix any visual gaps** (spacing, focus rings, disabled send button, side panel scroll)

- [ ] **Step 3: Final build + Commit if CSS fixes landed**

```bash
pnpm build
git add -u
git commit -m "$(cat <<'EOF'
fix: polish create-form visuals across mail, calendar, and contacts

Align dialog/side-panel form spacing and theme tokens after the end-to-end create-flow checklist.
EOF
)"
```

(Skip empty commit if no changes.)

---

## Spec coverage self-review

| Spec requirement | Task |
|---|---|
| Persist via mock API + invalidate | 1, 4–6 |
| Compose modal polished | 2, 4 |
| Event/Contact SidePanel | 2, 5, 6 |
| Full model fields | 4–6 |
| In-product toolbar CTAs | 4–6 |
| Shared kit FormField/TextArea/etc. | 2 |
| Inline validation + mutation errors + Spinner | 4–6 |
| Select created entity; Sent folder for mail | 4 |
| Prefill event date from focusDate | 5 |
| contactsUi store | 3 |
| No shell primaryAction create | 4 |
| Manual test / no Vitest | 7 |

## Placeholder / consistency notes

- `CalendarEvent.notes` is added in Task 1 so notes round-trip (spec requirement).
- Mail `folder` filtering is required for Sent visibility (Task 4).
- Dialog class rename in Task 2 must update any remaining `compose-dialog` selectors in CSS.
