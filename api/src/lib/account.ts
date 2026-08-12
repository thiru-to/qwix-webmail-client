import type { ServerConfig } from '../db/schema'
import { profile } from './providers'

// A logged-in mailbox. `key` is the session id, so pooled connections die with the session.
export type Account = {
  key: string
  userId: number
  email: string
  password: string
  config: ServerConfig
}

export const provider = (account: Account) => profile(account.config.profile)

export const endpoints = (config: ServerConfig) => ({
  dav: config.davUrl,
  imap: { host: config.imapHost, port: config.imapPort },
  smtp: { host: config.smtpHost, port: config.smtpPort },
})

// The only place a live mail password exists. Never persisted, so a restart ends every session.
const live = new Map<string, Account>()

export const remember = (account: Account) => live.set(account.key, account)
export const recall = (key: string) => live.get(key)
export const forget = (key: string) => live.delete(key)
