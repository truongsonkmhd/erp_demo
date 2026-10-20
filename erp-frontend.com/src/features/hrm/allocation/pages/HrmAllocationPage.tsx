import React, { useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  CalendarCheck,
  Compass,
  Gauge,
  Layers,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssignTaskModal } from "../components/AssignTaskModal"
import { CurrentAllocationTab } from "../components/CurrentAllocationTab"
import { ProjectLaborCostModal } from "../components/ProjectLaborCostModal"
import { TaskTimesheetTab } from "../components/TaskTimesheetTab"
import { TimesheetModal } from "../components/TimesheetModal"
import { WorkloadDetailModal } from "../components/WorkloadDetailModal"
import { WorkloadTrackingTab } from "../components/WorkloadTrackingTab"
import { defaultHrmAllocationRepository } from "../repositories/hrm-allocation.storage"
import type {
  EmployeeAssignmentRecord,
  EmployeeWorkloadSummary,
  TaskTimesheetRecord,
} from "../types/hrm-allocation.types"

export default function HrmAllocationPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "allocation"

  const [currentMonth, setCurrentMonth] = useState<number>(10)
  const [currentYear, setCurrentYear] = useState<number>(2026)

  const [assignments, setAssignments] = useState<EmployeeAssignmentRecord[]>(() =>
    defaultHrmAllocationRepository.getAllAssignments()
  )
  const [timesheets, setTimesheets] = useState<TaskTimesheetRecord[]>(() =>
    defaultHrmAllocationRepository.getAllTimesheets(currentMonth, currentYear)
  )

  // Modal states (100% Popup Modals ở giữa màn hình)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] =
    useState<EmployeeAssignmentRecord | null>(null)

  const [workloadModalOpen, setWorkloadModalOpen] = useState(false)
  const [selectedWorkloadSummary, setSelectedWorkloadSummary] =
    useState<EmployeeWorkloadSummary | null>(null)

  const [timesheetModalOpen, setTimesheetModalOpen] = useState(false)
  const [selectedTimesheet, setSelectedTimesheet] =
    useState<TaskTimesheetRecord | null>(null)

  const [projectLaborCostModalOpen, setProjectLaborCostModalOpen] = useState(false)

  const refreshData = () => {
    setAssignments(defaultHrmAllocationRepository.getAllAssignments())
    setTimesheets(defaultHrmAllocationRepository.getAllTimesheets(currentMonth, currentYear))
  }

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  const handleMonthChange = (m: number) => {
    setCurrentMonth(m)
    setTimesheets(defaultHrmAllocationRepository.getAllTimesheets(m, currentYear))
  }

  const handleYearChange = (y: number) => {
    setCurrentYear(y)
    setTimesheets(defaultHrmAllocationRepository.getAllTimesheets(currentMonth, y))
  }

  // Thao tác phân bổ cán bộ (HRM-08)
  const handleOpenCreateAssign = () => {
    setEditingAssignment(null)
    setAssignModalOpen(true)
  }

  const handleOpenEditAssign = (record: EmployeeAssignmentRecord) => {
    setEditingAssignment(record)
    setAssignModalOpen(true)
  }

  const handleDeleteAssign = (id: string) => {
    defaultHrmAllocationRepository.deleteAssignment(id)
    refreshData()
    toast.success("Đã xóa phân bổ nhân sự.")
  }

  // Thao tác mức tải (HRM-09)
  const handleOpenWorkloadDetail = (summary: EmployeeWorkloadSummary) => {
    setSelectedWorkloadSummary(summary)
    setWorkloadModalOpen(true)
  }

  // Thao tác chấm công (HRM-10)
  const handleOpenTimesheetModal = (record: TaskTimesheetRecord | null) => {
    setSelectedTimesheet(record)
    setTimesheetModalOpen(true)
  }

  const handleDeleteTimesheet = (id: string) => {
    defaultHrmAllocationRepository.deleteTimesheet(id)
    refreshData()
    toast.success("Đã xóa bản ghi chấm công.")
  }

  const workloadSummaries = defaultHrmAllocationRepository.getWorkloadSummaries()
  const departmentStats = defaultHrmAllocationRepository.getDepartmentWorkloadStats()

  return (
    <div className="flex-1 space-y-5 p-6 max-w-[1680px] mx-auto animate-in fade-in-50 duration-200">
      {/* 1. Header Trang & Sub-tabs Chuyển đổi */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Phân bổ nhân lực
            </h1>

          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Quản trị phân bổ hiện trường/văn phòng, theo dõi mức tải công việc và ghi nhận ngày công, chi phí nhân công đề án.
          </p>
        </div>

        {/* Thanh chuyển đổi phân hệ con (HRM-08, HRM-09, HRM-10) */}
        <div className="flex items-center">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="bg-muted/70 p-1 rounded-xl border border-border/50 grid grid-cols-3">
              <TabsTrigger
                value="allocation"
                className="text-xs font-medium gap-1.5 rounded-lg px-3"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Hiện trạng phân bổ</span>
              </TabsTrigger>
              <TabsTrigger
                value="workload"
                className="text-xs font-medium gap-1.5 rounded-lg px-3"
              >
                <Gauge className="h-3.5 w-3.5" />
                <span>Mức tải công việc</span>
              </TabsTrigger>
              <TabsTrigger
                value="timesheet"
                className="text-xs font-medium gap-1.5 rounded-lg px-3"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                <span>Ngày công & Chi phí</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 2. Nội dung theo Sub-tab */}
      {/* --- TAB 1: HRM-08 - HIỆN TRẠNG PHÂN BỔ ("AI ĐANG LÀM GÌ") --- */}
      {activeTab === "allocation" && (
        <div className="animate-in fade-in-50 duration-200">
          <CurrentAllocationTab
            assignments={assignments}
            onOpenCreate={handleOpenCreateAssign}
            onOpenEdit={handleOpenEditAssign}
            onDelete={handleDeleteAssign}
          />
        </div>
      )}

      {/* --- TAB 2: HRM-09 - THEO DÕI MỨC TẢI CÔNG VIỆC (WORKLOAD) --- */}
      {activeTab === "workload" && (
        <div className="animate-in fade-in-50 duration-200">
          <WorkloadTrackingTab
            workloadSummaries={workloadSummaries}
            departmentStats={departmentStats}
            onOpenWorkloadDetail={handleOpenWorkloadDetail}
          />
        </div>
      )}

      {/* --- TAB 3: HRM-10 - GHI NHẬN NGÀY CÔNG & CHI PHÍ THEO NHIỆM VỤ --- */}
      {activeTab === "timesheet" && (
        <div className="animate-in fade-in-50 duration-200">
          <TaskTimesheetTab
            timesheets={timesheets}
            month={currentMonth}
            year={currentYear}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            onOpenTimesheetModal={handleOpenTimesheetModal}
            onOpenProjectLaborCostModal={() => setProjectLaborCostModalOpen(true)}
            onDelete={handleDeleteTimesheet}
          />
        </div>
      )}

      {/* 3. CÁC POPUP MODALS MỞ Ở GIỮA MÀN HÌNH (DIALOG) */}
      <AssignTaskModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        initialRecord={editingAssignment}
        onSaved={refreshData}
      />

      <WorkloadDetailModal
        open={workloadModalOpen}
        onOpenChange={setWorkloadModalOpen}
        summary={selectedWorkloadSummary}
      />

      <TimesheetModal
        open={timesheetModalOpen}
        onOpenChange={setTimesheetModalOpen}
        initialRecord={selectedTimesheet}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onSaved={refreshData}
      />

      <ProjectLaborCostModal
        open={projectLaborCostModalOpen}
        onOpenChange={setProjectLaborCostModalOpen}
        timesheets={timesheets}
        month={currentMonth}
        year={currentYear}
      />
    </div>
  )
}
