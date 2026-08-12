import {
  appendContact,
  contactsData,
  initialsFromName,
  type Contact,
  type ContactsData,
} from '../data/mockContacts'
import { delay, maybeFail } from './client'

export type { Contact, ContactsData }

export type CreateContactInput = {
  name: string
  email: string
  phone: string
  company: string
  role: string
  notes: string
  avatarTone: Contact['avatarTone']
}

export async function fetchContacts(): Promise<ContactsData> {
  await delay()
  await maybeFail('contacts')
  return contactsData
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  await delay()
  await maybeFail('createContact')
  return appendContact({
    id: `contact-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    company: input.company.trim(),
    role: input.role.trim(),
    notes: input.notes.trim(),
    avatarTone: input.avatarTone,
    initials: initialsFromName(input.name),
  })
}
