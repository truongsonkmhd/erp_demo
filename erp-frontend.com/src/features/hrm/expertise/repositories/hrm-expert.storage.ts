import type {
  ExpertProfileRecord,
  ExpertProposalRecord,
} from "../types/hrm-expert.types"

const STORAGE_KEY_EXPERTS = "hrm_expert_profiles_v1"
const STORAGE_KEY_PROPOSALS = "hrm_expert_proposals_v1"

const INITIAL_EXPERTS: ExpertProfileRecord[] = [
  {
    id: "EXP-001",
    userId: "user-1",
    employeeCode: "CB-0001",
    fullName: "Vũ Đình Nam",
    department: "Đoàn Địa vật lý 1",
    position: "Đoàn trưởng / Kỹ sư chính",
    academicDegree: "thac_si",
    primarySpecialty: "Địa vật lý thăm dò",
    subSpecialties: ["Đo từ hàng không", "Đo từ & Trọng lực mặt đất", "Xử lý dữ liệu 3D"],
    yearsOfExperience: 16,
    fieldworkReadiness: true,
    bioSummary:
      "Chuyên gia đầu ngành về đo từ hàng không và trọng lực độ chính xác cao. Đã chủ nhiệm nhiều đề án điều tra địa chất khoáng sản cấp Bộ và Nhà nước.",
    certificates: [
      {
        id: "cert-001",
        name: "Chứng chỉ Hành nghề Thăm dò Khoáng sản Hạng I",
        issuer: "Bộ Tài nguyên và Môi trường",
        certificateNumber: "TĐKS-I-2023-018",
        issueDate: "2023-05-15",
        expiryDate: "2028-05-15",
        verified: true,
      },
      {
        id: "cert-002",
        name: "Chứng chỉ An toàn bức xạ và hạt nhân",
        issuer: "Cục An toàn Bức xạ và Hạt nhân",
        certificateNumber: "ATBX-2024-889",
        issueDate: "2024-02-10",
        expiryDate: "2027-02-10",
        verified: true,
      },
    ],
    projects: [
      {
        id: "proj-001",
        projectName: "Đề án bay đo từ - phổ gamma tỷ lệ 1:50.000 vùng Tây Bắc Bộ",
        projectCode: "DA-TB-2023",
        role: "lead",
        methodology: ["Đo từ hàng không", "Phổ gamma", "Xử lý 3D"],
        startYear: 2023,
        endYear: 2025,
        clientOrFunder: "Cục Địa chất Việt Nam",
        resultClassification: "Xuất sắc",
      },
      {
        id: "proj-002",
        projectName: "Khảo sát trọng lực chi tiết cấu trúc mỏ antimon vùng Hà Giang",
        projectCode: "KS-TL-HG",
        role: "chief_engineer",
        methodology: ["Đo từ & Trọng lực mặt đất", "Mô hình hóa 2D"],
        startYear: 2021,
        endYear: 2022,
        clientOrFunder: "Bộ Tài nguyên và Môi trường",
        resultClassification: "Tốt",
      },
    ],
    publicationsCount: 8,
    ratingScore: 5.0,
    updatedAt: "2026-09-15T08:00:00Z",
  },
  {
    id: "EXP-002",
    userId: "user-4",
    employeeCode: "CB-0004",
    fullName: "Lê Hoàng Long",
    department: "Phòng Kỹ thuật & Công nghệ",
    position: "Trưởng phòng",
    academicDegree: "tien_si",
    primarySpecialty: "Địa chấn & Tai biến địa chất",
    subSpecialties: [
      "Địa chấn phản xạ phân giải cao",
      "Địa chấn nổ mìn",
      "Mô hình hóa đứt gãy kiến tạo",
    ],
    yearsOfExperience: 22,
    fieldworkReadiness: true,
    bioSummary:
      "Tiến sĩ Địa vật lý với hơn 20 năm kinh nghiệm nghiên cứu cấu trúc sâu lòng đất, địa chấn thăm dò nền móng công trình trọng điểm và đánh giá tai biến trượt lở.",
    certificates: [
      {
        id: "cert-003",
        name: "Chứng chỉ Hành nghề Thăm dò Khoáng sản Hạng I",
        issuer: "Bộ Tài nguyên và Môi trường",
        certificateNumber: "TĐKS-I-2020-004",
        issueDate: "2020-08-10",
        expiryDate: "2025-08-10",
        verified: true,
      },
      {
        id: "cert-004",
        name: "Chứng chỉ Giám sát nổ mìn kích nổ địa chấn công nghiệp",
        issuer: "Sở Công Thương Hà Nội",
        certificateNumber: "VLNCN-2022-114",
        issueDate: "2022-04-18",
        expiryDate: "2027-04-18",
        verified: true,
      },
    ],
    projects: [
      {
        id: "proj-003",
        projectName: "Nghiên cứu cấu trúc sâu đới đứt gãy Sông Hồng bằng địa chấn sâu",
        projectCode: "DT-DC-SH",
        role: "lead",
        methodology: ["Địa chấn phản xạ phân giải cao", "Địa chấn nổ mìn"],
        startYear: 2020,
        endYear: 2023,
        clientOrFunder: "Bộ Khoa học và Công nghệ",
        resultClassification: "Xuất sắc",
      },
      {
        id: "proj-004",
        projectName: "Thăm dò địa chấn nông nền móng cụm công trình thủy điện Lai Châu",
        projectCode: "KS-LC-2019",
        role: "chief_engineer",
        methodology: ["Địa chấn nông", "Đo sóng âm"],
        startYear: 2019,
        endYear: 2020,
        clientOrFunder: "Tập đoàn Điện lực Việt Nam (EVN)",
        resultClassification: "Xuất sắc",
      },
    ],
    publicationsCount: 16,
    ratingScore: 5.0,
    updatedAt: "2026-09-20T10:00:00Z",
  },
  {
    id: "EXP-003",
    userId: "user-2",
    employeeCode: "CB-0002",
    fullName: "Nguyễn Văn Tuấn",
    department: "Đoàn Địa vật lý 1",
    position: "Kỹ sư địa vật lý thực địa",
    academicDegree: "ky_su",
    primarySpecialty: "Địa vật lý thực địa & Đo sâu điện",
    subSpecialties: [
      "Đo sâu điện phân cực kích thích IP",
      "Đo điện trở đa cực 2D",
      "Từ trường chi tiết",
    ],
    yearsOfExperience: 11,
    fieldworkReadiness: true,
    bioSummary:
      "Kỹ sư giàu kinh nghiệm thực tế dã ngoại, chuyên trách các tuyến đo điện trở 2D/3D, phân cực kích thích tìm kiếm quặng sulfide và mạch nhiệt dịch.",
    certificates: [
      {
        id: "cert-005",
        name: "Chứng chỉ An toàn lao động trong thăm dò địa vật lý mỏ",
        issuer: "Viện An toàn Vệ sinh Lao động",
        certificateNumber: "ATLD-2025-341",
        issueDate: "2025-04-20",
        expiryDate: "2028-04-20",
        verified: true,
      },
      {
        id: "cert-006",
        name: "Chứng chỉ Thợ nổ mìn công nghiệp",
        issuer: "Cục Hóa chất",
        certificateNumber: "TNM-2023-552",
        issueDate: "2023-09-12",
        expiryDate: "2026-09-12",
        verified: true,
      },
    ],
    projects: [
      {
        id: "proj-005",
        projectName: "Thăm dò địa vật lý tìm kiếm quặng đồng - niken vùng Bản Phúc, Sơn La",
        projectCode: "TD-BP-2022",
        role: "field_leader",
        methodology: ["Đo sâu điện phân cực kích thích IP", "Từ trường chi tiết"],
        startYear: 2022,
        endYear: 2024,
        clientOrFunder: "Cục Địa chất Việt Nam",
        resultClassification: "Xuất sắc",
      },
      {
        id: "proj-006",
        projectName: "Đo từ hàng không kiểm tra dị thường vùng duyên hải miền Trung",
        projectCode: "DA-MT-2021",
        role: "analyst",
        methodology: ["Đo từ hàng không"],
        startYear: 2021,
        endYear: 2022,
        clientOrFunder: "Liên đoàn Vật lý Địa chất",
        resultClassification: "Tốt",
      },
    ],
    publicationsCount: 3,
    ratingScore: 4.8,
    updatedAt: "2026-09-18T14:00:00Z",
  },
  {
    id: "EXP-004",
    userId: "user-3",
    employeeCode: "CB-0003",
    fullName: "Trần Thị Mai",
    department: "Phòng Tài chính - Kế toán",
    position: "Phó Trưởng phòng",
    academicDegree: "thac_si",
    primarySpecialty: "Kinh tế địa chất & Quản lý đề án",
    subSpecialties: [
      "Đánh giá trữ lượng khoáng sản",
      "Lập dự toán nhiệm vụ địa chất",
      "Quy hoạch tài nguyên",
    ],
    yearsOfExperience: 14,
    fieldworkReadiness: false,
    bioSummary:
      "Chuyên gia thẩm định kinh tế - kỹ thuật các dự án thăm dò khoáng sản, thẩm tra dự toán ngân sách Nhà nước và hồ sơ năng lực đấu thầu.",
    certificates: [
      {
        id: "cert-007",
        name: "Chứng chỉ Quản lý dự án đầu tư khảo sát địa chất",
        issuer: "Học viện Cán bộ Quản lý Xây dựng và Đô thị",
        certificateNumber: "QLDA-2021-098",
        issueDate: "2021-11-05",
        expiryDate: "2026-11-05",
        verified: true,
      },
    ],
    projects: [
      {
        id: "proj-007",
        projectName: "Thẩm định kinh tế - kỹ thuật đề án điều tra khoáng sản ẩn sâu quốc gia",
        projectCode: "TĐ-QG-2024",
        role: "deputy_lead",
        methodology: ["Đánh giá trữ lượng khoáng sản", "Lập dự toán nhiệm vụ địa chất"],
        startYear: 2024,
        endYear: 2025,
        clientOrFunder: "Bộ Tài nguyên và Môi trường",
        resultClassification: "Xuất sắc",
      },
    ],
    publicationsCount: 5,
    ratingScore: 4.7,
    updatedAt: "2026-09-10T11:00:00Z",
  },
  {
    id: "EXP-005",
    userId: "user-5",
    employeeCode: "CB-0005",
    fullName: "Phạm Hồng Quân",
    department: "Đoàn Địa vật lý 2",
    position: "Kỹ sư trắc địa địa vật lý",
    academicDegree: "ky_su",
    primarySpecialty: "Trắc địa địa vật lý & Viễn thám UAV",
    subSpecialties: [
      "Định vị GNSS RTK độ chính xác cao",
      "Khảo sát địa vật lý bằng Drone",
      "Bản đồ số địa chất GIS",
    ],
    yearsOfExperience: 8,
    fieldworkReadiness: true,
    bioSummary:
      "Kỹ sư chuyên trách hệ thống định vị vệ tinh độ chính xác cao, ứng dụng thiết bị bay không người lái (UAV) tích hợp cảm biến từ trường và LiDAR đo vẽ địa hình.",
    certificates: [
      {
        id: "cert-008",
        name: "Chứng chỉ Điều khiển thiết bị bay không người lái (UAV) chuyên nghiệp",
        issuer: "Cục Tác chiến - Bộ Tổng Tham mưu",
        certificateNumber: "UAV-QS-2023-412",
        issueDate: "2023-06-15",
        expiryDate: "2028-06-15",
        verified: true,
      },
    ],
    projects: [
      {
        id: "proj-008",
        projectName: "Bay chụp ảnh viễn thám và đo từ UAV chi tiết mỏ bauxit Đắk Nông",
        projectCode: "UAV-DN-2024",
        role: "field_leader",
        methodology: ["Khảo sát địa vật lý bằng Drone", "Định vị GNSS RTK độ chính xác cao"],
        startYear: 2024,
        endYear: 2025,
        clientOrFunder: "Liên đoàn Địa chất Trung Trung Bộ",
        resultClassification: "Tốt",
      },
    ],
    publicationsCount: 2,
    ratingScore: 4.6,
    updatedAt: "2026-09-22T09:00:00Z",
  },
]

const INITIAL_PROPOSALS: ExpertProposalRecord[] = [
  {
    id: "PROP-2026-001",
    proposalTitle:
      "Đề án Bay đo từ - trọng lực chi tiết phục vụ điều tra khoáng sản ẩn sâu vùng Bắc Trung Bộ",
    funder: "Cục Địa chất Việt Nam - Bộ Tài nguyên và Môi trường",
    targetMethodology: ["Đo từ hàng không", "Đo từ & Trọng lực mặt đất", "Xử lý dữ liệu 3D"],
    expectedDuration: "24 tháng (2026 - 2028)",
    status: "draft",
    assignedExperts: [
      {
        expertId: "EXP-001",
        assignedRole: "Chủ nhiệm đề án",
        notes: "Chỉ đạo toàn diện kỹ thuật và nghiệm thu kết quả bay đo",
      },
      {
        expertId: "EXP-002",
        assignedRole: "Cố vấn khoa học & Phản biện kỹ thuật",
        notes: "Chuyên gia cao cấp thẩm tra mô hình phân tích sâu",
      },
      {
        expertId: "EXP-003",
        assignedRole: "Kỹ sư trưởng khảo sát thực địa",
        notes: "Trực tiếp điều hành các trạm đo từ biến thiên mặt đất",
      },
    ],
    createdAt: "2026-09-10T08:00:00Z",
    updatedAt: "2026-10-02T10:30:00Z",
  },
  {
    id: "PROP-2026-002",
    proposalTitle: "Khảo sát địa chấn nông phân giải cao cảnh báo trượt lở lòng hồ Hòa Bình",
    funder: "Tập đoàn Điện lực Việt Nam (EVN)",
    targetMethodology: ["Địa chấn phản xạ phân giải cao", "Mô hình hóa đứt gãy kiến tạo"],
    expectedDuration: "12 tháng (2026 - 2027)",
    status: "submitted",
    assignedExperts: [
      {
        expertId: "EXP-002",
        assignedRole: "Chủ nhiệm đề án",
        notes: "Chuyên gia trưởng địa chấn nông",
      },
      {
        expertId: "EXP-005",
        assignedRole: "Kỹ sư định vị trắc địa GNSS & UAV",
        notes: "Đo vẽ bình đồ địa hình và định vị điểm chấn",
      },
    ],
    createdAt: "2026-08-15T09:00:00Z",
    updatedAt: "2026-09-28T16:00:00Z",
  },
]

export class HrmExpertRepository {
  private getStorage(): Storage | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage
      }
    } catch {
      // Ignored
    }
    return null
  }

  // --- QUẢN LÝ HỒ SƠ CHUYÊN GIA ---
  getAllExperts(): ExpertProfileRecord[] {
    const storage = this.getStorage()
    if (!storage) return INITIAL_EXPERTS
    try {
      const raw = storage.getItem(STORAGE_KEY_EXPERTS)
      if (!raw) {
        this.saveAllExperts(INITIAL_EXPERTS)
        return INITIAL_EXPERTS
      }
      return JSON.parse(raw) as ExpertProfileRecord[]
    } catch {
      return INITIAL_EXPERTS
    }
  }

  getExpertById(id: string): ExpertProfileRecord | null {
    return this.getAllExperts().find((e) => e.id === id) || null
  }

  private saveAllExperts(experts: ExpertProfileRecord[]): void {
    const storage = this.getStorage()
    if (!storage) return
    try {
      storage.setItem(STORAGE_KEY_EXPERTS, JSON.stringify(experts))
    } catch {
      // Ignored
    }
  }

  saveExpert(record: ExpertProfileRecord): ExpertProfileRecord {
    const experts = this.getAllExperts()
    const index = experts.findIndex((e) => e.id === record.id)
    record.updatedAt = new Date().toISOString()

    if (index >= 0) {
      experts[index] = record
    } else {
      experts.unshift(record)
    }

    this.saveAllExperts(experts)
    return record
  }

  deleteExpert(id: string): boolean {
    const experts = this.getAllExperts()
    const filtered = experts.filter((e) => e.id !== id)
    if (filtered.length !== experts.length) {
      this.saveAllExperts(filtered)
      return true
    }
    return false
  }

  // --- QUẢN LÝ HỒ SƠ NĂNG LỰC ĐỀ ÁN THẦU ---
  getAllProposals(): ExpertProposalRecord[] {
    const storage = this.getStorage()
    if (!storage) return INITIAL_PROPOSALS
    try {
      const raw = storage.getItem(STORAGE_KEY_PROPOSALS)
      if (!raw) {
        this.saveAllProposals(INITIAL_PROPOSALS)
        return INITIAL_PROPOSALS
      }
      return JSON.parse(raw) as ExpertProposalRecord[]
    } catch {
      return INITIAL_PROPOSALS
    }
  }

  getProposalById(id: string): ExpertProposalRecord | null {
    return this.getAllProposals().find((p) => p.id === id) || null
  }

  private saveAllProposals(proposals: ExpertProposalRecord[]): void {
    const storage = this.getStorage()
    if (!storage) return
    try {
      storage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(proposals))
    } catch {
      // Ignored
    }
  }

  saveProposal(record: ExpertProposalRecord): ExpertProposalRecord {
    const proposals = this.getAllProposals()
    const index = proposals.findIndex((p) => p.id === record.id)
    record.updatedAt = new Date().toISOString()

    if (index >= 0) {
      proposals[index] = record
    } else {
      proposals.unshift(record)
    }

    this.saveAllProposals(proposals)
    return record
  }

  deleteProposal(id: string): boolean {
    const proposals = this.getAllProposals()
    const filtered = proposals.filter((p) => p.id !== id)
    if (filtered.length !== proposals.length) {
      this.saveAllProposals(filtered)
      return true
    }
    return false
  }
}

export const defaultHrmExpertRepository = new HrmExpertRepository()
