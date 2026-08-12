import { and, eq, ne } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { db } from '../db'
import { identities, labels, type IdentityRow } from '../db/schema'
import type { Account } from '../lib/account'
import type { Vars } from '../lib/auth'
import { domainOf } from '../lib/discovery'
import { color } from '../lib/labels'
import type { Identity, IdentityInput, OkResult } from '../types'

const route = new Hono<Vars>()

const toIdentity = (row: IdentityRow): Identity => ({
  id: row.id,
  name: row.name,
  email: row.email,
  isDefault: row.isDefault,
  labelId: row.labelId,
})

const identityId = (raw: string) => {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw new HTTPException(400, { message: 'identity id must be a positive integer' })
  return id
}

const owned = (userId: number, id: number) => {
  const row = db
    .select()
    .from(identities)
    .where(and(eq(identities.id, id), eq(identities.userId, userId)))
    .get()
  if (!row) throw new HTTPException(404, { message: `No identity with id ${id}` })
  return row
}

const parse = (account: Account, raw: Partial<IdentityInput>) => {
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : ''
  if (!name) throw new HTTPException(400, { message: 'name is required' })
  if (!email.includes('@')) throw new HTTPException(400, { message: 'a full email address is required' })
  // The mail server will refuse to send as another domain, so reject it here with a clearer reason.
  if (domainOf(email) !== domainOf(account.email)) {
    throw new HTTPException(400, { message: `An identity must be on ${domainOf(account.email)}` })
  }
  return { name, email }
}

/** Each identity carries a label of the same name, reused if the user already made one. */
function ensureLabel(userId: number, name: string) {
  const existing = db
    .select()
    .from(labels)
    .where(and(eq(labels.userId, userId), eq(labels.name, name)))
    .get()
  if (existing) return existing.id
  return db.insert(labels).values({ userId, name, color: color(undefined) }).returning().get().id
}

const clearOtherDefaults = (userId: number, keep: number) =>
  db.update(identities).set({ isDefault: false }).where(and(eq(identities.userId, userId), ne(identities.id, keep))).run()

route.get('/', (c) => {
  const rows = db.select().from(identities).where(eq(identities.userId, c.get('account').userId)).all()
  return c.json<Identity[]>(rows.map(toIdentity))
})

route.post('/', async (c) => {
  const account = c.get('account')
  const { name, email } = parse(account, (await c.req.json()) as Partial<IdentityInput>)

  const existing = db
    .select()
    .from(identities)
    .where(and(eq(identities.userId, account.userId), eq(identities.email, email)))
    .get()
  if (existing) throw new HTTPException(409, { message: 'That address is already an identity' })

  const labelId = ensureLabel(account.userId, name)
  const count = db.select().from(identities).where(eq(identities.userId, account.userId)).all().length
  const row = db
    .insert(identities)
    .values({ userId: account.userId, name, email, labelId, isDefault: count === 0 })
    .returning()
    .get()

  if (row.isDefault) clearOtherDefaults(account.userId, row.id)
  return c.json<Identity>(toIdentity(row), 201)
})

route.patch('/:id', async (c) => {
  const account = c.get('account')
  const id = identityId(c.req.param('id'))
  const current = owned(account.userId, id)
  const input = (await c.req.json()) as Partial<IdentityInput>
  const { name, email } = parse(account, { name: input.name ?? current.name, email: input.email ?? current.email })

  const row = db
    .update(identities)
    .set({
      name,
      email,
      labelId: name === current.name ? current.labelId : ensureLabel(account.userId, name),
      ...(typeof input.isDefault === 'boolean' && { isDefault: input.isDefault }),
    })
    .where(eq(identities.id, id))
    .returning()
    .get()

  if (row.isDefault) clearOtherDefaults(account.userId, id)
  return c.json<Identity>(toIdentity(row))
})

route.delete('/:id', (c) => {
  const account = c.get('account')
  const id = identityId(c.req.param('id'))
  owned(account.userId, id)
  // The label outlives the identity; it may already be on messages.
  db.delete(identities).where(eq(identities.id, id)).run()
  return c.json<OkResult>({ ok: true })
})

export default route
