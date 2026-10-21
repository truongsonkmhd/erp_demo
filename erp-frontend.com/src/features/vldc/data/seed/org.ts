import type { DigitalAdoption, OrgStats, OrgUnit, ResearchProject } from "../types.ts"

/** Organisation and capability figures published on vatlydiachat.gov.vn. */
export const orgUnits = (): OrgUnit[] => [
 {id:'BLD',name:'Ban Lãnh đạo Liên đoàn',type:'Điều hành',leader:'Liên đoàn trưởng & các Phó Liên đoàn trưởng',staff:'-',staffCount:0,mission:'Chỉ đạo toàn diện hoạt động của Liên đoàn; phân công lĩnh vực, ban hành quy chế và quyết định quản trị.',public:true},
 {id:'TCHC',name:'Phòng Tổ chức – Hành chính',type:'Bộ máy giúp việc',leader:'Nguyễn Thị Hồng Minh',deputy:'Quách Văn Hiểu',staff:'Theo biên chế được giao',staffCount:0,mission:'Tổ chức bộ máy, nhân sự, chế độ chính sách, thi đua, đào tạo; văn thư–lưu trữ; hành chính, hậu cần, xe, ATLĐ, PCCC, cơ sở vật chất; tổng hợp và thông báo kết luận lãnh đạo.',public:true},
 {id:'KT',name:'Phòng Kỹ thuật',type:'Bộ máy giúp việc',leader:'Nguyễn Vân Sang',staff:'Theo biên chế được giao',staffCount:0,mission:'Tham mưu xây dựng và triển khai nhiệm vụ địa chất–địa vật lý; quản lý khoa học kỹ thuật, chất lượng, kiểm tra, nghiệm thu, dữ liệu chuyên môn và dịch vụ kỹ thuật.',public:true},
 {id:'KHTC',name:'Phòng Kế hoạch – Tài chính',type:'Bộ máy giúp việc',leader:'Nguyễn Thị Lan Hương',deputy:'Nguyễn Thị Kim Nhung; Phạm Thị Huệ Linh',staff:'Theo biên chế được giao',staffCount:0,mission:'Kế hoạch, dự toán, định mức–đơn giá, hợp đồng kinh tế, tài chính–kế toán, công nợ, tài sản theo giá trị, thanh quyết toán và báo cáo tài chính.',public:true},
 {id:'HK',name:'Đoàn Địa vật lý Hàng không',type:'Đơn vị trực thuộc',leader:'Bùi Minh Thành',staff:'20 người',staffCount:20,mission:'Điều tra địa vật lý hàng không phục vụ điều tra cơ bản địa chất, khoáng sản trên đất liền và trên biển; thực hiện dịch vụ sự nghiệp công và dịch vụ địa chất, khoáng sản.',public:true},
 {id:'MD',name:'Đoàn Địa vật lý Mặt đất',type:'Đơn vị trực thuộc',leader:'Phạm Quang Hưng',staff:'19 người',staffCount:19,mission:'Điều tra địa vật lý trên đất liền; thăm dò khoáng sản, ĐCMT, ĐCCT–ĐCTV, tai biến địa chất; kiểm tra chi tiết dị thường địa vật lý hàng không.',public:true},
 {id:'DB',name:'Đoàn Địa vật lý Biển',type:'Đơn vị trực thuộc',leader:'Nguyễn Văn Hành',deputy:'Lại Ngọc Dũng',staff:'20 người',staffCount:20,mission:'Điều tra địa vật lý biển và hải đảo phục vụ địa chất, khoáng sản, môi trường, ĐCCT–ĐCTV và tai biến địa chất.',public:true},
 {id:'TT',name:'Trung tâm Công nghệ & Kiểm định máy ĐVL',type:'Đơn vị trực thuộc',leader:'Trần Anh Tuấn',deputy:'Hoàng Hải Hà; Nguyễn Khắc Tín Linh',staff:'35 người',staffCount:35,mission:'Hiệu chuẩn, kiểm định máy đo địa vật lý; nghiên cứu ứng dụng phương pháp địa vật lý; bảo dưỡng sửa chữa thiết bị, phân tích mẫu tham số vật lý, quản lý kho mẫu phóng xạ và thực hiện dịch vụ.',public:true}
]

export const orgStats = (): OrgStats[] => [{id:'capability',total:123,doctor:2,master:26,engineerBachelor:75,technicianWorker:20,under5:15,from5to15:64,over15:44}]

/** budget in billion VND. */
export const research = (): ResearchProject[] => [
 {id:'R-2026-01',title:'Nền tảng AI hỗ trợ kiểm soát chất lượng dữ liệu địa vật lý',owner:'Phòng Kỹ thuật',lead:'Nhóm AI/Địa vật lý',stage:'Thuyết minh',gate:'Gate 2',progress:18,budget:2.8,trl:3,product:'Mô hình AI + quy trình QC',risk:'TB',applied:false},
 {id:'R-2025-04',title:'Hoàn thiện thiết bị đo phổ gamma bằng UAV',owner:'Trung tâm Công nghệ & Kiểm định',lead:'Nhóm thiết bị',stage:'Ứng dụng',gate:'Gate 7',progress:88,budget:4.5,trl:7,product:'Thiết bị + phần mềm + quy trình',risk:'Thấp',applied:true},
 {id:'R-2026-07',title:'Tích hợp dữ liệu địa vật lý biển đa nguồn phục vụ mô hình 3D',owner:'Đoàn Địa vật lý Biển',lead:'Nhóm nghiên cứu biển',stage:'Pilot',gate:'Gate 5',progress:62,budget:3.6,trl:6,product:'Dataset + mô hình 3D',risk:'TB',applied:false}
]

export const digitalAdoption = (): DigitalAdoption[] => [
 {id:'DA-01',unit:'Phòng Kỹ thuật',usage:92,interaction:88,process:86,data:91,adapt:82,effect:84,ai:64,score:86},
 {id:'DA-02',unit:'Phòng KH–TC',usage:90,interaction:84,process:89,data:94,adapt:80,effect:87,ai:48,score:86},
 {id:'DA-03',unit:'Phòng TC–HC',usage:81,interaction:79,process:72,data:84,adapt:76,effect:74,ai:41,score:77},
 {id:'DA-04',unit:'ĐVL Hàng không',usage:86,interaction:82,process:79,data:87,adapt:81,effect:80,ai:45,score:82},
 {id:'DA-05',unit:'ĐVL Mặt đất',usage:88,interaction:85,process:83,data:88,adapt:84,effect:82,ai:52,score:84},
 {id:'DA-06',unit:'ĐVL Biển',usage:84,interaction:81,process:78,data:85,adapt:80,effect:79,ai:49,score:81},
 {id:'DA-07',unit:'Trung tâm CN&KĐM',usage:91,interaction:86,process:84,data:90,adapt:85,effect:88,ai:59,score:87}
]
