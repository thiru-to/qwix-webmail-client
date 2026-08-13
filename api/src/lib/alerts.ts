import { and, desc, eq, gt } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../db'
import { upstreamErrors } from '../db/schema'

const THROTTLE_MS = 15 * 60 * 1000

// One broken mailbox retried by an open tab is the common case, so the signature deliberately drops
// everything that varies between those retries — the uid, the folder, the message id.
const signatureOf = (method: string, path: string, message: string) =>
  `${method} ${path.replace(/\d+/g, 'N')} ${message.replace(/\d+/g, 'N').slice(0, 200)}`

const hostOf = (message: string) => message.match(/https?:\/\/([^/\s]+)/)?.[1] ?? null

const post = async (url: string, body: unknown) => {
  // Slack reads `text`, Discord reads `content`; sending both means either works with no config.
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })
}

/**
 * Records an upstream failure and, at most once per signature per quarter hour, pushes it to
 * ALERT_WEBHOOK_URL. Never throws: it runs inside the error handler, and an alerting bug must not
 * replace the error the user was already getting.
 */
export const reportUpstreamFailure = (c: Context, status: number, message: string) => {
  try {
    const method = c.req.method
    const path = new URL(c.req.url).pathname
    const email = (c.get('account') as { email?: string } | undefined)?.email ?? null
    const signature = signatureOf(method, path, message)
    const host = hostOf(message)

    const lastNotified = db
      .select({ at: upstreamErrors.notifiedAt })
      .from(upstreamErrors)
      .where(and(eq(upstreamErrors.signature, signature), gt(upstreamErrors.notifiedAt, new Date(Date.now() - THROTTLE_MS))))
      .orderBy(desc(upstreamErrors.notifiedAt))
      .get()

    const url = process.env.ALERT_WEBHOOK_URL?.trim()
    const notify = !lastNotified && !!url

    db.insert(upstreamErrors)
      .values({ signature, method, path, status, email, host, message, notifiedAt: notify ? new Date() : null })
      .run()

    if (!notify) return

    const summary = `Qwix API ${status} on ${method} ${path}${email ? ` for ${email}` : ''}${host ? ` — upstream ${host}` : ''}: ${message}`
    // Floating on purpose: the response should not wait on a webhook, and a dead one is not an outage.
    void post(url!, { text: summary, content: summary, status, method, path, email, host, message }).catch(() => {})
  } catch {
    // Recording is best effort; the caller still returns its error either way.
  }
}
