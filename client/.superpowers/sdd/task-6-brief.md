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
