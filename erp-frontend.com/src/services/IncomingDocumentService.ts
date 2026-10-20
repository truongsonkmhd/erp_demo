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
import {
  IncomingDocument,
  IncomingDocumentInput,
  IncomingDocumentStatus,
} from "@/types/incomingDocument"

const STORAGE_KEY = "erp_incoming_documents_v1"
const COLLECTION_NAME = "incoming_documents"

export const INITIAL_INCOMING_DOCUMENTS: IncomingDocument[] = [
  {
    id: "doc-in-001",
    documentNumber: "128/TB-BTNMT",
    releaseDate: "2026-10-01",
    receivedDate: "2026-10-02 08:30",
    summary:
      "Thông báo về việc kiểm tra công tác an toàn lao động và kỹ thuật khảo sát địa vật lý đợt II năm 2026",
    senderUnit: "Bộ Tài nguyên và Môi trường",
    documentType: "Thông báo",
    urgency: "Thượng khẩn",
    status: "Đang xử lý",
    assignedToUnit: "Phòng Kỹ thuật - Khối lượng",
    assignedToUser: "Nguyễn Văn Hùng (Trưởng phòng)",
    coordinatingUnits: ["Văn phòng Liên đoàn", "Đoàn Địa vật lý 1"],
    dueDate: "2026-10-15",
    instruction:
      "Giao Phòng Kỹ thuật chủ trì chuẩn bị hồ sơ kiểm tra an toàn thi công địa vật lý; phối hợp các Đoàn Địa vật lý rà soát máy móc thiết bị.",
    attachments: [
      {
        id: "att-001",
        name: "Thong_bao_128_BTNMT_Kiem_tra_ATLD.pdf",
        size: 1450000,
        url: "#",
        uploadedAt: "2026-10-02 08:30",
      },
      {
        id: "att-002",
        name: "Phu_luc_Danh_muc_thiet_bi_dia_vat_ly.docx",
        size: 520000,
        url: "#",
        uploadedAt: "2026-10-02 08:30",
      },
    ],
    processHistory: [
      {
        id: "log-001",
        action: "Tiếp nhận văn bản",
        actor: "Trần Thị Mai",
        role: "Văn thư Liên đoàn",
        timestamp: "2026-10-02 08:30",
        note: "Đã vào sổ văn bản đến số 128/TB-BTNMT",
      },
      {
        id: "log-002",
        action: "Phân công xử lý",
        actor: "Phạm Trường Sơn",
        role: "Liên đoàn trưởng",
        timestamp: "2026-10-02 09:15",
        note: "Chỉ đạo Phòng Kỹ thuật chủ trì rà soát hồ sơ kiểm tra.",
      },
      {
        id: "log-003",
        action: "Cập nhật tiến độ",
        actor: "Nguyễn Văn Hùng",
        role: "Trưởng phòng Kỹ thuật",
        timestamp: "2026-10-05 14:00",
        note: "Đã tổng hợp báo cáo an toàn lao động 3 Đoàn Địa vật lý.",
      },
    ],
    createdAt: "2026-10-02T08:30:00.000Z",
    updatedAt: "2026-10-05T14:00:00.000Z",
  },
  {
    id: "doc-in-002",
    documentNumber: "45/QĐ-CĐC",
    releaseDate: "2026-09-28",
    receivedDate: "2026-09-29 10:00",
    summary:
      "Quyết định phê duyệt kế hoạch nghiệm thu khối lượng thăm dò địa vật lý lỗ khoan dự án Tây Bắc đợt 1",
    senderUnit: "Cục Địa chất Việt Nam",
    documentType: "Quyết định",
    urgency: "Khẩn",
    status: "Đã phân công",
    assignedToUnit: "Phòng Kế hoạch - Tài chính",
    assignedToUser: "Lê Thị Ngọc",
    coordinatingUnits: ["Phòng Kỹ thuật - Khối lượng"],
    dueDate: "2026-10-20",
    instruction:
      "Lập kế hoạch tài chính và thành lập Hội đồng nghiệm thu cấp Liên đoàn.",
    attachments: [
      {
        id: "att-003",
        name: "Quyet_dinh_45_CDC_Nghiem_thu_Tay_Bac.pdf",
        size: 2100000,
        url: "#",
        uploadedAt: "2026-09-29 10:00",
      },
    ],
    processHistory: [
      {
        id: "log-004",
        action: "Tiếp nhận văn bản",
        actor: "Trần Thị Mai",
        role: "Văn thư Liên đoàn",
        timestamp: "2026-09-29 10:00",
        note: "Tiếp nhận bản điện tử qua VBĐH",
      },
      {
        id: "log-005",
        action: "Phân công xử lý",
        actor: "Hoàng Minh Tuấn",
        role: "Phó Liên đoàn trưởng",
        timestamp: "2026-09-29 11:30",
        note: "Giao Phòng KH-TC lập phương án tài chính nghiệm thu.",
      },
    ],
    createdAt: "2026-09-29T10:00:00.000Z",
    updatedAt: "2026-09-29T11:30:00.000Z",
  },
  {
    id: "doc-in-003",
    documentNumber: "89/CV-STNMT",
    releaseDate: "2026-10-04",
    receivedDate: "2026-10-05 09:00",
    summary:
      "Công văn đề nghị phối hợp cung cấp dữ liệu bản đồ địa vật lý hàng không khu vực tỉnh Lào Cai",
    senderUnit: "Sở Tài nguyên và Môi trường tỉnh Lào Cai",
    documentType: "Công văn",
    urgency: "Bình thường",
    status: "Mới tiếp nhận",
    assignedToUnit: "",
    assignedToUser: "",
    coordinatingUnits: [],
    dueDate: "2026-10-25",
    instruction: "",
    attachments: [
      {
        id: "att-004",
        name: "Cong_van_89_STNMT_LaoCai.pdf",
        size: 890000,
        url: "#",
        uploadedAt: "2026-10-05 09:00",
      },
    ],
    processHistory: [
      {
        id: "log-006",
        action: "Tiếp nhận văn bản",
        actor: "Trần Thị Mai",
        role: "Văn thư Liên đoàn",
        timestamp: "2026-10-05 09:00",
        note: "Văn bản đến mới, chờ Lãnh đạo Liên đoàn phê duyệt phân công.",
      },
    ],
    createdAt: "2026-10-05T09:00:00.000Z",
    updatedAt: "2026-10-05T09:00:00.000Z",
  },
  {
    id: "doc-in-004",
    documentNumber: "15/TT-PKT",
    releaseDate: "2026-09-20",
    receivedDate: "2026-09-21 14:20",
    summary:
      "Tờ trình đề xuất bảo dưỡng, hiệu chuẩn định kỳ hệ thống máy đo địa chấn nông phân giải cao",
    senderUnit: "Phòng Kỹ thuật Địa vật lý",
    documentType: "Tờ trình",
    urgency: "Khẩn",
    status: "Hoàn thành",
    assignedToUnit: "Phòng Mua sắm - Vật tư",
    assignedToUser: "Phạm Văn Minh",
    coordinatingUnits: ["Phòng Kế hoạch - Tài chính"],
    dueDate: "2026-09-30",
    instruction:
      "Đồng ý chủ trương. Giao Phòng Mua sắm vật tư thực hiện đúng quy trình thẩm định.",
    attachments: [
      {
        id: "att-005",
        name: "To_trinh_15_Hieu_chuan_may_do_dia_chan.pdf",
        size: 1200000,
        url: "#",
        uploadedAt: "2026-09-21 14:20",
      },
    ],
    processHistory: [
      {
        id: "log-007",
        action: "Tiếp nhận văn bản",
        actor: "Trần Thị Mai",
        role: "Văn thư Liên đoàn",
        timestamp: "2026-09-21 14:20",
        note: "Tiếp nhận tờ trình nội bộ",
      },
      {
        id: "log-008",
        action: "Phân công xử lý",
        actor: "Phạm Trường Sơn",
        role: "Liên đoàn trưởng",
        timestamp: "2026-09-21 16:00",
        note: "Phê duyệt chủ trương hiệu chuẩn.",
      },
      {
        id: "log-009",
        action: "Hoàn thành xử lý",
        actor: "Phạm Văn Minh",
        role: "Trưởng phòng Mua sắm - Vật tư",
        timestamp: "2026-09-29 16:30",
        note: "Đã hoàn thành lựa chọn đơn vị kiểm định và ký hợp đồng bảo dưỡng.",
      },
    ],
    createdAt: "2026-09-21T14:20:00.000Z",
    updatedAt: "2026-09-29T16:30:00.000Z",
  },
]

export async function getIncomingDocuments(): Promise<IncomingDocument[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME))
      if (!snap.empty) {
        const list: IncomingDocument[] = []
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<IncomingDocument, "id">) })
        })
        return list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      }
    } catch (error) {
      console.warn("[Firestore] Không thể tải dữ liệu văn bản đến, chuyển sang LocalStorage:", error)
    }
  }

  const localData = readStore<IncomingDocument>(STORAGE_KEY, [])
  if (!localData || localData.length === 0) {
    writeStore(STORAGE_KEY, INITIAL_INCOMING_DOCUMENTS)
    return INITIAL_INCOMING_DOCUMENTS
  }
  return localData.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function addIncomingDocument(
  input: IncomingDocumentInput,
): Promise<IncomingDocument> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const newDoc: IncomingDocument = {
    ...input,
    id: newLocalId("doc-in"),
    status: input.status || "Mới tiếp nhận",
    attachments: input.attachments || [],
    processHistory: [
      {
        id: newLocalId("log"),
        action: "Tiếp nhận văn bản mới",
        actor: "Văn thư Liên đoàn",
        role: "Văn thư",
        timestamp: nowFormatted,
        note: `Tiếp nhận văn bản số ${input.documentNumber} từ ${input.senderUnit}`,
      },
    ],
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, newDoc.id), newDoc)
    } catch (error) {
      console.warn("[Firestore] Không thể lưu văn bản đến:", error)
    }
  }

  const list = readStore<IncomingDocument>(STORAGE_KEY, INITIAL_INCOMING_DOCUMENTS)
  const updated = [newDoc, ...list]
  writeStore(STORAGE_KEY, updated)
  return newDoc
}

export async function assignIncomingDocument(
  id: string,
  assignment: {
    assignedToUnit: string
    assignedToUser: string
    coordinatingUnits?: string[]
    dueDate?: string
    instruction?: string
    actor: string
    role: string
  },
): Promise<IncomingDocument> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getIncomingDocuments()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy văn bản đến.")

  const newLog = {
    id: newLocalId("log"),
    action: "Phân công xử lý",
    actor: assignment.actor || "Lãnh đạo Liên đoàn",
    role: assignment.role || "Lãnh đạo",
    timestamp: nowFormatted,
    note: `Phân công đơn vị chủ trì: ${assignment.assignedToUnit} (${assignment.assignedToUser || "Chưa gán cá nhân"}). Ý kiến: ${assignment.instruction || "Không có"}`,
  }

  const updatedDoc: IncomingDocument = {
    ...target,
    assignedToUnit: assignment.assignedToUnit,
    assignedToUser: assignment.assignedToUser,
    coordinatingUnits: assignment.coordinatingUnits || target.coordinatingUnits || [],
    dueDate: assignment.dueDate || target.dueDate,
    instruction: assignment.instruction || target.instruction,
    status: "Đã phân công",
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        assignedToUnit: updatedDoc.assignedToUnit,
        assignedToUser: updatedDoc.assignedToUser,
        coordinatingUnits: updatedDoc.coordinatingUnits,
        dueDate: updatedDoc.dueDate,
        instruction: updatedDoc.instruction,
        status: updatedDoc.status,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Không thể cập nhật phân công văn bản:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function updateIncomingDocumentStatus(
  id: string,
  status: IncomingDocumentStatus,
  note: string,
  actor: string,
  role: string,
): Promise<IncomingDocument> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getIncomingDocuments()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy văn bản đến.")

  const newLog = {
    id: newLocalId("log"),
    action: `Cập nhật trạng thái: ${status}`,
    actor: actor || "Người xử lý",
    role: role || "Cán bộ chuyên môn",
    timestamp: nowFormatted,
    note: note || `Đã chuyển trạng thái sang ${status}`,
  }

  const updatedDoc: IncomingDocument = {
    ...target,
    status,
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: updatedDoc.status,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Không thể cập nhật trạng thái văn bản:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function resetIncomingDocumentsDemoData(): Promise<IncomingDocument[]> {
  writeStore(STORAGE_KEY, INITIAL_INCOMING_DOCUMENTS)

  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME))
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, COLLECTION_NAME, docSnap.id))
      }
      for (const docItem of INITIAL_INCOMING_DOCUMENTS) {
        await setDoc(doc(db, COLLECTION_NAME, docItem.id), docItem)
      }
    } catch (error) {
      console.warn("[Firestore] Không thể reset dữ liệu trên Firestore:", error)
    }
  }

  return INITIAL_INCOMING_DOCUMENTS
}
