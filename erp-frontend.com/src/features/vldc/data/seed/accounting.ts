import { addDays } from "../dates.ts"
import type { Advance, BankAccount, BankLine, CashflowMonth, ClosingTask, FixedAsset, Voucher } from "../types.ts"

/** Accounting records; money in million VND unless noted. Payment dossiers themselves live in the workflow (PAY-SEED-*). */
export function vouchers(today: string): Voucher[] {
  const d = (n: number) => addDays(today, n)
  return [
   {id:'UNC-260918',date:d(-1),type:'Ủy nhiệm chi',counterparty:'Công ty Thiết bị A',projectId:'VLDC-2027-001',amount:680,status:'Chờ ký duyệt',fundSource:'NSNN',workItemId:'PAY-SEED-3',contractId:'HĐ-MH-022',note:'Thanh toán thuê máy đo từ P-12 đợt 2'},
   {id:'PC-260401',date:d(-1),type:'Phiếu chi',counterparty:'Nguyễn Văn A',projectId:'VLDC-2026-014',amount:30,status:'Đã ghi sổ',fundSource:'NSNN',note:'Tạm ứng công tác biển (ADV-0092)'},
   {id:'CT-260233',date:d(-2),type:'Chứng từ khác',counterparty:'Đoàn ĐVL Mặt đất',projectId:'VLDC-2027-001',amount:120,status:'Cần bổ sung',fundSource:'NSNN',note:'Hạch toán chi phí đo điện – thiếu biên bản nghiệm thu'},
   {id:'PT-260077',date:d(-1),type:'Phiếu thu',counterparty:'Đối tác C',projectId:'VLDC-2026-022',amount:200,status:'Đã ghi sổ',fundSource:'Dịch vụ',contractId:'HĐ-2026-044'},
   {id:'UNC-260911',date:d(-5),type:'Ủy nhiệm chi',counterparty:'Dịch vụ D',projectId:'VLDC-2026-014',amount:480,status:'Đã ghi sổ',fundSource:'NSNN',contractId:'HĐ-DV-119'},
   {id:'PT-260071',date:d(-8),type:'Phiếu thu',counterparty:'Công ty B',projectId:'VLDC-2027-001',amount:800,status:'Đã ghi sổ',fundSource:'Dịch vụ',contractId:'HĐ-2026-031'},
   {id:'UNC-260905',date:d(-10),type:'Ủy nhiệm chi',counterparty:'Công ty Thiết bị A',projectId:'VLDC-2027-001',amount:750,status:'Đã ghi sổ',fundSource:'NSNN',contractId:'HĐ-MH-022'},
   {id:'PC-260398',date:d(-3),type:'Phiếu chi',counterparty:'Lê Hoàng Nam',projectId:'VLDC-2027-001',amount:45,status:'Chờ kiểm soát',fundSource:'NSNN',note:'Chi phí hiện trường tuyến T3'}
  ]
}

export function advances(today: string): Advance[] {
  const d = (n: number) => addDays(today, n)
  return [
   {id:'ADV-0092',person:'Nguyễn Văn A',projectId:'VLDC-2026-014',amount:30,returned:17.5,due:d(-3),missingInvoice:true},
   {id:'ADV-0088',person:'Lê Hoàng Nam',projectId:'VLDC-2027-001',amount:120,returned:40,due:d(-10),missingInvoice:false},
   {id:'ADV-0090',person:'Nguyễn Đức Hải',projectId:'VLDC-2026-014',amount:85,returned:0,due:d(-15),missingInvoice:true},
   {id:'ADV-0093',person:'Trần Quốc Hùng',projectId:'VLDC-2027-003',amount:60,returned:0,due:d(12),missingInvoice:false},
   {id:'ADV-0094',person:'Phạm Thu Hà',projectId:'VLDC-2027-001',amount:25,returned:25,due:d(-2),missingInvoice:false},
   {id:'ADV-0095',person:'Bùi Minh Thành',projectId:'VLDC-2026-022',amount:150,returned:60,due:d(-20),missingInvoice:false},
   {id:'ADV-0096',person:'Lê Quang Cường',projectId:'VLDC-2026-018',amount:70,returned:0,due:d(5),missingInvoice:false}
  ]
}

export const bankAccounts = (): BankAccount[] => [
 {id:'BA-1288',name:'Vietcombank ***1288',erpBalance:8420,statementBalance:8238},
 {id:'BA-0021',name:'BIDV ***0021',erpBalance:4180,statementBalance:4180},
 {id:'CASH',name:'Quỹ tiền mặt',erpBalance:125,statementBalance:125}
]

export function bankLines(today: string): BankLine[] {
  const d = (n: number) => addDays(today, n)
  return [
   {id:'BL-01',date:d(-1),text:'CTY THIET BI A TT HD MH022',amount:-680,suggestedVoucherId:'UNC-260918',confidence:98},
   {id:'BL-02',date:d(-1),text:'DOI TAC C CK HD 044',amount:200,suggestedVoucherId:'PT-260077',confidence:95,matchedVoucherId:'PT-260077'},
   {id:'BL-03',date:d(-2),text:'PHI DICH VU NGAN HANG',amount:-2,confidence:0}
  ]
}

export const fixedAssets = (): FixedAsset[] => [
 {id:'TS-00281',name:'Proton Magnetometer P-12',equipmentId:'P-12',cost:2850,nbv:1920,unit:'Đoàn ĐVL Mặt đất',source:'NSNN',status:'Khớp hồ sơ kỹ thuật'},
 {id:'TS-00162',name:'Máy đo trọng lực ZLS-B37',equipmentId:'EQ-021',cost:3200,nbv:980,unit:'TT Kiểm định',source:'NSNN',status:'Lệch đơn vị quản lý'},
 {id:'TS-00305',name:'Hệ thống phổ gamma hàng không AGRS',equipmentId:'EQ-036',cost:12500,nbv:7300,unit:'Đoàn ĐVL Hàng không',source:'NSNN',status:'Khớp hồ sơ kỹ thuật'},
 {id:'TS-00198',name:'Tổ hợp địa chấn MARK-6',equipmentId:'EQ-003',cost:4100,nbv:0,unit:'Đoàn ĐVL Mặt đất',source:'NSNN',status:'Hết khấu hao'}
]

/** Closing checklist of the previous month. */
export function closingTasks(today: string): ClosingTask[] {
  const [y, m] = addDays(today, -30).split("-")
  const period = `${m}/${y}`
  return [
   {id:'CL-01',period,item:'Đối chiếu số dư ngân hàng',owner:'Kế toán viên',done:true,note:'Khớp 2/3 tài khoản'},
   {id:'CL-02',period,item:'Trích khấu hao TSCĐ',owner:'Kế toán viên',done:true,note:''},
   {id:'CL-03',period,item:'Kết chuyển chi phí dự án',owner:'Kế toán viên',done:true,note:''},
   {id:'CL-04',period,item:'Đối chiếu, xử lý tạm ứng quá hạn',owner:'Kế toán trưởng',done:false,note:'Còn hồ sơ thiếu hóa đơn'},
   {id:'CL-05',period,item:'Xác nhận công nợ phải thu',owner:'Kế toán trưởng',done:false,note:'Chờ Công ty B xác nhận'}
  ]
}

/** Next three months, billion VND. */
export function cashflow(today: string): CashflowMonth[] {
  const base = new Date(`${today}T00:00:00Z`)
  const plan = [[6.2, 4.8], [4.5, 5.1], [7.8, 6.0]]
  return plan.map(([inflow, outflow], i) => {
    const dt = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + i + 1, 1))
    return { id: `CF-${i + 1}`, month: `T${dt.getUTCMonth() + 1}/${dt.getUTCFullYear()}`, inflow, outflow }
  })
}
