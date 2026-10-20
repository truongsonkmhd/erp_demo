import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/config/firebaseConnect";
import { readStore, writeStore, newLocalId } from "@/lib/localStore";
import { WorkflowConfig, WorkflowInput, WorkflowStepConfig } from "@/types/workflow";

const STORAGE_KEY = "erp_workflow_configs_v1";
const COLLECTION_NAME = "workflow_configs";

export const INITIAL_WORKFLOWS: WorkflowConfig[] = [
  {
    id: "wf-001",
    code: "QT-KH-01",
    name: "Quy trình Phê duyệt Hồ sơ Kế hoạch & Dự toán Tổng hợp",
    dossierType: "Kế hoạch",
    department: "Toàn Liên đoàn",
    description:
      "Quy trình chuẩn 5 bước từ Người lập hồ sơ đến Liên đoàn trưởng phê duyệt áp dụng cho các Kế hoạch & Dự toán ngân sách lớn.",
    isActive: true,
    version: "v1.2",
    updatedAt: "2026-10-01T08:00:00.000Z",
    steps: [
      {
        id: "step-101",
        stepNumber: 1,
        stepName: "Khởi tạo & Kiểm tra hồ sơ",
        roleName: "Người lập",
        departmentHint: "Cán bộ chuyên trách",
        slaDays: 1,
        isRequired: true,
        description: "Rà soát tính đầy đủ của biểu mẫu dự toán và căn cứ pháp lý.",
      },
      {
        id: "step-102",
        stepNumber: 2,
        stepName: "Duyệt cấp Đơn vị",
        roleName: "Trưởng đơn vị",
        departmentHint: "Trưởng Phòng / Trưởng Đoàn",
        slaDays: 2,
        isRequired: true,
        description: "Kiểm tra tính khả thi và duyệt đề xuất tại đơn vị.",
      },
      {
        id: "step-103",
        stepNumber: 3,
        stepName: "Thẩm định Chuyên môn",
        roleName: "Phòng chuyên môn",
        departmentHint: "Phòng Kế hoạch - Tài chính",
        slaDays: 3,
        isRequired: true,
        description: "Thẩm định định mức kinh tế kỹ thuật và cân đối nguồn vốn.",
      },
      {
        id: "step-104",
        stepNumber: 4,
        stepName: "Xem xét Ký trình",
        roleName: "Phó Liên đoàn trưởng",
        departmentHint: "Lãnh đạo phụ trách khối",
        slaDays: 2,
        isRequired: true,
        description: "Xem xét phương án trình duyệt và cho ý kiến chỉ đạo.",
      },
      {
        id: "step-105",
        stepNumber: 5,
        stepName: "Phê duyệt Ban hành",
        roleName: "Liên đoàn trưởng",
        departmentHint: "Thủ trưởng cơ quan",
        slaDays: 2,
        isRequired: true,
        description: "Phê duyệt quyết định chính thức và ban hành.",
      },
    ],
  },
  {
    id: "wf-002",
    code: "QT-MS-02",
    name: "Quy trình Phê duyệt Mua sắm & Vật tư Kỹ thuật Địa vật lý",
    dossierType: "Đề nghị mua sắm",
    department: "Phòng Mua sắm - Vật tư",
    description:
      "Luồng 4 bước rút gọn để xử lý nhanh các đề xuất mua sắm linh kiện, vật tư thay thế thiết bị địa vật lý.",
    isActive: true,
    version: "v2.0",
    updatedAt: "2026-09-25T10:30:00.000Z",
    steps: [
      {
        id: "step-201",
        stepNumber: 1,
        stepName: "Lập đề xuất mua sắm",
        roleName: "Người lập",
        departmentHint: "Kỹ thuật viên / Cán bộ vật tư",
        slaDays: 1,
        isRequired: true,
        description: "Tổng hợp danh mục linh kiện, quy cách và 03 báo giá tham khảo.",
      },
      {
        id: "step-202",
        stepNumber: 2,
        stepName: "Duyệt nhu cầu đơn vị",
        roleName: "Trưởng đơn vị",
        departmentHint: "Trưởng phòng Mua sắm - Vật tư",
        slaDays: 1,
        isRequired: true,
        description: "Xác nhận tính cấp thiết và tồn kho vật tư.",
      },
      {
        id: "step-203",
        stepNumber: 3,
        stepName: "Kiểm tra Ngân sách & Định mức",
        roleName: "Phòng chuyên môn",
        departmentHint: "Phòng Kế hoạch - Tài chính",
        slaDays: 2,
        isRequired: true,
        description: "Kiểm tra hạn mức ngân sách mua sắm được phê duyệt.",
      },
      {
        id: "step-204",
        stepNumber: 4,
        stepName: "Phê duyệt mua sắm",
        roleName: "Phó Liên đoàn trưởng",
        departmentHint: "Lãnh đạo phụ trách vật tư",
        slaDays: 2,
        isRequired: true,
        description: "Ký phê duyệt tờ trình mua sắm.",
      },
    ],
  },
  {
    id: "wf-003",
    code: "QT-NT-03",
    name: "Quy trình Phê duyệt Nghiệm thu Khối lượng Địa chất - Địa vật lý",
    dossierType: "Nghiệm thu",
    department: "Phòng Kỹ thuật - Khối lượng",
    description:
      "Nghiệm thu khối lượng thi công thực địa (đo từ trường, địa chấn, địa điện) với sự kiểm tra trực tiếp của Phòng Kỹ thuật.",
    isActive: true,
    version: "v1.0",
    updatedAt: "2026-09-18T14:15:00.000Z",
    steps: [
      {
        id: "step-301",
        stepNumber: 1,
        stepName: "Tổng hợp khối lượng thực tế",
        roleName: "Người lập",
        departmentHint: "Đội trưởng thi công thực địa",
        slaDays: 2,
        isRequired: true,
        description: "Rà soát nhật ký thi công, sơ đồ tuyến đo và số liệu gốc.",
      },
      {
        id: "step-302",
        stepNumber: 2,
        stepName: "Nghiệm thu cơ sở tại Đơn vị",
        roleName: "Trưởng đơn vị",
        departmentHint: "Trưởng Đoàn Địa vật lý",
        slaDays: 2,
        isRequired: true,
        description: "Hội đồng nghiệm thu cơ sở kiểm tra tính đầy đủ của hồ sơ.",
      },
      {
        id: "step-303",
        stepNumber: 3,
        stepName: "Thẩm định Kỹ thuật & Chất lượng",
        roleName: "Phòng chuyên môn",
        departmentHint: "Phòng Kỹ thuật - Khối lượng",
        slaDays: 3,
        isRequired: true,
        description: "Thẩm định sai số kỹ thuật, phương pháp đo và khối lượng đạt chuẩn.",
      },
      {
        id: "step-304",
        stepNumber: 4,
        stepName: "Ký Biên bản Nghiệm thu",
        roleName: "Phó Liên đoàn trưởng",
        departmentHint: "Lãnh đạo phụ trách Kỹ thuật",
        slaDays: 2,
        isRequired: true,
        description: "Ký xác nhận nghiệm thu khối lượng hoàn thành.",
      },
    ],
  },
  {
    id: "wf-004",
    code: "QT-NS-04",
    name: "Quy trình Phê duyệt Nghỉ phép & Đề nghị Nhân sự",
    dossierType: "Nghỉ phép",
    department: "Phòng Tổ chức - Hành chính",
    description:
      "Luồng 3 bước đơn giản hóa thủ tục xin nghỉ phép, nghỉ công tác của cán bộ viên chức Liên đoàn.",
    isActive: true,
    version: "v1.1",
    updatedAt: "2026-08-30T09:00:00.000Z",
    steps: [
      {
        id: "step-401",
        stepNumber: 1,
        stepName: "Nộp đơn xin nghỉ phép",
        roleName: "Người lập",
        departmentHint: "Cán bộ viên chức",
        slaDays: 1,
        isRequired: true,
        description: "Đăng ký thời gian nghỉ phép và người bàn giao công việc.",
      },
      {
        id: "step-402",
        stepNumber: 2,
        stepName: "Duyệt đơn vị trực thuộc",
        roleName: "Trưởng đơn vị",
        departmentHint: "Lãnh đạo phòng/đoàn",
        slaDays: 1,
        isRequired: true,
        description: "Bố trí người thay thế và xác nhận đồng ý nghỉ phép.",
      },
      {
        id: "step-403",
        stepNumber: 3,
        stepName: "Phê duyệt & Chốt sổ phép",
        roleName: "Phòng chuyên môn",
        departmentHint: "Phòng Tổ chức - Hành chính",
        slaDays: 1,
        isRequired: true,
        description: "Cập nhật ngày nghỉ vào hệ thống quản lý nhân sự.",
      },
    ],
  },
  {
    id: "wf-005",
    code: "QT-TB-05",
    name: "Quy trình Điều động Thiết bị & Phương tiện Địa vật lý",
    dossierType: "Điều động thiết bị",
    department: "Phòng Kỹ thuật - Thiết bị",
    description:
      "Quy trình cấp điều động xe chuyên dụng và máy đo địa chấn/địa điện đến các đèo tuyến thi công.",
    isActive: false,
    version: "v1.0",
    updatedAt: "2026-07-12T11:00:00.000Z",
    steps: [
      {
        id: "step-501",
        stepNumber: 1,
        stepName: "Lập kế hoạch điều động",
        roleName: "Người lập",
        departmentHint: "Kỹ sư phụ trách dự án",
        slaDays: 1,
        isRequired: true,
        description: "Xác định mã máy, biển số xe, tuyến đường và danh sách kỹ thuật viên.",
      },
      {
        id: "step-502",
        stepNumber: 2,
        stepName: "Xác nhận tình trạng thiết bị",
        roleName: "Trưởng đơn vị",
        departmentHint: "Trưởng phòng Quản lý Thiết bị",
        slaDays: 1,
        isRequired: true,
        description: "Kiểm tra trạng thái kiểm định và độ sẵn sàng của máy móc.",
      },
      {
        id: "step-503",
        stepNumber: 3,
        stepName: "Phê duyệt lệnh điều động",
        roleName: "Phó Liên đoàn trưởng",
        departmentHint: "Lãnh đạo phụ trách Thiết bị",
        slaDays: 1,
        isRequired: true,
        description: "Ký cấp Lệnh điều động xe và máy đo.",
      },
    ],
  },
];

export async function getWorkflows(): Promise<WorkflowConfig[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        const list: WorkflowConfig[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<WorkflowConfig, "id">) });
        });
        return list.sort((a, b) => a.code.localeCompare(b.code));
      }
    } catch (error) {
      console.warn("[Firestore] Không thể tải danh sách quy trình, dùng LocalStorage:", error);
    }
  }

  const localData = readStore<WorkflowConfig>(STORAGE_KEY, []);
  if (!localData || localData.length === 0) {
    writeStore(STORAGE_KEY, INITIAL_WORKFLOWS);
    return INITIAL_WORKFLOWS;
  }
  return localData.sort((a, b) => a.code.localeCompare(b.code));
}

export async function saveWorkflows(workflows: WorkflowConfig[]): Promise<void> {
  writeStore(STORAGE_KEY, workflows);

  if (db) {
    try {
      for (const item of workflows) {
        await setDoc(doc(db, COLLECTION_NAME, item.id), item);
      }
    } catch (error) {
      console.warn("[Firestore] Không thể lưu danh sách quy trình:", error);
    }
  }
}

export async function addWorkflow(input: WorkflowInput): Promise<WorkflowConfig> {
  const nowStr = new Date().toISOString();
  const newWf: WorkflowConfig = {
    ...input,
    id: newLocalId("wf"),
    updatedAt: nowStr,
  };

  if (db) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, newWf.id), newWf);
    } catch (error) {
      console.warn("[Firestore] Không thể tạo quy trình mới:", error);
    }
  }

  const list = await getWorkflows();
  const updated = [newWf, ...list];
  writeStore(STORAGE_KEY, updated);
  return newWf;
}

export async function updateWorkflow(
  id: string,
  input: Partial<WorkflowInput>
): Promise<WorkflowConfig> {
  const nowStr = new Date().toISOString();
  const list = await getWorkflows();
  const target = list.find((item) => item.id === id);
  if (!target) throw new Error("Không tìm thấy quy trình phê duyệt.");

  const updatedWf: WorkflowConfig = {
    ...target,
    ...input,
    updatedAt: nowStr,
  };

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...input,
        updatedAt: nowStr,
      });
    } catch (error) {
      console.warn("[Firestore] Không thể cập nhật quy trình:", error);
    }
  }

  const updatedList = list.map((item) => (item.id === id ? updatedWf : item));
  writeStore(STORAGE_KEY, updatedList);
  return updatedWf;
}

export async function toggleWorkflowStatus(id: string): Promise<WorkflowConfig> {
  const list = await getWorkflows();
  const target = list.find((item) => item.id === id);
  if (!target) throw new Error("Không tìm thấy quy trình.");

  return updateWorkflow(id, { isActive: !target.isActive });
}

export async function deleteWorkflow(id: string): Promise<void> {
  if (db) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.warn("[Firestore] Không thể xóa quy trình:", error);
    }
  }

  const list = await getWorkflows();
  const updatedList = list.filter((item) => item.id !== id);
  writeStore(STORAGE_KEY, updatedList);
}

export async function resetWorkflowDemoData(): Promise<WorkflowConfig[]> {
  writeStore(STORAGE_KEY, INITIAL_WORKFLOWS);

  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, COLLECTION_NAME, docSnap.id));
      }
      for (const item of INITIAL_WORKFLOWS) {
        await setDoc(doc(db, COLLECTION_NAME, item.id), item);
      }
    } catch (error) {
      console.warn("[Firestore] Không thể reset dữ liệu quy trình:", error);
    }
  }

  return INITIAL_WORKFLOWS;
}
