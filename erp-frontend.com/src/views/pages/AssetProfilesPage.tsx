import React, { useState, useMemo } from "react"
import {
  Search,
  Plus,
  QrCode,
  Eye,
  Edit,
  Trash2,
  HardDrive,
  Activity,
  CheckCircle2,
  Wrench,
  RefreshCw,
  Printer,
  Smartphone,
  ShieldCheck,
  Building2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  GeophysicalAsset,
  AssetCategory,
  AssetStatus,
  ASSET_CATEGORIES,
  ASSET_STATUS_CONFIG,
} from "@/types/asset"
import {
  getAssets,
  saveAsset,
  deleteAsset,
} from "@/services/AssetService"

export default function AssetProfilesPage() {
  const [assets, setAssets] = useState<GeophysicalAsset[]>(() => getAssets())
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [unitFilter, setUnitFilter] = useState<string>("ALL")

  // Modals state - Quản lý độc lập trạng thái đóng/mở và đối tượng được chọn
  const [detailAsset, setDetailAsset] = useState<GeophysicalAsset | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [qrAsset, setQrAsset] = useState<GeophysicalAsset | null>(null)
  const [isQROpen, setIsQROpen] = useState(false)

  const [assetToEdit, setAssetToEdit] = useState<GeophysicalAsset | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const reloadData = () => {
    setAssets(getAssets())
  }

  // Thao tác mở popup
  const handleOpenDetail = (asset: GeophysicalAsset) => {
    setDetailAsset(asset)
    setIsDetailOpen(true)
  }

  const handleOpenQR = (asset: GeophysicalAsset) => {
    setQrAsset(asset)
    setIsQROpen(true)
  }

  const handleOpenEdit = (asset: GeophysicalAsset) => {
    setAssetToEdit(asset)
    setIsFormOpen(true)
  }

  const handleOpenCreate = () => {
    setAssetToEdit(null)
    setIsFormOpen(true)
  }

  // Lọc dữ liệu
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.serialNumber.toLowerCase().includes(q) ||
        item.personInCharge.toLowerCase().includes(q)

      const matchCategory = categoryFilter === "ALL" || item.category === categoryFilter
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter
      const matchUnit = unitFilter === "ALL" || item.managingUnit === unitFilter

      return matchSearch && matchCategory && matchStatus && matchUnit
    })
  }, [assets, searchQuery, categoryFilter, statusFilter, unitFilter])

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = assets.length
    const inUse = assets.filter((a) => a.status === "in_use").length
    const ready = assets.filter((a) => a.status === "active").length
    const maintenance = assets.filter((a) => a.status === "repairing" || a.status === "calibrating").length
    return { total, inUse, ready, maintenance }
  }, [assets])

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ thiết bị: "${name}"?`)) {
      deleteAsset(id)
      reloadData()
    }
  }

  const handleSaveSuccess = (saved: GeophysicalAsset) => {
    saveAsset(saved)
    reloadData()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Hồ sơ thiết bị & QR Code (AST-01, AST-02)
            </h1>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              {assets.length} thiết bị
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý danh mục máy móc, thông số kỹ thuật, lý lịch sử dụng và xuất nhãn QR code thiết bị địa vật lý.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reloadData} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Thêm mới thiết bị
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tổng máy móc thiết bị</CardTitle>
            <HardDrive className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Toàn Liên đoàn Địa vật lý</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Sẵn sàng điều động</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">{stats.ready}</div>
            <p className="text-xs text-emerald-600/80 mt-1">Lưu trữ tại kho Liên đoàn</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Đang thi công thực địa</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 tabular-nums">{stats.inUse}</div>
            <p className="text-xs text-blue-600/80 mt-1">Đang gắn vào nhiệm vụ / dự án</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Bảo dưỡng / Kiểm định</CardTitle>
            <Wrench className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 tabular-nums">{stats.maintenance}</div>
            <p className="text-xs text-amber-600/80 mt-1">Đang tại xưởng hoặc trung tâm đo lường</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-12 items-center">
            {/* Search */}
            <div className="relative md:col-span-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã tài sản, tên thiết bị, model, serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Chủng loại thiết bị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả chủng loại</SelectItem>
                  {ASSET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Managing Unit */}
            <div className="md:col-span-3">
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Đơn vị quản lý" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả đơn vị</SelectItem>
                  <SelectItem value="Đoàn Địa vật lý 1">Đoàn Địa vật lý 1</SelectItem>
                  <SelectItem value="Đoàn Địa vật lý 2">Đoàn Địa vật lý 2</SelectItem>
                  <SelectItem value="Đoàn Địa vật lý 3">Đoàn Địa vật lý 3</SelectItem>
                  <SelectItem value="Trung tâm Phân tích & Kỹ thuật">Trung tâm Phân tích & Kỹ thuật</SelectItem>
                  <SelectItem value="Kho máy Liên đoàn (Hà Nội)">Kho máy Liên đoàn (Hà Nội)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Tình trạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả tình trạng</SelectItem>
                  <SelectItem value="active">Sẵn sàng (Kho)</SelectItem>
                  <SelectItem value="in_use">Đang sử dụng</SelectItem>
                  <SelectItem value="repairing">Đang bảo dưỡng</SelectItem>
                  <SelectItem value="calibrating">Đang kiểm định</SelectItem>
                  <SelectItem value="broken">Hỏng hóc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Asset Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b">
              <TableRow>
                <TableHead className="w-12 text-center text-xs font-semibold text-slate-700">STT</TableHead>
                <TableHead className="w-32 text-xs font-semibold text-slate-700">Mã tài sản</TableHead>
                <TableHead className="min-w-[220px] text-xs font-semibold text-slate-700">Tên thiết bị</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Chủng loại</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Model / Serial</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Đơn vị quản lý</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Người phụ trách</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Tình trạng</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Vị trí hiện tại</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-700 w-36">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                    Không tìm thấy thiết bị nào phù hợp với bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset, index) => {
                  const statusConf = ASSET_STATUS_CONFIG[asset.status]
                  return (
                    <TableRow key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-center text-xs text-slate-500 tabular-nums">
                        {index + 1}
                      </TableCell>

                      <TableCell>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDetail(asset)
                          }}
                          className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {asset.code}
                        </button>
                      </TableCell>

                      <TableCell>
                        <div
                          className="font-medium text-xs text-slate-900 cursor-pointer hover:text-blue-600 line-clamp-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDetail(asset)
                          }}
                        >
                          {asset.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          SX: {asset.yearOfManufacture} ({asset.manufacturerCountry})
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-slate-700">{asset.category}</span>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-medium text-slate-800">{asset.model}</div>
                        <div className="text-[11px] font-mono text-slate-500">{asset.serialNumber}</div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-slate-700">{asset.managingUnit}</span>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-slate-700">{asset.personInCharge}</span>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConf.badgeClass}`}
                        >
                          {statusConf.label}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-slate-600 line-clamp-1" title={asset.currentLocation}>
                          {asset.currentLocation}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Xem lý lịch máy */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Xem hồ sơ & lý lịch kỹ thuật"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenDetail(asset)
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {/* Mã QR code (AST-02) */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                            title="Mã QR code & Nhãn dán thiết bị"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenQR(asset)
                            }}
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </Button>

                          {/* Sửa */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                            title="Sửa hồ sơ thiết bị"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(asset)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          {/* Xóa */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            title="Xóa thiết bị"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(asset.id, asset.name)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* ============ MODAL 1: CHI TIẾT HỒ SƠ THIẾT BỊ (AST-01) ============ */}
      <AssetDetailDialog
        key={detailAsset ? `detail-${detailAsset.id}` : "detail-empty"}
        open={isDetailOpen}
        asset={detailAsset}
        onClose={() => {
          setIsDetailOpen(false)
          setDetailAsset(null)
        }}
        onOpenQR={(asset) => {
          setIsDetailOpen(false)
          setDetailAsset(null)
          setTimeout(() => {
            setQrAsset(asset)
            setIsQROpen(true)
          }, 80)
        }}
      />

      {/* ============ MODAL 2: MÃ QR CODE & NHÃN THIẾT BỊ (AST-02) ============ */}
      <AssetQRCodeDialog
        key={qrAsset ? `qr-${qrAsset.id}` : "qr-empty"}
        open={isQROpen}
        asset={qrAsset}
        onClose={() => {
          setIsQROpen(false)
          setQrAsset(null)
        }}
      />

      {/* ============ MODAL 3: TẠO MỚI / CHỈNH SỬA THIẾT BỊ (AST-01) ============ */}
      <AssetFormDialog
        key={assetToEdit ? `edit-${assetToEdit.id}` : "create-new"}
        open={isFormOpen}
        asset={assetToEdit}
        onClose={() => {
          setIsFormOpen(false)
          setAssetToEdit(null)
        }}
        onSave={handleSaveSuccess}
      />
    </div>
  )
}

// Sub-component 1: Popup Chi tiết hồ sơ thiết bị (AST-01)
function AssetDetailDialog({
  open,
  asset,
  onClose,
  onOpenQR,
}: {
  open: boolean
  asset: GeophysicalAsset | null
  onClose: () => void
  onOpenQR: (asset: GeophysicalAsset) => void
}) {
  if (!asset) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-blue-700">{asset.code}</span>
              <DialogTitle className="text-lg font-bold text-slate-900 mt-0.5">{asset.name}</DialogTitle>
              <DialogDescription className="text-xs">
                Model: {asset.model} | Chủng loại: {asset.category}
              </DialogDescription>
            </div>
            <Badge className={ASSET_STATUS_CONFIG[asset.status].badgeClass}>
              {ASSET_STATUS_CONFIG[asset.status].label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Thông số kỹ thuật */}
          <div className="rounded-lg border p-3 bg-slate-50/50 space-y-2">
            <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-blue-600" />
              Thông số chế tạo & Lý lịch xuất xứ
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                Số Serial máy: <strong className="font-mono text-slate-900">{asset.serialNumber}</strong>
              </div>
              <div>
                Nước sản xuất: <strong className="text-slate-900">{asset.manufacturerCountry}</strong>
              </div>
              <div>
                Năm sản xuất: <strong className="text-slate-900">{asset.yearOfManufacture}</strong>
              </div>
              <div>
                Năm đưa vào sử dụng: <strong className="text-slate-900">{asset.yearOfUse}</strong>
              </div>
              <div>
                Nguyên giá:{" "}
                <strong className="font-mono text-slate-900">
                  {asset.originalPrice.toLocaleString("vi-VN")} đ
                </strong>
              </div>
              <div>
                Giá trị còn lại:{" "}
                <strong className="font-mono text-emerald-700">
                  {asset.residualValue.toLocaleString("vi-VN")} đ
                </strong>
              </div>
            </div>
          </div>

          {/* Phân công & Vị trí thực địa */}
          <div className="rounded-lg border p-3 bg-slate-50/50 space-y-2">
            <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-600" />
              Quản lý & Hiện trạng vị trí công trường
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                Đơn vị quản lý: <strong className="text-slate-900">{asset.managingUnit}</strong>
              </div>
              <div>
                Cán bộ phụ trách: <strong className="text-slate-900">{asset.personInCharge}</strong>
              </div>
              <div className="col-span-2">
                Vị trí hiện tại: <strong className="text-blue-700">{asset.currentLocation}</strong>
              </div>
              <div className="col-span-2">
                Dự án đang phục vụ:{" "}
                <strong className="text-slate-900">
                  {asset.currentProject || "Không gắn nhiệm vụ (Lưu kho)"}
                </strong>
              </div>
            </div>
          </div>

          {/* Vòng đời kiểm định & vận hành */}
          <div className="rounded-lg border p-3 bg-slate-50/50 space-y-2">
            <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Lịch kiểm định đo lường & Chi phí bảo dưỡng
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                Kiểm định gần nhất: <span className="font-mono">{asset.lastCalibrationDate}</span>
              </div>
              <div>
                Hạn kiểm định kế tiếp:{" "}
                <strong className="font-mono text-rose-600">{asset.nextCalibrationDate}</strong>
              </div>
              <div>
                Số ngày dùng năm nay:{" "}
                <strong className="tabular-nums text-slate-900">{asset.usageDaysThisYear} ngày</strong>
              </div>
              <div>
                Tổng kinh phí bảo dưỡng:{" "}
                <strong className="font-mono text-slate-900">
                  {asset.totalMaintenanceCost.toLocaleString("vi-VN")} đ
                </strong>
              </div>
            </div>
          </div>

          {asset.notes && (
            <div className="p-2.5 rounded bg-blue-50 border border-blue-100 text-slate-700">
              <span className="font-semibold text-blue-900">Ghi chú kỹ thuật:</span> {asset.notes}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex justify-between">
          <Button
            type="button"
            variant="outline"
            className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            onClick={() => onOpenQR(asset)}
          >
            <QrCode className="h-4 w-4" />
            Mã QR & Nhãn in
          </Button>
          <Button type="button" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Sub-component 2: Popup Mã QR Code & Tem nhãn thiết bị (AST-02)
function AssetQRCodeDialog({
  open,
  asset,
  onClose,
}: {
  open: boolean
  asset: GeophysicalAsset | null
  onClose: () => void
}) {
  if (!asset) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-indigo-600" />
            Nhãn QR Code thiết bị (AST-02)
          </DialogTitle>
          <DialogDescription className="text-xs">
            In nhãn decal dán máy và quét xem nhanh thông tin thực địa trên mobile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Thẻ mô phỏng nhãn dán kim loại/decal Liên đoàn */}
          <div className="p-4 border-2 border-slate-800 rounded-lg bg-white shadow-sm space-y-3">
            <div className="text-center border-b pb-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                BỘ TÀI NGUYÊN VÀ MÔI TRƯỜNG
              </div>
              <div className="text-xs font-black uppercase text-blue-900">
                LIÊN ĐOÀN ĐỊA VẬT LÝ ĐỊA CHẤT
              </div>
              <div className="text-[10px] text-slate-500">TEM QUẢN LÝ THIẾT BỊ CHUYÊN DÙNG</div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mã QR SVG mô phỏng hình học chính xác */}
              <div className="p-2 border border-slate-300 rounded bg-white shrink-0">
                <svg viewBox="0 0 100 100" className="h-24 w-24">
                  {/* Cụm định vị 3 góc */}
                  <rect x="5" y="5" width="25" height="25" fill="#0f172a" />
                  <rect x="9" y="9" width="17" height="17" fill="#ffffff" />
                  <rect x="13" y="13" width="9" height="9" fill="#0f172a" />

                  <rect x="70" y="5" width="25" height="25" fill="#0f172a" />
                  <rect x="74" y="9" width="17" height="17" fill="#ffffff" />
                  <rect x="78" y="13" width="9" height="9" fill="#0f172a" />

                  <rect x="5" y="70" width="25" height="25" fill="#0f172a" />
                  <rect x="9" y="74" width="17" height="17" fill="#ffffff" />
                  <rect x="13" y="78" width="9" height="9" fill="#0f172a" />

                  {/* Các điểm dữ liệu ngẫu nhiên tạo hình QR */}
                  <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
                  <rect x="48" y="14" width="6" height="6" fill="#0f172a" />
                  <rect x="58" y="8" width="6" height="6" fill="#0f172a" />
                  <rect x="12" y="38" width="6" height="6" fill="#0f172a" />
                  <rect x="24" y="44" width="6" height="6" fill="#0f172a" />
                  <rect x="38" y="36" width="8" height="8" fill="#0f172a" />
                  <rect x="50" y="40" width="8" height="8" fill="#0f172a" />
                  <rect x="62" y="36" width="6" height="6" fill="#0f172a" />
                  <rect x="76" y="42" width="6" height="6" fill="#0f172a" />
                  <rect x="88" y="36" width="6" height="6" fill="#0f172a" />
                  <rect x="38" y="52" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="58" width="6" height="6" fill="#0f172a" />
                  <rect x="68" y="54" width="6" height="6" fill="#0f172a" />
                  <rect x="36" y="74" width="8" height="8" fill="#0f172a" />
                  <rect x="48" y="82" width="6" height="6" fill="#0f172a" />
                  <rect x="60" y="72" width="6" height="6" fill="#0f172a" />
                  <rect x="76" y="78" width="8" height="8" fill="#0f172a" />
                  <rect x="86" y="84" width="6" height="6" fill="#0f172a" />
                </svg>
              </div>

              <div className="flex-1 space-y-1 text-[11px] text-slate-800">
                <div>
                  Mã tài sản:{" "}
                  <strong className="font-mono text-blue-700 text-xs">{asset.code}</strong>
                </div>
                <div className="font-bold line-clamp-1">{asset.name}</div>
                <div className="text-[10px] text-slate-600">Model: {asset.model}</div>
                <div className="text-[10px] text-slate-600 font-mono">S/N: {asset.serialNumber}</div>
                <div className="text-[10px] text-slate-600">ĐV: {asset.managingUnit}</div>
                <div className="text-[10px] text-emerald-700 font-medium">
                  Hạn KĐ: {asset.nextCalibrationDate}
                </div>
              </div>
            </div>

            <div className="text-center pt-1 border-t text-[9px] text-slate-400 font-mono">
              {asset.qrCodeData}
            </div>
          </div>

          {/* Hướng dẫn thao tác */}
          <div className="p-3 rounded bg-slate-50 border text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-blue-600" />
              Mô phỏng quét mã QR trên Mobile (AST-02):
            </div>
            <p>
              Khi cán bộ kỹ thuật dùng camera/app mobile quét tem này, hệ thống sẽ mở trực tiếp màn hình
              tra cứu tình trạng máy, dự án đang công tác và lịch sử kiểm định.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            In tem dán máy
          </Button>
          <Button type="button" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Sub-component 3: Form modal tạo / sửa hồ sơ thiết bị (AST-01)
function AssetFormDialog({
  open,
  asset,
  onClose,
  onSave,
}: {
  open: boolean
  asset: GeophysicalAsset | null
  onClose: () => void
  onSave: (asset: GeophysicalAsset) => void
}) {
  const [code, setCode] = useState(asset?.code || `VLĐC-ĐC-${String(Math.floor(Math.random() * 90) + 10)}`)
  const [name, setName] = useState(asset?.name || "")
  const [category, setCategory] = useState<AssetCategory>(asset?.category || "Địa chấn")
  const [model, setModel] = useState(asset?.model || "")
  const [serialNumber, setSerialNumber] = useState(asset?.serialNumber || "")
  const [manufacturerCountry, setManufacturerCountry] = useState(asset?.manufacturerCountry || "Mỹ")
  const [yearOfManufacture, setYearOfManufacture] = useState(asset?.yearOfManufacture || 2022)
  const [yearOfUse, setYearOfUse] = useState(asset?.yearOfUse || 2023)
  const [originalPrice, setOriginalPrice] = useState(
    asset?.originalPrice ? String(asset.originalPrice) : "1200000000"
  )
  const [residualValue, setResidualValue] = useState(
    asset?.residualValue ? String(asset.residualValue) : "900000000"
  )
  const [managingUnit, setManagingUnit] = useState(asset?.managingUnit || "Đoàn Địa vật lý 1")
  const [personInCharge, setPersonInCharge] = useState(asset?.personInCharge || "")
  const [status, setStatus] = useState<AssetStatus>(asset?.status || "active")
  const [currentLocation, setCurrentLocation] = useState(asset?.currentLocation || "Kho máy Liên đoàn (Hà Nội)")
  const [nextCalibrationDate, setNextCalibrationDate] = useState(
    asset?.nextCalibrationDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState(asset?.notes || "")

  React.useEffect(() => {
    if (asset) {
      setCode(asset.code)
      setName(asset.name)
      setCategory(asset.category)
      setModel(asset.model)
      setSerialNumber(asset.serialNumber)
      setManufacturerCountry(asset.manufacturerCountry)
      setYearOfManufacture(asset.yearOfManufacture)
      setYearOfUse(asset.yearOfUse)
      setOriginalPrice(String(asset.originalPrice))
      setResidualValue(String(asset.residualValue))
      setManagingUnit(asset.managingUnit)
      setPersonInCharge(asset.personInCharge)
      setStatus(asset.status)
      setCurrentLocation(asset.currentLocation)
      setNextCalibrationDate(asset.nextCalibrationDate)
      setNotes(asset.notes || "")
    } else {
      setCode(`VLĐC-ĐC-${String(Math.floor(Math.random() * 90) + 10)}`)
      setName("")
      setCategory("Địa chấn")
      setModel("")
      setSerialNumber("")
      setManufacturerCountry("Mỹ")
      setYearOfManufacture(2022)
      setYearOfUse(2023)
      setOriginalPrice("1200000000")
      setResidualValue("900000000")
      setManagingUnit("Đoàn Địa vật lý 1")
      setPersonInCharge("")
      setStatus("active")
      setCurrentLocation("Kho máy Liên đoàn (Hà Nội)")
      setNextCalibrationDate(new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10))
      setNotes("")
    }
  }, [asset, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = asset?.id || `ast-${Date.now()}`
    const qrData = `VLDC-ASSET:${code}|${model}|${managingUnit}`

    const saved: GeophysicalAsset = {
      id,
      code,
      name,
      category,
      model,
      serialNumber,
      manufacturerCountry,
      yearOfManufacture: Number(yearOfManufacture) || 2022,
      yearOfUse: Number(yearOfUse) || 2023,
      originalPrice: Number(originalPrice) || 0,
      residualValue: Number(residualValue) || 0,
      managingUnit,
      personInCharge: personInCharge || "Kỹ sư phụ trách thiết bị",
      status,
      currentLocation,
      currentProject: asset?.currentProject,
      lastCalibrationDate: asset?.lastCalibrationDate || new Date().toISOString().slice(0, 10),
      nextCalibrationDate,
      calibrationStatus: "valid",
      lastUsedDate: asset?.lastUsedDate || new Date().toISOString().slice(0, 10),
      usageDaysThisYear: asset?.usageDaysThisYear || 0,
      totalMaintenanceCost: asset?.totalMaintenanceCost || 0,
      qrCodeData: qrData,
      notes,
    }

    onSave(saved)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            {asset ? "Chỉnh sửa hồ sơ thiết bị (AST-01)" : "Thêm mới hồ sơ thiết bị địa vật lý (AST-01)"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Mã tài sản *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: VLĐC-ĐC-05"
                className="mt-1 font-mono uppercase"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Chủng loại thiết bị *</Label>
              <Select value={category} onValueChange={(v: AssetCategory) => setCategory(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Tên thiết bị địa vật lý *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Máy đo điện đa cực SuperSting R8"
              className="mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Model máy *</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="VD: Geode 24-channel"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Số Serial sản xuất *</Label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="VD: GEO-2022-8819"
                className="mt-1 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold">Nước sản xuất / Hãng</Label>
              <Input
                value={manufacturerCountry}
                onChange={(e) => setManufacturerCountry(e.target.value)}
                placeholder="VD: Mỹ (Geometrics)"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Năm sản xuất</Label>
              <Input
                type="number"
                value={yearOfManufacture}
                onChange={(e) => setYearOfManufacture(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Năm đưa vào sử dụng</Label>
              <Input
                type="number"
                value={yearOfUse}
                onChange={(e) => setYearOfUse(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Nguyên giá (VNĐ)</Label>
              <Input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Giá trị còn lại (VNĐ)</Label>
              <Input
                type="number"
                value={residualValue}
                onChange={(e) => setResidualValue(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Đơn vị quản lý *</Label>
              <Select value={managingUnit} onValueChange={setManagingUnit}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Đoàn Địa vật lý 1">Đoàn Địa vật lý 1</SelectItem>
                  <SelectItem value="Đoàn Địa vật lý 2">Đoàn Địa vật lý 2</SelectItem>
                  <SelectItem value="Đoàn Địa vật lý 3">Đoàn Địa vật lý 3</SelectItem>
                  <SelectItem value="Trung tâm Phân tích & Kỹ thuật">Trung tâm Phân tích & Kỹ thuật</SelectItem>
                  <SelectItem value="Kho máy Liên đoàn (Hà Nội)">Kho máy Liên đoàn (Hà Nội)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Cán bộ / Kỹ sư phụ trách</Label>
              <Input
                value={personInCharge}
                onChange={(e) => setPersonInCharge(e.target.value)}
                placeholder="VD: Nguyễn Văn Tuấn (Kỹ sư)"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Tình trạng hoạt động</Label>
              <Select value={status} onValueChange={(v: AssetStatus) => setStatus(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Sẵn sàng (Kho)</SelectItem>
                  <SelectItem value="in_use">Đang sử dụng</SelectItem>
                  <SelectItem value="repairing">Đang bảo dưỡng/sửa chữa</SelectItem>
                  <SelectItem value="calibrating">Đang kiểm định</SelectItem>
                  <SelectItem value="broken">Hỏng hóc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Hạn kiểm định kế tiếp</Label>
              <Input
                type="date"
                value={nextCalibrationDate}
                onChange={(e) => setNextCalibrationDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Vị trí hiện tại</Label>
            <Input
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              placeholder="Kho máy Liên đoàn hoặc công trường thi công"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Ghi chú kỹ thuật</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thông số độ phân giải, dải tần số đo, cáp và phụ kiện kèm theo..."
              rows={2}
              className="mt-1 text-xs"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {asset ? "Lưu thay đổi" : "Tạo mới thiết bị"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
