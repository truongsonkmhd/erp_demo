import { useMemo, useState } from "react"
import { Check, ChevronDown, Filter, TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MonthPicker } from "@/components/ui/month-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useLocale } from "@/i18n/LocaleContext"

interface MonthlyReorderData {
  yearMonth: string
  oldCustomers: number
  newCustomers: number
  oldOrders: number
  newOrders: number
  reorderRate: number
}

type FilterMode = "recent" | "yoy" | "range"

const MONTH_LABELS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"]

function buildAllMonths(): MonthlyReorderData[] {
  const rows: MonthlyReorderData[] = []
  const start = new Date(2024, 0, 1)
  const end = new Date()
  const cursor = new Date(start)
  let index = 0
  while (cursor <= end) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth() + 1
    const baseOld = 2 + (index % 4)
    const baseNew = 3 + (index % 3)
    const oldOrders = 15 + index * 2
    const newOrders = 35 + index * 3
    const totalOrders = oldOrders + newOrders
    rows.push({
      yearMonth: `${year}-${String(month).padStart(2, "0")}`,
      oldCustomers: baseOld,
      newCustomers: baseNew,
      oldOrders,
      newOrders,
      reorderRate: Number(((oldOrders / totalOrders) * 100).toFixed(1)),
    })
    cursor.setMonth(cursor.getMonth() + 1)
    index += 1
  }
  return rows.reverse()
}

const ALL_MONTHS = buildAllMonths()

function formatMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-")
  return `${MONTH_LABELS[Number(month) - 1]} ${year}`
}

function monthKey(yearMonth: string) {
  return yearMonth.slice(5, 7)
}

function prevMonth(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number)
  const date = new Date(year, month - 2, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function sameMonthLastYear(yearMonth: string) {
  const [year, month] = yearMonth.split("-")
  return `${Number(year) - 1}-${month}`
}

export const CustomerReorderAnalytics = () => {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = useState<"table" | "chart">("table")
  const [filterOpen, setFilterOpen] = useState(false)
  const [mode, setMode] = useState<FilterMode>("recent")
  const [yoyMonth, setYoyMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"))
  const [fromMonth, setFromMonth] = useState(ALL_MONTHS[Math.min(5, ALL_MONTHS.length - 1)]?.yearMonth || "")
  const [toMonth, setToMonth] = useState("")

  const filteredRows = useMemo(() => {
    if (mode === "yoy") {
      return ALL_MONTHS.filter((row) => monthKey(row.yearMonth) === yoyMonth)
    }
    if (mode === "range") {
      return ALL_MONTHS.filter((row) => {
        if (fromMonth && row.yearMonth < fromMonth) return false
        if (toMonth && row.yearMonth > toMonth) return false
        return true
      })
    }
    return ALL_MONTHS.slice(0, 6)
  }, [mode, yoyMonth, fromMonth, toMonth])

  const byKey = useMemo(() => new Map(ALL_MONTHS.map((row) => [row.yearMonth, row])), [])

  const currentMonthData = filteredRows[0] || ALL_MONTHS[0]
  const totalCurrentCustomers = currentMonthData.oldCustomers + currentMonthData.newCustomers
  const totalCurrentOrders = currentMonthData.oldOrders + currentMonthData.newOrders
  const prev = byKey.get(prevMonth(currentMonthData.yearMonth))
  const changeFromPrev = prev ? Number((currentMonthData.reorderRate - prev.reorderRate).toFixed(1)) : undefined

  const filterLabel =
    mode === "recent"
      ? "6 tháng gần nhất"
      : mode === "yoy"
      ? `Cùng ${MONTH_LABELS[Number(yoyMonth) - 1]} các năm`
      : fromMonth
        ? `Từ ${formatMonthLabel(fromMonth)} đến ${toMonth ? formatMonthLabel(toMonth) : "nay"}`
        : "Khoảng tháng"

  const chartData = [...filteredRows].reverse().map((row) => ({
    name: formatMonthLabel(row.yearMonth),
    "Đơn KH Cũ": row.oldOrders,
    "Đơn KH Mới": row.newOrders,
    "Tỷ Lệ Tái Đặt (%)": row.reorderRate,
  }))

  const renderChange = (value?: number) => {
    if (value === undefined) return <span className="text-muted-foreground">—</span>
    if (value > 0) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" />+{value}%
        </span>
      )
    }
    if (value < 0) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-red-600">
          <TrendingDown className="h-3.5 w-3.5" />{value}%
        </span>
      )
    }
    return <span className="text-muted-foreground">0%</span>
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
      <CardHeader className="flex flex-col gap-3 space-y-0 border-b border-border bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-lg font-bold tracking-tight text-foreground">{t("dashboard.reorderTitle")}</CardTitle>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-2 rounded-lg bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:border-brand-blue/40"
              >
                <Filter className="h-3.5 w-3.5 text-brand-blue" />
                <span className="max-w-[220px] truncate">{filterLabel}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition ${filterOpen ? "rotate-180" : ""}`} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-96 space-y-3.5 p-4 z-50">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("dashboard.comparePeriod")}</p>
              <div className="grid gap-1.5">
                {[
                  { id: "recent" as const, title: t("dashboard.recent6Months"), hint: t("dashboard.recent6Hint") },
                  { id: "yoy" as const, title: t("dashboard.sameMonthYoY"), hint: t("dashboard.sameMonthYoYHint") },
                  { id: "range" as const, title: t("dashboard.monthRange"), hint: t("dashboard.monthRangeHint") },
                ].map((item) => {
                  const active = mode === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? "border-brand-blue bg-brand-blue/10 shadow-sm"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          active ? "border-brand-blue bg-brand-blue text-white" : "border-muted-foreground/40"
                        }`}
                      >
                        {active ? <Check className="h-2.5 w-2.5" /> : null}
                      </span>
                      <span>
                        <span className={`block text-sm font-semibold ${active ? "text-brand-blue" : "text-foreground"}`}>
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              {mode === "yoy" && (
                <div className="space-y-1">
                  <Label className="text-xs">{t("dashboard.selectMonthYoY")}</Label>
                  <select
                    value={yoyMonth}
                    onChange={(event) => setYoyMonth(event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {MONTH_LABELS.map((label, index) => {
                      const value = String(index + 1).padStart(2, "0")
                      return (
                        <option key={value} value={value}>{label}</option>
                      )
                    })}
                  </select>
                </div>
              )}
              {mode === "range" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("common.fromMonth")} *</Label>
                    <MonthPicker value={fromMonth} onChange={setFromMonth} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("common.toMonth")}</Label>
                    <MonthPicker value={toMonth} onChange={setToMonth} emptyLabel={t("common.untilNow")} />
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "table" | "chart")}>
          <TabsList className="gap-2 bg-transparent p-0">
            <TabsTrigger value="table">{t("common.table")}</TabsTrigger>
            <TabsTrigger value="chart">{t("common.chart")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("dashboard.customersWithOrders")}</p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">{totalCurrentCustomers}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.oldNewSplit", { old: currentMonthData.oldCustomers, new: currentMonthData.newCustomers })}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("dashboard.totalOrders")}</p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">{totalCurrentOrders}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.oldNewSplit", { old: currentMonthData.oldOrders, new: currentMonthData.newOrders })}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">{t("dashboard.reorderRate")}</p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">{currentMonthData.reorderRate}%</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "yoy" ? t("dashboard.vsSamePeriodLastYear") : t("dashboard.vsPrevMonth")}
              {renderChange(
                mode === "yoy"
                  ? (() => {
                      const lastYear = byKey.get(sameMonthLastYear(currentMonthData.yearMonth))
                      return lastYear ? Number((currentMonthData.reorderRate - lastYear.reorderRate).toFixed(1)) : undefined
                    })()
                  : changeFromPrev,
              )}
            </p>
          </div>
        </div>

        {activeTab === "table" ? (
          <div className="overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary/5">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Kỳ</th>
                    <th className="px-4 py-3 text-center font-semibold">KH cũ</th>
                    <th className="px-4 py-3 text-center font-semibold">KH mới</th>
                    <th className="px-4 py-3 text-center font-semibold">Tổng KH</th>
                    <th className="px-4 py-3 text-center font-semibold">Đơn cũ</th>
                    <th className="px-4 py-3 text-center font-semibold">Đơn mới</th>
                    <th className="px-4 py-3 text-center font-semibold">Tổng đơn</th>
                    <th className="px-4 py-3 text-center font-semibold">Tái đặt</th>
                    <th className="px-4 py-3 text-center font-semibold">{mode === "yoy" ? "So cùng kỳ năm trước" : "So tháng trước"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, index) => {
                    const compareRow =
                      mode === "yoy"
                        ? byKey.get(sameMonthLastYear(row.yearMonth))
                        : byKey.get(prevMonth(row.yearMonth))
                    const change = compareRow ? Number((row.reorderRate - compareRow.reorderRate).toFixed(1)) : undefined
                    return (
                      <tr key={row.yearMonth} className={index === 0 ? "bg-muted/40" : undefined}>
                        <td className="px-4 py-3 font-medium">
                          {formatMonthLabel(row.yearMonth)}
                          {index === 0 && mode === "recent" && (
                            <Badge className="ml-2 bg-brand-blue text-white hover:bg-brand-blue">Mới nhất</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">{row.oldCustomers}</td>
                        <td className="px-4 py-3 text-center">{row.newCustomers}</td>
                        <td className="px-4 py-3 text-center font-semibold">{row.oldCustomers + row.newCustomers}</td>
                        <td className="px-4 py-3 text-center">{row.oldOrders}</td>
                        <td className="px-4 py-3 text-center">{row.newOrders}</td>
                        <td className="px-4 py-3 text-center font-semibold">{row.oldOrders + row.newOrders}</td>
                        <td className="px-4 py-3 text-center font-semibold">{row.reorderRate}%</td>
                        <td className="px-4 py-3 text-center">{renderChange(change)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#0265DC" fontSize={11} unit="%" domain={[0, 100]} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Đơn KH Cũ" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar yAxisId="left" dataKey="Đơn KH Mới" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                <Line yAxisId="right" type="monotone" dataKey="Tỷ Lệ Tái Đặt (%)" stroke="#0265DC" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CustomerReorderAnalytics
