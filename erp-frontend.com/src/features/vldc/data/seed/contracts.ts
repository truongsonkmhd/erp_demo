import { addDays } from "../dates.ts"
import type { Contract } from "../types.ts"

/** Receivable ("thu") and payable ("chi") contracts; money in million VND. Debts are derived from the milestones. */
export function contracts(today: string): Contract[] {
  const d = (n: number) => addDays(today, n)
  return [
   {id:'HĐ-2026-031',kind:'thu',party:'Công ty B',name:'Khảo sát địa vật lý phục vụ quy hoạch khu A',value:3000,projectId:'VLDC-2027-001',stage:'Thu hồi công nợ',nextObligation:'Thu đợt 2 – đã quá hạn',risk:'Cao',
    obligations:['Bàn giao báo cáo kết quả đợt 2','Đối chiếu, xác nhận công nợ'],
    milestones:[{name:'Đợt 1 – tạm ứng',value:1000,invoiced:1000,paid:1000,due:d(-150)},{name:'Đợt 2 – nghiệm thu khối lượng',value:1200,invoiced:1200,paid:0,due:d(-68)},{name:'Đợt 3 – bàn giao dữ liệu',value:800,invoiced:800,paid:800,due:d(-30)}]},
   {id:'HĐ-2026-044',kind:'thu',party:'Đối tác C',name:'Bay đo phổ gamma phục vụ tìm kiếm khoáng sản',value:1800,projectId:'VLDC-2026-022',stage:'Đang thực hiện',nextObligation:'Thu phần còn lại đợt 2',risk:'Trung bình',
    obligations:['Bàn giao bản đồ trường gamma'],
    milestones:[{name:'Đợt 1',value:900,invoiced:900,paid:900,due:d(-60)},{name:'Đợt 2',value:900,invoiced:900,paid:200,due:d(-20)}]},
   {id:'HĐ-2026-018',kind:'thu',party:'Sở TN&MT tỉnh D',name:'Địa chấn nông ven biển',value:1200,projectId:'VLDC-2026-018',stage:'Đang thực hiện',nextObligation:'Nghiệm thu đợt 2',risk:'Thấp',
    obligations:['Nộp báo cáo tổng kết'],
    milestones:[{name:'Đợt 1',value:600,invoiced:600,paid:600,due:d(-45)},{name:'Đợt 2',value:600,invoiced:0,paid:0,due:d(40)}]},
   {id:'HĐ-2026-052',kind:'thu',party:'Công ty E',name:'Dịch vụ hiệu chuẩn thiết bị đo trọng lực',value:900,projectId:'VLDC-2026-030',stage:'Thu hồi công nợ',nextObligation:'Gửi công văn đôn đốc',risk:'Cao',
    obligations:['Cấp giấy chứng nhận hiệu chuẩn'],
    milestones:[{name:'Thanh toán một lần',value:900,invoiced:900,paid:200,due:d(-75)}]},
   {id:'HĐ-MH-022',kind:'chi',party:'Công ty Thiết bị A',name:'Thuê máy đo từ P-12',value:1430,projectId:'VLDC-2027-001',stage:'Thanh toán',nextObligation:'Thanh toán đợt 2 sau nghiệm thu',risk:'Trung bình',
    obligations:['Nghiệm thu bàn giao thiết bị'],
    milestones:[{name:'Đợt 1',value:750,invoiced:750,paid:750,due:d(-30)},{name:'Đợt 2',value:680,invoiced:680,paid:0,due:d(5)}]},
   {id:'HĐ-DV-119',kind:'chi',party:'Dịch vụ D',name:'Thuê tàu khảo sát biển',value:800,projectId:'VLDC-2026-014',stage:'Thanh toán',nextObligation:'Thanh toán đợt cuối',risk:'Thấp',
    obligations:['Biên bản xác nhận ngày tàu'],
    milestones:[{name:'Đợt 1',value:480,invoiced:480,paid:480,due:d(-40)},{name:'Đợt cuối',value:320,invoiced:320,paid:0,due:d(-5)}]}
  ]
}
