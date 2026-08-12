import type { MessageAddressObject, MessageStructureObject } from 'imapflow'
import PostalMime from 'postal-mime'
import type { MailAddress, MailAttachment, MailFlags, MessageBodies } from '../types'

export const addresses = (list: MessageAddressObject[] = []): MailAddress[] =>
  list.flatMap((a) => (a.address ? [{ name: a.name || undefined, address: a.address }] : []))

export const flagState = (flags?: Set<string>): MailFlags => ({
  seen: Boolean(flags?.has('\\Seen')),
  flagged: Boolean(flags?.has('\\Flagged')),
  answered: Boolean(flags?.has('\\Answered')),
  draft: Boolean(flags?.has('\\Draft')),
})

export const isoDate = (date?: Date | string): string | null => {
  const value = date ? new Date(date) : null
  return value && !Number.isNaN(value.getTime()) ? value.toISOString() : null
}

const filenameOf = (node: MessageStructureObject) => node.dispositionParameters?.filename ?? node.parameters?.name

// Only bodyStructure carries the part ids download() needs, so attachments come from here rather than postal-mime.
export const attachments = (node?: MessageStructureObject): MailAttachment[] => {
  if (!node) return []
  if (node.childNodes?.length) return node.childNodes.flatMap((child) => attachments(child))

  const disposition = node.disposition?.toLowerCase()
  const filename = filenameOf(node)
  if (!node.part || (disposition !== 'attachment' && !filename)) return []

  return [
    {
      part: node.part,
      filename,
      mimeType: node.type,
      size: node.size,
      inline: disposition === 'inline',
      contentId: node.id?.replace(/^<|>$/g, ''),
    },
  ]
}

export const hasAttachments = (node?: MessageStructureObject) => attachments(node).length > 0

export const bodies = async (source: Buffer): Promise<MessageBodies> => {
  const email = await PostalMime.parse(source)
  return { html: email.html || null, text: email.text || null }
}
