import { addDays } from "../dates.ts"
import type { IncomingDocument } from "../../../../types/incomingDocument.ts"
import type { OutgoingDocument } from "../../../../types/outgoingDocument.ts"
import type { Handoff } from "../types.ts"

/** Hand-offs between departments; PAY refs point at workflow payment dossiers. */
export const handoffs = (): Handoff[] => [
 {id:'HO-01',ref:'PAY-SEED-2',from:'Kế toán viên',to:'Kế toán trưởng',condition:'Đủ chứng từ, đã đối chiếu nguồn kinh phí',slaHours:4,status:'Đang chờ',workItemId:'PAY-SEED-2'},
 {id:'HO-02',ref:'NT-2026-045',from:'Phòng Kỹ thuật',to:'Phòng KH-TC',condition:'Biên bản nghiệm thu khối lượng đo điện',slaHours:24,status:'Đã bàn giao'},
 {id:'HO-03',ref:'FA-021',from:'Phòng TC-HC',to:'Kế toán',condition:'Biên bản bàn giao máy P-12, xác nhận nguyên giá',slaHours:48,status:'Quá hạn'},
 {id:'HO-04',ref:'AR-031',from:'Kế toán trưởng',to:'Ban Lãnh đạo',condition:'Dự thảo công văn đôn đốc công nợ HĐ-2026-031',slaHours:8,status:'Đang chờ'}
]

const log = (id: string, action: string, actor: string, role: string, timestamp: string, note?: string) => ({ id, action, actor, role, timestamp, ...(note ? { note } : {}) })

/** VLDC documents added to the shared incoming/outgoing collections (the React document pages show them too). */
export function incomingDocuments(today: string): IncomingDocument[] {
  const d = (n: number) => addDays(today, n)
  return [
   {id:'vldc-in-1288',documentNumber:'CV-ĐEN-1288',releaseDate:d(-3),receivedDate:`${d(-2)} 08:20`,summary:'Đề nghị báo cáo tình hình thực hiện nhiệm vụ năm 2026 và kế hoạch năm 2027',senderUnit:'Cục Địa chất Việt Nam',documentType:'Công văn',urgency:'Khẩn',status:'Đang xử lý',assignedToUnit:'Phòng Kế hoạch - Tài chính',assignedToUser:'Vũ Thị Lan',coordinatingUnits:['Phòng Kỹ thuật'],dueDate:d(1),instruction:'KH-TC chủ trì tổng hợp, Phòng Kỹ thuật cung cấp số liệu khối lượng.',attachments:[],
    processHistory:[log('vin-1288-1','Tiếp nhận văn bản','Đỗ Minh Anh','Văn thư',`${d(-2)} 08:20`),log('vin-1288-2','Phân công xử lý','Nguyễn Văn Minh','Liên đoàn trưởng',`${d(-2)} 10:05`,'Giao KH-TC chủ trì'),log('vin-1288-3','Cập nhật tiến độ','Vũ Thị Lan','Chuyên viên KH-TC',`${d(-1)} 15:30`,'Đã có số liệu 3 Đoàn')],
    createdAt:`${d(-2)}T08:20:00.000Z`,updatedAt:`${d(-1)}T15:30:00.000Z`},
   {id:'vldc-in-1281',documentNumber:'CV-ĐEN-1281',releaseDate:d(-9),receivedDate:`${d(-8)} 09:00`,summary:'Quyết định giao dự toán bổ sung nhiệm vụ VLDC-2027-003',senderUnit:'Cục Địa chất Việt Nam',documentType:'Quyết định',urgency:'Bình thường',status:'Hoàn thành',assignedToUnit:'Phòng Kế hoạch - Tài chính',assignedToUser:'Vũ Thị Lan',dueDate:d(-3),attachments:[],
    processHistory:[log('vin-1281-1','Tiếp nhận văn bản','Đỗ Minh Anh','Văn thư',`${d(-8)} 09:00`),log('vin-1281-2','Hoàn thành','Vũ Thị Lan','Chuyên viên KH-TC',`${d(-4)} 16:00`,'Đã cập nhật dự toán')],
    createdAt:`${d(-8)}T09:00:00.000Z`,updatedAt:`${d(-4)}T16:00:00.000Z`},
   {id:'vldc-in-1290',documentNumber:'CV-ĐEN-1290',releaseDate:d(-1),receivedDate:`${d(0)} 08:05`,summary:'Mời họp tổng kết công tác điều tra địa vật lý biển năm 2026',senderUnit:'Viện Địa chất và Địa vật lý biển',documentType:'Công văn',urgency:'Bình thường',status:'Mới tiếp nhận',dueDate:d(5),attachments:[],
    processHistory:[log('vin-1290-1','Tiếp nhận văn bản','Đỗ Minh Anh','Văn thư',`${d(0)} 08:05`)],
    createdAt:`${d(0)}T08:05:00.000Z`,updatedAt:`${d(0)}T08:05:00.000Z`},
   {id:'vldc-in-1279',documentNumber:'CV-ĐEN-1279',releaseDate:d(-12),receivedDate:`${d(-11)} 14:00`,summary:'Yêu cầu báo cáo tình hình kiểm định thiết bị quý III',senderUnit:'Cục Địa chất Việt Nam',documentType:'Công văn',urgency:'Khẩn',status:'Đang xử lý',assignedToUnit:'Phòng Tổ chức - Hành chính',assignedToUser:'Đỗ Minh Anh',dueDate:d(-2),attachments:[],
    processHistory:[log('vin-1279-1','Tiếp nhận văn bản','Đỗ Minh Anh','Văn thư',`${d(-11)} 14:00`)],
    createdAt:`${d(-11)}T14:00:00.000Z`,updatedAt:`${d(-11)}T14:00:00.000Z`}
  ]
}

export function outgoingDocuments(today: string): OutgoingDocument[] {
  const d = (n: number) => addDays(today, n)
  return [
   {id:'vldc-out-2027',documentNumber:'Dự thảo KH-2027',summary:'Kế hoạch nhiệm vụ năm 2027 của Liên đoàn',documentType:'Kế hoạch',urgency:'Khẩn',status:'Chờ ký',draftingUnit:'Phòng Tổ chức - Hành chính',drafterName:'Đỗ Minh Anh',approverName:'Nguyễn Văn Minh (Liên đoàn trưởng)',recipients:'Cục Địa chất Việt Nam; các đơn vị trực thuộc',submittedDate:`${d(0)} 07:45`,attachments:[],
    processHistory:[log('vout-2027-1','Tạo bản dự thảo','Đỗ Minh Anh','Chuyên viên TC-HC',`${d(-3)} 10:00`),log('vout-2027-2','Trình ký văn bản','Đỗ Minh Anh','Chuyên viên TC-HC',`${d(0)} 07:45`)],
    createdAt:`${d(-3)}T10:00:00.000Z`,updatedAt:`${d(0)}T07:45:00.000Z`},
   {id:'vldc-out-1192',documentNumber:'Dự thảo BC-TB-Q3',summary:'Báo cáo tình hình thiết bị quý III/2026',documentType:'Báo cáo',urgency:'Bình thường',status:'Dự thảo',draftingUnit:'Phòng Tổ chức - Hành chính',drafterName:'Đỗ Minh Anh',approverName:'Nguyễn Văn Minh (Liên đoàn trưởng)',recipients:'Cục Địa chất Việt Nam',attachments:[],
    processHistory:[log('vout-1192-1','Tạo bản dự thảo','Đỗ Minh Anh','Chuyên viên TC-HC',`${d(-4)} 09:00`)],
    createdAt:`${d(-4)}T09:00:00.000Z`,updatedAt:`${d(-4)}T09:00:00.000Z`}
  ]
}
