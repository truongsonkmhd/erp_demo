import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Play,
  Calendar,
  FileText,
  Scale
} from "lucide-react"
import { ProjectPhase } from "@/types/project"
import { useState } from "react"

interface ProjectPhaseCardProps {
  phase: ProjectPhase
  onStartPhase?: (phaseId: string) => void
  onCompletePhase?: (phaseId: string) => void
}

const phaseStatusConfig = {
  not_started: { 
    label: "Chưa Bắt Đầu", 
    className: "bg-gray-500 text-white",
    icon: Clock 
  },
  in_progress: { 
    label: "Đang Thực Hiện", 
    className: "bg-blue-500 text-white",
    icon: Play 
  },
  completed: { 
    label: "Hoàn Thành", 
    className: "bg-green-500 text-white",
    icon: CheckCircle 
  },
  blocked: { 
    label: "Bị Chặn", 
    className: "bg-red-500 text-white",
    icon: AlertTriangle 
  },
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

export function ProjectPhaseCard({ phase, onStartPhase, onCompletePhase }: ProjectPhaseCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const status = phaseStatusConfig[phase.status]
  const StatusIcon = status.icon

  const completedTasks = phase.tasks.filter(task => task.status === 'completed').length
  const totalTasks = phase.tasks.length
  const phaseProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa xác định"
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-muted-foreground">
                    Giai đoạn {phase.order}
                  </span>
                </div>
                <CardTitle className="text-lg">{phase.name}</CardTitle>
                <Badge className={status.className}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tiến độ</p>
                  <p className="font-medium">{Math.round(phaseProgress)}%</p>
                </div>
                <div className="w-24">
                  <Progress value={phaseProgress} className="h-2" />
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">{phase.description}</p>
            
            {/* Phase Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Bắt đầu</p>
                  <p className="text-sm font-medium">{formatDate(phase.startDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Kết thúc</p>
                  <p className="text-sm font-medium">{formatDate(phase.endDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Cơ sở pháp lý</p>
                  <p className="text-sm font-medium">{phase.legalBasis || "Không có"}</p>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Công việc ({completedTasks}/{totalTasks})</h4>
                <div className="flex gap-2">
                  {phase.status === 'not_started' && onStartPhase && (
                    <Button size="sm" onClick={() => onStartPhase(phase.id)}>
                      <Play className="w-3 h-3 mr-1" />
                      Bắt Đầu
                    </Button>
                  )}
                  {phase.status === 'in_progress' && onCompletePhase && (
                    <Button size="sm" variant="outline" onClick={() => onCompletePhase(phase.id)}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Hoàn Thành
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                {phase.tasks.map((task) => {
                  const taskStatus = taskStatusConfig[task.status]
                  const TaskIcon = taskStatus.icon
                  
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <TaskIcon className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{task.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                          {task.legalBasis && (
                            <p className="text-xs text-blue-600 mt-1">
                              <Scale className="w-3 h-3 inline mr-1" />
                              {task.legalBasis}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={taskStatus.className} variant="secondary">
                          {taskStatus.label}
                        </Badge>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Tiến độ</p>
                          <p className="text-sm font-medium">{task.progress}%</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {phase.tasks.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Chưa có công việc nào</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}