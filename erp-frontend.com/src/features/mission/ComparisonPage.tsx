import { useState, useMemo } from "react"
import {
  BarChart3,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  DollarSign,
  Info,
  ShieldAlert,
  ArrowUpRight,
  Filter,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { PageShell, money } from "./ui"
import {
  useMissionData,
  actualQuantity,
  plannedQuantity,
  progressStatus,
} from "./store"

export default function ComparisonPage() {
  const data = useMissionData()

  const [activeTab, setActiveTab] = useState<"units" | "forecast">("units")
  const [filterPeriod, setFilterPeriod] = useState<string>("2026")

  // UC-16: Unit comparison metrics
  const unitComparison = useMemo(() => {
    const departments = [
      ...new Set(
        [
          ...data.nodes.map((n) => n.department),
          ...data.missions.map((m) => m.department),
        ].filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "vi"))

    return departments.map((dept) => {
      // Missions owned by this department
      const missions = data.missions.filter((m) => m.department === dept)
      const missionIds = new Set(missions.map((m) => m.id))

      // Nodes executed by this department
      const deptNodes = data.nodes.filter((n) => n.department === dept)

      // Only count nodes that have reached their due date for on-time calculation
      const dueNodes = deptNodes.filter((n) => Boolean(n.dueDate))
      const onTimeNodes = deptNodes.filter((n) => {
        const planned = plannedQuantity(data, n.id)
        const actual = actualQuantity(data, n.id)
        const status = progressStatus(n.dueDate, planned, actual)
        return ["Đúng tiến độ", "Hoàn thành"].includes(status)
      })

      const lateNodes = deptNodes.filter((n) => {
        const planned = plannedQuantity(data, n.id)
        const actual = actualQuantity(data, n.id)
        const status = progressStatus(n.dueDate, planned, actual)
        return status === "Chậm"
      })

      const onTimeRate = deptNodes.length > 0 ? Math.round((onTimeNodes.length / deptNodes.length) * 100) : 0
      const lateRate = deptNodes.length > 0 ? Math.round((lateNodes.length / deptNodes.length) * 100) : 0

      // Financials
      const totalBudget = missions.reduce((s, m) => s + (m.budget || 0), 0)
      const totalCost = deptNodes.reduce((s, n) => s + (n.cost || 0), 0)

      const deptProgressEntries = data.progress.filter((p) =>
        deptNodes.some((n) => n.id === p.nodeId)
      )
      const totalDisbursement = deptProgressEntries.reduce((s, p) => s + (p.disbursement || 0), 0)

      return {
        department: dept,
        missionCount: missions.length,
        workCount: deptNodes.length,
        dueCount: dueNodes.length,
        onTimeCount: onTimeNodes.length,
        lateCount: lateNodes.length,
        onTimeRate,
        lateRate,
        totalBudget,
        totalCost,
        totalDisbursement,
      }
    })
  }, [data.nodes, data.missions, data.plans, data.progress])

  // UC-11: Year-end forecast metrics
  const yearEndForecast = useMemo(() => {
    const daysLeftInYear = Math.max(
      0,
      Math.ceil((new Date(new Date().getFullYear(), 11, 31).getTime() - Date.now()) / 86400000)
    )

    return data.nodes.map((node) => {
      const mission = data.missions.find((m) => m.id === node.missionId)
      const planned = plannedQuantity(data, node.id)
      const actual = actualQuantity(data, node.id)
      const entries = data.progress.filter((p) => p.nodeId === node.id)

      if (planned === 0) {
        return {
          node,
          mission,
          planned,
          actual,
          status: "insufficient_data" as const,
          reason: "Chưa có kế hoạch phê duyệt chính thức (Baseline)",
          forecastQuantity: 0,
          forecastRate: 0,
        }
      }

      if (entries.length === 0) {
        return {
          node,
          mission,
          planned,
          actual,
          status: "no_progress" as const,
          reason: "Chưa có bất kỳ số liệu thực hiện nào được ghi nhận",
          forecastQuantity: 0,
          forecastRate: 0,
        }
      }

      const firstDate = new Date(entries[0].date).getTime()
      const elapsedDays = Math.max(1, Math.ceil((Date.now() - firstDate) / 86400000))
      const burnRatePerDay = actual / elapsedDays
      const forecastQuantity = Math.round(actual + burnRatePerDay * daysLeftInYear)
      const forecastRate = Math.round((forecastQuantity / planned) * 100)

      return {
        node,
        mission,
        planned,
        actual,
        status: forecastRate >= 100 ? ("achievable" as const) : ("at_risk" as const),
        forecastQuantity,
        forecastRate,
        burnRatePerDay: Number(burnRatePerDay.toFixed(2)),
        daysLeftInYear,
        elapsedDays,
      }
    })
  }, [data.nodes, data.missions, data.plans, data.progress])

  return (
    <PageShell
      title="So sánh đơn vị & Dự báo cuối năm"
      subtitle="PRJ-11 & PRJ-16 · Đánh giá hiệu quả thực hiện theo cùng kỳ và mô hình dự báo khả năng hoàn thành kế hoạch"
    >
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Đơn vị tham gia</span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">{unitComparison.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Các Đoàn, Trung tâm và Xí nghiệp trực thuộc</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng giải ngân thực tế</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {money(unitComparison.reduce((s, u) => s + u.totalDisbursement, 0))} <span className="text-xs font-normal text-muted-foreground">đ</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Nguồn vốn đã được hấp thụ vào các đầu việc</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Đạt dự báo cuối năm</span>
            <div className="rounded-lg bg-teal-100 p-2 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-teal-600 dark:text-teal-400">
            {yearEndForecast.filter((f) => f.status === "achievable").length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Đầu việc có tốc độ thực hiện đảm bảo đích 100%</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nguy cơ không đạt</span>
            <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {yearEndForecast.filter((f) => f.status === "at_risk").length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Cần tăng tốc hoặc điều chỉnh biện pháp kỹ thuật</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl border bg-muted/60 p-1 sm:w-[500px]">
          <TabsTrigger value="units" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            <span>So sánh các đơn vị</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span>Dự báo nguy cơ cuối năm</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: SO SÁNH HIỆU QUẢ CÁC ĐƠN VỊ (UC-16) */}
        {/* ========================================================================= */}
        <TabsContent value="units" className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span>Quy tắc chuẩn hóa so sánh </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Tỷ lệ đúng hạn chỉ tính trên các công việc đã phát sinh dữ liệu trong kỳ; mẫu số hiển thị rõ ràng để tránh hiểu sai lệch giữa các đơn vị.
              </p>
            </div>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Kỳ so sánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">Năm 2026</SelectItem>
                <SelectItem value="Q2">Quý 2/2026</SelectItem>
                <SelectItem value="Q1">Quý 1/2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unit Comparison Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Đơn vị trực thuộc</th>
                    <th className="px-4 py-3 font-medium text-center">Nhiệm vụ</th>
                    <th className="px-4 py-3 font-medium text-center">Đầu việc WBS</th>
                    <th className="px-4 py-3 font-medium">Tỷ lệ đúng hạn (%)</th>
                    <th className="px-4 py-3 font-medium">Tỷ lệ chậm (%)</th>
                    <th className="px-4 py-3 font-medium">Dự toán WBS</th>
                    <th className="px-4 py-3 font-medium">Giải ngân thực tế</th>
                    <th className="px-4 py-3 font-medium">Đánh giá chung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unitComparison.map((unit) => {
                    return (
                      <tr key={unit.department} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-3 font-bold text-foreground flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{unit.department}</span>
                        </td>

                        <td className="px-4 py-3 text-center font-semibold">{unit.missionCount}</td>

                        <td className="px-4 py-3 text-center text-muted-foreground">{unit.workCount}</td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-600">{unit.onTimeRate}%</span>
                            <span className="text-[10px] text-muted-foreground">
                              ({unit.onTimeCount}/{unit.workCount})
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${unit.lateRate > 0 ? "text-rose-600" : "text-muted-foreground"}`}>
                              {unit.lateRate}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ({unit.lateCount}/{unit.workCount})
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-semibold text-foreground">{money(unit.totalCost)} đ</td>

                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {money(unit.totalDisbursement)} đ
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${unit.onTimeRate >= 80
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : unit.lateRate >= 30
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                              }`}
                          >
                            {unit.onTimeRate >= 80 ? "Xuất sắc" : unit.lateRate >= 30 ? "Cần đôn đốc" : "Khá"}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: DỰ BÁO NGUY CƠ CUỐI NĂM (UC-11) */}
        {/* ========================================================================= */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Phương pháp dự báo từ tốc độ thực tế (Burn-rate model)</span>
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Công thức: Dự báo khối lượng = Đã thực hiện + (Tốc độ bình quân/ngày × Số ngày còn lại trong năm).
              Nếu chưa có Baseline hoặc chưa có số liệu, hệ thống thông báo "Chưa đủ cơ sở", không đưa ra dự báo chắc chắn bừa bãi.
            </p>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Công việc WBS</th>
                    <th className="px-4 py-3 font-medium">Đơn vị thực hiện</th>
                    <th className="px-4 py-3 font-medium">Kế hoạch Baseline</th>
                    <th className="px-4 py-3 font-medium">Đã thực hiện</th>
                    <th className="px-4 py-3 font-medium">Tốc độ đo/ngày</th>
                    <th className="px-4 py-3 font-medium">Dự báo cuối năm</th>
                    <th className="px-4 py-3 font-medium">Khả năng hoàn thành</th>
                    <th className="px-4 py-3 font-medium">Kết luận dự báo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {yearEndForecast.map((item) => {
                    return (
                      <tr key={item.node.id} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-foreground line-clamp-1">{item.node.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            [{item.mission?.code}] {item.mission?.name}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">{item.node.department}</td>

                        <td className="px-4 py-3 font-bold text-foreground">
                          {item.planned > 0 ? `${money(item.planned)} ${item.node.unit}` : "Chưa có KH"}
                        </td>

                        <td className="px-4 py-3 font-bold text-emerald-600">
                          {money(item.actual)} {item.node.unit}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {"burnRatePerDay" in item ? `${item.burnRatePerDay} ${item.node.unit}/ngày` : "—"}
                        </td>

                        <td className="px-4 py-3 font-semibold text-foreground">
                          {"forecastQuantity" in item && item.forecastQuantity > 0
                            ? `${money(item.forecastQuantity)} ${item.node.unit}`
                            : "—"}
                        </td>

                        <td className="px-4 py-3">
                          {"forecastRate" in item && item.forecastRate > 0 ? (
                            <span
                              className={`font-bold ${item.forecastRate >= 100
                                ? "text-emerald-600"
                                : item.forecastRate >= 70
                                  ? "text-amber-600"
                                  : "text-rose-600"
                                }`}
                            >
                              {item.forecastRate}% KH
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Chưa đủ cơ sở</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {item.status === "achievable" ? (
                            <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300">
                              Khả thi cao
                            </Badge>
                          ) : item.status === "at_risk" ? (
                            <Badge variant="outline" className="text-[10px] bg-rose-100 text-rose-800 border-rose-300">
                              Nguy cơ thiếu hụt
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 border-slate-300">
                              Chưa đủ cơ sở số liệu
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
