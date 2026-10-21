import { addDays, vnDate } from "../dates.ts"
import type { CalendarEvent, Notice, Plan } from "../types.ts"

export function calendarEvents(today: string): CalendarEvent[] {
  const d = (n: number) => vnDate(addDays(today, n))
  return [
 {id:'EV-001',date:d(0),time:'09:00',title:'Họp giao ban Liên đoàn',scope:'federation',unit:'Toàn Liên đoàn',project:'-',owner:'lanhdao',link:'action',note:'Báo cáo tiến độ, tài chính, công nợ và các việc cần quyết định.'},
 {id:'EV-002',date:d(0),time:'14:00',title:'Kiểm tra tiến độ VLDC-2027-001',scope:'project',unit:'Phòng Kỹ thuật',project:'VLDC-2027-001',owner:'kythuat',link:'projects',note:'Kiểm tra khối lượng, hồ sơ nghiệm thu và các issue mở.'},
 {id:'EV-003',date:d(0),time:'16:00',title:'Họp Phòng Kỹ thuật',scope:'unit',unit:'Phòng Kỹ thuật',project:'-',owner:'kythuat',link:'projects',note:'Rà soát kế hoạch tuần và phân công kiểm tra hiện trường.'},
 {id:'EV-004',date:d(1),time:'08:30',title:'Đối chiếu công nợ >60 ngày',scope:'unit',unit:'Phòng Kế hoạch - Tài chính',project:'-',owner:'ketoantruong',link:'receivables',note:'Kế toán + KH-TC + Ban Lãnh đạo.'},
 {id:'EV-005',date:d(1),time:'14:00',title:'Nghiệm thu hạng mục đo điện',scope:'project',unit:'Phòng Kỹ thuật',project:'VLDC-2027-001',owner:'chunhiem',link:'projects',note:'Checklist kỹ thuật phải hoàn thành trước 12:00.'},
 {id:'EV-006',date:d(2),time:'08:00',title:'Khóa dữ liệu báo cáo tháng',scope:'federation',unit:'Toàn Liên đoàn',project:'-',owner:'kehoach',link:'reports',note:'Các đơn vị hoàn thành cập nhật số liệu trước thời điểm khóa.'},
 {id:'EV-007',date:d(2),time:'15:00',title:'Làm việc với nhà cung cấp thiết bị',scope:'unit',unit:'Phòng Tổ chức - Hành chính',project:'-',owner:'tochuc',link:'equipment',note:'Rà soát hồ sơ bàn giao, bảo hành và lịch kiểm định.'},
 {id:'EV-008',date:d(3),time:'07:30',title:'Khảo sát tuyến T12-T15',scope:'project',unit:'Đoàn ĐVL Biển',project:'VLDC-2026-014',owner:'hientruong',link:'projects',note:'Cập nhật GPS, ảnh, nhật ký và khối lượng trong ngày.'},
 {id:'EV-009',date:d(4),time:'09:00',title:'Kiểm soát hồ sơ thanh toán PAY-SEED-2',scope:'personal',unit:'Phòng Kế toán',project:'VLDC-2027-001',owner:'ketoantruong',link:'payments',note:'Kiểm tra hóa đơn, nghiệm thu và nguồn kinh phí.'},
 {id:'EV-010',date:d(4),time:'14:30',title:'Phê duyệt điều chỉnh kế hoạch quý IV',scope:'federation',unit:'Ban Lãnh đạo',project:'-',owner:'lanhdao',link:'plans',note:'Căn cứ kết quả 9 tháng và dự báo quý IV.'},
 {id:'EV-011',date:d(5),time:'10:00',title:'Họp điều phối nhân lực dự án',scope:'unit',unit:'Đoàn ĐVL Mặt đất',project:'VLDC-2027-003',owner:'truongdonvi',link:'hr',note:'Điều phối bổ sung nhân lực theo kế hoạch tuần.'},
 {id:'EV-012',date:d(6),time:'08:30',title:'Kiểm tra checklist khóa sổ',scope:'unit',unit:'Phòng Kế toán',project:'-',owner:'ketoantruong',link:'closing',note:'Đối chiếu ngân hàng, tạm ứng, công nợ và tài sản.'}
]
}

export const plans = (): Plan[] => [
 {id:'PL-FED-2026-Q4',level:'Liên đoàn',scope:'federation',title:'Kế hoạch trọng tâm Quý IV/2026',period:'01/10 - 31/12/2026',owner:'Ban Lãnh đạo',progress:18,status:'Đang thực hiện',parent:'-',items:['Hoàn thành các nhiệm vụ có hạn trong năm','Đẩy nhanh nghiệm thu và giải ngân','Xử lý công nợ quá hạn','Hoàn thiện kế hoạch 2027']},
 {id:'PL-KT-1026',level:'Đơn vị',scope:'unit',unit:'Phòng Kỹ thuật',title:'Kế hoạch công tác Phòng Kỹ thuật tháng 10',period:'01/10 - 31/10/2026',owner:'Trưởng phòng Kỹ thuật',progress:36,status:'Đang thực hiện',parent:'PL-FED-2026-Q4',items:['Kiểm tra 4 nhiệm vụ','Nghiệm thu 2 hạng mục','Hoàn thiện 3 báo cáo kỹ thuật']},
 {id:'PL-KTTC-1026',level:'Đơn vị',scope:'unit',unit:'Phòng Kế hoạch - Tài chính',title:'Kế hoạch KH-TC tháng 10',period:'01/10 - 31/10/2026',owner:'Phòng KH-TC',progress:42,status:'Đang thực hiện',parent:'PL-FED-2026-Q4',items:['Rà soát kế hoạch vốn','Đối chiếu dự toán','Tổng hợp báo cáo tháng']},
 {id:'PL-KT-ACC-1026',level:'Đơn vị',scope:'unit',unit:'Phòng Kế toán',title:'Kế hoạch kế toán tháng 10',period:'01/10 - 31/10/2026',owner:'Kế toán trưởng',progress:48,status:'Đang thực hiện',parent:'PL-FED-2026-Q4',items:['Khóa sổ tháng 9','Đối chiếu công nợ','Hoàn ứng quá hạn','Lập dự báo dòng tiền']},
 {id:'PL-DA-001',level:'Dự án',scope:'project',project:'VLDC-2027-001',title:'Kế hoạch tháng 10 • VLDC-2027-001',period:'01/10 - 31/10/2026',owner:'Chủ nhiệm dự án',progress:52,status:'Có nguy cơ',parent:'PL-KT-1026',items:['Hoàn thành 80 km tuyến','Nghiệm thu hạng mục đo điện','Hoàn thiện báo cáo tháng']},
 {id:'PL-DA-014',level:'Dự án',scope:'project',project:'VLDC-2026-014',title:'Kế hoạch hiện trường • VLDC-2026-014',period:'08/10 - 20/10/2026',owner:'Chủ nhiệm dự án',progress:31,status:'Đang thực hiện',parent:'PL-FED-2026-Q4',items:['Khảo sát T12-T15','Kiểm tra thiết bị','Cập nhật nhật ký hằng ngày']},
 {id:'PL-PER-HT',level:'Cá nhân',scope:'personal',ownerRole:'hientruong',title:'Kế hoạch cá nhân tuần 41',period:'08/10 - 14/10/2026',owner:'Nguyễn Đức Hải',progress:40,status:'Đang thực hiện',parent:'PL-DA-014',items:['Khảo sát 36 km','Cập nhật GPS','Nộp nhật ký cuối ngày']},
 {id:'PL-PER-CN',level:'Cá nhân',scope:'personal',ownerRole:'chunhiem',title:'Kế hoạch Chủ nhiệm tuần 41',period:'08/10 - 14/10/2026',owner:'Lê Hoàng Nam',progress:55,status:'Đang thực hiện',parent:'PL-DA-001',items:['Xử lý issue tiến độ','Chuẩn bị nghiệm thu','Cập nhật forecast']}
]

export function notices(today: string): Notice[] {
  const t = (n: number, hm: string) => `${vnDate(addDays(today, n)).slice(0, 5)} ${hm}`
  return [
 {id:'NTF-001',scope:'federation',title:'Thông báo lịch giao ban tuần',body:'Họp giao ban toàn Liên đoàn lúc 09:00 ngày 08/10/2026. Các đơn vị cập nhật số liệu trước 08:00.',time:t(-1,'16:20'),priority:'Bình thường',readBy:[],link:'calendar'},
 {id:'NTF-002',scope:'federation',title:'Yêu cầu cập nhật kế hoạch Quý IV',body:'Các phòng/đơn vị hoàn thiện kế hoạch Quý IV và gửi phê duyệt trước 12/10.',time:t(-1,'15:05'),priority:'Cao',readBy:[],link:'plans'},
 {id:'NTF-003',scope:'unit',unit:'Phòng Kỹ thuật',title:'Phân công kiểm tra dự án VLDC-2027-001',body:'Phòng Kỹ thuật kiểm tra khối lượng và hồ sơ nghiệm thu lúc 14:00 ngày 08/10.',time:t(0,'07:30'),priority:'Cao',readBy:[],link:'projects'},
 {id:'NTF-004',scope:'unit',unit:'Phòng Kế toán',title:'Nhắc hoàn thành đối chiếu công nợ',body:'Còn 3 khách hàng chưa xác nhận công nợ; hoàn thành trước cuộc họp ngày 09/10.',time:t(0,'08:10'),priority:'Cao',readBy:[],link:'receivables'},
 {id:'NTF-005',scope:'project',project:'VLDC-2027-001',title:'Milestone nghiệm thu sắp đến hạn',body:'Nghiệm thu hạng mục đo điện vào 09/10. Checklist còn 2 mục chưa hoàn tất.',time:t(0,'08:25'),priority:'Cao',readBy:[],link:'projects'},
 {id:'NTF-006',scope:'personal',ownerRole:'kehoach',title:'Hồ sơ PAY-SEED-1 đã chuyển đến bạn',body:'Chủ nhiệm dự án đã lập đề nghị thanh toán khảo sát đợt 2. Cần xác nhận nguồn và dự toán.',time:t(0,'09:05'),priority:'Cao',readBy:[],link:'payments'},
 {id:'NTF-007',scope:'personal',ownerRole:'lanhdao',title:'3 hồ sơ cần quyết định hôm nay',body:'Thanh toán 680 triệu, điều chuyển máy P-12 và trình ký Kế hoạch 2027.',time:t(0,'08:45'),priority:'Cao',readBy:[],link:'action'},
 {id:'NTF-008',scope:'project',project:'VLDC-2026-014',title:'Cảnh báo tiến độ dự án',body:'Cost 81% trong khi tiến độ kỹ thuật 42%. Yêu cầu Chủ nhiệm cập nhật forecast.',time:t(0,'09:10'),priority:'Cao',readBy:[],link:'projects'},
 {id:'NTF-009',scope:'unit',unit:'Phòng Tổ chức - Hành chính',title:'Lịch kiểm định thiết bị tháng 10',body:'Có 8 thiết bị cần kiểm định/hiệu chuẩn trong 30 ngày tới.',time:t(0,'09:20'),priority:'Bình thường',readBy:['lanhdao','tochuc'],link:'equipment'},
 {id:'NTF-010',scope:'personal',ownerRole:'hientruong',title:'Nhắc cập nhật nhật ký hiện trường',body:'Nhật ký và ảnh GPS phải hoàn tất trước 18:00 hôm nay.',time:t(0,'10:00'),priority:'Bình thường',readBy:[],link:'projects'}
]
}
