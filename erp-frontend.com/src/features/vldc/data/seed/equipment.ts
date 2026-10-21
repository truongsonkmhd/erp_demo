import { addDays } from "../dates.ts"
import type { Equipment } from "../types.ts"

/** Public equipment catalogue (vatlydiachat.gov.vn) plus demo operating data: utilization %, next inspection, repair cost (million VND). */
export function equipment(today: string): Equipment[] {
  const due = (n: number) => addDays(today, n)
  return [
 {id:'P-12',name:'Proton Magnetometer P-12',quantity:1,year:'2019',condition:'Tốt',group:'Từ',unit:'Đoàn ĐVL Mặt đất',status:'Đang sử dụng',utilization:77,inspectionDue:due(18),repairCost:42},
 {id:'EM-04',name:'Máy đo điện từ EM-04',quantity:1,year:'2015',condition:'Tốt',group:'Điện từ',unit:'TT Kiểm định',status:'Bảo dưỡng',utilization:43,inspectionDue:due(150),repairCost:96},
 {id:'EQ-001',name:'Trạm ĐVL hàng không Canada',quantity:1,year:'1982',condition:'Tốt',group:'Hàng không',unit:'Đoàn ĐVL Hàng không',status:'Đang sử dụng',utilization:81,inspectionDue:due(12),repairCost:42},
 {id:'EQ-002',name:'Máy SYSCAL – R2',quantity:1,year:'1997',condition:'Tốt',group:'Điện',unit:'Đoàn ĐVL Mặt đất',status:'Đang sử dụng',utilization:64,inspectionDue:due(45),repairCost:18},
 {id:'EQ-003',name:'Tổ hợp địa chấn MARK-6',quantity:4,year:'1997',condition:'Tốt',group:'Địa chấn',unit:'Đoàn ĐVL Mặt đất',status:'Sẵn sàng',utilization:72,inspectionDue:due(18),repairCost:35},
 {id:'EQ-005',name:'Máy thăm dò xạ đường bộ DKS-96',quantity:3,year:'2003',condition:'Tốt',group:'Phóng xạ',unit:'TT Kiểm định',status:'Đang sử dụng',utilization:55,inspectionDue:due(90),repairCost:12},
 {id:'EQ-006',name:'Máy thăm dò điện ProTEM-57',quantity:1,year:'2003/2010',condition:'Tốt',group:'Điện từ',unit:'Đoàn ĐVL Mặt đất',status:'Bảo dưỡng',utilization:43,inspectionDue:due(25),repairCost:96},
 {id:'EQ-007',name:'Máy thăm dò từ PROTON MINIMAG',quantity:1,year:'2003',condition:'Tốt',group:'Từ',unit:'Đoàn ĐVL Mặt đất',status:'Đang sử dụng',utilization:90,inspectionDue:due(140),repairCost:8},
 {id:'EQ-011',name:'Bộ thu phát Boomer & Sparker',quantity:1,year:'2006',condition:'Tốt',group:'Biển',unit:'Đoàn ĐVL Biển',status:'Đang sử dụng',utilization:77,inspectionDue:due(7),repairCost:27},
 {id:'EQ-016',name:'Máy thăm dò địa chấn GEODE 24',quantity:1,year:'2009/2016',condition:'Tốt',group:'Địa chấn',unit:'Đoàn ĐVL Mặt đất',status:'Sẵn sàng',utilization:68,inspectionDue:due(60),repairCost:15},
 {id:'EQ-019',name:'Máy Radar xuyên đất RAMALA',quantity:2,year:'2009',condition:'Tốt',group:'GPR',unit:'Đoàn ĐVL Mặt đất',status:'Đang sử dụng',utilization:59,inspectionDue:due(28),repairCost:22},
 {id:'EQ-021',name:'Máy đo trọng lực ZLS-B37',quantity:1,year:'2009/2017/2018',condition:'Tốt',group:'Trọng lực',unit:'Đoàn ĐVL Mặt đất',status:'Bảo dưỡng',utilization:85,inspectionDue:due(200),repairCost:40},
 {id:'EQ-023',name:'Trạm thăm dò điện miền thời gian VIP 3000',quantity:1,year:'2009/2015',condition:'Tốt',group:'Điện',unit:'Đoàn ĐVL Mặt đất',status:'Đang sử dụng',utilization:71,inspectionDue:due(15),repairCost:11},
 {id:'EQ-028',name:'Trạm đo địa chấn mặt đất 2D 428XL (Pháp)',quantity:1,year:'2013',condition:'Tốt',group:'Địa chấn',unit:'Đoàn ĐVL Mặt đất',status:'Đang sử dụng',utilization:62,inspectionDue:due(75),repairCost:30},
 {id:'EQ-029',name:'Trạm Karota lỗ khoan Robertson (Anh)',quantity:1,year:'2013',condition:'Tốt',group:'Karota',unit:'TT Kiểm định',status:'Sẵn sàng',utilization:48,inspectionDue:due(33),repairCost:19},
 {id:'EQ-035',name:'Hệ thống đo từ hàng không Canada',quantity:1,year:'2016',condition:'Mới',group:'Hàng không',unit:'Đoàn ĐVL Hàng không',status:'Đang sử dụng',utilization:88,inspectionDue:due(110),repairCost:6},
 {id:'EQ-036',name:'Hệ thống phổ gamma hàng không AGRS',quantity:1,year:'2016',condition:'Mới',group:'Hàng không',unit:'Đoàn ĐVL Hàng không',status:'Bảo dưỡng',utilization:93,inspectionDue:due(22),repairCost:14},
 {id:'EQ-039',name:'Hệ thống đo sâu điện VIP 10000',quantity:1,year:'2017',condition:'Mới',group:'Điện',unit:'Đoàn ĐVL Mặt đất',status:'Đang sử dụng',utilization:70,inspectionDue:due(180),repairCost:25},
 {id:'EQ-044',name:'Máy đo phổ gamma Gamma Surveyor II',quantity:1,year:'2017',condition:'Mới',group:'Gamma',unit:'TT Kiểm định',status:'Đang sử dụng',utilization:66,inspectionDue:due(9),repairCost:9},
 {id:'EQ-048',name:'Thiết bị gradient từ 3 trục SeaQuest',quantity:1,year:'2017',condition:'Mới',group:'Biển',unit:'Đoàn ĐVL Biển',status:'Sẵn sàng',utilization:79,inspectionDue:due(50),repairCost:21},
 {id:'EQ-049',name:'Hệ thống địa chấn biển đa kênh Geo Marine Survey',quantity:1,year:'2017',condition:'Mới',group:'Biển',unit:'Đoàn ĐVL Biển',status:'Đang sử dụng',utilization:74,inspectionDue:due(160),repairCost:16},
 {id:'EQ-051',name:'Hệ thống đo trọng lực hàng không GPS-INS',quantity:1,year:'2017',condition:'Mới',group:'Hàng không',unit:'Đoàn ĐVL Hàng không',status:'Bảo dưỡng',utilization:58,inspectionDue:due(40),repairCost:33}
  ]
}
