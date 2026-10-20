const EXTENSIONS = ["pdf", "docx", "jpg", "png", "xlsx"] as const;
type FileExt = (typeof EXTENSIONS)[number] | "other";

export const toFileExt = (extRaw?: string): FileExt => {
  const ext = (extRaw ?? "").toLowerCase();
  return (EXTENSIONS as readonly string[]).includes(ext)
    ? (ext as FileExt)
    : "other";
};
export interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  progress: number;
  startDate: string;
  endDate: string;
  teamSize: number;
  budget: number;
  manager: string;
  category?: string;
  location?: string;

  // Thông tin khách hàng/CRM
  phone?: string;
  email?: string;
  leadSource?: string;
  salesOwnerId?: string;
  careProgress?: string;
  careProgressNote?: string;
  customsType?: "Chính ngạch" | "Tiểu ngạch";

  //  Các trường mở rộng cho quản lý pháp lý đầu tư
  investmentLevel?: string; // Cấp quyết định chủ trương đầu tư (e.g. "Trung ương", "Tỉnh", "Huyện")
  investmentApproval?: string; // Cấp phê duyệt quyết định đầu tư
  projectGroup?: string; // Nhóm dự án (A, B, C,...)
  investor?: string; // Chủ đầu tư
  investmentType?: string; // Hình thức đầu tư (BT, BOT, PPP, ngân sách,...)
  managementType?: string; // Loại hình quản lý dự án
  projectScale?: string; // Quy mô dự án (Số căn, diện tích, quy mô tài chính...)
  designStepCount?: number; // Số bước thiết kế (1 bước, 2 bước...)
  designCapacity?: string; // Năng lực thiết kế (có thể chọn tên đơn vị/tổ chức)
  approvalDate?: string; // Ngày lập quyết toán
  legalDocuments?: string[]; // Danh sách tài liệu pháp lý đính kèm URL

  //  Các trường mở rộng cho thông tin xây dựng
  constructionLevel?: string; // Cấp công trình (1, 2, 3,...)
  constructionType?: string; // Loại công trình (nhà ở, công nghiệp,...)
  constructionLocation?: string; // Địa điểm xây dựng
  designStandards?: string; // Tiêu chuẩn áp dụng (TCVN, QCVN...)

  //  Quản lý hồ sơ và mục tiêu
  goals?: string; // Mục tiêu dự án
  syntheticMethod?: string; // Phương pháp tổng hợp / tiếp cận / thực hiện
  notes?: string; // Ghi chú khác

  //  Trường sẵn có
  phases?: ProjectPhase[];
  tasks?: ProjectTask[];
  createdAt?: string;
  updatedAt?: string;

  //thông tin gói thầu
  numberTBMT?: string; // Số TBMT
  timeExceution?: string; // Thời gian thực hiện
  contractorCompanyName?: string[]; // Tên công ty trúng thầu
  contrator: string; // Nhà thầu
  contractorPrice?: number; // Giá trúng thầu
  relatedDocuments?: BaseDocument[]; // Văn bản liên quan (có thể là danh sách URL
  roleExecutor?: string; // Vai trò thực hiện (có thể là tên người hoặc nhóm)

  // Nguồn vốn
  capitalProject?: string; // Nguồn vốn (có thể là tên nguồn vốn hoặc mã nguồn vốn)

  //Lĩnh vực
  field?: string; // Lĩnh vực (có thể là tên lĩnh vực hoặc mã lĩnh vực)

  //Tài liệu dự án
  documentFolder?: DocumentFolder[];

  // Các mốc quan trọng của dự án
  milestones?: milestone[];
}

export interface milestone {
  id: string;
  milestioneName?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  subfolders: DocumentFolder[];
  files: BaseDocument[];
}

export interface ProjectPhaseTemplate {
  id: string
  projectPhase: ProjectPhase[]
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  startDate?: string;
  endDate?: string;
  documentProjectPhase?: ProjectPhaseDocument[];
  tasks: ProjectTask[];
  legalBasis?: string;
}

export interface ProjectTask {
  id: string;
  name: string;
  description: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  assignee?: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  assignUser?: string;
  dependencies?: string[];
  documentsTask?: BaseDocument[];
  legalBasis?: string;
}

export interface BaseDocument {
  id: string;
  name: string;
  url?: string;
  uploadedAt: string;
  uploadedBy: string;
  type: FileExt;
}

export interface ProjectPhaseDocument extends BaseDocument {
  description?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  phases: ProjectPhase[];
}
