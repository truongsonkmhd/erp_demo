import { addDays } from "../dates.ts"
import { ROLE_PROFILES } from "../org.ts"
import type { ScienceTopic, TopicProgressLog } from "../types.ts"

/** Seven topics across every state; the first three continue the former R&D portfolio (R-2026-01, R-2025-04, R-2026-07). */
export function scienceTopics(today: string): ScienceTopic[] {
  const d = (n: number) => addDays(today, n)
  const at = (n: number) => `${d(n)}T09:00:00`
  const name = (role: string) => ROLE_PROFILES[role]?.name ?? role
  /** Progress log: [days from today, role, %, note]; the topic's progress is the last entry. */
  const log = (rows: [number, string, number, string][]): TopicProgressLog[] =>
    rows.map(([n, by, progress, note]) => ({ at: at(n), by, byName: name(by), progress, note }))
  const topic = (t: Omit<ScienceTopic, "leadName" | "progress" | "createdAt">): ScienceTopic =>
    ({ ...t, leadName: name(t.leadRole), progress: t.log.at(-1)?.progress ?? 0, createdAt: `${t.start}T08:00:00` })

  return [
    topic({
      id: "DT-2026-01", title: "Nền tảng AI hỗ trợ kiểm soát chất lượng dữ liệu địa vật lý", field: "Chuyển đổi số", unit: "KT",
      objective: "Tự động phát hiện số liệu đo bất thường, giảm thời gian kiểm tra chất lượng dữ liệu thực địa.",
      leadRole: "kythuat", members: ["chunhiem", "hientruong"], start: d(-200), end: d(160), budget: 2800, spent: 620,
      attachments: ["Thuyết minh đề tài.docx", "Bộ dữ liệu mẫu tuyến T12.zip"], status: "Đang triển khai",
      log: log([[-150, "kythuat", 10, "Hoàn thành thuyết minh, thu thập dữ liệu mẫu"], [-60, "chunhiem", 25, "Gán nhãn 3.000 điểm đo"], [-12, "kythuat", 38, "Mô hình thử đạt độ chính xác 81%"]]),
    }),
    topic({
      id: "DT-2025-04", title: "Hoàn thiện thiết bị đo phổ gamma bằng UAV", field: "Thiết bị – Công nghệ", unit: "TT",
      objective: "Chế tạo bộ đo phổ gamma gắn UAV thay thế đo bộ ở vùng địa hình khó tiếp cận.",
      leadRole: "trungtam", members: ["hangkhong"], start: d(-540), end: d(-40), budget: 4500, spent: 4380,
      attachments: ["Báo cáo tổng kết.pdf", "Quy trình vận hành UAV-Gamma.docx"], status: "Đã triển khai",
      result: "Thiết bị UAV-Gamma và phần mềm xử lý phổ; đã bay thử 120 km tuyến tại Lào Cai.",
      impact: "Rút ngắn 40% thời gian khảo sát vùng núi cao, giảm rủi ro an toàn cho tổ đo.",
      submittedAt: at(-45), approvedAt: at(-38),
      log: log([[-400, "trungtam", 30, "Hoàn thành thiết kế khung gá"], [-200, "hangkhong", 70, "Bay thử nghiệm lần 1"], [-50, "trungtam", 100, "Hiệu chuẩn và bay nghiệm thu"]]),
    }),
    topic({
      id: "DT-2026-07", title: "Tích hợp dữ liệu địa vật lý biển đa nguồn phục vụ mô hình 3D", field: "Địa vật lý", unit: "DB",
      objective: "Chuẩn hóa và hợp nhất dữ liệu địa chấn, từ, trọng lực biển để dựng mô hình 3D.",
      leadRole: "bien", members: ["kythuat"], start: d(-120), end: d(9), budget: 3600, spent: 2100,
      attachments: ["Kế hoạch tích hợp dữ liệu.xlsx"], status: "Đang triển khai",
      log: log([[-90, "bien", 20, "Chuẩn hóa định dạng dữ liệu địa chấn"], [-20, "kythuat", 62, "Hợp nhất dữ liệu từ và trọng lực"]]),
    }),
    topic({
      id: "DT-2026-11", title: "Ứng dụng GIS quản lý tuyến khảo sát hiện trường", field: "GIS – Bản đồ", unit: "MD",
      objective: "Theo dõi tuyến đo, vị trí tổ đội và tiến độ khảo sát trên bản đồ số theo thời gian thực.",
      leadRole: "matdat", members: ["hientruong"], start: d(-180), end: d(5), budget: 450, spent: 410,
      attachments: ["Báo cáo kết quả.docx"], status: "Chờ duyệt",
      result: "Ứng dụng bản đồ tuyến khảo sát trên máy tính bảng, đồng bộ về máy chủ mỗi 15 phút.",
      impact: "Đoàn ĐVL Mặt đất áp dụng cho 3 dự án, giảm báo cáo giấy hằng ngày.", submittedAt: at(-2),
      log: log([[-120, "matdat", 40, "Hoàn thành bản đồ nền"], [-30, "hientruong", 85, "Chạy thử tại tuyến T12–T15"], [-3, "matdat", 100, "Hoàn thiện theo góp ý tổ đội"]]),
    }),
    topic({
      id: "DT-2026-14", title: "Quy trình số hóa hồ sơ lưu trữ địa vật lý trước năm 2015", field: "Quản lý", unit: "TCHC",
      objective: "Xây dựng quy trình quét, đánh chỉ mục và kiểm tra chất lượng hồ sơ giấy.",
      leadRole: "tochuc", members: ["kehoach"], start: d(-150), end: d(-6), budget: 250, spent: 180,
      attachments: [], status: "Đang triển khai",
      log: log([[-100, "tochuc", 30, "Khảo sát kho lưu trữ"], [-25, "kehoach", 55, "Thử nghiệm quét 2.000 trang"]]),
    }),
    topic({
      id: "DT-2025-09", title: "Cải tiến bộ nguồn phát cho máy đo điện trường", field: "Thiết bị – Công nghệ", unit: "MD",
      objective: "Tăng công suất và độ ổn định bộ nguồn phát khi đo sâu điện.",
      leadRole: "matdat", members: ["kythuat"], start: d(-420), end: d(-90), budget: 600, spent: 560,
      attachments: ["Bản vẽ mạch nguồn.pdf"], status: "Đã triển khai",
      result: "Bộ nguồn phát 5 kW ổn định dòng, đã lắp cho 4 máy đo điện.",
      impact: "Tăng độ sâu khảo sát thêm 30%, giảm hỏng hóc khi làm việc ngoài trời.", submittedAt: at(-95), approvedAt: at(-88),
      log: log([[-300, "matdat", 50, "Hoàn thành mạch thử"], [-100, "kythuat", 100, "Kiểm định và lắp đặt"]]),
    }),
    topic({
      id: "DT-2026-15", title: "Tự động hóa đối chiếu công nợ hợp đồng", field: "Chuyển đổi số", unit: "KHTC",
      objective: "Đối chiếu tự động hóa đơn, thanh toán và mốc hợp đồng để cảnh báo công nợ quá hạn.",
      leadRole: "ketoantruong", members: ["ketoan"], start: d(-60), end: d(120), budget: 150, spent: 30,
      attachments: ["Đề cương.docx"], status: "Đang triển khai",
      log: log([[-40, "ketoan", 15, "Phân tích mẫu dữ liệu hợp đồng"]]),
    }),
  ]
}
