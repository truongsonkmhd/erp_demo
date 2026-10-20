import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/config/firebaseConnect"
import { readStore, writeStore, newLocalId } from "@/lib/localStore"
import { Dossier, DossierInput, DossierWorkflowStep } from "@/types/dossier"

const STORAGE_KEY = "erp_business_dossiers_v1"
const COLLECTION_NAME = "business_dossiers"

export const DEFAULT_WORKFLOW_STEPS: DossierWorkflowStep[] = [
  {
    stepNumber: 1,
    stepName: "Khởi tạo hồ sơ",
    roleName: "Người lập",
    assigneeName: "Cán bộ lập hồ sơ",
    status: "completed",
  },
  {
    stepNumber: 2,
    stepName: "Duyệt cấp Đơn vị",
    roleName: "Trưởng đơn vị",
    assigneeName: "Trưởng phòng / Trưởng đoàn",
    status: "current",
  },
  {
    stepNumber: 3,
    stepName: "Thẩm định chuyên môn",
    roleName: "Phòng chuyên môn",
    assigneeName: "Trưởng phòng Kỹ thuật / KH-TC",
    status: "pending",
  },
  {
    stepNumber: 4,
    stepName: "Xem xét & Cho ý kiến",
    roleName: "Phó Liên đoàn trưởng",
    assigneeName: "Hoàng Minh Tuấn",
    status: "pending",
  },
  {
    stepNumber: 5,
    stepName: "Phê duyệt cuối",
    roleName: "Liên đoàn trưởng",
    assigneeName: "Phạm Trường Sơn",
    status: "pending",
  },
]

export const INITIAL_DOSSIERS: Dossier[] = [
  {
    id: "dos-001",
    code: "HS-2026-001",
    name: "Hồ sơ đề nghị mua sắm máy đo từ phổ gamma cầm tay đợt 2 năm 2026",
    dossierType: "Đề nghị mua sắm",
    department: "Phòng Mua sắm - Vật tư",
    creatorName: "Phạm Văn Minh",
    createdDate: "2026-10-01",
    currentHandler: "Phạm Trường Sơn (Liên đoàn trưởng)",
    currentStep: "Bước 5: Phê duyệt cuối",
    status: "Chờ Lãnh đạo phê duyệt",
    dueDate: "2026-10-15",
    summary:
      "Đề xuất trang bị bổ sung 02 máy đo từ phổ gamma cầm tay phục vụ đoàn thi công khảo sát địa vật lý khu vực Tây Bắc.",
    attachments: [
      {
        id: "att-d-001",
        name: "De_xuat_mua_sam_may_do_tu_gamma_2026.pdf",
        size: 2150000,
        url: "#",
        uploadedAt: "2026-10-01 09:30",
      },
      {
        id: "att-d-002",
        name: "Bao_gia_thiet_bi_dia_vat_ly_nhap_khau.xlsx",
        size: 890000,
        url: "#",
        uploadedAt: "2026-10-01 09:30",
      },
    ],
    workflowSteps: [
      { stepNumber: 1, stepName: "Khởi tạo hồ sơ", roleName: "Người lập", assigneeName: "Phạm Văn Minh", status: "completed" },
      { stepNumber: 2, stepName: "Duyệt cấp Đơn vị", roleName: "Trưởng đơn vị", assigneeName: "Phạm Văn Minh (Trưởng phòng MS-VT)", status: "completed" },
      { stepNumber: 3, stepName: "Thẩm định chuyên môn", roleName: "Phòng chuyên môn", assigneeName: "Nguyễn Văn Hùng (Kỹ thuật)", status: "completed" },
      { stepNumber: 4, stepName: "Xem xét chỉ đạo", roleName: "Phó Liên đoàn trưởng", assigneeName: "Hoàng Minh Tuấn", status: "completed" },
      { stepNumber: 5, stepName: "Phê duyệt cuối", roleName: "Liên đoàn trưởng", assigneeName: "Phạm Trường Sơn", status: "current" },
    ],
    processHistory: [
      { id: "log-d-001", action: "Tạo hồ sơ", actor: "Phạm Văn Minh", role: "Người lập", timestamp: "2026-10-01 09:30", note: "Khởi tạo hồ sơ mua sắm", previousStatus: "Khởi tạo", nextStatus: "Dự thảo", dossierId: "dos-001", dossierCode: "HS-2026-001", dossierName: "Hồ sơ đề nghị mua sắm máy đo từ phổ gamma cầm tay đợt 2 năm 2026" },
      { id: "log-d-002", action: "Gửi phê duyệt", actor: "Phạm Văn Minh", role: "Người lập", timestamp: "2026-10-01 10:00", note: "Trình duyệt tờ trình mua sắm", previousStatus: "Dự thảo", nextStatus: "Chờ Trưởng đơn vị duyệt", dossierId: "dos-001", dossierCode: "HS-2026-001", dossierName: "Hồ sơ đề nghị mua sắm máy đo từ phổ gamma cầm tay đợt 2 năm 2026" },
      { id: "log-d-003", action: "Thẩm định chuyên môn thành công", actor: "Nguyễn Văn Hùng", role: "Trưởng phòng Kỹ thuật", timestamp: "2026-10-03 14:00", note: "Đã thẩm định cấu hình kỹ thuật máy đo gamma phù hợp tiêu chuẩn", previousStatus: "Chờ Trưởng đơn vị duyệt", nextStatus: "Chờ Phòng chuyên môn duyệt", dossierId: "dos-001", dossierCode: "HS-2026-001", dossierName: "Hồ sơ đề nghị mua sắm máy đo từ phổ gamma cầm tay đợt 2 năm 2026" },
      { id: "log-d-004", action: "Đã cho ý kiến chỉ đạo", actor: "Hoàng Minh Tuấn", role: "Phó Liên đoàn trưởng", timestamp: "2026-10-04 11:15", note: "Nhất trí chủ trương, trình Liên đoàn trưởng phê duyệt", previousStatus: "Chờ Phòng chuyên môn duyệt", nextStatus: "Chờ Lãnh đạo phê duyệt", dossierId: "dos-001", dossierCode: "HS-2026-001", dossierName: "Hồ sơ đề nghị mua sắm máy đo từ phổ gamma cầm tay đợt 2 năm 2026" },
    ],
    createdAt: "2026-10-01T09:30:00.000Z",
    updatedAt: "2026-10-04T11:15:00.000Z",
  },
  {
    id: "dos-002",
    code: "HS-2026-002",
    name: "Dự toán chi phí khảo sát địa chấn nông phân giải cao đề án Tây Nguyên",
    dossierType: "Dự toán",
    department: "Phòng Kế hoạch - Tài chính",
    creatorName: "Lê Thị Ngọc",
    createdDate: "2026-10-03",
    currentHandler: "Nguyễn Văn Hùng (Phòng Kỹ thuật)",
    currentStep: "Bước 3: Thẩm định chuyên môn",
    status: "Chờ Phòng chuyên môn duyệt",
    dueDate: "2026-10-18",
    summary: "Lập dự toán chi tiết kinh phí thi công đo địa chấn nông 120 điểm trạm vùng Tây Nguyên.",
    attachments: [
      { id: "att-d-003", name: "Bang_tinh_du_toan_dia_chan_Tay_Nguyen.xlsx", size: 1420000, url: "#", uploadedAt: "2026-10-03 11:00" },
    ],
    workflowSteps: [
      { stepNumber: 1, stepName: "Khởi tạo hồ sơ", roleName: "Người lập", assigneeName: "Lê Thị Ngọc", status: "completed" },
      { stepNumber: 2, stepName: "Duyệt cấp Đơn vị", roleName: "Trưởng đơn vị", assigneeName: "Lê Thị Ngọc (Trưởng phòng KH-TC)", status: "completed" },
      { stepNumber: 3, stepName: "Thẩm định chuyên môn", roleName: "Phòng chuyên môn", assigneeName: "Nguyễn Văn Hùng (Kỹ thuật)", status: "current" },
      { stepNumber: 4, stepName: "Xem xét chỉ đạo", roleName: "Phó Liên đoàn trưởng", assigneeName: "Hoàng Minh Tuấn", status: "pending" },
      { stepNumber: 5, stepName: "Phê duyệt cuối", roleName: "Liên đoàn trưởng", assigneeName: "Phạm Trường Sơn", status: "pending" },
    ],
    processHistory: [
      { id: "log-d-005", action: "Tạo hồ sơ", actor: "Lê Thị Ngọc", role: "Người lập", timestamp: "2026-10-03 11:00", note: "Lập bảng dự toán chi phí", previousStatus: "Khởi tạo", nextStatus: "Dự thảo", dossierId: "dos-002", dossierCode: "HS-2026-002", dossierName: "Dự toán chi phí khảo sát địa chấn nông phân giải cao đề án Tây Nguyên" },
      { id: "log-d-006", action: "Gửi phê duyệt", actor: "Lê Thị Ngọc", role: "Trưởng phòng KH-TC", timestamp: "2026-10-03 14:00", note: "Gửi Phòng Kỹ thuật thẩm định định mức kinh tế kỹ thuật", previousStatus: "Dự thảo", nextStatus: "Chờ Phòng chuyên môn duyệt", dossierId: "dos-002", dossierCode: "HS-2026-002", dossierName: "Dự toán chi phí khảo sát địa chấn nông phân giải cao đề án Tây Nguyên" },
    ],
    createdAt: "2026-10-03T11:00:00.000Z",
    updatedAt: "2026-10-03T14:00:00.000Z",
  },
  {
    id: "dos-003",
    code: "HS-2026-003",
    name: "Phương án điều động xe đo địa vật lý lỗ khoan số 04 phục vụ nhiệm vụ Lào Cai",
    dossierType: "Điều động phương tiện",
    department: "Đoàn Địa vật lý 1",
    creatorName: "Trần Văn Nam",
    createdDate: "2026-10-04",
    currentHandler: "Trần Văn Nam (Cần bổ sung)",
    currentStep: "Bước 1: Khởi tạo & Bổ sung",
    status: "Yêu cầu bổ sung",
    dueDate: "2026-10-12",
    summary: "Đề nghị điều động xe chuyên dụng và 03 kỹ thuật viên đo địa chấn lỗ khoan lên tuyến thi công Lào Cai.",
    attachments: [
      { id: "att-d-004", name: "Tờ_trinh_dieu_dong_xe_do_04.docx", size: 680000, url: "#", uploadedAt: "2026-10-04 08:30" },
    ],
    workflowSteps: [
      { stepNumber: 1, stepName: "Khởi tạo & Bổ sung", roleName: "Người lập", assigneeName: "Trần Văn Nam", status: "current" },
      { stepNumber: 2, stepName: "Duyệt cấp Đơn vị", roleName: "Trưởng đơn vị", assigneeName: "Trưởng Đoàn ĐVL1", status: "pending" },
      { stepNumber: 3, stepName: "Thẩm định chuyên môn", roleName: "Phòng Kỹ thuật", assigneeName: "Nguyễn Văn Hùng", status: "pending" },
      { stepNumber: 4, stepName: "Phê duyệt cuối", roleName: "Lãnh đạo Liên đoàn", assigneeName: "Hoàng Minh Tuấn", status: "pending" },
    ],
    processHistory: [
      { id: "log-d-007", action: "Tạo hồ sơ", actor: "Trần Văn Nam", role: "Người lập", timestamp: "2026-10-04 08:30", note: "Khởi tạo hồ sơ điều động xe", previousStatus: "Khởi tạo", nextStatus: "Dự thảo", dossierId: "dos-003", dossierCode: "HS-2026-003", dossierName: "Phương án điều động xe đo địa vật lý lỗ khoan số 04 phục vụ nhiệm vụ Lào Cai" },
      { id: "log-d-008", action: "Yêu cầu bổ sung", actor: "Nguyễn Văn Hùng", role: "Trưởng phòng Kỹ thuật", timestamp: "2026-10-05 10:00", note: "Cần bổ sung Giấy kiểm định định kỳ của xe đo số 04 trước khi cấp lệnh điều động.", previousStatus: "Chờ Phòng chuyên môn duyệt", nextStatus: "Yêu cầu bổ sung", dossierId: "dos-003", dossierCode: "HS-2026-003", dossierName: "Phương án điều động xe đo địa vật lý lỗ khoan số 04 phục vụ nhiệm vụ Lào Cai" },
    ],
    createdAt: "2026-10-04T08:30:00.000Z",
    updatedAt: "2026-10-05T10:00:00.000Z",
  },
  {
    id: "dos-004",
    code: "HS-2026-004",
    name: "Hồ sơ nghiệm thu khối lượng thi công thăm dò từ trường địa chất đợt I đèo Khâu Phạ",
    dossierType: "Nghiệm thu",
    department: "Phòng Kỹ thuật - Khối lượng",
    creatorName: "Nguyễn Văn Hùng",
    createdDate: "2026-09-20",
    currentHandler: "Đã hoàn tất phê duyệt",
    currentStep: "Bước 5: Đã phê duyệt",
    status: "Đã phê duyệt",
    dueDate: "2026-09-30",
    summary: "Hồ sơ nghiệm thu kỹ thuật và khối lượng thực tế 85 km tuyến đo từ trường mặt đất.",
    attachments: [
      { id: "att-d-005", name: "Bien_ban_nghiem_thu_khoi_luong_Khau_Pha.pdf", size: 3100000, url: "#", uploadedAt: "2026-09-20 15:00" },
    ],
    workflowSteps: [
      { stepNumber: 1, stepName: "Khởi tạo hồ sơ", roleName: "Người lập", assigneeName: "Nguyễn Văn Hùng", status: "completed" },
      { stepNumber: 2, stepName: "Duyệt cấp Đơn vị", roleName: "Trưởng đơn vị", assigneeName: "Nguyễn Văn Hùng", status: "completed" },
      { stepNumber: 3, stepName: "Thẩm định chuyên môn", roleName: "Phòng KH-TC", assigneeName: "Lê Thị Ngọc", status: "completed" },
      { stepNumber: 4, stepName: "Xem xét chỉ đạo", roleName: "Phó Liên đoàn trưởng", assigneeName: "Hoàng Minh Tuấn", status: "completed" },
      { stepNumber: 5, stepName: "Phê duyệt cuối", roleName: "Liên đoàn trưởng", assigneeName: "Phạm Trường Sơn", status: "completed" },
    ],
    processHistory: [
      { id: "log-d-009", action: "Tạo hồ sơ", actor: "Nguyễn Văn Hùng", role: "Người lập", timestamp: "2026-09-20 15:00", note: "Lập hồ sơ nghiệm thu khối lượng", previousStatus: "Khởi tạo", nextStatus: "Dự thảo", dossierId: "dos-004", dossierCode: "HS-2026-004", dossierName: "Hồ sơ nghiệm thu khối lượng thi công thăm dò từ trường địa chất đợt I đèo Khâu Phạ" },
      { id: "log-d-010", action: "Phê duyệt cuối", actor: "Phạm Trường Sơn", role: "Liên đoàn trưởng", timestamp: "2026-09-28 16:30", note: "Phê duyệt biên bản nghiệm thu khối lượng đợt I.", previousStatus: "Chờ Lãnh đạo phê duyệt", nextStatus: "Đã phê duyệt", dossierId: "dos-004", dossierCode: "HS-2026-004", dossierName: "Hồ sơ nghiệm thu khối lượng thi công thăm dò từ trường địa chất đợt I đèo Khâu Phạ" },
    ],
    createdAt: "2026-09-20T15:00:00.000Z",
    updatedAt: "2026-09-28T16:30:00.000Z",
  },
  {
    id: "dos-005",
    code: "HS-2026-005",
    name: "Kế hoạch tập huấn quy trình vận hành máy đo địa chấn nông phân giải cao 2026",
    dossierType: "Kế hoạch",
    department: "Đoàn Địa vật lý 2",
    creatorName: "Hoàng Quốc Khánh",
    createdDate: "2026-10-06",
    currentHandler: "Hoàng Quốc Khánh (Chưa gửi)",
    currentStep: "Bước 1: Dự thảo",
    status: "Dự thảo",
    dueDate: "2026-10-25",
    summary: "Dự thảo kế hoạch đào tạo lại kỹ thuật vận hành máy đo địa chấn nông cho 15 kỹ sư địa vật lý mới.",
    attachments: [
      { id: "att-d-006", name: "Ke_hoach_Tap_huan_May_do_dia_chan_2026.docx", size: 540000, url: "#", uploadedAt: "2026-10-06 16:00" },
    ],
    workflowSteps: DEFAULT_WORKFLOW_STEPS,
    processHistory: [
      { id: "log-d-011", action: "Tạo dự thảo hồ sơ", actor: "Hoàng Quốc Khánh", role: "Người lập", timestamp: "2026-10-06 16:00", note: "Tạo dự thảo hồ sơ kế hoạch tập huấn", previousStatus: "Khởi tạo", nextStatus: "Dự thảo", dossierId: "dos-005", dossierCode: "HS-2026-005", dossierName: "Kế hoạch tập huấn quy trình vận hành máy đo địa chấn nông phân giải cao 2026" },
    ],
    createdAt: "2026-10-06T16:00:00.000Z",
    updatedAt: "2026-10-06T16:00:00.000Z",
  },
]

export async function getDossiers(): Promise<Dossier[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME))
      if (!snap.empty) {
        const list: Dossier[] = []
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Dossier, "id">) })
        })
        return list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      }
    } catch (error) {
      console.warn("[Firestore] Không thể tải danh sách hồ sơ, chuyển sang LocalStorage:", error)
    }
  }

  const localData = readStore<Dossier>(STORAGE_KEY, [])
  if (!localData || localData.length === 0) {
    writeStore(STORAGE_KEY, INITIAL_DOSSIERS)
    return INITIAL_DOSSIERS
  }
  return localData.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function addDossier(input: DossierInput): Promise<Dossier> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const newDoc: Dossier = {
    ...input,
    id: newLocalId("dos"),
    status: input.status || "Dự thảo",
    currentHandler: `${input.creatorName} (Chưa gửi)`,
    currentStep: "Bước 1: Dự thảo",
    workflowSteps: DEFAULT_WORKFLOW_STEPS,
    attachments: input.attachments || [],
    processHistory: [
      {
        id: newLocalId("log"),
        action: "Tạo hồ sơ mới",
        actor: input.creatorName || "Người lập",
        role: "Cán bộ lập hồ sơ",
        timestamp: nowFormatted,
        note: `Khởi tạo hồ sơ ${input.code}: ${input.name}`,
      },
    ],
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, newDoc.id), newDoc)
    } catch (error) {
      console.warn("[Firestore] Không thể lưu hồ sơ mới:", error)
    }
  }

  const list = readStore<Dossier>(STORAGE_KEY, INITIAL_DOSSIERS)
  const updated = [newDoc, ...list]
  writeStore(STORAGE_KEY, updated)
  return newDoc
}

export async function updateDossier(
  id: string,
  input: Partial<DossierInput>,
): Promise<Dossier> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getDossiers()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy hồ sơ.")

  const newLog = {
    id: newLocalId("log"),
    action: "Cập nhật thông tin hồ sơ",
    actor: target.creatorName,
    role: "Người lập",
    timestamp: nowFormatted,
    note: "Đã chỉnh sửa nội dung thông tin hồ sơ.",
  }

  const updatedDoc: Dossier = {
    ...target,
    ...input,
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...input,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Không thể cập nhật hồ sơ:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function submitDossierForApproval(
  id: string,
  note?: string,
): Promise<Dossier> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getDossiers()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy hồ sơ.")

  const newLog = {
    id: newLocalId("log"),
    action: "Gửi phê duyệt hồ sơ",
    actor: target.creatorName,
    role: "Người lập",
    timestamp: nowFormatted,
    note: note || "Đã gửi hồ sơ lên Trưởng đơn vị xem xét phê duyệt.",
  }

  // Next step: Chờ Trưởng đơn vị duyệt
  const updatedSteps: DossierWorkflowStep[] = (target.workflowSteps || DEFAULT_WORKFLOW_STEPS).map(
    (step) => {
      if (step.stepNumber === 1) return { ...step, status: "completed" }
      if (step.stepNumber === 2) return { ...step, status: "current" }
      return step
    },
  )

  const updatedDoc: Dossier = {
    ...target,
    status: "Chờ Trưởng đơn vị duyệt",
    currentStep: "Bước 2: Duyệt cấp Đơn vị",
    currentHandler: "Trưởng phòng / Trưởng đơn vị",
    workflowSteps: updatedSteps,
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: updatedDoc.status,
        currentStep: updatedDoc.currentStep,
        currentHandler: updatedDoc.currentHandler,
        workflowSteps: updatedDoc.workflowSteps,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Lỗi khi gửi phê duyệt hồ sơ:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function approveDossier(
  id: string,
  actorName: string,
  roleName: string,
  note?: string,
): Promise<Dossier> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getDossiers()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy hồ sơ.")

  const currentSteps = target.workflowSteps || DEFAULT_WORKFLOW_STEPS
  const currentStepIdx = currentSteps.findIndex((s) => s.status === "current")
  const currentStepObj = currentSteps[currentStepIdx] || currentSteps[0]

  const isLastStep = currentStepIdx === -1 || currentStepIdx === currentSteps.length - 1

  let updatedSteps: DossierWorkflowStep[] = []
  let newStatus: DossierStatus = "Đã phê duyệt"
  let newCurrentStepStr = "Hoàn tất phê duyệt"
  let newCurrentHandler = "Đã phê duyệt"

  if (isLastStep) {
    updatedSteps = currentSteps.map((s) => ({ ...s, status: "completed" }))
    newStatus = "Đã phê duyệt"
    newCurrentStepStr = "Hoàn tất phê duyệt"
    newCurrentHandler = "Đã phê duyệt"
  } else {
    const nextStepIdx = currentStepIdx + 1
    const nextStepObj = currentSteps[nextStepIdx]

    updatedSteps = currentSteps.map((s, idx) => {
      if (idx <= currentStepIdx) return { ...s, status: "completed" }
      if (idx === nextStepIdx) return { ...s, status: "current" }
      return { ...s, status: "pending" }
    })

    newCurrentStepStr = `Bước ${nextStepObj.stepNumber}: ${nextStepObj.stepName}`
    newCurrentHandler = `${nextStepObj.assigneeName || nextStepObj.roleName}`

    if (nextStepObj.stepNumber === 2) {
      newStatus = "Chờ Trưởng đơn vị duyệt"
    } else if (nextStepObj.stepNumber === 3) {
      newStatus = "Chờ Phòng chuyên môn duyệt"
    } else {
      newStatus = "Chờ Lãnh đạo phê duyệt"
    }
  }

  const newLog = {
    id: newLocalId("log"),
    action: isLastStep
      ? "Phê duyệt ban hành hồ sơ"
      : `Phê duyệt thành công (${currentStepObj.stepName})`,
    actor: actorName,
    role: roleName,
    timestamp: nowFormatted,
    note: note || (isLastStep ? "Đã duyệt và thông qua hồ sơ." : "Đã đồng ý thông qua bước này."),
    previousStatus: target.status,
    nextStatus: newStatus,
    dossierId: target.id,
    dossierCode: target.code,
    dossierName: target.name,
  }

  const updatedDoc: Dossier = {
    ...target,
    status: newStatus,
    currentStep: newCurrentStepStr,
    currentHandler: newCurrentHandler,
    workflowSteps: updatedSteps,
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: updatedDoc.status,
        currentStep: updatedDoc.currentStep,
        currentHandler: updatedDoc.currentHandler,
        workflowSteps: updatedDoc.workflowSteps,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Lỗi khi phê duyệt hồ sơ:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function rejectDossier(
  id: string,
  actorName: string,
  roleName: string,
  note: string,
): Promise<Dossier> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getDossiers()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy hồ sơ.")

  const newLog = {
    id: newLocalId("log"),
    action: "Từ chối hồ sơ",
    actor: actorName,
    role: roleName,
    timestamp: nowFormatted,
    note: note || "Không đồng ý thông qua hồ sơ này.",
    previousStatus: target.status,
    nextStatus: "Bị từ chối",
    dossierId: target.id,
    dossierCode: target.code,
    dossierName: target.name,
  }

  const updatedDoc: Dossier = {
    ...target,
    status: "Bị từ chối",
    currentStep: "Bị từ chối",
    currentHandler: "Hồ sơ bị từ chối",
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: updatedDoc.status,
        currentStep: updatedDoc.currentStep,
        currentHandler: updatedDoc.currentHandler,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Lỗi khi từ chối hồ sơ:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function requestDossierChanges(
  id: string,
  actorName: string,
  roleName: string,
  note: string,
): Promise<Dossier> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getDossiers()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy hồ sơ.")

  const currentSteps = target.workflowSteps || DEFAULT_WORKFLOW_STEPS
  const updatedSteps = currentSteps.map((s, idx) => {
    if (idx === 0) return { ...s, status: "current" as const }
    return { ...s, status: "pending" as const }
  })

  const newLog = {
    id: newLocalId("log"),
    action: "Yêu cầu bổ sung hồ sơ",
    actor: actorName,
    role: roleName,
    timestamp: nowFormatted,
    note: note || "Trả lại người lập để bổ sung tài liệu minh chứng.",
    previousStatus: target.status,
    nextStatus: "Yêu cầu bổ sung",
    dossierId: target.id,
    dossierCode: target.code,
    dossierName: target.name,
  }

  const updatedDoc: Dossier = {
    ...target,
    status: "Yêu cầu bổ sung",
    currentStep: "Bước 1: Khởi tạo & Bổ sung",
    currentHandler: `${target.creatorName} (Cần bổ sung)`,
    workflowSteps: updatedSteps,
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: updatedDoc.status,
        currentStep: updatedDoc.currentStep,
        currentHandler: updatedDoc.currentHandler,
        workflowSteps: updatedDoc.workflowSteps,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Lỗi khi yêu cầu bổ sung hồ sơ:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function resubmitDossier(
  id: string,
  actorName: string,
  note?: string,
): Promise<Dossier> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getDossiers()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy hồ sơ.")

  const currentSteps = target.workflowSteps || DEFAULT_WORKFLOW_STEPS
  const updatedSteps = currentSteps.map((s, idx) => {
    if (idx === 0) return { ...s, status: "completed" as const }
    if (idx === 1) return { ...s, status: "current" as const }
    return { ...s, status: "pending" as const }
  })

  const newLog = {
    id: newLocalId("log"),
    action: "Đã bổ sung & Gửi lại phê duyệt",
    actor: actorName,
    role: "Người lập",
    timestamp: nowFormatted,
    note: note || "Đã hoàn thành nội dung bổ sung và gửi lại phê duyệt.",
    previousStatus: target.status,
    nextStatus: "Chờ Trưởng đơn vị duyệt",
    dossierId: target.id,
    dossierCode: target.code,
    dossierName: target.name,
  }

  const updatedDoc: Dossier = {
    ...target,
    status: "Chờ Trưởng đơn vị duyệt",
    currentStep: "Bước 2: Duyệt cấp Đơn vị",
    currentHandler: "Trưởng phòng / Trưởng đơn vị",
    workflowSteps: updatedSteps,
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: updatedDoc.status,
        currentStep: updatedDoc.currentStep,
        currentHandler: updatedDoc.currentHandler,
        workflowSteps: updatedDoc.workflowSteps,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Lỗi khi gửi lại hồ sơ bổ sung:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function getAllApprovalLogs(): Promise<DossierProcessLog[]> {
  const dossiers = await getDossiers()
  const allLogs: DossierProcessLog[] = []
  dossiers.forEach((dos) => {
    if (dos.processHistory) {
      dos.processHistory.forEach((log) => {
        allLogs.push({
          ...log,
          dossierId: log.dossierId || dos.id,
          dossierCode: log.dossierCode || dos.code,
          dossierName: log.dossierName || dos.name,
          previousStatus: log.previousStatus || "Khởi tạo",
          nextStatus: log.nextStatus || dos.status,
        })
      })
    }
  })
  return allLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export async function resetDossiersDemoData(): Promise<Dossier[]> {
  writeStore(STORAGE_KEY, INITIAL_DOSSIERS)

  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME))
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, COLLECTION_NAME, docSnap.id))
      }
      for (const docItem of INITIAL_DOSSIERS) {
        await setDoc(doc(db, COLLECTION_NAME, docItem.id), docItem)
      }
    } catch (error) {
      console.warn("[Firestore] Không thể reset dữ liệu hồ sơ trên Firestore:", error)
    }
  }

  return INITIAL_DOSSIERS
}

