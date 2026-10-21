import { getRoles } from "@/services/RoleService"
import { getDepartments } from "@/services/DepartmentService"
import { applyBackendOrg, setRolePerson } from "./org"

let loaded: Promise<boolean> | undefined

/**
 * Loads role titles and units from the backend (tbl_role, tbl_department) once per session. Accounts
 * without read access, or an unreachable backend, keep the seeded defaults – the demo still works.
 */
export function loadOrgFromBackend(): Promise<boolean> {
  return (loaded ??= Promise.all([getRoles(), getDepartments()])
    .then(([roles, departments]) => {
      applyBackendOrg(roles, departments)
      return true
    })
    .catch((error) => {
      console.warn("[VLDC] Không tải được vai trò/phòng ban từ backend, dùng dữ liệu mặc định:", error)
      return false
    }))
}

/** The signed-in person replaces the default person of each VLDC role the account holds. */
export function applySignedInUser(roleCodes: string[], fullName: string) {
  roleCodes.forEach((code) => setRolePerson(code, fullName))
}
