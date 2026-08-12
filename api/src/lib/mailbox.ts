import type { ImapFlow } from 'imapflow'
import { imap } from './imap'
import type { Account } from './account'

type Role = '\\Archive' | '\\Junk' | '\\Trash'

const FALLBACKS: Record<Role, string[]> = {
  '\\Archive': ['Archive', 'Archives', 'INBOX.Archive'],
  '\\Junk': ['Junk', 'Spam', 'INBOX.Junk', 'INBOX.Spam'],
  '\\Trash': ['Trash', 'Deleted Items', 'INBOX.Trash'],
}

/** The mailbox playing a role, by SPECIAL-USE where the server declares it and by name where it does not. */
export async function roleFolder(account: Account, role: Role): Promise<string | null> {
  const boxes = await (await imap(account)).list()
  const declared = boxes.find((box) => box.specialUse === role)
  if (declared) return declared.path
  const named = boxes.find((box) => FALLBACKS[role].some((name) => name.toLowerCase() === box.path.toLowerCase()))
  return named?.path ?? null
}

export const mailboxExists = async (client: ImapFlow, path: string) =>
  (await client.list()).some((box) => box.path === path)
