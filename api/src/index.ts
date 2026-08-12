import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { authenticate, clearSessions, type Vars } from './lib/auth'
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
  if (err instanceof HTTPException) return c.json<ApiError>({ error: err.message }, err.status)
  console.error(err)
  return c.json<ApiError>({ error: 'Upstream request failed', detail: err.message.split('\n')[0] }, 502)
})

export default app
