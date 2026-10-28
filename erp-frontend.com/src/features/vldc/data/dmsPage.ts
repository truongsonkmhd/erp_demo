import { escapeHtml as esc, jsCall } from "../workflow/html"
import { localToday, vnDate } from "./dates"
import { dmsStore, folderTree, moveTargets, MAX_LEVEL, type DmsDoc, type DmsFolder } from "./dmsStore"
import { ACCEPT, MAX_FILE_MB, downloadFile, fileProblems } from "./files"
import * as K from "./knowledgeMetrics"
import { canSeeProject, unitCodeOf } from "./org"
import { projectsView } from "./projectView"

/**
 * DMS – hồ sơ điện tử theo dự án: folders up to 3 levels, real files kept on the backend's disk, versions with
 * check-out / check-in, copy and move inside one project. Every action is a backend call (dmsStore); the page only
 * renders what the backend returned for this user's scope and shows delete buttons where the backend allows them.
 * Look and feel follow iOS: inset grouped lists, a search field on top, disclosure chevrons, a drop zone.
 */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }

const state = { project: "", folder: "", query: "", collapsed: new Set<string>(), shownFolder: "", uploading: "" }
const initTried = new Set<string>()

const content = () => document.getElementById("content")
const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
const size = (n: number | null) => (n == null ? "–" : n >= 1048576 ? `${(n / 1048576).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
const fail = (e: unknown) => alert((e as Error).message || "Thao tác không thành công")
const currentUrl = (d: DmsDoc) => d.versions.find((v) => v.version === d.version)?.url ?? null

// ---------- Icons (inline SVG, stroke = currentColor)
const svg = (path: string, cls = "") => `<svg class="vx-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`
const I = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  chevron: svg('<path d="m9 6 6 6-6 6"/>', "vx-chev"),
  folder: svg('<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.6l2 2h7.4A2.5 2.5 0 0 1 21 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5z"/>', "vx-folder-ic"),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  edit: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>'),
  move: svg('<path d="M7 7h11l-3-3M17 17H6l3 3"/>'),
  trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  download: svg('<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>'),
  copy: svg('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  upload: svg('<path d="M12 16V5m0 0-4 4m4-4 4 4M5 15v2.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V15"/>'),
}

/** Coloured tile with the file type, like the Files app. */
function fileTile(format: string) {
  const f = format.toUpperCase()
  const tone = f === "PDF" ? "red" : /DOC/.test(f) ? "blue" : /XLS|CSV/.test(f) ? "green" : /PPT/.test(f) ? "orange" : /JPG|JPEG|PNG|TIFF|TIF/.test(f) ? "purple" : "gray"
  return `<span class="vx-file-tile vx-tone-${tone}">${esc(f.slice(0, 4))}</span>`
}

/** Round icon button inside a clickable row (does not select the row). */
const act = (icon: string, title: string, fn: string, ...args: string[]) =>
  `<button class="vx-ios-act" title="${esc(title)}" aria-label="${esc(title)}" ${args.map((a, i) => `data-arg${i}="${esc(a)}"`).join(" ")} onclick="event.stopPropagation();${fn}(${args.map((_, i) => `this.dataset.arg${i}`).join(",")})">${icon}</button>`

export function installDmsPage(render: Record<string, () => void>, ctx: Ctx) {
  const projects = () => projectsView().filter((p) => canSeeProject(ctx.role(), p.unit))
  const folderById = (id: string) => dmsStore.folders().find((f) => f.id === id)
  const docById = (id: string) => dmsStore.documents().find((d) => d.id === id)

  function rerender() {
    const el = content()
    if (el && location.pathname.endsWith("/dms")) el.innerHTML = pageHtml()
  }

  /** A project opened for the first time gets its 8 standard folders (backend checks the unit is in scope). */
  function ensureFolders(projectId: string, unit: string | undefined) {
    if (!projectId || initTried.has(projectId) || dmsStore.folders().some((f) => f.projectId === projectId)) return
    const code = unitCodeOf(unit)
    if (!code) return
    initTried.add(projectId)
    dmsStore.initProject(projectId, code).then(rerender).catch((e) => console.warn("[dms] Khởi tạo hồ sơ lỗi:", e))
  }

  // ---------- Rows
  function folderRow(f: DmsFolder, tree: DmsFolder[], docs: DmsDoc[]) {
    const count = docs.filter((d) => d.folderId === f.id).length
    const hasChildren = tree.some((x) => x.parentId === f.id)
    const open = !state.collapsed.has(f.id)
    const chevron = hasChildren
      ? `<button class="vx-disclosure${open ? " open" : ""}" aria-label="${open ? "Thu gọn" : "Mở rộng"}" data-arg0="${esc(f.id)}" onclick="event.stopPropagation();dmsToggleFolder(this.dataset.arg0)">${I.chevron}</button>`
      : '<span class="vx-disclosure-space"></span>'
    const actions = [
      f.level < MAX_LEVEL ? act(I.plus, "Tạo thư mục con", "dmsFolderForm", f.projectId, f.id) : "",
      act(I.edit, "Đổi tên", "dmsRenameForm", f.id),
      act(I.move, "Chuyển thư mục", "dmsMoveFolderForm", f.id),
      f.canDelete ? act(I.trash, "Xóa (chỉ khi trống)", "dmsDeleteFolder", f.id) : "",
    ].join("")
    return `<div class="vx-ios-row vx-folder-row lvl-${f.level}${f.id === state.folder ? " selected" : ""}" ${jsCall("dmsSelectFolder", f.id)}>
${chevron}${I.folder}<span class="vx-row-title">${esc(f.name)}</span><span class="vx-row-actions">${actions}</span><span class="vx-count">${count}</span></div>`
  }

  /** Folders in tree order, skipping those under a collapsed parent. */
  function visibleTree(tree: DmsFolder[]) {
    const hidden = new Set<string>()
    return tree.filter((f) => {
      if (f.parentId && (hidden.has(f.parentId) || state.collapsed.has(f.parentId))) {
        hidden.add(f.id)
        return false
      }
      return true
    })
  }

  function docRow(d: DmsDoc) {
    const url = currentUrl(d)
    const meta = [vnDate(d.updatedAt), d.author].filter(Boolean).map(esc).join(" · ")
    const actions = [
      url ? act(I.download, "Tải về", "dmsDownload", url) : "",
      act(I.copy, "Sao chép sang thư mục khác", "dmsDocTargetForm", d.id, "copy"),
      act(I.move, "Chuyển sang thư mục khác", "dmsDocTargetForm", d.id, "move"),
      d.canDelete ? act(I.trash, "Xóa tài liệu", "dmsDeleteDoc", d.id) : "",
    ].join("")
    return `<div class="vx-ios-row vx-doc-row" ${jsCall("openDmsFile", d.id)}>${fileTile(d.format)}
<div class="vx-doc-main"><div class="vx-row-title">${esc(d.name)}</div><div class="vx-row-sub">${meta}${url ? "" : ' · <i title="Tài liệu nhập từ hệ thống cũ">chưa có file gốc</i>'}</div></div>
<span class="vx-row-actions always">${actions}</span></div>`
  }

  function searchHits(): string {
    const q = state.query.trim().toLowerCase()
    if (!q) return ""
    const hits = dmsStore.documents().filter((d) => `${d.name} ${d.folder} ${d.format} ${d.projectId}`.toLowerCase().includes(q)).slice(0, 12)
    return `<div class="vx-ios-group vx-search-results">${hits.map((d) => `<div class="vx-ios-row vx-doc-row" ${jsCall("dmsGoTo", d.id)}>${fileTile(d.format)}<div class="vx-doc-main"><div class="vx-row-title">${esc(d.name)}</div><div class="vx-row-sub">${esc(d.projectId)} · ${esc(d.folder)}</div></div>${I.chevron}</div>`).join("") || '<div class="vx-empty-row">Không tìm thấy tài liệu phù hợp</div>'}</div>`
  }

  function pageHtml(): string {
    const m = K.dmsMetrics(dmsStore.files(), localToday())
    const list = projects()
    const project = list.find((p) => p.id === state.project) ?? list[0]
    state.project = project?.id ?? ""
    ensureFolders(state.project, project?.unit)
    const tree = folderTree(state.project, dmsStore.folders())
    if (!tree.some((f) => f.id === state.folder)) state.folder = tree[0]?.id ?? ""
    const docs = dmsStore.documents().filter((d) => d.projectId === state.project)
    const folder = folderById(state.folder)
    const inFolder = docs.filter((d) => d.folderId === state.folder).sort((a, b) => a.name.localeCompare(b.name, "vi"))
    // The document list slides in only when another folder is opened, not on every data refresh.
    const enter = state.shownFolder !== state.folder ? " vx-enter" : ""
    state.shownFolder = state.folder
    const options = list.map((p) => `<option value="${esc(p.id)}"${p.id === state.project ? " selected" : ""}>${esc(p.id)} – ${esc(p.name)}</option>`).join("")
    // Breadcrumb of the parents only (the folder itself is the heading below it).
    const crumbs = folder ? folder.path.split(" / ").slice(0, -1).map((n) => `<span>${esc(n)}</span>`).join(I.chevron) : ""
    const stat = (n: number, label: string) => `<div class="vx-ios-stat"><b>${n.toLocaleString("vi-VN")}</b><span>${label}</span></div>`
    const drop = folder
      ? `<label class="vx-drop${state.uploading ? " busy" : ""}" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="event.preventDefault();this.classList.remove('over');dmsDropFiles(event.dataTransfer.files)">
<input id="dms-files" type="file" multiple accept="${ACCEPT}" onchange="dmsDropFiles(this.files)" hidden>${I.upload}<span>${state.uploading ? esc(state.uploading) : `<b>Kéo thả file vào đây</b> hoặc bấm để chọn`}</span><small>Tối đa 10 file, mỗi file ≤ ${MAX_FILE_MB} MB · PDF, Word, Excel, PowerPoint, ảnh, ZIP</small></label>`
      : ""
    return `<div class="vx-dms">
<div class="vx-ios-search">${I.search}<input id="dmsq" type="search" value="${esc(state.query)}" placeholder="Tìm tài liệu theo tên, thư mục, mã dự án" oninput="dmsSearchLive(this.value)" autocomplete="off"></div>
<div id="dms-results">${searchHits()}</div>
<div class="vx-ios-stats">${stat(m.files, "Tài liệu")}${stat(m.projects, "Hồ sơ dự án")}${stat(m.recent, "Cập nhật 30 ngày gần nhất")}</div>
<div class="vx-dms-layout">
<section class="vx-ios-panel"><div class="vx-panel-head"><h3>Hồ sơ dự án</h3>${state.project ? `<button class="vx-ios-btn" ${jsCall("dmsFolderForm", state.project, "")}>${I.plus}Thư mục</button>` : ""}</div>
<div class="vx-ios-select"><select onchange="dmsSelectProject(this.value)">${options}</select></div>
<div class="vx-ios-group vx-tree">${visibleTree(tree).map((f) => folderRow(f, tree, docs)).join("") || '<div class="vx-empty-row">Đang khởi tạo hồ sơ…</div>'}</div>
<p class="vx-footnote">Tối đa ${MAX_LEVEL} cấp thư mục · sao chép, chuyển trong cùng dự án</p></section>
<section class="vx-ios-panel"><div class="vx-panel-head"><div><div class="vx-crumbs">${crumbs}</div><h3>${folder ? esc(folder.name) : "Chọn thư mục"}</h3></div><span class="vx-count big">${inFolder.length} tài liệu</span></div>
${drop}
<div class="vx-ios-group vx-docs${enter}">${inFolder.map(docRow).join("") || `<div class="vx-empty">${I.folder}<b>Thư mục trống</b><span>Kéo thả file vào ô phía trên để thêm tài liệu</span></div>`}</div></section>
</div></div>`
  }

  render.dms = () => {
    void dmsStore.start().then(rerender)
    const el = content()
    if (el) el.innerHTML = pageHtml()
  }

  // ---------- Folders
  function dmsFolderForm(projectId: string, parentId: string) {
    const parent = parentId ? folderById(parentId) : undefined
    ctx.openModal(parent ? `Thư mục con của “${parent.path}”` : "Thư mục mới (cấp 1)", `<div class="form-grid"><div class="full"><label>Tên thư mục *</label><input id="dms-folder-name" maxlength="150"></div></div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("dmsCreateFolder", projectId, parentId)}>Tạo thư mục</button>`)
  }
  function dmsCreateFolder(projectId: string, parentId: string) {
    const name = value("dms-folder-name")
    if (!name) return alert("Vui lòng nhập tên thư mục")
    dmsStore.createFolder(projectId, parentId || null, name).then(() => {
      if (parentId) state.collapsed.delete(parentId)
      ctx.closeModal()
      rerender()
    }, fail)
  }
  function dmsRenameForm(id: string) {
    const f = folderById(id)
    if (!f) return
    ctx.openModal(`Đổi tên thư mục`, `<div class="form-grid"><div class="full"><label>Tên mới *</label><input id="dms-folder-name" maxlength="150" value="${esc(f.name)}"></div></div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("dmsRenameFolder", id)}>Lưu</button>`)
  }
  function dmsRenameFolder(id: string) {
    const name = value("dms-folder-name")
    if (!name) return alert("Vui lòng nhập tên thư mục")
    dmsStore.renameFolder(id, name).then(() => { ctx.closeModal(); rerender() }, fail)
  }
  function dmsMoveFolderForm(id: string) {
    const f = folderById(id)
    if (!f) return
    const targets = moveTargets(f, dmsStore.folders())
    const options = [f.parentId ? `<option value="">– Cấp cao nhất –</option>` : "", ...targets.map((t) => `<option value="${esc(t.id)}">${esc(t.path)}</option>`)].join("")
    if (!options) return alert("Không có vị trí nào để chuyển thư mục này mà vẫn giữ tối đa 3 cấp")
    ctx.openModal(`Chuyển thư mục “${f.path}”`, `<div class="form-grid"><div class="full"><label>Chuyển vào</label><select id="dms-target">${options}</select></div></div>
<div class="mini" style="margin-top:6px">Toàn bộ thư mục con và tài liệu đi theo. Chỉ hiện các vị trí trong cùng dự án mà vẫn giữ tối đa ${MAX_LEVEL} cấp.</div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("dmsMoveFolder", id)}>Chuyển</button>`)
  }
  function dmsMoveFolder(id: string) {
    dmsStore.moveFolder(id, value("dms-target") || null).then(() => { ctx.closeModal(); rerender() }, fail)
  }
  function dmsDeleteFolder(id: string) {
    const f = folderById(id)
    if (!f || !confirm(`Xóa thư mục “${f.path}”? (chỉ xóa được khi thư mục trống)`)) return
    dmsStore.deleteFolder(id).then(rerender, fail)
  }

  // ---------- Documents
  /** Files dropped on (or picked from) the drop zone go straight into the open folder. */
  async function dmsDropFiles(list: FileList | null) {
    const picked = [...(list ?? [])]
    if (!picked.length || state.uploading) return
    const problems = fileProblems(picked, 0)
    if (picked.length > 10) problems.push("Tối đa 10 file mỗi lần tải")
    if (problems.length) return alert(problems.join("\n"))
    state.uploading = `Đang tải ${picked.length} file lên…`
    rerender()
    try {
      await dmsStore.upload(state.folder, picked, [])
    } catch (e) {
      fail(e)
    } finally {
      state.uploading = ""
      rerender()
    }
  }

  function openDmsFile(id: string) {
    const d = docById(id)
    if (!d) return alert("Không tìm thấy tài liệu hoặc bạn không có quyền xem")
    const history = [...d.versions].reverse().map((v) => `<tr><td>${esc(v.fileName ?? "–")}</td><td>${size(v.size)}</td><td>${esc(v.uploadedBy ?? "–")}</td><td>${esc(v.uploadedAt.replace("T", " ").slice(0, 16))}</td><td class="mini">${esc(v.note ?? "")}</td><td>${v.url ? act(I.download, "Tải về", "dmsDownload", v.url) : '<span class="mini">không có file</span>'}</td></tr>`).join("")
    ctx.openModal(`Tài liệu • ${d.name}`, `<div class="mini" style="margin-bottom:8px">${esc(d.projectId)} • ${esc(d.folder)} • tác giả ${esc(d.author)}</div>
<div class="form-grid"><div class="full"><label>Tên tài liệu</label><input id="dms-doc-name" maxlength="255" value="${esc(d.name)}"></div></div>
<button class="btn btn-light" style="margin-top:8px" ${jsCall("dmsSaveMeta", d.id)}>Lưu thông tin</button>
<h4 style="margin-top:14px">Lịch sử</h4><div class="vx-staff-table"><table><tr><th>File</th><th>Dung lượng</th><th>Người tải</th><th>Thời gian</th><th>Ghi chú</th><th></th></tr>${history}</table></div>`)
  }

  function dmsSaveMeta(id: string) {
    dmsStore.updateMetadata(id, { name: value("dms-doc-name") }).then(() => { rerender(); openDmsFile(id) }, fail)
  }

  function dmsDocTargetForm(id: string, mode: "copy" | "move") {
    const d = docById(id)
    if (!d) return
    const targets = folderTree(d.projectId, dmsStore.folders()).filter((f) => mode === "copy" || f.id !== d.folderId)
    ctx.openModal(`${mode === "copy" ? "Sao chép" : "Chuyển"} “${d.name}”`, `<div class="form-grid"><div class="full"><label>${mode === "copy" ? "Sao chép vào" : "Chuyển vào"} (trong dự án ${esc(d.projectId)})</label>
<select id="dms-target">${targets.map((f) => `<option value="${esc(f.id)}">${"— ".repeat(f.level - 1)}${esc(f.name)}</option>`).join("")}</select></div></div>
${mode === "copy" ? '<div class="mini" style="margin-top:6px">Bản sao là tài liệu độc lập (file được nhân bản trên máy chủ, bắt đầu từ v1).</div>' : ""}
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("dmsDocTarget", id, mode)}>${mode === "copy" ? "Sao chép" : "Chuyển"}</button>`)
  }
  function dmsDocTarget(id: string, mode: "copy" | "move") {
    const target = value("dms-target")
    if (!target) return alert("Vui lòng chọn thư mục")
    const run = mode === "copy" ? dmsStore.copy(id, target) : dmsStore.move(id, target)
    run.then(() => { ctx.closeModal(); state.folder = target; rerender() }, fail)
  }
  function dmsDeleteDoc(id: string) {
    const d = docById(id)
    if (!d || !confirm(`Xóa tài liệu “${d.name}” và toàn bộ ${d.versions.length} phiên bản? Không thể hoàn tác.`)) return
    dmsStore.deleteDocument(id).then(rerender, fail)
  }

  Object.assign(window, {
    dmsFolderForm, dmsCreateFolder, dmsRenameForm, dmsRenameFolder, dmsMoveFolderForm, dmsMoveFolder, dmsDeleteFolder,
    dmsDropFiles, openDmsFile, dmsSaveMeta, dmsDocTargetForm, dmsDocTarget, dmsDeleteDoc,
    dmsDownload: (url: string) => downloadFile(url).catch(fail),
    dmsSelectProject: (id: string) => { state.project = id; state.folder = ""; rerender() },
    dmsSelectFolder: (id: string) => { state.folder = id; rerender() },
    dmsToggleFolder: (id: string) => {
      if (state.collapsed.has(id)) state.collapsed.delete(id)
      else state.collapsed.add(id)
      rerender()
    },
    /** Live search: only the result list is redrawn, so the field keeps focus while typing. */
    dmsSearchLive: (q: string) => {
      state.query = q
      const results = document.getElementById("dms-results")
      if (results) results.innerHTML = searchHits()
    },
    /** Opens a document found by search (or linked from another page) in its own folder. */
    dmsGoTo: (id: string) => {
      const d = docById(id)
      if (!d) return
      state.project = d.projectId
      state.folder = d.folderId
      state.query = ""
      rerender()
      openDmsFile(id)
    },
  })
}
