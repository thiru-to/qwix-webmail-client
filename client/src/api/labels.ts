import type { Label, LabelAssignment, LabelInput, OkResult } from '@api/types'
import { request } from './client'

export const fetchLabels = () => request<Label[]>('/labels')

export const createLabel = (input: LabelInput) => request<Label>('/labels', { method: 'POST', body: input })

export const updateLabel = (id: number, input: LabelInput) =>
  request<Label>(`/labels/${id}`, { method: 'PATCH', body: input })

export const deleteLabel = (id: number) => request<OkResult>(`/labels/${id}`, { method: 'DELETE' })

export const assignLabel = (input: LabelAssignment) =>
  request<OkResult>('/labels/assign', { method: 'POST', body: input })
