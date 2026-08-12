import type {
  FilterRunResult,
  ForwardAddress,
  ForwardVerifyInput,
  MailFilter,
  MailFilterInput,
  OkResult,
} from '@api/types'
import { request } from './client'

export const fetchFilters = () => request<MailFilter[]>('/filters')

export const createFilter = (input: MailFilterInput) => request<MailFilter>('/filters', { method: 'POST', body: input })

export const updateFilter = (id: number, input: Partial<MailFilterInput> & { position?: number }) =>
  request<MailFilter>(`/filters/${id}`, { method: 'PATCH', body: input })

export const deleteFilter = (id: number) => request<OkResult>(`/filters/${id}`, { method: 'DELETE' })

export const runFilters = (folder: string) =>
  request<FilterRunResult>('/filters/run', { method: 'POST', body: { folder } })

export const fetchForwarders = () => request<ForwardAddress[]>('/filters/forwarders')

export const requestForwarder = (email: string) =>
  request<OkResult>('/filters/forwarders', { method: 'POST', body: { email } })

export const verifyForwarder = (input: ForwardVerifyInput) =>
  request<OkResult>('/filters/forwarders/verify', { method: 'POST', body: input })

export const deleteForwarder = (id: number) => request<OkResult>(`/filters/forwarders/${id}`, { method: 'DELETE' })
