/** Keyword search across stored records (accent-insensitive), used by the AI workspace and data search. */

export type SearchHit = { source: string; sourceName: string; id: string; title: string; snippet: string; open: [string, string] | null; score: number }

/** One searchable dataset: how to read a record's text and which modal opens it. */
export type SearchSource = {
  source: string
  name: string
  rows: Record<string, unknown>[]
  title: (row: Record<string, unknown>) => string
  text: (row: Record<string, unknown>) => string
  /** Extra words used for matching only (not shown in the snippet). */
  keywords?: string
  open?: string
}

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase()
}

/** Question words that carry no meaning for matching (already accent-free). */
const STOPWORDS = new Set(["tim", "kiem", "cac", "co", "va", "cua", "cho", "nhung", "hien", "dau", "ai", "gi", "nao", "la", "ve", "theo", "trong", "voi", "den", "khi", "nay", "do", "duoc", "can", "hay", "xem", "mot", "nhu", "the", "thi", "con", "dang"])

const tokens = (q: string) => normalize(q).split(/[^a-z0-9-]+/).filter((t) => t.length >= 2 && !STOPWORDS.has(t))

const isCode = (t: string) => /\d/.test(t)

/**
 * Codes (tokens with digits, e.g. "p-12", "hđ-2026-031") must all appear; without a code at least half of the
 * words must match whole words. Score: code 3, word 1, doubled when found in the title, +1 when the
 * accented spelling also matches (so "biển" ranks sea records above "biên bản").
 */
export function searchAll(query: string, sources: SearchSource[], limit = 20): SearchHit[] {
  const qs = tokens(query)
  if (!qs.length) return []
  const codes = qs.filter(isCode)
  const minWords = Math.ceil(qs.length / 2)
  const accented = query.toLowerCase().split(/[^\p{L}\p{N}-]+/u).filter((t) => t.length >= 2)
  const hits: SearchHit[] = []
  for (const s of sources) {
    for (const row of s.rows) {
      const title = s.title(row)
      const nt = normalize(title)
      const body = normalize(`${title} ${s.text(row)} ${s.keywords ?? ""}`)
      const words = new Set(body.split(/[^a-z0-9-]+/))
      const has = (q: string) => (isCode(q) ? body.includes(q) : words.has(q))
      const raw = `${title} ${s.text(row)} ${s.keywords ?? ""}`.toLowerCase()
      if (codes.length ? !codes.every(has) : qs.filter(has).length < minWords) continue
      const score = qs.reduce((n, q) => n + (has(q) ? (isCode(q) ? 3 : 1) * (nt.includes(q) ? 2 : 1) : 0), 0) + accented.filter((t) => raw.includes(t)).length
      const id = String(row.id ?? "")
      hits.push({ source: s.source, sourceName: s.name, id, title, snippet: s.text(row).slice(0, 160), open: s.open ? [s.open, id] : null, score })
    }
  }
  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit)
}
