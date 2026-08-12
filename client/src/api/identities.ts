import type { Identity, IdentityInput, OkResult } from '@api/types'
import { request } from './client'

export const fetchIdentities = () => request<Identity[]>('/identities')

export const createIdentity = (input: IdentityInput) => request<Identity>('/identities', { method: 'POST', body: input })

export const updateIdentity = (id: number, input: Partial<IdentityInput>) =>
  request<Identity>(`/identities/${id}`, { method: 'PATCH', body: input })

export const deleteIdentity = (id: number) => request<OkResult>(`/identities/${id}`, { method: 'DELETE' })
