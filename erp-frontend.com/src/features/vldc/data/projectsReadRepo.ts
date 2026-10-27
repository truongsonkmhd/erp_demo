import type { ApiRequest } from "./apiRepo.ts"
import type { ChangeFeed } from "./realtime.ts"
import type { Repo } from "./syncedCollection.ts"
import type { ProjectStatus as ApiProjectStatus, ProjectSummary, Page } from "./workApi.ts"
import type { ProjectApproval, ProjectStatus, StoredProject } from "./types.ts"

/**
 * The projects other menus read (Tài chính, Dashboard, tổ…) now come from the project API, read only: the Nhiệm vụ / Dự án
 * pages change projects through its actions. Figures the API does not have (WBS, cost…) are left empty.
 */
const STATUS: Record<ApiProjectStatus, ProjectStatus> = { INITIATED: "Khởi tạo", IN_PROGRESS: "Đang thực hiện", PAUSED: "Tạm dừng", COMPLETED: "Hoàn thành" }
const APPROVAL: Record<ProjectSummary["approvalStatus"], ProjectApproval> = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" }

export function storedProjectOf(p: ProjectSummary): StoredProject {
  return {
    id: p.code, name: p.name, unit: p.leadDepartment?.name ?? "", budget: 0, end: p.endDate, status: STATUS[p.status], approval: APPROVAL[p.approvalStatus],
    wbs: [], technical: p.progress, delayDays: p.delayDays,
  }
}

/** Every project the user may see (one page of up to 500), reloaded when the backend reports a change. */
export function projectsReadRepo(request: ApiRequest, feed: ChangeFeed): Repo<StoredProject> {
  const readOnly = async () => {
    throw new Error("Dự án chỉ sửa ở menu Nhiệm vụ / Dự án")
  }
  return {
    isEmpty: async () => false,
    save: readOnly,
    replaceAll: readOnly,
    subscribe(cb, onError) {
      let last: string | undefined
      let stopped = false
      const refresh = async () => {
        try {
          const page = await request<Page<ProjectSummary>>("/api/vldc/projects?pageSize=500")
          const rows = page.items.map(storedProjectOf)
          const text = JSON.stringify(rows)
          if (stopped || text === last) return
          last = text
          cb(rows)
        } catch (error) {
          if (stopped) return
          if (last === undefined) onError(error)
          else console.warn("[projects] Tải lại từ máy chủ lỗi:", error)
        }
      }
      void refresh()
      const unwatch = feed.watch("projects", () => void refresh())
      return () => {
        stopped = true
        unwatch()
      }
    },
  }
}
