import { addDays } from "../dates.ts"
import type { AlertRule, DataQualityRule, DocTemplate, ImportJob, MasterCatalog, MigrationBatch, ReportDef } from "../types.ts"

export function importJobs(today: string): ImportJob[] {
  const d = (n: number) => addDays(today, n)
  return [
    { id: "IMP-2026-018", source: "Excel thiết bị TT Kiểm định", type: "Thiết bị", rows: 428, ok: 389, errors: 39, runner: "Hoàng Thu Giang", at: `${d(-1)} 15:20`, status: "Chờ xử lý lỗi" },
    { id: "IMP-2026-017", source: "Danh mục hồ sơ lưu trữ Kho A", type: "Lưu trữ", rows: 1250, ok: 1250, errors: 0, runner: "Đỗ Minh Anh", at: `${d(-4)} 09:10`, status: "Hoàn thành" },
    { id: "IMP-2026-016", source: "Sổ tạm ứng 2025 (Excel)", type: "Kế toán", rows: 312, ok: 298, errors: 14, runner: "Vũ Thị Lan", at: `${d(-9)} 14:00`, status: "Hoàn thành" },
  ]
}

/** Digitisation of paper archives by unit: counts of dossiers through each stage. */
export const migrationBatches = (): MigrationBatch[] => [
  { id: "MIG-MD", unit: "Đoàn ĐVL Mặt đất", total: 7200, scanned: 5600, indexed: 4100, validated: 3300, migrated: 2900, weeklyRate: 160, issues: ["143 hồ sơ thiếu năm thực hiện"] },
  { id: "MIG-DB", unit: "Đoàn ĐVL Biển", total: 6400, scanned: 5100, indexed: 3600, validated: 2400, migrated: 2100, weeklyRate: 140, issues: ["208 bản đồ khổ lớn chưa scan"] },
  { id: "MIG-HK", unit: "Đoàn ĐVL Hàng không", total: 5900, scanned: 4300, indexed: 2800, validated: 1900, migrated: 1600, weeklyRate: 120, issues: [] },
  { id: "MIG-TT", unit: "TT Kiểm định", total: 5500, scanned: 3000, indexed: 1500, validated: 900, migrated: 700, weeklyRate: 90, issues: ["61 giấy kiểm định trùng số"] },
]

export function masterCatalogs(today: string): MasterCatalog[] {
  const d = (n: number) => addDays(today, n)
  return [
    { id: "MD-UNIT", name: "Đơn vị / phòng ban", count: 9, owner: "Phòng TC-HC", status: "Đã chuẩn hóa", lastReview: d(-20) },
    { id: "MD-DOCTYPE", name: "Loại văn bản / tài liệu", count: 36, owner: "Phòng TC-HC", status: "Đã chuẩn hóa", lastReview: d(-45) },
    { id: "MD-EQTYPE", name: "Loại thiết bị địa vật lý", count: 42, owner: "TT Kiểm định", status: "Đang rà soát", lastReview: d(-5) },
    { id: "MD-FUND", name: "Nguồn kinh phí", count: 6, owner: "Phòng KH-TC", status: "Đã chuẩn hóa", lastReview: d(-60) },
    { id: "MD-METHOD", name: "Phương pháp địa vật lý", count: 18, owner: "Phòng Kỹ thuật", status: "Đang rà soát", lastReview: d(-12) },
  ]
}

export const dataQualityRules = (): DataQualityRule[] => [
  { id: "DQ-01", rule: "Trùng mã hồ sơ lưu trữ", scope: "Lưu trữ", violations: 143, owner: "Phòng TC-HC", status: "Đang xử lý" },
  { id: "DQ-02", rule: "Thiết bị thiếu hạn kiểm định", scope: "Thiết bị", violations: 0, owner: "TT Kiểm định", status: "Đạt" },
  { id: "DQ-03", rule: "Tài liệu thiếu metadata (tag)", scope: "DMS", violations: 0, owner: "Các đơn vị", status: "Theo dõi" },
  { id: "DQ-04", rule: "Sai ánh xạ cột khi import", scope: "Import", violations: 28, owner: "Phòng Kỹ thuật", status: "Đang xử lý" },
]

export const alertRules = (): AlertRule[] => [
  { id: "AR-COST", name: "Chi phí vượt tiến độ (Cost vs Progress)", metric: "cost", threshold: 10, level: "Cao", enabled: true },
  { id: "AR-DEADLINE", name: "Chỉ đạo / việc quá hạn", metric: "deadline", threshold: 0, level: "Cao", enabled: true },
  { id: "AR-CALIB", name: "Thiết bị sắp hết hạn kiểm định", metric: "calibration", threshold: 30, level: "Trung bình", enabled: true },
  { id: "AR-DEBT", name: "Công nợ quá hạn (Debt Aging)", metric: "debt", threshold: 60, level: "Cao", enabled: true },
]

export function reportCatalog(today: string): ReportDef[] {
  const d = (n: number) => addDays(today, n)
  return [
    { id: "RP-01", group: "Điều hành", name: "Tiến độ nhiệm vụ / dự án", source: "projects", schedule: "Hàng tuần – Thứ Hai", recipients: "Ban Lãnh đạo", lastRun: d(-2) },
    { id: "RP-02", group: "Điều hành", name: "Chỉ đạo và việc quá hạn", source: "work_items", schedule: "Hàng ngày", recipients: "Ban Lãnh đạo, Trưởng đơn vị", lastRun: d(0) },
    { id: "RP-03", group: "Tài chính", name: "Chi phí theo hạng mục (cost center)", source: "finance_lines", schedule: "Hàng tháng", recipients: "Phòng KH-TC", lastRun: d(-20) },
    { id: "RP-04", group: "Tài chính", name: "Công nợ phải thu theo tuổi nợ", source: "contracts", schedule: "Hàng tuần", recipients: "Kế toán trưởng", lastRun: d(-5) },
    { id: "RP-05", group: "Tài chính", name: "Tạm ứng chưa hoàn", source: "advances", schedule: "Hàng tuần", recipients: "Kế toán trưởng", lastRun: d(-5) },
    { id: "RP-06", group: "Nguồn lực", name: "Thiết bị và lịch kiểm định", source: "equipment", schedule: "Hàng tháng", recipients: "TT Kiểm định", lastRun: d(-15) },
    { id: "RP-07", group: "Nguồn lực", name: "Năng lực nhân sự (Skill Matrix)", source: "staff_skills", schedule: "Theo yêu cầu", recipients: "Phòng TC-HC", lastRun: d(-40) },
    { id: "RP-08", group: "Rủi ro", name: "Sổ đăng ký rủi ro", source: "risks", schedule: "Hàng tuần", recipients: "Ban Lãnh đạo", lastRun: d(-6) },
    { id: "RP-09", group: "Hồ sơ số", name: "Tiến độ số hóa lưu trữ", source: "migration_batches", schedule: "Hàng tháng", recipients: "Phòng TC-HC", lastRun: d(-25) },
  ]
}

/** Templates fill {{field}} from the chosen record and {{today}}. */
export const docTemplates = (): DocTemplate[] => [
  { id: "TPL-TT", type: "Tờ trình", title: "Tờ trình phê duyệt điều chỉnh tiến độ", target: "project", body: "TỜ TRÌNH\nVề việc điều chỉnh tiến độ nhiệm vụ {{id}} – {{name}}\n\nĐơn vị thực hiện: {{unit}}. Tiến độ kỹ thuật hiện đạt {{technical}}%, chi phí đã sử dụng {{costUsed}}%, dự báo chậm {{delayDays}} ngày.\nKính trình Liên đoàn trưởng xem xét, phê duyệt.\n\nNgày {{today}}" },
  { id: "TPL-BBNT", type: "Biên bản nghiệm thu", title: "Biên bản nghiệm thu khối lượng", target: "project", body: "BIÊN BẢN NGHIỆM THU KHỐI LƯỢNG\nNhiệm vụ: {{id}} – {{name}}\nĐơn vị thi công: {{unit}}\nKhối lượng kỹ thuật đạt {{technical}}% theo đề cương được duyệt.\n\nLập ngày {{today}}" },
  { id: "TPL-CV-NO", type: "Công văn", title: "Công văn đôn đốc thanh toán", target: "contract", body: "CÔNG VĂN\nV/v đôn đốc thanh toán hợp đồng {{id}}\n\nKính gửi: {{party}}\nCăn cứ hợp đồng {{id}} ({{name}}) giá trị {{value}} triệu đồng, đề nghị Quý đơn vị thanh toán các khoản đến hạn.\n\nNgày {{today}}" },
  { id: "TPL-QD-TL", type: "Quyết định", title: "Quyết định thanh lý hợp đồng", target: "contract", body: "QUYẾT ĐỊNH\nVề việc thanh lý hợp đồng {{id}} với {{party}}\n\nGiá trị hợp đồng: {{value}} triệu đồng. Giai đoạn hiện tại: {{stage}}.\n\nNgày {{today}}" },
  { id: "TPL-BBBG", type: "Biên bản bàn giao", title: "Biên bản bàn giao thiết bị", target: "equipment", body: "BIÊN BẢN BÀN GIAO THIẾT BỊ\nThiết bị: {{id}} – {{name}}\nĐơn vị nhận: {{unit}}. Tình trạng: {{condition}}. Hạn kiểm định: {{inspectionDue}}.\n\nNgày {{today}}" },
  { id: "TPL-DN-KD", type: "Đề nghị", title: "Đề nghị kiểm định thiết bị", target: "equipment", body: "ĐỀ NGHỊ KIỂM ĐỊNH\nThiết bị {{id}} – {{name}} ({{unit}}) có hạn kiểm định {{inspectionDue}}. Đề nghị TT Kiểm định bố trí lịch kiểm định.\n\nNgày {{today}}" },
]
