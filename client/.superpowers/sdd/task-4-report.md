# Task 4 Report: Polished Compose + mail create mutation

## Status

Complete.

## Changes

1. **`src/features/mail/mutations.ts`** — Added `useCreateMessage()` with mailbox invalidation and Sent-folder selection flow.
2. **`src/features/mail/ComposeDialog.tsx`** — Added To, Cc, Bcc, Subject, Message, and Attachments fields using the shared form kit; added per-field validation, pending state, inline mutation errors, and close-time reset.
3. **`src/features/mail/MessageList.tsx`** — Moved Compose into heading actions and filtered messages by active folder before search.
4. **`src/features/mail/MailWorkspace.tsx`** — Removed the AppShell `primaryAction` while retaining the mounted compose dialog.
5. **`src/features/mail/mail.css`** — Added scoped form spacing, mutation-error, and pending-button styles.

## Commit

```
5ac1c5a feat: polish Compose and persist sent messages via mock API
```

5 files changed, 155 insertions, 48 deletions.

## Verification

- `pnpm build` — passed (`tsc -b && vite build`, 1,723 modules transformed).
- IDE lint diagnostics — no errors in modified TypeScript/TSX files.
- `git diff --check` and committed patch check — passed.

## Self-review

- Success handling follows the required order: invalidate mailbox, activate Sent, select the created message, close Compose.
- Required fields have inline validation; mutation failures remain visible and retryable.
- Compose state and mutation errors reset whenever the dialog closes.
- Folder filtering occurs before text search.
- No new dependencies, unsafe rendering, or unbounded work were introduced.
- Only Task 4 mail feature files were committed; unrelated dirty files remain untouched.

## Concerns

None. Per the task resolution, verification was build-only; no Vitest or dev-server smoke run was performed.

---

## Review fix: fixture imports in UI

### Status

Complete.

### Changes

- **`src/api/mail.ts`** — Re-export `Mail` and `Mailbox` from the API layer.
- **`src/features/mail/MailWorkspace.tsx`**, **`MessageList.tsx`**, **`MailCard.tsx`**, **`ReaderPanel.tsx`** — Import `Mail` from `../../api/mail` instead of `../../data/mockMail`.

### Commit

```
e77a89c fix: route mail UI type imports through api/mail
```

### Verification

- `pnpm build` — passed.
