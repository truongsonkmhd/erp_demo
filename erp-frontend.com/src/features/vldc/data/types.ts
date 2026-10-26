/** Records of the VLDC business collections in Firestore (one collection per type, keyed by id). */

export type Scope = "federation" | "unit" | "project" | "personal"

/** One step in a task's trail: at "yyyy-mm-ddTHH:MM", by a role code or a unit/person label. */
export type TaskStep = { at: string; by: string; action: string; note?: string }
export type InboxTask = {
  id: string; type: string; title: string; source: string; sourcePage: string; owner: string; cc: string[]
  priority: string; status: string; sla: string; overdue: boolean; from: string; project: string; next: string
  history: TaskStep[]
  /** Due date "yyyy-mm-dd"; SLA and overdue are computed from it (sla/overdue are kept for older records). */
  due?: string
}
export type CommonTask = { id: string; title: string; scope: string; owner: string; due: string; status: string; link: string }

/** date "dd/mm/yyyy", time "HH:MM". */
export type CalendarEvent = {
  id: string; date: string; time: string; title: string; scope: Scope; unit: string; project: string; owner: string; link: string; note: string
  /** Tổ/phòng (SubUnit id) inside `unit` when the entry is for one tổ. */
  subUnit?: string
}
export type Plan = {
  id: string; level: string; scope: Scope; title: string; period: string; owner: string; progress: number; status: string
  parent: string; items: string[]; unit?: string; subUnit?: string; project?: string; ownerRole?: string
}
/** readBy: role codes that have opened the notice. */
export type Notice = {
  id: string; scope: Scope; title: string; body: string; time: string; priority: string; readBy: string[]; link: string
  unit?: string; subUnit?: string; project?: string; ownerRole?: string
}

export type Decision = { id: string; title: string; unit: string; severity: string; due: string; source: string; open: boolean }
/** date "dd/mm/yyyy"; status "Sắp diễn ra" | "Đã chuẩn bị" | "Đã kết thúc". */
/** A meeting conclusion; taskId is set once it has been issued as an inbox task. */
export type Conclusion = { text: string; ownerRole: string; due: string; taskId?: string }
export type Meeting = {
  id: string; date: string; title: string; time: string; scope: string; status: string; agenda: number; docs: number
  actions: number; openConclusions: number; conclusions: Conclusion[]
}
/** owner: unit name, or "Tổ … – unit" when subUnit is set. */
export type StrategicGoal = { id: string; goal: string; owner: string; target: string; actual: number; weight: number; subUnit?: string }
export type Initiative = { id: string; name: string; progress: number }
/** probability/impact on a 1–5 scale. */
export type Risk = {
  id: string; title: string; owner: string; probability: number; impact: number; mitigation: string; open: boolean; project?: string; subUnit?: string
}

export type OrgUnit = { id: string; name: string; type: string; leader: string; deputy?: string; staff: string; staffCount: number; mission: string; public: boolean }
export type OrgStats = {
  id: string; total: number; doctor: number; master: number; engineerBachelor: number; technicianWorker: number
  under5: number; from5to15: number; over15: number
}
export type ResearchProject = {
  id: string; title: string; owner: string; lead: string; stage: string; gate: string; progress: number; budget: number
  trl: number; product: string; risk: string; applied: boolean
}
export type DigitalAdoption = {
  id: string; unit: string; usage: number; interaction: number; process: number; data: number; adapt: number; effect: number; ai: number; score: number
}

/** inspectionDue "yyyy-mm-dd"; repairCost in million VND. */
export type Equipment = {
  id: string; name: string; quantity: number; year: string; condition: string; group: string; unit: string
  status: string; utilization: number; inspectionDue: string; repairCost: number
}
/** A WBS item: dates "yyyy-mm-dd", subUnit = tổ doing it; weight (% of the project) and tasks are computed from its assigned work. */
export type WbsItem = {
  id?: string; name: string; progress: number; status: string; weight?: number; start?: string; end?: string; subUnit?: string
  /** Computed: root work items assigned to this item (its progress then comes from them). */
  linkedWork?: number
  /** Computed: all work items of this item, sub-tasks included. */
  tasks?: number
}
export type Milestone = { id: string; name: string; due: string; doneAt?: string }
export type ChangeRequestKind = "Phạm vi" | "Ngân sách" | "Thời gian"
export type ChangeRequestStatus = "Chờ duyệt" | "Đã duyệt" | "Từ chối"
/** newEnd / newBudget (billion VND) apply when a Thời gian / Ngân sách request is approved. */
export type ChangeRequest = {
  id: string; kind: ChangeRequestKind; content: string; by: string; at: string; status: ChangeRequestStatus
  newEnd?: string; newBudget?: number; decidedAt?: string; note?: string
}
export type ProjectStatus = "Chuẩn bị" | "Đang thực hiện" | "Tạm dừng" | "Nghiệm thu" | "Hoàn thành"
export type ProjectLogEntry = { at: string; by: string; byName: string; note: string; changes: { name: string; from: number; to: number }[] }
/**
 * A project as stored. budget in billion VND; unit is the unit name. Records created before projects were
 * editable have no dates and carry their figures (technical, costUsed, …) directly.
 */
export type StoredProject = {
  id: string; name: string; unit: string; subUnit?: string; leadRole?: string; budget: number; start?: string; end?: string
  status?: ProjectStatus; wbs: WbsItem[]; milestones?: Milestone[]; crs?: ChangeRequest[]; log?: ProjectLogEntry[]
  technical?: number; costUsed?: number; delayDays?: number; upcomingMilestones?: number; changeRequests?: number; changeRequestsPending?: number
  /** Units (codes) that support the main unit (`unit`); they see the project and note on its tasks once it is approved. */
  coUnits?: string[]
  /** The federation head's decision; records from before approvals existed have none and count as approved. */
  approval?: ProjectApproval; approvalNote?: string; decidedAt?: string
  /** Role that created the project (Phòng Kỹ thuật); only it may delete the project. */
  createdBy?: string
  /** The creator's request to delete the project, waiting for the federation head to confirm. */
  deleteRequest?: { by: string; at: string; reason: string }
  /** Why the federation head kept the project the last time its deletion was asked for. */
  deleteRefusal?: string
  /** Soft delete: hidden everywhere, kept for the audit trail. */
  deletedAt?: string; deletedBy?: string
}
export type ProjectApproval = "Chờ duyệt" | "Đã duyệt" | "Từ chối"
/** A project with its figures computed from WBS, finance lines, payments and dates (see projectCore). */
export type Project = StoredProject & {
  technical: number; costUsed: number; delayDays: number; upcomingMilestones: number; changeRequests: number; changeRequestsPending: number
  /** % of the schedule elapsed today; null without dates. */
  plannedPct: number | null
  /** Billion VND paid so far. */
  spent: number
  overdueWbs: number
  /** Work assigned to the project: still open, past due, reported and waiting for approval. */
  workOpen: number; workOverdue: number; workPending: number
}
/** Amounts in million VND; posted = hạch toán, acceptedPct = khối lượng đã nghiệm thu (%). */
export type FinanceLine = {
  id: string; source: string; project: string; item: string; unit: string; budget: number; committed: number; paid: number
  posted: number; acceptedPct: number
}
/** Cumulative billion VND per month of the year; actual is null for months not reached yet. */
export type Disbursement = { id: string; month: number; plan: number; actual: number | null }
/** Skill levels 1–5; certExpiry "yyyy-mm-dd". */
export type StaffSkill = {
  id: string; name: string; unit: string; geophysics: number; gis: number; data: number; pm: number; onField: boolean; certExpiry: string
}

/** Amounts in million VND; dates "yyyy-mm-dd". kind "thu" = receivable contract, "chi" = payable. */
export type ContractMilestone = { name: string; value: number; invoiced: number; paid: number; due: string }
export type Contract = {
  id: string; kind: "thu" | "chi"; party: string; name: string; value: number; projectId: string; stage: string
  nextObligation: string; risk: string; obligations: string[]; milestones: ContractMilestone[]
}
export type Voucher = {
  id: string; date: string; type: string; counterparty: string; projectId: string; amount: number; status: string
  fundSource: string; workItemId?: string; contractId?: string; note?: string
}
export type Advance = { id: string; person: string; projectId: string; amount: number; returned: number; due: string; missingInvoice: boolean }
export type BankAccount = { id: string; name: string; erpBalance: number; statementBalance: number }
export type BankLine = { id: string; date: string; text: string; amount: number; suggestedVoucherId?: string; confidence: number; matchedVoucherId?: string }
export type FixedAsset = { id: string; name: string; equipmentId?: string; cost: number; nbv: number; unit: string; source: string; status: string }
export type ClosingTask = { id: string; period: string; item: string; owner: string; done: boolean; note: string }
/** Billion VND. */
export type CashflowMonth = { id: string; month: string; inflow: number; outflow: number }
export type Handoff = { id: string; ref: string; from: string; to: string; condition: string; slaHours: number; status: string; workItemId?: string }

/** DMS file metadata (no binary); updatedAt "yyyy-mm-dd". */
export type DmsFile = {
  id: string; projectId: string; folder: string; name: string; format: string; version: number; updatedAt: string
  author: string; status: string; checkedOutBy?: string; tags: string[]
}
export type ArchiveRecord = {
  id: string; name: string; year: number; unit: string; type: string; docs: number; metadataPct: number
  paperLocation: string; status: string; structure: string[]; access: string
}
export type GeoDataset = {
  id: string; name: string; type: string; projectId: string; sizeGb: number; storageUri: string; access: string
  checksum: string; backup: boolean; lastAccess: string[]
}
export type ImportJob = { id: string; source: string; type: string; rows: number; ok: number; errors: number; runner: string; at: string; status: string }
/** weeklyRate: dossiers converted per week, used for the completion forecast. */
export type MigrationBatch = { id: string; unit: string; total: number; scanned: number; indexed: number; validated: number; migrated: number; weeklyRate: number; issues: string[] }
export type MasterCatalog = { id: string; name: string; count: number; owner: string; status: string; lastReview: string }
export type DataQualityRule = { id: string; rule: string; scope: string; violations: number; owner: string; status: string }
/** threshold: % for cost, days for the others. */
export type AlertRule = { id: string; name: string; metric: "cost" | "deadline" | "calibration" | "debt"; threshold: number; level: string; enabled: boolean }
export type ReportDef = { id: string; group: string; name: string; source: string; schedule: string; recipients: string; lastRun: string }
export type DocTemplate = { id: string; type: string; title: string; target: "project" | "contract" | "equipment"; body: string }

export type NewsKind = "Tin tức" | "Sự kiện" | "Thông báo nội bộ"
export type NewsStatus = "Nháp" | "Đã đăng" | "Đã gỡ"
/** Bảng tin post. audience: "ALL" or a UnitCode (data/org.ts); body is plain text, paragraphs split by blank lines. */
export type NewsPost = {
  id: string; kind: NewsKind; title: string; summary: string; body: string; audience: string; pinned: boolean; status: NewsStatus
  authorRole: string; authorName: string; publishedAt?: string; updatedAt: string
  /** Only for "Sự kiện"; date "yyyy-mm-dd". */
  event?: { date: string; time: string; location: string }
}

export type Education = "Tiến sĩ" | "Thạc sĩ" | "Kỹ sư/Cử nhân" | "KTV/Công nhân"
/** Public staff profile for the capability page; unit is a UnitCode, cert expiry "yyyy-mm-dd", experience in years. */
export type StaffProfile = {
  id: string; name: string; birthYear: number; education: Education; major: string; experience: number
  unit: string; title: string; certs: { name: string; expiry: string }[]; onField: boolean
  /** SubUnit id inside the unit. */
  subUnit?: string
}

export type ReplyResult = "Hoàn thành" | "Cần thêm thời gian" | "Không thuộc thẩm quyền"
export type AssignmentReply = { result: ReplyResult; text: string; attachments: string[]; at: string }
export type AssignmentRecipient = { role: string; seenAt?: string; remindedAt?: string; reply?: AssignmentReply }
/** A phiếu giao: an incoming document handed to several roles, each replying on its own. Attachments are file names / DMS names. */
export type DocAssignment = {
  id: string; docId: string; docNumber: string; docSummary: string; instruction: string; due: string; attachments: string[]
  assignedBy: string; assignedByName: string; createdAt: string; closedAt?: string; recipients: AssignmentRecipient[]
}

export type TopicStatus = "Đang triển khai" | "Chờ duyệt" | "Đã triển khai"
export type TopicReviewDecision = "Duyệt" | "Trả lại"
export type TopicProgressLog = { at: string; by: string; byName: string; progress: number; note: string }
/** Đề tài khoa học & đổi mới. unit is a UnitCode; budget/spent in million VND; dates "yyyy-mm-dd"; attachments are file names. */
export type ScienceTopic = {
  id: string; title: string; field: string; unit: string; objective: string; leadRole: string; leadName: string; members: string[]
  start: string; end: string; budget: number; spent: number; attachments: string[]; progress: number; log: TopicProgressLog[]
  status: TopicStatus; result?: string; impact?: string; submittedAt?: string; approvedAt?: string
  review?: { by: string; at: string; decision: TopicReviewDecision; note: string }; createdAt: string
  /** Tổ/phòng (SubUnit id) inside `unit` running the topic; "" = the whole unit. */
  subUnit?: string
}

export type SubUnitKind = "Phòng" | "Tổ" | "Đội" | "Xưởng" | "Bộ phận"
/** Tổ/phòng inside a unit (unit is a UnitCode); headId is a StaffProfile id. Dissolved ones stay with active=false. */
export type SubUnit = {
  id: string; unit: string; name: string; kind: SubUnitKind; duty: string; headId?: string; active: boolean; createdAt: string; dissolvedAt?: string
}

/** One payment of a project contract: amount in VND (đồng), date "yyyy-mm-dd". */
export type DebtInstallment = { amount: number; date: string }
/**
 * Bảng công nợ dự án kept by the accountants: amount is the contract value in VND, installments are the payments
 * received so far (lần 1, lần 2, …). Removed rows stay with deleted=true (collections have no delete).
 */
export type DebtRecord = {
  id: string; contractNo: string; projectName: string; projectId?: string; content: string; amount: number
  installments: DebtInstallment[]; done: boolean; createdBy: string; createdAt: string; updatedAt?: string; deleted?: boolean
}
/** Phiếu thu / phiếu chi entered by the accountants; amount in VND, date "yyyy-mm-dd". debtId links it to a project contract. */
export type CashEntry = {
  id: string; kind: "thu" | "chi"; date: string; content: string; counterparty: string; amount: number; method: string
  debtId?: string; createdBy: string; createdAt: string; deleted?: boolean
}
