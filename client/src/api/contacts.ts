import type { ContactInput, ContactItem, ContactsResponse, ContactUpdate, OkResult } from '@api/types'
import { request } from './client'

export const fetchContacts = () => request<ContactsResponse>('/contacts/list')

export const createContact = (input: ContactInput) =>
  request<ContactItem>('/contacts/create', { method: 'POST', body: input })

export const updateContact = (input: ContactUpdate) =>
  request<ContactItem>('/contacts/update', { method: 'PUT', body: input })

export const deleteContact = (url: string) =>
  request<OkResult>(`/contacts/delete?url=${encodeURIComponent(url)}`, { method: 'DELETE' })
