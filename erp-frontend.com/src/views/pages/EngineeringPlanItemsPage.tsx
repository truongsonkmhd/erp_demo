import React, { useState, useMemo } from "react"
import {
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  DollarSign,
  Compass,
  FileCheck2,
  RefreshCw,
  Building,
  User,
  ArrowRight,
  TrendingUp,
  FileText,
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
  ConstructionPlan,
  TechnicalItem,
  MethodGeophysical,
  METHOD_LIST,
} from "@/types/engineering"
import {
  getPlans,
  savePlan,
  getTechnicalItems,
  saveTechnicalItem,
} from "@/services/EngineeringService"

export default function EngineeringPlanItemsPage() {
  const [plans, setPlans] = useState<ConstructionPlan[]>(() => getPlans())
  const [items, setItems] = useState<TechnicalItem[]>(() => getTechnicalItems())

  const [activeTab, setActiveTab] = useState("plans")
  const [searchPlan, setSearchPlan] = useState("")
  const [searchItem, setSearchItem] = useState("")

  // Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

  // Plan Form State (TEC-01)
  const [planCode, setPlanCode] = useState(`KH-2026/ĐVL-${String(Math.floor(Math.random() * 90) + 10)}`)
  const [planTaskName, setPlanTaskName] = useState("")
  const [planUnit, setPlanUnit] = useState("Đoàn Địa vật lý 1")
  const [planChief, setPlanChief] = useState("TS. Nguyễn Văn Tuấn")
  const [planLead, setPlanLead] = useState("ThS. Lê Hoàng Long")
  const [planStart, setPlanStart] = useState("2026-04-01")
  const [planEnd, setPlanEnd] = useState("2026-11-30")
  const [planCost, setPlanCost] = useState("2500000000")
  const [planNotes, setPlanNotes] = useState("")

  // Item Form State (TEC-02, TEC-03)
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || "")
  const [itemCode, setItemCode] = useState(`HM-ĐC-${String(Math.floor(Math.random() * 90) + 10)}`)
  const [itemName, setItemName] = useState("")
  const [itemMethod, setItemMethod] = useState<MethodGeophysical>("Địa chấn phản xạ / khúc xạ")
  const [itemUnit, setItemUnit] = useState("km tuyến")
  const [itemNormRate, setItemNormRate] = useState("1.5")
  const [itemUnitPrice, setItemUnitPrice] = useState("30000000")
  const [itemPlannedVol, setItemPlannedVol] = useState("50")
  const [itemLocation, setItemLocation] = useState("Khu mỏ chì kẽm Chợ Điền, Bắc Kạn")
  const [itemLineName, setItemLineName] = useState("Tuyến DC-01 đến DC-04")
  const [itemStartPt, setItemStartPt] = useState("X=2462000, Y=568000")
  const [itemEndPt, setItemEndPt] = useState("X=2465000, Y=571000")
  const [itemProvince, setItemProvince] = useState("Bắc Kạn")

  const reloadData = () => {
    setPlans(getPlans())
    setItems(getTechnicalItems())
  }

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const q = searchPlan.toLowerCase().trim()
      return (
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.taskName.toLowerCase().includes(q) ||
        p.managingUnit.toLowerCase().includes(q) ||
        p.chiefEngineer.toLowerCase().includes(q)
      )
    })
  }, [plans, searchPlan])

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const q = searchItem.toLowerCase().trim()
      return (
        !q ||
        i.code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.method.toLowerCase().includes(q) ||
        i.targetLocation.toLowerCase().includes(q)
      )
    })
  }, [items, searchItem])

  // Submit Plan (TEC-01)
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault()
    savePlan({
      id: `plan-${Date.now()}`,
      code: planCode,
      taskName: planTaskName,
      managingUnit: planUnit,
      chiefEngineer: planChief,
      technicalLead: planLead,
      startDate: planStart,
      endDate: planEnd,
      status: "pending_approval",
      totalEstimatedCost: Number(planCost) || 0,
      notes: planNotes,
    })
    setIsPlanModalOpen(false)
    reloadData()
  }

  // Submit Item (TEC-02, TEC-03)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault()
    saveTechnicalItem({
      id: `item-${Date.now()}`,
      planId: selectedPlanId,
      code: itemCode,
      name: itemName,
      method: itemMethod,
      unit: itemUnit,
      normRate: Number(itemNormRate) || 1,
      unitPrice: Number(itemUnitPrice) || 0,
      plannedVolume: Number(itemPlannedVol) || 0,
      completedVolume: 0,
      internalAcceptedVolume: 0,
      institutionalAcceptedVolume: 0,
      targetLocation: itemLocation,
      coordinates: {
        system: "VN-2000",
        lineName: itemLineName,
        startPoint: itemStartPt,
        endPoint: itemEndPt,
        province: itemProvince,
      },
    })
    setIsItemModalOpen(false)
    reloadData()
  }

  // Duyệt kế hoạch (TEC-01)
  const handleApprovePlan = (plan: ConstructionPlan) => {
    savePlan({
      ...plan,
      status: "approved",
      approvedBy: "Lãnh đạo Liên đoàn Địa vật lý",
      approvedDate: new Date().toISOString().slice(0, 10),
    })
    reloadData()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Kế hoạch thi công & Hạng mục kỹ thuật (TEC-01, TEC-02, TEC-03)
            </h1>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              Kế hoạch & Định mức
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Lập kế hoạch thi công trình phê duyệt, quản lý định mức đơn giá hạng mục kỹ thuật và vị trí tọa độ VN-2000 hiện trường.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reloadData} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          {activeTab === "plans" ? (
            <Button
              size="sm"
              onClick={() => setIsPlanModalOpen(true)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Lập kế hoạch thi công mới
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsItemModalOpen(true)}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Thêm hạng mục kỹ thuật
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tổng kế hoạch thi công</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{plans.length} đề án</div>
            <p className="text-xs text-muted-foreground mt-1">
              {plans.filter((p) => p.status === "approved" || p.status === "in_progress").length} kế hoạch đang triển khai
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Hạng mục kỹ thuật</CardTitle>
            <Layers className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 tabular-nums">{items.length} hạng mục</div>
            <p className="text-xs text-indigo-600/80 mt-1">Có định mức và tọa độ tuyến</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Tổng giá trị dự toán</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              {(plans.reduce((s, p) => s + p.totalEstimatedCost, 0) / 1000000000).toFixed(1)} tỷ đ
            </div>
            <p className="text-xs text-emerald-600/80 mt-1">Ngân sách kỹ thuật đã phê duyệt</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Kế hoạch chờ duyệt</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 tabular-nums">
              {plans.filter((p) => p.status === "pending_approval").length}
            </div>
            <p className="text-xs text-amber-600/80 mt-1">Cần Lãnh đạo Liên đoàn duyệt (TEC-01)</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border">
          <TabsTrigger value="plans" className="gap-2">
            <Calendar className="h-4 w-4" />
            Kế hoạch thi công & Phê duyệt (TEC-01)
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-2">
            <Layers className="h-4 w-4" />
            Hạng mục, Định mức & Tọa độ VN-2000 (TEC-02, TEC-03)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: KẾ HOẠCH THI CÔNG */}
        <TabsContent value="plans" className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm mã kế hoạch, tên nhiệm vụ, đơn vị thi công, chủ nhiệm đề án..."
                  value={searchPlan}
                  onChange={(e) => setSearchPlan(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs font-semibold text-slate-700">STT</TableHead>
                    <TableHead className="w-32 text-xs font-semibold text-slate-700">Mã kế hoạch</TableHead>
                    <TableHead className="min-w-[240px] text-xs font-semibold text-slate-700">Tên nhiệm vụ / Đề án</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Đơn vị thi công</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Chủ nhiệm đề án</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Thời gian thực hiện</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-700">Dự toán kỹ thuật (VNĐ)</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Trạng thái</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-700 w-36">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan, index) => (
                    <TableRow key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-center text-xs text-slate-500 tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-blue-700">
                        {plan.code}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium text-slate-900">{plan.taskName}</div>
                        {plan.notes && <div className="text-[11px] text-muted-foreground">{plan.notes}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">{plan.managingUnit}</TableCell>
                      <TableCell className="text-xs text-slate-700">
                        <div>{plan.chiefEngineer}</div>
                        <div className="text-[10px] text-muted-foreground">{plan.technicalLead}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 tabular-nums">
                        <div>{plan.startDate}</div>
                        <div className="text-muted-foreground">đến {plan.endDate}</div>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-medium text-slate-900 tabular-nums">
                        {plan.totalEstimatedCost.toLocaleString("vi-VN")} đ
                      </TableCell>
                      <TableCell>
                        {plan.status === "approved" ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal text-[11px]">
                            Đã phê duyệt
                          </Badge>
                        ) : plan.status === "in_progress" ? (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-normal text-[11px]">
                            Đang thi công
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-normal text-[11px]">
                            Chờ phê duyệt
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {plan.status === "pending_approval" ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleApprovePlan(plan)}
                          >
                            Phê duyệt
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Đã duyệt</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: HẠNG MỤC KỸ THUẬT & TỌA ĐỘ VN-2000 */}
        <TabsContent value="items" className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm mã hạng mục, phương pháp địa vật lý, khu vực thi công..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs font-semibold text-slate-700">STT</TableHead>
                    <TableHead className="w-28 text-xs font-semibold text-slate-700">Mã HM</TableHead>
                    <TableHead className="min-w-[220px] text-xs font-semibold text-slate-700">Hạng mục công việc</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Phương pháp kỹ thuật</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Định mức / Đơn giá</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Khối lượng (Kế hoạch / Thực hiện)</TableHead>
                    <TableHead className="min-w-[200px] text-xs font-semibold text-slate-700">Khu vực & Tọa độ VN-2000 (TEC-03)</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-700">Tiến độ (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => {
                    const progressPercent =
                      item.plannedVolume > 0
                        ? Math.min(100, Math.round((item.completedVolume / item.plannedVolume) * 100))
                        : 0

                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="text-center text-xs text-slate-500 tabular-nums">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-indigo-700">
                          {item.code}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-medium text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-muted-foreground">Đơn vị: {item.unit}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-700">{item.method}</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 tabular-nums">
                          <div>Định mức: <strong>{item.normRate} {item.unit}/ngày</strong></div>
                          <div className="text-muted-foreground font-mono">{item.unitPrice.toLocaleString("vi-VN")} đ/{item.unit}</div>
                        </TableCell>
                        <TableCell className="text-xs tabular-nums">
                          <div>Kế hoạch: <strong>{item.plannedVolume}</strong> {item.unit}</div>
                          <div className="text-blue-700 font-semibold">Đã thi công: {item.completedVolume} {item.unit}</div>
                          <div className="text-emerald-700 text-[11px]">Đã NT cơ sở: {item.institutionalAcceptedVolume} {item.unit}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-900 font-medium flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                            <span>{item.targetLocation}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {item.coordinates.lineName} | Đầu: {item.coordinates.startPoint} - Cuối: {item.coordinates.endPoint}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-bold text-xs tabular-nums text-blue-700">{progressPercent}%</div>
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 ml-auto overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL 1: Lập kế hoạch thi công mới (TEC-01) */}
      <Dialog open={isPlanModalOpen} onOpenChange={(isOpen) => { if (!isOpen) setIsPlanModalOpen(false) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Lập kế hoạch thi công nhiệm vụ / đề án (TEC-01)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Mã kế hoạch *</Label>
                <Input
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value)}
                  className="mt-1 font-mono uppercase"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Đơn vị thi công *</Label>
                <Select value={planUnit} onValueChange={setPlanUnit}>
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
            </div>

            <div>
              <Label className="text-xs font-semibold">Tên nhiệm vụ / Đề án triển khai *</Label>
              <Input
                value={planTaskName}
                onChange={(e) => setPlanTaskName(e.target.value)}
                placeholder="VD: Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Chủ nhiệm đề án *</Label>
                <Input
                  value={planChief}
                  onChange={(e) => setPlanChief(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Cán bộ phụ trách kỹ thuật</Label>
                <Input
                  value={planLead}
                  onChange={(e) => setPlanLead(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Ngày bắt đầu *</Label>
                <Input
                  type="date"
                  value={planStart}
                  onChange={(e) => setPlanStart(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Ngày kết thúc *</Label>
                <Input
                  type="date"
                  value={planEnd}
                  onChange={(e) => setPlanEnd(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Tổng dự toán kỹ thuật (VNĐ)</Label>
              <Input
                type="number"
                value={planCost}
                onChange={(e) => setPlanCost(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Ghi chú & Thuyết minh kế hoạch</Label>
              <Textarea
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                placeholder="Căn cứ đề cương đã được phê duyệt, phương án bố trí lán trại dã ngoại..."
                rows={2}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPlanModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Trình duyệt kế hoạch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Thêm hạng mục kỹ thuật mới (TEC-02, TEC-03) */}
      <Dialog open={isItemModalOpen} onOpenChange={(isOpen) => { if (!isOpen) setIsItemModalOpen(false) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Thêm hạng mục kỹ thuật & Tọa độ thi công (TEC-02, TEC-03)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-4 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold">Gắn vào Kế hoạch thi công *</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      [{p.code}] {p.taskName} ({p.managingUnit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Mã hạng mục *</Label>
                <Input
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  className="mt-1 font-mono uppercase"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Phương pháp địa vật lý *</Label>
                <Select value={itemMethod} onValueChange={(v: MethodGeophysical) => setItemMethod(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_LIST.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Tên hạng mục kỹ thuật *</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="VD: Đo địa chấn phản xạ nông phân giải cao 24 kênh"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold">Đơn vị tính *</Label>
                <Input
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  placeholder="km tuyến / điểm đo / mét sâu"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Định mức/ngày * (TEC-02)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={itemNormRate}
                  onChange={(e) => setItemNormRate(e.target.value)}
                  className="mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Khối lượng kế hoạch *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={itemPlannedVol}
                  onChange={(e) => setItemPlannedVol(e.target.value)}
                  className="mt-1 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Đơn giá định mức (VNĐ/đơn vị)</Label>
              <Input
                type="number"
                value={itemUnitPrice}
                onChange={(e) => setItemUnitPrice(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>

            {/* PHẦN TỌA ĐỘ VÀ KHU VỰC THI CÔNG (TEC-03) */}
            <div className="p-3 bg-slate-50 border rounded-lg space-y-3">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-blue-600" />
                Quản lý khu vực & Tọa độ thi công VN-2000 (TEC-03)
              </div>

              <div>
                <Label className="text-xs font-semibold">Khu vực / Địa bàn thi công *</Label>
                <Input
                  value={itemLocation}
                  onChange={(e) => setItemLocation(e.target.value)}
                  placeholder="Xã/huyện, tên khu mỏ hoặc vùng khảo sát..."
                  className="mt-1 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Số hiệu tuyến đo / Lưới trắc địa</Label>
                  <Input
                    value={itemLineName}
                    onChange={(e) => setItemLineName(e.target.value)}
                    placeholder="VD: Tuyến DC-01 đến DC-04"
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Tỉnh / Thành phố</Label>
                  <Input
                    value={itemProvince}
                    onChange={(e) => setItemProvince(e.target.value)}
                    className="mt-1 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Tọa độ điểm đầu tuyến (VN-2000)</Label>
                  <Input
                    value={itemStartPt}
                    onChange={(e) => setItemStartPt(e.target.value)}
                    placeholder="X=2462000, Y=568000"
                    className="mt-1 font-mono bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Tọa độ điểm cuối tuyến (VN-2000)</Label>
                  <Input
                    value={itemEndPt}
                    onChange={(e) => setItemEndPt(e.target.value)}
                    placeholder="X=2465000, Y=571000"
                    className="mt-1 font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Lưu hạng mục kỹ thuật
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
