import React from "react"
import { Building2, Printer, ReceiptText, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PayrollItemRecord, PayrollPeriodRecord } from "../types/hrm-payroll.types"
import { formatVND, numberToVietnameseWords } from "../utils/payroll-calculator"

interface PayslipModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PayrollItemRecord | null
  period: PayrollPeriodRecord | null
}

export function PayslipModal({ open, onOpenChange, item, period }: PayslipModalProps) {
  if (!item || !period) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-card text-card-foreground border border-border shadow-2xl p-6 print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Phiếu lương cá nhân
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Tháng {period.month.toString().padStart(2, "0")}/{period.year} • {period.title}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 gap-1.5 print:hidden"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In phiếu</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Nội dung mẫu Phiếu lương Liên đoàn */}
        <div className="space-y-4 pt-2 text-xs">
          {/* Header Quốc hiệu / Tên Liên đoàn */}
          <div className="flex justify-between items-start border-b border-border/50 pb-3">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                BỘ TÀI NGUYÊN VÀ MÔI TRƯỜNG
              </div>
              <div className="text-xs font-bold text-foreground uppercase">
                LIÊN ĐOÀN VẬT LÝ ĐỊA CHẤT
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs font-semibold text-primary">
                Kỳ: {period.month.toString().padStart(2, "0")}/{period.year}
              </div>
              <div className="text-[11px] text-muted-foreground">Mã: {item.id}</div>
            </div>
          </div>

          {/* Tiêu đề chính */}
          <div className="text-center py-1">
            <h2 className="text-base font-extrabold uppercase text-foreground tracking-wide">
              PHIẾU THANH TOÁN TIỀN LƯƠNG
            </h2>
            <p className="text-[11px] text-muted-foreground italic">
              (Áp dụng theo Nghị định 73/2024/NĐ-CP & Quy chế chi tiêu nội bộ Liên đoàn)
            </p>
          </div>

          {/* Thông tin cán bộ */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/60">
            <div>
              <span className="text-muted-foreground">Họ và tên: </span>
              <strong className="text-foreground">{item.fullName}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Mã cán bộ: </span>
              <span className="font-mono font-semibold text-foreground">{item.employeeCode}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Đơn vị: </span>
              <span className="text-foreground font-medium">{item.department}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Vị trí: </span>
              <span className="text-foreground font-medium">{item.position}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ngạch lương: </span>
              <span className="text-foreground">{item.payGrade}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Hệ số lương (HSL): </span>
              <span className="font-mono font-bold text-primary">{item.salaryCoefficient}</span>
            </div>
          </div>

          {/* Bảng I: Các khoản thu nhập */}
          <div className="space-y-1.5">
            <div className="font-semibold text-foreground flex items-center justify-between pb-1 border-b border-border/60 text-[11px]">
              <span>I. CÁC KHOẢN THU NHẬP (THU NHẬP GỘP)</span>
              <span className="font-mono font-bold text-foreground">SỐ TIỀN (VNĐ)</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span>1. Lương theo ngạch bậc ({item.salaryCoefficient} × 2.340.000 ₫):</span>
                <span className="font-mono font-medium">{formatVND(item.baseSalary)}</span>
              </div>
              {item.positionAllowance > 0 && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span>2. Phụ cấp chức vụ (Hệ số {item.positionAllowanceCoeff}):</span>
                  <span className="font-mono font-medium">{formatVND(item.positionAllowance)}</span>
                </div>
              )}
              {item.fieldworkAllowance > 0 && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span>3. Phụ cấp lưu động / thực địa dã ngoại ({item.fieldworkDays} ngày):</span>
                  <span className="font-mono font-medium">{formatVND(item.fieldworkAllowance)}</span>
                </div>
              )}
              {item.hazardAllowance > 0 && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span>4. Phụ cấp độc hại đo vẽ địa vật lý:</span>
                  <span className="font-mono font-medium">{formatVND(item.hazardAllowance)}</span>
                </div>
              )}
              {item.seniorityAllowance > 0 && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span>5. Phụ cấp thâm niên nghề địa chất:</span>
                  <span className="font-mono font-medium">{formatVND(item.seniorityAllowance)}</span>
                </div>
              )}
              {item.bonus > 0 && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span>6. Thưởng thi đua / tiến độ đề án:</span>
                  <span className="font-mono font-medium">{formatVND(item.bonus)}</span>
                </div>
              )}
              {item.overtimePay > 0 && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span>7. Tiền làm thêm giờ (Overtime):</span>
                  <span className="font-mono font-medium">{formatVND(item.overtimePay)}</span>
                </div>
              )}
              {item.otherAllowances > 0 && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span>8. Phụ cấp & khoản tăng khác:</span>
                  <span className="font-mono font-medium">{formatVND(item.otherAllowances)}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 font-bold text-foreground bg-muted/40 px-2 rounded">
                <span>TỔNG THU NHẬP GỘP (GROSS):</span>
                <span className="font-mono">{formatVND(item.grossIncome)}</span>
              </div>
            </div>
          </div>

          {/* Bảng II: Các khoản giảm trừ */}
          <div className="space-y-1.5">
            <div className="font-semibold text-foreground flex items-center justify-between pb-1 border-b border-border/60 text-[11px]">
              <span>II. CÁC KHOẢN GIẢM TRỪ VÀ TRÍCH NỘP</span>
              <span className="font-mono font-bold text-foreground">SỐ TIỀN (VNĐ)</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span>1. Bảo hiểm xã hội (BHXH 8%):</span>
                <span className="font-mono text-destructive">-{formatVND(item.bhxhDeduction)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span>2. Bảo hiểm y tế (BHYT 1.5%):</span>
                <span className="font-mono text-destructive">-{formatVND(item.bhytDeduction)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span>3. Bảo hiểm thất nghiệp (BHTN 1%):</span>
                <span className="font-mono text-destructive">-{formatVND(item.bhtnDeduction)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span>4. Đoàn phí công đoàn (1%):</span>
                <span className="font-mono text-destructive">-{formatVND(item.unionDeduction)}</span>
              </div>
              {item.unpaidLeaveDeduction > 0 && (
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span>5. Trừ nghỉ không hưởng lương ({item.unpaidLeaveDays} ngày):</span>
                  <span className="font-mono text-destructive">
                    -{formatVND(item.unpaidLeaveDeduction)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-border/30">
                <span>
                  6. Thuế thu nhập cá nhân ({item.dependentsCount} người phụ thuộc):
                </span>
                <span className="font-mono text-destructive">
                  -{formatVND(item.personalIncomeTax)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 font-bold text-foreground bg-muted/40 px-2 rounded">
                <span>TỔNG CÁC KHOẢN GIẢM TRỪ:</span>
                <span className="font-mono text-destructive">-{formatVND(item.totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Phần III: Thực lĩnh chuyển khoản */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground uppercase">
                III. THỰC LĨNH CHUYỂN KHOẢN (NET PAY):
              </span>
              <span className="text-lg font-extrabold text-primary font-mono">
                {formatVND(item.netSalary)}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground italic">
              Bằng chữ: <strong>{numberToVietnameseWords(item.netSalary)}</strong>
            </div>
            <div className="text-[11px] text-muted-foreground pt-1 border-t border-primary/20 flex justify-between">
              <span>Tài khoản nhận: <strong>{item.bankAccountNumber || "Chưa đăng ký"}</strong></span>
              <span>Ngân hàng: <strong>{item.bankName || "BIDV"}</strong></span>
            </div>
          </div>

          {/* Ký tên (Dành cho in ấn) */}
          <div className="hidden print:grid grid-cols-2 gap-4 pt-6 text-center text-xs">
            <div>
              <div className="font-bold">NGƯỜI LẬP BIỂU</div>
              <div className="text-muted-foreground italic text-[10px]">(Ký, ghi rõ họ tên)</div>
            </div>
            <div>
              <div className="font-bold">KẾ TOÁN TRƯỞNG / THỦ TRƯỞNG ĐƠN VỊ</div>
              <div className="text-muted-foreground italic text-[10px]">(Ký, đóng dấu)</div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/50 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
