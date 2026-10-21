import { addDays } from "../dates.ts"
import type { StaffSkill } from "../types.ts"

/** Skill matrix (levels 1–5) for key technical staff; certExpiry is the nearest certificate expiry. */
export function staffSkills(today: string): StaffSkill[] {
  const due = (n: number) => addDays(today, n)
  return [
   {id:'NS-001',name:'Nguyễn Văn An',unit:'Đoàn ĐVL Mặt đất',geophysics:5,gis:3,data:5,pm:4,onField:true,certExpiry:due(220)},
   {id:'NS-002',name:'Trần Thị Bình',unit:'Phòng Kỹ thuật',geophysics:4,gis:5,data:3,pm:3,onField:false,certExpiry:due(35)},
   {id:'NS-003',name:'Lê Quang Cường',unit:'Đoàn ĐVL Biển',geophysics:4,gis:2,data:4,pm:3,onField:true,certExpiry:due(48)},
   {id:'NS-004',name:'Phạm Minh Đức',unit:'Đoàn ĐVL Hàng không',geophysics:5,gis:4,data:4,pm:2,onField:true,certExpiry:due(300)},
   {id:'NS-005',name:'Hoàng Thu Giang',unit:'TT Kiểm định',geophysics:3,gis:2,data:5,pm:2,onField:false,certExpiry:due(20)},
   {id:'NS-006',name:'Vũ Đình Hải',unit:'Đoàn ĐVL Mặt đất',geophysics:4,gis:4,data:3,pm:5,onField:true,certExpiry:due(150)},
   {id:'NS-007',name:'Đặng Thị Kim',unit:'Phòng Kỹ thuật',geophysics:3,gis:5,data:4,pm:3,onField:false,certExpiry:due(400)},
   {id:'NS-008',name:'Bùi Văn Long',unit:'Đoàn ĐVL Biển',geophysics:4,gis:3,data:3,pm:4,onField:true,certExpiry:due(55)}
  ]
}
