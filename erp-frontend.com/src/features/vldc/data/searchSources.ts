import { vnDate } from "./dates.ts"
import type { SearchSource } from "./search.ts"
import type {
  Advance, ArchiveRecord, Contract, DmsFile, Equipment, FixedAsset, GeoDataset, Project, Risk, StaffSkill, Voucher,
} from "./types.ts"
import type { IncomingDocument } from "../../../types/incomingDocument.ts"
import type { OutgoingDocument } from "../../../types/outgoingDocument.ts"

/** Records the search can see, grouped as in the AI workspace source picker (aiSourceDefs ids). */
export type SearchData = {
  dmsFiles: DmsFile[]; incomingDocuments: IncomingDocument[]; outgoingDocuments: OutgoingDocument[]; staffSkills: StaffSkill[]
  equipment: Equipment[]; fixedAssets: FixedAsset[]; projects: Project[]; risks: Risk[]; contracts: Contract[]
  vouchers: Voucher[]; advances: Advance[]; archiveRecords: ArchiveRecord[]; geoDatasets: GeoDataset[]
}

type Row = Record<string, unknown>
const s = (v: unknown) => (v == null ? "" : Array.isArray(v) ? v.join(" ") : String(v))
const src = <T>(source: string, name: string, rows: T[], title: (r: T) => string, text: (r: T) => string, open?: string, keywords?: string): SearchSource =>
  ({ source, name, rows: rows as Row[], title: title as (r: Row) => string, text: text as (r: Row) => string, open, keywords })

export function searchSources(data: SearchData, groups: string[]): SearchSource[] {
  const all: Record<string, SearchSource[]> = {
    docs: [
      src("dms", "DMS", data.dmsFiles, (f) => f.name, (f) => `${f.id} ${f.projectId} ${f.folder} ${f.format} v${f.version} ${f.author} ${s(f.tags)} ${f.status}`, "openDmsFile"),
      src("incoming", "Văn bản đến", data.incomingDocuments, (d) => `${d.documentNumber} • ${d.summary}`, (d) => `${d.senderUnit} ${d.documentType} ${d.status} ${s(d.assignedToUser)} ${s(d.instruction)}`, "documentDetail"),
      src("outgoing", "Văn bản đi", data.outgoingDocuments, (d) => `${d.officialNumber || d.documentNumber} • ${d.summary}`, (d) => `${d.draftingUnit} ${d.documentType} ${d.status} ${d.approverName}`, "documentDetail"),
    ],
    hr: [src("staff", "Nhân sự", data.staffSkills, (p) => p.name, (p) => `${p.unit} • ĐVL ${p.geophysics} • GIS ${p.gis} • dữ liệu ${p.data} • QLDA ${p.pm} • chứng chỉ đến ${vnDate(p.certExpiry)}${p.gis >= 4 ? " • chuyên gia GIS" : ""}${p.onField ? " • đang ở hiện trường" : ""}`, undefined, "cán bộ nhân sự chứng chỉ địa vật lý xử lý quản lý dự án")],
    equipment: [
      src("equipment", "Thiết bị", data.equipment, (e) => `${e.id} • ${e.name}`, (e) => `${e.group} • ${e.unit} • ${e.status} • kiểm định ${vnDate(e.inspectionDue)}`, "equipmentDetail", "máy thiết bị"),
      src("asset", "Tài sản kế toán", data.fixedAssets, (a) => `${a.id} • ${a.name}`, (a) => `${s(a.equipmentId)} ${a.unit} ${a.status} ${a.source}`, "assetAccountingDetail"),
    ],
    projects: [
      src("project", "Dự án", data.projects, (p) => `${p.id} • ${p.name}`, (p) => `${p.unit} tiến độ ${p.technical}% chi phí ${p.costUsed}%${p.delayDays ? ` chậm ${p.delayDays} ngày` : ""} ${(p.wbs ?? []).map((w) => w.name).join(" ")}`, "projectDetail"),
      src("risk", "Rủi ro", data.risks, (r) => `${r.id} • ${r.title}`, (r) => `${r.owner} ${s(r.project)} ${r.mitigation}`),
    ],
    contracts: [src("contract", "Hợp đồng", data.contracts, (c) => `${c.id} • ${c.name}`, (c) => `${c.kind === "thu" ? "Phải thu" : "Phải trả"} • ${c.party} • ${c.projectId} • ${c.stage} • ${c.nextObligation} • rủi ro ${c.risk}`, "contractDetail", "hợp đồng công nợ")],
    accounting: [
      src("voucher", "Chứng từ", data.vouchers, (v) => `${v.id} • ${v.type} ${v.counterparty}`, (v) => `${v.projectId} ${s(v.contractId)} ${s(v.workItemId)} ${v.status} ${s(v.note)}`, "voucherDetail"),
      src("advance", "Tạm ứng", data.advances, (a) => `${a.id} • Tạm ứng ${a.person}`, (a) => `${a.projectId}${a.missingInvoice ? " thiếu hóa đơn" : ""}`, "advanceDetail"),
    ],
    archive: [src("archive", "Kho lưu trữ", data.archiveRecords, (r) => `${r.id} • ${r.name}`, (r) => `${r.year} ${r.unit} ${r.type} ${r.status} ${r.paperLocation} ${s(r.structure)}`, "archiveDetail")],
    geo: [src("geo", "Geo Data", data.geoDatasets, (g) => `${g.id} • ${g.name}`, (g) => `${g.type} ${g.projectId} ${g.storageUri} ${g.access}`, "geoDetail")],
  }
  return groups.flatMap((g) => all[g] ?? [])
}

export const ALL_SEARCH_GROUPS = ["docs", "hr", "equipment", "projects", "contracts", "accounting", "archive", "geo"]
