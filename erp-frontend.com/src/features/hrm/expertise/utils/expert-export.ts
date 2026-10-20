import * as XLSX from "xlsx"
import type {
  ExpertProfileRecord,
  ExpertProposalRecord,
} from "../types/hrm-expert.types"
import { DEGREE_LABELS, ROLE_LABELS } from "./expert-search"

/**
 * Xuất danh sách chuyên gia ra Excel
 */
export function exportExpertsToExcel(experts: ExpertProfileRecord[]) {
  const rows = experts.map((e, idx) => ({
    "STT": idx + 1,
    "Mã cán bộ": e.employeeCode,
    "Họ và tên": e.fullName,
    "Đơn vị công tác": e.department,
    "Vị trí": e.position,
    "Học vị / Học hàm": DEGREE_LABELS[e.academicDegree] || e.academicDegree,
    "Chuyên ngành chính": e.primarySpecialty,
    "Kỹ năng chuyên sâu": e.subSpecialties.join(", "),
    "Số năm kinh nghiệm": `${e.yearsOfExperience} năm`,
    "Sẵn sàng thực địa": e.fieldworkReadiness ? "Có" : "Không",
    "Số đề án tham gia": e.projects.length,
    "Số đề án làm Chủ nhiệm": e.projects.filter((p) => p.role === "lead").length,
    "Số chứng chỉ": e.certificates.length,
    "Báo cáo / Công trình": e.publicationsCount,
    "Đánh giá năng lực": `${e.ratingScore}/5 sao`,
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Danh_sach_chuyen_gia")

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 22 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 24 },
    { wch: 30 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
  ]

  XLSX.writeFile(workbook, "Danh_sach_nang_luc_chuyen_gia_LDVLDC.xlsx")
}

/**
 * Xuất Hồ sơ năng lực đội ngũ chuyên gia đề án thầu ra Excel (chuẩn mẫu hồ sơ mời thầu)
 */
export function exportProposalTeamToExcel(
  proposal: ExpertProposalRecord,
  allExperts: ExpertProfileRecord[]
) {
  const expertMap = new Map(allExperts.map((e) => [e.id, e]))

  const rows = proposal.assignedExperts.map((assigned, idx) => {
    const expert = expertMap.get(assigned.expertId)
    if (!expert) {
      return {
        "STT": idx + 1,
        "Vai trò dự kiến trong đề án": assigned.assignedRole,
        "Họ và tên": "Chưa xác định",
        "Mã CB": "",
        "Học vị": "",
        "Chuyên ngành": "",
        "Số năm KN": "",
        "Chứng chỉ phù hợp": "",
        "Kinh nghiệm đề án tương tự": "",
        "Ghi chú": assigned.notes || "",
      }
    }

    const certNames = expert.certificates.map((c) => c.name).join("; ")
    const similarProjects = expert.projects
      .slice(0, 3)
      .map((p) => `${p.projectName} (${p.startYear}-${p.endYear}, ${ROLE_LABELS[p.role] || p.role})`)
      .join("; ")

    return {
      "STT": idx + 1,
      "Vai trò dự kiến trong đề án": assigned.assignedRole,
      "Họ và tên": expert.fullName,
      "Mã CB": expert.employeeCode,
      "Học vị": DEGREE_LABELS[expert.academicDegree] || expert.academicDegree,
      "Chuyên ngành": expert.primarySpecialty,
      "Số năm KN": `${expert.yearsOfExperience} năm`,
      "Chứng chỉ phù hợp": certNames || "Đang cập nhật",
      "Kinh nghiệm đề án tương tự": similarProjects,
      "Ghi chú": assigned.notes || "",
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Doi_ngu_chuyen_gia")

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 35 },
    { wch: 45 },
    { wch: 20 },
  ]

  const fileName = `Ho_so_nhan_su_de_an_${proposal.id}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
