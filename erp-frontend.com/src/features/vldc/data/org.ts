import { ROLE_TITLES } from "../workflow/rules.ts"

/**
 * VLDC organisation: units (tbl_department) and role profiles (tbl_role + tbl_user). The backend is the
 * source; the values below are the same as its seed (environment/mysql) and are used until it loads or
 * when it cannot be reached. Every unit name in records is resolved to a unit code, whatever its spelling.
 */

export type UnitCode = "BLD" | "KT" | "KHTC" | "TCHC" | "MD" | "DB" | "HK" | "TT"
export type OrgUnitDef = { code: UnitCode; name: string; short: string; aliases: string[] }

export const UNIT_DEFS: OrgUnitDef[] = [
  { code: "BLD", name: "Ban Lãnh đạo Liên đoàn", short: "Ban Lãnh đạo", aliases: ["Ban Lãnh đạo"] },
  { code: "KT", name: "Phòng Kỹ thuật", short: "P. Kỹ thuật", aliases: [] },
  { code: "KHTC", name: "Phòng Kế hoạch – Tài chính", short: "P. KH-TC", aliases: ["Phòng KH-TC", "KH-TC", "Phòng Kế toán", "Kế toán"] },
  { code: "TCHC", name: "Phòng Tổ chức – Hành chính", short: "P. TC-HC", aliases: ["Phòng TC-HC", "TC-HC"] },
  { code: "MD", name: "Đoàn ĐVL Mặt đất", short: "ĐVL Mặt đất", aliases: [] },
  { code: "DB", name: "Đoàn ĐVL Biển", short: "ĐVL Biển", aliases: [] },
  { code: "HK", name: "Đoàn ĐVL Hàng không", short: "ĐVL Hàng không", aliases: [] },
  { code: "TT", name: "TT Công nghệ & Kiểm định", short: "TT Kiểm định", aliases: ["TT Kiểm định", "Trung tâm Công nghệ & Kiểm định", "Trung tâm Công nghệ & Kiểm định máy ĐVL", "Trung tâm CN&KĐM"] },
]

/** Unit of each role (tbl_role.department_id). */
const ROLE_UNIT: Record<string, UnitCode> = {
  lanhdao: "BLD", kythuat: "KT", kehoach: "KHTC", ketoan: "KHTC", ketoantruong: "KHTC", tochuc: "TCHC",
  truongdonvi: "MD", chunhiem: "MD", matdat: "MD", bien: "DB", hientruong: "DB", hangkhong: "HK", trungtam: "TT",
}

/** Person shown for each role (tbl_user.full_name of the seeded demo accounts). */
const ROLE_PEOPLE: Record<string, [name: string, avatar: string]> = {
  lanhdao: ["Nguyễn Văn Minh", "LD"], truongdonvi: ["Trần Quốc Hùng", "TD"], chunhiem: ["Lê Hoàng Nam", "CN"],
  kythuat: ["Phạm Thu Hà", "KT"], kehoach: ["Vũ Thị Lan", "KH"], tochuc: ["Đỗ Minh Anh", "TC"], hientruong: ["Nguyễn Đức Hải", "HT"],
  ketoan: ["Nguyễn Thu Hương", "KT"], ketoantruong: ["Trần Minh Phương", "KTT"], hangkhong: ["Bùi Minh Thành", "HK"],
  matdat: ["Phạm Quang Hưng", "MD"], bien: ["Nguyễn Văn Hành", "DB"], trungtam: ["Trần Anh Tuấn", "TT"],
}

export type RoleProfile = { name: string; title: string; unit: string; unitCode: UnitCode; avatar: string }

/** Live profiles, updated in place when the backend loads (the legacy engine keeps a reference). */
export const ROLE_PROFILES: Record<string, RoleProfile> = {}
const unitNames: Partial<Record<UnitCode, string>> = {}

const unitDef = (code: UnitCode) => UNIT_DEFS.find((u) => u.code === code) as OrgUnitDef
export const unitName = (code: UnitCode) => unitNames[code] ?? unitDef(code).name

function rebuildProfiles() {
  for (const [role, code] of Object.entries(ROLE_UNIT)) {
    const prev = ROLE_PROFILES[role]
    ROLE_PROFILES[role] = {
      name: prev?.name ?? ROLE_PEOPLE[role]?.[0] ?? "",
      title: ROLE_TITLES[role] ?? role,
      unit: unitName(code),
      unitCode: code,
      avatar: ROLE_PEOPLE[role]?.[1] ?? role.slice(0, 2).toUpperCase(),
    }
  }
}
rebuildProfiles()

/** Accent-, case- and dash-insensitive key; "Địa vật lý" and "ĐVL" are the same word. */
export function unitKey(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase()
    .replace(/dia vat ly/g, "dvl").replace(/[–—-]/g, "-").replace(/\s*-\s*/g, "-").replace(/\s+/g, " ").trim()
}

const aliasIndex = () => {
  const index = new Map<string, UnitCode>()
  for (const u of UNIT_DEFS) for (const n of [u.name, u.short, ...u.aliases, unitName(u.code)]) index.set(unitKey(n), u.code)
  return index
}
let index = aliasIndex()

/** Unit code of any spelling of a unit name ("Đoàn Địa vật lý Mặt đất", "Đoàn ĐVL Mặt đất"…). */
export function unitCodeOf(name: string | undefined): UnitCode | undefined {
  return name ? index.get(unitKey(name)) : undefined
}

export const roleUnitCode = (role: string): UnitCode | undefined => ROLE_UNIT[role]
export const rolesOfUnit = (code: UnitCode) => Object.keys(ROLE_UNIT).filter((r) => ROLE_UNIT[r] === code)

/** Leadership and the functional departments follow every project; units see their own. */
const SEES_ALL_PROJECTS: UnitCode[] = ["BLD", "KT", "KHTC"]
export function canSeeProject(role: string, projectUnit: string | undefined): boolean {
  const code = ROLE_UNIT[role]
  if (!code) return false
  return SEES_ALL_PROJECTS.includes(code) || unitCodeOf(projectUnit) === code
}

export type BackendRole = { code: string; name: string; departmentName?: string | null }
export type BackendDepartment = { code: string; name: string }

/** Applies tbl_role / tbl_department; roles without a department keep their default unit. */
export function applyBackendOrg(roles: BackendRole[], departments: BackendDepartment[]) {
  for (const d of departments) if (UNIT_DEFS.some((u) => u.code === d.code)) unitNames[d.code as UnitCode] = d.name
  index = aliasIndex()
  for (const r of roles) {
    if (!(r.code in ROLE_UNIT)) continue
    if (r.name) ROLE_TITLES[r.code] = r.name
    const code = unitCodeOf(r.departmentName ?? undefined)
    if (code) ROLE_UNIT[r.code] = code
  }
  rebuildProfiles()
}

/** The signed-in account's real name replaces the default person of its role. */
export function setRolePerson(role: string, name: string) {
  if (ROLE_PROFILES[role] && name) ROLE_PROFILES[role].name = name
}

/** "Nguyễn Văn Minh (Liên đoàn trưởng)" – signer of documents drafted by the federation. */
export const leaderSignature = () => `${ROLE_PROFILES.lanhdao.name} (${ROLE_PROFILES.lanhdao.title})`
