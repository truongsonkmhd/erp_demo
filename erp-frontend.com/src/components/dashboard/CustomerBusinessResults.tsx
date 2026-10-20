import { useMemo, useState } from "react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { YearPicker } from "@/components/ui/year-picker"
import { Label } from "@/components/ui/label"
import { DataTableColumn, DataTableHeaderGroup, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CUSTOMER_KD_DEMO_SALES } from "@/components/dashboard/customerBusinessResultsDemo"
import { useProjectSales } from "@/hooks/project/useProjectSales"
import { useLocale } from "@/i18n/LocaleContext"
import { cn } from "@/lib/utils"
import { ProjectSale } from "@/types/projectSale"

interface MonthCell {
  month: number
  gross: number
  net: number
  orders: ProjectSale[]
}

interface CustomerRow {
  key: string
  name: string
  customerCode: string
  months: MonthCell[]
  totalGross: number
  totalNet: number
  orderCount: number
  monthsWithOrders: number
  avgNetPerOrder: number | null
  avgNetPerMonth: number | null
  avgOrdersPerMonth: number | null
  orderCycle: number | null
}

function formatVnd(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}\u00a0₫`
}

function customerKey(sale: ProjectSale) {
  return (sale.customerCode || sale.phone || sale.customerName || sale.id).trim()
}

function customerLabel(sale: ProjectSale) {
  return (sale.customerName || sale.customerCode || sale.phone || "Khách không tên").trim()
}

function saleYearMonth(sale: ProjectSale) {
  const stamp = sale.createdAt || ""
  if (stamp.length < 7) return null
  return stamp.slice(0, 7)
}

function cycleClass(value: number | null) {
  if (value == null) return ""
  if (value >= 5) return "bg-red-100 text-red-800 font-semibold"
  if (value >= 4) return "bg-amber-100 text-amber-800 font-semibold"
  if (value >= 3) return "bg-emerald-100 text-emerald-800 font-semibold"
  return ""
}

export function CustomerBusinessResults() {
  const { t } = useLocale()
  const { projectSales, isLoading } = useProjectSales()
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const [year, setYear] = useState(currentYear)
  const [view, setView] = useState<"table" | "chart">("table")
  const [detail, setDetail] = useState<{ name: string; month: number; orders: ProjectSale[] } | null>(null)

  const monthCount = year === currentYear ? currentMonth : 12
  const months = useMemo(() => Array.from({ length: monthCount }, (_, index) => index + 1), [monthCount])
  const elapsedMonths = year === currentYear ? currentMonth : 12

  const rows = useMemo(() => {
    const source = [...CUSTOMER_KD_DEMO_SALES, ...projectSales]
    const paid = source.filter((sale) => {
      if (sale.freightPaymentStatus !== "Đã thu cước") return false
      const ym = saleYearMonth(sale)
      return ym?.startsWith(`${year}-`)
    })

    const grouped = new Map<string, { name: string; sales: ProjectSale[] }>()
    for (const sale of paid) {
      const key = customerKey(sale)
      const existing = grouped.get(key)
      if (existing) existing.sales.push(sale)
      else grouped.set(key, { name: customerLabel(sale), sales: [sale] })
    }

    const result: CustomerRow[] = []
    for (const [key, group] of grouped) {
      const monthCells: MonthCell[] = months.map((month) => {
        const prefix = `${year}-${String(month).padStart(2, "0")}`
        const orders = group.sales.filter((sale) => saleYearMonth(sale) === prefix)
        return {
          month,
          gross: orders.reduce((sum, sale) => sum + (sale.grossCompanyProfitVnd || 0), 0),
          net: orders.reduce((sum, sale) => sum + (sale.netSalesProfitVnd || 0), 0),
          orders,
        }
      })
      const totalGross = monthCells.reduce((sum, cell) => sum + cell.gross, 0)
      const totalNet = monthCells.reduce((sum, cell) => sum + cell.net, 0)
      const orderCount = monthCells.reduce((sum, cell) => sum + cell.orders.length, 0)
      const monthsWithOrders = monthCells.filter((cell) => cell.orders.length > 0).length
      result.push({
        key,
        name: group.name,
        customerCode: group.sales.find((sale) => sale.customerCode)?.customerCode || "—",
        months: monthCells,
        totalGross,
        totalNet,
        orderCount,
        monthsWithOrders,
        avgNetPerOrder: orderCount ? totalNet / orderCount : null,
        avgNetPerMonth: monthsWithOrders ? totalNet / monthsWithOrders : null,
        avgOrdersPerMonth: monthsWithOrders ? orderCount / monthsWithOrders : null,
        orderCycle: monthsWithOrders ? elapsedMonths / monthsWithOrders : null,
      })
    }
    return result.sort((a, b) => b.totalNet - a.totalNet)
  }, [projectSales, year, months, elapsedMonths])

  const monthProfitCell = (month: number, field: "gross" | "net") => (row: CustomerRow) => {
    const cell = row.months.find((item) => item.month === month)
    if (!cell?.orders.length) return <span className="text-muted-foreground">—</span>
    return (
      <button
        type="button"
        className="w-full whitespace-nowrap text-right tabular-nums hover:underline"
        onClick={() => setDetail({ name: row.name, month, orders: cell.orders })}
      >
        {formatVnd(field === "gross" ? cell.gross : cell.net)}
      </button>
    )
  }

  const columns: DataTableColumn<CustomerRow>[] = [
    {
      key: "index",
      header: "STT",
      headClassName: "w-14 min-w-14 text-center",
      cellClassName: "text-center",
      render: (_, index) => index + 1,
    },
    {
      key: "code",
      header: "Mã KH",
      headClassName: "min-w-28 whitespace-nowrap",
      cellClassName: "whitespace-nowrap font-medium",
      render: (row) => row.customerCode,
    },
    {
      key: "name",
      header: "Họ tên khách hàng",
      headClassName: "min-w-44",
      cellClassName: "font-medium",
      render: (row) => row.name,
    },
    ...months.flatMap((month) => [
      {
        key: `m${month}-gross`,
        header: "Gross",
        headClassName: "min-w-40 whitespace-nowrap text-center",
        cellClassName: "whitespace-nowrap text-right",
        render: monthProfitCell(month, "gross"),
      },
      {
        key: `m${month}-net`,
        header: "Net",
        headClassName: "min-w-40 whitespace-nowrap text-center",
        cellClassName: "whitespace-nowrap text-right",
        render: monthProfitCell(month, "net"),
      },
    ]),
    {
      key: "totalGross",
      header: "Gross",
      headClassName: "min-w-40 whitespace-nowrap text-center",
      cellClassName: "whitespace-nowrap text-right font-semibold tabular-nums",
      render: (row) => formatVnd(row.totalGross),
    },
    {
      key: "totalNet",
      header: "Net",
      headClassName: "min-w-40 whitespace-nowrap text-center",
      cellClassName: "whitespace-nowrap text-right font-semibold tabular-nums",
      render: (row) => formatVnd(row.totalNet),
    },
    {
      key: "avgOrder",
      header: "Giá trị trung bình / 1 Đơn",
      headClassName: "min-w-40 whitespace-nowrap text-right",
      cellClassName: "whitespace-nowrap text-right tabular-nums",
      render: (row) => (row.avgNetPerOrder == null ? "—" : formatVnd(row.avgNetPerOrder)),
    },
    {
      key: "avgMonth",
      header: "Lợi nhuận trung bình / tháng",
      headClassName: "min-w-44 whitespace-nowrap text-right",
      cellClassName: "whitespace-nowrap text-right tabular-nums",
      render: (row) => (row.avgNetPerMonth == null ? "—" : formatVnd(row.avgNetPerMonth)),
    },
    {
      key: "avgOrders",
      header: "Số đơn hàng trung bình / Tháng",
      headClassName: "min-w-40 text-center",
      cellClassName: "text-center",
      render: (row) => (row.avgOrdersPerMonth == null ? "—" : row.avgOrdersPerMonth.toFixed(1)),
    },
    {
      key: "cycle",
      header: "Kỳ đặt hàng bình quân",
      headClassName: "min-w-32 text-center",
      cellClassName: "text-center p-0",
      render: (row) => (
        <div className={cn("flex h-full min-h-12 items-center justify-center px-2", cycleClass(row.orderCycle))}>
          {row.orderCycle == null ? "—" : `${row.orderCycle.toFixed(1)} tháng`}
        </div>
      ),
    },
  ]

  const headerGroups: DataTableHeaderGroup[] = [
    { header: "STT", span: 1 },
    { header: "Mã KH", span: 1 },
    { header: "Họ tên khách hàng", span: 1 },
    ...months.map((month) => ({ header: `T${month}`, span: 2, headClassName: "text-center" })),
    { header: "Total", span: 2, headClassName: "text-center" },
    { header: "Giá trị TB / 1 Đơn", span: 1 },
    { header: "Lợi nhuận TB / tháng", span: 1 },
    { header: "Số đơn hàng TB / Tháng", span: 1 },
    { header: "Kỳ đặt hàng BQ", span: 1 },
  ]

  const monthlyChart = useMemo(
    () =>
      months.map((month) => ({
        name: `T${month}`,
        Gross: rows.reduce((sum, row) => sum + (row.months.find((item) => item.month === month)?.gross || 0), 0),
        Net: rows.reduce((sum, row) => sum + (row.months.find((item) => item.month === month)?.net || 0), 0),
      })),
    [months, rows],
  )

  const customerChart = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.totalNet - a.totalNet)
        .slice(0, 8)
        .map((row) => ({
          name: row.name,
          Gross: row.totalGross,
          Net: row.totalNet,
        })),
    [rows],
  )

  const chartTick = (value: number) => {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`
    if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}k`
    return String(value)
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
      <CardHeader className="flex flex-col gap-3 space-y-0 border-b border-border bg-muted/40 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="text-lg font-bold tracking-tight text-foreground">{t("dashboard.bizResultsTitle")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.bizResultsHint")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="whitespace-nowrap text-xs font-semibold">{t("common.year")}</Label>
          <YearPicker value={year} onChange={setYear} minYear={2000} maxYear={currentYear + 10} />
          <Tabs value={view} onValueChange={(value) => setView(value as "table" | "chart")}>
            <TabsList className="gap-2 bg-transparent p-0">
              <TabsTrigger value="table">{t("common.table")}</TabsTrigger>
              <TabsTrigger value="chart">{t("common.chart")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {view === "table" ? (
          <PaginatedDataTable
            data={rows}
            columns={columns}
            rowKey={(row) => row.key}
            loading={isLoading}
            emptyMessage={t("dashboard.emptyCollectedFreight")}
            minTableWidth={`${Math.max(1400, 400 + months.length * 260)}px`}
            stickyFirstColumn
            headerGroups={headerGroups}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <p className="mb-3 text-sm font-semibold">{t("dashboard.grossNetByMonth")}</p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyChart} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={chartTick} />
                      <Tooltip formatter={(value: number) => formatVnd(Number(value || 0))} />
                      <Legend />
                      <Bar dataKey="Gross" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Net" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="mb-3 text-sm font-semibold">{t("dashboard.topCustomersByNet")}</p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={customerChart} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={chartTick} />
                      <YAxis type="category" dataKey="name" width={110} stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value: number) => formatVnd(Number(value || 0))} />
                      <Legend />
                      <Bar dataKey="Gross" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Net" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                Đơn hàng {detail?.name} — Tháng {detail?.month}/{year}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Mã đơn</th>
                    <th className="py-2 pr-3">Tên hàng</th>
                    <th className="py-2 pr-3">Ngày</th>
                    <th className="py-2 pr-3 text-right">Gross</th>
                    <th className="py-2 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {detail?.orders.map((sale) => (
                    <tr key={sale.id} className="border-b">
                      <td className="py-2 pr-3">{sale.orderCode || "—"}</td>
                      <td className="py-2 pr-3">{sale.productName || "—"}</td>
                      <td className="py-2 pr-3">{sale.createdAt ? sale.createdAt.slice(0, 10) : "—"}</td>
                      <td className="py-2 pr-3 text-right">{formatVnd(sale.grossCompanyProfitVnd || 0)}</td>
                      <td className="py-2 text-right">{formatVnd(sale.netSalesProfitVnd || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default CustomerBusinessResults
