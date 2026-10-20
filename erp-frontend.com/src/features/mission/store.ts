import { useSyncExternalStore } from "react"

export type MissionKind = "state" | "public" | "service"
export type MissionStatus = "draft" | "in_progress" | "suspended" | "completed" | "settled" | "cancelled"
export type NodeKind = "project" | "item" | "work" | "volume"

export type ClassificationAudit = {
  id: string
  fromKind: MissionKind
  toKind: MissionKind
  reason: string
  changedBy: string
  changedAt: string
}

export type Mission = {
  id: string
  code: string
  name: string
  decisionNumber?: string
  target?: string
  kind: MissionKind
  fundingSource: string
  budget: number
  startDate: string
  endDate: string
  owner: string
  department: string
  acceptance: string
  revenue: number
  settlement: number
  status?: MissionStatus
  cancelReason?: string
  classificationHistory?: ClassificationAudit[]
}

export type WorkflowStatus = "new" | "in_progress" | "review" | "completed"

export type WorkNode = {
  id: string
  missionId: string
  parentId: string | null
  kind: NodeKind
  wbsCode?: string
  name: string
  quantity: number
  unit: string
  unitPrice?: number
  requiredSkill: string
  department: string
  assignee: string
  cost: number
  revenue: number
  fundingSource: string
  dueDate: string
  workflowStatus?: WorkflowStatus
  rank?: number
}

export type ResponsibilityLevel =
  | "director"          // Lãnh đạo phụ trách
  | "managing_dept"      // Phòng quản lý
  | "executing_unit"    // Đơn vị thực hiện
  | "lead_investigator" // Chủ nhiệm nhiệm vụ
  | "field_officer"     // Cán bộ / Kỹ thuật viên phụ trách

export type ResponsibilityAssignment = {
  id: string
  missionId: string
  nodeId?: string | null
  level: ResponsibilityLevel
  officerName: string
  officerRole: string
  unitName: string
  fromDate: string
  toDate?: string | null
  status: "active" | "transferred" | "expired"
  notes?: string
}

export type Plan = {
  id: string
  missionId: string
  nodeId: string
  year: number
  quarter: number
  month: number
  department: string
  quantity: number
  cost: number
  days: number
  status: "draft" | "pending" | "approved" | "rejected" | "superseded"
  version: number
  reason: string
}

export type Progress = {
  id: string
  missionId: string
  nodeId: string
  date: string
  quantity: number
  cost: number
  disbursement: number
  reason: string
  remedy: string
}

export type Resource = {
  id: string
  missionId: string
  nodeId: string
  type: "person" | "expert" | "equipment" | "material"
  name: string
  skill: string
  quantity: number
  department: string
}

export type Audit = {
  id: string
  planId: string
  action: string
  actor: string
  at: string
  before: string
  after: string
}

export type MissionData = {
  missions: Mission[]
  nodes: WorkNode[]
  plans: Plan[]
  progress: Progress[]
  resources: Resource[]
  audits: Audit[]
  responsibilities: ResponsibilityAssignment[]
}

const KEY = "erp_mission_v4"
export const uid = () => crypto.randomUUID()

export const KIND_LABELS: Record<MissionKind, { label: string; badge: string; desc: string }> = {
  state: {
    label: "Nhiệm vụ Nhà nước",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200",
    desc: "Ngân sách Nhà nước cấp, nghiệm thu theo quy chuẩn kỹ thuật quốc gia",
  },
  public: {
    label: "Dịch vụ sự nghiệp công",
    badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200",
    desc: "Nguồn kinh phí sự nghiệp công lập có định mức kinh tế kỹ thuật",
  },
  service: {
    label: "Dịch vụ áp dụng đơn giá / SXKD",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200",
    desc: "Hợp đồng dịch vụ kinh tế, áp dụng đơn giá thị trường, hạch toán doanh thu",
  },
}

export const STATUS_LABELS: Record<MissionStatus, { label: string; badge: string }> = {
  draft: { label: "Dự thảo", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  in_progress: { label: "Đang thực hiện", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  suspended: { label: "Tạm dừng", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  completed: { label: "Đã hoàn thành", badge: "bg-teal-100 text-teal-700 border-teal-200" },
  settled: { label: "Đã quyết toán", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Đã hủy / Đóng", badge: "bg-rose-100 text-rose-700 border-rose-200" },
}

export const LEVEL_LABELS: Record<ResponsibilityLevel, { label: string; order: number }> = {
  director: { label: "Lãnh đạo phụ trách", order: 1 },
  managing_dept: { label: "Phòng quản lý điều phối", order: 2 },
  executing_unit: { label: "Đơn vị chủ trì thực hiện", order: 3 },
  lead_investigator: { label: "Chủ nhiệm nhiệm vụ", order: 4 },
  field_officer: { label: "Cán bộ / Kỹ thuật viên chính", order: 5 },
}

export const NODE_KIND_LABELS: Record<NodeKind, { label: string; level: number }> = {
  project: { label: "Dự án thành phần", level: 1 },
  item: { label: "Hạng mục công trình", level: 2 },
  work: { label: "Công việc thực hiện", level: 3 },
  volume: { label: "Khối lượng kỹ thuật", level: 4 },
}

export const WORKFLOW_STATUS_CONFIG: Record<
  WorkflowStatus,
  { label: string; badge: string; border: string; bg: string; dot: string; desc: string }
> = {
  new: {
    label: "Mới tiếp nhận",
    badge: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-800",
    bg: "bg-slate-50/60 dark:bg-slate-950/40",
    dot: "bg-slate-500",
    desc: "Đầu việc mới được giao, chuẩn bị triển khai",
  },
  in_progress: {
    label: "Đang thực hiện",
    badge: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-900",
    bg: "bg-blue-50/40 dark:bg-blue-950/20",
    dot: "bg-blue-500",
    desc: "Đang thi công khảo sát thực địa hoặc xử lý nội nghiệp",
  },
  review: {
    label: "Chờ nghiệm thu",
    badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-900",
    bg: "bg-amber-50/40 dark:bg-amber-950/20",
    dot: "bg-amber-500",
    desc: "Đã hoàn thành thi công, đang trình hồ sơ kỹ thuật nghiệm thu",
  },
  completed: {
    label: "Đã hoàn thành",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-900",
    bg: "bg-emerald-50/40 dark:bg-emerald-950/20",
    dot: "bg-emerald-500",
    desc: "Đã được nghiệm thu và xác nhận khối lượng đạt chuẩn",
  },
}

export const initialSeedData: MissionData = {
  missions: [
    {
      id: "m-01",
      code: "NV-TB-2026-01",
      name: "Bay đo từ - trọng lực tỷ lệ 1:50.000 dải ven biển và hải đảo Tây Bắc",
      decisionNumber: "142/QĐ-BTNMT ngày 15/01/2026",
      target: "Lập bản đồ dị thường từ toàn phần và dị thường trọng lực phục vụ điều tra tai biến địa chất biển",
      kind: "state",
      fundingSource: "Ngân sách Nhà nước (Sự nghiệp kinh tế địa chất)",
      budget: 8500000000,
      revenue: 0,
      settlement: 0,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      owner: "TS. Nguyễn Văn Tuấn",
      department: "Đoàn Địa vật lý Máy bay & Biển",
      acceptance: "Đang thực hiện",
      status: "in_progress",
      classificationHistory: [],
    },
    {
      id: "m-02",
      code: "NV-SN-2026-04",
      name: "Quan trắc địa vật lý và đánh giá xâm nhập mặn tầng chứa nước ven biển Nam Trung Bộ",
      decisionNumber: "88/QĐ-LĐĐVL ngày 10/02/2026",
      target: "Theo dõi ranh mặn - nhạt và lập bản đồ phân bố điện trở suất biểu kiến các tầng ngậm nước",
      kind: "public",
      fundingSource: "Quỹ Dịch vụ sự nghiệp công lập",
      budget: 3200000000,
      revenue: 3200000000,
      settlement: 1100000000,
      startDate: "2026-02-01",
      endDate: "2026-11-30",
      owner: "ThS. Phạm Thanh Sơn",
      department: "Đoàn Địa vật lý 59",
      acceptance: "Chưa nghiệm thu",
      status: "in_progress",
      classificationHistory: [],
    },
    {
      id: "m-03",
      code: "HĐ-DV-2026-12",
      name: "Khảo sát địa chấn phản xạ nông phục vụ thiết kế hầm ngầm tuyến metro đô thị",
      decisionNumber: "HĐ số 45/2026/HĐKT-ĐVL",
      target: "Xác định ranh giới đứt gãy, tầng đá gốc và đới phong hóa nứt nẻ sâu đến 80m",
      kind: "service",
      fundingSource: "Vốn doanh nghiệp đối ứng (Hợp đồng dịch vụ)",
      budget: 5600000000,
      revenue: 5600000000,
      settlement: 0,
      startDate: "2026-03-01",
      endDate: "2026-09-30",
      owner: "ThS. Đỗ Văn Nam",
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      acceptance: "Đang nghiệm thu",
      status: "in_progress",
      classificationHistory: [],
    },
    {
      id: "m-04",
      code: "NV-TN-2026-08",
      name: "Thăm dò phóng xạ và đo sâu từ tellur (MT) cấu trúc sâu bể trầm tích Tây Nguyên",
      decisionNumber: "219/QĐ-BTNMT ngày 05/01/2026",
      target: "Khoanh định dị thường phóng xạ và cấu trúc móng kết tinh sâu đến 5km phục vụ điều tra tài nguyên",
      kind: "state",
      fundingSource: "Ngân sách Nhà nước (Sự nghiệp kinh tế địa chất)",
      budget: 6800000000,
      revenue: 0,
      settlement: 0,
      startDate: "2026-01-15",
      endDate: "2026-12-25",
      owner: "PGS.TS. Trần Đình Hải",
      department: "Đoàn Địa vật lý Bắc Bộ",
      acceptance: "Đang thực hiện",
      status: "in_progress",
      classificationHistory: [],
    },
    {
      id: "m-05",
      code: "HĐ-KT-2026-19",
      name: "Đo vẽ mặt cắt phân cực kích thích (IP/Resistivity) tìm kiếm quặng ẩn sâu mỏ Bồng Miêu",
      decisionNumber: "HĐ số 82/2026/HĐKT-ĐVL",
      target: "Phát hiện các thể quặng sulfua chứa vàng ẩn sâu dưới tầng phủ bazan phong hóa",
      kind: "service",
      fundingSource: "Vốn góp doanh nghiệp khoáng sản",
      budget: 4100000000,
      revenue: 4100000000,
      settlement: 0,
      startDate: "2026-04-01",
      endDate: "2026-11-15",
      owner: "KS. Hoàng Văn Kiên",
      department: "Đoàn Địa vật lý 59",
      acceptance: "Đang thực hiện",
      status: "in_progress",
      classificationHistory: [],
    },
  ],
  nodes: [
    // ==========================================
    // NHIỆM VỤ 1 (m-01): Bay đo từ - trọng lực Tây Bắc
    // ==========================================
    {
      id: "node-1-p1",
      missionId: "m-01",
      parentId: null,
      kind: "project",
      wbsCode: "1",
      name: "Dự án TP 1: Khảo sát thực địa và bay đo tuyến cơ sở",
      quantity: 1,
      unit: "Dự án",
      unitPrice: 5200000000,
      cost: 5200000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Máy bay & Biển",
      assignee: "TS. Nguyễn Văn Tuấn",
      requiredSkill: "Khảo sát địa vật lý hàng không",
      dueDate: "2026-11-30",
    },
    {
      id: "node-1-i1",
      missionId: "m-01",
      parentId: "node-1-p1",
      kind: "item",
      wbsCode: "1.1",
      name: "Hạng mục: Bay đo từ hàng không lưới tuyến 500m",
      quantity: 1,
      unit: "Hạng mục",
      unitPrice: 3800000000,
      cost: 3800000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Máy bay & Biển",
      assignee: "ThS. Vũ Đức Minh",
      requiredSkill: "Bay đo từ phổ - từ trường",
      dueDate: "2026-11-15",
    },
    {
      id: "node-1-0-1",
      missionId: "m-01",
      parentId: "node-1-i1",
      kind: "work",
      wbsCode: "1.1.1",
      name: "Khảo sát tiền trạm, hiệu chuẩn máy đo từ kế tại sân bay căn cứ Cát Bi",
      quantity: 1,
      unit: "đợt hiệu chuẩn",
      unitPrice: 350000000,
      cost: 350000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Máy bay & Biển",
      assignee: "ThS. Vũ Đức Minh",
      requiredSkill: "Bay đo từ phổ - từ trường",
      dueDate: "2026-03-30",
      workflowStatus: "completed",
      rank: 0,
    },
    {
      id: "node-1-1-1",
      missionId: "m-01",
      parentId: "node-1-i1",
      kind: "work",
      wbsCode: "1.1.2",
      name: "Bay đo từ dải bay cao độ 150m (tổng chiều dài 2.400 km tuyến)",
      quantity: 2400,
      unit: "km tuyến",
      unitPrice: 1200000,
      cost: 2880000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Tổ bay đo chuyên đề 1",
      assignee: "KS. Bùi Văn Hùng",
      requiredSkill: "Kỹ thuật bay đo cảm biến từ Fluxgate",
      dueDate: "2026-11-15",
      workflowStatus: "in_progress",
      rank: 0,
    },
    {
      id: "node-1-1-1-v1",
      missionId: "m-01",
      parentId: "node-1-1-1",
      kind: "volume",
      wbsCode: "1.1.2.1",
      name: "Khối lượng xử lý hiệu chỉnh sai số biến thiên từ ngày đêm",
      quantity: 2400,
      unit: "km số liệu",
      unitPrice: 380000,
      cost: 912000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Phòng Xử lý số liệu Địa vật lý",
      assignee: "ThS. Hoàng Thị Mai",
      requiredSkill: "Xử lý phần mềm Oasis Montaj",
      dueDate: "2026-11-20",
    },
    {
      id: "node-1-1-2",
      missionId: "m-01",
      parentId: "node-1-i1",
      kind: "work",
      wbsCode: "1.1.3",
      name: "Xử lý sơ bộ số liệu từ hàng không và lọc nhiễu sóng ngắn dải bay",
      quantity: 2400,
      unit: "km số liệu",
      unitPrice: 380000,
      cost: 912000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Phòng Xử lý số liệu Địa vật lý",
      assignee: "ThS. Hoàng Thị Mai",
      requiredSkill: "Xử lý phần mềm Oasis Montaj",
      dueDate: "2026-10-15",
      workflowStatus: "review",
      rank: 0,
    },
    {
      id: "node-1-i2",
      missionId: "m-01",
      parentId: "node-1-p1",
      kind: "item",
      wbsCode: "1.2",
      name: "Hạng mục: Đo kiểm chứng trạm biến thiên mặt đất",
      quantity: 1,
      unit: "Hạng mục",
      unitPrice: 1400000000,
      cost: 1400000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Đỗ Quang Hải",
      requiredSkill: "Trắc địa và trạm từ biến thiên",
      dueDate: "2026-09-30",
    },
    {
      id: "node-1-2-1",
      missionId: "m-01",
      parentId: "node-1-i2",
      kind: "work",
      wbsCode: "1.2.1",
      name: "Đo kiểm chứng trạm biến thiên từ trường mặt đất tại 12 trạm cơ sở",
      quantity: 12,
      unit: "trạm kiểm chứng",
      unitPrice: 116666666,
      cost: 1400000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Đỗ Quang Hải",
      requiredSkill: "Trắc địa và trạm từ biến thiên",
      dueDate: "2026-09-30",
      workflowStatus: "in_progress",
      rank: 5,
    },
    {
      id: "node-1-p2",
      missionId: "m-01",
      parentId: null,
      kind: "project",
      wbsCode: "2",
      name: "Dự án TP 2: Phân tích tích hợp, lập bản đồ dị thường và mô hình hóa 3D",
      quantity: 1,
      unit: "Bộ báo cáo",
      unitPrice: 3300000000,
      cost: 3300000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Phòng Kỹ thuật - Công nghệ",
      assignee: "TS. Nguyễn Văn Tuấn",
      requiredSkill: "Phân tích địa chất - địa vật lý chuyên sâu",
      dueDate: "2026-12-31",
    },
    {
      id: "node-1-i3",
      missionId: "m-01",
      parentId: "node-1-p2",
      kind: "item",
      wbsCode: "2.1",
      name: "Hạng mục: Mô hình hóa mật độ trọng lực và cấu trúc đứt gãy",
      quantity: 1,
      unit: "Hạng mục",
      unitPrice: 820000000,
      cost: 820000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Phòng Xử lý số liệu Địa vật lý",
      assignee: "ThS. Hoàng Thị Mai",
      requiredSkill: "Xử lý phần mềm Oasis Montaj",
      dueDate: "2026-12-15",
    },
    {
      id: "node-1-3-1",
      missionId: "m-01",
      parentId: "node-1-i3",
      kind: "work",
      wbsCode: "2.1.1",
      name: "Lập mô hình mật độ trọng lực 3D đới đứt gãy đới ven bờ Tây Bắc",
      quantity: 1,
      unit: "bộ bản đồ số",
      unitPrice: 820000000,
      cost: 820000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Phòng Xử lý số liệu Địa vật lý",
      assignee: "ThS. Hoàng Thị Mai",
      requiredSkill: "Xử lý phần mềm Oasis Montaj",
      dueDate: "2026-12-15",
      workflowStatus: "new",
      rank: 3,
    },

    // ==========================================
    // NHIỆM VỤ 2 (m-02): Quan trắc xâm nhập mặn Nam Trung Bộ
    // ==========================================
    {
      id: "node-2-p1",
      missionId: "m-02",
      parentId: null,
      kind: "project",
      wbsCode: "1",
      name: "Dự án TP 1: Khảo sát địa chất thủy văn và quan trắc điện trở suất đa cực",
      quantity: 1,
      unit: "Dự án",
      unitPrice: 3200000000,
      cost: 3200000000,
      revenue: 3200000000,
      fundingSource: "Quỹ Dịch vụ sự nghiệp công lập",
      department: "Đoàn Địa vật lý 59",
      assignee: "ThS. Phạm Thanh Sơn",
      requiredSkill: "Khảo sát điện trở suất đa cực",
      dueDate: "2026-11-30",
    },
    {
      id: "node-2-i1",
      missionId: "m-02",
      parentId: "node-2-p1",
      kind: "item",
      wbsCode: "1.1",
      name: "Hạng mục: Quan trắc ranh mặn - nhạt và đo sâu điện trở tầng Pleistocen",
      quantity: 1,
      unit: "Hạng mục",
      unitPrice: 2025000000,
      cost: 2025000000,
      revenue: 2025000000,
      fundingSource: "Quỹ Dịch vụ sự nghiệp công lập",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Phạm Văn Cương",
      requiredSkill: "Khảo sát điện trở suất đa cực",
      dueDate: "2026-10-31",
    },
    {
      id: "node-2-0-1",
      missionId: "m-02",
      parentId: "node-2-i1",
      kind: "work",
      wbsCode: "1.1.1",
      name: "Thu thập mẫu nước ngầm đối chứng và hiệu chuẩn đầu dò độ dẫn điện",
      quantity: 30,
      unit: "mẫu phân tích",
      unitPrice: 6500000,
      cost: 195000000,
      revenue: 195000000,
      fundingSource: "Quỹ Dịch vụ sự nghiệp công lập",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Phạm Văn Cương",
      requiredSkill: "Khảo sát điện trở suất đa cực",
      dueDate: "2026-04-15",
      workflowStatus: "completed",
      rank: 1,
    },
    {
      id: "node-2-1-1",
      missionId: "m-02",
      parentId: "node-2-i1",
      kind: "work",
      wbsCode: "1.1.2",
      name: "Đo sâu điện đối xứng phân giải cao xác định ranh giới mặn - nhạt",
      quantity: 120,
      unit: "điểm đo",
      unitPrice: 11500000,
      cost: 1380000000,
      revenue: 1380000000,
      fundingSource: "Quỹ Dịch vụ sự nghiệp công lập",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Phạm Văn Cương",
      requiredSkill: "Khảo sát điện trở suất đa cực",
      dueDate: "2026-10-22",
      workflowStatus: "in_progress",
      rank: 1,
    },
    {
      id: "node-2-1-1-v1",
      missionId: "m-02",
      parentId: "node-2-1-1",
      kind: "volume",
      wbsCode: "1.1.2.1",
      name: "Khối lượng xử lý nghịch đảo 2D điện trở suất các mặt cắt",
      quantity: 120,
      unit: "điểm đo",
      unitPrice: 2500000,
      cost: 300000000,
      revenue: 300000000,
      fundingSource: "Quỹ Dịch vụ sự nghiệp công lập",
      department: "Đoàn Địa vật lý 59",
      assignee: "ThS. Phạm Thanh Sơn",
      requiredSkill: "Khảo sát điện trở suất đa cực",
      dueDate: "2026-10-28",
    },
    {
      id: "node-2-1-2",
      missionId: "m-02",
      parentId: "node-2-i1",
      kind: "work",
      wbsCode: "1.1.3",
      name: "Tổng hợp bản đồ đẳng điện trở suất biểu kiến tầng Pleistocen",
      quantity: 1,
      unit: "bộ bản đồ",
      unitPrice: 450000000,
      cost: 450000000,
      revenue: 450000000,
      fundingSource: "Quỹ Dịch vụ sự nghiệp công lập",
      department: "Đoàn Địa vật lý 59",
      assignee: "ThS. Phạm Thanh Sơn",
      requiredSkill: "Khảo sát điện trở suất đa cực",
      dueDate: "2026-10-20",
      workflowStatus: "review",
      rank: 1,
    },

    // ==========================================
    // NHIỆM VỤ 3 (m-03): Địa chấn phản xạ hầm metro
    // ==========================================
    {
      id: "node-3-p1",
      missionId: "m-03",
      parentId: null,
      kind: "project",
      wbsCode: "1",
      name: "Dự án TP 1: Khảo sát địa chấn phản xạ nông phân giải cao đô thị",
      quantity: 1,
      unit: "Dự án",
      unitPrice: 4650000000,
      cost: 4650000000,
      revenue: 4650000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      assignee: "ThS. Đỗ Văn Nam",
      requiredSkill: "Địa chấn phản xạ nông cao giải",
      dueDate: "2026-09-30",
    },
    {
      id: "node-3-i1",
      missionId: "m-03",
      parentId: "node-3-p1",
      kind: "item",
      wbsCode: "1.1",
      name: "Hạng mục: Thi công địa chấn dọc tim tuyến metro số 2",
      quantity: 1,
      unit: "Hạng mục",
      unitPrice: 3480000000,
      cost: 3480000000,
      revenue: 3480000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      assignee: "ThS. Đỗ Văn Nam",
      requiredSkill: "Địa chấn phản xạ nông cao giải",
      dueDate: "2026-09-28",
    },
    {
      id: "node-3-0-1",
      missionId: "m-03",
      parentId: "node-3-i1",
      kind: "work",
      wbsCode: "1.1.1",
      name: "Định vị trắc địa mốc tim tuyến và kiểm tra nhiễu điện từ đô thị ban đêm",
      quantity: 25,
      unit: "km tim tuyến",
      unitPrice: 18000000,
      cost: 450000000,
      revenue: 450000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      assignee: "KS. Trần Quốc Bảo",
      requiredSkill: "Trắc địa định vị vệ tinh vi sai GNSS",
      dueDate: "2026-05-10",
      workflowStatus: "completed",
      rank: 2,
    },
    {
      id: "node-3-1-1",
      missionId: "m-03",
      parentId: "node-3-i1",
      kind: "work",
      wbsCode: "1.1.2",
      name: "Kéo cáp thu nổ địa chấn phân giải cao 24 kênh dọc tim tuyến metro",
      quantity: 18,
      unit: "km tuyến",
      unitPrice: 125000000,
      cost: 2250000000,
      revenue: 2250000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      assignee: "ThS. Đỗ Văn Nam",
      requiredSkill: "Địa chấn phản xạ nông cao giải",
      dueDate: "2026-09-28",
      workflowStatus: "in_progress",
      rank: 2,
    },
    {
      id: "node-3-1-1-v1",
      missionId: "m-03",
      parentId: "node-3-1-1",
      kind: "volume",
      wbsCode: "1.1.2.1",
      name: "Khối lượng nổ mìn và thu nhận sóng đàn hồi dọc tim tuyến",
      quantity: 18,
      unit: "km tuyến",
      unitPrice: 35000000,
      cost: 630000000,
      revenue: 630000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      assignee: "ThS. Đỗ Văn Nam",
      requiredSkill: "Địa chấn phản xạ nông cao giải",
      dueDate: "2026-09-30",
    },
    {
      id: "node-3-1-2",
      missionId: "m-03",
      parentId: "node-3-i1",
      kind: "work",
      wbsCode: "1.1.3",
      name: "Xử lý nghịch đảo tài liệu sóng dọc Vp và lập mặt cắt địa chấn thời gian",
      quantity: 1,
      unit: "bộ báo cáo mặt cắt",
      unitPrice: 780000000,
      cost: 780000000,
      revenue: 780000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      assignee: "KS. Lê Thảo Chi",
      requiredSkill: "Xử lý ảnh địa vật lý SeisImager",
      dueDate: "2026-10-10",
      workflowStatus: "review",
      rank: 2,
    },
    {
      id: "node-3-p2",
      missionId: "m-03",
      parentId: null,
      kind: "project",
      wbsCode: "2",
      name: "Dự án TP 2: Mô hình hóa cấu trúc nền móng ngầm và đứt gãy 3D",
      quantity: 1,
      unit: "Dự án",
      unitPrice: 950000000,
      cost: 950000000,
      revenue: 950000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      assignee: "KS. Lê Thảo Chi",
      requiredSkill: "Xử lý ảnh địa vật lý SeisImager",
      dueDate: "2026-11-25",
    },
    {
      id: "node-3-i2",
      missionId: "m-03",
      parentId: "node-3-p2",
      kind: "item",
      wbsCode: "2.1",
      name: "Hạng mục: Xử lý chuyên sâu địa chấn 3D vượt sông Sài Gòn",
      quantity: 1,
      unit: "Hạng mục",
      unitPrice: 950000000,
      cost: 950000000,
      revenue: 950000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      assignee: "KS. Lê Thảo Chi",
      requiredSkill: "Xử lý ảnh địa vật lý SeisImager",
      dueDate: "2026-11-25",
    },
    {
      id: "node-3-2-1",
      missionId: "m-03",
      parentId: "node-3-i2",
      kind: "work",
      wbsCode: "2.1.1",
      name: "Gia công xử lý số liệu địa chấn phản xạ 3D đoạn qua sông Sài Gòn",
      quantity: 1,
      unit: "bộ mô hình 3D",
      unitPrice: 950000000,
      cost: 950000000,
      revenue: 950000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      assignee: "KS. Lê Thảo Chi",
      requiredSkill: "Xử lý ảnh địa vật lý SeisImager",
      dueDate: "2026-11-25",
      workflowStatus: "new",
      rank: 1,
    },

    // ==========================================
    // NHIỆM VỤ 4 (m-04): Thăm dò phóng xạ & đo sâu MT Tây Nguyên
    // ==========================================
    {
      id: "node-4-p1",
      missionId: "m-04",
      parentId: null,
      kind: "project",
      wbsCode: "1",
      name: "Dự án TP 1: Đo sâu từ tellur (MT) cấu trúc sâu bể trầm tích Tây Nguyên",
      quantity: 1,
      unit: "Dự án",
      unitPrice: 5300000000,
      cost: 5300000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Bắc Bộ",
      assignee: "PGS.TS. Trần Đình Hải",
      requiredSkill: "Đo sâu Tellur điện từ băng rộng (MT)",
      dueDate: "2026-12-25",
    },
    {
      id: "node-4-i1",
      missionId: "m-04",
      parentId: "node-4-p1",
      kind: "item",
      wbsCode: "1.1",
      name: "Hạng mục: Khảo sát trắc địa và đo sâu MT băng rộng",
      quantity: 1,
      unit: "Hạng mục",
      unitPrice: 2230000000,
      cost: 2230000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Bắc Bộ",
      assignee: "PGS.TS. Trần Đình Hải",
      requiredSkill: "Đo sâu Tellur điện từ băng rộng (MT)",
      dueDate: "2026-12-20",
    },
    {
      id: "node-4-0-1",
      missionId: "m-04",
      parentId: "node-4-i1",
      kind: "work",
      wbsCode: "1.1.1",
      name: "Khảo sát mạng lưới trắc địa mốc chuẩn độ cao và tọa độ VN-2000 vùng cao nguyên",
      quantity: 40,
      unit: "mốc trắc địa",
      unitPrice: 8500000,
      cost: 340000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Bắc Bộ",
      assignee: "KS. Nguyễn Mai Hương",
      requiredSkill: "Trắc địa định vị vệ tinh vi sai GNSS",
      dueDate: "2026-04-20",
      workflowStatus: "completed",
      rank: 3,
    },
    {
      id: "node-4-1-1",
      missionId: "m-04",
      parentId: "node-4-i1",
      kind: "work",
      wbsCode: "1.1.2",
      name: "Đo sâu từ tellur (MT) 45 trạm vật lý tuyến Đắk Lắk - Lâm Đồng",
      quantity: 45,
      unit: "trạm đo",
      unitPrice: 42000000,
      cost: 1890000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Bắc Bộ",
      assignee: "PGS.TS. Trần Đình Hải",
      requiredSkill: "Đo sâu Tellur điện từ băng rộng (MT)",
      dueDate: "2026-12-20",
      workflowStatus: "new",
      rank: 0,
    },
    {
      id: "node-4-1-1-v1",
      missionId: "m-04",
      parentId: "node-4-1-1",
      kind: "volume",
      wbsCode: "1.1.2.1",
      name: "Khối lượng thu nhận điện từ MT dải tần 0.001 Hz - 10 kHz",
      quantity: 45,
      unit: "trạm đo",
      unitPrice: 8000000,
      cost: 360000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Bắc Bộ",
      assignee: "PGS.TS. Trần Đình Hải",
      requiredSkill: "Đo sâu Tellur điện từ băng rộng (MT)",
      dueDate: "2026-12-22",
    },
    {
      id: "node-4-p2",
      missionId: "m-04",
      parentId: null,
      kind: "project",
      wbsCode: "2",
      name: "Dự án TP 2: Thăm dò phổ phóng xạ gamma mặt đất",
      quantity: 1,
      unit: "Dự án",
      unitPrice: 1500000000,
      cost: 1500000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Bắc Bộ",
      assignee: "KS. Nguyễn Mai Hương",
      requiredSkill: "Đo phổ phóng xạ gamma mặt đất",
      dueDate: "2026-11-30",
    },
    {
      id: "node-4-i2",
      missionId: "m-04",
      parentId: "node-4-p2",
      kind: "item",
      wbsCode: "2.1",
      name: "Hạng mục: Đo phổ gamma dải sa khoáng monazit",
      quantity: 1,
      unit: "Hạng mục",
      unitPrice: 1170000000,
      cost: 1170000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Bắc Bộ",
      assignee: "KS. Nguyễn Mai Hương",
      requiredSkill: "Đo phổ phóng xạ gamma mặt đất",
      dueDate: "2026-11-30",
    },
    {
      id: "node-4-2-1",
      missionId: "m-04",
      parentId: "node-4-i2",
      kind: "work",
      wbsCode: "2.1.1",
      name: "Đo phổ gamma mặt đất mạng lưới 100x50m vùng quặng sa khoáng monazit",
      quantity: 650,
      unit: "điểm đo",
      unitPrice: 1800000,
      cost: 1170000000,
      revenue: 0,
      fundingSource: "Ngân sách Nhà nước",
      department: "Đoàn Địa vật lý Bắc Bộ",
      assignee: "KS. Nguyễn Mai Hương",
      requiredSkill: "Đo phổ phóng xạ gamma mặt đất",
      dueDate: "2026-11-30",
      workflowStatus: "in_progress",
      rank: 3,
    },

    // ==========================================
    // NHIỆM VỤ 5 (m-05): Phân cực kích thích mỏ Bồng Miêu
    // ==========================================
    {
      id: "node-5-p1",
      missionId: "m-05",
      parentId: null,
      kind: "project",
      wbsCode: "1",
      name: "Dự án TP 1: Đo vẽ mặt cắt phân cực kích thích (IP/Resistivity) mỏ Bồng Miêu",
      quantity: 1,
      unit: "Dự án",
      unitPrice: 4100000000,
      cost: 4100000000,
      revenue: 4100000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Hoàng Văn Kiên",
      requiredSkill: "Đo sâu điện phân cực kích thích (IP)",
      dueDate: "2026-11-15",
    },
    {
      id: "node-5-i1",
      missionId: "m-05",
      parentId: "node-5-p1",
      kind: "item",
      wbsCode: "1.1",
      name: "Hạng mục: Thi công thực địa phương pháp điện phân cực kích thích dòng cao",
      quantity: 1,
      unit: "Hạng mục",
      unitPrice: 2710000000,
      cost: 2710000000,
      revenue: 2710000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Hoàng Văn Kiên",
      requiredSkill: "Đo sâu điện phân cực kích thích (IP)",
      dueDate: "2026-10-31",
    },
    {
      id: "node-5-1-1",
      missionId: "m-05",
      parentId: "node-5-i1",
      kind: "work",
      wbsCode: "1.1.1",
      name: "Chuẩn bị thực địa và rải tuyến đo điện cực phân cực kích thích đa cực",
      quantity: 15,
      unit: "km tuyến",
      unitPrice: 38000000,
      cost: 570000000,
      revenue: 570000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Vũ Quốc Huy",
      requiredSkill: "Đo sâu điện phân cực kích thích (IP)",
      dueDate: "2026-10-30",
      workflowStatus: "new",
      rank: 2,
    },
    {
      id: "node-5-1-2",
      missionId: "m-05",
      parentId: "node-5-i1",
      kind: "work",
      wbsCode: "1.1.2",
      name: "Đo nạp điện phân cực kích thích dòng 5A phát hiện đới khoáng hóa sulfua",
      quantity: 80,
      unit: "điểm đo",
      unitPrice: 19000000,
      cost: 1520000000,
      revenue: 1520000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Hoàng Văn Kiên",
      requiredSkill: "Đo sâu điện phân cực kích thích (IP)",
      dueDate: "2026-10-18",
      workflowStatus: "in_progress",
      rank: 4,
    },
    {
      id: "node-5-1-2-v1",
      missionId: "m-05",
      parentId: "node-5-1-2",
      kind: "volume",
      wbsCode: "1.1.2.1",
      name: "Khối lượng phát xung và đo thế điện phân cực kích thích thời gian nạp 2s",
      quantity: 80,
      unit: "điểm đo",
      unitPrice: 4000000,
      cost: 320000000,
      revenue: 320000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Hoàng Văn Kiên",
      requiredSkill: "Đo sâu điện phân cực kích thích (IP)",
      dueDate: "2026-10-20",
    },
    {
      id: "node-5-1-3",
      missionId: "m-05",
      parentId: "node-5-i1",
      kind: "work",
      wbsCode: "1.1.3",
      name: "Tổng hợp mặt cắt độ nạp điện giả định và khoanh định dị thường IP quặng vàng",
      quantity: 1,
      unit: "bộ bản đồ dị thường",
      unitPrice: 620000000,
      cost: 620000000,
      revenue: 620000000,
      fundingSource: "Vốn doanh nghiệp",
      department: "Đoàn Địa vật lý 59",
      assignee: "KS. Hoàng Văn Kiên",
      requiredSkill: "Đo sâu điện phân cực kích thích (IP)",
      dueDate: "2026-10-25",
      workflowStatus: "review",
      rank: 3,
    },
  ],
  plans: [
    // Plans cho m-01
    {
      id: "plan-1",
      missionId: "m-01",
      nodeId: "node-1-1-1",
      year: 2026,
      quarter: 3,
      month: 9,
      department: "Đoàn Địa vật lý Máy bay & Biển",
      quantity: 2400,
      cost: 2880000000,
      days: 90,
      status: "approved",
      version: 1,
      reason: "Kế hoạch bay đo từ trường được duyệt theo QĐ 142/QĐ-BTNMT",
    },
    {
      id: "plan-2",
      missionId: "m-01",
      nodeId: "node-1-2-1",
      year: 2026,
      quarter: 3,
      month: 9,
      department: "Đoàn Địa vật lý 59",
      quantity: 12,
      cost: 1400000000,
      days: 45,
      status: "approved",
      version: 1,
      reason: "Đo kiểm chứng trạm từ biến thiên mặt đất",
    },
    {
      id: "plan-3",
      missionId: "m-01",
      nodeId: "node-1-1-2",
      year: 2026,
      quarter: 4,
      month: 10,
      department: "Phòng Xử lý số liệu Địa vật lý",
      quantity: 2400,
      cost: 912000000,
      days: 30,
      status: "approved",
      version: 1,
      reason: "Xử lý số liệu nội nghiệp đợt 1",
    },
    {
      id: "plan-4",
      missionId: "m-01",
      nodeId: "node-1-0-1",
      year: 2026,
      quarter: 1,
      month: 3,
      department: "Đoàn Địa vật lý Máy bay & Biển",
      quantity: 1,
      cost: 350000000,
      days: 15,
      status: "approved",
      version: 1,
      reason: "Hiệu chuẩn trạm đo từ kế tại sân bay",
    },
    {
      id: "plan-5",
      missionId: "m-01",
      nodeId: "node-1-3-1",
      year: 2026,
      quarter: 4,
      month: 11,
      department: "Phòng Xử lý số liệu Địa vật lý",
      quantity: 1,
      cost: 820000000,
      days: 40,
      status: "draft",
      version: 1,
      reason: "Kế hoạch mô hình hóa 3D quý 4",
    },

    // Plans cho m-02
    {
      id: "plan-6",
      missionId: "m-02",
      nodeId: "node-2-1-1",
      year: 2026,
      quarter: 3,
      month: 9,
      department: "Đoàn Địa vật lý 59",
      quantity: 120,
      cost: 1380000000,
      days: 60,
      status: "approved",
      version: 1,
      reason: "Đo sâu điện đa cực kiểm tra xâm nhập mặn",
    },
    {
      id: "plan-7",
      missionId: "m-02",
      nodeId: "node-2-1-2",
      year: 2026,
      quarter: 4,
      month: 10,
      department: "Đoàn Địa vật lý 59",
      quantity: 1,
      cost: 450000000,
      days: 25,
      status: "approved",
      version: 1,
      reason: "Lập bản đồ ranh mặn - nhạt tỷ lệ 1:25.000",
    },
    {
      id: "plan-8",
      missionId: "m-02",
      nodeId: "node-2-0-1",
      year: 2026,
      quarter: 2,
      month: 4,
      department: "Đoàn Địa vật lý 59",
      quantity: 30,
      cost: 195000000,
      days: 20,
      status: "approved",
      version: 1,
      reason: "Thu thập mẫu nước ngầm đối chứng",
    },

    // Plans cho m-03
    {
      id: "plan-9",
      missionId: "m-03",
      nodeId: "node-3-1-1",
      year: 2026,
      quarter: 3,
      month: 9,
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      quantity: 18,
      cost: 2250000000,
      days: 50,
      status: "approved",
      version: 1,
      reason: "Thi công nổ mìn và kéo cáp địa chấn phân giải cao",
    },
    {
      id: "plan-10",
      missionId: "m-03",
      nodeId: "node-3-1-2",
      year: 2026,
      quarter: 4,
      month: 10,
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      quantity: 1,
      cost: 780000000,
      days: 20,
      status: "approved",
      version: 1,
      reason: "Xử lý nghịch đảo sóng đàn hồi Vp",
    },
    {
      id: "plan-11",
      missionId: "m-03",
      nodeId: "node-3-0-1",
      year: 2026,
      quarter: 2,
      month: 5,
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      quantity: 25,
      cost: 450000000,
      days: 15,
      status: "approved",
      version: 1,
      reason: "Trắc địa tim tuyến metro và đánh giá tạp âm",
    },
    {
      id: "plan-12",
      missionId: "m-03",
      nodeId: "node-3-2-1",
      year: 2026,
      quarter: 4,
      month: 11,
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      quantity: 1,
      cost: 950000000,
      days: 35,
      status: "draft",
      version: 1,
      reason: "Mô hình địa chấn 3D đáy sông Sài Gòn",
    },

    // Plans cho m-04
    {
      id: "plan-13",
      missionId: "m-04",
      nodeId: "node-4-1-1",
      year: 2026,
      quarter: 4,
      month: 11,
      department: "Đoàn Địa vật lý Bắc Bộ",
      quantity: 45,
      cost: 1890000000,
      days: 60,
      status: "approved",
      version: 1,
      reason: "Đo sâu Tellur điện từ băng rộng MT",
    },
    {
      id: "plan-14",
      missionId: "m-04",
      nodeId: "node-4-2-1",
      year: 2026,
      quarter: 4,
      month: 11,
      department: "Đoàn Địa vật lý Bắc Bộ",
      quantity: 650,
      cost: 1170000000,
      days: 45,
      status: "approved",
      version: 1,
      reason: "Đo phổ gamma mặt đất khoáng hóa monazit",
    },
    {
      id: "plan-15",
      missionId: "m-04",
      nodeId: "node-4-0-1",
      year: 2026,
      quarter: 2,
      month: 4,
      department: "Đoàn Địa vật lý Bắc Bộ",
      quantity: 40,
      cost: 340000000,
      days: 20,
      status: "approved",
      version: 1,
      reason: "Xây dựng mạng lưới mốc trắc địa khống chế",
    },

    // Plans cho m-05
    {
      id: "plan-16",
      missionId: "m-05",
      nodeId: "node-5-1-1",
      year: 2026,
      quarter: 4,
      month: 10,
      department: "Đoàn Địa vật lý 59",
      quantity: 15,
      cost: 570000000,
      days: 20,
      status: "approved",
      version: 1,
      reason: "Rải tuyến điện cực phân cực kích thích đa cực",
    },
    {
      id: "plan-17",
      missionId: "m-05",
      nodeId: "node-5-1-2",
      year: 2026,
      quarter: 4,
      month: 10,
      department: "Đoàn Địa vật lý 59",
      quantity: 80,
      cost: 1520000000,
      days: 35,
      status: "approved",
      version: 1,
      reason: "Phát xung đo nạp điện IP tìm đới quặng sulfua",
    },
    {
      id: "plan-18",
      missionId: "m-05",
      nodeId: "node-5-1-3",
      year: 2026,
      quarter: 4,
      month: 10,
      department: "Đoàn Địa vật lý 59",
      quantity: 1,
      cost: 620000000,
      days: 15,
      status: "approved",
      version: 1,
      reason: "Tổng hợp mặt cắt nạp điện và lập báo cáo",
    },
  ],
  progress: [
    // Tiến độ m-01
    {
      id: "prog-1",
      missionId: "m-01",
      nodeId: "node-1-1-1",
      date: "2026-09-30",
      quantity: 1850,
      cost: 2220000000,
      disbursement: 2000000000,
      reason: "",
      remedy: "",
    },
    {
      id: "prog-2",
      missionId: "m-01",
      nodeId: "node-1-2-1",
      date: "2026-09-28",
      quantity: 6,
      cost: 720000000,
      disbursement: 650000000,
      reason: "Địa hình núi cao hiểm trở, sạt lở đèo và lũ quét cục bộ làm chậm việc tiếp cận 6 trạm kiểm chứng",
      remedy: "Tăng cường 01 kíp trắc địa dẫn đường bằng flycam và bổ sung thiết bị liên lạc vệ tinh Iridium",
    },
    {
      id: "prog-3",
      missionId: "m-01",
      nodeId: "node-1-1-2",
      date: "2026-10-02",
      quantity: 2400,
      cost: 912000000,
      disbursement: 850000000,
      reason: "",
      remedy: "",
    },
    {
      id: "prog-4",
      missionId: "m-01",
      nodeId: "node-1-0-1",
      date: "2026-03-25",
      quantity: 1,
      cost: 350000000,
      disbursement: 350000000,
      reason: "",
      remedy: "",
    },

    // Tiến độ m-02
    {
      id: "prog-5",
      missionId: "m-02",
      nodeId: "node-2-1-1",
      date: "2026-10-01",
      quantity: 50,
      cost: 575000000,
      disbursement: 500000000,
      reason: "Các giếng khoan quan trắc tại khu vực cồn cát bị bồi lấp cần thời gian thổi rửa",
      remedy: "Bố trí thêm máy bơm sục khí và chuyển sang đo ban đêm khi triều cường ổn định",
    },
    {
      id: "prog-6",
      missionId: "m-02",
      nodeId: "node-2-1-2",
      date: "2026-10-05",
      quantity: 1,
      cost: 450000000,
      disbursement: 400000000,
      reason: "",
      remedy: "",
    },
    {
      id: "prog-7",
      missionId: "m-02",
      nodeId: "node-2-0-1",
      date: "2026-04-12",
      quantity: 30,
      cost: 195000000,
      disbursement: 195000000,
      reason: "",
      remedy: "",
    },

    // Tiến độ m-03
    {
      id: "prog-8",
      missionId: "m-03",
      nodeId: "node-3-1-1",
      date: "2026-09-25",
      quantity: 9,
      cost: 1125000000,
      disbursement: 950000000,
      reason: "Vướng mặt bằng thi công tại 4 nút giao thông đô thị và mật độ phương tiện đông đúc chỉ cho phép thi công từ 23h - 04h sáng",
      remedy: "Tăng thêm 2 kíp thi công luân phiên ca đêm, phối hợp CSGT điều tiết phân luồng cục bộ",
    },
    {
      id: "prog-9",
      missionId: "m-03",
      nodeId: "node-3-1-2",
      date: "2026-10-06",
      quantity: 1,
      cost: 780000000,
      disbursement: 700000000,
      reason: "",
      remedy: "",
    },
    {
      id: "prog-10",
      missionId: "m-03",
      nodeId: "node-3-0-1",
      date: "2026-05-08",
      quantity: 25,
      cost: 450000000,
      disbursement: 450000000,
      reason: "",
      remedy: "",
    },

    // Tiến độ m-04
    {
      id: "prog-11",
      missionId: "m-04",
      nodeId: "node-4-2-1",
      date: "2026-10-02",
      quantity: 420,
      cost: 756000000,
      disbursement: 700000000,
      reason: "",
      remedy: "",
    },
    {
      id: "prog-12",
      missionId: "m-04",
      nodeId: "node-4-0-1",
      date: "2026-04-18",
      quantity: 40,
      cost: 340000000,
      disbursement: 340000000,
      reason: "",
      remedy: "",
    },

    // Tiến độ m-05
    {
      id: "prog-13",
      missionId: "m-05",
      nodeId: "node-5-1-2",
      date: "2026-10-03",
      quantity: 32,
      cost: 608000000,
      disbursement: 500000000,
      reason: "Mưa lớn kéo dài ở khu vực rừng núi Bồng Miêu khiến độ ẩm đất quá cao gây chập mạch đường dây truyền dẫn phát dòng",
      remedy: "Thay thế cáp chịu nước áp lực cao bọc cách điện kép và sử dụng máy phát điện dã chiến công suất 10kW",
    },
    {
      id: "prog-14",
      missionId: "m-05",
      nodeId: "node-5-1-3",
      date: "2026-10-07",
      quantity: 1,
      cost: 620000000,
      disbursement: 600000000,
      reason: "",
      remedy: "",
    },
  ],
  resources: [
    {
      id: "res-1",
      missionId: "m-01",
      nodeId: "node-1-1-1",
      type: "expert",
      name: "TS. Nguyễn Văn Tuấn",
      skill: "Kỹ thuật bay đo cảm biến từ Fluxgate",
      quantity: 1,
      department: "Đoàn Địa vật lý Máy bay & Biển",
    },
    {
      id: "res-2",
      missionId: "m-01",
      nodeId: "node-1-1-1",
      type: "person",
      name: "KS. Bùi Văn Hùng",
      skill: "Kỹ thuật bay đo cảm biến từ Fluxgate",
      quantity: 4,
      department: "Tổ bay đo chuyên đề 1",
    },
    {
      id: "res-3",
      missionId: "m-01",
      nodeId: "node-1-1-1",
      type: "equipment",
      name: "Hệ thống từ kế hàng không Scintrex CS-3 kèm trạm GPS Trimble",
      skill: "Thiết bị bay đo",
      quantity: 2,
      department: "Trung tâm Máy & Thiết bị ĐVL",
    },
    {
      id: "res-4",
      missionId: "m-01",
      nodeId: "node-1-1-2",
      type: "person",
      name: "ThS. Hoàng Thị Mai",
      skill: "Xử lý phần mềm Oasis Montaj",
      quantity: 3,
      department: "Phòng Xử lý số liệu Địa vật lý",
    },
    {
      id: "res-5",
      missionId: "m-02",
      nodeId: "node-2-1-1",
      type: "equipment",
      name: "Hệ thống đo sâu điện đa cực SuperSting R8/IP 56 điện cực",
      skill: "Khảo sát điện trở suất đa cực",
      quantity: 2,
      department: "Đoàn Địa vật lý 59",
    },
    {
      id: "res-6",
      missionId: "m-03",
      nodeId: "node-3-1-1",
      type: "equipment",
      name: "Hệ thống địa chấn 24 kênh Geometrics Geode kèm nguồn đập búa dã chiến",
      skill: "Địa chấn phản xạ nông cao giải",
      quantity: 2,
      department: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
    },
    {
      id: "res-7",
      missionId: "m-04",
      nodeId: "node-4-1-1",
      type: "expert",
      name: "PGS.TS. Trần Đình Hải",
      skill: "Đo sâu Tellur điện từ băng rộng (MT)",
      quantity: 1,
      department: "Đoàn Địa vật lý Bắc Bộ",
    },
    {
      id: "res-8",
      missionId: "m-04",
      nodeId: "node-4-1-1",
      type: "equipment",
      name: "Trạm thu nhận điện từ MT Phoenix Geophysics V8 kèm cuộn cảm MTC-50",
      skill: "Đo sâu Tellur điện từ băng rộng (MT)",
      quantity: 3,
      department: "Đoàn Địa vật lý Bắc Bộ",
    },
    {
      id: "res-9",
      missionId: "m-04",
      nodeId: "node-4-2-1",
      type: "equipment",
      name: "Máy đo phổ gamma dã chiến Radiation Solutions RS-230 BGO Super-Spec",
      skill: "Đo phổ phóng xạ gamma mặt đất",
      quantity: 4,
      department: "Đoàn Địa vật lý Bắc Bộ",
    },
    {
      id: "res-10",
      missionId: "m-05",
      nodeId: "node-5-1-2",
      type: "equipment",
      name: "Máy phát phân cực kích thích công suất cao GDD TxII 5000W kèm máy thu GRx8",
      skill: "Đo sâu điện phân cực kích thích (IP)",
      quantity: 2,
      department: "Đoàn Địa vật lý 59",
    },
  ],
  audits: [
    {
      id: "audit-1",
      planId: "plan-1",
      action: "Phê duyệt kế hoạch",
      actor: "Lãnh đạo Liên đoàn",
      at: "2026-04-15T08:30:00.000Z",
      before: "Dự thảo kế hoạch",
      after: "Phê duyệt chính thức thành đường cơ sở Baseline v1",
    },
    {
      id: "audit-2",
      planId: "plan-2",
      action: "Đề xuất điều chỉnh",
      actor: "TS. Nguyễn Văn Tuấn",
      at: "2026-09-20T14:20:00.000Z",
      before: "Bản v1: 12 trạm cơ sở",
      after: "Bản v2 đề xuất: Bổ sung kinh phí và tăng thời gian do thời tiết xấu và lũ quét vùng núi",
    },
    {
      id: "audit-3",
      planId: "plan-9",
      action: "Báo cáo chậm tiến độ",
      actor: "ThS. Đỗ Văn Nam",
      at: "2026-09-26T16:00:00.000Z",
      before: "Tiến độ bình thường",
      after: "Cảnh báo chậm tiến độ do hạn chế giờ thi công ban đêm tại đô thị TP.HCM",
    },
  ],
  responsibilities: [
    {
      id: "resp-1",
      missionId: "m-01",
      level: "director",
      officerName: "KS. Trần Quốc Cường",
      officerRole: "Phó Liên đoàn trưởng phụ trách Kỹ thuật",
      unitName: "Ban Lãnh đạo Liên đoàn",
      fromDate: "2026-01-01",
      status: "active",
      notes: "Phê duyệt các quyết định kỹ thuật cấp Liên đoàn",
    },
    {
      id: "resp-2",
      missionId: "m-01",
      level: "managing_dept",
      officerName: "ThS. Lê Hoàng Long",
      officerRole: "Trưởng phòng Kỹ thuật - Công nghệ",
      unitName: "Phòng Kỹ thuật - Công nghệ",
      fromDate: "2026-01-01",
      status: "active",
      notes: "Giám sát tiến độ, thẩm định hồ sơ kỹ thuật",
    },
    {
      id: "resp-3",
      missionId: "m-01",
      level: "executing_unit",
      officerName: "ThS. Hoàng Văn Thắng",
      officerRole: "Đoàn trưởng",
      unitName: "Đoàn Địa vật lý Máy bay & Biển",
      fromDate: "2026-01-01",
      status: "active",
      notes: "Điều phối nhân lực và máy bay đo",
    },
    {
      id: "resp-4",
      missionId: "m-01",
      level: "lead_investigator",
      officerName: "TS. Nguyễn Văn Tuấn",
      officerRole: "Chủ nhiệm nhiệm vụ",
      unitName: "Đoàn Địa vật lý Máy bay & Biển",
      fromDate: "2026-01-01",
      status: "active",
      notes: "Chịu trách nhiệm toàn diện về chất lượng chuyên môn",
    },
    {
      id: "resp-5",
      missionId: "m-01",
      level: "field_officer",
      officerName: "ThS. Vũ Đức Minh",
      officerRole: "Kỹ sư trưởng bay đo",
      unitName: "Tổ bay đo chuyên đề 1",
      fromDate: "2026-01-15",
      status: "active",
      notes: "Trực tiếp chỉ huy kíp bay đo hiện trường",
    },
    {
      id: "resp-6",
      missionId: "m-03",
      level: "lead_investigator",
      officerName: "ThS. Đỗ Văn Nam",
      officerRole: "Chủ nhiệm hợp đồng",
      unitName: "Trung tâm Công nghệ & Dịch vụ Địa vật lý",
      fromDate: "2026-03-01",
      status: "active",
      notes: "Chỉ đạo thi công địa chấn đô thị",
    },
    {
      id: "resp-7",
      missionId: "m-04",
      level: "lead_investigator",
      officerName: "PGS.TS. Trần Đình Hải",
      officerRole: "Chủ nhiệm đề án",
      unitName: "Đoàn Địa vật lý Bắc Bộ",
      fromDate: "2026-01-15",
      status: "active",
      notes: "Chủ trì phương pháp đo sâu Tellur băng rộng MT",
    },
  ],
}

let cached: MissionData | undefined
const listeners = new Set<() => void>()

export function resetToSeedData(): MissionData {
  localStorage.setItem(KEY, JSON.stringify(initialSeedData))
  cached = initialSeedData
  listeners.forEach((listener) => listener())
  return cached
}

export function getMissionData(): MissionData {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      cached = initialSeedData
      saveMissionData(cached)
      return cached
    }
    const parsed = JSON.parse(raw) as Partial<MissionData> | null
    cached = parsed && typeof parsed === "object" ? {
      missions: Array.isArray(parsed.missions) && parsed.missions.length > 0 ? parsed.missions : initialSeedData.missions,
      nodes: Array.isArray(parsed.nodes) && parsed.nodes.length > 0 ? parsed.nodes : initialSeedData.nodes,
      plans: Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : initialSeedData.plans,
      progress: Array.isArray(parsed.progress) && parsed.progress.length > 0 ? parsed.progress : initialSeedData.progress,
      resources: Array.isArray(parsed.resources) && parsed.resources.length > 0 ? parsed.resources : initialSeedData.resources,
      audits: Array.isArray(parsed.audits) && parsed.audits.length > 0 ? parsed.audits : initialSeedData.audits,
      responsibilities: Array.isArray(parsed.responsibilities) && parsed.responsibilities.length > 0 ? parsed.responsibilities : initialSeedData.responsibilities,
    } : initialSeedData
  } catch {
    cached = initialSeedData
  }
  return cached
}

export function saveMissionData(next: MissionData) {
  localStorage.setItem(KEY, JSON.stringify(next))
  cached = next
  listeners.forEach((listener) => listener())
}

export function useMissionData() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getMissionData,
    () => initialSeedData
  )
}

export function upsertMission<K extends keyof MissionData>(key: K, item: MissionData[K][number]) {
  const data = getMissionData()
  const items = data[key] as Array<{ id: string }>
  const updated = items.some((row) => row.id === item.id)
    ? items.map((row) => (row.id === item.id ? item : row))
    : [...items, item]
  saveMissionData({ ...data, [key]: updated })
}

export function removeMission<K extends keyof MissionData>(key: K, id: string) {
  const data = getMissionData()
  saveMissionData({ ...data, [key]: (data[key] as Array<{ id: string }>).filter((row) => row.id !== id) })
}

export function plannedQuantity(data: MissionData, nodeId: string) {
  return data.plans.filter((plan) => plan.nodeId === nodeId && plan.status === "approved").reduce((sum, plan) => sum + plan.quantity, 0)
}

export function actualQuantity(data: MissionData, nodeId: string) {
  return data.progress.filter((entry) => entry.nodeId === nodeId).reduce((sum, entry) => sum + entry.quantity, 0)
}

export function progressStatus(dueDate: string, planned: number, actual: number, today = new Date()) {
  if (planned > 0 && actual >= planned) return "Hoàn thành"
  if (!dueDate) return "Chưa có hạn"
  const remaining = Math.ceil((new Date(dueDate + "T23:59:59").getTime() - today.getTime()) / 86400000)
  if (remaining < 0) return "Chậm"
  if (remaining <= 14 || (planned > 0 && actual / planned < 0.5 && remaining <= 30)) return "Nguy cơ"
  return "Đúng tiến độ"
}

export function updateNodeWorkflow(nodeId: string, workflowStatus: WorkflowStatus, newRank?: number) {
  const data = getMissionData()
  const updatedNodes = data.nodes.map((node) => {
    if (node.id === nodeId) {
      return {
        ...node,
        workflowStatus,
        rank: typeof newRank === "number" ? newRank : node.rank,
      }
    }
    return node
  })
  saveMissionData({ ...data, nodes: updatedNodes })
}

