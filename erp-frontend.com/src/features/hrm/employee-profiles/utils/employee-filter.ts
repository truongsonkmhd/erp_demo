import type { EmployeeRecord, WorkStatus } from "../types/employee-profile.types.ts"

export interface EmployeeFilterState {
  keyword?: string
  department?: string
  workStatus?: WorkStatus | "all" | ""
  contractType?: string
}

export function normalizeSearchText(text?: string | null): string {
  if (!text) return ""
  return text.trim().toLowerCase().replace(/\s+/g, " ")
}

export function filterEmployees(employees: EmployeeRecord[], filters: EmployeeFilterState): EmployeeRecord[] {
  const normKeyword = normalizeSearchText(filters.keyword)
  const normDept = (filters.department || "").trim().toLowerCase()
  const status = filters.workStatus && filters.workStatus !== "all" ? filters.workStatus : undefined
  const normContract = (filters.contractType || "").trim().toLowerCase()

  return employees.filter((emp) => {
    // 1. Keyword search (employeeCode, fullName, email, phone)
    if (normKeyword) {
      const code = normalizeSearchText(emp.employeeCode)
      const name = normalizeSearchText(emp.fullName)
      const email = normalizeSearchText(emp.email)
      const phone = normalizeSearchText(emp.phone)

      const matchesKeyword =
        code.includes(normKeyword) ||
        name.includes(normKeyword) ||
        email.includes(normKeyword) ||
        phone.includes(normKeyword)

      if (!matchesKeyword) return false
    }

    // 2. Department filter
    if (normDept && normDept !== "all") {
      const empDept = (emp.department || "").trim().toLowerCase()
      if (empDept !== normDept) return false
    }

    // 3. Work status filter
    if (status) {
      if (emp.workStatus !== status) return false
    }

    // 4. Contract type filter
    if (normContract && normContract !== "all") {
      const empContract = (emp.contractType || "").trim().toLowerCase()
      if (empContract !== normContract) return false
    }

    return true
  })
}
