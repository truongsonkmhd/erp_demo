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
