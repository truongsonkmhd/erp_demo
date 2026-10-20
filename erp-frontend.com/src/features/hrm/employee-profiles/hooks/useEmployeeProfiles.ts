import { useCallback, useEffect, useState } from "react"

import { appToast } from "@/components/ui/app-toast"
import { getDepartments, type Department } from "@/services/DepartmentService"
import { getEmployees, updateEmployee } from "@/services/EmployeeService"
import { mergeAllToRecords } from "../adaptors/employee-profile.adaptor.ts"
import { defaultEmployeeProfileRepository } from "../repositories/employee-profile.storage.ts"
import type { EmployeeRecord } from "../types/employee-profile.types.ts"

export function useEmployeeProfiles(enabled = true) {
  const [records, setRecords] = useState<EmployeeRecord[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true)
    setIsError(false)
    setError(null)

    try {
      const [accounts, depts] = await Promise.all([
        getEmployees(),
        getDepartments().catch(() => [] as Department[]),
      ])

      const profiles = defaultEmployeeProfileRepository.getAll()
      const merged = mergeAllToRecords(accounts, profiles)

      setRecords(merged)
      setDepartments(depts)
    } catch (err: unknown) {
      setIsError(true)
      const errObj = err instanceof Error ? err : new Error("Không thể tải danh sách cán bộ")
      setError(errObj)
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      void refetch()
    } else {
      setIsLoading(false)
    }
  }, [enabled, refetch])

  const toggleAccountStatus = useCallback(
    async (record: EmployeeRecord) => {
      const newActive = !record.accountActive
      const actionName = newActive ? "Kích hoạt" : "Khóa"

      try {
        await updateEmployee(record.userId, { active: newActive })

        // Cập nhật trạng thái trong storage nếu có
        const currentProfile = defaultEmployeeProfileRepository.getByUserId(record.userId)
        if (currentProfile) {
          defaultEmployeeProfileRepository.save({
            ...currentProfile,
            workStatus: newActive ? "active" : "terminated",
          })
        }

        appToast.success(`Đã ${actionName.toLowerCase()} tài khoản cán bộ thành công`)
        await refetch({ silent: true })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : `Không thể ${actionName.toLowerCase()} tài khoản`
        appToast.error(`Lỗi thao tác ${actionName.toLowerCase()}`, msg)
      }
    },
    [refetch],
  )

  return {
    records,
    departments,
    isLoading,
    isError,
    error,
    refetch,
    toggleAccountStatus,
  }
}
