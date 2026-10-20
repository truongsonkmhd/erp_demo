import { RoleDefinition, RoleLevel, RolePermission } from "@/types/auth"

export function isAdminRole(role?: { code?: string } | string | null) {
  if (!role) return false
  const code = typeof role === "string" ? role : role.code
  return (code || "").trim().toLowerCase() === "admin"
}

export function isSaleRole(role?: { code?: string } | string | null) {
  if (!role) return false
  const code = typeof role === "string" ? role : role.code
  return (code || "").trim().toLowerCase() === "sale"
}

const ROLES_WITHOUT_LEVELS = new Set(["admin", "warehouse", "accounting"])

export function isRoleWithoutLevels(role?: { code?: string } | string | null) {
  if (!role) return false
  const code = typeof role === "string" ? role : role.code
  return ROLES_WITHOUT_LEVELS.has((code || "").trim().toLowerCase())
}

export const FIXED_ROLE_LEVELS: RoleLevel[] = [
  { id: "executive", name: "Executive", seat: "n", description: "Cấp Executive", permissionIds: [] },
  { id: "senior", name: "Senior", seat: "n", description: "Cấp Senior", permissionIds: [] },
  { id: "manager", name: "Manager", seat: "n", description: "Cấp Manager", permissionIds: [] },
  { id: "director", name: "Director", seat: "1", description: "Cấp Director", permissionIds: [] },
]

export const ROLE_DEFINITIONS: Omit<RoleDefinition, "id">[] = [
  {
    code: "admin",
    name: "Admin",
    summary: "Tạo tài khoản nhân viên, cấp/chỉnh quyền và xem toàn bộ chức năng.",
    levels: FIXED_ROLE_LEVELS,
    permissions: [
      { id: "create_account", label: "Tạo tài khoản nhân viên" },
      { id: "grant_role", label: "Cấp và chỉnh quyền nhân viên" },
      { id: "view_all", label: "Xem tất cả chức năng" },
    ],
  },
  {
    code: "sale",
    name: "Sale",
    summary: "Nhiều cấp bậc. Import/export, báo cáo và KPI tính lương thưởng.",
    levels: FIXED_ROLE_LEVELS,
    permissions: [
      { id: "import_export", label: "Import / export dữ liệu" },
      { id: "report", label: "Báo cáo" },
    ],
  },
  {
    code: "marketing",
    name: "Marketing",
    summary: "Xem data chảy về, thao tác trên dữ liệu <1000. Manager / Leader Sale phân việc.",
    levels: FIXED_ROLE_LEVELS,
    permissions: [
      { id: "view_inbound_data", label: "Xem data chảy về như nào" },
      { id: "operate_under_1000", label: "Thao tác dữ liệu < 1000 (nhập tay hoặc Excel)" },
    ],
  },
  {
    code: "cskh",
    name: "Chăm sóc khách hàng",
    summary: "1 khách hàng có nhiều đơn. Được chia khách bởi Manager/Leader Sale và Director CSKH.",
    levels: FIXED_ROLE_LEVELS,
    permissions: [
      { id: "one_customer_many_orders", label: "1 khách hàng → nhiều đơn hàng" },
      { id: "receive_customers", label: "Nhận khách từ Manager/Leader Sale và Director CSKH" },
      { id: "create_order", label: "Lên đơn" },
      { id: "quote_template", label: "Template → báo giá" },
      { id: "kpi_reorder", label: "KPI → tỉ lệ tái đặt hàng" },
    ],
  },
  {
    code: "warehouse",
    name: "Kho vận",
    summary: "Theo dõi hành trình đơn hàng theo mã lô hàng và xem toàn bộ trạng thái vận chuyển. Không phân cấp bậc.",
    levels: [],
    permissions: [
      { id: "track_by_batch", label: "Theo dõi hành trình đơn hàng qua mã lô hàng" },
      { id: "view_all_shipment", label: "Xem được hết trạng thái vận chuyển" },
    ],
  },
  {
    code: "accounting",
    name: "Kế toán",
    summary: "Nắm thanh toán, dữ liệu tài chính, doanh số, lợi nhuận. Không phân cấp bậc.",
    levels: [],
    permissions: [
      { id: "payment", label: "Nắm thanh toán" },
      { id: "finance_data", label: "Nắm dữ liệu tài chính" },
      { id: "revenue", label: "Nắm doanh số" },
      { id: "profit", label: "Nắm lợi nhuận" },
    ],
  },
]

export const AVAILABLE_PERMISSIONS = Array.from(
  new Map(
    ROLE_DEFINITIONS.flatMap((role) => role.permissions).map((permission) => [permission.id, permission])
  ).values()
)

export const IMPORT_UNDER_1000 = {
  title: "Import dữ liệu < 1000",
  methods: [
    { id: "manual", name: "Nhập tay từng trường", description: "Nhân viên điền từng ô trên form khi số lượng nhỏ." },
    { id: "excel", name: "Nhập file Excel", description: "Tải file mẫu, điền hàng loạt rồi import vào hệ thống." },
  ],
}

export function getPermissionLabel(id: string, fallback?: RolePermission[]) {
  return AVAILABLE_PERMISSIONS.find((item) => item.id === id)?.label
    || fallback?.find((item) => item.id === id)?.label
    || id
}

export function slugifyRoleCode(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || `role_${Date.now()}`
}
