import { localToday } from "./dates"
import { vldcData } from "./registry"
import { staffProfiles } from "./seed/staff"
import { withSeedSubUnits } from "./subUnitCore"
import type { StaffProfile } from "./types"

let seed: StaffProfile[] | undefined

/** Every stored profile, people who left included (the Nhân sự list can show them). */
export const allStaffView = (): StaffProfile[] => withSeedSubUnits(vldcData.get("staffProfiles"), (seed ??= staffProfiles(localToday())))

/** The people working now: what counts, KPIs, pickers and the capability figures use. */
export const staffView = (): StaffProfile[] => allStaffView().filter((p) => p.status !== "NGHI_VIEC")
