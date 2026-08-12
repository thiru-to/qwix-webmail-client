import { and, eq, max } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { db } from '../db'
import { filterState, filters, forwardAddresses } from '../db/schema'
import type { Account } from '../lib/account'
import type { Vars } from '../lib/auth'
import { applyLabel, enabledFilters, listFilters, matches, parseFilter, toFilter } from '../lib/filters'
import { withMailbox } from '../lib/imap'
import { roleFolder } from '../lib/mailbox'
import { send } from '../lib/smtp'
import type {
  FilterRunResult,
  ForwardAddress,
  ForwardVerifyInput,
  MailFilter,
  MailFilterInput,
  MessageSummary,
  OkResult,
} from '../types'

const route = new Hono<Vars>()

const CODE_TTL_MS = 15 * 60 * 1000
const MAX_CODE_ATTEMPTS = 5

const filterId = (raw: string) => {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw new HTTPException(400, { message: 'filter id must be a positive integer' })
  return id
}

const owned = (userId: number, id: number) => {
  const row = db
    .select()
    .from(filters)
    .where(and(eq(filters.id, id), eq(filters.userId, userId)))
    .get()
  if (!row) throw new HTTPException(404, { message: `No filter with id ${id}` })
  return row
}

const digest = async (value: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

route.get('/', (c) => c.json<MailFilter[]>(listFilters(c.get('account').userId)))

route.post('/', async (c) => {
  const { userId } = c.get('account')
  const input = parseFilter(userId, (await c.req.json()) as Partial<MailFilterInput>)
  const position = (db.select({ value: max(filters.position) }).from(filters).where(eq(filters.userId, userId)).get()?.value ?? 0) + 1
  const row = db.insert(filters).values({ userId, position, ...input }).returning().get()
  return c.json<MailFilter>(toFilter(row), 201)
})

route.patch('/:id', async (c) => {
  const { userId } = c.get('account')
  const id = filterId(c.req.param('id'))
  const current = owned(userId, id)
  const raw = (await c.req.json()) as Partial<MailFilterInput> & { position?: number }

  // Enabling and reordering are one-field edits from the list; a full edit revalidates everything.
  const onlyToggle = Object.keys(raw).every((key) => key === 'enabled' || key === 'position')
  const next = onlyToggle
    ? {}
    : parseFilter(userId, { name: raw.name ?? current.name, conditions: raw.conditions ?? current.conditions, actions: raw.actions ?? current.actions })

  const row = db
    .update(filters)
    .set({
      ...next,
      ...(typeof raw.enabled === 'boolean' && { enabled: raw.enabled }),
      ...(typeof raw.position === 'number' && { position: raw.position }),
    })
    .where(eq(filters.id, id))
    .returning()
    .get()
  return c.json<MailFilter>(toFilter(row))
})

route.delete('/:id', (c) => {
  const { userId } = c.get('account')
  const id = filterId(c.req.param('id'))
  owned(userId, id)
  db.delete(filters).where(eq(filters.id, id)).run()
  return c.json<OkResult>({ ok: true })
})

/** Runs every enabled filter over messages that arrived since the last sweep of this folder. */
export async function runFilters(account: Account, folder: string, summaries: MessageSummary[]) {
  const active = enabledFilters(account.userId)
  if (!active.length || !summaries.length) return { folder, scanned: 0, matched: 0 }

  const state = db
    .select()
    .from(filterState)
    .where(and(eq(filterState.userId, account.userId), eq(filterState.folder, folder)))
    .get()
  const since = state?.lastUid ?? 0
  const fresh = summaries.filter((message) => message.uid > since)
  const highest = summaries.reduce((top, message) => Math.max(top, message.uid), since)

  let matched = 0
  for (const message of fresh) {
    for (const filter of active) {
      if (!matches(filter, message)) continue
      matched += 1
      await applyActions(account, folder, message, filter)
      // A message that was moved or deleted is no longer here for later filters to act on.
      if (filter.actions.delete || filter.actions.moveTo || filter.actions.archive) break
    }
  }

  db.insert(filterState)
    .values({ userId: account.userId, folder, lastUid: highest })
    .onConflictDoUpdate({ target: [filterState.userId, filterState.folder], set: { lastUid: highest } })
    .run()

  return { folder, scanned: fresh.length, matched }
}

async function applyActions(account: Account, folder: string, message: MessageSummary, filter: MailFilter) {
  const { actions } = filter

  if (actions.labelId && message.messageId) applyLabel(account.userId, actions.labelId, message.messageId)

  if (actions.forwardTo) {
    // A failed forward must not stop the rest of the actions from running.
    await send(account, {
      to: [actions.forwardTo],
      subject: `Fwd: ${message.subject}`,
      text: `Forwarded by the "${filter.name}" filter.\n\nFrom: ${message.from?.address ?? 'unknown'}\nSubject: ${message.subject}`,
    }).catch(() => undefined)
  }

  const flags: string[] = []
  if (actions.markRead) flags.push('\\Seen')
  if (actions.star) flags.push('\\Flagged')
  if (flags.length) {
    await withMailbox(account, folder, (client) => client.messageFlagsAdd([message.uid], flags, { uid: true })).catch(
      () => undefined,
    )
  }

  const destination = actions.delete
    ? await roleFolder(account, '\\Trash')
    : actions.archive
      ? await roleFolder(account, '\\Archive')
      : (actions.moveTo ?? null)

  if (destination && destination !== folder) {
    await withMailbox(account, folder, (client) =>
      client.messageMove([message.uid], destination, { uid: true }),
    ).catch(() => undefined)
  }
}

route.post('/run', async (c) => {
  const account = c.get('account')
  const folder = ((await c.req.json().catch(() => ({}))) as { folder?: string }).folder ?? 'INBOX'

  const summaries = await withMailbox(account, folder, async (client) => {
    await client.noop()
    const total = client.mailbox ? client.mailbox.exists : 0
    if (!total) return []
    const messages = await client.fetchAll(`${Math.max(1, total - 200 + 1)}:${total}`, {
      uid: true,
      flags: true,
      envelope: true,
    })
    return messages.map((message) => ({
      uid: message.uid,
      subject: message.envelope?.subject ?? '',
      from: message.envelope?.from?.[0]
        ? { name: message.envelope.from[0].name, address: message.envelope.from[0].address ?? '' }
        : null,
      to: (message.envelope?.to ?? []).map((entry) => ({ name: entry.name, address: entry.address ?? '' })),
      messageId: message.envelope?.messageId ?? null,
      inReplyTo: message.envelope?.inReplyTo ?? null,
    })) as MessageSummary[]
  })

  return c.json<FilterRunResult>(await runFilters(account, folder, summaries))
})

route.get('/forwarders', (c) => {
  const rows = db.select().from(forwardAddresses).where(eq(forwardAddresses.userId, c.get('account').userId)).all()
  return c.json<ForwardAddress[]>(rows.map((row) => ({ id: row.id, email: row.email, verified: row.verified })))
})

route.post('/forwarders', async (c) => {
  const account = c.get('account')
  const email = String(((await c.req.json()) as { email?: string }).email ?? '')
    .trim()
    .toLowerCase()
  if (!email.includes('@')) throw new HTTPException(400, { message: 'a full email address is required' })

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, '0')
  const values = {
    userId: account.userId,
    email,
    verified: false,
    codeHash: await digest(code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
    attempts: 0,
  }

  db.insert(forwardAddresses)
    .values(values)
    .onConflictDoUpdate({ target: [forwardAddresses.userId, forwardAddresses.email], set: values })
    .run()

  // The address only becomes usable once someone reading that mailbox types the code back.
  await send(account, {
    to: [email],
    subject: 'Confirm mail forwarding',
    text: `${account.email} would like to forward mail to this address.\n\nVerification code: ${code}\n\nThe code expires in 15 minutes. If you were not expecting this, ignore this message and nothing will be forwarded.`,
  })

  return c.json<OkResult>({ ok: true }, 201)
})

route.post('/forwarders/verify', async (c) => {
  const account = c.get('account')
  const { email, code } = (await c.req.json()) as Partial<ForwardVerifyInput>
  const address = db
    .select()
    .from(forwardAddresses)
    .where(and(eq(forwardAddresses.userId, account.userId), eq(forwardAddresses.email, String(email ?? '').toLowerCase())))
    .get()

  if (!address) throw new HTTPException(404, { message: 'No pending verification for that address' })
  if (address.verified) return c.json<OkResult>({ ok: true })
  if (address.attempts >= MAX_CODE_ATTEMPTS) throw new HTTPException(429, { message: 'Too many attempts; request a new code' })
  if (!address.expiresAt || address.expiresAt <= new Date()) {
    throw new HTTPException(410, { message: 'That code has expired; request a new one' })
  }

  if (address.codeHash !== (await digest(String(code ?? '')))) {
    db.update(forwardAddresses).set({ attempts: address.attempts + 1 }).where(eq(forwardAddresses.id, address.id)).run()
    throw new HTTPException(400, { message: 'That code is not right' })
  }

  db.update(forwardAddresses)
    .set({ verified: true, codeHash: null, expiresAt: null, attempts: 0 })
    .where(eq(forwardAddresses.id, address.id))
    .run()
  return c.json<OkResult>({ ok: true })
})

route.delete('/forwarders/:id', (c) => {
  const { userId } = c.get('account')
  const id = filterId(c.req.param('id'))
  db.delete(forwardAddresses).where(and(eq(forwardAddresses.id, id), eq(forwardAddresses.userId, userId))).run()
  return c.json<OkResult>({ ok: true })
})

export default route
