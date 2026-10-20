export type ErpNavigationIcon =
  | "dashboard"
  | "planning"
  | "engineering"
  | "finance"
  | "contracts"
  | "assets"
  | "people"
  | "inventory"
  | "documents"

export type ErpNavigationItem = {
  title: string
  url: string
  icon: ErpNavigationIcon
  description: string
  children?: ErpNavigationChild[]
}

export type ErpNavigationChild = {
  title: string
  url: string
  description: string
}

export const hrmNavigationItem: ErpNavigationItem = {
  title: "Quản lý nhân sự – tiền lương",
  url: "/nhan-su-tien-luong",
  icon: "people",
  description: "Quản lý hồ sơ nhân sự, tổ chức và tiền lương.",
  children: [
    {
      title: "Hồ sơ nhân sự",
      url: "/nhan-su-tien-luong/ho-so-nhan-su",
      description: "Quản lý thông tin và quá trình công tác của cán bộ.",
    },
    {
      title: "Tiền lương",
      url: "/nhan-su-tien-luong/tien-luong",
      description: "Quản lý dữ liệu tiền lương của cán bộ.",
    },
    {
      title: "Năng lực chuyên gia",
      url: "/nhan-su-tien-luong/nang-luc-chuyen-gia",
      description: "Quản lý và tra cứu hồ sơ năng lực chuyên gia.",
    },
    {
      title: "Phân bổ nhân lực",
      url: "/nhan-su-tien-luong/phan-bo-nhan-luc",
      description: "Theo dõi phân bổ và mức tải nguồn nhân lực.",
    },
  ],
}

export const docNavigationItem: ErpNavigationItem = {
  title: "Quản lý văn bản và hồ sơ",
  url: "/van-ban-ho-so-phe-duyet",
  icon: "documents",
  description: "Quản lý văn bản, hồ sơ và các bước trình duyệt nội bộ.",
  children: [
    {
      title: "Văn bản đến",
      url: "/van-ban-ho-so-phe-duyet/van-ban-den",
      description: "Danh sách và tiếp nhận văn bản đến.",
    },
    {
      title: "Văn bản đi",
      url: "/van-ban-ho-so-phe-duyet/van-ban-di",
      description: "Danh sách tạo, trình ký và phát hành văn bản đi.",
    },
    {
      title: "Quản lý hồ sơ",
      url: "/van-ban-ho-so-phe-duyet/quan-ly-ho-so",
      description: "Quản lý danh sách, thông tin và tài liệu đính kèm của hồ sơ.",
    },
    {
      title: "Quy trình phê duyệt",
      url: "/van-ban-ho-so-phe-duyet/quy-trinh-phe-duyet",
      description: "Cấu hình và theo dõi sơ đồ luồng phê duyệt công việc.",
    },
    {
      title: "Việc cần xử lý",
      url: "/van-ban-ho-so-phe-duyet/viec-can-xu-ly",
      description: "Danh sách hồ sơ và công việc chờ xử lý theo vai trò.",
    },
    {
      title: "Nhật ký phê duyệt",
      url: "/van-ban-ho-so-phe-duyet/nhat-ky-phe-duyet",
      description: "Lịch sử và nhật ký hoạt động phê duyệt chi tiết.",
    },
    {
      title: "Theo dõi SLA",
      url: "/van-ban-ho-so-phe-duyet/theo-doi-sla",
      description: "Thống kê thời gian xử lý và tình trạng tiến độ SLA.",
    },
    {
      title: "Tra cứu văn bản, hồ sơ",
      url: "/van-ban-ho-so-phe-duyet/tra-cuu",
      description: "Tìm kiếm và tra cứu chi tiết văn bản, hồ sơ.",
    },
  ],
}

export const procurementNavigationItem: ErpNavigationItem = {
  title: "Quản lý mua sắm – vật tư – kho",
  url: "/mua-sam-vat-tu-kho",
  icon: "inventory",
  description: "Theo dõi mua sắm, vật tư và tình trạng nhập xuất kho.",
  children: [
    {
      title: "Mua sắm",
      url: "/mua-sam-vat-tu-kho/mua-sam",
      description: "Đề xuất mua sắm, kiểm tra kế hoạch dự toán, quản lý nhà cung cấp và hợp đồng.",
    },
    {
      title: "Kho vật tư",
      url: "/mua-sam-vat-tu-kho/kho-vat-tu",
      description: "Nhập xuất kho theo nhiệm vụ/hạng mục, quản lý tồn định mức, điều chuyển và cảnh báo tồn.",
    },
    {
      title: "Quyết toán",
      url: "/mua-sam-vat-tu-kho/quyet-toan",
      description: "Tổng hợp và quyết toán vật tư đã sử dụng theo nhiệm vụ/dự án.",
    },
  ],
}

export const assetNavigationItem: ErpNavigationItem = {
  title: "Quản lý tài sản – máy móc – thiết bị địa vật lý",
  url: "/tai-san-thiet-bi",
  icon: "assets",
  description: "Theo dõi tài sản, máy móc và thiết bị chuyên ngành địa vật lý.",
  children: [
    {
      title: "Hồ sơ thiết bị",
      url: "/tai-san-thiet-bi/ho-so-thiet-bi",
      description: "Quản lý hồ sơ thiết bị, thông số kỹ thuật và mã QR Code (AST-01, AST-02).",
    },
    {
      title: "Hiệu chuẩn & Bảo dưỡng",
      url: "/tai-san-thiet-bi/kiem-dinh-bao-duong",
      description: "Quản lý hiệu chuẩn, kiểm định và sửa chữa bảo dưỡng (AST-03, AST-04).",
    },
    {
      title: "Điều động & Sử dụng",
      url: "/tai-san-thiet-bi/dieu-dong-su-dung",
      description: "Điều động thiết bị, kiểm tra xung đột lịch và theo dõi vị trí thực địa (AST-05, AST-06, AST-07, AST-08).",
    },
    {
      title: "Phân tích & Cảnh báo",
      url: "/tai-san-thiet-bi/phan-tich-canh-bao",
      description: "Cảnh báo hạn kiểm định, thiết bị ít sử dụng, KPI sẵn sàng và hỗ trợ quyết định (AST-09, AST-10, AST-11).",
    },
  ],
}

export const engineeringNavigationItem: ErpNavigationItem = {
  title: "Quản lý kỹ thuật, khối lượng và nghiệm thu",
  url: "/ky-thuat-nghiem-thu",
  icon: "engineering",
  description: "Quản lý hồ sơ kỹ thuật, khối lượng thực hiện và công tác nghiệm thu.",
  children: [
    {
      title: "Kế hoạch & Hạng mục",
      url: "/ky-thuat-nghiem-thu/ke-hoach-hang-muc",
      description: "Lập kế hoạch thi công, định mức, đơn giá và khu vực tọa độ (TEC-01, 02, 03).",
    },
    {
      title: "Nhật ký & Khối lượng",
      url: "/ky-thuat-nghiem-thu/nhat-ky-khoi-luong",
      description: "Nhật ký thi công hàng ngày và tổng hợp khối lượng thực hiện lũy kế (TEC-04, 05).",
    },
    {
      title: "Kiểm tra & Chất lượng",
      url: "/ky-thuat-nghiem-thu/kiem-tra-chat-luong",
      description: "Kiểm tra kỹ thuật, lưu vết sửa đổi (Audit Trail) và theo dõi chất lượng (TEC-06, 07).",
    },
    {
      title: "Nghiệm thu & Biên bản",
      url: "/ky-thuat-nghiem-thu/nghiem-thu-bien-ban",
      description: "Nghiệm thu nội bộ, cơ sở, biên bản kết quả và theo dõi khối lượng (TEC-08, 09, 10, 11).",
    },
  ],
}

export const erpNavigationItems: ErpNavigationItem[] = [
  {
    title: "Dashboard điều hành và BI",
    url: "/dashboard",
    icon: "dashboard",
    description: "Tổng hợp chỉ số và thông tin phục vụ công tác điều hành.",
  },
  {
    title: "Quản lý nhiệm vụ & đề án",
    url: "/ke-hoach-nhiem-vu-du-an",
    icon: "planning",
    description: "Theo dõi nhiệm vụ, đề án và kế hoạch của Liên đoàn.",
    children: [
      { title: "Nhiệm vụ & công việc", url: "/ke-hoach-nhiem-vu-du-an/ho-so-nhiem-vu", description: "Hồ sơ, cấu trúc và Kanban trong cùng một không gian nhiệm vụ." },
      { title: "Kế hoạch", url: "/ke-hoach-nhiem-vu-du-an/ke-hoach", description: "Kế hoạch và điều chỉnh có phê duyệt." },
      { title: "Theo dõi tiến độ", url: "/ke-hoach-nhiem-vu-du-an/theo-doi-tien-do", description: "Tiến độ, cảnh báo và biện pháp xử lý." },
      { title: "Nguồn lực nhiệm vụ", url: "/ke-hoach-nhiem-vu-du-an/nguon-luc-nhiem-vu", description: "Phân bổ và kiểm tra nguồn lực." },
      { title: "So sánh đơn vị", url: "/ke-hoach-nhiem-vu-du-an/so-sanh-don-vi", description: "So sánh hiệu quả các đơn vị." },
    ],
  },
  engineeringNavigationItem,
  {
    title: "Quản lý tài chính – ngân sách – chi phí",
    url: "/tai-chinh-ngan-sach",
    icon: "finance",
    description: "Theo dõi ngân sách, nguồn kinh phí và chi phí thực hiện.",
  },
  {
    title: "Quản lý hợp đồng và dịch vụ",
    url: "/hop-dong-dich-vu",
    icon: "contracts",
    description: "Quản lý hợp đồng, tiến độ thực hiện và các dịch vụ liên quan.",
  },
  assetNavigationItem,
  hrmNavigationItem,
  procurementNavigationItem,
  docNavigationItem,
  {
    title: "Quản lý mua sắm – vật tư – kho",
    url: "/mua-sam-vat-tu-kho",
    icon: "inventory",
    description: "Theo dõi mua sắm, vật tư và tình trạng nhập xuất kho.",
  },
  {
    title: "Quản lý văn bản – hồ sơ – quy trình phê duyệt",
    url: "/van-ban-ho-so-phe-duyet",
    icon: "documents",
    description: "Quản lý văn bản, hồ sơ và các bước trình duyệt nội bộ.",
  },
  {
    title: "Quản trị truy cập",
    url: "/access-management",
    icon: "people",
    description: "Quản lý phòng ban, vai trò và phân quyền.",
  },
]

export const erpModuleItems = erpNavigationItems.filter(
  (item) => item.url !== "/dashboard" && item.url !== "/access-management" && !item.children?.length,
)

export const assetNavigationChildren = assetNavigationItem.children ?? []
export const engineeringNavigationChildren = engineeringNavigationItem.children ?? []
export const hrmNavigationChildren = hrmNavigationItem.children ?? []
export const procurementNavigationChildren = procurementNavigationItem.children ?? []
export const docNavigationChildren = docNavigationItem.children ?? []

export function isNavigationItemActive(item: ErpNavigationItem, pathname: string) {
  if (pathname === item.url) return true
  return Boolean(item.children?.length && pathname.startsWith(`${item.url}/`))
}
