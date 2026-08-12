import { mailbox, type Mailbox } from '../data/mockMail'
import { delay, maybeFail } from './client'

export async function fetchMailbox(): Promise<Mailbox> {
  await delay()
  await maybeFail('mailbox')
  return mailbox
}
