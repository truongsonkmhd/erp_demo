import { escapeHtml as esc, jsCall } from "../workflow/html"
import { ROLE_TITLES } from "../workflow/rules"
import { localToday, vnDate } from "./dates"
import {
  REPLY_RESULTS, canAssign, canManageAssignment, closeAssignment, docProgress, isOpenAssignment, markSeen, newAssignment,
  recipientState, remindPending, replyTo,
} from "./docAssignCore"
import { ROLE_PROFILES } from "./org"
import { vldcData } from "./registry"
import type { DocAssignment, ReplyResult } from "./types"

/** Giao xử lý văn bản đến: the section inside the document modal, the assign form, and the recipient's reply. */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }

const title = (role: string) => ROLE_TITLES[role] || role
const personOf = (role: string) => ROLE_PROFILES[role]?.name || title(role)
const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
const files = (raw: string) => raw.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean)
const stamp = (iso?: string) => {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return ""
  const two = (n: number) => String(n).padStart(2, "0")
  return `${two(d.getDate())}/${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`
}
/** "yyyy-mm-dd hh:mm" local, the processHistory timestamp format. */
const historyTime = () => {
  const d = new Date()
  return `${localToday()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}
const fileChips = (names: string[]) => names.map((n) => `<span class="vx-doc-file">📎 ${esc(n)}</span>`).join("")

/** "1/3" progress label for the incoming documents table. */
export function assignmentProgressHtml(docId: string): string {
  const p = docProgress(vldcData.get("docAssignments"), docId)
  if (!p.total) return '<span class="mini">–</span>'
  const cls = p.replied === p.total ? "b-ok" : p.open ? "b-warn" : "b-info"
  return `<span class="badge ${cls}" title="Số người đã trả lời / được giao">${p.replied}/${p.total}</span>`
}

function recipientHtml(a: DocAssignment, role: string): string {
  const today = localToday()
  return a.recipients.map((r) => {
    const s = recipientState(r, a, today)
    const reply = r.reply
      ? `<div class="vx-doc-reply"><b>${esc(r.reply.result)}</b> • ${esc(stamp(r.reply.at))}<div>${esc(r.reply.text)}</div>${fileChips(r.reply.attachments)}</div>`
      : `<div class="mini">${r.seenAt ? `Đã xem ${esc(stamp(r.seenAt))}` : "Chưa mở"}${r.remindedAt ? ` • đã nhắc ${esc(stamp(r.remindedAt))}` : ""}</div>`
    const act = !r.reply && r.role === role && isOpenAssignment(a) ? `<button class="btn btn-primary" ${jsCall("docAssignOpen", a.id)}>Trả lời</button>` : ""
    return `<div class="vx-doc-recipient"><div class="vx-doc-recipient-head"><div><b>${esc(title(r.role))}</b><div class="mini">${esc(personOf(r.role))}</div></div><div><span class="badge ${s.cls}">${s.overdue ? `${s.label} • quá hạn` : s.label}</span> ${act}</div></div>${reply}</div>`
  }).join("")
}

function assignmentHtml(a: DocAssignment, role: string): string {
  const replied = a.recipients.filter((r) => r.reply).length
  const manage = canManageAssignment(a, role) && isOpenAssignment(a)
  const pending = a.recipients.some((r) => !r.reply)
  const actions = manage
    ? `<div class="toolbar">${pending ? `<button class="btn btn-light" ${jsCall("docAssignRemind", a.id)}>Nhắc người chưa trả lời</button>` : ""}<button class="btn btn-light" ${jsCall("docAssignClose", a.id)}>Kết thúc giao</button></div>`
    : ""
  return `<div class="vx-doc-assign"><div class="vx-doc-assign-head"><div><b>${esc(a.id)}</b> • ${esc(a.assignedByName)} giao ${esc(stamp(a.createdAt))} • hạn ${esc(vnDate(a.due))}</div><span class="badge ${a.closedAt ? "b-ok" : "b-info"}">${a.closedAt ? "Đã kết thúc" : `${replied}/${a.recipients.length} đã trả lời`}</span></div>
<div class="mini">${esc(a.instruction)}</div>${a.attachments.length ? `<div>${fileChips(a.attachments)}</div>` : ""}${recipientHtml(a, role)}${actions}</div>`
}

/** Section of the incoming document modal: every phiếu giao of the document, plus the "Giao xử lý" button. */
export function assignmentSectionHtml(docId: string, role: string): string {
  const list = vldcData.get("docAssignments").filter((a) => a.docId === docId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const add = canAssign(role) ? `<button class="btn btn-primary" ${jsCall("docAssignForm", docId)}>Giao xử lý</button>` : ""
  return `<div class="vx-doc-section"><div class="card-head"><h4 style="margin:0">Giao xử lý & trả lời</h4>${add}</div>${list.map((a) => assignmentHtml(a, role)).join("") || '<div class="mini">Văn bản chưa được giao cho ai.</div>'}</div>`
}

export function installDocAssign(ctx: Ctx) {
  const find = (id: string) => vldcData.get("docAssignments").find((a) => a.id === id)

  /** Appends a line to the document's processHistory (and moves a new document to "Đã phân công"). */
  function logOnDoc(docId: string, action: string, note?: string, status?: string) {
    const doc = vldcData.get("incomingDocuments").find((d) => d.id === docId)
    if (!doc) return
    const role = ctx.role()
    const entry = { id: `${docId}-${Date.now().toString(36)}`, action, actor: personOf(role), role: title(role), timestamp: historyTime(), ...(note ? { note } : {}) }
    void vldcData.save("incomingDocuments", { ...doc, ...(status ? { status: status as typeof doc.status } : {}), processHistory: [...doc.processHistory, entry], updatedAt: new Date().toISOString() })
  }

  function notify(roles: string[], titleText: string, body: string) {
    const now = new Date()
    roles.forEach((ownerRole, i) => void vldcData.save("notices", {
      id: `NTF-${now.getTime().toString(36).toUpperCase()}-${i}`, scope: "personal", ownerRole, title: titleText, body,
      time: `${vnDate(localToday()).slice(0, 5)} ${now.toTimeString().slice(0, 5)}`, priority: "Cao", readBy: [ctx.role()], link: "action",
    }))
  }

  function docAssignForm(docId: string) {
    const doc = vldcData.get("incomingDocuments").find((d) => d.id === docId)
    if (!doc || !canAssign(ctx.role())) return
    const roles = Object.keys(ROLE_TITLES).filter((r) => r !== ctx.role() && r !== "admin")
    const dms = [...vldcData.get("dmsFiles")].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8)
    const due = doc.dueDate && doc.dueDate >= localToday() ? doc.dueDate : ""
    ctx.openModal(`Giao xử lý • ${doc.documentNumber}`, `<div class="mini" style="margin-bottom:10px">${esc(doc.summary)}</div><div class="form-grid">
<div class="full"><label>Người nhận * (chọn một hoặc nhiều)</label><div class="vx-doc-roles">${roles.map((r) => `<label class="vx-news-check"><input type="checkbox" name="da-role" value="${esc(r)}"> ${esc(title(r))}</label>`).join("")}</div></div>
<div class="full"><label>Nội dung chỉ đạo *</label><textarea id="da-instruction" rows="3">${esc(doc.instruction ?? "")}</textarea></div>
<div><label>Hạn trả lời *</label><input id="da-due" type="date" value="${esc(due)}"></div>
<div class="full"><label>Tài liệu kèm theo từ DMS</label><div class="vx-doc-roles">${[`${doc.documentNumber}.pdf`, ...dms.map((f) => f.name)].map((n) => `<label class="vx-news-check"><input type="checkbox" name="da-file" value="${esc(n)}"${n === `${doc.documentNumber}.pdf` ? " checked" : ""}> ${esc(n)}</label>`).join("")}</div></div>
<div class="full"><label>Tên file khác (cách nhau bằng dấu phẩy)</label><input id="da-files" placeholder="Ví dụ: Mẫu báo cáo.xlsx"></div>
</div><button class="btn btn-primary" style="margin-top:12px" ${jsCall("docAssignSave", docId)}>Giao xử lý</button>`)
  }

  function docAssignSave(docId: string) {
    const doc = vldcData.get("incomingDocuments").find((d) => d.id === docId)
    const role = ctx.role()
    if (!doc || !canAssign(role)) return
    const checked = (name: string) => [...document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)].map((x) => x.value)
    const recipients = checked("da-role"), instruction = value("da-instruction"), due = value("da-due")
    if (!recipients.length) return alert("Vui lòng chọn ít nhất một người nhận")
    if (!instruction || !due) return alert("Vui lòng nhập nội dung chỉ đạo và hạn trả lời")
    const a = newAssignment({
      id: `GX-${Date.now().toString(36).toUpperCase()}`, docId, docNumber: doc.documentNumber, docSummary: doc.summary, instruction, due,
      attachments: [...new Set([...checked("da-file"), ...files(value("da-files"))])], assignedBy: role, assignedByName: personOf(role),
      recipients, now: new Date().toISOString(),
    })
    void vldcData.save("docAssignments", a)
    logOnDoc(docId, "Giao xử lý", `${a.recipients.map((r) => title(r.role)).join(", ")} • hạn ${vnDate(due)}`,
      doc.status === "Mới tiếp nhận" || doc.status === "Đã tiếp nhận" ? "Đã phân công" : undefined)
    notify(recipients, `Được giao xử lý: ${doc.documentNumber}`, `${doc.summary} — hạn trả lời ${vnDate(due)}`)
    ctx.closeModal()
  }

  /** Recipient view: marks the phiếu seen and shows the reply form; others see the phiếu read-only. */
  function docAssignOpen(id: string) {
    let a = find(id)
    if (!a) return
    const role = ctx.role()
    const seen = markSeen(a, role, new Date().toISOString())
    if (seen !== a) { void vldcData.save("docAssignments", seen); a = seen }
    const me = a.recipients.find((r) => r.role === role)
    const form = me && !me.reply && isOpenAssignment(a)
      ? `<div class="form-grid" style="margin-top:12px"><div><label>Kết quả *</label><select id="da-result">${REPLY_RESULTS.map((r) => `<option>${esc(r)}</option>`).join("")}</select></div>
<div class="full"><label>Nội dung trả lời *</label><textarea id="da-reply" rows="4"></textarea></div>
<div class="full"><label>File kèm theo (tên file, cách nhau bằng dấu phẩy)</label><input id="da-reply-files" placeholder="Ví dụ: Báo cáo kết quả.docx"></div></div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("docAssignReply", a.id)}>Gửi trả lời</button>`
      : ""
    ctx.openModal(`Phiếu giao • ${a.docNumber}`, `<h3 style="margin-top:0">${esc(a.docSummary)}</h3>${assignmentHtml(a, role)}${form}<div class="toolbar" style="margin-top:10px"><button class="btn btn-light" ${jsCall("documentDetail", a.docId)}>Mở văn bản</button></div>`)
  }

  function docAssignReply(id: string) {
    const a = find(id)
    if (!a) return
    const role = ctx.role()
    try {
      const next = replyTo(a, role, { result: value("da-result") as ReplyResult, text: value("da-reply"), attachments: files(value("da-reply-files")) }, new Date().toISOString())
      void vldcData.save("docAssignments", next)
      const reply = next.recipients.find((r) => r.role === role)!.reply!
      logOnDoc(a.docId, "Trả lời giao xử lý", `${reply.result}: ${reply.text}`)
      notify([a.assignedBy], `${title(role)} đã trả lời ${a.docNumber}`, `${reply.result}: ${reply.text}`)
      ctx.closeModal()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  function docAssignRemind(id: string) {
    const a = find(id)
    if (!a || !canManageAssignment(a, ctx.role())) return
    const pending = a.recipients.filter((r) => !r.reply).map((r) => r.role)
    void vldcData.save("docAssignments", remindPending(a, new Date().toISOString()))
    notify(pending, `Nhắc trả lời: ${a.docNumber}`, `${a.docSummary} — hạn ${vnDate(a.due)}`)
    logOnDoc(a.docId, "Nhắc trả lời", pending.map(title).join(", "))
    ctx.closeModal()
  }

  function docAssignClose(id: string) {
    const a = find(id)
    if (!a || !canManageAssignment(a, ctx.role())) return
    const pending = a.recipients.filter((r) => !r.reply).length
    if (pending && !confirm(`Còn ${pending} người chưa trả lời. Vẫn kết thúc giao?`)) return
    void vldcData.save("docAssignments", closeAssignment(a, new Date().toISOString()))
    const others = vldcData.get("docAssignments").filter((x) => x.docId === a.docId && x.id !== a.id && isOpenAssignment(x))
    logOnDoc(a.docId, "Kết thúc giao xử lý", `${a.recipients.length - pending}/${a.recipients.length} đã trả lời`, others.length ? undefined : "Hoàn thành")
    ctx.closeModal()
  }

  Object.assign(window, { docAssignForm, docAssignSave, docAssignOpen, docAssignReply, docAssignRemind, docAssignClose })
}
