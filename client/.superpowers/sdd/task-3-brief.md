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
