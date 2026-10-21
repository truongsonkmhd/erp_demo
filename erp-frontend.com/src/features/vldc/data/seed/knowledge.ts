import { addDays } from "../dates.ts"
import type { ArchiveRecord, DmsFile, GeoDataset } from "../types.ts"

export const DMS_FOLDERS = ["01_Pháp lý", "02_Kế hoạch", "03_Kỹ thuật", "04_Hiện trường", "05_Tài chính", "06_Hợp đồng", "07_Nghiệm thu", "08_Báo cáo"]

/** Project dossier files (metadata only). */
export function dmsFiles(today: string): DmsFile[] {
  const d = (n: number) => addDays(today, n)
  const f = (id: string, projectId: string, folder: number, name: string, format: string, version: number, days: number, author: string, status: string, tags: string[], checkedOutBy?: string): DmsFile =>
    ({ id, projectId, folder: DMS_FOLDERS[folder], name, format, version, updatedAt: d(-days), author, status, tags, ...(checkedOutBy ? { checkedOutBy } : {}) })
  return [
    f("DOC-0001", "VLDC-2027-001", 0, "Quyết định giao nhiệm vụ VLDC-2027-001", "PDF", 1, 210, "Đỗ Minh Anh", "Approved", ["quyết định", "giao nhiệm vụ"]),
    f("DOC-0002", "VLDC-2027-001", 1, "Đề cương kỹ thuật – dự toán", "DOCX", 3, 120, "Phạm Thu Hà", "Approved", ["đề cương", "dự toán"]),
    f("DOC-0003", "VLDC-2027-001", 2, "Báo cáo kết quả đo từ khu vực A", "PDF", 4, 6, "Phạm Thu Hà", "Approved", ["đo từ", "báo cáo"]),
    f("DOC-0004", "VLDC-2027-001", 2, "Biên bản kiểm tra kỹ thuật tuyến T3", "DOCX", 2, 3, "Phạm Thu Hà", "Current", ["kiểm tra", "đo điện"], "Lê Hoàng Nam"),
    f("DOC-0005", "VLDC-2027-001", 3, "Nhật ký hiện trường tuần 41", "XLSX", 1, 2, "Lê Hoàng Nam", "Current", ["nhật ký", "GPS"]),
    f("DOC-0006", "VLDC-2027-001", 4, "Đề nghị thanh toán khảo sát đợt 2", "PDF", 1, 4, "Lê Hoàng Nam", "Current", ["thanh toán"]),
    f("DOC-0007", "VLDC-2027-001", 5, "Hợp đồng thuê máy đo từ P-12 (HĐ-MH-022)", "PDF", 1, 60, "Vũ Thị Lan", "Approved", ["hợp đồng", "P-12"]),
    f("DOC-0008", "VLDC-2027-001", 6, "Biên bản nghiệm thu khối lượng đo điện", "DOCX", 1, 1, "Phạm Thu Hà", "Draft", []),
    f("DOC-0009", "VLDC-2027-001", 7, "Báo cáo tiến độ tháng 9", "PDF", 2, 20, "Lê Hoàng Nam", "Approved", ["báo cáo tháng"]),
    f("DOC-0010", "VLDC-2026-014", 0, "Quyết định giao nhiệm vụ khảo sát biển B", "PDF", 1, 300, "Đỗ Minh Anh", "Approved", ["quyết định", "biển"]),
    f("DOC-0011", "VLDC-2026-014", 2, "Phương án an toàn tàu khảo sát mùa mưa bão", "DOCX", 2, 5, "Nguyễn Văn Hành", "Current", ["an toàn", "tàu"], "Nguyễn Văn Hành"),
    f("DOC-0012", "VLDC-2026-014", 3, "Nhật ký khảo sát tuyến T12–T15", "XLSX", 3, 1, "Nguyễn Đức Hải", "Current", ["nhật ký", "tuyến T12"]),
    f("DOC-0013", "VLDC-2026-014", 4, "Hồ sơ tạm ứng công tác biển (ADV-0092)", "PDF", 1, 3, "Nguyễn Văn A", "Draft", []),
    f("DOC-0014", "VLDC-2026-014", 5, "Hợp đồng thuê tàu (HĐ-DV-119)", "PDF", 1, 90, "Vũ Thị Lan", "Approved", ["hợp đồng", "tàu"]),
    f("DOC-0015", "VLDC-2026-014", 7, "Báo cáo dự báo trễ 28 ngày", "DOCX", 1, 2, "Nguyễn Văn Hành", "Current", ["tiến độ", "rủi ro"]),
    f("DOC-0016", "VLDC-2026-022", 2, "Kết quả bay đo khối F-48", "PDF", 2, 12, "Bùi Minh Thành", "Approved", ["bay đo", "phổ gamma"]),
    f("DOC-0017", "VLDC-2026-022", 2, "Chứng nhận hiệu chỉnh phổ gamma AGRS", "PDF", 1, 25, "Trần Anh Tuấn", "Approved", ["hiệu chỉnh", "gamma"]),
    f("DOC-0018", "VLDC-2026-022", 5, "Hợp đồng bay đo với Đối tác C (HĐ-2026-044)", "PDF", 1, 100, "Vũ Thị Lan", "Approved", ["hợp đồng"]),
    f("DOC-0019", "VLDC-2026-022", 7, "Bản đồ trường từ hàng không tờ F-48 (nháp)", "TIFF", 3, 4, "Bùi Minh Thành", "Draft", []),
    f("DOC-0020", "VLDC-2027-003", 1, "Dự toán điều chỉnh NV-2027-003", "XLSX", 1, 6, "Vũ Thị Lan", "Current", ["dự toán"]),
    f("DOC-0021", "VLDC-2027-003", 0, "Quyết định giao dự toán bổ sung", "PDF", 1, 8, "Đỗ Minh Anh", "Approved", ["quyết định", "dự toán"]),
    f("DOC-0022", "VLDC-2026-018", 2, "Mặt cắt địa chấn nông ven biển miền Trung", "PDF", 2, 15, "Lê Quang Cường", "Approved", ["địa chấn", "biển"]),
    f("DOC-0023", "VLDC-2026-018", 6, "Biên bản nghiệm thu đợt 1", "PDF", 1, 45, "Phạm Thu Hà", "Approved", ["nghiệm thu"]),
    f("DOC-0024", "VLDC-2026-030", 2, "Giấy kiểm định máy trọng lực CG-5", "PDF", 1, 11, "Hoàng Thu Giang", "Approved", ["kiểm định", "trọng lực"]),
    f("DOC-0025", "VLDC-2026-030", 2, "Quy trình hiệu chuẩn nội bộ máy từ (dự thảo)", "DOCX", 1, 3, "Trần Anh Tuấn", "Draft", []),
  ]
}

/** Paper-era dossiers being digitised. */
export const archiveRecords = (): ArchiveRecord[] => [
  { id: "HS-2019-00456", name: "Điều tra địa vật lý biển ven bờ Quảng Ngãi – Bình Định", year: 2019, unit: "Đoàn ĐVL Biển", type: "Hồ sơ dự án", docs: 186, metadataPct: 94, paperLocation: "Kho A – Giá 12 – Ngăn 3", status: "Đã số hóa", structure: ["Quyết định & đề cương", "Tài liệu nguyên thủy", "Báo cáo tổng kết", "Bản đồ kết quả"], access: "Nội bộ" },
  { id: "HS-2021-00218", name: "Bay đo từ – phổ gamma tỷ lệ 1:50.000 vùng Tây Bắc", year: 2021, unit: "Đoàn ĐVL Hàng không", type: "Hồ sơ dự án", docs: 342, metadataPct: 81, paperLocation: "Kho A – Giá 7 – Ngăn 1", status: "Đang số hóa", structure: ["Quyết định", "Dữ liệu bay đo", "Báo cáo", "Phụ lục bản đồ"], access: "Hạn chế" },
  { id: "HS-2025-00109", name: "Kiểm định thiết bị đo trọng lực 2025", year: 2025, unit: "TT Kiểm định", type: "Hồ sơ thiết bị", docs: 48, metadataPct: 100, paperLocation: "Kho B – Giá 2 – Ngăn 5", status: "Đã số hóa", structure: ["Giấy kiểm định", "Biên bản hiệu chuẩn"], access: "Nội bộ" },
  { id: "HS-2017-00073", name: "Đo sâu điện đứng vùng mỏ Lào Cai", year: 2017, unit: "Đoàn ĐVL Mặt đất", type: "Hồ sơ dự án", docs: 221, metadataPct: 62, paperLocation: "Kho A – Giá 3 – Ngăn 2", status: "Chờ scan", structure: ["Quyết định", "Sổ đo", "Báo cáo"], access: "Nội bộ" },
  { id: "HS-2020-00145", name: "Hồ sơ cán bộ kỹ thuật giai đoạn 2015–2020", year: 2020, unit: "Phòng Tổ chức – Hành chính", type: "Hồ sơ nhân sự", docs: 96, metadataPct: 88, paperLocation: "Kho C – Tủ khóa 1", status: "Đã số hóa", structure: ["Lý lịch", "Văn bằng", "Quyết định"], access: "Mật" },
]

/** Large geophysical datasets kept in object storage. */
export function geoDatasets(today: string): GeoDataset[] {
  const d = (n: number) => addDays(today, n)
  return [
    { id: "GEO-00182", name: "Magnetic Survey Area A", type: "Từ mặt đất", projectId: "VLDC-2027-001", sizeGb: 48.6, storageUri: "s3://vldc-geo/2027-001/mag/", access: "Dự án", checksum: "sha256:7f3a…c21", backup: true, lastAccess: [`${d(-1)} Phạm Thu Hà – tải xuống`, `${d(-3)} Lê Hoàng Nam – xem`] },
    { id: "GEO-00179", name: "Seismic profile T12–T15", type: "Địa chấn biển", projectId: "VLDC-2026-014", sizeGb: 312.4, storageUri: "s3://vldc-geo/2026-014/seis/", access: "Dự án", checksum: "sha256:91bd…0e4", backup: true, lastAccess: [`${d(-2)} Nguyễn Đức Hải – tải lên`] },
    { id: "GEO-00911", name: "Gamma spectrometry block F-48", type: "Phổ gamma hàng không", projectId: "VLDC-2026-022", sizeGb: 126.0, storageUri: "s3://vldc-geo/2026-022/agrs/", access: "Hạn chế", checksum: "sha256:4c0e…a77", backup: false, lastAccess: [`${d(-4)} Bùi Minh Thành – tải lên`] },
    { id: "GEO-00153", name: "Shallow seismic Central coast", type: "Địa chấn nông", projectId: "VLDC-2026-018", sizeGb: 88.2, storageUri: "s3://vldc-geo/2026-018/seis/", access: "Dự án", checksum: "sha256:2aa1…5f9", backup: true, lastAccess: [`${d(-10)} Lê Quang Cường – xem`] },
    { id: "GEO-00160", name: "Gravity calibration line ZLS-B37", type: "Trọng lực", projectId: "VLDC-2026-030", sizeGb: 2.4, storageUri: "s3://vldc-geo/2026-030/grav/", access: "Nội bộ", checksum: "sha256:e5d2…11b", backup: true, lastAccess: [`${d(-6)} Hoàng Thu Giang – xem`] },
  ]
}
