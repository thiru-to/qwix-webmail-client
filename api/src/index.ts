import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { reportUpstreamFailure } from './lib/alerts'
import { authenticate, clearSessions, reap, type Vars } from './lib/auth'
import { seed } from './lib/discovery'
import auth from './routes/auth'
import calendar from './routes/calendar'
import contacts from './routes/contacts'
import filters from './routes/filters'
import identities from './routes/identities'
import labels from './routes/labels'
import settings from './routes/settings'
import mail from './routes/mail'
import type { ApiError } from './types'

seed()
clearSessions()
// Logging in reaps too, but on a quiet server that could be days apart.
setInterval(reap, 5 * 60 * 1000)

const app = new Hono<Vars>()

app.use(
  '*',
  cors({
    origin: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').split(','),
    // The session cookie only rides along if both the header and the client's credentials flag are set.
    credentials: true,
    // Attachment downloads carry the filename here, and it is not a CORS-safelisted header.
    exposeHeaders: ['Content-Disposition'],
  }),
)

app.route('/auth', auth)

app.use('/mail/*', authenticate)
app.use('/calendar/*', authenticate)
app.use('/contacts/*', authenticate)
for (const base of ['/labels', '/settings', '/identities', '/filters']) {
  app.use(base, authenticate)
  app.use(`${base}/*`, authenticate)
}

app.route('/mail', mail)
app.route('/calendar', calendar)
app.route('/contacts', contacts)
app.route('/labels', labels)
app.route('/settings', settings)
app.route('/identities', identities)
app.route('/filters', filters)

app.get('/', (c) => c.json({ routes: ['/auth', '/mail', '/calendar', '/contacts', '/labels', '/settings', '/identities', '/filters'] }))

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    // 4xx is the API telling the caller it got the request wrong; only a 5xx is ours to answer for.
    if (err.status >= 500) reportUpstreamFailure(c, err.status, err.message)
    return c.json<ApiError>({ error: err.message }, err.status)
  }
  console.error(err)
  const detail = err.message.split('\n')[0]
  reportUpstreamFailure(c, 502, detail)
  return c.json<ApiError>({ error: 'Upstream request failed', detail }, 502)
})

export default {
  port: Number(process.env.PORT ?? 3000),
  // Loopback by default: nginx terminates TLS and is the only thing that should
  // reach this process. Set HOST=0.0.0.0 only to expose it deliberately.
  hostname: process.env.HOST ?? '127.0.0.1',
  fetch: app.fetch,
}
