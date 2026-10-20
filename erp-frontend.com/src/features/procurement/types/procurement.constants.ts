import type {
  ContractStatus,
  PurchaseRequestStatus,
  SupplierStatus,
} from "./procurement.types"

export const PURCHASE_REQUEST_STATUS_CONFIG: Record<
  PurchaseRequestStatus,
  { label: string; badgeClass: string; stepNumber: number }
> = {
  draft: {
    label: "Bản nháp",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/40 dark:text-slate-300",
    stepNumber: 0,
  },
  pending_dept: {
    label: "Chờ Trưởng đơn vị",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
    stepNumber: 1,
  },
  pending_planning: {
    label: "Chờ Kế hoạch/Dự toán",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
    stepNumber: 2,
  },
  pending_leader: {
    label: "Chờ Lãnh đạo duyệt",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300",
    stepNumber: 3,
  },
  approved: {
    label: "Đã phê duyệt",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
    stepNumber: 4,
  },
  ordered: {
    label: "Đã chuyển mua sắm",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300",
    stepNumber: 5,
  },
  revision_required: {
    label: "Yêu cầu bổ sung",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300",
    stepNumber: -1,
  },
  rejected: {
    label: "Từ chối duyệt",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
    stepNumber: -2,
  },
  cancelled: {
    label: "Đã hủy bỏ",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400",
    stepNumber: -3,
  },
}

export const SUPPLIER_STATUS_CONFIG: Record<
  SupplierStatus,
  { label: string; badgeClass: string }
> = {
  active: {
    label: "Đang hợp tác",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  paused: {
    label: "Tạm ngừng",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
  },
  terminated: {
    label: "Ngừng hợp tác",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
  },
  restricted: {
    label: "Hạn chế lựa chọn",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300",
  },
}

export const CONTRACT_STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; badgeClass: string }
> = {
  draft: {
    label: "Dự thảo",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
  pending_sign: {
    label: "Chờ ký",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-300",
  },
  active: {
    label: "Đang thực hiện",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-300",
  },
  completed: {
    label: "Hoàn thành",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
  liquidated: {
    label: "Thanh lý",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-300",
  },
  suspended: {
    label: "Tạm dừng",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-300",
  },
  overdue: {
    label: "Quá hạn giao",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-300",
  },
  cancelled: {
    label: "Đã hủy",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-300",
  },
}

export const PROCUREMENT_DEPARTMENTS = [
  "Đoàn Địa vật lý Máy bay",
  "Đoàn Địa vật lý Biển",
  "Đoàn Địa vật lý Mặt đất",
  "Trung tâm Phân tích & Xử lý Dữ liệu",
  "Phòng Kế hoạch - Kỹ thuật",
  "Phòng Tài chính - Kế toán",
  "Phòng Tổ chức - Hành chính",
]

export const BUDGET_SOURCES = [
  "Ngân sách Nhà nước giao nhiệm vụ 2026",
  "Kinh phí Đề án Bay đo Từ - Trọng lực Tây Bắc",
  "Kinh phí Khảo sát Địa chấn Nông biển Nam Trung Bộ",
  "Nguồn thu dịch vụ KHCN & Hợp đồng ngoài",
  "Quỹ phát triển hoạt động sự nghiệp",
]

export const SUPPLY_CATEGORIES = [
  "Thiết bị đo từ, trọng lực, điện chuyên dụng",
  "Cáp đo địa chấn, geophone & phụ kiện",
  "Vật tư tiêu hao, hóa chất dã ngoại",
  "Thiết bị định vị DGPS & máy thu vệ tinh",
  "Vật tư văn phòng, mực in bản đồ A0",
  "Phụ tùng trạm đo & pin lithium chuyên dụng",
  "Trang bị bảo hộ lao động dã ngoại thực địa",
]
