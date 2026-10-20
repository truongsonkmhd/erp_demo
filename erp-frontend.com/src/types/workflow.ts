import { DOSSIER_TYPES } from "./dossier";

export const WORKFLOW_ROLES = [
  "Người lập",
  "Trưởng đơn vị",
  "Phòng chuyên môn",
  "Phó Liên đoàn trưởng",
  "Liên đoàn trưởng",
  "Văn thư Liên đoàn",
] as const;

export type WorkflowRole = (typeof WORKFLOW_ROLES)[number];

export interface WorkflowStepConfig {
  id: string;
  stepNumber: number;
  stepName: string;
  roleName: WorkflowRole | string;
  departmentHint?: string;
  slaDays: number;
  isRequired: boolean;
  description?: string;
}

export interface WorkflowConfig {
  id: string;
  code: string; // e.g. "QT-KH-01"
  name: string; // e.g. "Quy trình Phê duyệt Hồ sơ Kế hoạch & Dự toán"
  dossierType: string; // Áp dụng cho loại hồ sơ nào
  department: string; // e.g. "Toàn Liên đoàn", "Phòng Kỹ thuật", ...
  description: string;
  isActive: boolean; // Bật / Tắt quy trình
  version: string;
  updatedAt: string;
  steps: WorkflowStepConfig[];
}

export type WorkflowInput = Omit<WorkflowConfig, "id" | "updatedAt">;
