import { localToday } from "./dates"
import { vldcData } from "./registry"
import { staffProfiles } from "./seed/staff"
import { withSeedSubUnits } from "./subUnitCore"
import type { StaffProfile } from "./types"

let seed: StaffProfile[] | undefined

/** Stored staff profiles, with the seeded tổ filled in for profiles saved before tổ existed. */
export const staffView = (): StaffProfile[] => withSeedSubUnits(vldcData.get("staffProfiles"), (seed ??= staffProfiles(localToday())))
