export class ApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

declare global {
  var __QWIX_API_FAIL__: boolean | undefined
}

export async function delay(ms = 450): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function maybeFail(label: string): Promise<void> {
  if (globalThis.__QWIX_API_FAIL__) {
    throw new ApiError(`Mock ${label} request failed`, 503)
  }
}
