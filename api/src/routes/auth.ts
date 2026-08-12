import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ServerConfig } from '../db/schema'
import {
  authenticate,
  clientIp,
  endSession,
  recordAttempt,
  startSession,
  throttled,
  upsertUser,
  type Vars,
} from '../lib/auth'
import { allConfigs, domainOf, knownConfig, learnDomain, saveConfig, verify } from '../lib/discovery'
import type { LoginInput, ManualConfigRequired, ServerInput, SessionUser } from '../types'

const auth = new Hono<Vars>()

const summarise = (config: ServerConfig) => ({
  name: config.name,
  profile: config.profile,
  imapHost: config.imapHost,
  smtpHost: config.smtpHost,
  davUrl: config.davUrl,
})

const manualConfig = (raw: ServerInput | undefined, domain: string): ServerInput | undefined => {
  if (!raw) return undefined
  const { imapHost, imapPort, smtpHost, smtpPort, davUrl } = raw
  if (!imapHost || !smtpHost || !davUrl || !Number.isInteger(imapPort) || !Number.isInteger(smtpPort)) {
    throw new HTTPException(400, { message: 'server needs imapHost, imapPort, smtpHost, smtpPort and davUrl' })
  }
  return { ...raw, name: raw.name?.trim() || domain }
}

auth.post('/login', async (c) => {
  const { email, password, server } = (await c.req.json()) as Partial<LoginInput>
  if (typeof email !== 'string' || !email.includes('@') || typeof password !== 'string' || !password) {
    throw new HTTPException(400, { message: 'email and password are required' })
  }

  const address = email.trim().toLowerCase()
  const domain = domainOf(address)
  const ip = clientIp(c)
  if (throttled(address, ip)) throw new HTTPException(429, { message: 'Too many attempts; try again later' })

  const manual = manualConfig(server, domain)
  const known = manual ? undefined : knownConfig(domain)
  // A known domain gets one attempt against its own server; an unknown one is probed against the
  // catalogue, which is the only way to learn where it lives.
  const candidates: (ServerConfig | ServerInput)[] = manual ? [manual] : known ? [known] : allConfigs()

  for (const candidate of candidates) {
    const config = 'id' in candidate ? candidate : ({ ...candidate, id: 0 } as ServerConfig)
    if (!(await verify(address, password, config))) continue

    const saved = 'id' in candidate ? candidate : saveConfig(candidate)
    learnDomain(domain, saved.id)
    const user = upsertUser(address, domain)
    await startSession(c, user, password, saved)
    recordAttempt(address, ip, true)
    return c.json<SessionUser>({ email: user.email, domain, server: summarise(saved) })
  }

  recordAttempt(address, ip, false)
  // Only an unknown domain is ambiguous between a bad password and an unknown server.
  if (known || manual) throw new HTTPException(401, { message: 'Invalid email or password' })
  return c.json<ManualConfigRequired>({ error: 'manual_config_required', domain }, 422)
})

auth.post('/logout', authenticate, (c) => {
  endSession(c, c.get('account').key)
  return c.json({ ok: true })
})

auth.get('/me', authenticate, (c) => {
  const account = c.get('account')
  return c.json<SessionUser>({
    email: account.email,
    domain: domainOf(account.email),
    server: summarise(account.config),
  })
})

export default auth
