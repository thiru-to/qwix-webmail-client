import type { ApiError as ApiErrorBody } from '@api/types'
import { useShellStore } from '../stores/shellStore'

const BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number
  detail?: string
  /** Parsed error payload, so callers can read fields beyond `error` (e.g. `manual_config_required`). */
  body: unknown

  constructor(message: string, status: number, body?: unknown, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.detail = detail
  }
}

type RequestOptions = { method?: string; body?: unknown; signal?: AbortSignal }

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      // The session is an httpOnly cookie on another origin; without this it never rides along.
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch {
    throw new ApiError('Cannot reach the Qwix server.', 0)
  }

  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    // /auth/me answering 401 just means "not signed in"; anywhere else it means a live session ended.
    if (response.status === 401 && !path.startsWith('/auth/')) {
      useShellStore.getState().setSessionExpired(true)
    }
    const error = payload as ApiErrorBody | null
    throw new ApiError(error?.error ?? `Request failed (${response.status})`, response.status, payload, error?.detail)
  }

  return payload as T
}

export const apiUrl = (path: string) => `${BASE}${path}`
