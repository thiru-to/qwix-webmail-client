# Add Items Forms — Whole-Branch Review Fixes

## Fixed

- Replaced in-place create mutations for mail, calendar, and contacts with new array assignments so React Query observes changed collection identities.
- Removed the separate exported calendar-events mutation path; event creation now replaces `calendarData.events` and still marks matching calendar days as having events.
- Updated the mail folder heading to count only the active folder and split empty copy between an empty folder and a search miss.
- Consolidated compose, event, and contact mutation errors on the shared `ui-form-error` class, including readable light-theme contrast.
- Removed `aria-modal` from the non-modal side panel and gave each modal dialog title a unique `useId` identifier.
- Replaced the `as Mail[]` assertion with an explicit `Mailbox` type whose `messages` property is `Mail[]`.
- Moved contact search into `contactsUiStore` and clear it after successful contact creation so the new selection is visible.
- Prevented the compose dialog from closing or discarding while its send mutation is pending.

## Verification

- `pnpm lint` — passed with exit code 0.
- `pnpm build` — passed with exit code 0 (`tsc -b && vite build`; 1,729 modules transformed).
- Browser smoke — created `Staleness smoke one` and `Staleness smoke two` consecutively in Sent; both remained visible and the folder heading showed 2 messages.
- Browser smoke — created `Agenda staleness smoke` on August 14; it appeared immediately in both the month cell and agenda/detail view.
- Automated tests were not run because this project has no test script or test files configured.
