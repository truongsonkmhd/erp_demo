import { ProjectTask } from "@/types/project"


export const TASK_STATUS_LABELS: Record<ProjectTask["status"], string> = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  blocked: "Bị chặn",
}

export const TASK_PRIORITY_LABELS: Record<ProjectTask["priority"], string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Khẩn cấp",
}

export const translateTaskStatus = (status?: string): string =>
  TASK_STATUS_LABELS[status as ProjectTask["status"]] || "Không xác định"

export const translateTaskPriority = (priority?: string): string =>
  TASK_PRIORITY_LABELS[priority as ProjectTask["priority"]] || "Không xác định"
