import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Play,
  Calendar,
  User,
  FileText,
  Scale,
  Flag
} from "lucide-react"
import { ProjectTask } from "@/types/project"

interface ProjectTaskListProps {
  tasks: ProjectTask[]
  onTaskUpdate?: (taskId: string, updates: Partial<ProjectTask>) => void
}

const taskStatusConfig = {
  not_started: { 
    label: "Chưa Bắt Đầu", 
    className: "bg-gray-100 text-gray-700",
    icon: Clock 
  },
  in_progress: { 
    label: "Đang Thực Hiện", 
    className: "bg-blue-100 text-blue-700",
    icon: Play 
  },
  completed: { 
    label: "Hoàn Thành", 
    className: "bg-green-100 text-green-700",
    icon: CheckCircle 
  },
  blocked: { 
    label: "Bị Chặn", 
    className: "bg-red-100 text-red-700",
    icon: AlertTriangle 
  },
}

const priorityConfig = {
  low: { 
    label: "Thấp", 
    className: "bg-gray-100 text-gray-700",
    color: "text-gray-500"
  },
  medium: { 
    label: "Trung Bình", 
    className: "bg-yellow-100 text-yellow-700",
    color: "text-yellow-500"
  },
  high: { 
    label: "Cao", 
    className: "bg-orange-100 text-orange-700",
    color: "text-orange-500"
  },
  critical: { 
    label: "Khẩn Cấp", 
    className: "bg-red-100 text-red-700",
    color: "text-red-500"
  },
}

export function ProjectTaskList({ tasks, onTaskUpdate }: ProjectTaskListProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa xác định"
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const groupedTasks = tasks.reduce((acc, task) => {
    const status = task.status
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(task)
    return acc
  }, {} as Record<string, ProjectTask[]>)

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Chưa có công việc nào được tạo</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(taskStatusConfig).map(([statusKey, statusInfo]) => {
        const statusTasks = groupedTasks[statusKey] || []
        if (statusTasks.length === 0) return null

        const StatusIcon = statusInfo.icon

        return (
          <Card key={statusKey}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon className="w-5 h-5" />
                {statusInfo.label} ({statusTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusTasks.map((task) => {
                const priority = priorityConfig[task.priority]
                
                return (
                  <div key={task.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{task.name}</h4>
                          <Badge className={priority.className} variant="secondary">
                            <Flag className="w-3 h-3 mr-1" />
                            {priority.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        
                        {task.legalBasis && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                            <Scale className="w-3 h-3" />
                            <span>{task.legalBasis}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {onTaskUpdate && task.status !== 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onTaskUpdate(task.id, { 
                              status: task.status === 'not_started' ? 'in_progress' : 'completed' 
                            })}
                          >
                            {task.status === 'not_started' ? (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Bắt Đầu
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Hoàn Thành
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Tiến độ</span>
                        <span className="font-medium">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>
                    
                    {/* Task Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Bắt đầu</p>
                          <p className="font-medium">{formatDate(task.startDate)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Kết thúc</p>
                          <p className="font-medium">{formatDate(task.endDate)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Phụ trách</p>
                          <p className="font-medium">{task.assignee || "Chưa phân công"}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dependencies */}
                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Phụ thuộc vào:</p>
                        <div className="flex flex-wrap gap-1">
                          {task.dependencies.map((depId) => (
                            <Badge key={depId} variant="outline" className="text-xs">
                              {depId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Documents */}
                    {/* {task.documents && task.documents.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Tài liệu ({task.documents.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {task.documents.map((doc) => (
                            <Badge key={doc.id} variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {doc.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )} */}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}