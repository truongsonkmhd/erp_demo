import { escapeHtml as esc, jsCall } from "../workflow/html"
import { ROLE_TITLES } from "../workflow/rules"
import { localToday, vnDate } from "./dates"
import { ROLE_PROFILES, roleUnitCode } from "./org"
import { kpis } from "./pages"
import { vldcData } from "./registry"
import {
  REVIEWER, TOPIC_FIELDS, addProgress, canEditTopic, canReview, canSubmit, canUpdateProgress, canViewTopic, deadlineState,
  filterTopics, reviewTopic, submitTopic, topicStats, visibleTopics,
} from "./scienceCore"
import { resolveUnitChoice, unitChoiceGroups } from "./subUnitCore"
import type { ScienceTopic, TopicReviewDecision } from "./types"

/** KH-CN & Đổi mới: staff record their science topics and progress; accepted topics become public. */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }

const state = { tab: "active" as "active" | "done", field: "", query: "" }
const content = () => document.getElementById("content")
const title = (role: string) => ROLE_TITLES[role] || role
const personOf = (role: string) => ROLE_PROFILES[role]?.name || title(role)
/** Unit code and optional tổ of a picked value (subUnit cleared when a whole unit is picked). */
const unitOf = (picked: string) => {
  const c = resolveUnitChoice(picked, vldcData.get("subUnits"))
  return { unit: c?.unit ?? picked, subUnit: c?.subUnit ?? "" }
}
const topicUnit = (t: ScienceTopic) => resolveUnitChoice(t.subUnit || t.unit, vldcData.get("subUnits"))?.label ?? t.unit
const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
const files = (raw: string) => raw.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean)
const money = (n: number) => `${n.toLocaleString("vi-VN")} tr.đ`
const stamp = (iso?: string) => (iso ? vnDate(iso.slice(0, 10)) : "")
const STATUS_CLS: Record<string, string> = { "Đang triển khai": "b-info", "Chờ duyệt": "b-warn", "Đã triển khai": "b-ok" }
const DEADLINE: Record<string, [string, string] | null> = { overdue: ["Quá hạn", "b-danger"], soon: ["Sắp đến hạn", "b-warn"], ok: null }

/** One colour per field (index in TOPIC_FIELDS), so topics of the same field are spotted at a glance. */
const fieldTag = (field: string) => `<span class="vx-field-tag vx-field-${Math.max(0, TOPIC_FIELDS.indexOf(field))}">${esc(field)}</span>`

function progressBar(t: ScienceTopic): string {
  const color = deadlineState(t, localToday()) === "overdue" ? "var(--danger)" : t.status === "Đã triển khai" ? "var(--ok)" : "var(--primary)"
  return `<div class="vx-plan-bar"><i style="width:${t.progress}%;background:${color}"></i></div>`
}

function activeRow(t: ScienceTopic): string {
  const dl = DEADLINE[deadlineState(t, localToday())]
  const returned = t.review?.decision === "Trả lại" && t.status === "Đang triển khai" ? '<span class="badge b-danger">Bị trả lại</span>' : ""
  return `<div class="vx-topic-row" ${jsCall("topicOpen", t.id)}><div>${fieldTag(t.field)}<b>${esc(t.title)}</b><div class="mini">Chủ nhiệm ${esc(t.leadName)}${t.members.length ? ` • ${t.members.length} thành viên` : ""} • ${esc(topicUnit(t))}</div></div>
<div class="vx-topic-progress"><div class="vx-plan-nums"><b>${t.progress}%</b><span class="mini">hạn ${esc(vnDate(t.end))}</span></div>${progressBar(t)}</div>
<div class="vx-topic-badges"><span class="badge ${STATUS_CLS[t.status]}">${esc(t.status)}</span>${dl ? `<span class="badge ${dl[1]}">${dl[0]}</span>` : ""}${returned}</div></div>`
}

function doneCard(t: ScienceTopic): string {
  return `<article class="vx-news-card" ${jsCall("topicOpen", t.id)}><div class="vx-news-badges"><span class="badge b-ok">Đã triển khai</span>${fieldTag(t.field)}</div>
<h4>${esc(t.title)}</h4><p>${esc(t.result ?? "")}</p>${t.impact ? `<div class="vx-topic-impact">✓ ${esc(t.impact)}</div>` : ""}<div class="mini">${esc(t.leadName)} • ${esc(topicUnit(t))}${t.approvedAt ? ` • nghiệm thu ${esc(stamp(t.approvedAt))}` : ""}</div></article>`
}

export function installSciencePage(render: Record<string, () => void>, ctx: Ctx) {
  const all = () => vldcData.get("scienceTopics")
  const find = (id: string) => all().find((t) => t.id === id)

  function pageHtml(): string {
    const role = ctx.role()
    const today = localToday()
    const s = topicStats(all(), role, today)
    const leader = role === REVIEWER
    const mine = visibleTopics(all(), role)
    const active = filterTopics(mine.filter((t) => t.status !== "Đã triển khai"), state.field, state.query)
      .sort((a, b) => (a.status === "Chờ duyệt" ? -1 : 0) - (b.status === "Chờ duyệt" ? -1 : 0) || a.end.localeCompare(b.end))
    const done = filterTopics(mine.filter((t) => t.status === "Đã triển khai"), state.field, state.query)
      .sort((a, b) => (b.approvedAt ?? "").localeCompare(a.approvedAt ?? ""))
    const scope = leader ? "toàn Liên đoàn" : "bạn tham gia"
    const tab = (k: "active" | "done", label: string, n: number) =>
      `<button class="vx-news-chip${state.tab === k ? " active" : ""}" ${jsCall("topicTab", k)}>${label} (${n})</button>`
    const pending = leader ? mine.filter((t) => t.status === "Chờ duyệt") : []
    return `${kpis(
      `<div class="kpi vx-cap-pick" ${jsCall("topicTab", "active")}><div class="label">Đang triển khai</div><div class="value">${s.active}</div><div class="sub">Đề tài ${scope}</div></div>`,
      `<div class="kpi vx-cap-pick" ${jsCall("topicTab", "active")}><div class="label">Chờ duyệt nghiệm thu</div><div class="value">${s.pending}</div><div class="sub">${leader ? "Cần Liên đoàn trưởng duyệt" : "Đã trình, chờ duyệt"}</div></div>`,
      `<div class="kpi vx-cap-pick" ${jsCall("topicTab", "done")}><div class="label">Đã triển khai</div><div class="value">${s.done}</div><div class="sub">Công khai cho toàn Liên đoàn</div></div>`,
      `<div class="kpi ${s.overdue ? "vx-kpi-alert" : ""}"><div class="label">Quá hạn</div><div class="value">${s.overdue}</div><div class="sub">Đề tài đang triển khai đã qua hạn</div></div>`,
    )}
${pending.length ? `<div class="card" style="margin-top:14px;border-left:4px solid var(--warn)"><h3>Đề tài chờ duyệt nghiệm thu</h3>${pending.map((t) => `<div class="metric vx-cap-pick" ${jsCall("topicOpen", t.id)}><span><b>${esc(t.title)}</b><br><small>${esc(t.leadName)} • trình ${esc(stamp(t.submittedAt))}</small></span><b><span class="btn btn-primary">Xem & duyệt</span></b></div>`).join("")}</div>` : ""}
<div class="card vx-news-toolbar" style="margin-top:14px"><div class="vx-news-chips">${tab("active", "Đang triển khai", active.length)}${tab("done", "Đã triển khai", done.length)}</div>
<select onchange="topicField(this.value)"><option value="">Mọi lĩnh vực</option>${TOPIC_FIELDS.map((f) => `<option${f === state.field ? " selected" : ""}>${esc(f)}</option>`).join("")}</select>
<input placeholder="Tìm đề tài, chủ nhiệm, kết quả..." value="${esc(state.query)}" onchange="topicSearch(this.value)"><button class="btn btn-primary" ${jsCall("topicForm")}>+ Đề tài mới</button></div>
${state.tab === "active"
    ? `<div class="card"><div class="mini" style="margin-bottom:8px">Đề tài đang triển khai chỉ chủ nhiệm, thành viên và Liên đoàn trưởng xem được.</div>${active.map(activeRow).join("") || '<div class="mini">Bạn chưa tham gia đề tài nào đang triển khai. Bấm "+ Đề tài mới" để đăng ký đề tài.</div>'}</div>`
    : `<div class="vx-news-list">${done.map(doneCard).join("") || '<div class="card mini">Chưa có đề tài đã triển khai phù hợp.</div>'}</div>`}`
  }

  function rerender() {
    const el = content()
    if (el) el.innerHTML = pageHtml()
  }
  render.research = rerender

  function notify(roles: string[], text: string, body: string) {
    const now = new Date()
    roles.forEach((ownerRole, i) => void vldcData.save("notices", {
      id: `NTF-${now.getTime().toString(36).toUpperCase()}-${i}`, scope: "personal", ownerRole, title: text, body,
      time: `${vnDate(localToday()).slice(0, 5)} ${now.toTimeString().slice(0, 5)}`, priority: "Trung bình", readBy: [ctx.role()], link: "research",
    }))
  }

  function save(t: ScienceTopic) {
    void vldcData.save("scienceTopics", t)
    ctx.closeModal()
    rerender()
  }

  function topicOpen(id: string) {
    const t = find(id)
    const role = ctx.role()
    if (!t || !canViewTopic(t, role)) return
    const metric = (l: string, v: string) => `<div class="metric"><span>${l}</span><b>${v}</b></div>`
    const dl = DEADLINE[deadlineState(t, localToday())]
    const btns = [
      canUpdateProgress(t, role) ? `<button class="btn btn-primary" ${jsCall("topicProgressForm", t.id)}>Cập nhật tiến độ</button>` : "",
      canEditTopic(t, role) ? `<button class="btn btn-light" ${jsCall("topicForm", t.id)}>Sửa thông tin</button>` : "",
      canSubmit(t, role) ? `<button class="btn btn-light" ${jsCall("topicSubmitForm", t.id)}>Trình nghiệm thu</button>` : "",
    ].join("")
    const review = canReview(t, role)
      ? `<div class="form-grid" style="margin-top:12px"><div class="full"><label>Ý kiến của Liên đoàn trưởng (bắt buộc khi trả lại)</label><textarea id="tp-review" rows="2"></textarea></div></div><div class="toolbar"><button class="btn btn-ok" ${jsCall("topicReview", t.id, "Duyệt")}>Duyệt – công khai đề tài</button><button class="btn btn-light" ${jsCall("topicReview", t.id, "Trả lại")}>Trả lại</button></div>`
      : ""
    const lastReview = t.review?.decision === "Trả lại" && t.status === "Đang triển khai"
      ? `<div class="alert"><span class="dot red"></span><div><b>Bị trả lại ${esc(stamp(t.review.at))}</b><div class="mini">${esc(t.review.note)}</div></div></div>` : ""
    ctx.openModal(`Đề tài • ${t.id}`, `<div class="vx-news-badges"><span class="badge ${STATUS_CLS[t.status]}">${esc(t.status)}</span><span class="badge b-purple">${esc(t.field)}</span>${dl ? `<span class="badge ${dl[1]}">${dl[0]}</span>` : ""}</div>
<h2 style="margin:8px 0">${esc(t.title)}</h2>${lastReview}<p>${esc(t.objective)}</p>
<div class="grid twoeq"><div>${metric("Chủ nhiệm", `${esc(t.leadName)} (${esc(title(t.leadRole))})`)}${metric("Thành viên", esc(t.members.map(personOf).join(", ") || "–"))}${metric("Đơn vị", esc(topicUnit(t)))}${metric("Thời gian", `${esc(vnDate(t.start))} – ${esc(vnDate(t.end))}`)}${metric("Kinh phí", `${money(t.spent)} / ${money(t.budget)}`)}${metric("Tiến độ", `${t.progress}%`)}${progressBar(t)}
${t.attachments.length ? `<div style="margin-top:8px">${t.attachments.map((f) => `<span class="vx-doc-file">📎 ${esc(f)}</span>`).join("")}</div>` : ""}
${t.result ? `<h4>Kết quả / sản phẩm</h4><p>${esc(t.result)}</p><h4>Hiệu quả áp dụng</h4><p>${esc(t.impact ?? "")}</p>` : ""}</div>
<div><h4 style="margin-top:0">Nhật ký tiến độ</h4><div class="timeline">${[...t.log].reverse().map((l) => `<div><b>${esc(stamp(l.at))} • ${esc(l.byName)}</b> – ${l.progress}%<br>${esc(l.note)}</div>`).join("") || '<div class="mini">Chưa có cập nhật.</div>'}</div></div></div>
${btns ? `<div class="toolbar" style="margin-top:12px">${btns}</div>` : ""}${review}`)
  }

  function topicForm(id?: string) {
    const role = ctx.role()
    const t = id ? find(id) : undefined
    if (t && !canEditTopic(t, role)) return
    const unit = t?.unit ?? roleUnitCode(role) ?? "KT"
    const roles = Object.keys(ROLE_TITLES).filter((r) => r !== (t?.leadRole ?? role) && r !== "admin")
    const input = (key: string, label: string, val: string, type = "text", full = false) =>
      `<div${full ? ' class="full"' : ""}><label>${label}</label><input id="tp-${key}" type="${type}" value="${esc(val)}"></div>`
    ctx.openModal(t ? "Sửa đề tài" : "Đăng ký đề tài mới", `<div class="form-grid">
${input("title", "Tên đề tài *", t?.title ?? "", "text", true)}
<div><label>Lĩnh vực</label><select id="tp-field">${TOPIC_FIELDS.map((f) => `<option${f === t?.field ? " selected" : ""}>${esc(f)}</option>`).join("")}</select></div>
<div><label>Đơn vị / tổ chủ trì</label><select id="tp-unit">${unitChoiceGroups(vldcData.get("subUnits")).map((g) => `<optgroup label="${esc(g.name)}">${g.options.map((o) => `<option value="${esc(o.value)}"${o.value === (t?.subUnit ?? unit) ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</optgroup>`).join("")}</select></div>
<div class="full"><label>Mục tiêu *</label><textarea id="tp-objective" rows="2">${esc(t?.objective ?? "")}</textarea></div>
${input("start", "Bắt đầu *", t?.start ?? localToday(), "date")}${input("end", "Kết thúc *", t?.end ?? "", "date")}
${input("budget", "Kinh phí dự kiến (triệu đồng)", String(t?.budget ?? 0), "number")}${input("spent", "Đã chi (triệu đồng)", String(t?.spent ?? 0), "number")}
<div class="full"><label>Thành viên (chủ nhiệm là ${esc(personOf(t?.leadRole ?? role))})</label><div class="vx-doc-roles">${roles.map((r) => `<label><input type="checkbox" name="tp-member" value="${esc(r)}"${t?.members.includes(r) ? " checked" : ""}> ${esc(title(r))}</label>`).join("")}</div></div>
${input("files", "Tài liệu kèm theo (tên file, cách nhau bằng dấu phẩy)", t?.attachments.join(", ") ?? "", "text", true)}
</div><button class="btn btn-primary" style="margin-top:12px" ${jsCall("topicSave", t?.id ?? "")}>${t ? "Lưu thay đổi" : "Đăng ký đề tài"}</button>`)
  }

  function topicSave(id: string) {
    const role = ctx.role()
    const prev = id ? find(id) : undefined
    if (prev && !canEditTopic(prev, role)) return
    const titleText = value("tp-title"), objective = value("tp-objective"), start = value("tp-start"), end = value("tp-end")
    if (!titleText || !objective || !start || !end) return alert("Vui lòng nhập tên đề tài, mục tiêu và thời gian")
    if (end < start) return alert("Ngày kết thúc phải sau ngày bắt đầu")
    const members = [...document.querySelectorAll<HTMLInputElement>('input[name="tp-member"]:checked')].map((x) => x.value)
    const base: ScienceTopic = prev ?? {
      id: `DT-${Date.now().toString(36).toUpperCase()}`, leadRole: role, leadName: personOf(role), progress: 0, log: [],
      status: "Đang triển khai", createdAt: new Date().toISOString(), title: "", field: "", unit: "", objective: "", members: [],
      start: "", end: "", budget: 0, spent: 0, attachments: [],
    }
    save({
      ...base, title: titleText, field: value("tp-field"), ...unitOf(value("tp-unit")), objective, start, end, members,
      budget: Math.max(0, Number(value("tp-budget")) || 0), spent: Math.max(0, Number(value("tp-spent")) || 0), attachments: files(value("tp-files")),
    })
  }

  function topicProgressForm(id: string) {
    const t = find(id)
    if (!t || !canUpdateProgress(t, ctx.role())) return
    ctx.openModal(`Cập nhật tiến độ • ${t.id}`, `<div class="mini" style="margin-bottom:8px">${esc(t.title)} • hiện đạt ${t.progress}%</div><div class="form-grid">
<div><label>Tiến độ mới (%) *</label><input id="tp-progress" type="number" min="0" max="100" value="${t.progress}"></div>
<div class="full"><label>Việc đã làm *</label><textarea id="tp-note" rows="3"></textarea></div></div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("topicProgress", t.id)}>Lưu tiến độ</button>`)
  }

  function guarded(run: () => ScienceTopic, after?: (t: ScienceTopic) => void) {
    try {
      const next = run()
      save(next)
      after?.(next)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  function topicProgress(id: string) {
    const t = find(id)
    if (!t) return
    const role = ctx.role()
    guarded(() => addProgress(t, role, personOf(role), Number(value("tp-progress")), value("tp-note"), new Date().toISOString()))
  }

  function topicSubmitForm(id: string) {
    const t = find(id)
    if (!t || !canSubmit(t, ctx.role())) return
    ctx.openModal(`Trình nghiệm thu • ${t.id}`, `<div class="mini" style="margin-bottom:8px">${esc(t.title)} — sau khi Liên đoàn trưởng duyệt, đề tài được công khai cho toàn Liên đoàn.</div><div class="form-grid">
<div class="full"><label>Kết quả / sản phẩm *</label><textarea id="tp-result" rows="3">${esc(t.result ?? "")}</textarea></div>
<div class="full"><label>Hiệu quả áp dụng *</label><textarea id="tp-impact" rows="3">${esc(t.impact ?? "")}</textarea></div></div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("topicSubmit", t.id)}>Trình Liên đoàn trưởng</button>`)
  }

  function topicSubmit(id: string) {
    const t = find(id)
    if (!t) return
    guarded(() => submitTopic(t, ctx.role(), { result: value("tp-result"), impact: value("tp-impact") }, new Date().toISOString()),
      (next) => notify([REVIEWER], `Đề tài chờ duyệt: ${next.title}`, `${next.leadName} trình nghiệm thu đề tài.`))
  }

  function topicReview(id: string, decision: TopicReviewDecision) {
    const t = find(id)
    if (!t) return
    guarded(() => reviewTopic(t, ctx.role(), decision, value("tp-review"), new Date().toISOString()),
      (next) => notify([next.leadRole, ...next.members], decision === "Duyệt" ? `Đề tài đã được duyệt: ${next.title}` : `Đề tài bị trả lại: ${next.title}`,
        decision === "Duyệt" ? "Đề tài đã được công khai trong mục Đã triển khai." : next.review?.note ?? ""))
  }

  Object.assign(window, {
    topicOpen, topicForm, topicSave, topicProgressForm, topicProgress, topicSubmitForm, topicSubmit, topicReview,
    topicTab: (k: "active" | "done") => { state.tab = k; rerender() },
    topicField: (f: string) => { state.field = f; rerender() },
    topicSearch: (q: string) => { state.query = q; rerender() },
  })
}
