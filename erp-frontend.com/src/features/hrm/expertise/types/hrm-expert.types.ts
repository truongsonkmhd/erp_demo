export type AcademicDegree = "cu_nhan" | "ky_su" | "thac_si" | "tien_si"

export type ProjectRole =
  | "lead" // Chủ nhiệm đề án
  | "deputy_lead" // Phó chủ nhiệm đề án
  | "chief_engineer" // Kỹ sư trưởng phương pháp
  | "field_leader" // Tổ trưởng thực địa
  | "analyst" // Kỹ sư xử lý & minh giải
  | "member" // Thành viên nghiên cứu

export interface ExpertCertificate {
  id: string
  name: string // Tên chứng chỉ, vd: "Chứng chỉ Hành nghề Thăm dò Khoáng sản Hạng I"
  issuer: string // Cơ quan cấp, vd: "Bộ Tài nguyên và Môi trường"
  certificateNumber: string
  issueDate: string
  expiryDate?: string
  verified: boolean
}

export interface ExpertProjectExperience {
  id: string
  projectName: string // Tên đề án, vd: "Đề án bay đo từ - phổ gamma vùng Tây Bắc Bộ"
  projectCode: string
  role: ProjectRole
  methodology: string[] // Phương pháp, vd: ["Đo từ hàng không", "Phổ gamma", "Xử lý 3D"]
  startYear: number
  endYear: number
  clientOrFunder: string // Cơ quan giao, vd: "Cục Địa chất Việt Nam"
  resultClassification: string // Xếp loại, vd: "Xuất sắc"
}

export interface ExpertProfileRecord {
  id: string // EXP-001
  userId: string
  employeeCode: string // CB-0001
  fullName: string
  department: string
  position: string
  academicDegree: AcademicDegree
  primarySpecialty: string // Chuyên ngành chính, vd: "Địa vật lý thăm dò"
  subSpecialties: string[] // Kỹ năng/chuyên môn sâu, vd: ["Đo từ hàng không", "Trọng lực chi tiết"]
  yearsOfExperience: number // Số năm kinh nghiệm công tác
  fieldworkReadiness: boolean // Sẵn sàng đi thực địa dã ngoại dài ngày
  bioSummary: string // Tóm tắt năng lực
  certificates: ExpertCertificate[]
  projects: ExpertProjectExperience[]
  publicationsCount: number // Số công trình / bài báo / báo cáo địa chất
  ratingScore: number // Đánh giá năng lực chuyên môn (1 - 5 sao)
  updatedAt: string
}

export interface ExpertSearchCriteria {
  keyword: string
  specialty: string
  minYearsOfExperience: number
  academicDegree: string
  methodology: string
  requiredRole: string
  hasCertificate: string
  fieldworkOnly: boolean
}

export interface ProposalAssignedExpert {
  expertId: string
  assignedRole: string // Vai trò dự kiến trong đề án mới, vd: "Chủ nhiệm đề án"
  notes?: string
}

export interface ExpertProposalRecord {
  id: string // PROP-2026-001
  proposalTitle: string // Tên đề án thầu / hồ sơ năng lực
  funder: string // Chủ đầu tư / cơ quan mời thầu
  targetMethodology: string[] // Phương pháp kỹ thuật yêu cầu
  expectedDuration?: string
  status: "draft" | "submitted" | "approved"
  assignedExperts: ProposalAssignedExpert[]
  createdAt: string
  updatedAt: string
}
