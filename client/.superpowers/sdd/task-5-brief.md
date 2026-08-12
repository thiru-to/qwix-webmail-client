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
