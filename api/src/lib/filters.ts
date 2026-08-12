import { and, asc, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { db } from '../db'
import { filters, forwardAddresses, labelLinks, type FilterRow } from '../db/schema'
import type { FilterActions, FilterConditions, MailFilter, MailFilterInput, MessageSummary } from '../types'

const CONDITION_KEYS = ['from', 'to', 'subject', 'contains', 'notContains'] as const

export const toFilter = (row: FilterRow): MailFilter => ({
  id: row.id,
  name: row.name,
  enabled: row.enabled,
  position: row.position,
  conditions: row.conditions as FilterConditions,
  actions: row.actions as FilterActions,
})

export const listFilters = (userId: number) =>
  db.select().from(filters).where(eq(filters.userId, userId)).orderBy(asc(filters.position)).all().map(toFilter)

export const enabledFilters = (userId: number) => listFilters(userId).filter((filter) => filter.enabled)

const text = (raw: unknown) => {
  const value = typeof raw === 'string' ? raw.trim() : ''
  return value || undefined
}

export function parseConditions(raw: unknown): FilterConditions {
  const source = (raw ?? {}) as Record<string, unknown>
  const conditions: FilterConditions = {}
  for (const key of CONDITION_KEYS) {
    const value = text(source[key])
    if (value) conditions[key] = value
  }
  if (!Object.keys(conditions).length) {
    throw new HTTPException(400, { message: 'a filter needs at least one condition' })
  }
  return conditions
}

export function parseActions(userId: number, raw: unknown): FilterActions {
  const source = (raw ?? {}) as Record<string, unknown>
  const actions: FilterActions = {}

  const moveTo = text(source.moveTo)
  if (moveTo) actions.moveTo = moveTo
  if (typeof source.labelId === 'number') actions.labelId = source.labelId
  if (source.markRead === true) actions.markRead = true
  if (source.star === true) actions.star = true
  if (source.delete === true) actions.delete = true
  if (source.archive === true) actions.archive = true

  const forwardTo = text(source.forwardTo)?.toLowerCase()
  if (forwardTo) {
    // Forwarding is the one action that sends mail somewhere the account does not control.
    const address = db
      .select()
      .from(forwardAddresses)
      .where(and(eq(forwardAddresses.userId, userId), eq(forwardAddresses.email, forwardTo)))
      .get()
    if (!address?.verified) {
      throw new HTTPException(400, { message: `${forwardTo} is not a verified forwarding address` })
    }
    actions.forwardTo = forwardTo
  }

  if (!Object.keys(actions).length) throw new HTTPException(400, { message: 'a filter needs at least one action' })
  // Moving somewhere and deleting are mutually exclusive; deleting wins and would strand the move.
  if (actions.delete && (actions.moveTo || actions.archive)) {
    throw new HTTPException(400, { message: 'delete cannot be combined with move or archive' })
  }
  return actions
}

export function parseFilter(userId: number, raw: Partial<MailFilterInput>) {
  const name = text(raw.name)
  if (!name) throw new HTTPException(400, { message: 'name is required' })
  return {
    name,
    enabled: raw.enabled !== false,
    conditions: parseConditions(raw.conditions),
    actions: parseActions(userId, raw.actions),
  }
}

const has = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase())

const addressText = (message: MessageSummary) =>
  [message.from?.name ?? '', message.from?.address ?? ''].join(' ')

const recipientText = (message: MessageSummary) =>
  message.to.map((entry) => `${entry.name ?? ''} ${entry.address}`).join(' ')

/**
 * Matching runs on the envelope only — the body is not fetched for a list page, so `contains`
 * tests the subject and addresses rather than the message text.
 */
export function matches(filter: MailFilter, message: MessageSummary): boolean {
  const { from, to, subject, contains, notContains } = filter.conditions
  const haystack = [message.subject, addressText(message), recipientText(message)].join(' ')

  if (from && !has(addressText(message), from)) return false
  if (to && !has(recipientText(message), to)) return false
  if (subject && !has(message.subject, subject)) return false
  if (contains && !has(haystack, contains)) return false
  if (notContains && has(haystack, notContains)) return false
  return true
}

export const applyLabel = (userId: number, labelId: number, messageId: string) =>
  db
    .insert(labelLinks)
    .values({ labelId, userId, kind: 'message', resourceId: messageId })
    .onConflictDoNothing()
    .run()
