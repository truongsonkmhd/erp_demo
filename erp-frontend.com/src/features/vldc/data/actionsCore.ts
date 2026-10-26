import { addDays, vnDate } from "./dates.ts"
import { unitCodeOf } from "./org.ts"
import type { InboxTask, Meeting, ResearchProject, StaffSkill } from "./types.ts"

/** Pure logic behind the VLDC modals and forms (kept apart from the DOM so it can be tested). */

export const SKILLS = { geophysics: "Địa vật lý", gis: "GIS", data: "Xử lý dữ liệu", pm: "Quản lý dự án" } as const
export type SkillKey = keyof typeof SKILLS

/** Staff at or above the level in the skill, optionally in one unit; best first, off-field people first on ties. */
export function findExperts(staff: StaffSkill[], skill: SkillKey, minLevel: number, unit = ""): StaffSkill[] {
  const code = unit ? unitCodeOf(unit) : undefined
  return staff
    .filter((s) => s[skill] >= minLevel && (!code || unitCodeOf(s.unit) === code))
    .sort((a, b) => b[skill] - a[skill] || Number(a.onField) - Number(b.onField) || a.name.localeCompare(b.name))
}

/** Monday–Sunday of the week `offset` weeks from today ("dd/mm/yyyy"), plus a label "Tuần dd/mm – dd/mm/yyyy". */
export function calendarWeek(today: string, offset: number): { days: string[]; label: string } {
  const sinceMonday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7
  const days = Array.from({ length: 7 }, (_, i) => vnDate(addDays(today, offset * 7 - sinceMonday + i)))
  return { days, label: `Tuần ${days[0].slice(0, 5)} – ${days[6]}` }
}

/** Inbox tasks issued for a meeting's conclusions that have not been issued yet. */
export function conclusionTasks(meeting: Meeting, existingIds: Set<string>, nowIso: string): { tasks: InboxTask[]; meeting: Meeting } {
  const tasks: InboxTask[] = []
  const conclusions = (meeting.conclusions ?? []).map((c, i) => {
    if (c.taskId) return c
    let id = `KL-${meeting.id.replace(/^MTG-/, "")}-${String(i + 1).padStart(2, "0")}`
    while (existingIds.has(id)) id += "b"
    existingIds.add(id)
    tasks.push({
      id, type: "Kết luận họp", title: c.text, source: "Cuộc họp", sourcePage: "meetings", owner: c.ownerRole, cc: ["lanhdao"],
      priority: "Cao", status: "Mới", sla: `Hạn ${vnDate(c.due)}`, overdue: false, from: `Kết luận ${meeting.title}`, project: "-", next: "Báo cáo kết quả",
      history: [{ at: nowIso.slice(0, 16), by: "lanhdao", action: "Phát hành kết luận họp" }],
    })
    return { ...c, taskId: id }
  })
  return {
    tasks,
    meeting: { ...meeting, conclusions, openConclusions: conclusions.length, actions: (meeting.actions ?? 0) + tasks.length },
  }
}

/** Stage-Gate order used by the research workbench. */
export const STAGES = ["Ý tưởng", "Thuyết minh", "Nghiên cứu", "Prototype", "Pilot", "Ứng dụng"]

export function nextGate(r: ResearchProject): ResearchProject {
  const i = Math.max(0, STAGES.indexOf(r.stage))
  const stage = STAGES[Math.min(i + 1, STAGES.length - 1)]
  const gate = Number(/\d+/.exec(r.gate)?.[0] ?? 0) + 1
  return { ...r, stage, gate: `Gate ${gate}`, applied: stage === "Ứng dụng" || r.applied }
}
