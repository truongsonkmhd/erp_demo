import { apiRequest, apiUpload } from "@/lib/api"
import { changeFeed } from "./registry"
import type { DmsFile } from "./types"

/**
 * DMS – hồ sơ điện tử, served by the backend (/api/vldc/dms, MySQL + files on the server's disk). The client only
 * reads what its scope allows and asks the backend for every change (it never writes folder or document rows), then
 * re-fetches; other open pages re-fetch from the /topic/vldc/dms feed.
 */

export const MAX_LEVEL = 3
export type DmsFolder = { id: string; projectId: string; unit: string; parentId: string | null; name: string; level: number; path: string; canDelete: boolean }
export type DmsVersion = { version: number; url: string | null; fileName: string | null; size: number | null; uploadedBy: string | null; uploadedAt: string; note: string | null }
export type DmsDoc = {
  id: string; projectId: string; folderId: string; folder: string; name: string; format: string; status: string; tags: string[]
  version: number; author: string; checkedOutBy: string | null; checkedOutByMe: boolean; updatedAt: string; canDelete: boolean; versions: DmsVersion[]
}

const BASE = "/api/vldc/dms"
let state: { folders: DmsFolder[]; documents: DmsDoc[] } = { folders: [], documents: [] }
let loaded: Promise<void> | undefined
let stopWatch: (() => void) | undefined
const listeners = new Set<() => void>()

async function refresh() {
  const tree = await apiRequest<{ folders: DmsFolder[]; documents: DmsDoc[] }>(BASE)
  state = { folders: tree.folders ?? [], documents: tree.documents ?? [] }
  listeners.forEach((fn) => fn())
}

/** Runs a change on the backend, then re-reads the tree so the page shows the result at once. */
async function change<T>(run: () => Promise<T>): Promise<T> {
  const result = await run()
  await refresh()
  return result
}

const post = <T = void>(path: string, body?: unknown) => apiRequest<T>(`${BASE}${path}`, { method: "POST", body: body ?? {} })

export const dmsStore = {
  start(): Promise<void> {
    stopWatch ??= changeFeed.watch("dms", () => void refresh().catch((e) => console.warn("[dms] Tải lại lỗi:", e)))
    return (loaded ??= refresh().catch((e) => {
      loaded = undefined
      console.warn("[dms] Không tải được hồ sơ điện tử:", e)
    }))
  },
  onChange(fn: () => void): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  folders: () => state.folders,
  documents: () => state.documents,
  /** Documents in the shape the search, data hub and project pages use. */
  files: (): DmsFile[] => state.documents.map((d) => ({
    id: d.id, projectId: d.projectId, folder: d.folder, name: d.name, format: d.format, version: d.version, updatedAt: d.updatedAt,
    author: d.author, status: d.status, tags: d.tags, ...(d.checkedOutBy ? { checkedOutBy: d.checkedOutBy } : {}),
  })),

  initProject: (projectId: string, unit: string) => change(() => post(`/projects/${encodeURIComponent(projectId)}/init`, { unit })),
  createFolder: (projectId: string, parentId: string | null, name: string) => change(() => post("/folders", { projectId, parentId, name })),
  renameFolder: (id: string, name: string) => change(() => apiRequest(`${BASE}/folders/${encodeURIComponent(id)}/name`, { method: "PUT", body: { name } })),
  moveFolder: (id: string, parentId: string | null) => change(() => post(`/folders/${encodeURIComponent(id)}/move`, { folderId: parentId })),
  deleteFolder: (id: string) => change(() => apiRequest(`${BASE}/folders/${encodeURIComponent(id)}`, { method: "DELETE" })),
  upload: (folderId: string, files: File[], tags: string[]) => change(() => {
    const form = new FormData()
    files.forEach((f) => form.append("files", f, f.name))
    if (tags.length) form.append("tags", tags.join(","))
    return apiUpload<string[]>(`${BASE}/folders/${encodeURIComponent(folderId)}/documents`, form)
  }),
  newVersion: (id: string, file: File, note: string) => change(() => {
    const form = new FormData()
    form.append("file", file, file.name)
    if (note) form.append("note", note)
    return apiUpload(`${BASE}/documents/${encodeURIComponent(id)}/versions`, form)
  }),
  checkout: (id: string) => change(() => post(`/documents/${encodeURIComponent(id)}/checkout`)),
  cancelCheckout: (id: string) => change(() => apiRequest(`${BASE}/documents/${encodeURIComponent(id)}/checkout`, { method: "DELETE" })),
  copy: (id: string, folderId: string) => change(() => post<string>(`/documents/${encodeURIComponent(id)}/copy`, { folderId })),
  move: (id: string, folderId: string) => change(() => post(`/documents/${encodeURIComponent(id)}/move`, { folderId })),
  updateMetadata: (id: string, meta: { name?: string; status?: string; tags?: string[] }) =>
    change(() => apiRequest(`${BASE}/documents/${encodeURIComponent(id)}`, { method: "PUT", body: meta })),
  deleteDocument: (id: string) => change(() => apiRequest(`${BASE}/documents/${encodeURIComponent(id)}`, { method: "DELETE" })),
}

/** Folders a folder may move under: same project, not itself or below it, and the deepest folder stays ≤ level 3. */
export function moveTargets(folder: DmsFolder, all: DmsFolder[]): DmsFolder[] {
  const project = all.filter((f) => f.projectId === folder.projectId)
  const below = new Set([folder.id])
  for (let grew = true; grew; ) {
    grew = false
    for (const f of project) if (f.parentId && below.has(f.parentId) && !below.has(f.id)) { below.add(f.id); grew = true }
  }
  const depth = Math.max(...project.filter((f) => below.has(f.id)).map((f) => f.level)) - folder.level
  return project.filter((f) => !below.has(f.id) && f.level + 1 + depth <= MAX_LEVEL && f.id !== folder.parentId)
}

/** Folders of a project in tree order (parent before children, siblings by name). */
export function folderTree(projectId: string, all: DmsFolder[]): DmsFolder[] {
  const project = all.filter((f) => f.projectId === projectId)
  const out: DmsFolder[] = []
  const walk = (parentId: string | null) =>
    project.filter((f) => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name, "vi")).forEach((f) => { out.push(f); walk(f.id) })
  walk(null)
  return out
}
