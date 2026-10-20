import React, { useState, useMemo } from "react"
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  ShoppingBag,
  RefreshCw,
  Repeat,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  calculateAssetKPIs,
  getAssets,
} from "@/services/AssetService"

const STATUS_COLORS: Record<string, string> = {
  "Đang thi công": "#2563eb",
  "Sẵn sàng (Kho)": "#10b981",
  "Đang sửa chữa": "#ef4444",
  "Đang kiểm định": "#f59e0b",
}

export default function AssetAnalyticsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const kpis = useMemo(() => {
    return calculateAssetKPIs()
  }, [refreshKey])

  const assets = useMemo(() => {
    return getAssets()
  }, [refreshKey])

  // Dữ liệu biểu đồ trạng thái (Donut Chart)
  const statusChartData = useMemo(() => {
    return [
      { name: "Đang thi công", value: kpis.inUseCount, color: "#2563eb" },
      { name: "Sẵn sàng (Kho)", value: kpis.activeCount, color: "#10b981" },
      { name: "Đang sửa chữa", value: kpis.repairingCount, color: "#ef4444" },
      { name: "Đang kiểm định", value: kpis.calibratingCount, color: "#f59e0b" },
    ].filter((item) => item.value > 0)
  }, [kpis])

  // Dữ liệu biểu đồ mức sử dụng theo chủng loại (Bar Chart)
  const categoryUtilizationData = useMemo(() => {
    const cats: Record<string, { total: number; inUse: number }> = {}
    assets.forEach((a) => {
      if (!cats[a.category]) {
        cats[a.category] = { total: 0, inUse: 0 }
      }
      cats[a.category].total += 1
      if (a.status === "in_use") cats[a.category].inUse += 1
    })

    return Object.entries(cats).map(([category, val]) => {
      const rate = val.total > 0 ? Math.round((val.inUse / val.total) * 100) : 0
      return {
        category,
        total: val.total,
        inUse: val.inUse,
        utilizationRate: rate,
      }
    })
  }, [assets])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Phân tích & Cảnh báo thiết bị (AST-09, AST-10, AST-11)
            </h1>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
              BI & Dự báo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Chỉ số sẵn sàng vận hành (Availability %), tỷ lệ khai thác (Utilization %), cảnh báo hạn kiểm định tự động và hỗ trợ quyết định Mua mới / Thuê / Điều chuyển.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Cập nhật chỉ số
          </Button>
        </div>
      </div>

      {/* KPI Headline Cards (AST-11, AST-09) */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Availability Rate (AST-11) */}
        <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">
              Tỷ lệ sẵn sàng vận hành
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-700 tabular-nums">
              {kpis.availabilityRate}%
            </div>
            <p className="text-xs text-emerald-600/90 mt-1">
              {kpis.activeCount + kpis.inUseCount}/{kpis.total} máy hoạt động tốt (Availability Rate)
            </p>
          </CardContent>
        </Card>

        {/* Utilization Rate (AST-11) */}
        <Card className="border-blue-200 bg-blue-50/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Tỷ lệ khai thác công suất
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-700 tabular-nums">
              {kpis.utilizationRate}%
            </div>
            <p className="text-xs text-blue-600/90 mt-1">
              {kpis.inUseCount} máy đang triển khai trên thực địa (Utilization Rate)
            </p>
          </CardContent>
        </Card>

        {/* Calibration Warnings (AST-09) */}
        <Card className="border-amber-200 bg-amber-50/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              Cảnh báo hạn kiểm định
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-700 tabular-nums">
              {kpis.calibrationWarnings.length} máy
            </div>
            <p className="text-xs text-amber-600/90 mt-1">
              Sắp hết hạn trong 30 ngày hoặc quá hạn (AST-09)
            </p>
          </CardContent>
        </Card>

        {/* Idle Assets (AST-09) */}
        <Card className="border-purple-200 bg-purple-50/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              Thiết bị nhàn rỗi lâu ngày
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-700 tabular-nums">
              {kpis.idleAssets.length} máy
            </div>
            <p className="text-xs text-purple-600/90 mt-1">
              Chưa sử dụng trên 90 ngày (Cần tái điều chuyển)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: CẢNH BÁO TỰ ĐỘNG (AST-09) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card A: Cảnh báo hạn kiểm định */}
        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="bg-amber-50/50 pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <div>
                <CardTitle className="text-sm font-bold text-amber-900">
                  Cảnh báo thiết bị sắp hết hạn kiểm định / hiệu chuẩn (AST-09)
                </CardTitle>
                <CardDescription className="text-xs text-amber-800">
                  Thiết bị cần lập lịch kiểm định đo lường trước khi đưa vào tuyến đo thực địa
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {kpis.calibrationWarnings.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Tất cả thiết bị đều đang trong hạn kiểm định hợp lệ.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Mã máy</TableHead>
                    <TableHead className="text-xs font-semibold">Tên thiết bị</TableHead>
                    <TableHead className="text-xs font-semibold">Đơn vị quản lý</TableHead>
                    <TableHead className="text-xs font-semibold">Hạn KĐ</TableHead>
                    <TableHead className="text-xs font-semibold">Tình trạng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.calibrationWarnings.map((asset) => (
                    <TableRow key={asset.id} className="hover:bg-amber-50/30">
                      <TableCell className="font-mono text-xs font-bold text-amber-800">
                        {asset.code}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-900">
                        {asset.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{asset.managingUnit}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-rose-600 tabular-nums">
                        {asset.nextCalibrationDate}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-normal">
                          Sắp hết hạn (&lt;30 ngày)
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Card B: Cảnh báo thiết bị ít sử dụng (>90 ngày) */}
        <Card className="border-purple-200 shadow-sm">
          <CardHeader className="bg-purple-50/50 pb-3 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <CardTitle className="text-sm font-bold text-purple-900">
                  Cảnh báo thiết bị ít sử dụng (&gt;90 ngày chưa hoạt động) (AST-09)
                </CardTitle>
                <CardDescription className="text-xs text-purple-800">
                  Thiết bị lưu kho kéo dài, khuyến nghị điều chuyển sang đơn vị khác hoặc bảo dưỡng tĩnh
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {kpis.idleAssets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Không có thiết bị nào nhàn rỗi trên 90 ngày.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Mã máy</TableHead>
                    <TableHead className="text-xs font-semibold">Tên thiết bị</TableHead>
                    <TableHead className="text-xs font-semibold">Đơn vị quản lý</TableHead>
                    <TableHead className="text-xs font-semibold">Ngày dùng gần nhất</TableHead>
                    <TableHead className="text-xs font-semibold">Khuyến nghị</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.idleAssets.map((asset) => (
                    <TableRow key={asset.id} className="hover:bg-purple-50/30">
                      <TableCell className="font-mono text-xs font-bold text-purple-800">
                        {asset.code}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-900">
                        {asset.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{asset.managingUnit}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600 tabular-nums">
                        {asset.lastUsedDate}
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] text-purple-700 font-medium">
                          Điều chuyển / Kiểm tra bảo dưỡng
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: BIỂU ĐỒ TRỰC QUAN HIỆU SUẤT THIẾT BỊ (AST-11) */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Biểu đồ 1: Tỷ lệ sử dụng theo chủng loại */}
        <Card className="md:col-span-8 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Tỷ lệ khai thác công suất theo chủng loại thiết bị (AST-11)
                </CardTitle>
                <CardDescription className="text-xs">
                  So sánh tỷ lệ % thiết bị đang hoạt động trên thực địa so với tổng số máy hiện có
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryUtilizationData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [`${val}%`, "Tỷ lệ khai thác"]}
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  />
                  <Bar dataKey="utilizationRate" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Tỷ lệ sử dụng (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Biểu đồ 2: Cơ cấu trạng thái thiết bị */}
        <Card className="md:col-span-4 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <PieIcon className="h-4 w-4 text-emerald-600" />
              Cơ cấu trạng thái thiết bị
            </CardTitle>
            <CardDescription className="text-xs">
              Phân bổ số lượng theo trạng thái kỹ thuật
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`${val} thiết bị`, "Số lượng"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t text-xs">
              {statusChartData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate">{item.name}:</span>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: MA TRẬN HỖ TRỢ RA QUYẾT ĐỊNH MUA / THUÊ / ĐIỀU CHUYỂN (AST-10) */}
      <Card className="border-blue-200 shadow-sm bg-gradient-to-b from-blue-50/30 to-white">
        <CardHeader className="border-b border-blue-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-base font-bold text-blue-950">
                Phân tích hỗ trợ quyết định Mua sắm – Thuê ngoài – Điều chuyển nội bộ (AST-10)
              </CardTitle>
              <CardDescription className="text-xs text-blue-800">
                Mô hình tối ưu hóa tài chính: Đối chiếu số lượng hiện có, tỷ lệ sử dụng, chi phí mua mới, đơn giá thuê ngoài và nhu cầu kế hoạch nhiệm vụ.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-900 min-w-[180px]">
                  Nhu cầu thiết bị nhiệm vụ
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Hiện có / Tỷ lệ SD</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Kế hoạch cần</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Phương án Mua mới</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Phương án Thuê ngoài</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Phương án Điều chuyển</TableHead>
                <TableHead className="text-xs font-bold text-emerald-800 min-w-[200px]">
                  Khuyến nghị tối ưu (AST-10)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Bài toán 1 */}
              <TableRow className="hover:bg-slate-50">
                <TableCell>
                  <div className="font-semibold text-xs text-slate-900">
                    Máy đo địa chấn 48 kênh
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Phục vụ tuyến đo sâu mỏ than Quảng Ninh
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div>1 bộ Geode 24 kênh</div>
                  <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-200">
                    Sử dụng 65%
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-800">
                  Thêm 24 kênh trong 45 ngày
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="font-semibold text-slate-900">1.450.000.000 đ</div>
                  <div className="text-[10px] text-muted-foreground">Mua Geode 24 kênh mới</div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="font-semibold text-slate-900">225.000.000 đ</div>
                  <div className="text-[10px] text-muted-foreground">5.000.000 đ/ngày x 45 ngày</div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="font-semibold text-emerald-700">15.000.000 đ</div>
                  <div className="text-[10px] text-muted-foreground">Điều chuyển từ Đoàn 1 sang</div>
                </TableCell>
                <TableCell>
                  <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-800">
                      <Repeat className="h-3.5 w-3.5" />
                      Điều chuyển nội bộ
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Tiết kiệm 1,43 tỷ đồng so với mua mới; Đoàn 1 sắp hoàn thành tuyến đo Chợ Điền.
                    </div>
                  </div>
                </TableCell>
              </TableRow>

              {/* Bài toán 2 */}
              <TableRow className="hover:bg-slate-50">
                <TableCell>
                  <div className="font-semibold text-xs text-slate-900">
                    Trạm đo Carota giếng khoan sâu &gt;800m
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Nhiệm vụ đột xuất tại Tây Bắc (10 ngày)
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div>1 bộ Matrix Logger (500m)</div>
                  <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-200">
                    Không đủ độ sâu
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-800">
                  10 ngày đo nghiệm thu
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="font-semibold text-slate-900">3.200.000.000 đ</div>
                  <div className="text-[10px] text-muted-foreground">Trạm Carota tời điện 1000m</div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="font-semibold text-emerald-700">120.000.000 đ</div>
                  <div className="text-[10px] text-muted-foreground">Thuê trọn gói dịch vụ đo</div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="text-slate-400 italic">Không khả thi (Các đoàn không có máy)</div>
                </TableCell>
                <TableCell>
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center gap-1 text-xs font-bold text-blue-800">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Thuê ngoài trọn gói
                    </div>
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      Thời gian sử dụng ngắn (10 ngày/năm), mua mới sẽ lãng phí vốn đầu tư 3 tỷ.
                    </div>
                  </div>
                </TableCell>
              </TableRow>

              {/* Bài toán 3 */}
              <TableRow className="hover:bg-slate-50">
                <TableCell>
                  <div className="font-semibold text-xs text-slate-900">
                    Bộ máy định vị RTK GNSS 2 tần số
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Đo lưới tọa độ trắc địa cho 5 đề án mới
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div>1 bộ Trimble R12</div>
                  <Badge variant="outline" className="text-[10px] text-rose-700 border-rose-200">
                    Quá tải 100%
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-800">
                  Cần liên tục cả năm (&gt;220 ngày)
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="font-semibold text-emerald-700">320.000.000 đ</div>
                  <div className="text-[10px] text-muted-foreground">Mua 01 máy Trimble mới</div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="font-semibold text-rose-600">264.000.000 đ/năm</div>
                  <div className="text-[10px] text-muted-foreground">1.200.000 đ/ngày x 220 ngày</div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="text-slate-400 italic">Máy hiện có đang đo liên tục</div>
                </TableCell>
                <TableCell>
                  <div className="p-2 bg-purple-50 rounded border border-purple-200">
                    <div className="flex items-center gap-1 text-xs font-bold text-purple-800">
                      <Sparkles className="h-3.5 w-3.5" />
                      Mua mới bổ sung
                    </div>
                    <div className="text-[11px] text-purple-700 mt-0.5">
                      Thu hồi vốn sau 1,2 năm thuê ngoài. Nhu cầu sử dụng trên 220 ngày/năm.
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
