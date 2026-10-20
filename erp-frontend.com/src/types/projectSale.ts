export type OrderStatus = 'Đã thanh toán' | 'Đã sản xuất' | 'Đã phát';
export type ShipmentStatus = 'Nhập kho TQ' | 'Xếp xe' | 'Đã thông quan' | 'Đã giao' | 'Kiểm hoá' | 'Khác';
export type FreightPaymentStatus = 'Đã thu cước' | 'Chưa cước' | 'Khác';
export type DocumentStatus = 'Đã bàn giao' | 'Chưa bàn giao' | 'Khác';

export interface ProjectSale {
  id: string;
  // A. Thông tin đơn hàng & sản phẩm
  customerCode: string;             // Mã KH (FOB + 4 số cuối SĐT)
  phone?: string;                   // Số điện thoại khách hàng
  customerName?: string;            // Tên khách hàng
  customerClassification?: string;   // Phân loại KH (A: >=60tr/quý, B: >=30tr/quý, C: <=30tr/quý)
  customerType?: string;             // Khách hàng cũ / Khách hàng mới
  email?: string;                    // Email khách hàng
  csStaff?: string;                  // CS phụ trách
  customerDescription?: string;      // Mô tả KH (đặc điểm, phong cách làm việc, lưu ý)
  invoiceInfo?: string;              // Thông tin xuất hóa đơn
  shippingAddress?: string;          // Địa chỉ nhận hàng (tổng hợp)
  shippingProvince?: string;         // Tỉnh/Thành phố
  shippingWard?: string;             // Xã/Phường
  shippingDetailAddress?: string;    // Địa chỉ chi tiết
  freightNote?: string;              // Ghi chú giá cước
  orderCode: string;                // Mã đặt hàng
  batchCode: string;                // Mã lô hàng
  serviceType: string;              // Dịch vụ
  productName: string;              // Tên hàng
  category: string;                 // Ngành hàng

  // B. Tiền hàng & Tỷ giá
  unitPriceRmb: number;             // Đơn giá RMB
  quantity: number;                 // Số lượng
  domesticShippingRmb: number;      // Vận chuyển nội địa RMB
  costExchangeRate: number;         // Tỷ giá cost
  sellingExchangeRate: number;      // Tỷ giá bán
  totalGoodsCostVnd: number;        // Tổng tiền hàng cost VNĐ
  totalGoodsSellingVnd: number;     // Tổng tiền hàng bán VNĐ
  purchasingFeeVnd: number;         // Phí mua hàng 1% VNĐ

  // C. Trọng lượng & Cước vận chuyển
  weightKg: number;                 // Trọng lượng (Kg)
  volumeCbm: number;                // Thể tích (M3)

  costFreightRateKg?: number;       // Đơn giá cước cost (Kg)
  costFreightRateM3?: number;       // Đơn giá cước cost (M3)
  floorFreightRateKg?: number;      // Đơn giá cước sàn (Kg)
  floorFreightRateM3: number;       // Đơn giá cước sàn (M3)
  sellingFreightRateKg: number;     // Đơn giá cước bán (Kg)
  sellingFreightRateM3: number;     // Đơn giá cước bán (M3)

  costShippingFeeKg?: number;       // Cước VC Cost (Kg)
  costShippingFeeM3?: number;       // Cước VC Cost (M3)
  floorShippingFeeKg: number;       // Cước VC sàn (Kg)
  floorShippingFeeM3: number;       // Cước VC sàn (M3)
  sellingShippingFeeKg: number;     // Cước VC bán (Kg)
  sellingShippingFeeM3: number;     // Cước VC bán (M3)

  // D. Cước tàu đường biển
  costVesselFreightRateKg?: number; // Đơn giá cước tàu cost (Kg)
  costVesselFreightRateM3?: number; // Đơn giá cước tàu cost (M3)
  sellingVesselFreightRateKg: number; // Đơn giá cước tàu bán (Kg)
  sellingVesselFreightRateM3: number; // Đơn giá cước tàu bán (M3)
  costVesselShippingFeeKg?: number; // Cước tàu cost (Kg)
  costVesselShippingFeeM3?: number; // Cước tàu cost (M3)
  sellingVesselShippingFeeKg: number; // Cước tàu bán (Kg)
  sellingVesselShippingFeeM3: number; // Cước tàu bán (M3)

  // E. Thuế, Phí & Lợi nhuận
  importTaxRate: number;             // Thuế NK (%)
  importTaxAmountVnd: number;        // Tiền thuế NK VNĐ
  entrustedImportFeeVnd: number;     // Phí UTNK 2% VNĐ
  customsDeclarationFeeVnd: number;  // Phí tờ khai VNĐ
  otherFeesVnd: number;              // Phí khác VNĐ
  otherProfitVnd: number;            // Lợi nhuận khác VNĐ
  vatRate: number;                   // Thuế VAT (%)
  vatAmountVnd: number;              // Tiền thuế VAT VNĐ
  totalPaymentAmountVnd: number;     // Tổng tiền thanh toán VNĐ

  grossCompanyProfitVnd?: number;    // Lợi nhuận gộp Gross (công ty) VNĐ
  netSalesProfitVnd: number;         // Lợi nhuận gộp Net (sales) VNĐ

  // F. Trạng thái theo dõi & Ghi chú
  orderStatus: OrderStatus;          // Theo dõi đặt hàng
  shipmentStatus: ShipmentStatus;    // Theo dõi lô hàng
  freightPaymentStatus: FreightPaymentStatus; // Thu cước
  documentStatus: DocumentStatus;    // Chứng từ
  notes?: string;                    // Ghi chú
  assignedStaff?: string;            // Nhân viên được giao việc
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;

  // G. Lợi nhuận 12 tháng & Thống kê phát sinh đơn hàng
  monthlyProfits?: Record<string, number>; // { m1, m2, ..., m12 }
  totalMonthlyProfitVnd?: number;          // Tổng lợi nhuận 12 tháng
  profitFrom2MonthsVnd?: number;            // Tổng LN KH phát sinh đơn hàng từ 2 tháng trở lên
  profitFrom3MonthsVnd?: number;            // Tổng LN KH phát sinh đơn hàng từ 3 tháng
  profitFrom4MonthsVnd?: number;            // Tổng LN KH phát sinh đơn hàng từ 4 tháng
  profitFrom5MonthsVnd?: number;            // Tổng LN KH phát sinh đơn hàng từ 5 tháng
}
