import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Lock, AlertTriangle } from "lucide-react"
import { ProjectSale } from "@/types/projectSale"
import { useLocale } from "@/i18n/LocaleContext"

interface ProjectSaleFormProps {
  project?: ProjectSale
  mode: "view" | "create" | "edit" | "copy"
  onSave: (data: Omit<ProjectSale, "id"> | ProjectSale) => void
  onCancel: () => void
}

const STEP_KEYS = ["info", "pricing", "shipping", "taxes", "status"] as const
type StepKey = (typeof STEP_KEYS)[number]

const STEP_TITLE_KEYS: Record<StepKey, string> = {
  info: "projects.saleStepInfo",
  pricing: "projects.saleStepPricing",
  shipping: "projects.saleStepShipping",
  taxes: "projects.saleStepTaxes",
  status: "projects.saleStepStatus",
}

export function ProjectSaleForm({
  project,
  mode,
  onSave,
  onCancel,
}: ProjectSaleFormProps) {
  const { t } = useLocale()
  const isAlreadyPaidFreight = project?.freightPaymentStatus === "Đã thu cước" && (mode === "edit" || mode === "view")
  const isView = mode === "view" || isAlreadyPaidFreight
  const [activeTab, setActiveTab] = useState<StepKey>("info")

  const stepTitle = (key: StepKey) => t(STEP_TITLE_KEYS[key])

  const currentStepIndex = STEP_KEYS.indexOf(activeTab)

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setActiveTab(STEP_KEYS[currentStepIndex - 1])
    }
  }

  const handleNextStep = () => {
    if (currentStepIndex < STEP_KEYS.length - 1) {
      setActiveTab(STEP_KEYS[currentStepIndex + 1])
    }
  }

  const [formData, setFormData] = useState<Partial<ProjectSale>>({
    customerCode: "",
    customerName: "",
    phone: "",
    orderCode: "",
    batchCode: "",
    serviceType: "Vận chuyển chính ngạch",
    productName: "",
    category: "",
    unitPriceRmb: 0,
    quantity: 1,
    domesticShippingRmb: 0,
    costExchangeRate: 3500,
    sellingExchangeRate: 3600,
    totalGoodsCostVnd: 0,
    totalGoodsSellingVnd: 0,
    purchasingFeeVnd: 0,
    weightKg: 0,
    volumeCbm: 0,
    costFreightRateKg: 0,
    costFreightRateM3: 0,
    floorFreightRateM3: 0,
    sellingFreightRateKg: 0,
    sellingFreightRateM3: 0,
    costShippingFeeKg: 0,
    costShippingFeeM3: 0,
    floorShippingFeeKg: 0,
    floorShippingFeeM3: 0,
    sellingShippingFeeKg: 0,
    sellingShippingFeeM3: 0,
    costVesselFreightRateKg: 0,
    costVesselFreightRateM3: 0,
    sellingVesselFreightRateKg: 0,
    sellingVesselFreightRateM3: 0,
    costVesselShippingFeeKg: 0,
    costVesselShippingFeeM3: 0,
    sellingVesselShippingFeeKg: 0,
    sellingVesselShippingFeeM3: 0,
    importTaxRate: 0,
    importTaxAmountVnd: 0,
    entrustedImportFeeVnd: 0,
    customsDeclarationFeeVnd: 0,
    otherFeesVnd: 0,
    otherProfitVnd: 0,
    vatRate: 10,
    vatAmountVnd: 0,
    totalPaymentAmountVnd: 0,
    grossCompanyProfitVnd: 0,
    netSalesProfitVnd: 0,
    orderStatus: "Đã thanh toán",
    shipmentStatus: "Nhập kho TQ",
    freightPaymentStatus: "Chưa cước",
    documentStatus: "Chưa bàn giao",
    notes: "",
    shippingProvince: "",
    shippingWard: "",
    shippingDetailAddress: "",
  })

  useEffect(() => {
    if (project) {
      setFormData({
        ...project,
        customerCode: mode === "copy" ? generateCustomerCode(project.phone || "") : project.customerCode,
        shippingProvince: project.shippingProvince || "",
        shippingWard: project.shippingWard || "",
        shippingDetailAddress: project.shippingDetailAddress || (project.shippingAddress || ""),
      })
    }
  }, [project, mode])

  const handleAddressChange = (
    field: "shippingProvince" | "shippingWard" | "shippingDetailAddress",
    val: string
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: val }
      const parts = [updated.shippingDetailAddress, updated.shippingWard, updated.shippingProvince].filter(Boolean)
      return {
        ...updated,
        shippingAddress: parts.join(", "),
      }
    })
  }

  // Generator: FOB + 4 số cuối sđt, nếu trùng / ko có sđt thì random
  function generateCustomerCode(phone: string) {
    const cleanPhone = phone.replace(/\D/g, "")
    const last4 = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : Math.floor(1000 + Math.random() * 9000).toString()
    return `FOB${last4}`
  }

  const handlePhoneChange = (phoneVal: string) => {
    const updatedCode = generateCustomerCode(phoneVal)
    setFormData((prev) => ({
      ...prev,
      phone: phoneVal,
      customerCode: updatedCode,
    }))
  }

  // Tự động tính toán các trường công thức
  useEffect(() => {
    const unitPrice = formData.unitPriceRmb || 0
    const qty = formData.quantity || 0
    const domShip = formData.domesticShippingRmb || 0
    const costRate = formData.costExchangeRate || 0
    const sellRate = formData.sellingExchangeRate || 0

    const totalCostVnd = (unitPrice * qty + domShip) * costRate
    const totalSellVnd = (unitPrice * qty + domShip) * sellRate
    const purchasingFee = totalSellVnd * 0.01

    const weight = formData.weightKg || 0
    const volume = formData.volumeCbm || 0

    const costShippingFeeKg = weight * (formData.costFreightRateKg || 0)
    const costShippingFeeM3 = volume * (formData.costFreightRateM3 || 0)
    const floorShippingFeeKg = weight * (formData.floorFreightRateKg || 0)
    const floorShippingFeeM3 = volume * (formData.floorFreightRateM3 || 0)
    const sellShippingFeeKg = weight * (formData.sellingFreightRateKg || 0)
    const sellShippingFeeM3 = volume * (formData.sellingFreightRateM3 || 0)

    const costVesselShippingFeeKg = weight * (formData.costVesselFreightRateKg || 0)
    const costVesselShippingFeeM3 = volume * (formData.costVesselFreightRateM3 || 0)
    const sellingVesselShippingFeeKg = weight * (formData.sellingVesselFreightRateKg || 0)
    const sellingVesselShippingFeeM3 = volume * (formData.sellingVesselFreightRateM3 || 0)

    const activeShippingFee = sellShippingFeeKg || sellShippingFeeM3 || 0
    const activeVesselFee = sellingVesselShippingFeeKg || sellingVesselShippingFeeM3 || 0
    const taxableBase = totalSellVnd + purchasingFee + activeShippingFee + activeVesselFee

    const importTax = taxableBase * ((formData.importTaxRate || 0) / 100)
    const entrustedFee = taxableBase * 0.02
    const vat = (taxableBase + entrustedFee + importTax) * ((formData.vatRate || 0) / 100)

    const totalPay = totalSellVnd + purchasingFee + activeShippingFee + activeVesselFee + importTax + entrustedFee + (formData.customsDeclarationFeeVnd || 0) + (formData.otherFeesVnd || 0) + vat

    const grossProfitGoods = totalSellVnd - totalCostVnd
    const grossProfitShipping = (sellShippingFeeKg || sellShippingFeeM3 || 0) - (costShippingFeeKg || costShippingFeeM3 || 0)
    const grossProfitVessel = (sellingVesselShippingFeeKg || sellingVesselShippingFeeM3 || 0) - (costVesselShippingFeeKg || costVesselShippingFeeM3 || 0)
    const grossCompanyProfit = grossProfitGoods + purchasingFee + grossProfitShipping + grossProfitVessel + entrustedFee + (formData.otherProfitVnd || 0)

    const netProfitShipping = (sellShippingFeeKg || sellShippingFeeM3 || 0) - (floorShippingFeeKg || floorShippingFeeM3 || 0)
    const netSalesProfit = purchasingFee + netProfitShipping + grossProfitVessel + entrustedFee + (formData.otherProfitVnd || 0)

    setFormData((prev) => ({
      ...prev,
      totalGoodsCostVnd: totalCostVnd,
      totalGoodsSellingVnd: totalSellVnd,
      purchasingFeeVnd: purchasingFee,
      costShippingFeeKg: costShippingFeeKg,
      costShippingFeeM3: costShippingFeeM3,
      floorShippingFeeKg: floorShippingFeeKg,
      floorShippingFeeM3: floorShippingFeeM3,
      sellingShippingFeeKg: sellShippingFeeKg,
      sellingShippingFeeM3: sellShippingFeeM3,
      costVesselShippingFeeKg: costVesselShippingFeeKg,
      costVesselShippingFeeM3: costVesselShippingFeeM3,
      sellingVesselShippingFeeKg: sellingVesselShippingFeeKg,
      sellingVesselShippingFeeM3: sellingVesselShippingFeeM3,
      importTaxAmountVnd: importTax,
      entrustedImportFeeVnd: entrustedFee,
      vatAmountVnd: vat,
      totalPaymentAmountVnd: totalPay,
      grossCompanyProfitVnd: grossCompanyProfit,
      netSalesProfitVnd: netSalesProfit,
    }))
  }, [
    formData.unitPriceRmb,
    formData.quantity,
    formData.domesticShippingRmb,
    formData.costExchangeRate,
    formData.sellingExchangeRate,
    formData.weightKg,
    formData.volumeCbm,
    formData.costFreightRateKg,
    formData.costFreightRateM3,
    formData.floorFreightRateKg,
    formData.floorFreightRateM3,
    formData.sellingFreightRateKg,
    formData.sellingFreightRateM3,
    formData.costVesselFreightRateKg,
    formData.costVesselFreightRateM3,
    formData.sellingVesselFreightRateKg,
    formData.sellingVesselFreightRateM3,
    formData.importTaxRate,
    formData.vatRate,
    formData.customsDeclarationFeeVnd,
    formData.otherFeesVnd,
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "create" || mode === "copy") {
      const { id, ...dataToSave } = formData as ProjectSale
      onSave(dataToSave as Omit<ProjectSale, "id">)
    } else {
      onSave(formData as ProjectSale)
    }
  }

  const renderTabInfo = () => (
    <div className="space-y-4">
      {/* Hàng 1: Mã KH, SĐT, Tên KH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("common.customerCode")}</Label>
          <Input
            readOnly={isView}
            value={formData.customerCode || ""}
            onChange={(e) => setFormData((p) => ({ ...p, customerCode: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fPhone")}</Label>
          <Input
            readOnly={isView}
            value={formData.phone || ""}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fCustomerName")}</Label>
          <Input
            readOnly={isView}
            value={formData.customerName || ""}
            onChange={(e) => setFormData((p) => ({ ...p, customerName: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      {/* Hàng 2: Phân loại KH, Loại KH, Email */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fCustomerClass")}</Label>
          <Input
            readOnly={isView}
            value={formData.customerClassification || ""}
            onChange={(e) => setFormData((p) => ({ ...p, customerClassification: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.customerType")}</Label>
          <select
            disabled={isView}
            value={formData.customerType || ""}
            onChange={(e) => setFormData((p) => ({ ...p, customerType: e.target.value }))}
            className="w-full mt-1 border border-border rounded-md p-2 text-sm bg-card disabled:bg-muted disabled:text-foreground disabled:font-semibold disabled:opacity-100 disabled:cursor-default"
          >
            <option value="">{t("projects.fSelectType")}</option>
            <option value="Khách hàng mới">{t("projects.fCustomerNew")}</option>
            <option value="Khách hàng cũ">{t("projects.fCustomerOld")}</option>
          </select>
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("common.email")}</Label>
          <Input
            readOnly={isView}
            value={formData.email || ""}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      {/* Hàng 3: CS phụ trách, Ngành hàng, Dịch vụ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fCsStaff")}</Label>
          <Input
            readOnly={isView}
            value={formData.csStaff || ""}
            onChange={(e) => setFormData((p) => ({ ...p, csStaff: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("common.category")}</Label>
          <Input
            readOnly={isView}
            value={formData.category || ""}
            onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("common.service")}</Label>
          <Input
            readOnly={isView}
            value={formData.serviceType || ""}
            onChange={(e) => setFormData((p) => ({ ...p, serviceType: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      {/* Hàng 4: Mã đặt hàng, Mã lô hàng, Tên hàng */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("common.orderCode")}</Label>
          <Input
            readOnly={isView}
            value={formData.orderCode || ""}
            onChange={(e) => setFormData((p) => ({ ...p, orderCode: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("common.batchCode")}</Label>
          <Input
            readOnly={isView}
            value={formData.batchCode || ""}
            onChange={(e) => setFormData((p) => ({ ...p, batchCode: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("common.productName")}</Label>
          <Input
            readOnly={isView}
            value={formData.productName || ""}
            onChange={(e) => setFormData((p) => ({ ...p, productName: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      {/* Hàng 5: Thông tin xuất hóa đơn & Giá cước ghi chú */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fInvoiceInfo")}</Label>
          <Input
            readOnly={isView}
            value={formData.invoiceInfo || ""}
            onChange={(e) => setFormData((p) => ({ ...p, invoiceInfo: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fFreightNote")}</Label>
          <Input
            readOnly={isView}
            value={formData.freightNote || ""}
            onChange={(e) => setFormData((p) => ({ ...p, freightNote: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      {/* Hàng 6: Địa chỉ nhận hàng */}
      <div className="space-y-3 pt-1">
        <Label className="text-xs font-semibold text-foreground block">
          {t("projects.fShippingAddress")}
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-foreground">
              {t("projects.fProvince")} <span className="text-destructive">*</span>
            </Label>
            <Input
              readOnly={isView}
              value={formData.shippingProvince || ""}
              onChange={(e) => handleAddressChange("shippingProvince", e.target.value)}
              className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">
              {t("projects.fWard")} <span className="text-destructive">*</span>
            </Label>
            <Input
              readOnly={isView}
              value={formData.shippingWard || ""}
              onChange={(e) => handleAddressChange("shippingWard", e.target.value)}
              className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fDetailAddress")}</Label>
          <Input
            readOnly={isView}
            value={formData.shippingDetailAddress || ""}
            onChange={(e) => handleAddressChange("shippingDetailAddress", e.target.value)}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      {/* Hàng 7: Mô tả KH */}
      <div>
        <Label className="text-xs font-semibold text-foreground">{t("projects.fCustomerDesc")}</Label>
        <Textarea
          readOnly={isView}
          rows={2}
          value={formData.customerDescription || ""}
          onChange={(e) => setFormData((p) => ({ ...p, customerDescription: e.target.value }))}
          className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
        />
      </div>
    </div>
  )

  const renderTabPricing = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.unitPriceRmb")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.unitPriceRmb || 0}
            onChange={(e) => setFormData((p) => ({ ...p, unitPriceRmb: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("common.quantity")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.quantity || 0}
            onChange={(e) => setFormData((p) => ({ ...p, quantity: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fDomesticShipping")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.domesticShippingRmb || 0}
            onChange={(e) => setFormData((p) => ({ ...p, domesticShippingRmb: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.costExchangeRate")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.costExchangeRate || 0}
            onChange={(e) => setFormData((p) => ({ ...p, costExchangeRate: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.sellingExchangeRate")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.sellingExchangeRate || 0}
            onChange={(e) => setFormData((p) => ({ ...p, sellingExchangeRate: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>{t("projects.fTotalCostGoods")}</span>
            <span className="text-[10px] text-amber-600 font-normal">{t("projects.fHiddenFromSales")}</span>
          </Label>
          <Input
            disabled
            value={(formData.totalGoodsCostVnd || 0).toLocaleString("vi-VN")}
            className="mt-1 bg-muted font-semibold disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>{t("projects.fTotalSellGoods")}</span>
          </Label>
          <Input
            disabled
            value={(formData.totalGoodsSellingVnd || 0).toLocaleString("vi-VN")}
            className="mt-1 bg-muted font-semibold text-blue-700 disabled:opacity-100 disabled:text-blue-700 disabled:bg-muted"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>{t("projects.fPurchasingFee")}</span>
          </Label>
          <Input
            disabled
            value={(formData.purchasingFeeVnd || 0).toLocaleString("vi-VN")}
            className="mt-1 bg-muted font-semibold text-foreground disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
          />
        </div>
      </div>
    </div>
  )

  const renderTabShipping = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.weightKg")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.weightKg || 0}
            onChange={(e) => setFormData((p) => ({ ...p, weightKg: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fVolumeCbm")}</Label>
          <Input
            type="number"
            step="0.01"
            readOnly={isView}
            value={formData.volumeCbm || 0}
            onChange={(e) => setFormData((p) => ({ ...p, volumeCbm: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fCostRateKg")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.costFreightRateKg || 0}
            onChange={(e) => setFormData((p) => ({ ...p, costFreightRateKg: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fCostRateM3")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.costFreightRateM3 || 0}
            onChange={(e) => setFormData((p) => ({ ...p, costFreightRateM3: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fFloorRateKg")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.floorFreightRateKg || 0}
            onChange={(e) => setFormData((p) => ({ ...p, floorFreightRateKg: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fFloorRateM3")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.floorFreightRateM3 || 0}
            onChange={(e) => setFormData((p) => ({ ...p, floorFreightRateM3: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fSellRateKg")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.sellingFreightRateKg || 0}
            onChange={(e) => setFormData((p) => ({ ...p, sellingFreightRateKg: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fSellRateM3")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.sellingFreightRateM3 || 0}
            onChange={(e) => setFormData((p) => ({ ...p, sellingFreightRateM3: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      {/* Cước phí vận chuyển tính tự động */}
      <div className="border-t pt-3 space-y-3">
        <h4 className="text-xs font-semibold text-foreground">{t("projects.fAutoShipping")}</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>{t("projects.fShipCostKg")}</span>
              <span className="text-[10px] text-amber-600 font-normal">{t("projects.fHiddenFromSales")}</span>
            </Label>
            <Input
              disabled
              value={(formData.costShippingFeeKg || 0).toLocaleString("vi-VN")}
              className="mt-1 bg-muted font-semibold disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>{t("projects.fShipCostM3")}</span>
              <span className="text-[10px] text-amber-600 font-normal">{t("projects.fHiddenFromSales")}</span>
            </Label>
            <Input
              disabled
              value={(formData.costShippingFeeM3 || 0).toLocaleString("vi-VN")}
              className="mt-1 bg-muted font-semibold disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">{t("projects.fShipFloorKg")}</Label>
            <Input
              disabled
              value={(formData.floorShippingFeeKg || 0).toLocaleString("vi-VN")}
              className="mt-1 bg-muted font-semibold disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">{t("projects.fShipFloorM3")}</Label>
            <Input
              disabled
              value={(formData.floorShippingFeeM3 || 0).toLocaleString("vi-VN")}
              className="mt-1 bg-muted font-semibold disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">{t("projects.fShipSellKg")}</Label>
            <Input
              disabled
              value={(formData.sellingShippingFeeKg || 0).toLocaleString("vi-VN")}
              className="mt-1 bg-muted font-semibold text-blue-700 disabled:opacity-100 disabled:text-blue-700 disabled:bg-muted"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">{t("projects.fShipSellM3")}</Label>
            <Input
              disabled
              value={(formData.sellingShippingFeeM3 || 0).toLocaleString("vi-VN")}
              className="mt-1 bg-muted font-semibold text-blue-700 disabled:opacity-100 disabled:text-blue-700 disabled:bg-muted"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabTaxes = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>{t("projects.fVesselCostKg")}</span>
            <span className="text-[10px] text-amber-600 font-normal">{t("projects.fHiddenFromSales")}</span>
          </Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.costVesselFreightRateKg || 0}
            onChange={(e) => setFormData((p) => ({ ...p, costVesselFreightRateKg: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>{t("projects.fVesselCostM3")}</span>
            <span className="text-[10px] text-amber-600 font-normal">{t("projects.fHiddenFromSales")}</span>
          </Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.costVesselFreightRateM3 || 0}
            onChange={(e) => setFormData((p) => ({ ...p, costVesselFreightRateM3: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fVesselSellKg")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.sellingVesselFreightRateKg || 0}
            onChange={(e) => setFormData((p) => ({ ...p, sellingVesselFreightRateKg: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fVesselSellM3")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.sellingVesselFreightRateM3 || 0}
            onChange={(e) => setFormData((p) => ({ ...p, sellingVesselFreightRateM3: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      {/* Cước tàu tính tự động */}
      <div className="border-t pt-3 space-y-3">
        <h4 className="text-xs font-semibold text-foreground">{t("projects.fAutoVessel")}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>{t("projects.fVesselFeeCostKg")}</span>
              <span className="text-[10px] text-amber-600 font-normal">{t("projects.fHiddenFromSales")}</span>
            </Label>
            <Input
              disabled
              value={(formData.costVesselShippingFeeKg || 0).toLocaleString("vi-VN")}
              className="mt-1 bg-muted font-semibold disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>{t("projects.fVesselFeeCostM3")}</span>
              <span className="text-[10px] text-amber-600 font-normal">{t("projects.fHiddenFromSales")}</span>
            </Label>
            <Input
              disabled
              value={(formData.costVesselShippingFeeM3 || 0).toLocaleString("vi-VN")}
              className="mt-1 bg-muted font-semibold disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">{t("projects.fVesselFeeSellKg")}</Label>
            <Input
              disabled
              value={(formData.sellingVesselShippingFeeKg || 0).toLocaleString("vi-VN")}
              className="mt-1 bg-muted font-semibold text-blue-700 disabled:opacity-100 disabled:text-blue-700 disabled:bg-muted"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">{t("projects.fVesselFeeSellM3")}</Label>
            <Input
              disabled
              value={(formData.sellingVesselShippingFeeM3 || 0).toLocaleString("vi-VN")}
              className="mt-1 bg-muted font-semibold text-blue-700 disabled:opacity-100 disabled:text-blue-700 disabled:bg-muted"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-3">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fImportTaxPct")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.importTaxRate || 0}
            onChange={(e) => setFormData((p) => ({ ...p, importTaxRate: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>{t("projects.fEntrustedFee")}</span>
          </Label>
          <Input
            disabled
            value={(formData.entrustedImportFeeVnd || 0).toLocaleString("vi-VN")}
            className="mt-1 bg-muted font-semibold disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fCustomsFee")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.customsDeclarationFeeVnd || 0}
            onChange={(e) => setFormData((p) => ({ ...p, customsDeclarationFeeVnd: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fOtherFees")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.otherFeesVnd || 0}
            onChange={(e) => setFormData((p) => ({ ...p, otherFeesVnd: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fOtherProfit")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.otherProfitVnd || 0}
            onChange={(e) => setFormData((p) => ({ ...p, otherProfitVnd: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground">{t("projects.fVatPct")}</Label>
          <Input
            type="number"
            readOnly={isView}
            value={formData.vatRate || 0}
            onChange={(e) => setFormData((p) => ({ ...p, vatRate: Number(e.target.value) }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-3">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>{t("projects.fImportTaxAmt")}</span>
          </Label>
          <Input
            disabled
            value={(formData.importTaxAmountVnd || 0).toLocaleString("vi-VN")}
            className="mt-1 bg-muted font-semibold disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>{t("projects.fVatAmt")}</span>
          </Label>
          <Input
            disabled
            value={(formData.vatAmountVnd || 0).toLocaleString("vi-VN")}
            className="mt-1 bg-muted font-semibold disabled:opacity-100 disabled:text-foreground disabled:bg-muted"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>{t("projects.fTotalPayment")}</span>
          </Label>
          <Input
            disabled
            value={(formData.totalPaymentAmountVnd || 0).toLocaleString("vi-VN")}
            className="mt-1 bg-muted font-bold text-destructive disabled:opacity-100 disabled:text-destructive disabled:bg-muted"
          />
        </div>
      </div>
    </div>
  )

  const renderTabStatus = () => (
    <div className="space-y-6">
      {/* 1. Lợi nhuận gộp Gross & Net */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>{t("projects.fGrossProfit")}</span>
            <span className="text-[10px] text-amber-600 font-normal">{t("projects.fHiddenFromSales")}</span>
          </Label>
          <Input
            disabled
            value={(formData.grossCompanyProfitVnd || 0).toLocaleString("vi-VN")}
            className="mt-1 bg-muted font-bold text-emerald-700 disabled:opacity-100 disabled:text-emerald-700 disabled:bg-muted"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>{t("projects.fNetProfit")}</span>
          </Label>
          <Input
            disabled
            value={(formData.netSalesProfitVnd || 0).toLocaleString("vi-VN")}
            className="mt-1 bg-muted font-bold text-blue-700 disabled:opacity-100 disabled:text-blue-700 disabled:bg-muted"
          />
        </div>
      </div>

      {/* 4. Theo dõi trạng thái & Ghi chú */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("projects.fStatusSection")}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-foreground">{t("projects.orderTracking")}</Label>
            <select
              disabled={isView}
              value={formData.orderStatus || "Đã thanh toán"}
              onChange={(e) => setFormData((p) => ({ ...p, orderStatus: e.target.value as any }))}
              className="w-full mt-1 border border-border rounded-md p-2 text-sm bg-card disabled:bg-muted disabled:text-foreground disabled:font-semibold disabled:opacity-100 disabled:cursor-default"
            >
              <option value="Đã thanh toán">{t("projects.fOptPaid")}</option>
              <option value="Đã sản xuất">{t("projects.fOptProduced")}</option>
              <option value="Đã phát">{t("projects.fOptShipped")}</option>
            </select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">{t("projects.shipmentTracking")}</Label>
            <select
              disabled={isView}
              value={formData.shipmentStatus || "Nhập kho TQ"}
              onChange={(e) => setFormData((p) => ({ ...p, shipmentStatus: e.target.value as any }))}
              className="w-full mt-1 border border-border rounded-md p-2 text-sm bg-card disabled:bg-muted disabled:text-foreground disabled:font-semibold disabled:opacity-100 disabled:cursor-default"
            >
              <option value="Nhập kho TQ">{t("projects.fOptWhCn")}</option>
              <option value="Xếp xe">{t("projects.fOptLoad")}</option>
              <option value="Đã thông quan">{t("projects.fOptCleared")}</option>
              <option value="Đã giao">{t("projects.fOptDelivered")}</option>
              <option value="Kiểm hoá">{t("projects.fOptInspect")}</option>
              <option value="Khác">{t("projects.fOptOther")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-foreground">{t("projects.freightCollection")}</Label>
            <select
              disabled={isView}
              value={formData.freightPaymentStatus || "Chưa cước"}
              onChange={(e) => setFormData((p) => ({ ...p, freightPaymentStatus: e.target.value as any }))}
              className="w-full mt-1 border border-border rounded-md p-2 text-sm bg-card disabled:bg-muted disabled:text-foreground disabled:font-semibold disabled:opacity-100 disabled:cursor-default"
            >
              <option value="Đã thu cước">{t("projects.fOptFreightDone")}</option>
              <option value="Chưa cước">{t("projects.fOptFreightPending")}</option>
              <option value="Khác">{t("projects.fOptOther")}</option>
            </select>
            {formData.freightPaymentStatus === "Đã thu cước" && !isAlreadyPaidFreight && (
              <p className="text-[11px] text-amber-700 font-medium mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{t("projects.fFreightLockNote")}</span>
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground">{t("projects.documentsCol")}</Label>
            <select
              disabled={isView}
              value={formData.documentStatus || "Chưa bàn giao"}
              onChange={(e) => setFormData((p) => ({ ...p, documentStatus: e.target.value as any }))}
              className="w-full mt-1 border border-border rounded-md p-2 text-sm bg-card disabled:bg-muted disabled:text-foreground disabled:font-semibold disabled:opacity-100 disabled:cursor-default"
            >
              <option value="Đã bàn giao">{t("projects.fOptDocDone")}</option>
              <option value="Chưa bàn giao">{t("projects.fOptDocPending")}</option>
              <option value="Khác">{t("projects.fOptOther")}</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-foreground">{t("common.notes")}</Label>
          <Textarea
            readOnly={isView}
            rows={3}
            value={formData.notes || ""}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            className="mt-1 read-only:bg-muted read-only:text-foreground read-only:font-semibold read-only:opacity-100 read-only:cursor-default"
          />
        </div>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">
            {mode === "create" && t("projects.saleFormCreate")}
            {mode === "edit" && (isAlreadyPaidFreight ? t("projects.saleFormDetail") : t("projects.saleFormEdit"))}
            {mode === "copy" && t("projects.saleFormCopy")}
            {mode === "view" && t("projects.saleFormDetail")}
          </h2>
          {isAlreadyPaidFreight && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs px-2.5 py-1 font-semibold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              {t("projects.saleLockedBadge")}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
          onClick={onCancel}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
        {isView ? (
          <div className="space-y-6">
            <div className="bg-card p-5 rounded-xl border border-border space-y-4 shadow-2xs">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                {t("projects.saleStepInfo")}
              </h3>
              {renderTabInfo()}
            </div>

            <div className="bg-card p-5 rounded-xl border border-border space-y-4 shadow-2xs">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                {t("projects.saleStepPricing")}
              </h3>
              {renderTabPricing()}
            </div>

            <div className="bg-card p-5 rounded-xl border border-border space-y-4 shadow-2xs">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                {t("projects.saleStepShipping")}
              </h3>
              {renderTabShipping()}
            </div>

            <div className="bg-card p-5 rounded-xl border border-border space-y-4 shadow-2xs">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                {t("projects.saleStepTaxes")}
              </h3>
              {renderTabTaxes()}
            </div>

            <div className="bg-card p-5 rounded-xl border border-border space-y-4 shadow-2xs">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>
                {t("projects.saleStepStatus")}
              </h3>
              {renderTabStatus()}
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as StepKey)} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-muted p-1 mb-6 rounded-xl border border-border">
              {STEP_KEYS.map((key) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm font-semibold text-xs py-2 rounded-lg transition-all"
                >
                  {stepTitle(key)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="info" className="space-y-4">{renderTabInfo()}</TabsContent>
            <TabsContent value="pricing" className="space-y-4">{renderTabPricing()}</TabsContent>
            <TabsContent value="shipping" className="space-y-4">{renderTabShipping()}</TabsContent>
            <TabsContent value="taxes" className="space-y-4">{renderTabTaxes()}</TabsContent>
            <TabsContent value="status" className="space-y-4">{renderTabStatus()}</TabsContent>
          </Tabs>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border bg-card flex items-center justify-between shrink-0">
        {isView ? (
          <>
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              {isAlreadyPaidFreight ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-destructive shrink-0" />
                  <span className="text-destructive font-semibold">{t("projects.saleLockedHint")}</span>
                </>
              ) : (
                t("projects.saleViewHint")
              )}
            </span>
            <Button type="button" variant="default" onClick={onCancel} className="bg-foreground hover:bg-foreground/90 text-background font-semibold px-6">
              {t("common.close")}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="bg-muted text-foreground px-2.5 py-1 rounded-md">
                {t("projects.saleStep", { n: currentStepIndex + 1 })}
              </span>
              <span className="text-muted-foreground hidden sm:inline">{stepTitle(activeTab)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("common.cancel")}
              </Button>
              {currentStepIndex > 0 && (
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  {t("projects.saleBack")}
                </Button>
              )}
              {currentStepIndex < STEP_KEYS.length - 1 ? (
                <Button type="button" onClick={handleNextStep} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  {t("projects.saleContinue")}
                </Button>
              ) : (
                <Button type="submit" className="bg-brand-blue hover:bg-blue-600 text-white font-semibold">
                  {mode === "edit" ? t("projects.formUpdateSubmit") : t("projects.saleSave")}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </form>
  )
}
