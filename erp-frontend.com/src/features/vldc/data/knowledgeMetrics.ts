import { addDays } from "./dates.ts"
import type { ArchiveRecord, DmsFile, GeoDataset, ImportJob, MasterCatalog, MigrationBatch } from "./types.ts"

/** Headline figures for document, archive and data-governance pages, computed from stored records. */

const sum = <T>(rows: T[], pick: (r: T) => number) => rows.reduce((s, r) => s + pick(r), 0)
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

export function dmsMetrics(files: DmsFile[], today: string) {
  return {
    files: files.length,
    projects: new Set(files.map((f) => f.projectId)).size,
    recent: files.filter((f) => f.updatedAt >= addDays(today, -30)).length,
    checkedOut: files.filter((f) => f.checkedOutBy).length,
    untagged: files.filter((f) => f.tags.length === 0).length,
    versions: sum(files, (f) => f.version),
  }
}

export function folderCounts(files: DmsFile[], projectId: string, folders: string[]) {
  return folders.map((folder) => ({ folder, count: files.filter((f) => f.projectId === projectId && f.folder === folder).length }))
}

export function archiveMetrics(records: ArchiveRecord[]) {
  return {
    records: records.length,
    docs: sum(records, (r) => r.docs),
    digitised: records.filter((r) => r.status === "Đã số hóa").length,
    metadataPct: records.length ? Math.round(sum(records, (r) => r.metadataPct) / records.length) : 0,
  }
}

export function geoMetrics(sets: GeoDataset[]) {
  return {
    sets: sets.length,
    sizeTb: Math.round((sum(sets, (s) => s.sizeGb) / 1024) * 100) / 100,
    backupPct: pct(sets.filter((s) => s.backup).length, sets.length),
    restricted: sets.filter((s) => s.access !== "Nội bộ" && s.access !== "Dự án").length,
  }
}

export const MIGRATION_STAGES = [
  { key: "scanned", label: "Scan" },
  { key: "indexed", label: "Metadata" },
  { key: "validated", label: "Validation" },
  { key: "migrated", label: "Chuyển đổi" },
] as const

export function migrationMetrics(batches: MigrationBatch[]) {
  const total = sum(batches, (b) => b.total)
  return {
    total,
    stages: MIGRATION_STAGES.map((s) => ({ label: s.label, done: sum(batches, (b) => b[s.key]), pct: pct(sum(batches, (b) => b[s.key]), total) })),
    issues: batches.flatMap((b) => b.issues.map((i) => ({ unit: b.unit, issue: i }))),
  }
}

export function importMetrics(jobs: ImportJob[]) {
  const rows = sum(jobs, (j) => j.rows)
  return { jobs: jobs.length, rows, errors: sum(jobs, (j) => j.errors), okPct: pct(sum(jobs, (j) => j.ok), rows), pending: jobs.filter((j) => j.errors > 0 && j.status !== "Hoàn thành").length }
}

export function catalogMetrics(catalogs: MasterCatalog[]) {
  return { catalogs: catalogs.length, entries: sum(catalogs, (c) => c.count), reviewing: catalogs.filter((c) => c.status !== "Đã chuẩn hóa").length }
}
