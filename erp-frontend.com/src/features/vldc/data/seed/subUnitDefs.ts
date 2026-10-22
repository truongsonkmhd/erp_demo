import type { SubUnitKind } from "../types.ts"

/** Seeded tổ/phòng inside each unit: [id, unit, name, kind, duty]. Staff are spread over them in this order. */
export const SUB_UNIT_DEFS: [string, string, string, SubUnitKind, string][] = [
  ["KT-DVL", "KT", "Bộ phận Địa vật lý", "Bộ phận", "Thẩm định phương án kỹ thuật, kiểm tra chất lượng tài liệu địa vật lý"],
  ["KT-GIS", "KT", "Bộ phận GIS – Bản đồ", "Bộ phận", "Biên tập bản đồ, quản trị dữ liệu không gian"],
  ["KT-CNTT", "KT", "Bộ phận CNTT", "Bộ phận", "Hạ tầng CNTT, phần mềm xử lý và chuyển đổi số"],
  ["KHTC-KH", "KHTC", "Bộ phận Kế hoạch", "Bộ phận", "Lập kế hoạch, dự toán, theo dõi giao nhiệm vụ"],
  ["KHTC-KT", "KHTC", "Bộ phận Kế toán", "Bộ phận", "Kế toán, thanh quyết toán, công nợ"],
  ["TCHC-TC", "TCHC", "Bộ phận Tổ chức cán bộ", "Bộ phận", "Nhân sự, đào tạo, thi đua khen thưởng"],
  ["TCHC-HC", "TCHC", "Bộ phận Hành chính – Văn thư", "Bộ phận", "Văn thư, lưu trữ, hành chính quản trị"],
  ["MD-DIEN", "MD", "Tổ đo điện", "Tổ", "Đo sâu điện, phân cực kích thích"],
  ["MD-TU", "MD", "Tổ đo từ – trọng lực", "Tổ", "Đo từ, trọng lực mặt đất"],
  ["MD-TD", "MD", "Tổ trắc địa", "Tổ", "Bố trí tuyến, định vị điểm đo"],
  ["MD-XL", "MD", "Tổ xử lý số liệu", "Tổ", "Xử lý, minh giải tài liệu thực địa"],
  ["DB-DC", "DB", "Tổ địa chấn", "Tổ", "Thu nổ địa chấn nông phân giải cao"],
  ["DB-TT", "DB", "Tổ từ – trọng lực biển", "Tổ", "Đo từ, trọng lực trên tàu"],
  ["DB-HC", "DB", "Đội tàu & hậu cần", "Đội", "Vận hành tàu khảo sát, hậu cần trên biển"],
  ["HK-BAY", "HK", "Tổ bay đo", "Tổ", "Bay đo từ, phổ gamma hàng không"],
  ["HK-XL", "HK", "Tổ xử lý dữ liệu bay", "Tổ", "Hiệu chỉnh, xử lý dữ liệu bay đo"],
  ["TT-KD", "TT", "Phòng kiểm định", "Phòng", "Kiểm định, hiệu chuẩn máy địa vật lý"],
  ["TT-SC", "TT", "Xưởng sửa chữa", "Xưởng", "Sửa chữa, bảo dưỡng thiết bị"],
  ["TT-NC", "TT", "Tổ nghiên cứu chế tạo", "Tổ", "Nghiên cứu, chế tạo thiết bị mới"],
]

/** Unit leaders stay outside the tổ structure in the head election (they lead the whole unit). */
export const UNIT_LEAD_TITLES = /^(Đoàn trưởng|Phó đoàn trưởng|Trưởng phòng|Phó trưởng phòng|Giám đốc|Phó giám đốc|Liên đoàn trưởng|Phó Liên đoàn trưởng)$/
