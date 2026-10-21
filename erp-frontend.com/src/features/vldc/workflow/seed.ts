import type { WorkItem } from "./types.ts"
import { applyAction, createDirective, createPayment, type ActionInput, type WorkAction } from "./rules.ts"

const ALL = ["*"]

/** Demo data built through the real rules so history and notifications stay consistent. */
export function buildSeed(today: string): WorkItem[] {
  const base = new Date(`${today}T08:00:00Z`).getTime()
  const at = (hoursFromNow: number) => new Date(base + hoursFromNow * 3600_000).toISOString()
  const due = (days: number) => new Date(base + days * 86400_000).toISOString().slice(0, 10)
  const items = new Map<string, WorkItem>()
  let clock = -72
  const put = (item: WorkItem) => { items.set(item.id, item); return item }
  const act = (id: string, action: WorkAction, role: string, input: ActionInput = {}) => {
    const result = applyAction(items.get(id)!, action, input, role, at(clock += 2), [...items.values()])
    put(result.item)
    if (result.created) put(result.created)
  }
  const directive = (id: string, owner: string, cc: string[], title: string, days: number, priority: WorkItem["priority"] = "Cao") =>
    put(createDirective({ id, title, owner, cc, due: due(days), priority }, "lanhdao", ALL, at(clock += 2)))
  const delegate = (from: string, role: string, id: string, owner: string, title: string, days: number) =>
    act(from, "delegate", role, { child: { id, title, owner, due: due(days) } })
  const payment = (id: string, title: string, amount: number, days: number, parentId?: string) =>
    put(createPayment({ id, title, amount, due: due(days), parentId }, "chunhiem", ALL, at(clock += 2)))

  // Earlier work (started 2–3 weeks ago) so each unit's KPI has finished, returned, late and overdue items to measure.
  type Past = { start: number; due: number; evidence?: string; returned?: string; approveDaysAgo?: number; progress?: number }
  const finished = (id: string, owner: string, title: string, o: Past) => {
    clock = -24 * o.start
    directive(id, owner, [], title, o.due, "Trung bình")
    act(id, "accept", owner)
    act(id, "progress", owner, { progress: 80, evidence: o.evidence })
    act(id, "submit", owner)
    if (o.returned) {
      act(id, "return", "lanhdao", { note: o.returned })
      act(id, "progress", owner, { progress: 95, evidence: o.evidence })
      act(id, "submit", owner)
    }
    if (o.approveDaysAgo !== undefined) clock = -24 * o.approveDaysAgo
    act(id, "approve", "lanhdao")
  }
  const ongoing = (id: string, owner: string, title: string, o: Past) => {
    clock = -24 * o.start
    directive(id, owner, [], title, o.due, "Trung bình")
    act(id, "accept", owner)
    act(id, "progress", owner, { progress: o.progress ?? 50, evidence: o.evidence })
  }

  finished("CD-SEED-8", "matdat", "Nghiệm thu khối lượng đo từ khu vực A đợt 1", { start: 20, due: -8, evidence: "Biên bản nghiệm thu 12/10" })
  finished("CD-SEED-9", "truongdonvi", "Kiểm tra an toàn lao động các tổ đo hiện trường", { start: 18, due: -9, evidence: "Báo cáo kiểm tra ATLĐ", returned: "Thiếu danh sách tổ đo tuyến 2" })

  finished("CD-SEED-10", "bien", "Báo cáo kết quả khảo sát tuyến B2", { start: 21, due: -10, evidence: "Báo cáo tuyến B2 v2" })
  finished("CD-SEED-11", "bien", "Bảo dưỡng định kỳ tàu khảo sát", { start: 20, due: -16, approveDaysAgo: 12 })
  ongoing("CD-SEED-12", "bien", "Xử lý số liệu địa chấn nông tuyến B3", { start: 16, due: -2, progress: 60, evidence: "Đã xử lý 3/5 băng" })

  finished("CD-SEED-13", "hangkhong", "Lập kế hoạch bay đo quý IV", { start: 22, due: -12, evidence: "Kế hoạch bay đo Q4" })
  finished("CD-SEED-14", "hangkhong", "Hiệu chỉnh thiết bị đo phổ gamma máy bay", { start: 19, due: -8, evidence: "Chứng nhận hiệu chỉnh" })
  ongoing("CD-SEED-15", "hangkhong", "Biên tập bản đồ trường từ hàng không tờ F-48", { start: 10, due: 9, progress: 55, evidence: "Bản đồ nháp 60%" })

  finished("CD-SEED-16", "trungtam", "Kiểm định máy đo trọng lực CG-5", { start: 21, due: -11, evidence: "Giấy kiểm định CG-5" })
  finished("CD-SEED-17", "trungtam", "Sửa chữa máy đo điện từ EM-04", { start: 19, due: -7, evidence: "Phiếu sửa chữa", returned: "Chưa chạy thử sau sửa chữa" })
  ongoing("CD-SEED-18", "trungtam", "Xây dựng quy trình hiệu chuẩn nội bộ máy từ", { start: 15, due: -3, progress: 30 })

  finished("CD-SEED-19", "kythuat", "Thẩm định phương án kỹ thuật VLDC-2027-003", { start: 20, due: -9, evidence: "Tờ trình thẩm định" })
  finished("CD-SEED-20", "kythuat", "Rà soát tiêu chuẩn đo sâu điện đứng", { start: 18, due: -8, evidence: "Bảng đối chiếu TCVN" })
  ongoing("CD-SEED-21", "kythuat", "Kiểm tra chất lượng tài liệu nguyên thủy tuyến T1–T4", { start: 9, due: 6, progress: 70, evidence: "Đã kiểm tra 3/4 tuyến" })

  finished("CD-SEED-22", "kehoach", "Tổng hợp báo cáo giải ngân tháng 9", { start: 21, due: -12, evidence: "Báo cáo giải ngân T9" })
  finished("CD-SEED-23", "ketoan", "Đối chiếu tạm ứng công tác hiện trường quý III", { start: 20, due: -15, approveDaysAgo: 11, evidence: "Bảng đối chiếu tạm ứng" })
  ongoing("CD-SEED-24", "kehoach", "Lập dự toán điều chỉnh NV-2027-003", { start: 8, due: 5, progress: 40, evidence: "Dự toán v1" })

  finished("CD-SEED-25", "tochuc", "Hoàn thiện hồ sơ nâng lương quý IV", { start: 20, due: -10, evidence: "Danh sách nâng lương" })
  finished("CD-SEED-26", "tochuc", "Cập nhật hồ sơ chứng chỉ hành nghề cán bộ kỹ thuật", { start: 18, due: -9, evidence: "Danh mục chứng chỉ", returned: "Còn thiếu 6 chứng chỉ GIS" })
  ongoing("CD-SEED-27", "tochuc", "Tổ chức tập huấn an toàn bức xạ", { start: 7, due: 8, progress: 20 })

  clock = -72
  directive("CD-SEED-1", "matdat", ["kehoach"], "Đẩy nhanh tiến độ khảo sát VLDC-2027-001, bù 12 ngày chậm", 6)
  act("CD-SEED-1", "accept", "matdat")
  delegate("CD-SEED-1", "matdat", "TASK-SEED-1", "chunhiem", "Lập phương án tăng ca và điều phối tổ đo tuyến 3", 4)
  act("TASK-SEED-1", "accept", "chunhiem")
  act("TASK-SEED-1", "progress", "chunhiem", { progress: 40, evidence: "Đã bố trí 2/3 tổ đo" })
  delegate("TASK-SEED-1", "chunhiem", "TASK-SEED-2", "hientruong", "Đo bổ sung 12 km tuyến T3 và cập nhật nhật ký GPS", 3)

  directive("CD-SEED-2", "trungtam", ["kythuat"], "Rà soát toàn bộ thiết bị hết hạn kiểm định quý IV", 2)
  act("CD-SEED-2", "accept", "trungtam")
  delegate("CD-SEED-2", "trungtam", "TASK-SEED-3", "kythuat", "Kiểm tra hồ sơ kiểm định 18 máy đo từ và trọng lực", 2)
  act("TASK-SEED-3", "accept", "kythuat")
  act("TASK-SEED-3", "progress", "kythuat", { progress: 50, evidence: "9/18 thiết bị" })

  directive("CD-SEED-3", "ketoantruong", ["ketoan", "kehoach"], "Thu hồi công nợ HĐ-2026-031 và báo cáo phương án", 4)
  act("CD-SEED-3", "accept", "ketoantruong")
  delegate("CD-SEED-3", "ketoantruong", "TASK-SEED-4", "ketoan", "Lập biên bản đối chiếu công nợ HĐ-2026-031", 3)

  directive("CD-SEED-4", "tochuc", ["truongdonvi"], "Hoàn thiện kế hoạch nhân lực năm 2027", 10, "Trung bình")
  directive("CD-SEED-5", "bien", [], "Báo cáo phương án an toàn tàu khảo sát mùa mưa bão", 5)
  directive("CD-SEED-6", "hangkhong", ["kythuat"], "Tổng hợp kết quả bay đo tháng 10", 3, "Trung bình")
  act("CD-SEED-6", "accept", "hangkhong")
  act("CD-SEED-6", "progress", "hangkhong", { progress: 90, evidence: "Báo cáo tổng hợp v1" })
  act("CD-SEED-6", "submit", "hangkhong")
  directive("CD-SEED-7", "truongdonvi", ["chunhiem"], "Phân công nhân lực bổ sung cho dự án VLDC-2027-003", 5)
  act("CD-SEED-7", "accept", "truongdonvi")
  act("CD-SEED-7", "progress", "truongdonvi", { progress: 30 })

  payment("PAY-SEED-1", "Thanh toán chi phí khảo sát đợt 2 – VLDC-2027-001", 245_000_000, 5)
  payment("PAY-SEED-2", "Chi phí đối chiếu, xác nhận công nợ HĐ-2026-031", 86_000_000, 4, "CD-SEED-3")
  act("PAY-SEED-2", "advance", "kehoach")
  act("PAY-SEED-2", "advance", "ketoan")
  payment("PAY-SEED-3", "Thanh toán thuê máy đo từ P-12 – 680 triệu", 680_000_000, 2)
  act("PAY-SEED-3", "advance", "kehoach")
  act("PAY-SEED-3", "advance", "ketoan")
  act("PAY-SEED-3", "advance", "ketoantruong")

  return [...items.values()]
}
