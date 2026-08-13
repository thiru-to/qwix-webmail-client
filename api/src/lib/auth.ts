import { and, eq, gt, lt } from 'drizzle-orm'
import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { db } from '../db'
import { loginAttempts, sessions, users, type ServerConfig, type User } from '../db/schema'
import { forget, recall, remember, type Account } from './account'
import { release as releaseDav } from './dav'
import { release as releaseImap } from './imap'
import { release as releaseSmtp } from './smtp'

export const COOKIE = 'qwix_session'

const TTL_MS = 7 * 24 * 60 * 60 * 1000
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5
const SEEN_MS = 60 * 1000

export type Vars = { Variables: { account: Account } }

// Storing only the hash means a leaked database cannot be replayed as a live session.
const digest = async (token: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

export const clientIp = (c: Context) =>
  c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown'

// Credentials only ever lived in this process, so no session survives it.
export const clearSessions = () => db.delete(sessions).run()

export const recordAttempt = (email: string, ip: string, ok: boolean) =>
  db.insert(loginAttempts).values({ email, ip, ok }).run()

export const throttled = (email: string, ip: string) => {
  const since = new Date(Date.now() - WINDOW_MS)
  const failures = (column: typeof loginAttempts.email | typeof loginAttempts.ip, value: string) =>
    db
      .select()
      .from(loginAttempts)
      .where(and(eq(column, value), eq(loginAttempts.ok, false), gt(loginAttempts.at, since)))
      .all().length
  return failures(loginAttempts.email, email) >= MAX_FAILURES || failures(loginAttempts.ip, ip) >= MAX_FAILURES
}

export const upsertUser = (email: string, domain: string): User => {
  db.insert(users)
    .values({ email, domain, lastLoginAt: new Date() })
    .onConflictDoUpdate({ target: users.email, set: { domain, lastLoginAt: new Date() } })
    .run()
  return db.select().from(users).where(eq(users.email, email)).get()!
}

// Everything a session holds outside its row: the password, and the connections opened with it.
const discard = (id: string) => {
  releaseImap(id)
  releaseDav(id)
  releaseSmtp(id)
  forget(id)
}

// An expired session is otherwise only noticed when someone uses it, so a browser that never comes
// back leaves its password in memory and its IMAP connection open until the process dies.
export const reap = () => {
  const now = new Date()
  for (const { id } of db.select({ id: sessions.id }).from(sessions).where(lt(sessions.expiresAt, now)).all()) {
    discard(id)
  }
  db.delete(sessions).where(lt(sessions.expiresAt, now)).run()
}

export const startSession = async (c: Context, user: User, password: string, config: ServerConfig) => {
  reap()

  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')
  const id = await digest(token)
  const expiresAt = new Date(Date.now() + TTL_MS)

  db.insert(sessions)
    .values({ id, userId: user.id, expiresAt, userAgent: c.req.header('user-agent') ?? null, ip: clientIp(c) })
    .run()

  remember({ key: id, userId: user.id, email: user.email, password, config })

  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: TTL_MS / 1000,
  })
}

export const endSession = (c: Context, id: string) => {
  db.delete(sessions).where(eq(sessions.id, id)).run()
  discard(id)
  deleteCookie(c, COOKIE, { path: '/' })
}

export const authenticate: MiddlewareHandler<Vars> = async (c, next) => {
  const token = getCookie(c, COOKIE)
  if (!token) throw new HTTPException(401, { message: 'Not signed in' })

  const id = await digest(token)
  const session = db.select().from(sessions).where(eq(sessions.id, id)).get()
  if (!session || session.expiresAt <= new Date()) {
    if (session) endSession(c, id)
    throw new HTTPException(401, { message: 'Session expired' })
  }

  // Credentials live in memory only, so a restart invalidates otherwise-valid sessions.
  const account = recall(id)
  if (!account) {
    endSession(c, id)
    throw new HTTPException(401, { message: 'Session expired' })
  }

  // Opening one screen fires a dozen requests, and SQLite takes them one write at a time. This is
  // only here to spot abandoned sessions, so minute resolution is plenty.
  if (Date.now() - session.lastSeenAt.getTime() > SEEN_MS) {
    db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, id)).run()
  }
  c.set('account', account)
  await next()
}
