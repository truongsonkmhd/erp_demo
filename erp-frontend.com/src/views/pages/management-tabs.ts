export type ManagementArea = "full" | "access"
export type ManagementTab = { id: "users" | "roles" | "departments" | "permissions"; label: string }

export function managementTabs({ area, canUsers, canRoles }: { area: ManagementArea; canUsers: boolean; canRoles: boolean }): ManagementTab[] {
  const tabs: ManagementTab[] = []
  if (area === "full" && canUsers) tabs.push({ id: "users", label: "Người dùng" })
  if (canRoles) {
    if (area === "access") tabs.push({ id: "departments", label: "Phòng ban" })
    tabs.push({ id: "roles", label: "Vai trò" })
    if (area === "full") tabs.push({ id: "departments", label: "Phòng ban" })
    tabs.push({ id: "permissions", label: "Phân quyền" })
  }
  return tabs
}
