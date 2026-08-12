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
