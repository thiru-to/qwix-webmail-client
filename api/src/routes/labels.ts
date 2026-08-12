import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { db } from '../db'
import { labelLinks, labels } from '../db/schema'
import type { Vars } from '../lib/auth'
import { color, isKind, listLabels, resourceKey, toLabel } from '../lib/labels'
import type { Label, LabelAssignment, LabelInput, OkResult } from '../types'

const route = new Hono<Vars>()

const labelId = (raw: string) => {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw new HTTPException(400, { message: 'label id must be a positive integer' })
  return id
}

const owned = (userId: number, id: number) => {
  const row = db
    .select()
    .from(labels)
    .where(and(eq(labels.id, id), eq(labels.userId, userId)))
    .get()
  if (!row) throw new HTTPException(404, { message: `No label with id ${id}` })
  return row
}

const name = (raw: unknown) => {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) throw new HTTPException(400, { message: 'name is required' })
  if (value.length > 40) throw new HTTPException(400, { message: 'name must be 40 characters or fewer' })
  return value
}

// The unique index is per user, so a clash is a user error rather than a server fault.
const unique = <T>(write: () => T) => {
  try {
    return write()
  } catch (err) {
    if (String((err as Error).message).includes('UNIQUE')) {
      throw new HTTPException(409, { message: 'A label with that name already exists' })
    }
    throw err
  }
}

route.get('/', (c) => c.json<Label[]>(listLabels(c.get('account').userId)))

route.post('/', async (c) => {
  const input = (await c.req.json()) as Partial<LabelInput>
  const { userId } = c.get('account')
  const row = unique(() =>
    db.insert(labels).values({ userId, name: name(input.name), color: color(input.color) }).returning().get(),
  )
  return c.json<Label>(toLabel(row), 201)
})

route.patch('/:id', async (c) => {
  const input = (await c.req.json()) as Partial<LabelInput>
  const { userId } = c.get('account')
  const id = labelId(c.req.param('id'))
  owned(userId, id)

  const row = unique(() =>
    db
      .update(labels)
      .set({
        ...(input.name !== undefined && { name: name(input.name) }),
        ...(input.color !== undefined && { color: color(input.color) }),
      })
      .where(eq(labels.id, id))
      .returning()
      .get(),
  )
  return c.json<Label>(toLabel(row))
})

route.delete('/:id', (c) => {
  const { userId } = c.get('account')
  const id = labelId(c.req.param('id'))
  owned(userId, id)
  // The link rows go with it; nothing on the mail or DAV server is touched.
  db.delete(labelLinks).where(eq(labelLinks.labelId, id)).run()
  db.delete(labels).where(eq(labels.id, id)).run()
  return c.json<OkResult>({ ok: true })
})

route.post('/assign', async (c) => {
  const { labelId: rawId, kind, resourceId, on } = (await c.req.json()) as Partial<LabelAssignment>
  const { userId } = c.get('account')

  if (!isKind(kind)) throw new HTTPException(400, { message: 'kind must be message, contact or event' })
  if (typeof resourceId !== 'string' || !resourceId) {
    throw new HTTPException(400, { message: 'resourceId is required' })
  }
  const id = typeof rawId === 'number' ? rawId : labelId(String(rawId))
  owned(userId, id)

  const key = resourceKey(kind, resourceId)
  if (on) {
    db.insert(labelLinks).values({ labelId: id, userId, kind, resourceId: key }).onConflictDoNothing().run()
  } else {
    db.delete(labelLinks)
      .where(and(eq(labelLinks.labelId, id), eq(labelLinks.kind, kind), eq(labelLinks.resourceId, key)))
      .run()
  }
  return c.json<OkResult>({ ok: true })
})

export default route
