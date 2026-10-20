import React, { useState, useMemo } from "react"
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  DollarSign,
  ShieldCheck,
  Calendar,
  FileCheck,
  Building2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  CalibrationRecord,
  MaintenanceRecord,
  GeophysicalAsset,
} from "@/types/asset"
import {
  getAssets,
  getCalibrations,
  addCalibration,
  getMaintenances,
  addMaintenance,
} from "@/services/AssetService"

export default function AssetMaintenancePage() {
  const [assets] = useState<GeophysicalAsset[]>(() => getAssets())
  const [calibrations, setCalibrations] = useState<CalibrationRecord[]>(() => getCalibrations())
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>(() => getMaintenances())

  // Tab & Filters
  const [activeTab, setActiveTab] = useState("calibration")
  const [searchCalib, setSearchCalib] = useState("")
  const [searchMaint, setSearchMaint] = useState("")
  const [maintStatusFilter, setMaintStatusFilter] = useState("ALL")

  // Modals state
  const [isCalibModalOpen, setIsCalibModalOpen] = useState(false)
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false)

  // Calibration Form State
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || "")
  const [calibDate, setCalibDate] = useState(new Date().toISOString().slice(0, 10))
  const [expireDate, setExpireDate] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  )
  const [calibUnit, setCalibUnit] = useState("Viện Đo lường Việt Nam (VMI)")
  const [certNum, setCertNum] = useState("")
  const [calibResult, setCalibResult] = useState<"passed" | "failed">("passed")
  const [calibCost, setCalibCost] = useState("12000000")
  const [calibNotes, setCalibNotes] = useState("")

  // Maintenance Form State
  const [maintAssetId, setMaintAssetId] = useState(assets[0]?.id || "")
  const [maintType, setMaintType] = useState<MaintenanceRecord["type"]>("periodic")
  const [maintStartDate, setMaintStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [maintEndDate, setMaintEndDate] = useState("")
  const [maintCost, setMaintCost] = useState("5000000")
  const [maintProvider, setMaintProvider] = useState("Xưởng Cơ điện Liên đoàn Địa vật lý")
  const [maintStatus, setMaintStatus] = useState<MaintenanceRecord["status"]>("in_progress")
  const [maintDesc, setMaintDesc] = useState("")
  const [maintSpareParts, setMaintSpareParts] = useState("")

  const reloadData = () => {
    setCalibrations(getCalibrations())
    setMaintenances(getMaintenances())
  }

  // Filter Calibrations
  const filteredCalibrations = useMemo(() => {
    return calibrations.filter((c) => {
      const q = searchCalib.toLowerCase().trim()
      return (
        !q ||
        c.assetCode.toLowerCase().includes(q) ||
        c.assetName.toLowerCase().includes(q) ||
        c.certificateNumber.toLowerCase().includes(q) ||
        c.calibrationUnit.toLowerCase().includes(q)
      )
    })
  }, [calibrations, searchCalib])

  // Filter Maintenances
  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((m) => {
      const q = searchMaint.toLowerCase().trim()
      const matchSearch =
        !q ||
        m.assetCode.toLowerCase().includes(q) ||
        m.assetName.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.serviceProvider.toLowerCase().includes(q)

      const matchStatus = maintStatusFilter === "ALL" || m.status === maintStatusFilter

      return matchSearch && matchStatus
    })
  }, [maintenances, searchMaint, maintStatusFilter])

  // Stats
  const stats = useMemo(() => {
    const totalCalibs = calibrations.length
    const warningCalibs = assets.filter(
      (a) => a.calibrationStatus === "warning" || a.calibrationStatus === "expired"
    ).length
    const inProgressMaint = maintenances.filter((m) => m.status !== "completed").length
    const totalCost =
      calibrations.reduce((sum, c) => sum + c.cost, 0) +
      maintenances.reduce((sum, m) => sum + m.cost, 0)
    return { totalCalibs, warningCalibs, inProgressMaint, totalCost }
  }, [calibrations, maintenances, assets])

  // Submit Calibration
  const handleSaveCalibration = (e: React.FormEvent) => {
    e.preventDefault()
    const targetAsset = assets.find((a) => a.id === selectedAssetId)
    if (!targetAsset) return

    addCalibration({
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      calibrationDate: calibDate,
      expirationDate: expireDate,
      calibrationUnit: calibUnit,
      certificateNumber: certNum || `KĐ-${Date.now().toString().slice(-4)}`,
      result: calibResult,
      cost: Number(calibCost) || 0,
      notes: calibNotes,
    })

    setIsCalibModalOpen(false)
    reloadData()
  }

  // Submit Maintenance
  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault()
    const targetAsset = assets.find((a) => a.id === maintAssetId)
    if (!targetAsset) return

    const count = maintenances.length + 1
    const code = `SC-2026/${String(count).padStart(3, "0")}`

    addMaintenance({
      code,
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      startDate: maintStartDate,
      endDate: maintEndDate || undefined,
      type: maintType,
      description: maintDesc,
      sparePartsReplaced: maintSpareParts ? maintSpareParts.split(",").map((s) => s.trim()) : [],
      serviceProvider: maintProvider,
      cost: Number(maintCost) || 0,
      status: maintStatus,
    })

    setIsMaintModalOpen(false)
    reloadData()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Kiểm định & Bảo dưỡng thiết bị (AST-03, AST-04)
            </h1>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
              Vòng đời thiết bị
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi kế hoạch hiệu chuẩn kiểm định định kỳ, cảnh báo hạn kiểm chuẩn và quản lý hồ sơ sửa chữa bảo trì.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reloadData} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          {activeTab === "calibration" ? (
            <Button
              size="sm"
              onClick={() => setIsCalibModalOpen(true)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Ghi nhận kiểm định mới
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsMaintModalOpen(true)}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Lập phiếu sửa chữa / bảo dưỡng
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Lượt kiểm định đã lưu</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{stats.totalCalibs}</div>
            <p className="text-xs text-muted-foreground mt-1">Hồ sơ kiểm định & hiệu chuẩn</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Cảnh báo hạn kiểm định</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 tabular-nums">{stats.warningCalibs}</div>
            <p className="text-xs text-amber-600/80 mt-1">Hết hạn hoặc còn dưới 30 ngày (AST-09)</p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-800">Đang sửa chữa / bảo dưỡng</CardTitle>
            <Wrench className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 tabular-nums">{stats.inProgressMaint}</div>
            <p className="text-xs text-rose-600/80 mt-1">Tại Xưởng Cơ điện & Hãng bảo hành</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Tổng chi phí kỹ thuật</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              {(stats.totalCost / 1000000).toLocaleString("vi-VN")} tr
            </div>
            <p className="text-xs text-emerald-600/80 mt-1">Gồm chi phí KĐ + Sửa chữa</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border">
          <TabsTrigger value="calibration" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Hiệu chuẩn & Kiểm định định kỳ (AST-03)
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-4 w-4" />
            Sửa chữa & Bảo dưỡng thiết bị (AST-04)
          </TabsTrigger>
        </TabsList>

        {/* ============ TAB 1: HIỆU CHUẨN / KIỂM ĐỊNH ============ */}
        <TabsContent value="calibration" className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm mã máy, tên thiết bị, cơ quan kiểm định, số tem chứng nhận..."
                    value={searchCalib}
                    onChange={(e) => setSearchCalib(e.target.value)}
                    className="pl-9 bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs font-semibold text-slate-700">STT</TableHead>
                    <TableHead className="w-32 text-xs font-semibold text-slate-700">Mã thiết bị</TableHead>
                    <TableHead className="min-w-[200px] text-xs font-semibold text-slate-700">Tên thiết bị</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Cơ quan kiểm định</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Số tem / GCN</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Ngày kiểm định</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Hạn kiểm định</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Kết quả</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-700">Chi phí (VNĐ)</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 min-w-[200px]">Ghi chú kỹ thuật</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalibrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                        Không có dữ liệu hiệu chuẩn phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCalibrations.map((cal, index) => {
                      const isExpired = new Date(cal.expirationDate).getTime() < Date.now()
                      const isSoon =
                        !isExpired &&
                        new Date(cal.expirationDate).getTime() - Date.now() < 30 * 24 * 3600 * 1000

                      return (
                        <TableRow key={cal.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="text-center text-xs text-slate-500 tabular-nums">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-blue-700">
                            {cal.assetCode}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-900">
                            {cal.assetName}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            {cal.calibrationUnit}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-800">
                            {cal.certificateNumber}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 tabular-nums">
                            {cal.calibrationDate}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums">
                            <span
                              className={`font-medium ${
                                isExpired
                                  ? "text-rose-600 font-bold"
                                  : isSoon
                                  ? "text-amber-600 font-bold"
                                  : "text-slate-700"
                              }`}
                            >
                              {cal.expirationDate}
                            </span>
                            {isSoon && (
                              <span className="ml-1.5 inline-block text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                                Gần hạn
                              </span>
                            )}
                            {isExpired && (
                              <span className="ml-1.5 inline-block text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded">
                                Quá hạn
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {cal.result === "passed" ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal text-[11px]">
                                Đạt chuẩn
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-normal text-[11px]">
                                Không đạt
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono font-medium text-slate-900 tabular-nums">
                            {cal.cost.toLocaleString("vi-VN")} đ
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {cal.notes || "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ============ TAB 2: SỬA CHỮA / BẢO DƯỠNG ============ */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-12 items-center">
                <div className="relative md:col-span-8">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm mã phiếu sửa chữa, mã thiết bị, tên máy, đơn vị thực hiện..."
                    value={searchMaint}
                    onChange={(e) => setSearchMaint(e.target.value)}
                    className="pl-9 bg-white"
                  />
                </div>
                <div className="md:col-span-4">
                  <Select value={maintStatusFilter} onValueChange={setMaintStatusFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Trạng thái sửa chữa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                      <SelectItem value="in_progress">Đang sửa chữa</SelectItem>
                      <SelectItem value="waiting_parts">Chờ linh kiện</SelectItem>
                      <SelectItem value="completed">Đã hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs font-semibold text-slate-700">STT</TableHead>
                    <TableHead className="w-32 text-xs font-semibold text-slate-700">Mã phiếu SC</TableHead>
                    <TableHead className="w-32 text-xs font-semibold text-slate-700">Mã máy</TableHead>
                    <TableHead className="min-w-[180px] text-xs font-semibold text-slate-700">Tên thiết bị</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Loại bảo dưỡng</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Đơn vị thực hiện</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Thời gian</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Linh kiện thay thế</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Trạng thái</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-700">Chi phí (VNĐ)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                        Không có dữ liệu sửa chữa phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaintenances.map((m, index) => {
                      const typeLabel =
                        m.type === "periodic"
                          ? "Bảo dưỡng định kỳ"
                          : m.type === "repair"
                          ? "Sửa chữa sự cố"
                          : "Thay linh kiện"

                      return (
                        <TableRow key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="text-center text-xs text-slate-500 tabular-nums">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-slate-900">
                            {m.code}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-blue-700">
                            {m.assetCode}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-900">
                            <div>{m.assetName}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">{m.description}</div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-slate-700">{typeLabel}</span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            {m.serviceProvider}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 tabular-nums">
                            <div>Bắt đầu: {m.startDate}</div>
                            {m.endDate && <div className="text-emerald-700">Xong: {m.endDate}</div>}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {m.sparePartsReplaced && m.sparePartsReplaced.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {m.sparePartsReplaced.map((sp, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]"
                                  >
                                    {sp}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {m.status === "completed" ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal text-[11px]">
                                Đã hoàn thành
                              </Badge>
                            ) : m.status === "in_progress" ? (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-normal text-[11px]">
                                Đang sửa chữa
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-normal text-[11px]">
                                Chờ linh kiện
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono font-medium text-slate-900 tabular-nums">
                            {m.cost.toLocaleString("vi-VN")} đ
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: Thêm kiểm định mới (AST-03) */}
      <Dialog open={isCalibModalOpen} onOpenChange={(open) => setIsCalibModalOpen(open)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Ghi nhận kiểm định & hiệu chuẩn thiết bị (AST-03)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCalibration} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Chọn thiết bị địa vật lý *</Label>
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      [{a.code}] {a.name} ({a.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Ngày kiểm định *</Label>
                <Input
                  type="date"
                  value={calibDate}
                  onChange={(e) => setCalibDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Hạn hiệu chuẩn kế tiếp *</Label>
                <Input
                  type="date"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Cơ quan kiểm định / Đo lường *</Label>
                <Input
                  value={calibUnit}
                  onChange={(e) => setCalibUnit(e.target.value)}
                  placeholder="Ví dụ: Viện Đo lường Việt Nam (VMI)"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Số giấy chứng nhận / Tem KĐ</Label>
                <Input
                  value={certNum}
                  onChange={(e) => setCertNum(e.target.value)}
                  placeholder="Ví dụ: VMI-2026-ĐC-0891"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Kết quả kiểm định</Label>
                <Select
                  value={calibResult}
                  onValueChange={(v: "passed" | "failed") => setCalibResult(v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">Đạt chuẩn (Cấp tem)</SelectItem>
                    <SelectItem value="failed">Không đạt (Cần sửa chữa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Chi phí kiểm định (VNĐ)</Label>
                <Input
                  type="number"
                  value={calibCost}
                  onChange={(e) => setCalibCost(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Ghi chú & Sai số kỹ thuật</Label>
              <Textarea
                value={calibNotes}
                onChange={(e) => setCalibNotes(e.target.value)}
                placeholder="Ghi chú sai số biên độ, tần số, độ nhạy cảm biến sau khi hiệu chuẩn..."
                rows={3}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCalibModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Lưu kết quả kiểm định
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Lập phiếu sửa chữa / bảo dưỡng (AST-04) */}
      <Dialog open={isMaintModalOpen} onOpenChange={(open) => setIsMaintModalOpen(open)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Lập phiếu sửa chữa / bảo dưỡng thiết bị (AST-04)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveMaintenance} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Chọn thiết bị cần bảo trì / sửa chữa *</Label>
              <Select value={maintAssetId} onValueChange={setMaintAssetId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      [{a.code}] {a.name} ({a.status === "in_use" ? "Đang thi công" : "Tại kho"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Loại hình kỹ thuật</Label>
                <Select
                  value={maintType}
                  onValueChange={(v: MaintenanceRecord["type"]) => setMaintType(v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="periodic">Bảo dưỡng định kỳ</SelectItem>
                    <SelectItem value="repair">Sửa chữa đột xuất sự cố</SelectItem>
                    <SelectItem value="upgrade">Thay thế / Nâng cấp linh kiện</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Trạng thái công việc</Label>
                <Select
                  value={maintStatus}
                  onValueChange={(v: MaintenanceRecord["status"]) => setMaintStatus(v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">Đang sửa chữa</SelectItem>
                    <SelectItem value="waiting_parts">Đang chờ linh kiện</SelectItem>
                    <SelectItem value="completed">Đã hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Ngày bắt đầu *</Label>
                <Input
                  type="date"
                  value={maintStartDate}
                  onChange={(e) => setMaintStartDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Ngày hoàn thành (dự kiến/thực tế)</Label>
                <Input
                  type="date"
                  value={maintEndDate}
                  onChange={(e) => setMaintEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Đơn vị sửa chữa *</Label>
                <Input
                  value={maintProvider}
                  onChange={(e) => setMaintProvider(e.target.value)}
                  placeholder="Xưởng Cơ điện Liên đoàn hoặc Nhà cung cấp"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Chi phí sửa chữa (VNĐ)</Label>
                <Input
                  type="number"
                  value={maintCost}
                  onChange={(e) => setMaintCost(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Linh kiện thay thế (cách nhau bằng dấu phẩy)</Label>
              <Input
                value={maintSpareParts}
                onChange={(e) => setMaintSpareParts(e.target.value)}
                placeholder="Ví dụ: Cáp đồng trục 50m, Cảm biến từ Fluxgate, Bugi máy nổ..."
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Mô tả hỏng hóc & giải pháp kỹ thuật</Label>
              <Textarea
                value={maintDesc}
                onChange={(e) => setMaintDesc(e.target.value)}
                placeholder="Mô tả hiện tượng lỗi, nguyên nhân sự cố ngoài thực địa và biện pháp xử lý..."
                rows={3}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMaintModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                Lưu phiếu sửa chữa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
