import { addDays } from "../dates.ts"
import type { Education, StaffProfile } from "../types.ts"
import { SUB_UNIT_DEFS } from "./subUnitDefs.ts"

/**
 * 123 public staff profiles, generated deterministically so the capability figures stay as published:
 * 2 TS • 26 ThS • 75 KS/CN • 20 KTV/CN; 44 over 15 years • 64 from 5–15 • 15 under 5;
 * HK 20 • MD 19 • DB 20 • TT 35 (the rest in the leadership and the three offices).
 * NS-001…NS-008 are the Skill Matrix people; unit heads are the leaders listed in Cơ cấu & Chức năng.
 */

const UNIT_SIZE: Record<string, number> = { BLD: 4, TCHC: 7, KHTC: 8, KT: 10, HK: 20, MD: 19, DB: 20, TT: 35 }
const OFFICES = ["BLD", "TCHC", "KHTC"]
const FIELD_UNITS = ["HK", "MD", "DB"]

/** Skill Matrix people: [id, name, unit, major, onField, days to certificate expiry]. */
const SKILLED: [string, string, string, string, boolean, number][] = [
  ["NS-001", "Nguyễn Văn An", "MD", "Địa vật lý", true, 220],
  ["NS-002", "Trần Thị Bình", "KT", "Trắc địa – GIS", false, 35],
  ["NS-003", "Lê Quang Cường", "DB", "Địa vật lý", true, 48],
  ["NS-004", "Phạm Minh Đức", "HK", "Địa vật lý", true, 300],
  ["NS-005", "Hoàng Thu Giang", "TT", "Công nghệ thông tin", false, 20],
  ["NS-006", "Vũ Đình Hải", "MD", "Địa vật lý", true, 150],
  ["NS-007", "Đặng Thị Kim", "KT", "Trắc địa – GIS", false, 400],
  ["NS-008", "Bùi Văn Long", "DB", "Địa vật lý", true, 55],
]
/** Unit heads: [name, unit, title, education]. */
const HEADS: [string, string, string, Education][] = [
  ["Nguyễn Văn Minh", "BLD", "Liên đoàn trưởng", "Tiến sĩ"],
  ["Nguyễn Thị Hồng Minh", "TCHC", "Trưởng phòng", "Thạc sĩ"],
  ["Nguyễn Vân Sang", "KT", "Trưởng phòng", "Tiến sĩ"],
  ["Nguyễn Thị Lan Hương", "KHTC", "Trưởng phòng", "Thạc sĩ"],
  ["Bùi Minh Thành", "HK", "Đoàn trưởng", "Thạc sĩ"],
  ["Phạm Quang Hưng", "MD", "Đoàn trưởng", "Thạc sĩ"],
  ["Nguyễn Văn Hành", "DB", "Đoàn trưởng", "Thạc sĩ"],
  ["Trần Anh Tuấn", "TT", "Giám đốc", "Thạc sĩ"],
]
const DEPUTY: Record<string, string> = {
  BLD: "Phó Liên đoàn trưởng", TCHC: "Phó trưởng phòng", KHTC: "Phó trưởng phòng", KT: "Phó trưởng phòng",
  HK: "Phó đoàn trưởng", MD: "Phó đoàn trưởng", DB: "Phó đoàn trưởng", TT: "Phó giám đốc",
}
const MAJORS: Record<string, string[]> = {
  BLD: ["Địa vật lý", "Địa chất"],
  TCHC: ["Quản trị nhân lực", "Luật", "Hành chính công"],
  KHTC: ["Kế toán", "Tài chính – Ngân hàng", "Kinh tế"],
  KT: ["Địa vật lý", "Địa chất", "Trắc địa – GIS", "Công nghệ thông tin"],
  TT: ["Điện tử – Tự động hóa", "Cơ khí", "Địa vật lý", "Công nghệ thông tin"],
  FIELD: ["Địa vật lý", "Địa vật lý", "Địa chất", "Trắc địa – GIS", "Điện tử – Tự động hóa"],
}
const CERTS: Record<string, string[]> = {
  HK: ["Khảo sát địa vật lý hàng không", "An toàn bức xạ"],
  MD: ["Vận hành máy đo điện", "An toàn lao động"],
  DB: ["An toàn làm việc trên biển", "Vận hành thiết bị địa chấn"],
  TT: ["Kiểm định thiết bị đo", "An toàn điện"],
  KT: ["GIS nâng cao"],
}
const SURNAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Đinh", "Trịnh", "Mai"]
const MIDDLE = [["Văn", "Đức", "Minh", "Quang", "Hữu", "Thành", "Công"], ["Thị", "Thu", "Ngọc", "Thanh", "Phương"]]
const GIVEN = [
  ["Bảo", "Dũng", "Hiếu", "Hùng", "Khánh", "Nam", "Phong", "Quân", "Sơn", "Thắng", "Tùng", "Việt", "Trung", "Toàn", "Vinh", "Lộc", "Tiến", "Huy"],
  ["Anh", "Hà", "Hằng", "Hoa", "Lan", "Linh", "Mai", "Ngân", "Nhung", "Oanh", "Quỳnh", "Thảo", "Trang", "Yến"],
]

/** Small deterministic PRNG (mulberry32) so the seed is identical on every run. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function staffProfiles(today: string): StaffProfile[] {
  const rand = rng(2026)
  const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))
  const pick = <T,>(xs: T[]) => xs[int(0, xs.length - 1)]
  const shuffle = <T,>(xs: T[]) => { for (let i = xs.length - 1; i > 0; i--) { const j = int(0, i); [xs[i], xs[j]] = [xs[j], xs[i]] } return xs }
  const pool = <T,>(counts: [T, number][]) => shuffle(counts.flatMap(([v, n]) => Array<T>(n).fill(v)))
  const take = <T,>(xs: T[], ok: (v: T) => boolean = () => true) => xs.splice(Math.max(0, xs.findIndex(ok)), 1)[0]

  const education = pool<Education>([["Tiến sĩ", 2], ["Thạc sĩ", 26], ["Kỹ sư/Cử nhân", 75], ["KTV/Công nhân", 20]])
  const exp = pool<"under5" | "from5to15" | "over15">([["over15", 44], ["from5to15", 64], ["under5", 15]])
  const left = { ...UNIT_SIZE }
  const used = new Set([...SKILLED.map((s) => s[1]), ...HEADS.map((h) => h[0])])
  const year = Number(today.slice(0, 4))

  const newName = () => {
    for (;;) {
      const g = int(0, 1)
      const name = `${pick(SURNAMES)} ${pick(MIDDLE[g])} ${pick(GIVEN[g])}`
      if (!used.has(name)) { used.add(name); return name }
    }
  }
  const person = (id: string, name: string, unit: string, edu: Education, band: string, title: string, major: string, onField: boolean, certs: StaffProfile["certs"]): StaffProfile => {
    const experience = band === "over15" ? int(16, 32) : band === "from5to15" ? int(5, 15) : int(0, 4)
    const age = Math.min(60, 23 + experience + int(0, 5) + (edu === "Tiến sĩ" ? 4 : 0))
    left[unit]--
    return { id, name, birthYear: year - age, education: edu, major, experience, unit, title, certs, onField }
  }
  const titleFor = (unit: string, edu: Education) =>
    OFFICES.includes(unit) ? "Chuyên viên" : edu === "KTV/Công nhân" ? pick(["Kỹ thuật viên", "Công nhân kỹ thuật"]) : edu === "Kỹ sư/Cử nhân" ? "Kỹ sư" : "Kỹ sư chính"
  const randomCerts = (unit: string) => (CERTS[unit] ? shuffle([...CERTS[unit]]).slice(0, int(0, 2)).map((name) => ({ name, expiry: addDays(today, int(-40, 540)) })) : [])

  const out: StaffProfile[] = SKILLED.map(([id, name, unit, major, onField, days]) => {
    const edu = take(education, (e) => e === "Kỹ sư/Cử nhân" || e === "Thạc sĩ")
    return person(id, name, unit, edu, take(exp), titleFor(unit, edu), major, onField, [{ name: "Chứng chỉ hành nghề địa vật lý", expiry: addDays(today, days) }])
  })
  let n = out.length
  const nextId = () => `NS-${String(++n).padStart(3, "0")}`
  for (const [name, unit, title, edu] of HEADS) {
    out.push(person(nextId(), name, unit, take(education, (e) => e === edu), take(exp, (b) => b === "over15"), title, MAJORS[unit]?.[0] ?? "Địa vật lý", false, randomCerts(unit)))
  }
  // Offices first so they draw graduates; technicians and workers end up in the technical units.
  for (const unit of Object.keys(UNIT_SIZE)) {
    for (let i = 0; left[unit] > 0; i++) {
      const lead = i === 0 || unit === "BLD"
      const edu = take(education, (e) => (unit === "BLD" ? e === "Thạc sĩ" : !OFFICES.includes(unit) || e !== "KTV/Công nhân"))
      const band = take(exp, (b) => !lead || b === "over15")
      const field = FIELD_UNITS.includes(unit)
      out.push(person(nextId(), newName(), unit, edu, band, lead ? DEPUTY[unit] : titleFor(unit, edu),
        pick(MAJORS[field ? "FIELD" : unit]), field && rand() < 0.45, randomCerts(unit)))
    }
  }
  // Spread each unit's people over its tổ/phòng in turn (the leadership has none).
  const seen: Record<string, number> = {}
  return out.map((p) => {
    const subs = SUB_UNIT_DEFS.filter((d) => d[1] === p.unit)
    if (!subs.length) return p
    const i = (seen[p.unit] = (seen[p.unit] ?? -1) + 1)
    return { ...p, subUnit: subs[i % subs.length][0] }
  })
}
