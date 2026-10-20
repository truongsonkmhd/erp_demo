import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, Users, AlertTriangle, CheckCircle } from "lucide-react"
import { Project } from "@/types/project"
import { formatMoney } from "@/utils/formatMoney"
interface ProjectCardProps {
  project: Project
  onClick?: (project: Project) => void
}

const statusConfig = {
  planning: {
    label: "Lập Kế Hoạch",
    className: "bg-status-planning text-white",
    icon: CalendarDays
  },
  active: {
    label: "Đang Hoạt Động",
    className: "bg-status-active text-white",
    icon: CheckCircle
  },
  on_hold: {
    label: "Tạm Dừng",
    className: "bg-status-delayed text-white",
    icon: AlertTriangle
  },
  completed: {
    label: "Hoàn Thành",
    className: "bg-status-completed text-white",
    icon: CheckCircle
  },
  cancelled: {
    label: "Đã Hủy",
    className: "bg-status-blocked text-white",
    icon: AlertTriangle
  },
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = statusConfig[project.status]
  const StatusIcon = status.icon

  return (
    <Card
      className="hover:shadow-construction transition-shadow cursor-pointer"
      onClick={() => onClick?.(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
            {project.name}
          </CardTitle>
          <Badge className={status.className}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tiến Độ</span>
            <span className="font-medium text-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Project details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span>{new Date(project.endDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{project.teamSize} thành viên</span>
          </div>
        </div>

        {/* Budget and manager */}
        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Ngân Sách</span>
            <span className="font-medium text-foreground">
              {formatMoney(project.budget)} VNĐ

            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-muted-foreground">Quản Lý</span>
            <span className="text-foreground">{project.manager}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}