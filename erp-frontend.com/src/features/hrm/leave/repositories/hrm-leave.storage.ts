import type {
  LeaveBalance,
  LeaveRequestRecord,
  LeaveStatus,
  LeaveWorkflowHistory,
} from "../types/hrm-leave.types.ts"

const STORAGE_KEY_REQUESTS = "hrm_leave_requests_db_v1"
const STORAGE_KEY_BALANCES = "hrm_leave_balances_db_v1"

const INITIAL_REQUESTS: LeaveRequestRecord[] = [
  {
    id: "NP-2026-0001",
    userId: "user-1",
    employeeCode: "CB-0001",
    fullName: "Vũ Đình Nam",
    department: "Phòng Kỹ thuật Địa vật lý",
    position: "Kỹ sư địa chất chính",
    leaveType: "annual",
    startDate: "2026-03-10",
    endDate: "2026-03-12",
    startSession: "full",
    endSession: "full",
    totalDays: 3,
    reason: "Giải quyết việc cá nhân gia đình sau đợt công tác thực địa dài ngày",
    handoverUserId: "user-2",
    handoverUserName: "Nguyễn Văn Tuấn",
    contactPhone: "0912 345 678",
    status: "approved",
    workflow: [
      {
        id: "wf-1",
        action: "submit",
        actorId: "user-1",
        actorName: "Vũ Đình Nam",
        actorRole: "Cán bộ",
        timestamp: "2026-03-05T08:30:00Z",
        comment: "Kính gửi Trưởng phòng xem xét duyệt nghỉ phép",
      },
      {
        id: "wf-2",
        action: "approve",
        actorId: "user-lead-1",
        actorName: "Trưởng phòng Kỹ thuật",
        actorRole: "Trưởng đơn vị",
        timestamp: "2026-03-05T14:20:00Z",
        comment: "Đồng ý cho đồng chí Nam nghỉ phép theo kế hoạch.",
      },
    ],
    createdAt: "2026-03-05T08:30:00Z",
    updatedAt: "2026-03-05T14:20:00Z",
  },
  {
    id: "NP-2026-0002",
    userId: "user-2",
    employeeCode: "CB-0002",
    fullName: "Nguyễn Văn Tuấn",
    department: "Phòng Kỹ thuật Địa vật lý",
    position: "Kỹ sư địa chất",
    leaveType: "annual",
    startDate: "2026-04-15",
    endDate: "2026-04-16",
    startSession: "full",
    endSession: "full",
    totalDays: 2,
    reason: "Nghỉ phép năm đưa gia đình về quê có việc họ",
    handoverUserId: "user-1",
    handoverUserName: "Vũ Đình Nam",
    contactPhone: "0988 765 432",
    status: "pending",
    workflow: [
      {
        id: "wf-3",
        action: "submit",
        actorId: "user-2",
        actorName: "Nguyễn Văn Tuấn",
        actorRole: "Cán bộ",
        timestamp: "2026-04-10T09:00:00Z",
        comment: "Kính đề nghị Trưởng phòng phê duyệt đơn nghỉ phép",
      },
    ],
    createdAt: "2026-04-10T09:00:00Z",
    updatedAt: "2026-04-10T09:00:00Z",
  },
  {
    id: "NP-2026-0003",
    userId: "user-3",
    employeeCode: "CB-0003",
    fullName: "Trần Thị Mai",
    department: "Phòng Kế hoạch - Tài chính",
    position: "Kế toán viên",
    leaveType: "sick",
    startDate: "2026-04-08",
    endDate: "2026-04-09",
    startSession: "full",
    endSession: "full",
    totalDays: 2,
    reason: "Nghỉ điều trị ngoại trú theo chỉ định của Bệnh viện E (có giấy ra viện nộp kèm)",
    handoverUserId: "user-1",
    handoverUserName: "Vũ Đình Nam",
    contactPhone: "0904 123 789",
    status: "approved",
    workflow: [
      {
        id: "wf-4",
        action: "submit",
        actorId: "user-3",
        actorName: "Trần Thị Mai",
        actorRole: "Cán bộ",
        timestamp: "2026-04-07T16:00:00Z",
      },
      {
        id: "wf-5",
        action: "approve",
        actorId: "user-lead-2",
        actorName: "Trưởng phòng KHTC",
        actorRole: "Trưởng đơn vị",
        timestamp: "2026-04-08T07:45:00Z",
        comment: "Duyệt nghỉ chế độ ốm đau BHXH.",
      },
    ],
    createdAt: "2026-04-07T16:00:00Z",
    updatedAt: "2026-04-08T07:45:00Z",
  },
]

export class HrmLeaveRepository {
  // Lấy toàn bộ danh sách đơn
  getLeaveRequests(): LeaveRequestRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REQUESTS)
      if (!raw) {
        this.saveAllRequests(INITIAL_REQUESTS)
        return INITIAL_REQUESTS
      }
      return JSON.parse(raw) as LeaveRequestRecord[]
    } catch {
      return INITIAL_REQUESTS
    }
  }

  // Lấy danh sách đơn của 1 cán bộ
  getLeaveRequestsByUserId(userId: string): LeaveRequestRecord[] {
    const list = this.getLeaveRequests()
    return list.filter((x) => x.userId === userId)
  }

  // Lưu hoặc cập nhật đơn
  saveLeaveRequest(record: LeaveRequestRecord): void {
    const list = this.getLeaveRequests()
    const index = list.findIndex((x) => x.id === record.id)
    if (index >= 0) {
      list[index] = record
    } else {
      list.unshift(record)
    }
    this.saveAllRequests(list)
  }

  // Cập nhật trạng thái workflow (Duyệt / Từ chối / Hủy)
  updateLeaveStatus(
    id: string,
    nextStatus: LeaveStatus,
    actor: { id: string; name: string; role: string },
    comment?: string,
  ): LeaveRequestRecord | null {
    const list = this.getLeaveRequests()
    const record = list.find((x) => x.id === id)
    if (!record) return null

    record.status = nextStatus
    record.updatedAt = new Date().toISOString()

    const historyItem: LeaveWorkflowHistory = {
      id: `wf-${Date.now()}`,
      action:
        nextStatus === "approved"
          ? "approve"
          : nextStatus === "rejected"
          ? "reject"
          : nextStatus === "cancelled"
          ? "cancel"
          : "submit",
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: new Date().toISOString(),
      comment: comment?.trim() || undefined,
    }

    record.workflow.push(historyItem)
    this.saveAllRequests(list)
    return record
  }

  // Tính hạn mức ngày phép của cán bộ
  getLeaveBalance(userId: string, year: number = new Date().getFullYear()): LeaveBalance {
    const userRequests = this.getLeaveRequests().filter(
      (x) => x.userId === userId && x.leaveType === "annual" && new Date(x.startDate).getFullYear() === year,
    )

    const usedDays = userRequests
      .filter((x) => x.status === "approved")
      .reduce((sum, item) => sum + item.totalDays, 0)

    const pendingDays = userRequests
      .filter((x) => x.status === "pending")
      .reduce((sum, item) => sum + item.totalDays, 0)

    // Quy định phép năm cơ bản của nhà nước: 12 ngày + 2 ngày thâm niên ngành địa chất
    const totalAnnualLeave = 14
    const remainingDays = Math.max(0, totalAnnualLeave - usedDays - pendingDays)

    return {
      userId,
      employeeCode: userRequests[0]?.employeeCode || "CB-0001",
      fullName: userRequests[0]?.fullName || "Cán bộ",
      year,
      totalAnnualLeave,
      usedDays,
      pendingDays,
      remainingDays,
    }
  }

  private saveAllRequests(list: LeaveRequestRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(list))
    } catch (e) {
      console.error("Failed to save leave requests", e)
    }
  }
}

export const defaultHrmLeaveRepository = new HrmLeaveRepository()
