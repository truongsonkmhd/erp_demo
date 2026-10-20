import { milestone } from "./project";

export type DisbursementItem = {
  id: string;
  description: string;
  amount: number;
  taxRate: number;
};

export type DisbursementRequest = {
  id: string;
  code: string;
  projectId: string;
  projectName?: string;
  period: string;
  items: DisbursementItem[];
  note?: string;
  milestones?: milestone;
  advanceDeduction: number;
  completionPct: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVING" | "APPROVED" | "PAYMENT_ORDERED" | "PAID" | "REJECTED" | "NEED_INFO";
  submittedAt?: string;
  createdAt?: string;
};

export type PlanItem = {
  id: string;
  period: string; // YYYY-MM
  plannedAmount: number;
};
export type BaseDisbursementPlan = {
  id: string;
  projectId: string;
  items: PlanItem[];
};

export type DisbursementPlan = BaseDisbursementPlan & {};

export type DisbursementPlanOnlyProject = BaseDisbursementPlan & {};

