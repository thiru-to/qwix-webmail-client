import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { FetchMessageObject, ImapFlow } from 'imapflow'
import { provider, type Account } from '../lib/account'
import type { Vars } from '../lib/auth'
import { runFilters } from './filters'
import { imap, sentFolder, withMailbox } from '../lib/imap'
import { mailboxExists } from '../lib/mailbox'
import { labelIndex, labelsOf } from '../lib/labels'
import { addresses, attachments, bodies, flagState, hasAttachments, isoDate } from '../lib/mime'
import { send } from '../lib/smtp'
import { db } from '../db'
import { identities } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import type {
  FlagsInput,
  FolderDelete,
  FolderInput,
  FolderRename,
  MailFolder,
  Message,
  MessagePage,
  MessageSummary,
  MoveInput,
  OkResult,
  SendInput,
  SendResult,
} from '../types'

const mail = new Hono<Vars>()

const MAX_LIMIT = 200

const RENDERABLE = /^(text\/html|application\/xhtml\+xml|image\/svg\+xml)\b/i

const inFolder = async <T>(account: Account, folder: string, fn: (client: ImapFlow) => Promise<T>) => {
  try {
    return await withMailbox(account, folder, fn)
  } catch (err) {
    // How a missing mailbox surfaces is server-specific; never let that probe mask the real failure.
    const missing = await provider(account)
      .isMissingMailbox(await imap(account), folder, err)
      .catch(() => false)
    if (missing) throw new HTTPException(404, { message: `No folder ${folder}` })
    throw err
  }
}

const integer = (raw: string | undefined, fallback: number, field: string) => {
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0) {
    throw new HTTPException(400, { message: `${field} must be a non-negative integer` })
  }
  return value
}

const uidList = (raw: unknown) => {
  if (!Array.isArray(raw) || !raw.length || raw.some((uid) => !Number.isInteger(uid) || uid < 1)) {
    throw new HTTPException(400, { message: 'uids must be a non-empty array of positive integers' })
  }
  return raw as number[]
}

const emails = (raw: unknown) => {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : []
  return list.filter((entry): entry is string => typeof entry === 'string' && entry.includes('@'))
}

const summary = (message: FetchMessageObject): MessageSummary => ({
  uid: message.uid,
  subject: message.envelope?.subject ?? '',
  from: addresses(message.envelope?.from)[0] ?? null,
  to: addresses(message.envelope?.to),
  date: isoDate(message.envelope?.date ?? message.internalDate),
  ...flagState(message.flags),
  size: message.size ?? 0,
  hasAttachments: hasAttachments(message.bodyStructure),
  messageId: message.envelope?.messageId ?? null,
  inReplyTo: message.envelope?.inReplyTo ?? null,
  labelIds: [],
})

mail.get('/folders', async (c) => {
  const client = await imap(c.get('account'))
  // Flags set moments ago may still be pending on the connection; let the server report them
  // before asking for per-mailbox counts, or the selected mailbox comes back with a stale unseen.
  await client.noop()
  const boxes = await client.list({ statusQuery: { messages: true, unseen: true } })
  const folders: MailFolder[] = boxes.map((box) => ({
    path: box.path,
    name: box.name,
    delimiter: box.delimiter,
    specialUse: box.specialUse ?? null,
    total: box.status?.messages ?? 0,
    unseen: box.status?.unseen ?? 0,
  }))
  return c.json(folders)
})

mail.get('/messages', async (c) => {
  const folder = c.req.query('folder') ?? 'INBOX'
  const limit = Math.min(Math.max(integer(c.req.query('limit'), 50, 'limit'), 1), MAX_LIMIT)
  const offset = integer(c.req.query('offset'), 0, 'offset')

  const account = c.get('account')
  const readPage = () => inFolder(account, folder, async (client): Promise<MessagePage> => {
    // The mailbox stays selected between requests, so `exists` is stale until the server is
    // given a chance to report new arrivals — without this, fresh mail is missing from the page.
    await client.noop()
    const total = client.mailbox ? client.mailbox.exists : 0
    const { unseen = 0 } = await client.status(folder, { unseen: true })
    const last = total - offset
    const base = { folder, total, unseen, limit, offset }
    if (last < 1) return { ...base, messages: [] }

    const messages = await client.fetchAll(`${Math.max(1, last - limit + 1)}:${last}`, {
      uid: true,
      flags: true,
      envelope: true,
      size: true,
      bodyStructure: true,
      internalDate: true,
    })
    const page = messages.map(summary).sort((a, b) => b.uid - a.uid)
    const index = labelIndex(account.userId, 'message', page.map((entry) => entry.messageId))
    return {
      ...base,
      messages: page.map((entry) => ({ ...entry, labelIds: labelsOf(index, 'message', entry.messageId) })),
    }
  })

  const page = await readPage()
  // Filters must run outside the mailbox lock — their actions take locks of their own.
  const { matched } = await runFilters(account, folder, page.messages)
  return c.json(matched ? await readPage() : page)
})

const folderPath = (raw: unknown, field = 'path') => {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) throw new HTTPException(400, { message: `${field} is required` })
  return value
}

// The mailbox the account cannot function without, plus anything the server flagged as special.
const protectedFolder = async (account: Account, path: string) => {
  if (path.toUpperCase() === 'INBOX') return true
  const box = (await (await imap(account)).list()).find((entry) => entry.path === path)
  return Boolean(box?.specialUse)
}

mail.post('/folders', async (c) => {
  const path = folderPath(((await c.req.json()) as Partial<FolderInput>).path)
  const client = await imap(c.get('account'))
  if (await mailboxExists(client, path)) throw new HTTPException(409, { message: `${path} already exists` })
  await client.mailboxCreate(path)
  return c.json<OkResult>({ ok: true }, 201)
})

mail.patch('/folders', async (c) => {
  const body = (await c.req.json()) as Partial<FolderRename>
  const path = folderPath(body.path)
  const to = folderPath(body.to, 'to')
  const account = c.get('account')
  if (await protectedFolder(account, path)) {
    throw new HTTPException(400, { message: `${path} is a system folder and cannot be renamed` })
  }

  const client = await imap(account)
  if (await mailboxExists(client, to)) throw new HTTPException(409, { message: `${to} already exists` })
  await client.mailboxRename(path, to)
  return c.json<OkResult>({ ok: true })
})

mail.delete('/folders', async (c) => {
  const body = (await c.req.json()) as Partial<FolderDelete>
  const path = folderPath(body.path)
  const moveTo = body.moveTo?.trim() || 'INBOX'
  const account = c.get('account')
  if (await protectedFolder(account, path)) {
    throw new HTTPException(400, { message: `${path} is a system folder and cannot be deleted` })
  }

  // Empty the mailbox before dropping it, so deleting a folder never destroys mail.
  const moved = await withMailbox(account, path, async (client) => {
    await client.noop()
    const total = client.mailbox ? client.mailbox.exists : 0
    if (!total) return 0
    await client.messageMove('1:*', moveTo)
    return total
  })

  // A selected mailbox cannot be deleted; taking the destination's lock switches away from it.
  await withMailbox(account, moveTo, (client) => client.noop())
  await (await imap(account)).mailboxDelete(path)
  return c.json<OkResult & { moved: number }>({ ok: true, moved })
})

mail.get('/message', async (c) => {
  const folder = c.req.query('folder') ?? 'INBOX'
  const uid = integer(c.req.query('uid'), 0, 'uid')
  if (!uid) throw new HTTPException(400, { message: 'uid is required' })

  const message = await inFolder(c.get('account'), folder, (client) =>
    client.fetchOne(
      String(uid),
      { uid: true, flags: true, envelope: true, size: true, bodyStructure: true, source: true },
      { uid: true },
    ),
  )
  if (!message || !message.source) throw new HTTPException(404, { message: `No message with uid ${uid} in ${folder}` })

  const base = summary(message)
  const index = labelIndex(c.get('account').userId, 'message', [base.messageId])
  const detail: Message = {
    ...base,
    labelIds: labelsOf(index, 'message', base.messageId),
    folder,
    cc: addresses(message.envelope?.cc),
    bcc: addresses(message.envelope?.bcc),
    replyTo: addresses(message.envelope?.replyTo),
    ...(await bodies(message.source)),
    attachments: attachments(message.bodyStructure),
  }
  return c.json(detail)
})

mail.get('/attachment', async (c) => {
  const folder = c.req.query('folder') ?? 'INBOX'
  const uid = integer(c.req.query('uid'), 0, 'uid')
  const part = c.req.query('part')
  if (!uid || !part) throw new HTTPException(400, { message: 'uid and part are required' })

  // Drain inside the lock; reading the stream after release would interleave with the next command.
  const file = await inFolder(c.get('account'), folder, async (client) => {
    const { meta, content } = await client.download(String(uid), part, { uid: true })
    const chunks: Buffer[] = []
    for await (const chunk of content) chunks.push(chunk as Buffer)
    return { meta, data: Buffer.concat(chunks) }
  })

  // Attachment bytes and their declared type both come from the sender, so never let them render
  // on this origin: force a download, pin the type, and neuter anything the browser would execute.
  const filename = (file.meta.filename ?? part).replace(/["\r\n]/g, '')
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_')
  const type = file.meta.contentType || 'application/octet-stream'

  return new Response(file.data, {
    headers: {
      'Content-Type': RENDERABLE.test(type) ? 'application/octet-stream' : type,
      'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  })
})

mail.post('/flags', async (c) => {
  const { folder = 'INBOX', uids, add, remove } = (await c.req.json()) as Partial<FlagsInput>
  const range = uidList(uids)
  if (!add?.length && !remove?.length) throw new HTTPException(400, { message: 'add or remove is required' })

  await inFolder(c.get('account'), folder, async (client) => {
    if (add?.length) await client.messageFlagsAdd(range, add, { uid: true })
    if (remove?.length) await client.messageFlagsRemove(range, remove, { uid: true })
  })
  return c.json<OkResult>({ ok: true })
})

mail.post('/move', async (c) => {
  const { folder = 'INBOX', uids, to } = (await c.req.json()) as Partial<MoveInput>
  const range = uidList(uids)
  if (typeof to !== 'string' || !to) throw new HTTPException(400, { message: 'to is required' })

  await inFolder(c.get('account'), folder, (client) => client.messageMove(range, to, { uid: true }))
  return c.json<OkResult>({ ok: true })
})

mail.post('/send', async (c) => {
  const input = (await c.req.json()) as Partial<SendInput>
  const to = emails(input.to)
  if (!to.length) throw new HTTPException(400, { message: 'to must contain at least one address' })
  if (!input.text && !input.html) throw new HTTPException(400, { message: 'text or html is required' })

  const account = c.get('account')
  const identity = input.identityId
    ? db
        .select()
        .from(identities)
        .where(and(eq(identities.id, input.identityId), eq(identities.userId, account.userId)))
        .get()
    : undefined
  if (input.identityId && !identity) throw new HTTPException(404, { message: 'No such identity' })

  const { raw, messageId } = await send(
    account,
    { ...input, to, cc: emails(input.cc), bcc: emails(input.bcc) },
    identity && { name: identity.name, address: identity.email },
  )

  // Delivered already; a failed Sent copy must not read as a failed send.
  const path = await sentFolder(account)
  const savedTo = await (await imap(account))
    .append(path, raw, ['\\Seen'])
    .then(() => path)
    .catch(() => null)

  return c.json<SendResult>({ messageId, savedTo })
})

export default mail
