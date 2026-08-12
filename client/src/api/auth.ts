import type { LoginInput, ManualConfigRequired, OkResult, SessionUser } from '@api/types'
import { ApiError, request } from './client'

export const fetchSession = async (): Promise<SessionUser | null> => {
  try {
    return await request<SessionUser>('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export const login = (input: LoginInput) => request<SessionUser>('/auth/login', { method: 'POST', body: input })

export const logout = () => request<OkResult>('/auth/logout', { method: 'POST' })

/** The domain whose server the user must describe by hand, or null if this failure was something else. */
export function manualConfigDomain(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 422) return null
  const body = error.body as ManualConfigRequired | null
  return body?.error === 'manual_config_required' ? body.domain : null
}
