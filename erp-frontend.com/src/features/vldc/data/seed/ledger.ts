import { addDays } from "../dates.ts"
import type { CashEntry, DebtRecord } from "../types.ts"

/** Bảng công nợ dự án and phiếu thu / chi; money in VND. */
export function debtRecords(today: string): DebtRecord[] {
  const d = (n: number) => addDays(today, n)
  const debt = (r: Omit<DebtRecord, "createdBy" | "createdAt">): DebtRecord => ({ ...r, createdBy: "ketoan", createdAt: `${d(-200)}T08:00:00` })
  return [
    debt({ id: "CN-2026-001", contractNo: "HĐ-2026-031", projectId: "VLDC-2027-001", projectName: "Điều tra địa vật lý khu vực A", content: "Khảo sát địa vật lý phục vụ quy hoạch khu A – Công ty B",
      amount: 3_000_000_000, installments: [{ amount: 1_000_000_000, date: d(-150) }, { amount: 800_000_000, date: d(-40) }], done: false }),
    debt({ id: "CN-2026-002", contractNo: "HĐ-2026-044", projectId: "VLDC-2026-022", projectName: "Bay đo từ – phổ gamma tờ F-48", content: "Bay đo phổ gamma phục vụ tìm kiếm khoáng sản – Đối tác C",
      amount: 1_800_000_000, installments: [{ amount: 900_000_000, date: d(-60) }, { amount: 200_000_000, date: d(-20) }], done: false }),
    debt({ id: "CN-2026-003", contractNo: "HĐ-2026-018", projectId: "VLDC-2026-018", projectName: "Địa chấn nông ven biển miền Trung", content: "Địa chấn nông ven biển – Sở TN&MT tỉnh D",
      amount: 1_200_000_000, installments: [{ amount: 600_000_000, date: d(-45) }], done: false }),
    debt({ id: "CN-2026-004", contractNo: "HĐ-2026-052", projectId: "VLDC-2026-030", projectName: "Hiệu chuẩn hệ thống đo trọng lực", content: "Dịch vụ hiệu chuẩn thiết bị đo trọng lực – Công ty E",
      amount: 900_000_000, installments: [{ amount: 200_000_000, date: d(-75) }], done: true }),
    debt({ id: "CN-2026-005", contractNo: "HĐ-2025-097", projectName: "Đo từ mặt đất khu mỏ Đông Bắc", content: "Đo từ mặt đất, lập bản đồ dị thường – Công ty F",
      amount: 650_000_000, installments: [{ amount: 300_000_000, date: d(-210) }, { amount: 200_000_000, date: d(-120) }, { amount: 150_000_000, date: d(-35) }], done: true }),
  ]
}

export function cashEntries(today: string): CashEntry[] {
  const d = (n: number) => addDays(today, n)
  const entry = (e: Omit<CashEntry, "createdBy" | "createdAt">): CashEntry => ({ ...e, createdBy: "ketoan", createdAt: `${e.date}T09:00:00` })
  return [
    entry({ id: "PT-2026-001", kind: "thu", date: d(-28), content: "Thu thanh lý vật tư hỏng", counterparty: "Công ty Phế liệu G", amount: 45_000_000, method: "Tiền mặt" }),
    entry({ id: "PT-2026-002", kind: "thu", date: d(-6), content: "Thu lãi tiền gửi ngân hàng", counterparty: "Ngân hàng BIDV", amount: 12_500_000, method: "Chuyển khoản" }),
    entry({ id: "PC-2026-001", kind: "chi", date: d(-30), content: "Thuê máy đo từ P-12 đợt 1", counterparty: "Công ty Thiết bị A", amount: 750_000_000, method: "Chuyển khoản", debtId: "CN-2026-001" }),
    entry({ id: "PC-2026-002", kind: "chi", date: d(-40), content: "Thuê tàu khảo sát đợt 1", counterparty: "Dịch vụ D", amount: 480_000_000, method: "Chuyển khoản", debtId: "CN-2026-003" }),
    entry({ id: "PC-2026-003", kind: "chi", date: d(-18), content: "Nhiên liệu bay đo tờ F-48", counterparty: "Petrolimex Hàng không", amount: 320_000_000, method: "Chuyển khoản", debtId: "CN-2026-002" }),
    entry({ id: "PC-2026-004", kind: "chi", date: d(-12), content: "Văn phòng phẩm quý IV", counterparty: "Cửa hàng Hồng Hà", amount: 8_400_000, method: "Tiền mặt" }),
    entry({ id: "PC-2026-005", kind: "chi", date: d(-3), content: "Công tác phí hiện trường khu A", counterparty: "Đoàn ĐVL Mặt đất", amount: 96_000_000, method: "Tiền mặt", debtId: "CN-2026-001" }),
  ]
}
