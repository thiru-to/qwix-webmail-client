import nodemailer from 'nodemailer'
import type { SendInput } from '../types'
import { endpoints, type Account } from './account'

const pool = new Map<string, nodemailer.Transporter>()

const transport = (account: Account) => {
  const existing = pool.get(account.key)
  if (existing) return existing

  const { host, port } = endpoints(account.config).smtp
  const created = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: account.email, pass: account.password },
  })
  pool.set(account.key, created)
  return created
}

export const release = (key: string) => {
  pool.get(key)?.close()
  pool.delete(key)
}

const composer = nodemailer.createTransport({ streamTransport: true, buffer: true })

type Built = { message: Buffer; envelope: { from: string; to: string[] }; messageId: string }

// Compose once so the exact bytes that go out over SMTP are the ones filed in Sent. `from` only ever
// comes from a stored identity, which is already pinned to the account's own domain.
export const send = async (account: Account, input: SendInput, from?: { name: string; address: string }) => {
  const built = (await composer.sendMail({
    ...input,
    from: from ?? account.email,
    attachments: input.attachments?.map((a) => ({ ...a, encoding: 'base64' })),
  })) as unknown as Built

  await transport(account).sendMail({ envelope: built.envelope, raw: built.message })
  return { raw: built.message, messageId: built.messageId }
}
