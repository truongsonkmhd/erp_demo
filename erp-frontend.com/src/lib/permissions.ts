import type { CurrentUser } from "@/services/auth/AuthService"

export function can(user: CurrentUser | null, code: string): boolean {
  if (!user) return false
  if (user.roleCodes?.includes("admin") || user.role === "admin") return true
  return (user.permissions || []).some((permission) => (permission.code || permission.id) === code)
}

export function canAccess(user: CurrentUser | null, pageCode: string): boolean {
  if (pageCode === "ke-hoach-nhiem-vu-du-an") return ["ho-so-nhiem-vu", "bang-cong-viec", "ke-hoach", "theo-doi-tien-do", "nguon-luc-nhiem-vu", "so-sanh-don-vi"].some((page) => can(user, `mission-${page}:access`))
  if (pageCode === "ke-hoach-nhiem-vu-du-an/bang-cong-viec") return can(user, "mission-bang-cong-viec:access") || can(user, "mission-theo-doi-tien-do:access") || can(user, "mission-ho-so-nhiem-vu:access")
  if (pageCode === "ke-hoach-nhiem-vu-du-an/ho-so-nhiem-vu") return can(user, "mission-ho-so-nhiem-vu:access") || can(user, "mission-bang-cong-viec:access") || can(user, "mission-theo-doi-tien-do:access")
  if (pageCode.startsWith("ke-hoach-nhiem-vu-du-an/")) return can(user, `mission-${pageCode.split("/")[1]}:access`)
  if (pageCode === "roles") return can(user, "roles:access") || can(user, "users:access")
  if (pageCode === "access-management") return can(user, "roles:access")
  if (pageCode.startsWith("van-ban-ho-so-phe-duyet")) return true
  if (pageCode === "mua-sam-vat-tu-kho" || pageCode.startsWith("mua-sam-vat-tu-kho/")) return true
  if (pageCode.startsWith("tai-san-thiet-bi")) return true
  if (pageCode.startsWith("ky-thuat-nghiem-thu")) return true
  if (pageCode === "vldc") return can(user, "vldc-dashboard:access")
  if (pageCode.startsWith("vldc/")) return can(user, `vldc-${pageCode.split("/")[1]}:access`)
  if (pageCode === "nhan-su-tien-luong" || pageCode.startsWith("nhan-su-tien-luong/")) {
    return can(user, "users:access")
  }
  return can(user, `${pageCode}:access`)
}

export function firstAllowedPath(user: CurrentUser | null): string {
  const pages = [
    "vldc/dashboard",
    "dashboard",
      "ke-hoach-nhiem-vu-du-an/ho-so-nhiem-vu",
      "ke-hoach-nhiem-vu-du-an/ke-hoach",
      "ke-hoach-nhiem-vu-du-an/theo-doi-tien-do",
      "ke-hoach-nhiem-vu-du-an/nguon-luc-nhiem-vu",
      "ke-hoach-nhiem-vu-du-an/so-sanh-don-vi",
    "nhan-su-tien-luong/ho-so-nhan-su",
    "projects-marketing",
    "projects-sale",
    "projects-cskh",
    "documents",
    "learning",
    "huong-dan",
    "access-management",
    "roles",
    "timeline",
    "templates",
    "reports",
    "tools",
    "settings",
  ]
  return `/${pages.find((page) => canAccess(user, page)) || "dashboard"}`
}
