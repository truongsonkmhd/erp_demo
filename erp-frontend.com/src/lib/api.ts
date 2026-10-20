import { clearAuthSession, getAccessToken, getRefreshToken, saveAuthSession, getStoredUser } from "@/services/auth/tokenStorage"

export type ResultMessage<T> = {
  success: boolean
  message?: string
  code?: number
  timestamp?: number
  result?: T
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""

export class ApiError extends Error {
  status: number
  code?: number

  constructor(message: string, status = 400, code?: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

export function isSystemError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status >= 500 || err.status === 0
  }
  if (err instanceof TypeError) {
    return true
  }
  if (err instanceof Error) {
    const message = err.message.trim().toLowerCase()
    return (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("network error") ||
      /^http 5\d\d/.test(message)
    )
  }
  return false
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  auth?: boolean
  raw?: boolean
}

async function parseResult<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as ResultMessage<T> | null
  if (!response.ok) {
    throw new ApiError(data?.message || `HTTP ${response.status}`, response.status, data?.code)
  }
  if (data && typeof data.success === "boolean") {
    if (!data.success) {
      throw new ApiError(data.message || "Request failed", response.status, data.code)
    }
    return data.result as T
  }
  return data as unknown as T
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  const response = await fetch(`${API_BASE}/api/authenticate/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) {
    clearAuthSession()
    return null
  }
  const result = await parseResult<{ isAuthenticated: boolean; token: string; refreshToken: string }>(response)
  const user = getStoredUser()
  if (!user || !result?.token) {
    clearAuthSession()
    return null
  }
  const remember = Boolean(localStorage.getItem("pts_access_token"))
  saveAuthSession({
    token: result.token,
    refreshToken: result.refreshToken,
    user,
    remember,
  })
  return result.token
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const useAuth = options.auth !== false
  if (useAuth) {
    const token = getAccessToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  }).catch(() => {
    throw new ApiError("Thông báo lỗi hệ thống", 0)
  })

  if (response.status === 401 && useAuth && getRefreshToken()) {
    const nextToken = await refreshAccessToken()
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`)
      const retry = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      }).catch(() => {
        throw new ApiError("Thông báo lỗi hệ thống", 0)
      })
      return parseResult<T>(retry)
    }
  }

  return parseResult<T>(response)
}

export { API_BASE }
