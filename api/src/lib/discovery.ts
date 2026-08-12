import { eq } from 'drizzle-orm'
import { ImapFlow } from 'imapflow'
import { db } from '../db'
import { domains, serverConfigs, type ServerConfig } from '../db/schema'
import type { ServerInput } from '../types'
import { profiles } from './providers'

export const domainOf = (email: string) => email.slice(email.lastIndexOf('@') + 1).toLowerCase()

// Built-ins come from the same .env.local entries the single-account setup used, so a fresh
// database still knows about every server already in use.
export const seed = () => {
  for (const name of Object.keys(profiles)) {
    const prefix = name.toUpperCase()
    const mail = process.env[`${prefix}_MAIL_SERVER`]?.trim()
    const dav = process.env[`${prefix}_DAV_SERVER`]?.trim()
    if (!mail || !dav) continue

    const bare = (value: string) => value.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    db.insert(serverConfigs)
      .values({
        name,
        profile: name,
        imapHost: bare(mail),
        imapPort: Number(process.env[`${prefix}_IMAP_PORT`] ?? profiles[name]!.ports.imap),
        smtpHost: bare(mail),
        smtpPort: Number(process.env[`${prefix}_SMTP_PORT`] ?? profiles[name]!.ports.smtp),
        davUrl: dav.startsWith('http') ? dav : `https://${bare(dav)}`,
        builtIn: true,
      })
      .onConflictDoNothing()
      .run()
  }
}

export const knownConfig = (domain: string) =>
  db
    .select({ config: serverConfigs })
    .from(domains)
    .innerJoin(serverConfigs, eq(domains.serverConfigId, serverConfigs.id))
    .where(eq(domains.domain, domain))
    .get()?.config

export const allConfigs = () => db.select().from(serverConfigs).all()

export const saveConfig = (input: ServerInput): ServerConfig => {
  const existing = db.select().from(serverConfigs).where(eq(serverConfigs.name, input.name)).get()
  if (existing) return existing
  return db
    .insert(serverConfigs)
    .values({
      name: input.name,
      profile: input.profile && profiles[input.profile] ? input.profile : 'standard',
      imapHost: input.imapHost,
      imapPort: input.imapPort,
      smtpHost: input.smtpHost,
      smtpPort: input.smtpPort,
      davUrl: input.davUrl,
    })
    .returning()
    .get()
}

export const learnDomain = (domain: string, serverConfigId: number) =>
  db
    .insert(domains)
    .values({ domain, serverConfigId, verifiedAt: new Date() })
    .onConflictDoUpdate({ target: domains.domain, set: { serverConfigId, verifiedAt: new Date() } })
    .run()

// The mail server is the identity provider: credentials are only valid if IMAP accepts them.
export const verify = async (email: string, password: string, config: ServerConfig) => {
  const client = new ImapFlow({
    host: config.imapHost,
    port: config.imapPort,
    secure: config.imapPort !== 143,
    auth: { user: email, pass: password },
    logger: false,
    // A wrong host should fail fast rather than hold the login open.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  })
  client.on('error', () => {})
  try {
    await client.connect()
    await client.logout()
    return true
  } catch {
    client.close()
    return false
  }
}
