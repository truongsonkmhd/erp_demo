import type {
  AcademicDegree,
  ExpertProfileRecord,
  ExpertSearchCriteria,
  ProjectRole,
} from "../types/hrm-expert.types"

export const DEGREE_LABELS: Record<AcademicDegree, string> = {
  tien_si: "Tiến sĩ",
  thac_si: "Thạc sĩ",
  ky_su: "Kỹ sư",
  cu_nhan: "Cử nhân",
}

export const ROLE_LABELS: Record<ProjectRole, string> = {
  lead: "Chủ nhiệm đề án",
  deputy_lead: "Phó chủ nhiệm đề án",
  chief_engineer: "Kỹ sư trưởng phương pháp",
  field_leader: "Tổ trưởng thực địa",
  analyst: "Kỹ sư xử lý & minh giải",
  member: "Thành viên nghiên cứu",
}

export interface ExpertSearchResult {
  expert: ExpertProfileRecord
  matchScore: number // 0 - 100 (%)
  matchedReasons: string[]
}

/**
 * Thuật toán tìm kiếm chuyên gia đa chiều và tính điểm phù hợp (Match Score)
 */
export function searchExperts(
  experts: ExpertProfileRecord[],
  criteria: ExpertSearchCriteria
): ExpertSearchResult[] {
  const results: ExpertSearchResult[] = []

  for (const expert of experts) {
    let score = 0
    let maxPossible = 0
    const reasons: string[] = []

    // 1. Lọc từ khóa (Họ tên, Mã CB, Chuyên ngành)
    if (criteria.keyword.trim()) {
      const kw = criteria.keyword.toLowerCase().trim()
      const matchName = expert.fullName.toLowerCase().includes(kw)
      const matchCode = expert.employeeCode.toLowerCase().includes(kw)
      const matchSpec = expert.primarySpecialty.toLowerCase().includes(kw)
      const matchSub = expert.subSpecialties.some((s) => s.toLowerCase().includes(kw))

      if (matchName || matchCode || matchSpec || matchSub) {
        score += 25
        maxPossible += 25
        reasons.push("Khớp từ khóa tìm kiếm")
      } else {
        // Nếu nhập từ khóa mà không khớp thì bỏ qua
        continue
      }
    }

    // 2. Tiêu chí Chuyên ngành chính
    if (criteria.specialty && criteria.specialty !== "all") {
      maxPossible += 25
      if (expert.primarySpecialty === criteria.specialty) {
        score += 25
        reasons.push(`Chuyên ngành chính: ${expert.primarySpecialty}`)
      } else if (expert.subSpecialties.includes(criteria.specialty)) {
        score += 15
        reasons.push(`Kỹ năng chuyên sâu: ${criteria.specialty}`)
      }
    }

    // 3. Tiêu chí Số năm kinh nghiệm (VD: >= 10 năm)
    if (criteria.minYearsOfExperience > 0) {
      maxPossible += 25
      if (expert.yearsOfExperience >= criteria.minYearsOfExperience) {
        score += 25
        reasons.push(`Kinh nghiệm ${expert.yearsOfExperience} năm (yêu cầu ≥ ${criteria.minYearsOfExperience} năm)`)
      } else if (expert.yearsOfExperience >= criteria.minYearsOfExperience - 2) {
        score += 12
        reasons.push(`Kinh nghiệm ${expert.yearsOfExperience} năm (gần đạt chuẩn)`)
      }
    }

    // 4. Tiêu chí Phương pháp kỹ thuật (VD: Đo từ hàng không, Địa chấn, Trọng lực...)
    if (criteria.methodology && criteria.methodology !== "all") {
      maxPossible += 30
      const hasMethodologyInSub = expert.subSpecialties.some((s) =>
        s.toLowerCase().includes(criteria.methodology.toLowerCase())
      )
      const hasMethodologyInProjects = expert.projects.some((p) =>
        p.methodology.some((m) => m.toLowerCase().includes(criteria.methodology.toLowerCase()))
      )

      if (hasMethodologyInSub || hasMethodologyInProjects) {
        score += 30
        const projectCount = expert.projects.filter((p) =>
          p.methodology.some((m) => m.toLowerCase().includes(criteria.methodology.toLowerCase()))
        ).length
        reasons.push(`Từng thực hiện phương pháp ${criteria.methodology} (${projectCount} đề án)`)
      }
    }

    // 5. Tiêu chí Từng giữ vai trò Chủ nhiệm / Kỹ sư trưởng đề án
    if (criteria.requiredRole && criteria.requiredRole !== "all") {
      maxPossible += 20
      const leadProjects = expert.projects.filter((p) => p.role === criteria.requiredRole)
      if (leadProjects.length > 0) {
        score += 20
        reasons.push(
          `Đã từng giữ vai trò ${ROLE_LABELS[criteria.requiredRole as ProjectRole] || criteria.requiredRole} trong ${leadProjects.length} đề án`
        )
      }
    }

    // 6. Tiêu chí Học vị (Tiến sĩ, Thạc sĩ...)
    if (criteria.academicDegree && criteria.academicDegree !== "all") {
      maxPossible += 15
      if (expert.academicDegree === criteria.academicDegree) {
        score += 15
        reasons.push(`Học vị: ${DEGREE_LABELS[expert.academicDegree]}`)
      }
    }

    // 7. Tiêu chí Chứng chỉ hành nghề
    if (criteria.hasCertificate && criteria.hasCertificate !== "all") {
      maxPossible += 15
      const hasCert = expert.certificates.some((c) =>
        c.name.toLowerCase().includes(criteria.hasCertificate.toLowerCase())
      )
      if (hasCert) {
        score += 15
        reasons.push(`Có chứng chỉ: ${criteria.hasCertificate}`)
      }
    }

    // 8. Tiêu chí Sẵn sàng thực địa dã ngoại
    if (criteria.fieldworkOnly) {
      maxPossible += 15
      if (expert.fieldworkReadiness) {
        score += 15
        reasons.push("Sẵn sàng công tác thực địa dài ngày")
      } else {
        // Yêu cầu bắt buộc thực địa nhưng chuyên gia không thể đi
        continue
      }
    }

    // Nếu không chọn tiêu chí lọc nào thì mặc định 100%
    const finalScore = maxPossible === 0 ? 100 : Math.min(100, Math.round((score / maxPossible) * 100))

    // Chỉ đưa vào kết quả nếu đạt điểm số tối thiểu khi có lọc
    if (maxPossible === 0 || finalScore >= 40) {
      results.push({
        expert,
        matchScore: finalScore,
        matchedReasons: reasons.length > 0 ? reasons : ["Phù hợp hồ sơ chung"],
      })
    }
  }

  // Sắp xếp kết quả theo điểm phù hợp giảm dần
  return results.sort((a, b) => b.matchScore - a.matchScore)
}
