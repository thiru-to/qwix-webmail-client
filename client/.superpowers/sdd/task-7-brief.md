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
