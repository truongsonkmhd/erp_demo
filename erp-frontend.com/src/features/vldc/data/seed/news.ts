import { addDays } from "../dates.ts"
import { ROLE_PROFILES } from "../org.ts"
import type { NewsPost } from "../types.ts"

export function news(today: string): NewsPost[] {
  const at = (n: number, hm = "08:00") => `${addDays(today, n)}T${hm}:00`
  const post = (p: Omit<NewsPost, "authorName" | "updatedAt" | "status"> & { status?: NewsPost["status"] }): NewsPost => ({
    status: "Đã đăng", ...p, authorName: ROLE_PROFILES[p.authorRole]?.name ?? "", updatedAt: p.publishedAt ?? at(0),
  })
  return [
    post({ id: "NEWS-001", kind: "Thông báo nội bộ", pinned: true, audience: "ALL", authorRole: "lanhdao", publishedAt: at(-1),
      title: "Triển khai nhiệm vụ trọng tâm quý IV/2026",
      summary: "Tập trung hoàn thành nghiệm thu các dự án chuyển tiếp và thu hồi công nợ trước 31/12.",
      body: "Ban Lãnh đạo Liên đoàn yêu cầu các đơn vị tập trung hoàn thành hồ sơ nghiệm thu các dự án chuyển tiếp trong quý IV.\n\nPhòng KH-TC chủ trì đôn đốc thu hồi công nợ quá 60 ngày, báo cáo tiến độ tại cuộc họp giao ban hằng tuần.\n\nCác trưởng đơn vị rà soát kế hoạch nhân lực năm 2027 và gửi về Phòng TC-HC." }),
    post({ id: "NEWS-002", kind: "Sự kiện", pinned: false, audience: "ALL", authorRole: "tochuc", publishedAt: at(-2),
      title: "Hội nghị giao ban Liên đoàn tháng 11",
      summary: "Toàn thể trưởng, phó đơn vị dự họp giao ban đánh giá kết quả tháng 10.",
      body: "Thành phần: Ban Lãnh đạo, trưởng và phó các phòng, đơn vị trực thuộc.\n\nNội dung: đánh giá kết quả tháng 10, triển khai kế hoạch tháng 11, các vấn đề cần Ban Lãnh đạo quyết định.",
      event: { date: addDays(today, 4), time: "08:30", location: "Hội trường tầng 3" } }),
    post({ id: "NEWS-003", kind: "Sự kiện", pinned: false, audience: "ALL", authorRole: "tochuc", publishedAt: at(-5),
      title: "Tập huấn an toàn lao động trước mùa thực địa",
      summary: "Bắt buộc với cán bộ tham gia khảo sát hiện trường đợt tới.",
      body: "Phòng TC-HC phối hợp đơn vị chuyên môn tổ chức tập huấn an toàn lao động, sơ cứu và sử dụng thiết bị bảo hộ.\n\nCán bộ đăng ký qua đơn vị trước ngày tập huấn.",
      event: { date: addDays(today, 9), time: "14:00", location: "Phòng họp B2" } }),
    post({ id: "NEWS-004", kind: "Tin tức", pinned: false, audience: "ALL", authorRole: "lanhdao", publishedAt: at(-6),
      title: "Liên đoàn ký kết hợp đồng khảo sát địa vật lý khu vực Tây Nguyên",
      summary: "Hợp đồng mở rộng phạm vi khảo sát, dự kiến triển khai đầu năm 2027.",
      body: "Liên đoàn đã ký hợp đồng khảo sát địa vật lý phục vụ đánh giá tài nguyên khu vực Tây Nguyên.\n\nPhòng Kỹ thuật chủ trì lập phương án thi công, các đơn vị chuẩn bị nhân lực và thiết bị." }),
    post({ id: "NEWS-005", kind: "Thông báo nội bộ", pinned: false, audience: "MD", authorRole: "matdat", publishedAt: at(-3),
      title: "Lịch bảo dưỡng thiết bị đo điện tuần tới",
      summary: "Đoàn ĐVL Mặt đất tạm dừng sử dụng máy đo điện để bảo dưỡng định kỳ.",
      body: "Thiết bị đo điện của đoàn sẽ được bảo dưỡng định kỳ trong tuần tới.\n\nCác tổ đội chủ động điều chỉnh lịch thi công, liên hệ tổ thiết bị khi cần mượn máy dự phòng." }),
    post({ id: "NEWS-006", kind: "Sự kiện", pinned: false, audience: "DB", authorRole: "bien", publishedAt: at(-4),
      title: "Họp triển khai chuyến khảo sát biển đợt 2",
      summary: "Phân công nhân sự và kiểm tra thiết bị trước khi ra khơi.",
      body: "Đoàn ĐVL Biển họp triển khai chuyến khảo sát đợt 2.\n\nCác tổ trưởng báo cáo tình trạng thiết bị và danh sách nhân sự tham gia.",
      event: { date: addDays(today, -2), time: "09:00", location: "Văn phòng Đoàn ĐVL Biển" } }),
    post({ id: "NEWS-007", kind: "Tin tức", pinned: false, audience: "ALL", authorRole: "tochuc", status: "Nháp",
      title: "Kết quả hội thao chào mừng ngày truyền thống",
      summary: "Bản nháp tổng hợp kết quả các môn thi đấu.",
      body: "Đang tổng hợp kết quả từ các đơn vị." }),
  ]
}
