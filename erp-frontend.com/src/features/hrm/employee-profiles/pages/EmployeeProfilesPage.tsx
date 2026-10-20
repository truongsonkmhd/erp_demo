import React, { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Calendar,
  Clock,
  Download,
  GraduationCap,
  Plus,
  RefreshCw,
  UserCheck,
  Users,
  UserX,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { can } from "@/lib/permissions"
import { useAuth } from "@/services/auth/AuthContext"
import HrmDevelopmentPage from "@/features/hrm/development/pages/HrmDevelopmentPage"
import HrmLeavePage from "@/features/hrm/leave/pages/HrmLeavePage"
import { EmployeeProfileModal } from "../components/EmployeeProfileModal"
import { EmployeeProfileFilters } from "../components/EmployeeProfileFilters"
import { EmployeeProfileTable } from "../components/EmployeeProfileTable"
import { useEmployeeProfiles } from "../hooks/useEmployeeProfiles"
import type { EmployeeRecord } from "../types/employee-profile.types.ts"
import { exportEmployeesToExcel } from "../utils/employee-export.ts"
import { filterEmployees, type EmployeeFilterState } from "../utils/employee-filter.ts"

export default function EmployeeProfilesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSubTab = searchParams.get("tab") || "profiles"

  const { user: currentUser } = useAuth()
  const canAccessHrm = can(currentUser, "users:access")
  const canCreate = can(currentUser, "users:create")
  const canUpdate = can(currentUser, "users:update")

  const {
    records,
    departments,
    isLoading,
    isError,
    error,
    refetch,
    toggleAccountStatus,
  } = useEmployeeProfiles(canAccessHrm)

  // Filter state cho HRM-01
  const [filters, setFilters] = useState<EmployeeFilterState>({
    keyword: "",
    department: "all",
    workStatus: "all",
    contractType: "all",
  })

  // Popup Modal state cho HRM-01 (Mở Popup giữa màn hình)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingRecord, setEditingRecord] = useState<EmployeeRecord | null>(null)

  // Tính toán số liệu thống kê ERP Metric Cards
  const stats = useMemo(() => {
    const total = records.length
    const active = records.filter((r) => r.workStatus === "active").length
    const probation = records.filter((r) => r.workStatus === "probation").length
    const inactive = records.filter((r) => r.workStatus === "terminated" || r.workStatus === "on_leave").length
    return { total, active, probation, inactive }
  }, [records])

  // Lọc dữ liệu theo bộ lọc hiện tại
  const filteredRecords = useMemo(() => {
    return filterEmployees(records, filters)
  }, [records, filters])

  const handleOpenCreate = () => {
    setModalMode("create")
    setEditingRecord(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (record: EmployeeRecord) => {
    setModalMode("edit")
    setEditingRecord(record)
    setModalOpen(true)
  }

  const handleQuickFilter = (status: EmployeeFilterState["workStatus"]) => {
    setFilters((prev) => ({
      ...prev,
      workStatus: prev.workStatus === status ? "all" : status,
    }))
  }

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  return (
    <div className="flex-1 space-y-5 p-6 max-w-[1600px] mx-auto">
      {/* 1. Header Trang & Phân hệ Sub-navigation Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Hồ sơ nhân sự</h1>

          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Quản trị toàn diện hồ sơ lý lịch cán bộ, phát triển đào tạo, nâng lương, khen thưởng - kỷ luật và nghỉ phép.
          </p>
        </div>

        {/* Thanh chuyển đổi phân hệ con (HRM-01, HRM-02, HRM-03) */}
        <div className="flex items-center">
          <Tabs value={activeSubTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="bg-muted/70 p-1 rounded-xl border border-border/50 grid grid-cols-3">
              <TabsTrigger value="profiles" className="text-xs font-medium gap-1.5 rounded-lg px-3">
                <Users className="h-3.5 w-3.5" />
                <span>Hồ sơ cán bộ</span>
              </TabsTrigger>
              <TabsTrigger value="development" className="text-xs font-medium gap-1.5 rounded-lg px-3">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Đào tạo & Thi đua</span>
              </TabsTrigger>
              <TabsTrigger value="leave" className="text-xs font-medium gap-1.5 rounded-lg px-3">
                <Calendar className="h-3.5 w-3.5" />
                <span>Nghỉ phép</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* --- TAB 1: HRM-01 - HỒ SƠ NHÂN SỰ --- */}
      {activeSubTab === "profiles" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          {/* Toolbar HRM-01 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Quản lý danh sách, thông tin định danh và quá trình công tác của cán bộ, nhân viên.
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                disabled={isLoading}
                className="h-8 text-xs gap-1.5"
                title="Tải lại danh sách"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                <span>Tải lại</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => exportEmployeesToExcel(filteredRecords)}
                disabled={filteredRecords.length === 0}
                className="h-8 text-xs gap-1.5"
                title="Xuất Excel"
              >
                <Download className="h-3 w-3" />
                <span>Xuất Excel</span>
              </Button>

              {canCreate && (
                <Button onClick={handleOpenCreate} size="sm" className="h-8 text-xs gap-1.5 font-medium shadow-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm mới hồ sơ</span>
                </Button>
              )}
            </div>
          </div>

          {/* 4 ERP Metric Cards (HRM-01) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              type="button"
              onClick={() => handleQuickFilter("all")}
              className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-primary/50 shadow-2xs ${filters.workStatus === "all" ? "ring-2 ring-primary/30 border-primary" : "border-border"
                }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-muted-foreground">Tổng nhân sự</span>
                <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFilter("active")}
              className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-emerald-500/50 shadow-2xs ${filters.workStatus === "active" ? "ring-2 ring-emerald-500/30 border-emerald-500" : "border-border"
                }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-muted-foreground">Đang làm việc</span>
                <div className="text-2xl font-bold text-emerald-600 font-mono">{stats.active}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFilter("probation")}
              className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-amber-500/50 shadow-2xs ${filters.workStatus === "probation" ? "ring-2 ring-amber-500/30 border-amber-500" : "border-border"
                }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-muted-foreground">Đang thử việc</span>
                <div className="text-2xl font-bold text-amber-600 font-mono">{stats.probation}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFilter("terminated")}
              className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-rose-500/50 shadow-2xs ${filters.workStatus === "terminated" ? "ring-2 ring-rose-500/30 border-rose-500" : "border-border"
                }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-muted-foreground">Thôi việc / Tạm hoãn</span>
                <div className="text-2xl font-bold text-muted-foreground font-mono">{stats.inactive}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <UserX className="h-5 w-5" />
              </div>
            </button>
          </div>

          {/* Bộ lọc HRM-01 */}
          <EmployeeProfileFilters
            filters={filters}
            onFiltersChange={setFilters}
            departments={departments}
            filteredRecords={filteredRecords}
            totalCount={records.length}
          />

          {/* Bảng dữ liệu HRM-01 */}
          <EmployeeProfileTable
            records={filteredRecords}
            totalUnfilteredCount={records.length}
            loading={isLoading}
            error={isError ? error : null}
            onRetry={() => void refetch()}
            onResetFilters={() =>
              setFilters({ keyword: "", department: "all", workStatus: "all", contractType: "all" })
            }
            onEdit={handleOpenEdit}
            onCreate={handleOpenCreate}
            onToggleStatus={(rec) => void toggleAccountStatus(rec)}
            canCreate={canCreate}
            canUpdate={canUpdate}
          />

          {/* Popup Modal Thêm/Sửa HRM-01 */}
          <EmployeeProfileModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            mode={modalMode}
            initialRecord={editingRecord}
            existingProfiles={records}
            departments={departments}
            onSaved={() => void refetch({ silent: true })}
          />
        </div>
      )}

      {/* --- TAB 2: HRM-02 - ĐÀO TẠO, NÂNG LƯƠNG, ĐÁNH GIÁ, KHEN THƯỞNG / KỶ LUẬT --- */}
      {activeSubTab === "development" && (
        <div className="animate-in fade-in-50 duration-200">
          <HrmDevelopmentPage />
        </div>
      )}

      {/* --- TAB 3: HRM-03 - QUẢN LÝ NGHỈ PHÉP QUA WORKFLOW --- */}
      {activeSubTab === "leave" && (
        <div className="animate-in fade-in-50 duration-200">
          <HrmLeavePage />
        </div>
      )}
    </div>
  )
}
