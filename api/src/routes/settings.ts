import { Hono } from 'hono'
import type { Vars } from '../lib/auth'
import { readSettings, writeSettings } from '../lib/settings'
import type { Settings, SettingsInput } from '../types'

const route = new Hono<Vars>()

route.get('/', (c) => c.json<Settings>(readSettings(c.get('account').userId)))

route.patch('/', async (c) => {
  const input = (await c.req.json()) as SettingsInput
  return c.json<Settings>(writeSettings(c.get('account').userId, input))
})

export default route
