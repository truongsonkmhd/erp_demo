import { apiRequest } from "@/lib/api"
import { applyBackendOrg, setRolePerson, type OrgDirectory } from "./org"

let loaded: Promise<boolean> | undefined

/**
 * Loads positions, the unit tree and who holds which role in which unit (GET /api/org/directory) once per
 * session. An unreachable backend keeps the seeded defaults – the demo still works.
 */
export function loadOrgFromBackend(): Promise<boolean> {
  return (loaded ??= apiRequest<OrgDirectory>("/api/org/directory")
    .then((directory) => {
      applyBackendOrg(directory)
      return true
    })
    .catch((error) => {
      console.warn("[VLDC] Không tải được tổ chức từ backend, dùng dữ liệu mặc định:", error)
      return false
    }))
}

/** The signed-in person replaces the default person of each VLDC role the account holds. */
export function applySignedInUser(roleCodes: string[], fullName: string) {
  roleCodes.forEach((code) => setRolePerson(code, fullName))
}
