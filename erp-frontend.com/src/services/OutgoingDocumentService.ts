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
  OutgoingDocument,
  OutgoingDocumentInput,
  OutgoingDocumentStatus,
} from "@/types/outgoingDocument"

const STORAGE_KEY = "erp_outgoing_documents_v1"
const COLLECTION_NAME = "outgoing_documents"

export const INITIAL_OUTGOING_DOCUMENTS: OutgoingDocument[] = [
  {
    id: "doc-out-001",
    documentNumber: "78/TB-LĐVLĐC",
    officialNumber: "78/TB-LĐVLĐC",
    summary:
      "Thông báo về việc tổ chức Hội nghị Kỹ thuật Địa vật lý và Khảo sát địa chất toàn Liên đoàn năm 2026",
    documentType: "Thông báo",
    urgency: "Bình thường",
    status: "Đã phát hành",
    draftingUnit: "Văn phòng Liên đoàn",
    drafterName: "Trần Thị Mai",
    approverName: "Phạm Trường Sơn (Liên đoàn trưởng)",
    recipients: "Các Phòng chuyên môn, Đoàn Địa vật lý 1, 2, 3 và các Trung tâm trực thuộc",
    submittedDate: "2026-09-25 09:00",
    signedDate: "2026-09-26 14:30",
    issuedDate: "2026-09-27 08:15",
    attachments: [
      {
        id: "att-out-001",
        name: "TB_78_Hoi_nghi_Ky_thuat_Dia_vat_ly_2026.pdf",
        size: 1850000,
        url: "#",
        uploadedAt: "2026-09-25 09:00",
      },
      {
        id: "att-out-002",
        name: "Chuong_trinh_Hoi_nghi_Chi_tiet.docx",
        size: 640000,
        url: "#",
        uploadedAt: "2026-09-25 09:00",
      },
    ],
    processHistory: [
      {
        id: "log-out-001",
        action: "Tạo bản dự thảo",
        actor: "Trần Thị Mai",
        role: "Chuyên viên Văn phòng",
        timestamp: "2026-09-24 15:00",
        note: "Hoàn thành dự thảo thông báo hội nghị",
      },
      {
        id: "log-out-002",
        action: "Trình ký văn bản",
        actor: "Trần Thị Mai",
        role: "Chuyên viên Văn phòng",
        timestamp: "2026-09-25 09:00",
        note: "Trình Liên đoàn trưởng phê duyệt",
      },
      {
        id: "log-out-003",
        action: "Ký duyệt văn bản (Mô phỏng chữ ký số)",
        actor: "Phạm Trường Sơn",
        role: "Liên đoàn trưởng",
        timestamp: "2026-09-26 14:30",
        note: "Phê duyệt ban hành",
      },
      {
        id: "log-out-004",
        action: "Phát hành văn bản",
        actor: "Văn thư Liên đoàn",
        role: "Văn thư",
        timestamp: "2026-09-27 08:15",
        note: "Đã cấp số 78/TB-LĐVLĐC và phát hành điện tử",
      },
    ],
    createdAt: "2026-09-24T15:00:00.000Z",
    updatedAt: "2026-09-27T08:15:00.000Z",
  },
  {
    id: "doc-out-002",
    documentNumber: "102/TTr-LĐVLĐC",
    officialNumber: "102/TTr-LĐVLĐC",
    summary:
      "Tờ trình đề nghị Cục Địa chất Việt Nam phê duyệt dự toán bổ sung thiết bị khảo sát từ trường lỗ khoan đợt 2",
    documentType: "Tờ trình",
    urgency: "Khẩn",
    status: "Đã ký",
    draftingUnit: "Phòng Kế hoạch - Tài chính",
    drafterName: "Lê Thị Ngọc",
    approverName: "Phạm Trường Sơn (Liên đoàn trưởng)",
    recipients: "Cục Địa chất Việt Nam, Bộ Tài nguyên và Môi trường",
    submittedDate: "2026-10-02 10:30",
    signedDate: "2026-10-03 16:00",
    attachments: [
      {
        id: "att-out-003",
        name: "To_trinh_102_Du_toan_mua_sam_thiet_bi.pdf",
        size: 2400000,
        url: "#",
        uploadedAt: "2026-10-02 10:30",
      },
    ],
    processHistory: [
      {
        id: "log-out-005",
        action: "Tạo bản dự thảo",
        actor: "Lê Thị Ngọc",
        role: "Chuyên viên KH-TC",
        timestamp: "2026-10-01 11:00",
        note: "Soạn thảo tờ trình dự toán mua sắm",
      },
      {
        id: "log-out-006",
        action: "Trình ký văn bản",
        actor: "Nguyễn Văn Hùng",
        role: "Trưởng phòng Kỹ thuật",
        timestamp: "2026-10-02 10:30",
        note: "Đã rà soát danh mục kỹ thuật và trình ký Lãnh đạo",
      },
      {
        id: "log-out-007",
        action: "Ký duyệt văn bản (Mô phỏng chữ ký số)",
        actor: "Phạm Trường Sơn",
        role: "Liên đoàn trưởng",
        timestamp: "2026-10-03 16:00",
        note: "Đã ký số phê duyệt. Chờ văn thư cấp số và phát hành.",
      },
    ],
    createdAt: "2026-10-01T11:00:00.000Z",
    updatedAt: "2026-10-03T16:00:00.000Z",
  },
  {
    id: "doc-out-003",
    documentNumber: "Dự thảo-CV/2026-08",
    summary:
      "Công văn về việc phối hợp cung cấp báo cáo kết quả địa chấn khảo sát nền móng công trình trọng điểm Tây Bắc",
    documentType: "Công văn",
    urgency: "Thượng khẩn",
    status: "Chờ ký",
    draftingUnit: "Phòng Kỹ thuật - Khối lượng",
    drafterName: "Nguyễn Văn Hùng",
    approverName: "Hoàng Minh Tuấn (Phó Liên đoàn trưởng)",
    recipients: "Viện Khoa học Địa chất và Khoáng sản",
    submittedDate: "2026-10-05 08:30",
    attachments: [
      {
        id: "att-out-004",
        name: "Du_thao_Cong_van_Ket_qua_dia_chan_Tay_Bac.docx",
        size: 1100000,
        url: "#",
        uploadedAt: "2026-10-05 08:30",
      },
    ],
    processHistory: [
      {
        id: "log-out-008",
        action: "Tạo bản dự thảo",
        actor: "Nguyễn Văn Hùng",
        role: "Trưởng phòng Kỹ thuật",
        timestamp: "2026-10-04 16:20",
        note: "Khởi tạo công văn trình duyệt",
      },
      {
        id: "log-out-009",
        action: "Trình ký văn bản",
        actor: "Nguyễn Văn Hùng",
        role: "Trưởng phòng Kỹ thuật",
        timestamp: "2026-10-05 08:30",
        note: "Trình Phó Liên đoàn trưởng Hoàng Minh Tuấn xem xét ký duyệt.",
      },
    ],
    createdAt: "2026-10-04T16:20:00.000Z",
    updatedAt: "2026-10-05T08:30:00.000Z",
  },
  {
    id: "doc-out-004",
    documentNumber: "Dự thảo-KH/2026-12",
    summary:
      "Kế hoạch triển khai diễn tập phòng chống thiên tai và tìm kiếm cứu nạn tại các công trường thi công địa vật lý",
    documentType: "Kế hoạch",
    urgency: "Bình thường",
    status: "Dự thảo",
    draftingUnit: "Văn phòng Liên đoàn",
    drafterName: "Trần Thị Mai",
    approverName: "Hoàng Minh Tuấn (Phó Liên đoàn trưởng)",
    recipients: "Các Đoàn Địa vật lý 1, 2, 3 và Đội xe thi công",
    attachments: [
      {
        id: "att-out-005",
        name: "Ke_hoach_PCTT_TKCN_2026_Du_thao.docx",
        size: 780000,
        url: "#",
        uploadedAt: "2026-10-06 14:00",
      },
    ],
    processHistory: [
      {
        id: "log-out-010",
        action: "Tạo bản dự thảo",
        actor: "Trần Thị Mai",
        role: "Chuyên viên Văn phòng",
        timestamp: "2026-10-06 14:00",
        note: "Đang lấy ý kiến đóng góp của các Đoàn Địa vật lý trước khi trình ký.",
      },
    ],
    createdAt: "2026-10-06T14:00:00.000Z",
    updatedAt: "2026-10-06T14:00:00.000Z",
  },
]

export async function getOutgoingDocuments(): Promise<OutgoingDocument[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME))
      if (!snap.empty) {
        const list: OutgoingDocument[] = []
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<OutgoingDocument, "id">) })
        })
        return list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      }
    } catch (error) {
      console.warn("[Firestore] Không thể tải dữ liệu văn bản đi, chuyển sang LocalStorage:", error)
    }
  }

  const localData = readStore<OutgoingDocument>(STORAGE_KEY, [])
  if (!localData || localData.length === 0) {
    writeStore(STORAGE_KEY, INITIAL_OUTGOING_DOCUMENTS)
    return INITIAL_OUTGOING_DOCUMENTS
  }
  return localData.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function addOutgoingDocument(
  input: OutgoingDocumentInput,
): Promise<OutgoingDocument> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const newDoc: OutgoingDocument = {
    ...input,
    id: newLocalId("doc-out"),
    status: input.status || "Dự thảo",
    attachments: input.attachments || [],
    processHistory: [
      {
        id: newLocalId("log"),
        action: "Tạo bản dự thảo mới",
        actor: input.drafterName || "Người soạn thảo",
        role: "Cán bộ soạn thảo",
        timestamp: nowFormatted,
        note: `Khởi tạo dự thảo văn bản đi: ${input.summary}`,
      },
    ],
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, newDoc.id), newDoc)
    } catch (error) {
      console.warn("[Firestore] Không thể lưu văn bản đi:", error)
    }
  }

  const list = readStore<OutgoingDocument>(STORAGE_KEY, INITIAL_OUTGOING_DOCUMENTS)
  const updated = [newDoc, ...list]
  writeStore(STORAGE_KEY, updated)
  return newDoc
}

export async function submitOutgoingDocumentForSignature(
  id: string,
  approverName: string,
  note?: string,
): Promise<OutgoingDocument> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getOutgoingDocuments()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy văn bản đi.")

  const newLog = {
    id: newLocalId("log"),
    action: "Trình ký văn bản",
    actor: target.drafterName || "Cán bộ trình ký",
    role: "Người soạn thảo",
    timestamp: nowFormatted,
    note: note || `Trình ký tới Lãnh đạo xem xét phê duyệt: ${approverName}`,
  }

  const updatedDoc: OutgoingDocument = {
    ...target,
    approverName: approverName || target.approverName,
    submittedDate: nowFormatted,
    status: "Chờ ký",
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        approverName: updatedDoc.approverName,
        submittedDate: updatedDoc.submittedDate,
        status: updatedDoc.status,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Lỗi khi trình ký văn bản đi:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function signOutgoingDocument(
  id: string,
  note?: string,
): Promise<OutgoingDocument> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getOutgoingDocuments()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy văn bản đi.")

  const newLog = {
    id: newLocalId("log"),
    action: "Ký duyệt văn bản (Mô phỏng chữ ký số)",
    actor: target.approverName || "Lãnh đạo Liên đoàn",
    role: "Lãnh đạo phê duyệt",
    timestamp: nowFormatted,
    note: note || "Đã phê duyệt và ký duyệt văn bản điện tử thành công.",
  }

  const updatedDoc: OutgoingDocument = {
    ...target,
    signedDate: nowFormatted,
    status: "Đã ký",
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        signedDate: updatedDoc.signedDate,
        status: updatedDoc.status,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Lỗi khi ký duyệt văn bản đi:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function issueOutgoingDocument(
  id: string,
  officialNumber: string,
  note?: string,
): Promise<OutgoingDocument> {
  const nowStr = new Date().toISOString()
  const nowFormatted = new Date().toLocaleString("vi-VN")

  const docs = await getOutgoingDocuments()
  const target = docs.find((item) => item.id === id)
  if (!target) throw new Error("Không tìm thấy văn bản đi.")

  const numToSet = officialNumber.trim() || target.documentNumber

  const newLog = {
    id: newLocalId("log"),
    action: "Phát hành văn bản",
    actor: "Văn thư Liên đoàn",
    role: "Văn thư",
    timestamp: nowFormatted,
    note: note || `Đã cấp số chính thức ${numToSet} và phát hành đến nơi nhận.`,
  }

  const updatedDoc: OutgoingDocument = {
    ...target,
    documentNumber: numToSet,
    officialNumber: numToSet,
    issuedDate: nowFormatted,
    status: "Đã phát hành",
    processHistory: [newLog, ...target.processHistory],
    updatedAt: nowStr,
  }

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        documentNumber: updatedDoc.documentNumber,
        officialNumber: updatedDoc.officialNumber,
        issuedDate: updatedDoc.issuedDate,
        status: updatedDoc.status,
        processHistory: updatedDoc.processHistory,
        updatedAt: updatedDoc.updatedAt,
      })
    } catch (error) {
      console.warn("[Firestore] Lỗi khi phát hành văn bản đi:", error)
    }
  }

  const updatedList = docs.map((item) => (item.id === id ? updatedDoc : item))
  writeStore(STORAGE_KEY, updatedList)
  return updatedDoc
}

export async function resetOutgoingDocumentsDemoData(): Promise<OutgoingDocument[]> {
  writeStore(STORAGE_KEY, INITIAL_OUTGOING_DOCUMENTS)

  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME))
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, COLLECTION_NAME, docSnap.id))
      }
      for (const docItem of INITIAL_OUTGOING_DOCUMENTS) {
        await setDoc(doc(db, COLLECTION_NAME, docItem.id), docItem)
      }
    } catch (error) {
      console.warn("[Firestore] Không thể reset dữ liệu văn bản đi trên Firestore:", error)
    }
  }

  return INITIAL_OUTGOING_DOCUMENTS
}
