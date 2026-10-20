import { Card, CardContent } from "@/components/ui/card"
import { 
  Building, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Truck,
  Receipt
} from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}

function StatCard({ title, value, change, icon: Icon, trend, color = "text-primary" }: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
  
  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                {value}
              </h3>
              {change && (
                <span className={`text-xs font-bold ${trendColor} flex items-center gap-0.5`}>
                  {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  {change}
                </span>
              )}
            </div>
          </div>
          <div className={`${color} bg-slate-100 rounded-lg p-2.5 shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  stats: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    delayedProjects: number
    teamMembers: number
    avgProgress: number
    cskhIssuesCount?: number
    uncollectedFreightCount?: number
    totalNetProfitMonthly?: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      <StatCard
        title="Tổng Đơn / Dự Án"
        value={stats.totalProjects}
        icon={Building}
        color="text-blue-600"
      />

      <StatCard
        title="Lợi Nhuận Net Tháng"
        value={stats.totalNetProfitMonthly ? `${(stats.totalNetProfitMonthly / 1000000).toFixed(0)}tr VNĐ` : "185tr VNĐ"}
        change="+14%"
        trend="up"
        icon={DollarSign}
        color="text-emerald-600"
      />
      
      <StatCard
        title="Đơn Đang Vận Chuyển"
        value={stats.activeProjects}
        change="+12%"
        trend="up"
        icon={Truck}
        color="text-indigo-600"
      />

      <StatCard
        title="Vướng Mắc CSKH"
        value={stats.cskhIssuesCount ?? 2}
        change="Cần xử lý"
        trend="down"
        icon={AlertTriangle}
        color="text-red-600"
      />
      
      <StatCard
        title="Đơn Chưa Thu Cước"
        value={stats.uncollectedFreightCount ?? 3}
        change="Thu cước"
        trend="neutral"
        icon={Receipt}
        color="text-amber-600"
      />
      
      <StatCard
        title="Tiến Độ TB"
        value={`${stats.avgProgress}%`}
        change="+5%"
        trend="up"
        icon={TrendingUp}
        color="text-emerald-600"
      />
    </div>
  )
}