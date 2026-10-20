import React, { useState, useMemo } from "react"
import {
  Calendar,
  Layers,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  HardHat,
  CloudSun,
  Wrench,
  TrendingUp,
  FileText,
  UserCheck,
  AlertCircle,
  Eye,
  Check,
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
import { ConstructionDailyLog, TechnicalItem } from "@/types/engineering"
import {
  getDailyLogs,
  addDailyLog,
  getTechnicalItems,
} from "@/services/EngineeringService"

export default function EngineeringDailyLogPage() {
  const [logs, setLogs] = useState<ConstructionDailyLog[]>(() => getDailyLogs())
  const [items, setItems] = useState<TechnicalItem[]>(() => getTechnicalItems())

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItemFilter, setSelectedItemFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

  // Modal State
  const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false)
  const [selectedLogDetail, setSelectedLogDetail] = useState<ConstructionDailyLog | null>(null)

  // Form State
  const [formItemId, setFormItemId] = useState(items[0]?.id || "")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])
  const [formWeather, setFormWeather] = useState<"Nắng ráo" | "Mưa nhẹ" | "Mưa to - nghỉ đo" | "Độ ẩm cao - sương mù">("Nắng ráo")
  const [formTemperature, setFormTemperature] = useState("28°C")
  const [formWorkforceCount, setFormWorkforceCount] = useState(6)
  const [formEngineersList, setFormEngineersList] = useState("KS. Nguyễn Văn Tuấn, KS. Đặng Văn Nam, 4 công nhân")
  const [formAssignedEquipment, setFormAssignedEquipment] = useState("Máy Geode 24 kênh (GEO-2021-9981), Máy phát điện 3kVA")
  const [formDailyVolume, setFormDailyVolume] = useState("1.5")
  const [formWorkDescription, setFormWorkDescription] = useState("Triển khai thi công đoạn tuyến mới, điện trở tiếp xúc đạt chuẩn, địa hình đồi núi dốc.")
  const [formSafetyStatus, setFormSafetyStatus] = useState("Đảm bảo an toàn 100%, bảo hộ lao động đầy đủ, không có sự cố.")
  const [formLoggedBy, setFormLoggedBy] = useState("KS. Đặng Văn Nam")

  const selectedItemObj = useMemo(() => {
    return items.find((i) => i.id === formItemId)
  }, [items, formItemId])

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.logCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.loggedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.assignedEquipment.toLowerCase().includes(searchTerm.toLowerCase())

      const matchItem = selectedItemFilter === "all" || log.itemId === selectedItemFilter
      const matchDate = !dateFilter || log.date === dateFilter

      return matchSearch && matchItem && matchDate
    })
  }, [logs, searchTerm, selectedItemFilter, dateFilter])

  // Aggregate KPI stats
  const totalVolumeLogged = useMemo(() => {
    return logs.reduce((acc, curr) => acc + curr.dailyVolume, 0)
  }, [logs])

  const totalPersonnelInField = useMemo(() => {
    return logs.length > 0 ? logs.reduce((acc, curr) => acc + curr.workforceCount, 0) : 0
  }, [logs])

  const handleConfirmLog = (logId: string) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, confirmedBy: "TS. Nguyễn Văn Tuấn (Chủ nhiệm)" } : l))
    )
    if (selectedLogDetail && selectedLogDetail.id === logId) {
      setSelectedLogDetail((prev) =>
        prev ? { ...prev, confirmedBy: "TS. Nguyễn Văn Tuấn (Chủ nhiệm)" } : null
      )
    }
  }

  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemObj) return

    const newLog = addDailyLog({
      date: formDate,
      itemId: selectedItemObj.id,
      itemCode: selectedItemObj.code,
      itemName: selectedItemObj.name,
      taskName: selectedItemObj.targetLocation ? `Đề án thi công tại ${selectedItemObj.targetLocation}` : "Nhiệm vụ địa vật lý",
      unitName: "Đoàn Địa vật lý 1",
      weather: formWeather,
      temperature: formTemperature,
      workforceCount: Number(formWorkforceCount),
      engineersList: formEngineersList,
      assignedEquipment: formAssignedEquipment,
      dailyVolume: Number(formDailyVolume),
      workDescription: formWorkDescription,
      safetyStatus: formSafetyStatus,
      loggedBy: formLoggedBy,
      confirmedBy: undefined,
    })

    setLogs(getDailyLogs())
    setItems(getTechnicalItems()) // refresh accumulated volume
    setIsNewLogModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold">
              TEC-04 & TEC-05
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Nhật ký thi công & Tổng hợp khối lượng thực hiện
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi nhật ký công trường hàng ngày, nhân lực, thiết bị và tự động cộng dồn lũy kế khối lượng thực hiện theo từng hạng mục kỹ thuật.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsNewLogModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ghi nhật ký thi công
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng số nhật ký đã ghi
            </CardTitle>
            <FileText className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{logs.length} bản ghi</div>
            <p className="mt-1 text-xs text-slate-500">Cập nhật liên tục từ các tổ thi công</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Khối lượng ghi nhận hôm nay
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {logs.filter(l => l.date === new Date().toISOString().split("T")[0]).reduce((s, c) => s + c.dailyVolume, 0) || "3.3"} đơn vị
            </div>
            <p className="mt-1 text-xs text-slate-500">Tự động cộng dồn vào khối lượng lũy kế</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nhân lực hiện trường
            </CardTitle>
            <HardHat className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalPersonnelInField} lượt cán bộ</div>
            <p className="mt-1 text-xs text-slate-500">Kỹ sư địa vật lý & nhân công kỹ thuật</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tỷ lệ nhật ký đã xác nhận
            </CardTitle>
            <UserCheck className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((logs.filter((l) => !!l.confirmedBy).length / (logs.length || 1)) * 100)}%
            </div>
            <p className="mt-1 text-xs text-slate-500">Chủ nhiệm đề án phê duyệt hiện trường</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress overview by item (TEC-05) */}
      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/40 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Tổng hợp khối lượng thi công lũy kế so với kế hoạch (TEC-05)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Hệ thống tự động cộng dồn từ các bản ghi nhật ký thi công hàng ngày để tính tiến độ kỹ thuật.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 text-xs font-medium">
              Tự động cộng dồn thời gian thực
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 3).map((item) => {
              const progressPct = Math.min(100, Math.round((item.completedVolume / item.plannedVolume) * 100))
              return (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-700">{item.code}</span>
                    <Badge variant="secondary" className="text-[11px] font-semibold">
                      {progressPct}% hoàn thành
                    </Badge>
                  </div>
                  <div className="mt-1 font-medium text-xs text-slate-800 line-clamp-1" title={item.name}>
                    {item.name}
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Đã thực hiện: <b className="text-slate-900">{item.completedVolume}</b> {item.unit}</span>
                    <span>Kế hoạch: <b>{item.plannedVolume}</b> {item.unit}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm mã nhật ký, hạng mục, kỹ sư, thiết bị..."
                className="pl-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="md:col-span-4">
              <Select value={selectedItemFilter} onValueChange={setSelectedItemFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Lọc theo hạng mục kỹ thuật" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả hạng mục kỹ thuật</SelectItem>
                  {items.map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.code} - {it.name.slice(0, 35)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Daily Logs Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Danh sách nhật ký thi công hiện trường ({filteredLogs.length})
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Ghi nhận theo ngày, hạng mục, nhân lực, thiết bị và khối lượng thực hiện (TEC-04)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[120px] font-semibold text-slate-700">Mã nhật ký</TableHead>
                  <TableHead className="w-[100px] font-semibold text-slate-700">Ngày</TableHead>
                  <TableHead className="font-semibold text-slate-700">Hạng mục & Nhiệm vụ</TableHead>
                  <TableHead className="w-[130px] font-semibold text-slate-700">Thời tiết</TableHead>
                  <TableHead className="w-[100px] font-semibold text-slate-700">Nhân lực</TableHead>
                  <TableHead className="font-semibold text-slate-700">Thiết bị thi công</TableHead>
                  <TableHead className="w-[110px] text-right font-semibold text-slate-700">Khối lượng</TableHead>
                  <TableHead className="w-[130px] font-semibold text-slate-700">Xác nhận</TableHead>
                  <TableHead className="w-[100px] text-right font-semibold text-slate-700">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-slate-500">
                      Không tìm thấy nhật ký thi công nào phù hợp với bộ lọc.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const matchedItem = items.find((i) => i.id === log.itemId)
                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-mono text-xs font-semibold text-emerald-700">
                          {log.logCode}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {log.date}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-slate-900">{log.itemName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{log.taskName}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px] font-normal border-slate-200">
                            <CloudSun className="mr-1 h-3 w-3 text-amber-500" />
                            {log.weather} ({log.temperature})
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                            <HardHat className="h-3.5 w-3.5 text-slate-400" />
                            {log.workforceCount} người
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-700 truncate max-w-[200px]" title={log.assignedEquipment}>
                            {log.assignedEquipment}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-xs text-emerald-600">
                            +{log.dailyVolume}
                          </span>{" "}
                          <span className="text-[11px] text-slate-500">{matchedItem?.unit || "đv"}</span>
                        </TableCell>
                        <TableCell>
                          {log.confirmedBy ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[11px]">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Đã xác nhận
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[11px] text-amber-700 bg-amber-50 border-amber-200">
                              Chờ CN duyệt
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-600 hover:text-blue-600"
                              onClick={() => setSelectedLogDetail(log)}
                              title="Xem chi tiết nhật ký"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {!log.confirmedBy && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleConfirmLog(log.id)}
                                title="Xác nhận nhật ký (Chủ nhiệm)"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
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
        </CardContent>
      </Card>

      {/* Modal View Detail Log */}
      <Dialog
        open={!!selectedLogDetail}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedLogDetail(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <FileText className="h-5 w-5 text-emerald-600" />
              Chi tiết nhật ký thi công hiện trường - {selectedLogDetail?.logCode}
            </DialogTitle>
          </DialogHeader>

          {selectedLogDetail && (
            <div className="space-y-4 text-xs text-slate-700 py-2">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">Hạng mục thi công:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedLogDetail.itemName}</div>
                  <div className="text-[11px] text-blue-600">{selectedLogDetail.itemCode}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Nhiệm vụ / Đề án:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedLogDetail.taskName}</div>
                  <div className="text-[11px] text-slate-500">Đơn vị: {selectedLogDetail.unitName}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 rounded border border-slate-200 bg-white">
                  <div className="text-slate-500 text-[11px]">Ngày thực hiện</div>
                  <div className="font-semibold text-slate-900 mt-1">{selectedLogDetail.date}</div>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-white">
                  <div className="text-slate-500 text-[11px]">Điều kiện thời tiết</div>
                  <div className="font-semibold text-slate-900 mt-1">{selectedLogDetail.weather} ({selectedLogDetail.temperature})</div>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-white">
                  <div className="text-slate-500 text-[11px]">Khối lượng hoàn thành</div>
                  <div className="font-bold text-emerald-600 text-sm mt-0.5">+{selectedLogDetail.dailyVolume}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-800">Nhân lực & Kỹ sư hiện trường:</div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="font-medium text-slate-900">Tổng nhân lực: {selectedLogDetail.workforceCount} người</div>
                  <div className="text-slate-600 mt-0.5">{selectedLogDetail.engineersList}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-800">Máy móc & Thiết bị địa vật lý sử dụng:</div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700">
                  {selectedLogDetail.assignedEquipment}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-800">Mô tả công việc hiện trường & Tiến độ:</div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedLogDetail.workDescription}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-800">Tình trạng An toàn lao động:</div>
                <div className="p-2.5 bg-emerald-50/60 rounded border border-emerald-200 text-emerald-900">
                  {selectedLogDetail.safetyStatus}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Cán bộ lập nhật ký:</span>{" "}
                  <b className="text-slate-900">{selectedLogDetail.loggedBy}</b>
                </div>
                <div>
                  <span className="text-slate-500">Chủ nhiệm xác nhận:</span>{" "}
                  {selectedLogDetail.confirmedBy ? (
                    <b className="text-emerald-700">{selectedLogDetail.confirmedBy}</b>
                  ) : (
                    <span className="text-amber-600 italic">Chưa xác nhận</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedLogDetail && !selectedLogDetail.confirmedBy && (
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => handleConfirmLog(selectedLogDetail.id)}
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Xác nhận phê duyệt nhật ký
              </Button>
            )}
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => setSelectedLogDetail(null)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Create Daily Log (TEC-04 & TEC-05) */}
      <Dialog
        open={isNewLogModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setIsNewLogModalOpen(false)
        }}
      >
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSaveDailyLog}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Plus className="h-5 w-5 text-emerald-600" />
                Ghi nhật ký thi công hiện trường mới (TEC-04 & TEC-05)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Hạng mục kỹ thuật áp dụng *</Label>
                  <Select value={formItemId} onValueChange={setFormItemId}>
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue placeholder="Chọn hạng mục thi công" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((it) => (
                        <SelectItem key={it.id} value={it.id} className="text-xs">
                          {it.code} - {it.name} ({it.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Ngày thi công *</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
              </div>

              {selectedItemObj && (
                <div className="rounded-lg bg-blue-50/70 p-2.5 border border-blue-200 text-blue-900 flex justify-between items-center">
                  <div>
                    <span className="font-medium">Tiến độ hiện tại:</span> {selectedItemObj.completedVolume} / {selectedItemObj.plannedVolume} {selectedItemObj.unit}
                  </div>
                  <div>
                    <span className="font-medium">Định mức ngày:</span> {selectedItemObj.normRate} {selectedItemObj.unit}/ngày
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Thời tiết</Label>
                  <Select
                    value={formWeather}
                    onValueChange={(val: "Nắng ráo" | "Mưa nhẹ" | "Mưa to - nghỉ đo" | "Độ ẩm cao - sương mù") => setFormWeather(val)}
                  >
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nắng ráo">Nắng ráo</SelectItem>
                      <SelectItem value="Mưa nhẹ">Mưa nhẹ</SelectItem>
                      <SelectItem value="Mưa to - nghỉ đo">Mưa to - nghỉ đo</SelectItem>
                      <SelectItem value="Độ ẩm cao - sương mù">Độ ẩm cao - sương mù</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Nhiệt độ hiện trường</Label>
                  <Input
                    value={formTemperature}
                    onChange={(e) => setFormTemperature(e.target.value)}
                    placeholder="VD: 28°C"
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    Khối lượng trong ngày * ({selectedItemObj?.unit || "đơn vị"})
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formDailyVolume}
                    onChange={(e) => setFormDailyVolume(e.target.value)}
                    className="mt-1 text-xs font-bold text-emerald-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Số lượng nhân lực (người)</Label>
                  <Input
                    type="number"
                    value={formWorkforceCount}
                    onChange={(e) => setFormWorkforceCount(Number(e.target.value))}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Cán bộ ghi nhật ký</Label>
                  <Input
                    value={formLoggedBy}
                    onChange={(e) => setFormLoggedBy(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Danh sách kỹ sư & Nhân công tham gia</Label>
                <Input
                  value={formEngineersList}
                  onChange={(e) => setFormEngineersList(e.target.value)}
                  placeholder="KS. Nguyễn Văn Tuấn (Trưởng nhóm), 4 công nhân..."
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Thiết bị máy móc địa vật lý sử dụng</Label>
                <Input
                  value={formAssignedEquipment}
                  onChange={(e) => setFormAssignedEquipment(e.target.value)}
                  placeholder="Máy Geode 24 kênh (GEO-2021-9981), máy phát điện..."
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Mô tả chi tiết công việc hiện trường</Label>
                <Textarea
                  value={formWorkDescription}
                  onChange={(e) => setFormWorkDescription(e.target.value)}
                  rows={2}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Tình trạng An toàn lao động</Label>
                <Input
                  value={formSafetyStatus}
                  onChange={(e) => setFormSafetyStatus(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="text-xs"
                onClick={() => setIsNewLogModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Lưu nhật ký & Cộng dồn khối lượng (TEC-05)
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
