import { escapeHtml as esc, jsCall } from "../workflow/html"
import { localToday, vnDate } from "./dates"
import { ROLE_PROFILES } from "./org"
import {
  CRITICAL_GAP, LATE_GAP, filterTree, isBehind, matchesPlan, parsePeriod, planPace, planSummary, planTree,
  type Pace, type PlanFilter, type PlanNode,
} from "./planCore"
import { vldcData } from "./registry"
import type { Plan } from "./types"

/** Kế hoạch for the leader: every plan's progress against where it should be today, slowest first. */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }

const state = { filter: "all" as PlanFilter, level: "", query: "", collapsed: new Set<string>() }
const today = () => localToday()
const content = () => document.getElementById("content")
const LEVELS = ["Liên đoàn", "Đơn vị", "Dự án", "Cá nhân"]

function paceLabel(pace: Pace, progress: number): [string, string] {
  if (pace.state === "unknown") return ["Chưa có kỳ", "b-info"]
  const gap = pace.gap ?? 0
  if (pace.daysLeft != null && pace.daysLeft < 0 && progress < 100) return [`Quá hạn • còn ${100 - progress}%`, "b-danger"]
  if (pace.state === "critical") return [gap < 0 ? `Chậm ${-gap}%` : "Có nguy cơ", "b-danger"]
  if (pace.state === "late") return [`Chậm ${-gap}%`, "b-warn"]
  if (pace.state === "ahead") return [`Vượt ${gap}%`, "b-ok"]
  return ["Đúng tiến độ", "b-ok"]
}

function paceBar(plan: Plan, pace: Pace): string {
  const color = pace.state === "critical" ? "var(--danger)" : pace.state === "late" ? "var(--warn)" : "var(--ok)"
  const marker = pace.expected == null ? "" : `<span class="vx-plan-marker" style="left:${pace.expected}%" title="Cần đạt hôm nay: ${pace.expected}%"></span>`
  return `<div class="vx-plan-bar"><i style="width:${Math.min(100, plan.progress)}%;background:${color}"></i>${marker}</div>`
}

function rowHtml(node: PlanNode, depth: number): string {
  const { plan, pace } = node
  const [label, cls] = paceLabel(pace, plan.progress)
  const hasKids = node.children.length > 0
  const open = !state.collapsed.has(plan.id)
  const end = parsePeriod(plan.period)?.end
  const toggle = hasKids ? `<button class="vx-plan-toggle" ${jsCall("planToggle", plan.id)}>${open ? "▾" : "▸"}</button>` : '<span class="vx-plan-toggle"></span>'
  const row = `<div class="vx-plan-row" style="padding-left:${8 + depth * 22}px">${toggle}
<div class="vx-plan-name"><a href="javascript:void 0" ${jsCall("planDetail", plan.id)}><b>${esc(plan.title)}</b></a><div class="mini">${esc(plan.id)} • ${esc(plan.level)} • ${esc(plan.owner)}${hasKids ? ` • ${node.children.length} kế hoạch con` : ""}</div></div>
<div class="vx-plan-progress"><div class="vx-plan-nums"><b>${plan.progress}%</b>${pace.expected == null ? "" : `<span class="mini">cần ${pace.expected}%</span>`}</div>${paceBar(plan, pace)}</div>
<span class="badge ${cls}">${label}</span>
<div class="vx-plan-end"><span class="mini">Hạn</span><b>${end ? vnDate(end) : "–"}</b>${pace.dueSoon ? '<span class="badge b-warn">Sắp hết hạn</span>' : ""}</div></div>`
  return row + (hasKids && open ? node.children.map((c) => rowHtml(c, depth + 1)).join("") : "")
}

function pageHtml(): string {
  const plans = vldcData.get("plans")
  const t = today()
  const s = planSummary(plans, t)
  const tree = filterTree(planTree(plans, t), (n) => matchesPlan(n, state.filter, state.level, state.query))
  const tile = (f: PlanFilter, label: string, value: string, sub: string, cls: string) =>
    `<button class="vx-inbox-chip ${cls}${state.filter === f ? " active" : ""}" ${jsCall("planFilter", f)}><b>${value}</b><span>${label}</span><span class="mini">${sub}</span></button>`
  return `<div class="card vx-inbox-head"><div class="card-head"><div><h3>Tiến độ kế hoạch</h3><div class="mini">So tiến độ thực tế với mốc cần đạt hôm nay (theo thời gian đã trôi qua của kỳ kế hoạch) • chậm hơn ${LATE_GAP}% là chậm, hơn ${CRITICAL_GAP}% là nguy cơ</div></div></div>
<div class="vx-inbox-chips vx-plan-tiles">${tile("all", "Tiến độ chung", `${s.overall}%`, "Trung bình kế hoạch Liên đoàn", "blue")}${tile("onTrack", "Đúng tiến độ", String(s.onTrack), "Đạt hoặc vượt mốc", "gray")}${tile("behind", "Chậm tiến độ", String(s.behind), "Cần đôn đốc", "red")}${tile("dueSoon", "Sắp hết hạn", String(s.dueSoon), "≤ 7 ngày, dưới 80%", "yellow")}</div>
<div class="vx-inbox-toolbar"><input placeholder="Tìm kế hoạch, người chủ trì..." value="${esc(state.query)}" onchange="planSearch(this.value)"><select onchange="planLevel(this.value)"><option value="">Tất cả cấp</option>${LEVELS.map((l) => `<option${l === state.level ? " selected" : ""}>${l}</option>`).join("")}</select><button class="btn btn-light" ${jsCall("planFilter", "all")}>Bỏ lọc</button></div></div>
<div class="card">${tree.map((n) => rowHtml(n, 0)).join("") || '<div class="mini" style="padding:16px">Không có kế hoạch phù hợp.</div>'}</div>`
}

function rerender() {
  const el = content()
  if (el) el.innerHTML = pageHtml()
}

/** Who a reminder goes to: the person for personal plans, else the plan's unit/project, else everyone. */
function reminderScope(plan: Plan) {
  if (plan.ownerRole) return { scope: "personal" as const, ownerRole: plan.ownerRole }
  if (plan.unit) return { scope: "unit" as const, unit: plan.unit }
  if (plan.project) return { scope: "project" as const, project: plan.project }
  return { scope: "federation" as const }
}

export function installPlansPage(render: Record<string, () => void>, ctx: Ctx) {
  const base = render.plans
  // Leaders follow progress; other roles keep the planning page.
  render.plans = () => (ctx.role() === "lanhdao" ? rerender() : base())

  function planDetail(id: string) {
    const plans = vldcData.get("plans")
    const plan = plans.find((p) => p.id === id)
    if (!plan) return
    const pace = planPace(plan, today())
    const [label, cls] = paceLabel(pace, plan.progress)
    const kids = plans.filter((p) => p.parent === plan.id)
    const parent = plans.find((p) => p.id === plan.parent)
    const metric = (l: string, v: string) => `<div class="metric"><span>${l}</span><b>${v}</b></div>`
    ctx.openModal(`Kế hoạch • ${plan.id}`, `<h3 style="margin-top:0">${esc(plan.title)}</h3><div class="grid twoeq"><div>${metric("Cấp", esc(plan.level))}${metric("Chủ trì", esc(plan.owner))}${metric("Kỳ kế hoạch", esc(plan.period))}${metric("Trạng thái", esc(plan.status))}${metric("Tiến độ", `${plan.progress}%${pace.expected == null ? "" : ` / cần ${pace.expected}%`}`)}${metric("Đánh giá", `<span class="badge ${cls}">${label}</span>`)}${parent ? metric("Kế hoạch cấp trên", `<a href="javascript:void 0" ${jsCall("planDetail", parent.id)}>${esc(parent.title)}</a>`) : ""}${paceBar(plan, pace)}</div>
<div><h4>Đầu việc</h4>${plan.items.map((i) => `<div class="folder">• ${esc(i)}</div>`).join("") || '<div class="mini">Chưa có đầu việc.</div>'}${kids.length ? `<h4 style="margin-top:12px">Kế hoạch con</h4>${kids.map((k) => { const kp = planPace(k, today()); const [kl, kc] = paceLabel(kp, k.progress); return `<div class="alert"><span class="dot ${isBehind(kp) ? "red" : "green"}"></span><div><a href="javascript:void 0" ${jsCall("planDetail", k.id)}><b>${esc(k.title)}</b></a><div class="mini">${k.progress}% • <span class="badge ${kc}">${kl}</span></div></div></div>` }).join("")}` : ""}</div></div>
<div class="form-grid" style="margin-top:12px"><div class="full"><label>Nội dung đôn đốc</label><textarea id="plan-remind" rows="2">Đề nghị cập nhật tiến độ "${esc(plan.title)}": hiện đạt ${plan.progress}%${pace.expected == null ? "" : `, cần ${pace.expected}% theo kế hoạch`}.</textarea></div></div><button class="btn btn-primary" style="margin-top:8px" ${jsCall("planRemind", plan.id)}>Đôn đốc người chủ trì</button>`)
  }

  function planRemind(id: string) {
    const plan = vldcData.get("plans").find((p) => p.id === id)
    if (!plan) return
    const body = ((document.getElementById("plan-remind") as HTMLTextAreaElement | null)?.value ?? "").trim()
    if (!body) return alert("Vui lòng nhập nội dung đôn đốc")
    const me = ctx.role()
    const now = new Date()
    void vldcData.save("notices", {
      id: `NTF-${now.getTime().toString(36).toUpperCase()}`, ...reminderScope(plan),
      title: `Đôn đốc tiến độ: ${plan.title}`, body: `${body} — ${ROLE_PROFILES[me]?.title ?? "Lãnh đạo"}`,
      time: `${vnDate(today()).slice(0, 5)} ${now.toTimeString().slice(0, 5)}`, priority: "Cao", readBy: [me], link: "plans",
    })
    ctx.closeModal()
  }

  Object.assign(window, {
    planDetail, planRemind,
    planToggle: (id: string) => {
      if (state.collapsed.has(id)) state.collapsed.delete(id)
      else state.collapsed.add(id)
      rerender()
    },
    planFilter: (f: PlanFilter) => {
      state.filter = f
      if (f === "all") { state.level = ""; state.query = "" }
      rerender()
    },
    planLevel: (l: string) => { state.level = l; rerender() },
    planSearch: (q: string) => { state.query = q; rerender() },
  })
}
