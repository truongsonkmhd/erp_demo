import * as cal from "./seed/calendar.ts"
import * as eq from "./seed/equipment.ts"
import * as ex from "./seed/executive.ts"
import * as hr from "./seed/hr.ts"
import * as org from "./seed/org.ts"
import * as pr from "./seed/projects.ts"
import * as acc from "./seed/accounting.ts"
import * as ct from "./seed/contracts.ts"
import * as fl from "./seed/flows.ts"
import * as kn from "./seed/knowledge.ts"
import * as gv from "./seed/governance.ts"
import * as nw from "./seed/news.ts"
import * as st from "./seed/staff.ts"
import * as da from "./seed/docAssignments.ts"
import * as sc from "./seed/science.ts"
import * as su from "./seed/subUnits.ts"
import * as lg from "./seed/ledger.ts"
import type { AuditEvent } from "./audit.ts"

/**
 * Every Firestore-backed business dataset: collection vldc_<collection>, its seed, and the engine
 * pages that show it (re-rendered in place when the data changes). A "shared" dataset reuses a collection
 * that other screens also own (Firestore name + localStorage key given explicitly; seeding only tops up).
 * An "api" dataset is stored by the Spring backend (/api/vldc/<collection>, MySQL) instead of Firestore.
 */
export const DATASETS = {
  inboxTasks: { collection: "inbox_tasks", seed: ex.inboxTasks, pages: ["action", "dashboard", "today"] },
  commonTasks: { collection: "common_tasks", seed: ex.commonTasks, pages: ["action"] },
  calendarEvents: { collection: "calendar_events", seed: cal.calendarEvents, pages: ["today", "calendar", "dashboard"] },
  plans: { collection: "plans", seed: cal.plans, pages: ["today", "plans"] },
  notices: { collection: "notices", seed: cal.notices, pages: ["notifications", "today", "dashboard"] },
  decisions: { collection: "decisions", seed: ex.decisions, pages: ["command"] },
  meetings: { collection: "meetings", seed: ex.meetings, pages: ["command", "meetings"] },
  strategicGoals: { collection: "strategic_goals", seed: ex.strategicGoals, pages: ["strategy", "command"] },
  initiatives: { collection: "initiatives", seed: ex.initiatives, pages: ["strategy"] },
  risks: { collection: "risks", seed: ex.risks, pages: ["risks", "command", "dashboard", "projects"] },
  orgUnits: { collection: "org_units", seed: org.orgUnits, pages: ["organization", "capability", "units"] },
  orgStats: { collection: "org_stats", seed: org.orgStats, pages: ["organization", "capability", "hr"] },
  digitalAdoption: { collection: "digital_adoption", seed: org.digitalAdoption, pages: ["digital"] },
  equipment: { collection: "equipment", seed: eq.equipment, pages: ["equipment", "equipmentcatalog", "dashboard", "risks"] },
  projects: { collection: "projects", seed: pr.projects, pages: ["projects", "finance", "dashboard"] },
  financeLines: { collection: "finance_lines", seed: pr.financeLines, pages: ["finance"] },
  disbursement: { collection: "disbursement", seed: pr.disbursement, pages: ["finance", "dashboard"] },
  staffSkills: { collection: "staff_skills", seed: hr.staffSkills, pages: ["hr"] },
  contracts: { collection: "contracts", seed: ct.contracts, pages: ["contracts", "receivables", "payables", "accounting", "acctreports"] },
  vouchers: { collection: "vouchers", seed: acc.vouchers, pages: ["vouchers", "ledgers", "reconcile", "accounting", "cashbank"] },
  advances: { collection: "advances", seed: acc.advances, pages: ["advances", "accounting", "acctreports"] },
  bankAccounts: { collection: "bank_accounts", seed: acc.bankAccounts, pages: ["cashbank", "reconcile", "acctreports"] },
  bankLines: { collection: "bank_lines", seed: acc.bankLines, pages: ["cashbank", "reconcile"] },
  fixedAssets: { collection: "fixed_assets", seed: acc.fixedAssets, pages: ["acctassets", "reconcile"] },
  closingTasks: { collection: "closing_tasks", seed: acc.closingTasks, pages: ["closing", "accounting", "acctreports"] },
  cashflow: { collection: "cashflow", seed: acc.cashflow, pages: ["accounting", "acctreports"] },
  handoffs: { collection: "handoffs", seed: fl.handoffs, pages: ["handoff", "crossflow"] },
  incomingDocuments: { collection: "incoming_documents", shared: { firestore: "incoming_documents", local: "erp_incoming_documents_v1" }, seed: fl.incomingDocuments, pages: ["documents", "dashboard"] },
  outgoingDocuments: { collection: "outgoing_documents", shared: { firestore: "outgoing_documents", local: "erp_outgoing_documents_v1" }, seed: fl.outgoingDocuments, pages: ["documents", "dashboard"] },
  dmsFiles: { collection: "dms_files", seed: kn.dmsFiles, pages: ["dms", "datahub", "assistant"] },
  archiveRecords: { collection: "archive_records", seed: kn.archiveRecords, pages: ["archive", "datahub", "assistant"] },
  geoDatasets: { collection: "geo_datasets", seed: kn.geoDatasets, pages: ["geodata", "datahub", "assistant"] },
  importJobs: { collection: "import_jobs", seed: gv.importJobs, pages: ["importdata", "datahub"] },
  migrationBatches: { collection: "migration_batches", seed: gv.migrationBatches, pages: ["migration", "archive"] },
  masterCatalogs: { collection: "master_catalogs", seed: gv.masterCatalogs, pages: ["datahub"] },
  dataQualityRules: { collection: "data_quality_rules", seed: gv.dataQualityRules, pages: ["datahub", "importdata"] },
  alertRules: { collection: "alert_rules", seed: gv.alertRules, pages: ["alerts", "dashboard"] },
  reportCatalog: { collection: "report_catalog", seed: gv.reportCatalog, pages: ["reports"] },
  docTemplates: { collection: "doc_templates", seed: gv.docTemplates, pages: ["generator"] },
  subUnits: { collection: "sub_units", seed: su.subUnits, pages: ["units", "organization", "hr", "performance", "dashboard", "news"] },
  scienceTopics: { collection: "science_topics", seed: sc.scienceTopics, pages: ["research", "action"] },
  docAssignments: { collection: "doc_assignments", seed: da.docAssignments, pages: ["documents", "action", "dashboard"] },
  staffProfiles: { collection: "staff_profiles", seed: st.staffProfiles, pages: ["capability", "hr"] },
  news: { collection: "news", api: true, seed: nw.news, pages: ["news", "dashboard"] },
  debtRecords: { collection: "debt_records", seed: lg.debtRecords, pages: ["debts", "cashin", "cashout", "dashboard"] },
  cashEntries: { collection: "cash_entries", seed: lg.cashEntries, pages: ["cashin", "cashout", "debts", "dashboard", "finance", "acctreports"] },
  auditEvents: { collection: "audit_events", seed: (): AuditEvent[] => [], pages: ["audit"] },
} as const

/** Firestore collection and localStorage key of a dataset, and whether the backend API stores it. */
export function storageOf(key: DatasetKey): { firestore: string; local: string; shared: boolean; api: boolean } {
  const def: { collection: string; api?: boolean; shared?: { firestore: string; local: string } } = DATASETS[key]
  const api = def.api === true
  return def.shared ? { ...def.shared, shared: true, api } : { firestore: `vldc_${def.collection}`, local: `vldc_${def.collection}_v1`, shared: false, api }
}

export type DatasetKey = keyof typeof DATASETS
export type Row<K extends DatasetKey> = ReturnType<(typeof DATASETS)[K]["seed"]>[number]

/** Pages that must re-render when any dataset changes. */
export const DATA_PAGES = new Set<string>(Object.values(DATASETS).flatMap((d) => d.pages))
