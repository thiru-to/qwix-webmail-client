import { contactsData, type ContactsData } from '../data/mockContacts'
import { delay, maybeFail } from './client'

export async function fetchContacts(): Promise<ContactsData> {
  await delay()
  await maybeFail('contacts')
  return contactsData
}
