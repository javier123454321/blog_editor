const AUTH_KEY = 'blog_editor_password'

export function getStoredPassword(): string | null {
  try {
    return localStorage.getItem(AUTH_KEY)
  } catch {
    return null
  }
}

export function setStoredPassword(password: string | null): void {
  try {
    if (password === null) {
      localStorage.removeItem(AUTH_KEY)
    } else {
      localStorage.setItem(AUTH_KEY, password)
    }
  } catch {
    // ignore storage errors
  }
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  password?: string | null
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, password, headers: initHeaders, ...rest } = options
  const headers = new Headers(initHeaders)

  const auth = password === undefined ? getStoredPassword() : password
  if (auth) {
    headers.set('X-Auth-Password', auth)
  }

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`/api${path}`, {
    ...rest,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : null) || res.statusText || 'Request failed'
    throw new ApiError(message, res.status, data)
  }

  return data as T
}
