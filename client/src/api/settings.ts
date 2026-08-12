import type { Settings, SettingsInput } from '@api/types'
import { request } from './client'

export const fetchSettings = () => request<Settings>('/settings')

export const patchSettings = (input: SettingsInput) => request<Settings>('/settings', { method: 'PATCH', body: input })
