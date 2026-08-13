import { ImapFlow } from 'imapflow'
import { endpoints, provider, type Account } from './account'

const pool = new Map<string, Promise<ImapFlow>>()
const sentFolders = new Map<string, string>()
const lastUsed = new Map<string, number>()

const IDLE_MS = 10 * 60 * 1000

const connect = async (account: Account) => {
  const { host, port } = endpoints(account.config).imap
  // 143 is the cleartext port, where imapflow upgrades via STARTTLS; anything else is implicit TLS.
  const client = new ImapFlow({
    host,
    port,
    secure: port !== 143,
    auth: { user: account.email, pass: account.password },
    logger: false,
  })
  // An unhandled 'error' event on the socket would take the process down.
  client.on('error', () => {})
  await client.connect()
  return client
}

// Hold the connection, but drop a dead one — IMAP sockets are idle-timed out server side.
export const imap = async (account: Account, retry = true): Promise<ImapFlow> => {
  lastUsed.set(account.key, Date.now())
  let pending = pool.get(account.key)
  if (!pending) {
    pending = connect(account).catch((err) => {
      pool.delete(account.key)
      throw err
    })
    pool.set(account.key, pending)
  }

  const client = await pending
  if (client.usable) return client
  pool.delete(account.key)
  if (!retry) throw new Error('IMAP connection is not usable')
  return imap(account, false)
}

// One connection runs one command at a time; the lock serialises concurrent requests.
// Always read-write: fetches use BODY.PEEK so they never set \Seen anyway, while an EXAMINE in the
// mix leaves the connection holding that mailbox's empty PERMANENTFLAGS, which drops flag writes.
export const withMailbox = async <T>(account: Account, path: string, fn: (client: ImapFlow) => Promise<T>) => {
  const client = await imap(account)
  const lock = await client.getMailboxLock(path)
  try {
    return await fn(client)
  } finally {
    lock.release()
    // Stamped again on the way out so a long fetch cannot be swept while it is still running.
    lastUsed.set(account.key, Date.now())
  }
}

export const sentFolder = async (account: Account) => {
  const cached = sentFolders.get(account.key)
  if (cached) return cached

  const names = provider(account).sentFolderNames
  const boxes = await (await imap(account)).list()
  const match = boxes.find((box) => box.specialUse === '\\Sent') ?? boxes.find((box) => names.includes(box.path))
  const path = match?.path ?? names[0]!
  sentFolders.set(account.key, path)
  return path
}

export const release = (key: string) => {
  sentFolders.delete(key)
  lastUsed.delete(key)
  const pending = pool.get(key)
  pool.delete(key)
  pending?.then((client) => client.close()).catch(() => {})
}

// imapflow restarts IDLE after every command, so a pooled connection never times out on its own —
// an open tab nobody is reading would hold it for days, and hosts cap connections per account.
// Dropping it is invisible: the next request finds an empty pool and reconnects.
setInterval(() => {
  const cutoff = Date.now() - IDLE_MS
  for (const [key, at] of lastUsed) if (at < cutoff) release(key)
}, 60 * 1000)
