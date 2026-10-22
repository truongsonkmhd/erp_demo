import { addDays } from "../dates.ts"
import type { Disbursement, FinanceLine, Milestone, StoredProject, WbsItem } from "../types.ts"

/**
 * Six projects with dates, weighted WBS (and the tổ doing each item), milestones and change requests; days are
 * relative to today. budget (billion VND) = the project's cost-center budgets, so cost % comes from what was paid.
 */
export function projects(today: string): StoredProject[] {
  const d = (n: number) => addDays(today, n)
  const at = (n: number) => `${d(n)}T09:00:00`
  const w = (id: string, name: string, weight: number, start: number, end: number, progress: number, subUnit?: string): WbsItem => ({
    id, name, weight, start: d(start), end: d(end), progress, status: progress >= 100 ? "Hoàn thành" : progress > 0 ? "Đang thực hiện" : "Chưa bắt đầu",
    ...(subUnit ? { subUnit } : {}),
  })
  const m = (id: string, name: string, due: number, done?: number): Milestone => ({ id, name, due: d(due), ...(done != null ? { doneAt: at(done) } : {}) })
  return [
    {
      id: "VLDC-2027-001", name: "Điều tra địa vật lý khu vực A", unit: "Đoàn ĐVL Mặt đất", leadRole: "chunhiem", budget: 2.9, start: d(-240), end: d(120), status: "Đang thực hiện",
      wbs: [w("W1", "Đo từ tuyến T1–T8", 40, -240, -60, 78, "MD-TU"), w("W2", "Đo điện tuyến T3", 35, -150, 30, 55, "MD-DIEN"), w("W3", "Xử lý số liệu đợt 1", 25, -60, 120, 45, "MD-XL")],
      milestones: [m("M1", "Hoàn thành đo từ", -60), m("M2", "Nghiệm thu khối lượng đo điện", 18), m("M3", "Báo cáo kết quả đợt 1", 110)],
      crs: [
        { id: "CR-1", kind: "Thời gian", content: "Gia hạn 30 ngày do mưa lũ tuyến T6–T8", by: "chunhiem", at: at(-3), status: "Chờ duyệt", newEnd: d(150) },
        { id: "CR-2", kind: "Phạm vi", content: "Bổ sung 2 tuyến đo điện kiểm tra dị thường", by: "chunhiem", at: at(-90), status: "Đã duyệt", decidedAt: at(-85) },
      ],
    },
    {
      id: "VLDC-2026-014", name: "Khảo sát địa vật lý biển B", unit: "Đoàn ĐVL Biển", leadRole: "bien", budget: 4.1, start: d(-200), end: d(100), status: "Đang thực hiện",
      wbs: [w("W1", "Khảo sát tuyến T12–T15", 50, -200, -20, 35, "DB-DC"), w("W2", "Thuê tàu & an toàn", 20, -200, 100, 90, "DB-HC"), w("W3", "Xử lý địa chấn nông", 30, -40, 100, 20, "DB-DC")],
      milestones: [m("M1", "Hoàn thành khảo sát tuyến T12–T15", -20), m("M2", "Báo cáo giữa kỳ", 25)],
      crs: [
        { id: "CR-1", kind: "Ngân sách", content: "Tăng chi phí thuê tàu do kéo dài thời gian khảo sát", by: "bien", at: at(-2), status: "Chờ duyệt", newBudget: 4.6 },
        { id: "CR-2", kind: "Phạm vi", content: "Bỏ tuyến T16 do vướng vùng cấm", by: "bien", at: at(-60), status: "Từ chối", decidedAt: at(-55), note: "Cần phương án thay thế tuyến" },
      ],
    },
    {
      id: "VLDC-2026-022", name: "Bay đo từ – phổ gamma tờ F-48", unit: "Đoàn ĐVL Hàng không", leadRole: "hangkhong", budget: 3.8, start: d(-180), end: d(90), status: "Đang thực hiện",
      wbs: [w("W1", "Bay đo khối F-48", 50, -180, 20, 85, "HK-BAY"), w("W2", "Hiệu chỉnh phổ gamma", 20, -120, -30, 100, "HK-XL"), w("W3", "Biên tập bản đồ", 30, -30, 90, 45, "HK-XL")],
      milestones: [m("M1", "Hoàn thành hiệu chỉnh phổ", -30, -32), m("M2", "Bay đo xong khối F-48", 20), m("M3", "Nộp bản đồ kết quả", 85)],
      crs: [],
    },
    {
      id: "VLDC-2027-003", name: "Đo sâu điện đứng vùng mỏ C", unit: "Đoàn ĐVL Mặt đất", leadRole: "chunhiem", budget: 1.5, start: d(-30), end: d(300), status: "Đang thực hiện",
      wbs: [w("W1", "Khảo sát sơ bộ", 20, -30, 20, 75, "MD-TD"), w("W2", "Thiết kế mạng tuyến", 30, -10, 60, 10, "MD-TD"), w("W3", "Thi công đo sâu điện", 50, 60, 300, 0, "MD-DIEN")],
      milestones: [m("M1", "Duyệt thiết kế mạng tuyến", 60), m("M2", "Bắt đầu thi công", 62)],
      crs: [{ id: "CR-1", kind: "Thời gian", content: "Lùi khởi công 2 tuần chờ giấy phép", by: "chunhiem", at: at(-25), status: "Đã duyệt", newEnd: d(300), decidedAt: at(-20) }],
    },
    {
      id: "VLDC-2026-018", name: "Địa chấn nông ven biển miền Trung", unit: "Đoàn ĐVL Biển", leadRole: "bien", budget: 4.1, start: d(-300), end: d(20), status: "Đang thực hiện",
      wbs: [w("W1", "Đo địa chấn nông", 70, -300, -10, 95, "DB-DC"), w("W2", "Báo cáo tổng kết", 30, -40, 20, 70, "DB-TT")],
      milestones: [m("M1", "Kết thúc thu nổ", -10), m("M2", "Bảo vệ báo cáo tổng kết", 15)],
      crs: [{ id: "CR-1", kind: "Phạm vi", content: "Bổ sung phân tích AVO cho 3 tuyến", by: "bien", at: at(-70), status: "Đã duyệt", decidedAt: at(-66) }],
    },
    {
      id: "VLDC-2026-030", name: "Hiệu chuẩn hệ thống đo trọng lực", unit: "TT Kiểm định", leadRole: "trungtam", budget: 0.7, start: d(-120), end: d(120), status: "Đang thực hiện",
      wbs: [w("W1", "Hiệu chuẩn CG-5", 50, -120, -40, 100, "TT-KD"), w("W2", "Hiệu chuẩn ZLS-B37", 50, -40, 120, 10, "TT-KD")],
      milestones: [m("M1", "Hoàn thành CG-5", -40, -42), m("M2", "Hoàn thành ZLS-B37", 115)],
      crs: [],
    },
  ]
}

/** Cost-centre lines, million VND. */
export const financeLines = (): FinanceLine[] => [
 {id:'CC-001',source:'NSNN',project:'VLDC-2027-001',item:'Đo từ',unit:'Đoàn ĐVL Mặt đất',budget:1600,committed:1240,paid:1120,posted:1050,acceptedPct:82},
 {id:'CC-002',source:'NSNN',project:'VLDC-2027-001',item:'Đo điện',unit:'Đoàn ĐVL Mặt đất',budget:1300,committed:980,paid:860,posted:780,acceptedPct:60},
 {id:'CC-003',source:'NSNN',project:'VLDC-2026-014',item:'Thuê tàu khảo sát',unit:'Đoàn ĐVL Biển',budget:3200,committed:2900,paid:2600,posted:2450,acceptedPct:45},
 {id:'CC-004',source:'NSNN',project:'VLDC-2026-014',item:'Xử lý số liệu',unit:'Đoàn ĐVL Biển',budget:900,committed:620,paid:410,posted:380,acceptedPct:25},
 {id:'CC-005',source:'NSNN',project:'VLDC-2026-022',item:'Giờ bay đo',unit:'Đoàn ĐVL Hàng không',budget:3800,committed:2900,paid:2750,posted:2700,acceptedPct:88},
 {id:'CC-006',source:'Dịch vụ',project:'VLDC-2026-030',item:'Vật tư hiệu chuẩn',unit:'TT Kiểm định',budget:700,committed:380,paid:330,posted:300,acceptedPct:70},
 {id:'CC-007',source:'NSNN',project:'VLDC-2026-018',item:'Đo địa chấn nông',unit:'Đoàn ĐVL Biển',budget:4100,committed:3500,paid:3300,posted:3250,acceptedPct:92},
 {id:'CC-008',source:'NSNN',project:'VLDC-2027-003',item:'Khảo sát sơ bộ',unit:'Đoàn ĐVL Mặt đất',budget:1500,committed:300,paid:210,posted:180,acceptedPct:15}
]

/** Year plan vs actual, cumulative billion VND by month. */
export const disbursement = (): Disbursement[] => {
  const plan = [6, 14, 24, 34, 44, 55, 66, 77, 88, 98, 108, 120]
  const actual = [4, 10, 17, 25, 33, 41, 50, 58, 67, 76, null, null]
  return plan.map((p, i) => ({ id: `M${String(i + 1).padStart(2, "0")}`, month: i + 1, plan: p, actual: actual[i] }))
}
