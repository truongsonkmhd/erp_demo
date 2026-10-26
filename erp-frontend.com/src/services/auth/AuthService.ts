import { apiRequest } from "@/lib/api"
import {
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  saveAuthSession,
  StoredAuthUser,
  updateStoredUser,
} from "@/services/auth/tokenStorage"
import {
  authenticateDemoUser,
  DEMO_SESSION_TOKEN,
  getDemoUser,
  isDemoSession,
} from "@/services/auth/demoAuth"

export type AuthTokens = {
  isAuthenticated: boolean
  token: string
  refreshToken: string
}

export type CurrentUser = StoredAuthUser

export async function loginWithPassword(email: string, password: string, remember = true) {
  const normalizedEmail = email.trim()
  const demoUser = import.meta.env.DEV ? authenticateDemoUser(normalizedEmail, password) : null

  if (demoUser) {
    saveAuthSession({
      token: DEMO_SESSION_TOKEN,
      refreshToken: "",
      user: demoUser,
      remember,
    })
    return demoUser
  }

  const tokens = await apiRequest<AuthTokens>("/api/authenticate", {
    method: "POST",
    auth: false,
    body: {
      email: normalizedEmail,
      password,
      isRememberMe: remember,
    },
  })

  if (!tokens?.token) {
    throw new Error("Đăng nhập thất bại")
  }

  saveAuthSession({
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: {
      id: 0,
      fullName: normalizedEmail,
      username: "",
      email: normalizedEmail,
    },
    remember,
  })

  const me = await fetchCurrentUser()
  saveAuthSession({
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: me,
    remember,
  })
  return me
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  if (import.meta.env.DEV && isDemoSession(getAccessToken())) {
    const user = getStoredUser() || getDemoUser()
    updateStoredUser(user)
    return user
  }

  const me = await apiRequest<{
    id: number
    fullName: string
    username: string
    email: string
    phone?: string
    role?: string
    roleCodes?: string[]
    accountType?: number
    levelId?: string
    roleName?: string
    positionCode?: string | null
    positionName?: string | null
    positionLevel?: number | null
    orgUnitCode?: string | null
    orgUnitName?: string | null
    managedUnitCodes?: string[]
    permissions?: { id: string; code?: string; label: string; pageCode?: string; actionCode?: string }[]
  }>("/api/authenticate/me")

  const user: CurrentUser = {
    id: me.id,
    fullName: me.fullName,
    username: me.username,
    email: me.email,
    phone: me.phone,
    role: me.role,
    roleCodes: me.roleCodes || (me.role ? [me.role] : []),
    accountType: me.accountType,
    levelId: me.levelId,
    roleName: me.roleName,
    positionCode: me.positionCode,
    positionName: me.positionName,
    positionLevel: me.positionLevel,
    orgUnitCode: me.orgUnitCode,
    orgUnitName: me.orgUnitName,
    managedUnitCodes: me.managedUnitCodes || [],
    permissions: me.permissions || [],
  }
  updateStoredUser(user)
  return user
}

export async function logoutApp() {
  const token = getAccessToken()
  try {
    if (token && !(import.meta.env.DEV && isDemoSession(token))) {
      await apiRequest<void>("/api/authenticate/logout", {
        method: "POST",
        auth: false,
        body: { token },
      })
    }
  } catch {
    // ignore logout API errors
  } finally {
    clearAuthSession()
  }
}

export function restoreSessionUser(): CurrentUser | null {
  if (!getAccessToken()) return null
  return getStoredUser()
}

export type RegistrationUnit = { id: number; code: string; name: string }

export type RegisterInput = {
  fullName: string
  email: string
  phone?: string
  password: string
  requestedOrgUnitId?: number
}

/** Self-registration: the account waits for an admin to grant roles and cannot sign in until approved. */
export async function registerAccount(input: RegisterInput): Promise<void> {
  await apiRequest("/api/authenticate/register", {
    method: "POST",
    auth: false,
    body: { ...input, email: input.email.trim(), fullName: input.fullName.trim() },
  })
}

export function getRegistrationUnits() {
  return apiRequest<RegistrationUnit[]>("/api/authenticate/register/units", { auth: false })
}
