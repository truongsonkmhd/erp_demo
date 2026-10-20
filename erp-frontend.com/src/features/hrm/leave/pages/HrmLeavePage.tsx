import React, { useCallback, useEffect, useState } from "react"
import { Calendar, CheckCircle2, Clock, FileCheck2, Plus, RefreshCw, UserCheck, Users } from "lucide-react"

import { BoatLoading } from "@/components/ui/boat-loading"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/services/auth/AuthContext"
import { getDepartments, type Department } from "@/services/DepartmentService"
import { getEmployees, type EmployeeAccount } from "@/services/EmployeeService"
import { defaultHrmLeaveRepository } from "../repositories/hrm-leave.storage.ts"
import { MyLeaveRequestsTab } from "../components/MyLeaveRequestsTab"
import { ApprovalLeaveTab } from "../components/ApprovalLeaveTab"
import type { LeaveBalance, LeaveRequestRecord } from "../types/hrm-leave.types.ts"

export default function HrmLeavePage() {
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<"my_requests" | "approval">("my_requests")
  const [employees, setEmployees] = useState<EmployeeAccount[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  const [allRequests, setAllRequests] = useState<LeaveRequestRecord[]>([])
  const [myRequests, setMyRequests] = useState<LeaveRequestRecord[]>([])
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    userId: currentUser?.id || "user-1",
    employeeCode: "CB-0001",
    fullName: currentUser?.name || "Vũ Đình Nam",
    year: new Date().getFullYear(),
    totalAnnualLeave: 14,
    usedDays: 3,
    pendingDays: 0,
    remainingDays: 11,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [emps, depts] = await Promise.all([
        getEmployees().catch(() => [] as EmployeeAccount[]),
        getDepartments().catch(() => [] as Department[]),
      ])
      setEmployees(emps)
      setDepartments(depts)

      const requests = defaultHrmLeaveRepository.getLeaveRequests()
      setAllRequests(requests)

      const currentUid = currentUser?.id || emps[0]?.id || "user-1"
      const myReqs = requests.filter((r) => r.userId === currentUid)
      setMyRequests(myReqs)

      const balance = defaultHrmLeaveRepository.getLeaveBalance(currentUid)
      setLeaveBalance(balance)
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleSaveRequest = (record: LeaveRequestRecord) => {
    defaultHrmLeaveRepository.saveLeaveRequest(record)
    void loadData()
  }

  const handleCancelRequest = (id: string) => {
    const actor = {
      id: currentUser?.id || "user-1",
      name: currentUser?.name || "Cán bộ",
      role: "Cán bộ",
    }
    defaultHrmLeaveRepository.updateLeaveStatus(id, "cancelled", actor, "Cán bộ chủ động hủy đơn")
    void loadData()
  }

  const handleApprove = (id: string, comment?: string) => {
    const actor = {
      id: currentUser?.id || "lead-1",
      name: currentUser?.name || "Trưởng đơn vị",
      role: "Trưởng đơn vị",
    }
    defaultHrmLeaveRepository.updateLeaveStatus(id, "approved", actor, comment)
    void loadData()
  }

  const handleReject = (id: string, reason: string) => {
    const actor = {
      id: currentUser?.id || "lead-1",
      name: currentUser?.name || "Trưởng đơn vị",
      role: "Trưởng đơn vị",
    }
    defaultHrmLeaveRepository.updateLeaveStatus(id, "rejected", actor, reason)
    void loadData()
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <BoatLoading />
      </div>
    )
  }

  const pendingCount = allRequests.filter((r) => r.status === "pending").length
  const approvedCount = allRequests.filter((r) => r.status === "approved").length

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Quản lý nghỉ phép qua Workflow
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
              HRM-03
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Đăng ký đơn xin nghỉ phép, theo dõi tiến trình phê duyệt nhiều cấp và quản trị quỹ phép năm.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadData()}
            className="h-8 text-xs gap-1.5"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Tải lại</span>
          </Button>
        </div>
      </div>

      {/* 2. Thẻ chỉ số tổng quan (ERP Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Hạn mức ngày phép còn lại */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Phép năm của bạn còn lại</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {leaveBalance.remainingDays} ngày
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* Đơn chờ phê duyệt */}
        <button
          type="button"
          onClick={() => setActiveTab("approval")}
          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card text-left transition-all hover:border-amber-500/50 shadow-2xs"
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Đơn chờ phê duyệt</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{pendingCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </button>

        {/* Đơn đã duyệt */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Đơn đã phê duyệt</span>
            <div className="text-2xl font-bold text-primary font-mono">{approvedCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Cán bộ đang nghỉ hôm nay */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Cán bộ đang nghỉ</span>
            <div className="text-2xl font-bold text-foreground font-mono">
              {allRequests.filter((r) => r.status === "approved").length}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Phân tách 2 góc nhìn vai trò (Sub-tabs) */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as typeof activeTab)}
        className="w-full space-y-4"
      >
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/40 grid grid-cols-2 max-w-md">
          <TabsTrigger value="my_requests" className="text-xs font-medium rounded-lg">
            Đơn của tôi ({myRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approval" className="text-xs font-medium rounded-lg relative">
            Phê duyệt nghỉ phép ({allRequests.length})
            {pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my_requests" className="focus-visible:outline-none">
          <MyLeaveRequestsTab
            records={myRequests}
            currentUserEmployee={employees.find((e) => e.id === (currentUser?.id || "user-1")) || employees[0]}
            employees={employees}
            leaveBalance={leaveBalance}
            onSaveRequest={handleSaveRequest}
            onCancelRequest={handleCancelRequest}
          />
        </TabsContent>

        <TabsContent value="approval" className="focus-visible:outline-none">
          <ApprovalLeaveTab
            records={allRequests}
            departments={departments}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
