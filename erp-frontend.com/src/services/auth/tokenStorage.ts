const ACCESS_TOKEN_KEY = "pts_access_token"
const REFRESH_TOKEN_KEY = "pts_refresh_token"
const AUTH_USER_KEY = "pts_auth_user"

export type StoredAuthUser = {
  id: number
  fullName: string
  username: string
  email: string
  phone?: string | null
  role?: string | null
  roleCodes?: string[]
  accountType?: number
  levelId?: string | null
  roleName?: string | null
  /** Chức vụ and đơn vị (tbl_position / tbl_department), and the units this user manages. */
  positionCode?: string | null
  positionName?: string | null
  positionLevel?: number | null
  orgUnitCode?: string | null
  orgUnitName?: string | null
  managedUnitCodes?: string[]
  permissions?: { id: string; code?: string; label: string; pageCode?: string; actionCode?: string }[]
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser(): StoredAuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAuthUser
  } catch {
    return null
  }
}

export function saveAuthSession(params: {
  token: string
  refreshToken: string
  user: StoredAuthUser
  remember: boolean
}) {
  const store = params.remember ? localStorage : sessionStorage
  const other = params.remember ? sessionStorage : localStorage
  ;[ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, AUTH_USER_KEY].forEach((key) => other.removeItem(key))
  store.setItem(ACCESS_TOKEN_KEY, params.token)
  store.setItem(REFRESH_TOKEN_KEY, params.refreshToken)
  store.setItem(AUTH_USER_KEY, JSON.stringify(params.user))
}

export function updateStoredUser(user: StoredAuthUser) {
  if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  } else if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
}

export function clearAuthSession() {
  ;[localStorage, sessionStorage].forEach((store) => {
    store.removeItem(ACCESS_TOKEN_KEY)
    store.removeItem(REFRESH_TOKEN_KEY)
    store.removeItem(AUTH_USER_KEY)
    store.removeItem("mock_user")
  })
}
