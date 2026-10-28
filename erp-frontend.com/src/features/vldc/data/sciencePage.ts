import { escapeHtml as esc, formatMillion, jsCall } from "../workflow/html"
import { ROLE_TITLES } from "../workflow/rules"
import { localToday, vnDate } from "./dates"
import { ROLE_PROFILES, roleUnitCode, unitName, type UnitCode } from "./org"
import { kpis } from "./pages"
import { vldcData } from "./registry"
import {
  REVIEWER, TOPIC_FIELDS, addProgress, canAttachFiles, canCreateTopic, canEditTopic, canReview, canSubmit, canUpdateProgress, canViewTopic, deadlineState,
  filterTopics, reviewTopic, seesAllUnits, submitTopic, topicStats, topicUnits, visibleTopics,
} from "./scienceCore"
import { resolveUnitChoice, unitChoiceGroups } from "./subUnitCore"
import { ACCEPT, MAX_FILES, MAX_FILE_MB, attachmentName, downloadFile, fileProblems, isFileUrl, uploadFiles } from "./files"
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
/** A stored file downloads through the API (token + scope check); a legacy plain name has no file behind it. */
const attachmentChip = (a: string) => isFileUrl(a)
  ? `<button type="button" class="vx-doc-file vx-att-link" title="Tải xuống" ${jsCall("topicFile", a)}>📎 ${esc(attachmentName(a))}</button>`
  : `<span class="vx-doc-file">📎 ${esc(a)} <i>(chưa có file gốc)</i></span>`
const money = formatMillion
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
    const units = [...topicUnits(role)]
    const scope = seesAllUnits(role) ? "toàn Liên đoàn" : units.length ? `của ${units.map((u) => unitName(u as UnitCode)).join(", ")}` : "bạn tham gia"
    const tab = (k: "active" | "done", label: string, n: number) =>
      `<button class="vx-news-chip${state.tab === k ? " active" : ""}" ${jsCall("topicTab", k)}>${label} (${n})</button>`
    const pending = leader ? mine.filter((t) => t.status === "Chờ duyệt") : []
    return `${kpis(
      `<div class="kpi vx-cap-pick" ${jsCall("topicTab", "active")}><div class="label">Đang triển khai</div><div class="value">${s.active}</div><div class="sub">Đề tài ${scope}</div></div>`,
      `<div class="kpi vx-cap-pick" ${jsCall("topicTab", "active")}><div class="label">Chờ duyệt nghiệm thu</div><div class="value">${s.pending}</div><div class="sub">${leader ? "Cần Liên đoàn trưởng duyệt" : "Đã trình, chờ duyệt"}</div></div>`,
      `<div class="kpi vx-cap-pick" ${jsCall("topicTab", "done")}><div class="label">Đã triển khai</div><div class="value">${s.done}</div><div class="sub">Công khai cho toàn Liên đoàn</div></div>`,
      `<div class="kpi ${s.overdue ? "vx-kpi-alert" : ""}"><div class="label">Quá hạn</div><div class="value">${s.overdue}</div><div class="sub">Đề tài đang triển khai đã qua hạn</div></div>`,
    )}
${pending.length ? `<div class="card" style="margin-top:14px;border-left:4px solid var(--warn)"><h3>Đề tài chờ duyệt nghiệm thu</h3>${pending.map((t) => `<div class="metric vx-cap-pick" ${jsCall("topicOpen", t.id)}><span><b>${esc(t.title)}</b><br><small>${esc(t.leadName)} • trình ${esc(stamp(t.submittedAt))}</small></span><button type="button" class="btn btn-primary">Xem & duyệt</button></div>`).join("")}</div>` : ""}
<div class="card vx-news-toolbar" style="margin-top:14px"><div class="vx-news-chips">${tab("active", "Đang triển khai", active.length)}${tab("done", "Đã triển khai", done.length)}</div>
<select onchange="topicField(this.value)"><option value="">Mọi lĩnh vực</option>${TOPIC_FIELDS.map((f) => `<option${f === state.field ? " selected" : ""}>${esc(f)}</option>`).join("")}</select>
<input placeholder="Tìm đề tài, chủ nhiệm, kết quả..." value="${esc(state.query)}" onchange="topicSearch(this.value)">${canCreateTopic(role) ? `<button class="btn btn-primary" ${jsCall("topicForm")}>+ Đề tài mới</button>` : ""}</div>
${state.tab === "active"
    ? `<div class="card"><div class="mini" style="margin-bottom:8px">Đề tài đang triển khai: người trong đơn vị chủ trì, chủ nhiệm, thành viên và Liên đoàn trưởng xem được; đề tài đã nghiệm thu công khai cho toàn Liên đoàn.</div>${active.map(activeRow).join("") || '<div class="mini">Bạn chưa tham gia đề tài nào đang triển khai. Bấm "+ Đề tài mới" để đăng ký đề tài.</div>'}</div>`
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

  /** Closes the form only once the backend has stored the topic; a rejection is shown and the form stays open. */
  async function save(t: ScienceTopic) {
    try {
      await vldcData.save("scienceTopics", t)
      ctx.closeModal()
      rerender()
    } catch (e) {
      alert(`Chưa lưu được đề tài: ${(e as Error).message}`)
    }
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
<div id="tp-att-list" style="margin-top:8px">${t.attachments.map(attachmentChip).join("")}</div>
${canAttachFiles(t, role) ? `<div class="vx-att-upload"><label>Nộp tài liệu (tối đa ${MAX_FILES} file, mỗi file ≤ ${MAX_FILE_MB} MB)</label><div class="toolbar"><input id="tp-attach" type="file" multiple accept="${ACCEPT}"><button id="tp-attach-btn" class="btn btn-light" ${jsCall("topicAttach", t.id)}>Tải lên</button></div></div>` : ""}
${t.result ? `<h4>Kết quả / sản phẩm</h4><p>${esc(t.result)}</p><h4>Hiệu quả áp dụng</h4><p>${esc(t.impact ?? "")}</p>` : ""}</div>
<div><h4 style="margin-top:0">Nhật ký tiến độ</h4><div class="timeline">${[...t.log].reverse().map((l) => `<div><b>${esc(stamp(l.at))} • ${esc(l.byName)}</b> – ${l.progress}%<br>${esc(l.note)}</div>`).join("") || '<div class="mini">Chưa có cập nhật.</div>'}</div></div></div>
${btns ? `<div class="toolbar" style="margin-top:12px">${btns}</div>` : ""}${review}`)
  }

  function topicForm(id?: string) {
    const role = ctx.role()
    const t = id ? find(id) : undefined
    if (t ? !canEditTopic(t, role) : !canCreateTopic(role)) return
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
<div class="full"><label>Tài liệu kèm theo (tối đa ${MAX_FILES} file, mỗi file ≤ ${MAX_FILE_MB} MB: PDF, Word, Excel, PowerPoint, ảnh, ZIP)</label>
<div id="tp-files">${(t?.attachments ?? []).map((a) => `<span class="vx-doc-file vx-att" data-value="${esc(a)}">📎 ${esc(attachmentName(a))}${isFileUrl(a) ? "" : " <i>(chưa có file gốc)</i>"} <button type="button" class="vx-att-x" title="Bỏ file" onclick="this.closest('.vx-att').remove()">×</button></span>`).join("")}</div>
<input id="tp-upload" type="file" multiple accept="${ACCEPT}" style="margin-top:6px"></div>
</div><button id="tp-save" class="btn btn-primary" style="margin-top:12px" ${jsCall("topicSave", t?.id ?? "")}>${t ? "Lưu thay đổi" : "Đăng ký đề tài"}</button>`)
  }

  /** The topic is saved first (a new one must exist before the backend accepts its files), then the picked files
   * are uploaded and their URLs saved on it. */
  async function topicSave(id: string) {
    const role = ctx.role()
    const prev = id ? find(id) : undefined
    if (prev ? !canEditTopic(prev, role) : !canCreateTopic(role)) return
    const titleText = value("tp-title"), objective = value("tp-objective"), start = value("tp-start"), end = value("tp-end")
    const missing = ([["tp-title", "Tên đề tài", titleText], ["tp-objective", "Mục tiêu", objective], ["tp-start", "Ngày bắt đầu", start], ["tp-end", "Ngày kết thúc", end]] as const)
      .find(([, , v]) => !v)
    if (missing) {
      document.getElementById(missing[0])?.focus()
      return alert(`Vui lòng nhập ${missing[1].toLowerCase()}`)
    }
    if (end < start) return alert("Ngày kết thúc phải sau ngày bắt đầu")
    const members = [...document.querySelectorAll<HTMLInputElement>('input[name="tp-member"]:checked')].map((x) => x.value)
    const kept = [...document.querySelectorAll<HTMLElement>("#tp-files .vx-att")].map((el) => el.dataset.value ?? "").filter(Boolean)
    const picked = [...((document.getElementById("tp-upload") as HTMLInputElement | null)?.files ?? [])]
    const problems = fileProblems(picked, kept.filter(isFileUrl).length)
    if (problems.length) return alert(problems.join("\n"))
    const base: ScienceTopic = prev ?? {
      id: `DT-${Date.now().toString(36).toUpperCase()}`, leadRole: role, leadName: personOf(role), progress: 0, log: [],
      status: "Đang triển khai", createdAt: new Date().toISOString(), title: "", field: "", unit: "", objective: "", members: [],
      start: "", end: "", budget: 0, spent: 0, attachments: [],
    }
    const topic: ScienceTopic = {
      ...base, title: titleText, field: value("tp-field"), ...unitOf(value("tp-unit")), objective, start, end, members,
      budget: Math.max(0, Number(value("tp-budget")) || 0), spent: Math.max(0, Number(value("tp-spent")) || 0), attachments: kept,
    }
    if (!picked.length) return save(topic)
    const button = document.getElementById("tp-save") as HTMLButtonElement | null
    if (button) {
      button.disabled = true
      button.textContent = `Đang tải ${picked.length} file lên…`
    }
    let topicSaved = false
    try {
      await vldcData.save("scienceTopics", topic)
      topicSaved = true
      const urls = await uploadFiles("science_topics", topic.id, picked)
      await save({ ...topic, attachments: [...kept, ...urls] })
    } catch (e) {
      alert(`${topicSaved ? "Đã lưu đề tài nhưng chưa tải được file" : "Chưa lưu được đề tài"}: ${(e as Error).message}`)
      if (button) {
        button.disabled = false
        button.textContent = prev ? "Lưu thay đổi" : "Đăng ký đề tài"
      }
    }
  }

  /** Hands in documents from the topic view: the backend stores them and adds their URLs to the topic itself. */
  async function topicAttach(id: string) {
    const t = find(id)
    if (!t || !canAttachFiles(t, ctx.role())) return
    const input = document.getElementById("tp-attach") as HTMLInputElement | null
    const picked = [...(input?.files ?? [])]
    if (!picked.length) return alert("Vui lòng chọn file")
    const problems = fileProblems(picked, t.attachments.filter(isFileUrl).length)
    if (problems.length) return alert(problems.join("\n"))
    const button = document.getElementById("tp-attach-btn") as HTMLButtonElement | null
    if (button) {
      button.disabled = true
      button.textContent = `Đang tải ${picked.length} file lên…`
    }
    try {
      const urls = await uploadFiles("science_topics", t.id, picked)
      // The list re-syncs from the server's change feed; show the new files right away.
      document.getElementById("tp-att-list")?.insertAdjacentHTML("beforeend", urls.map(attachmentChip).join(""))
      if (input) input.value = ""
    } catch (e) {
      alert(`Không tải được file: ${(e as Error).message}`)
    } finally {
      if (button) {
        button.disabled = false
        button.textContent = "Tải lên"
      }
    }
  }

  function topicFile(url: string) {
    downloadFile(url).catch((e) => alert(`Không tải được file: ${(e as Error).message}`))
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
    topicOpen, topicForm, topicSave, topicAttach, topicFile,topicProgressForm, topicProgress, topicSubmitForm, topicSubmit, topicReview,
    topicTab: (k: "active" | "done") => { state.tab = k; rerender() },
    topicField: (f: string) => { state.field = f; rerender() },
    topicSearch: (q: string) => { state.query = q; rerender() },
  })
}
