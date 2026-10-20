import type { MaterialSettlementStatus } from "./settlement.types"

export const SETTLEMENT_STATUS_CONFIG: Record<
  MaterialSettlementStatus,
  { label: string; badgeClass: string; description: string }
> = {
  draft: {
    label: "Bản nháp",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
    description: "Hồ sơ mới lập, đang chờ đơn vị thi công rà soát",
  },
  unit_confirmed: {
    label: "Đơn vị xác nhận",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300",
    description: "Đơn vị chủ trì đã xác nhận khối lượng sử dụng và hoàn trả",
  },
  accounting_reviewed: {
    label: "Kế toán kiểm tra",
    badgeClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300",
    description: "Phòng Kế hoạch - Tài chính đã đối chiếu đơn giá và định mức",
  },
  pending_approval: {
    label: "Chờ lãnh đạo duyệt",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300",
    description: "Đang trình Lãnh đạo Liên đoàn phê duyệt quyết toán",
  },
  approved: {
    label: "Đã quyết toán",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300",
    description: "Hồ sơ đã được phê duyệt quyết toán chính thức và đóng kỳ",
  },
  revision_requested: {
    label: "Yêu cầu chỉnh sửa",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300",
    description: "Hồ sơ cần bổ sung chứng từ hoặc giải trình chênh lệch",
  },
  rejected: {
    label: "Từ chối",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300",
    description: "Hồ sơ không hợp lệ và bị từ chối phê duyệt",
  },
}

export const SETTLEMENT_TABS = [
  { id: "all", label: "Tất cả hồ sơ" },
  { id: "pending", label: "Chờ quyết toán" },
  { id: "processing", label: "Đang xử lý" },
  { id: "completed", label: "Đã quyết toán" },
] as const

export type SettlementTabId = (typeof SETTLEMENT_TABS)[number]["id"]

export const SETTLEMENT_STORAGE_KEYS = {
  SETTLEMENTS: "erp:inventory:material-settlements:v1",
  RETURNS: "erp:inventory:material-returns:v1",
} as const
