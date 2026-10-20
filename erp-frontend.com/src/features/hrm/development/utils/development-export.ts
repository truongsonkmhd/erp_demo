import * as XLSX from "xlsx"
import type {
  EvaluationRecord,
  RewardDisciplineRecord,
  SalaryIncreaseRecord,
  TrainingRecord,
} from "../types/hrm-development.types.ts"
import { formatDateVN } from "@/features/hrm/employee-profiles/utils/date-format"

export function exportTrainingsToExcel(data: TrainingRecord[]): void {
  const rows = data.map((item, idx) => ({
    STT: idx + 1,
    "Mã cán bộ": item.employeeCode,
    "Họ và tên": item.fullName,
    "Khóa đào tạo": item.courseName,
    "Cơ sở đào tạo": item.institution,
    "Hình thức":
      item.trainingType === "chinh_quy"
        ? "Chính quy"
        : item.trainingType === "tai_chuc"
        ? "Tại chức"
        : item.trainingType === "tap_huan"
        ? "Tập huấn chuyên môn"
        : "Chứng chỉ hành nghề",
    "Ngày bắt đầu": formatDateVN(item.startDate),
    "Ngày kết thúc": formatDateVN(item.endDate),
    "Kinh phí (VND)": item.cost ? item.cost.toLocaleString("vi-VN") : "0",
    "Kết quả": item.result,
    "Trạng thái":
      item.status === "completed"
        ? "Hoàn thành"
        : item.status === "ongoing"
        ? "Đang học"
        : "Đã hủy",
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Dao_Tao_Boi_Duong")
  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `danh_sach_dao_tao_${dateStr}.xlsx`)
}

export function exportSalaryIncreasesToExcel(data: SalaryIncreaseRecord[]): void {
  const rows = data.map((item, idx) => ({
    STT: idx + 1,
    "Mã cán bộ": item.employeeCode,
    "Họ và tên": item.fullName,
    "Số quyết định": item.decisionNumber,
    "Ngày ký": formatDateVN(item.decisionDate),
    "Ngày hiệu lực": formatDateVN(item.effectiveDate),
    "Ngạch lương": item.payGrade,
    "Bậc cũ": item.oldStep,
    "Hệ số cũ": item.oldCoefficient,
    "Bậc mới": item.newStep,
    "Hệ số mới": item.newCoefficient,
    "Hình thức":
      item.type === "regular"
        ? "Thường xuyên"
        : item.type === "early"
        ? "Trước thời hạn"
        : "Vượt bậc",
    "Người ký": item.signatory,
    "Ghi chú": item.notes || "",
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Nang_Bac_Luong")
  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `danh_sach_nang_luong_${dateStr}.xlsx`)
}

export function exportEvaluationsToExcel(data: EvaluationRecord[]): void {
  const rows = data.map((item, idx) => ({
    STT: idx + 1,
    "Mã cán bộ": item.employeeCode,
    "Họ và tên": item.fullName,
    "Năm đánh giá": item.year,
    "Kỳ đánh giá": item.period === "year" ? "Cả năm" : `Quý ${item.period.slice(1)}`,
    "Xếp loại":
      item.classification === "xuat_sac"
        ? "Hoàn thành xuất sắc"
        : item.classification === "tot"
        ? "Hoàn thành tốt"
        : item.classification === "hoan_thanh"
        ? "Hoàn thành nhiệm vụ"
        : "Không hoàn thành",
    "Điểm số": item.score ?? "—",
    "Ưu điểm / Thành tích": item.achievements,
    "Hạn chế / Tồn tại": item.limitations,
    "Người đánh giá": item.evaluator,
    "Ngày phê duyệt": formatDateVN(item.approvalDate),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Danh_Gia_Xep_Loai")
  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `danh_sach_danh_gia_${dateStr}.xlsx`)
}

export function exportRewardsDisciplinesToExcel(data: RewardDisciplineRecord[]): void {
  const rows = data.map((item, idx) => ({
    STT: idx + 1,
    "Phân loại": item.category === "reward" ? "Khen thưởng" : "Kỷ luật",
    "Mã cán bộ": item.employeeCode,
    "Họ và tên": item.fullName,
    "Hình thức": item.form,
    "Số quyết định": item.decisionNumber,
    "Ngày ký": formatDateVN(item.decisionDate),
    "Ngày hiệu lực": formatDateVN(item.effectiveDate),
    "Cơ quan ban hành": item.issuer,
    "Lý do / Nội dung": item.reason,
    "Ghi chú": item.notes || "",
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Khen_Thuong_Ky_Luat")
  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `danh_sach_khen_thuong_ky_luat_${dateStr}.xlsx`)
}
