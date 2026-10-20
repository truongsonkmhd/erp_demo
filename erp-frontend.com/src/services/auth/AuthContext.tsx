import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

import {
  fetchCurrentUser,
  loginWithPassword,
  logoutApp,
  restoreSessionUser,
  type CurrentUser,
} from "@/services/auth/AuthService"
import { clearAuthSession } from "@/services/auth/tokenStorage"

type AuthCtx = {
  user: (CurrentUser & { displayName?: string }) | null
  loading: boolean
  signIn: (email: string, password: string, remember: boolean) => Promise<CurrentUser>
  signUp: (email: string, password: string) => Promise<void>
  forgot: (email: string) => Promise<void>
  signOut: () => Promise<void>
  refreshMe: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

function withDisplayName(user: CurrentUser | null) {
  if (!user) return null
  return {
    ...user,
    displayName: user.fullName || user.username || user.email,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(CurrentUser & { displayName?: string }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cached = restoreSessionUser()
        if (cached) {
          if (!cancelled) setUser(withDisplayName(cached))
          const me = await fetchCurrentUser()
          if (!cancelled) setUser(withDisplayName(me))
        }
      } catch {
        clearAuthSession()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = async (email: string, password: string, remember: boolean) => {
    if (remember) localStorage.setItem("auth_email", email)
    else localStorage.removeItem("auth_email")
    const me = await loginWithPassword(email, password, remember)
    setUser(withDisplayName(me))
    return me
  }

  const signUp = async (_email: string, _password: string) => {
    throw new Error("Đăng ký công khai chưa được bật. Liên hệ admin để tạo tài khoản.")
  }

  const forgot = async (_email: string) => {
    throw new Error("Quên mật khẩu chưa được hỗ trợ trên backend hiện tại.")
  }

  const signOut = async () => {
    await logoutApp()
    setUser(null)
  }

  const refreshMe = async () => {
    const me = await fetchCurrentUser()
    setUser(withDisplayName(me))
  }

  return (
    <Ctx.Provider value={{ user, loading, signIn, signUp, forgot, signOut, refreshMe }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
