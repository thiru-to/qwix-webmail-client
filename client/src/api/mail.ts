import { mailbox, type Mail } from '../data/mockMail'
import { delay, maybeFail } from './client'

export type CreateMessageInput = {
  to: string
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  attachments?: string[]
}

export async function fetchMailbox() {
  await delay()
  await maybeFail('mailbox')
  return mailbox
}

export async function createMessage(input: CreateMessageInput): Promise<Mail> {
  await delay()
  await maybeFail('createMessage')
  const now = new Date()
  const bodyLines = input.body.split(/\n/).filter((line) => line.length > 0)
  const message: Mail = {
    id: `sent-${now.getTime()}`,
    sender: mailbox.account.name,
    email: mailbox.account.email,
    initials: mailbox.account.name
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    avatarTone: 'plum',
    subject: input.subject.trim(),
    preview: input.body.trim().slice(0, 120),
    time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    date: 'Today',
    labels: [],
    attachments: input.attachments?.length ? input.attachments : undefined,
    body: bodyLines.length ? bodyLines : [input.body.trim()],
    folder: 'Sent',
    cc: input.cc?.length ? input.cc : undefined,
    bcc: input.bcc?.length ? input.bcc : undefined,
  }
  mailbox.messages.unshift(message)
  const sent = mailbox.folders.find((f) => f.name === 'Sent')
  if (sent) sent.count += 1
  return message
}
