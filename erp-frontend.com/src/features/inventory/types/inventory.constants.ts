import type {
  AlertSeverity,
  GoodsIssueStatus,
  GoodsReceiptStatus,
  InventoryTransactionType,
  StockAlertType,
  StockTransferStatus,
} from "./inventory.types"

export const GOODS_RECEIPT_STATUS_CONFIG: Record<
  GoodsReceiptStatus,
  { label: string; badgeClass: string }
> = {
  draft: {
    label: "Bản nháp",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/40 dark:text-slate-300",
  },
  pending_post: {
    label: "Chờ xác nhận nhập",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
  },
  posted: {
    label: "Đã nhập kho",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  rejected: {
    label: "Từ chối nhập",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
  },
  cancelled: {
    label: "Đã hủy",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400",
  },
}

export const GOODS_ISSUE_STATUS_CONFIG: Record<
  GoodsIssueStatus,
  { label: string; badgeClass: string }
> = {
  draft: {
    label: "Bản nháp",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
  pending_approval: {
    label: "Chờ duyệt xuất",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-300",
  },
  approved: {
    label: "Đã duyệt (Giữ chỗ)",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-300",
  },
  pending_issue: {
    label: "Chờ xuất kho",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-300",
  },
  issued: {
    label: "Đã xuất kho",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
  revision_required: {
    label: "Yêu cầu bổ sung",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-300",
  },
  rejected: {
    label: "Từ chối duyệt",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-300",
  },
  cancelled: {
    label: "Đã hủy",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-300",
  },
}

export const STOCK_TRANSFER_STATUS_CONFIG: Record<
  StockTransferStatus,
  { label: string; badgeClass: string }
> = {
  draft: {
    label: "Dự thảo",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
  pending_approval: {
    label: "Chờ phê duyệt",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-300",
  },
  approved: {
    label: "Đã duyệt điều chuyển",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-300",
  },
  in_transit: {
    label: "Đang vận chuyển",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-300",
  },
  pending_receive: {
    label: "Chờ nhận kho đích",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-300",
  },
  completed: {
    label: "Hoàn thành",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
  discrepancy: {
    label: "Có chênh lệch",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-300",
  },
  rejected: {
    label: "Từ chối",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-300",
  },
  cancelled: {
    label: "Đã hủy",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-300",
  },
}

export const TRANSACTION_TYPE_CONFIG: Record<
  InventoryTransactionType,
  { label: string; sign: "+" | "-"; colorClass: string }
> = {
  receipt: {
    label: "Nhập mua sắm",
    sign: "+",
    colorClass: "text-emerald-600",
  },
  issue: {
    label: "Xuất dùng nhiệm vụ",
    sign: "-",
    colorClass: "text-rose-600",
  },
  transfer_in: {
    label: "Nhập điều chuyển",
    sign: "+",
    colorClass: "text-blue-600",
  },
  transfer_out: {
    label: "Xuất điều chuyển",
    sign: "-",
    colorClass: "text-purple-600",
  },
  adjust_increase: {
    label: "Điều chỉnh tăng",
    sign: "+",
    colorClass: "text-teal-600",
  },
  adjust_decrease: {
    label: "Điều chỉnh giảm",
    sign: "-",
    colorClass: "text-amber-600",
  },
  return: {
    label: "Nhập hoàn trả",
    sign: "+",
    colorClass: "text-cyan-600",
  },
}

export const STOCK_ALERT_TYPE_CONFIG: Record<
  StockAlertType,
  { label: string; defaultSeverity: AlertSeverity }
> = {
  out_of_stock: {
    label: "Hết hàng tồn kho",
    defaultSeverity: "critical",
  },
  below_min: {
    label: "Dưới định mức tối thiểu",
    defaultSeverity: "warning",
  },
  above_max: {
    label: "Vượt định mức tối đa",
    defaultSeverity: "info",
  },
  expiring_soon: {
    label: "Lô sắp hết hạn (<30 ngày)",
    defaultSeverity: "warning",
  },
  expired: {
    label: "Lô đã quá hạn sử dụng",
    defaultSeverity: "critical",
  },
  locked_batch: {
    label: "Lô bị khóa nhưng còn tồn",
    defaultSeverity: "warning",
  },
  shortage: {
    label: "Nhu cầu vượt tồn khả dụng",
    defaultSeverity: "critical",
  },
}

export const ALERT_SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; badgeClass: string; iconColor: string }
> = {
  info: {
    label: "Thông tin",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
    iconColor: "text-blue-500",
  },
  warning: {
    label: "Cảnh báo",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
    iconColor: "text-amber-500",
  },
  critical: {
    label: "Nghiêm trọng",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
    iconColor: "text-rose-500",
  },
}

export const MATERIAL_CATEGORIES = [
  "Thiết bị đo từ, trọng lực, điện chuyên dụng",
  "Cáp đo địa chấn, geophone & phụ kiện",
  "Vật tư tiêu hao, hóa chất dã ngoại",
  "Thiết bị định vị DGPS & máy thu vệ tinh",
  "Pin lithium & nguồn năng lượng trạm đo",
  "Trang bị bảo hộ lao động thực địa",
  "Vật tư văn phòng, mực in bản đồ A0",
]

export const MATERIAL_UNITS = [
  "Bộ",
  "Cái",
  "Cuộn",
  "Chiếc",
  "Hộp",
  "Kg",
  "Lít",
  "Bình",
  "Mét",
  "Gói",
]

export const DEFAULT_WAREHOUSES = [
  {
    code: "KHO-TONG",
    name: "Kho Tổng Liên đoàn (Cầu Giấy)",
    managingDepartment: "Phòng Kế hoạch - Kỹ thuật",
    address: "Số 10 Nguyễn Phong Sắc, Cầu Giấy, Hà Nội",
    managerName: "Trần Văn Toàn (Thủ kho chính)",
    managerPhone: "0912.334.889",
  },
  {
    code: "KHO-MAY-BAY",
    name: "Kho Vật tư & Trạm đo Máy bay",
    managingDepartment: "Đoàn Địa vật lý Máy bay",
    address: "Sân bay Gia Lâm, Long Biên, Hà Nội",
    managerName: "Nguyễn Văn Đức",
    managerPhone: "0904.556.778",
  },
  {
    code: "KHO-BIEN",
    name: "Kho Thiết bị & Cáp đo Biển",
    managingDepartment: "Đoàn Địa vật lý Biển",
    address: "Cảng Đình Vũ, Hải Phòng",
    managerName: "Trần Hữu Kiên",
    managerPhone: "0983.112.445",
  },
  {
    code: "KHO-MAT-DAT",
    name: "Kho Vật tư Địa vật lý Mặt đất",
    managingDepartment: "Đoàn Địa vật lý Mặt đất",
    address: "Cụm Công nghiệp Phổ Yên, Thái Nguyên",
    managerName: "Hoàng Văn Thái",
    managerPhone: "0976.223.344",
  },
  {
    code: "KHO-TT-XULY",
    name: "Kho Lưu trữ & Thiết bị Trung tâm Dữ liệu",
    managingDepartment: "Trung tâm Phân tích & Xử lý Dữ liệu",
    address: "Tầng 3, Tòa nhà Liên đoàn, Hà Nội",
    managerName: "Vũ Hải Đăng",
    managerPhone: "0915.667.889",
  },
]
