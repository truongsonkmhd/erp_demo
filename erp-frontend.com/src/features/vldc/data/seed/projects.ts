import type { Disbursement, FinanceLine, Project } from "../types.ts"

/** budget in billion VND; technical / costUsed in %. */
export const projects = (): Project[] => [
 {id:'VLDC-2027-001',name:'Điều tra địa vật lý khu vực A',unit:'Đoàn ĐVL Mặt đất',technical:62,costUsed:68,budget:10,delayDays:12,upcomingMilestones:3,changeRequests:2,changeRequestsPending:1,wbs:[{name:'Đo từ tuyến T1–T8',progress:78,status:'Đang thực hiện'},{name:'Đo điện tuyến T3',progress:55,status:'Chậm'},{name:'Xử lý số liệu đợt 1',progress:40,status:'Đang thực hiện'}]},
 {id:'VLDC-2026-014',name:'Khảo sát địa vật lý biển B',unit:'Đoàn ĐVL Biển',technical:42,costUsed:81,budget:8.4,delayDays:28,upcomingMilestones:2,changeRequests:2,changeRequestsPending:1,wbs:[{name:'Khảo sát tuyến T12–T15',progress:35,status:'Chậm'},{name:'Thuê tàu & an toàn',progress:90,status:'Đang thực hiện'},{name:'Xử lý địa chấn nông',progress:20,status:'Chậm'}]},
 {id:'VLDC-2026-022',name:'Bay đo từ – phổ gamma tờ F-48',unit:'Đoàn ĐVL Hàng không',technical:76,costUsed:73,budget:6.5,delayDays:0,upcomingMilestones:2,changeRequests:0,changeRequestsPending:0,wbs:[{name:'Bay đo khối F-48',progress:85,status:'Đang thực hiện'},{name:'Hiệu chỉnh phổ gamma',progress:100,status:'Hoàn thành'},{name:'Biên tập bản đồ',progress:45,status:'Đang thực hiện'}]},
 {id:'VLDC-2027-003',name:'Đo sâu điện đứng vùng mỏ C',unit:'Đoàn ĐVL Mặt đất',technical:18,costUsed:15,budget:9.2,delayDays:0,upcomingMilestones:1,changeRequests:1,changeRequestsPending:0,wbs:[{name:'Khảo sát sơ bộ',progress:60,status:'Đang thực hiện'},{name:'Thiết kế mạng tuyến',progress:10,status:'Chưa bắt đầu'}]},
 {id:'VLDC-2026-018',name:'Địa chấn nông ven biển miền Trung',unit:'Đoàn ĐVL Biển',technical:88,costUsed:84,budget:7.8,delayDays:5,upcomingMilestones:2,changeRequests:1,changeRequestsPending:0,wbs:[{name:'Đo địa chấn nông',progress:95,status:'Đang thực hiện'},{name:'Báo cáo tổng kết',progress:70,status:'Đang thực hiện'}]},
 {id:'VLDC-2026-030',name:'Hiệu chuẩn hệ thống đo trọng lực',unit:'TT Kiểm định',technical:55,costUsed:50,budget:3.1,delayDays:0,upcomingMilestones:1,changeRequests:0,changeRequestsPending:0,wbs:[{name:'Hiệu chuẩn CG-5',progress:100,status:'Hoàn thành'},{name:'Hiệu chuẩn ZLS-B37',progress:30,status:'Đang thực hiện'}]}
]

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
