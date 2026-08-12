import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { labelLinks, labels, type LabelRow } from '../db/schema'
import type { Label, LabelColor, LabelKind } from '../types'

const COLORS: LabelColor[] = ['pink', 'amber', 'teal', 'green', 'purple', 'orange']

export const KINDS: LabelKind[] = ['message', 'contact', 'event']

export const isKind = (value: unknown): value is LabelKind => KINDS.includes(value as LabelKind)

export const color = (value: unknown): LabelColor =>
  COLORS.includes(value as LabelColor) ? (value as LabelColor) : 'pink'

export const toLabel = (row: LabelRow): Label => ({ id: row.id, name: row.name, color: color(row.color) })

export const listLabels = (userId: number) =>
  db.select().from(labels).where(eq(labels.userId, userId)).all().map(toLabel)

/**
 * A recurring event is expanded into one entry per occurrence, all sharing a UID prefix. Labelling
 * the series rather than a single occurrence is what a user means, so key on the UID.
 */
export const resourceKey = (kind: LabelKind, id: string) => (kind === 'event' ? id.split('_')[0]! : id)

/** One lookup for a whole page; returns an empty array for anything unlabelled. */
export function labelIndex(userId: number, kind: LabelKind, ids: (string | null)[]): Map<string, number[]> {
  const keys = [...new Set(ids.filter((id): id is string => Boolean(id)).map((id) => resourceKey(kind, id)))]
  const index = new Map<string, number[]>()
  if (!keys.length) return index

  const links = db
    .select()
    .from(labelLinks)
    .where(and(eq(labelLinks.userId, userId), eq(labelLinks.kind, kind), inArray(labelLinks.resourceId, keys)))
    .all()

  for (const link of links) {
    const current = index.get(link.resourceId)
    if (current) current.push(link.labelId)
    else index.set(link.resourceId, [link.labelId])
  }
  return index
}

export const labelsOf = (index: Map<string, number[]>, kind: LabelKind, id: string | null) =>
  (id && index.get(resourceKey(kind, id))) || []
