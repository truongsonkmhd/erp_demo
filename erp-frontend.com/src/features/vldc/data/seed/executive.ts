import { addDays, vnDate } from "../dates.ts"
import type { CommonTask, Decision, InboxTask, Initiative, Meeting, Risk, StrategicGoal } from "../types.ts"

/** Legacy task inbox; payment dossiers are not here – they live in the workflow (vldc_work_items). */
const INBOX_TASKS: Omit<InboxTask, "history">[] = [
 {id:'NT-2026-045',type:'Nghiệm thu',title:'Xác nhận khối lượng nghiệm thu hạng mục đo điện',source:'Kỹ thuật',sourcePage:'projects',owner:'kythuat',cc:['chunhiem','kehoach','ketoan'],priority:'Cao',status:'Chờ kiểm tra',sla:'Còn 5h',overdue:false,from:'Chủ nhiệm dự án',project:'VLDC-2027-001',next:'KH-TC'},
 {id:'KH-2027-011',type:'Kế hoạch',title:'Xác nhận nguồn và dự toán điều chỉnh nhiệm vụ',source:'KH-TC',sourcePage:'finance',owner:'kehoach',cc:['lanhdao','chunhiem','ketoan'],priority:'Cao',status:'Đang xử lý',sla:'Còn 1 ngày',overdue:false,from:'Phòng Kỹ thuật',project:'VLDC-2027-003',next:'Ban Lãnh đạo'},
 {id:'EQ-REQ-021',type:'Thiết bị',title:'Phê duyệt điều chuyển máy P-12 sang ĐVL Biển',source:'Thiết bị',sourcePage:'equipment',owner:'lanhdao',cc:['truongdonvi','kythuat','tochuc'],priority:'Trung bình',status:'Chờ phê duyệt',sla:'Còn 1 ngày',overdue:false,from:'Trưởng đơn vị',project:'VLDC-2026-014',next:'TC-HC / Thiết bị'},
 {id:'DOC-1288',type:'Văn bản',title:'Trình ký Kế hoạch nhiệm vụ năm 2027',source:'Văn bản',sourcePage:'documents',owner:'lanhdao',cc:['tochuc','kehoach'],priority:'Cao',status:'Chờ ký',sla:'Còn 2h',overdue:false,from:'TC-HC',project:'-',next:'Văn thư phát hành'},
 {id:'VB-1192',type:'Báo cáo',title:'Báo cáo thiết bị quý III cần hoàn thiện',source:'TC-HC',sourcePage:'documents',owner:'tochuc',cc:['truongdonvi','lanhdao'],priority:'Cao',status:'Quá hạn',sla:'+2 ngày',overdue:true,from:'Ban Lãnh đạo',project:'-',next:'Ban Lãnh đạo'},
 {id:'ADV-0092',type:'Tạm ứng',title:'Bổ sung hóa đơn hoàn ứng 12,5 triệu',source:'Kế toán',sourcePage:'advances',owner:'chunhiem',cc:['ketoan','ketoantruong'],priority:'Cao',status:'Bị trả bổ sung',sla:'Còn 1 ngày',overdue:false,from:'Kế toán viên',project:'VLDC-2026-014',next:'Kế toán'},
 {id:'TASK-HT-031',type:'Hiện trường',title:'Cập nhật nhật ký và xác nhận 12 km tuyến khảo sát',source:'Hiện trường',sourcePage:'projects',owner:'hientruong',cc:['chunhiem','kythuat'],priority:'Trung bình',status:'Mới',sla:'Hôm nay',overdue:false,from:'Chủ nhiệm dự án',project:'VLDC-2026-014',next:'Chủ nhiệm dự án'},
 {id:'UNIT-047',type:'Điều hành đơn vị',title:'Phân công nhân lực bổ sung cho dự án VLDC-2027-003',source:'Dự án',sourcePage:'projects',owner:'truongdonvi',cc:['chunhiem','lanhdao'],priority:'Cao',status:'Mới',sla:'Còn 6h',overdue:false,from:'Chủ nhiệm dự án',project:'VLDC-2027-003',next:'Chủ nhiệm dự án'},
 {id:'CN-102',type:'Dự án',title:'Cập nhật dự báo hoàn thành và biện pháp xử lý chậm tiến độ',source:'Dự án',sourcePage:'projects',owner:'chunhiem',cc:['truongdonvi','kythuat','lanhdao'],priority:'Cao',status:'Đang xử lý',sla:'Còn 4h',overdue:false,from:'Ban Lãnh đạo',project:'VLDC-2026-014',next:'Trưởng đơn vị'},
 {id:'AR-031',type:'Công nợ',title:'Trình công văn đôn đốc công nợ quá 60 ngày',source:'Kế toán',sourcePage:'receivables',owner:'ketoantruong',cc:['lanhdao','ketoan'],priority:'Cao',status:'Chờ kiểm soát',sla:'Còn 2h',overdue:false,from:'Kế toán viên',project:'HĐ-2026-031',next:'Ban Lãnh đạo'},
 {id:'HR-077',type:'Nhân sự',title:'Xử lý hồ sơ điều động cán bộ sang dự án mới',source:'TC-HC',sourcePage:'hr',owner:'tochuc',cc:['truongdonvi','lanhdao'],priority:'Trung bình',status:'Đang xử lý',sla:'Còn 2 ngày',overdue:false,from:'Trưởng đơn vị',project:'VLDC-2027-003',next:'Ban Lãnh đạo'},
{id:'CD-041',type:'Chỉ đạo',title:'Hoàn thành hồ sơ nghiệm thu VLDC-2027-001',source:'Chỉ đạo điều hành',sourcePage:'directives',owner:'kythuat',cc:['chunhiem','kehoach','lanhdao'],priority:'Cao',status:'Đang thực hiện',sla:'Còn 7 ngày',overdue:false,from:'Ban Lãnh đạo',project:'VLDC-2027-001',next:'Báo cáo kết quả'},
 {id:'KL-099-03',type:'Kết luận họp',title:'Thu hồi công nợ HĐ-2026-031',source:'Cuộc họp',sourcePage:'meetings',owner:'ketoantruong',cc:['ketoan','kehoach','lanhdao'],priority:'Cao',status:'Nguy cơ trễ',sla:'Còn 2 ngày',overdue:false,from:'Kết luận giao ban',project:'HĐ-2026-031',next:'Ban Lãnh đạo'},
 {id:'KL-099-05',type:'Kết luận họp',title:'Bổ sung nhân lực GIS cho ĐVL Biển',source:'Cuộc họp',sourcePage:'meetings',owner:'tochuc',cc:['truongdonvi','lanhdao'],priority:'Trung bình',status:'Đang xử lý',sla:'Còn 4 ngày',overdue:false,from:'Kết luận giao ban',project:'Kế hoạch nhân lực Q4',next:'Đề xuất điều phối'}
 ]

export const commonTasks = (): CommonTask[] => [
 {id:'GEN-001',title:'Cập nhật kế hoạch công tác tuần',scope:'Toàn Liên đoàn',owner:'Tất cả đơn vị',due:'Thứ Sáu 16:00',status:'Định kỳ',link:'plans'},
 {id:'GEN-002',title:'Đọc và xác nhận thông báo điều hành mới',scope:'Toàn Liên đoàn',owner:'Toàn thể cán bộ',due:'Trong ngày',status:'Cần xác nhận',link:'notifications'},
 {id:'GEN-003',title:'Rà soát lịch công tác và các mốc tuần tới',scope:'Đơn vị/Cá nhân',owner:'Tất cả người dùng',due:'Thứ Sáu',status:'Định kỳ',link:'calendar'},
 {id:'GEN-004',title:'Cập nhật tiến độ công việc được giao',scope:'Cá nhân',owner:'Người được giao việc',due:'Cuối ngày',status:'Đang thực hiện',link:'action'},
 {id:'GEN-005',title:'Kiểm tra hồ sơ/tài liệu cần bổ sung metadata',scope:'Theo quyền dữ liệu',owner:'Đơn vị liên quan',due:'Theo SLA',status:'Theo dõi',link:'dms'}
]

/** Due date from the demo SLA text: "Còn 3 ngày" → +3, "+2 ngày" (late) → −2, hours / "Hôm nay" → today. */
export function dueFromSla(sla: string, today: string): string {
  const days = /(\d+)\s*ngày/.exec(sla)
  if (days) return addDays(today, sla.trim().startsWith("+") || /Vượt|Quá/.test(sla) ? -Number(days[1]) : Number(days[1]))
  return /Vượt|Quá/.test(sla) ? addDays(today, -1) : today
}

/** Each task gets a due date and a short trail (created → received → current step), relative to today. */
export function inboxTasks(today: string): InboxTask[] {
  const at = (days: number, hm: string) => `${addDays(today, days)}T${hm}`
  return INBOX_TASKS.map((t, i) => ({
    ...t,
    due: dueFromSla(t.sla, today),
    history: [
      { at: at(-2 - (i % 3), `0${8 + (i % 2)}:${String(10 + i * 3).padStart(2, "0")}`), by: t.from, action: "Khởi tạo" },
      { at: at(-1 - (i % 2), `${10 + (i % 4)}:15`), by: t.owner, action: "Tiếp nhận xử lý" },
      ...(t.status !== "Mới" ? [{ at: at(0, `0${7 + (i % 3)}:40`), by: t.owner, action: t.status }] : []),
    ],
  }))
}

export const decisions = (): Decision[] => [
 {id:'DEC-021',title:'Điều phối thiết bị P-12 cho dự án VLDC-2027-001',unit:'Trung tâm kiểm định / ĐVL Mặt đất',severity:'Cao',due:'Hôm nay',open:true,source:'Thiết bị + Dự án'},
 {id:'DEC-022',title:'Xử lý công nợ HĐ-2026-031 quá hạn 68 ngày',unit:'Kế toán / KH-TC',severity:'Cao',due:'Hôm nay',open:true,source:'Kế toán + Hợp đồng'},
 {id:'DEC-023',title:'Phê duyệt phương án gia hạn Dự án B thêm 18 ngày',unit:'Phòng Kỹ thuật',severity:'Trung bình',due:'09/10',open:true,source:'Dự án + Risk'},
 {id:'DEC-024',title:'Bổ sung nhân lực GIS cho ĐVL Biển',unit:'TC-HC / ĐVL Biển',severity:'Trung bình',due:'11/10',open:true,source:'Nhân sự + KPI'}
]

export function meetings(today: string): Meeting[] {
  const d = (n: number) => vnDate(addDays(today, n))
  const rows: Omit<Meeting, "conclusions">[] = [
 {id:'MTG-101',date:d(1),title:'Giao ban Ban Lãnh đạo mở rộng',time:'08:30',scope:'Toàn Liên đoàn',status:'Sắp diễn ra',agenda:5,docs:8,actions:0,openConclusions:0},
 {id:'MTG-102',date:d(2),title:'Họp xử lý tiến độ Dự án B',time:'14:00',scope:'Kỹ thuật + Chủ nhiệm + KH-TC',status:'Đã chuẩn bị',agenda:4,docs:6,actions:3,openConclusions:3},
 {id:'MTG-099',date:d(-2),title:'Giao ban tuần 40',time:'09:00',scope:'Trưởng đơn vị',status:'Đã kết thúc',agenda:7,docs:10,actions:9,openConclusions:4}
]
  const conclusions: Record<string, Meeting["conclusions"]> = {
    "MTG-099": [
      { text: "Thu hồi công nợ HĐ-2026-031", ownerRole: "ketoantruong", due: d(2), taskId: "KL-099-03" },
      { text: "Bổ sung nhân lực GIS cho ĐVL Biển", ownerRole: "tochuc", due: d(4), taskId: "KL-099-05" },
      { text: "Hoàn thiện hồ sơ nghiệm thu VLDC-2027-001", ownerRole: "kythuat", due: d(7), taskId: "CD-041" },
      { text: "Rà soát thiết bị hết hạn kiểm định quý IV", ownerRole: "trungtam", due: d(5) },
    ],
    "MTG-102": [
      { text: "Phòng Kỹ thuật hoàn thiện phương án xử lý chậm tiến độ VLDC-2026-014", ownerRole: "kythuat", due: d(3) },
      { text: "KH-TC rà soát dự toán điều chỉnh VLDC-2026-014", ownerRole: "kehoach", due: d(4) },
      { text: "Đoàn ĐVL Biển cập nhật phương án an toàn tàu khảo sát", ownerRole: "bien", due: d(5) },
    ],
  }
  return rows.map((m) => ({ ...m, conclusions: conclusions[m.id] ?? [] }))
}

export const strategicGoals = (): StrategicGoal[] => [
 {id:'SG-01',goal:'Hoàn thành đúng hạn nhiệm vụ Nhà nước',owner:'Phòng Kỹ thuật',target:'≥ 92%',actual:86,weight:30},
 {id:'SG-02',goal:'Kiểm soát giải ngân gắn tiến độ kỹ thuật',owner:'KH-TC + Kế toán',target:'Sai lệch ≤ 10%',actual:78,weight:25},
 {id:'SG-03',goal:'Nâng mức sẵn sàng thiết bị',owner:'TT Kiểm định',target:'≥ 90%',actual:84,weight:20},
 {id:'SG-04',goal:'Số hóa hồ sơ và dữ liệu lịch sử',owner:'Các đơn vị',target:'≥ 85%',actual:66,weight:15},
 {id:'SG-05',goal:'Giảm hồ sơ vượt SLA',owner:'Toàn Liên đoàn',target:'< 5%',actual:89,weight:10}
]

export const initiatives = (): Initiative[] => [
 {id:'INI-01',name:'Digital Archive 2027',progress:66},
 {id:'INI-02',name:'Chuẩn hóa thiết bị & QR',progress:84},
 {id:'INI-03',name:'Project Cost Control',progress:78},
 {id:'INI-04',name:'Field Mobile',progress:42}
]

/** probability × impact: ≥ 15 cao, ≥ 8 trung bình. */
export const risks = (): Risk[] => [
 {id:'R-021',title:'Dự án VLDC-2026-014 chậm tiến độ',owner:'Phòng Kỹ thuật',probability:5,impact:5,mitigation:'Gia hạn + điều phối nguồn lực',open:true,project:'VLDC-2026-014'},
 {id:'R-028',title:'Công nợ HĐ-2026-031 quá hạn',owner:'Kế toán trưởng',probability:4,impact:5,mitigation:'Công văn đôn đốc + escalation',open:true},
 {id:'R-024',title:'Thiết bị hết hạn kiểm định',owner:'TT Kiểm định',probability:3,impact:4,mitigation:'Ưu tiên lịch kiểm định',open:true},
 {id:'R-031',title:'Thiếu nhân lực GIS cho ĐVL Biển',owner:'Phòng TC-HC',probability:3,impact:3,mitigation:'Điều động tạm thời từ Phòng Kỹ thuật',open:true,project:'VLDC-2026-014'},
 {id:'R-033',title:'Thời tiết mùa mưa bão ảnh hưởng khảo sát biển',owner:'Đoàn ĐVL Biển',probability:4,impact:3,mitigation:'Phương án an toàn tàu + lịch dự phòng',open:true,project:'VLDC-2026-018'},
 {id:'R-019',title:'Sai lệch định mức đơn giá đo điện',owner:'Phòng KH-TC',probability:2,impact:3,mitigation:'Đã điều chỉnh dự toán',open:false,project:'VLDC-2027-001'}
]
