import React, { useState, useMemo } from "react"
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  DollarSign,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Briefcase,
  UserCheck,
  RefreshCw,
  Building,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  DispatchRecord,
  GeophysicalAsset,
  DISPATCH_STATUS_CONFIG,
} from "@/types/asset"
import {
  getAssets,
  getDispatches,
  createDispatch,
  updateDispatchStatus,
  checkDispatchConflict,
} from "@/services/AssetService"

export default function AssetDispatchPage() {
  const [assets, setAssets] = useState<GeophysicalAsset[]>(() => getAssets())
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(() => getDispatches())

  const [activeTab, setActiveTab] = useState("orders")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || "")
  const [destinationUnit, setDestinationUnit] = useState("Đoàn Địa vật lý 1")
  const [projectName, setProjectName] = useState(
    "Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền"
  )
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  )
  const [receiverName, setReceiverName] = useState("Kỹ sư hiện trường Đoàn 1")
  const [dailyRate, setDailyRate] = useState("1500000")
  const [notes, setNotes] = useState("")

  const reloadData = () => {
    setAssets(getAssets())
    setDispatches(getDispatches())
  }

  // Live conflict detection on Form (AST-06)
  const liveConflict = useMemo(() => {
    if (!selectedAssetId || !startDate || !endDate) return { hasConflict: false }
    return checkDispatchConflict(selectedAssetId, startDate, endDate)
  }, [selectedAssetId, startDate, endDate])

  // Lọc dữ liệu điều động
  const filteredDispatches = useMemo(() => {
    return dispatches.filter((d) => {
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        d.dispatchCode.toLowerCase().includes(q) ||
        d.assetCode.toLowerCase().includes(q) ||
        d.assetName.toLowerCase().includes(q) ||
        d.destinationUnit.toLowerCase().includes(q) ||
        d.projectName.toLowerCase().includes(q) ||
        d.receiverName.toLowerCase().includes(q)

      const matchStatus = statusFilter === "ALL" || d.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [dispatches, searchQuery, statusFilter])

  // Cảnh báo xung đột tổng thể trên hệ thống
  const activeConflicts = useMemo(() => {
    return dispatches.filter((d) => d.hasConflict)
  }, [dispatches])

  // Thống kê
  const stats = useMemo(() => {
    const inUseDispatches = dispatches.filter((d) => d.status === "dispatched").length
    const pendingDispatches = dispatches.filter((d) => d.status === "pending_approval").length
    const totalOperatingCost = dispatches.reduce((sum, d) => sum + d.estimatedCost, 0)
    const deployedAssetsCount = assets.filter((a) => a.status === "in_use").length
    return { inUseDispatches, pendingDispatches, totalOperatingCost, deployedAssetsCount }
  }, [dispatches, assets])

  // Lập lệnh mới
  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault()
    const targetAsset = assets.find((a) => a.id === selectedAssetId)
    if (!targetAsset) return

    // Tính số ngày và chi phí ước tính (AST-08)
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const days = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)))
    const estimatedCost = days * (Number(dailyRate) || 0)

    createDispatch({
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      originUnit: targetAsset.managingUnit,
      destinationUnit,
      projectName,
      startDate,
      expectedEndDate: endDate,
      requestedBy: "Cán bộ Kỹ thuật",
      receiverName,
      status: "pending_approval",
      notes: notes || "Phục vụ đo đạc tuyến khảo sát địa vật lý",
      estimatedCost,
      dailyRate: Number(dailyRate) || 0,
    })

    setIsCreateModalOpen(false)
    reloadData()
  }

  // Phê duyệt / Điều động / Hoàn trả
  const handleApprove = (id: string) => {
    updateDispatchStatus(id, "approved", "Lãnh đạo Liên đoàn")
    reloadData()
  }

  const handleDispatchOut = (id: string) => {
    updateDispatchStatus(id, "dispatched", "Lãnh đạo Liên đoàn")
    reloadData()
  }

  const handleReturn = (id: string) => {
    updateDispatchStatus(id, "returned")
    reloadData()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Điều động & Sử dụng thiết bị (AST-05, AST-06, AST-07, AST-08)
            </h1>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              Điều phối hiện trường
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quy trình lập lệnh điều động, tự động phát hiện xung đột trùng lịch, theo dõi vị trí GPS/công trường và tính chi phí ca máy theo nhiệm vụ dự án.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reloadData} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Lập lệnh điều động mới
          </Button>
        </div>
      </div>

      {/* Cảnh báo xung đột lịch điều động (AST-06) */}
      {activeConflicts.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900">
                Cảnh báo phát hiện xung đột lịch điều động (AST-06)
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                Hệ thống phát hiện có lệnh điều động bị trùng thiết bị hoặc đang hoạt động tại đơn vị khác. Vui lòng kiểm tra kỹ trước khi phê duyệt:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-amber-900 list-disc list-inside">
                {activeConflicts.map((c) => (
                  <li key={c.id}>
                    <strong>[{c.dispatchCode}] {c.assetName}</strong>: {c.conflictReason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Đang thi công thực địa</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 tabular-nums">{stats.inUseDispatches} lệnh</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.deployedAssetsCount} thiết bị tại hiện trường</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Lệnh chờ phê duyệt</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 tabular-nums">{stats.pendingDispatches}</div>
            <p className="text-xs text-amber-600/80 mt-1">Cần Lãnh đạo Liên đoàn duyệt (AST-05)</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Đang gắn vào nhiệm vụ</CardTitle>
            <Briefcase className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">{stats.deployedAssetsCount} máy</div>
            <p className="text-xs text-emerald-600/80 mt-1">Gắn chi phí ca máy trực tiếp (AST-08)</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Dự toán chi phí ca máy</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 tabular-nums">
              {(stats.totalOperatingCost / 1000000).toLocaleString("vi-VN")} tr
            </div>
            <p className="text-xs text-indigo-600/80 mt-1">Tính theo đơn giá ca máy dự án</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border">
          <TabsTrigger value="orders" className="gap-2">
            <Send className="h-4 w-4" />
            Lệnh điều động & Phê duyệt (AST-05, AST-06)
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            Theo dõi vị trí thực địa & Mức sử dụng nhiệm vụ (AST-07, AST-08)
          </TabsTrigger>
        </TabsList>

        {/* ============ TAB 1: LỆNH ĐIỀU ĐỘNG ============ */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-12 items-center">
                <div className="relative md:col-span-8">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm mã lệnh điều động, mã thiết bị, tên máy, đơn vị nhận, tên đề án..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white"
                  />
                </div>
                <div className="md:col-span-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Trạng thái lệnh" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                      <SelectItem value="pending_approval">Chờ phê duyệt</SelectItem>
                      <SelectItem value="approved">Đã duyệt (Chờ xuất)</SelectItem>
                      <SelectItem value="dispatched">Đang thi công</SelectItem>
                      <SelectItem value="returned">Đã hoàn trả</SelectItem>
                      <SelectItem value="rejected">Từ chối</SelectItem>
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
                    <TableHead className="w-28 text-xs font-semibold text-slate-700">Mã lệnh</TableHead>
                    <TableHead className="min-w-[180px] text-xs font-semibold text-slate-700">Thiết bị</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Đơn vị nhận</TableHead>
                    <TableHead className="min-w-[200px] text-xs font-semibold text-slate-700">Đề án / Nhiệm vụ</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Thời gian thi công</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Người nhận máy</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-700">Chi phí dự toán (VNĐ)</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Trạng thái</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-700 w-44">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDispatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                        Không có lệnh điều động nào phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDispatches.map((disp, index) => {
                      const statusConf = DISPATCH_STATUS_CONFIG[disp.status]
                      return (
                        <TableRow key={disp.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="text-center text-xs text-slate-500 tabular-nums">
                            {index + 1}
                          </TableCell>

                          <TableCell className="font-mono text-xs font-semibold text-slate-900">
                            {disp.dispatchCode}
                          </TableCell>

                          <TableCell>
                            <div className="font-mono text-xs font-semibold text-blue-700">{disp.assetCode}</div>
                            <div className="text-xs text-slate-800 line-clamp-1">{disp.assetName}</div>
                            {disp.hasConflict && (
                              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>Xung đột lịch!</span>
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-slate-700 font-medium">
                            {disp.destinationUnit}
                          </TableCell>

                          <TableCell>
                            <div className="text-xs text-slate-900 line-clamp-2">{disp.projectName}</div>
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 tabular-nums">
                            <div>Từ: {disp.startDate}</div>
                            <div>Đến: {disp.expectedEndDate}</div>
                          </TableCell>

                          <TableCell className="text-xs text-slate-700">
                            {disp.receiverName}
                          </TableCell>

                          <TableCell className="text-right text-xs font-mono font-medium text-slate-900 tabular-nums">
                            {disp.estimatedCost.toLocaleString("vi-VN")} đ
                            <div className="text-[10px] text-muted-foreground">
                              ({disp.dailyRate.toLocaleString("vi-VN")} đ/ngày)
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConf.badgeClass}`}
                            >
                              {statusConf.label}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {disp.status === "pending_approval" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                  onClick={() => handleApprove(disp.id)}
                                  title="Phê duyệt lệnh điều động (AST-05)"
                                >
                                  Duyệt
                                </Button>
                              )}

                              {disp.status === "approved" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                                  onClick={() => handleDispatchOut(disp.id)}
                                  title="Xuất kho đưa vào sử dụng thực địa"
                                >
                                  Xuất máy
                                </Button>
                              )}

                              {disp.status === "dispatched" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                                  onClick={() => handleReturn(disp.id)}
                                  title="Hoàn trả máy về kho"
                                >
                                  Thu hồi kho
                                </Button>
                              )}

                              {disp.status === "returned" && (
                                <span className="text-[11px] text-muted-foreground italic">
                                  Đã kết thúc
                                </span>
                              )}
                            </div>
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

        {/* ============ TAB 2: THEO DÕI VỊ TRÍ & MỨC SỬ DỤNG ============ */}
        <TabsContent value="locations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {assets.map((asset) => {
              const isInUse = asset.status === "in_use"
              return (
                <Card
                  key={asset.id}
                  className={`border shadow-sm transition-all ${
                    isInUse
                      ? "border-blue-200 bg-blue-50/20"
                      : asset.status === "repairing"
                      ? "border-rose-200 bg-rose-50/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700">{asset.code}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {asset.category}
                          </span>
                        </div>
                        <CardTitle className="text-sm font-bold text-slate-900 mt-1">
                          {asset.name}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono">
                          Model: {asset.model} | S/N: {asset.serialNumber}
                        </CardDescription>
                      </div>

                      <Badge
                        className={
                          isInUse
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : asset.status === "repairing"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }
                      >
                        {isInUse ? "Đang thi công" : asset.status === "repairing" ? "Đang sửa chữa" : "Tại kho sẵn sàng"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-2 text-xs">
                    {/* Vị trí hiện thời (AST-07) */}
                    <div className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                      <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Vị trí hiện tại:</span>{" "}
                        <span className="text-slate-700">{asset.currentLocation}</span>
                      </div>
                    </div>

                    {/* Nhiệm vụ / Đề án gắn kèm (AST-08) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium">Nhiệm vụ / Đề án:</span>
                        <span className="text-slate-900 font-semibold text-right">
                          {asset.currentProject || "Chưa gắn nhiệm vụ (Lưu kho)"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium">Đơn vị quản lý:</span>
                        <span>{asset.managingUnit}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium">Cán bộ phụ trách:</span>
                        <span>{asset.personInCharge}</span>
                      </div>
                    </div>

                    {/* Mức sử dụng và chi phí (AST-08) */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div className="p-2 bg-slate-100/70 rounded">
                        <div className="text-[11px] text-muted-foreground">Mức sử dụng năm 2026:</div>
                        <div className="text-sm font-bold text-slate-900 tabular-nums">
                          {asset.usageDaysThisYear} ngày/năm
                        </div>
                      </div>
                      <div className="p-2 bg-slate-100/70 rounded">
                        <div className="text-[11px] text-muted-foreground">Chi phí bảo dưỡng:</div>
                        <div className="text-sm font-bold text-slate-900 tabular-nums">
                          {(asset.totalMaintenanceCost / 1000000).toLocaleString("vi-VN")} triệu đ
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: LẬP LỆNH ĐIỀU ĐỘNG MỚI (AST-05, AST-06, AST-08) */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => setIsCreateModalOpen(open)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Lập lệnh đề xuất điều động thiết bị (AST-05)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateDispatch} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Chọn thiết bị điều động *</Label>
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
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
                <Label className="text-xs font-semibold">Ngày bắt đầu *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Ngày dự kiến hoàn trả *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            {/* LIVE CONFLICT WARNING (AST-06) */}
            {liveConflict.hasConflict && (
              <div className="p-3 rounded border border-rose-300 bg-rose-50 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold">Cảnh báo xung đột lịch điều động (AST-06):</span>
                  <p className="mt-0.5">{liveConflict.reason}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Đơn vị tiếp nhận *</Label>
                <Select value={destinationUnit} onValueChange={setDestinationUnit}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Đoàn Địa vật lý 1">Đoàn Địa vật lý 1</SelectItem>
                    <SelectItem value="Đoàn Địa vật lý 2">Đoàn Địa vật lý 2</SelectItem>
                    <SelectItem value="Đoàn Địa vật lý 3">Đoàn Địa vật lý 3</SelectItem>
                    <SelectItem value="Trung tâm Phân tích & Kỹ thuật">Trung tâm Phân tích & Kỹ thuật</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Người tiếp nhận bàn giao *</Label>
                <Input
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Họ tên cán bộ/kỹ sư tiếp nhận"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Gắn vào Đề án / Nhiệm vụ thực hiện * (AST-08)</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ví dụ: Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Đơn giá ca máy nội bộ (VNĐ/ngày)</Label>
                <Input
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Dự toán chi phí máy ước tính</Label>
                <div className="mt-1 h-9 flex items-center px-3 rounded border bg-slate-50 font-mono text-xs font-semibold text-blue-700 tabular-nums">
                  {(() => {
                    const s = new Date(startDate).getTime()
                    const ed = new Date(endDate).getTime()
                    const d = Math.max(1, Math.round((ed - s) / (1000 * 3600 * 24)))
                    return `${(d * (Number(dailyRate) || 0)).toLocaleString("vi-VN")} đ (${d} ngày)`
                  })()}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Ghi chú & Yêu cầu kỹ thuật</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Yêu cầu kiểm tra cáp, nguồn điện, phương tiện vận chuyển thiết bị địa vật lý..."
                rows={2}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Trình duyệt lệnh điều động
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
