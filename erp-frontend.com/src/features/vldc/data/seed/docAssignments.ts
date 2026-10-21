import { addDays } from "../dates.ts"
import type { DocAssignment } from "../types.ts"

/** Phiếu giao for two seeded incoming documents: one partly answered and overdue, one just handed out. */
export function docAssignments(today: string): DocAssignment[] {
  const at = (n: number, hm: string) => `${addDays(today, n)}T${hm}:00`
  return [
    {
      id: "GX-1279", docId: "vldc-in-1279", docNumber: "CV-ĐEN-1279", docSummary: "Yêu cầu báo cáo tình hình kiểm định thiết bị quý III",
      instruction: "TT Kiểm định tổng hợp số liệu kiểm định; Phòng Kỹ thuật rà soát thiết bị hiện trường; TC-HC đối chiếu hồ sơ tài sản. Gửi báo cáo trước hạn.",
      due: addDays(today, -1), attachments: ["CV-ĐEN-1279.pdf", "Mẫu báo cáo kiểm định quý.xlsx"],
      assignedBy: "lanhdao", assignedByName: "Nguyễn Văn Minh", createdAt: at(-10, "09:30"),
      recipients: [
        { role: "trungtam", seenAt: at(-10, "10:15"), reply: { result: "Hoàn thành", text: "Đã tổng hợp 42 thiết bị, 3 thiết bị quá hạn kiểm định đã lập kế hoạch kiểm định lại.", attachments: ["BC kiểm định Q3 - TT.xlsx"], at: at(-3, "16:40") } },
        { role: "kythuat", seenAt: at(-9, "08:05") },
        { role: "tochuc" },
      ],
    },
    {
      id: "GX-1290", docId: "vldc-in-1290", docNumber: "CV-ĐEN-1290", docSummary: "Mời họp tổng kết công tác điều tra địa vật lý biển năm 2026",
      instruction: "Đoàn ĐVL Biển chuẩn bị báo cáo tham luận; Phòng Kỹ thuật cử người dự họp và xác nhận thành phần.",
      due: addDays(today, 3), attachments: ["Giấy mời họp tổng kết.pdf"],
      assignedBy: "lanhdao", assignedByName: "Nguyễn Văn Minh", createdAt: at(0, "09:00"),
      recipients: [{ role: "bien" }, { role: "kythuat" }],
    },
  ]
}
