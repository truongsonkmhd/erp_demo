export const DEMO_SESSION_TOKEN = "development-demo-session"

const DEMO_EMAIL = "demo@vldc.gov.vn"

const demoUser = {
  id: -1,
  fullName: "Tài khoản Demo",
  username: "demo",
  email: DEMO_EMAIL,
  role: "DEMO",
  roleName: "Người dùng demo",
  permissions: [],
}

export function authenticateDemoUser(_email: string, _password: string) {
  return null
}

export function getDemoUser() {
  return { ...demoUser }
}

export function isDemoSession(_token: string | null) {
  return false
}
