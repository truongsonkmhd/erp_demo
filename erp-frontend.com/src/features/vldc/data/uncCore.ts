/**
 * Ủy nhiệm chi BIDV (public/uy-nhiem-chi-bidv.xlsx): the bank's own Excel form, filled in place so its frame, logo and
 * signature boxes stay as printed by the bank. Number, date, amounts and words sit in the drawing's text boxes;
 * account details and remarks are sheet cells.
 */

export type UncData = {
  number: string
  /** yyyy-mm-dd */
  date: string
  /** VND */
  amount: number
  payerName: string
  payerAccount: string
  beneficiary: string
  beneficiaryAccount: string
  beneficiaryBank: string
  idNo: string
  idDate: string
  idPlace: string
  remarks: string
}

export type UncFiles = { drawing: string; sheet: string }

const DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
const SCALES = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ"]

/** One group of three digits; full = a lower group, which always says its hundreds ("không trăm …"). */
function groupWords(n: number, full: boolean): string[] {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10
  const out: string[] = []
  if (h || full) out.push(DIGITS[h], "trăm")
  if (t === 0) {
    if (u) out.push(...(h || full ? ["linh"] : []), DIGITS[u])
  } else if (t === 1) {
    out.push("mười")
    if (u) out.push(u === 5 ? "lăm" : DIGITS[u])
  } else {
    out.push(DIGITS[t], "mươi")
    if (u) out.push(u === 1 ? "mốt" : u === 4 ? "tư" : u === 5 ? "lăm" : DIGITS[u])
  }
  return out
}

/** 680000000 → "Sáu trăm tám mươi triệu đồng chẵn" (chẵn when there are no units below a thousand). */
export function vndInWords(amount: number): string {
  const n = Math.round(Math.abs(amount))
  if (!n) return "Không đồng"
  const groups: number[] = []
  for (let x = n; x > 0; x = Math.floor(x / 1000)) groups.push(x % 1000)
  const words: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    if (!groups[i]) continue
    words.push(...groupWords(groups[i], i < groups.length - 1))
    if (SCALES[i]) words.push(SCALES[i])
  }
  const text = `${words.join(" ")} đồng${n % 1000 === 0 ? " chẵn" : ""}`
  return text[0].toUpperCase() + text.slice(1)
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const vnDay = (iso: string) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "")
/** Bank forms write figures with commas: 680,000,000. */
const figures = (n: number) => Math.round(n).toLocaleString("en-US")
const colNum = (ref: string) => ref.replace(/\d+/g, "").split("").reduce((s, ch) => s * 26 + ch.charCodeAt(0) - 64, 0)

/** Writes text into a cell (keeping its style), adding the cell to its row when the template left it out. */
function setCell(sheet: string, ref: string, text: string): string {
  const cellXml = (attrs: string) => `<c r="${ref}"${attrs} t="inlineStr"><is><t xml:space="preserve">${xml(text)}</t></is></c>`
  const existing = new RegExp(`<c r="${ref}"([^>]*?)(?:/>|>[\\s\\S]*?</c>)`)
  const m = sheet.match(existing)
  if (m) return sheet.replace(existing, cellXml(m[1].replace(/\s*t="[^"]*"/, "")))
  const row = ref.replace(/[A-Z]+/g, "")
  const rowRe = new RegExp(`<row r="${row}"([^>]*?)(/>|>([\\s\\S]*?)</row>)`)
  const r = sheet.match(rowRe)
  if (!r) return sheet
  const cells = r[3] ?? ""
  const parts = cells.match(/<c r="[A-Z]+\d+"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) ?? []
  const at = parts.findIndex((c) => colNum(c.match(/r="([A-Z]+\d+)"/)![1]) > colNum(ref))
  const next = at < 0 ? [...parts, cellXml("")] : [...parts.slice(0, at), cellXml(""), ...parts.slice(at)]
  return sheet.replace(rowRe, `<row r="${row}"${r[1]}>${next.join("")}</row>`)
}

export function fillUncFiles(files: UncFiles, d: UncData): UncFiles {
  const drawing = files.drawing
    .replace(/<a:t>Seq No :[^<]*<\/a:t>/, `<a:t>Seq No : ${xml(d.number)}</a:t>`)
    .replace(/<a:t>Date :[^<]*<\/a:t>/, `<a:t>Date : ${vnDay(d.date)}</a:t>`)
    .replace(/<a:t> 60,000,000 <\/a:t>/g, `<a:t> ${figures(d.amount)} </a:t>`)
    .replace(/<a:t>: Sáu mươi triệu đồng chẵn\.<\/a:t>/, `<a:t>: ${xml(vndInWords(d.amount))}.</a:t>`)
  const cells: [string, string][] = [
    ["A6", `Tên TK trích Nợ/Dr A/c Name: ${d.payerName}`],
    ["E6", `Người hưởng/Beneficiary: ${d.beneficiary}`],
    ["C8", d.payerAccount],
    ["E8", `Số CMND/HC/ID/PP: ${d.idNo}`],
    ["H8", `Ngày cấp/Date: ${vnDay(d.idDate)}`],
    ["E9", `Nơi cấp/Place: ${d.idPlace}`],
    ["E10", `Số TK/A/C No: ${d.beneficiaryAccount}`],
    ["E11", `Tại NH/At Bank: ${d.beneficiaryBank}`],
    // Remarks go on the line under "Nội dung/Remarks" (merged B16:D16).
    ["B16", d.remarks],
  ]
  return { drawing, sheet: cells.reduce((s, [ref, text]) => setCell(s, ref, text), files.sheet) }
}

/** The zip helpers of SheetJS (XLSX.CFB), passed in so this file stays free of the browser bundle. */
type Cfb = {
  read(data: Uint8Array, opts: { type: "buffer" }): unknown
  find(cfb: unknown, path: string): { content: Uint8Array | number[] } | null
  write(cfb: unknown, opts: { fileType: "zip"; type: "buffer"; compression?: boolean }): Uint8Array | number[]
}

/** Template bytes in, filled .xlsx bytes out. */
export function buildUncXlsx(template: Uint8Array, d: UncData, CFB: Cfb): Uint8Array {
  const zip = CFB.read(template, { type: "buffer" })
  const entry = (p: string) => {
    const e = CFB.find(zip, `/${p}`)
    if (!e) throw new Error(`Mẫu ủy nhiệm chi thiếu ${p}`)
    return e
  }
  const drawingEntry = entry("xl/drawings/drawing1.xml"), sheetEntry = entry("xl/worksheets/sheet1.xml")
  const decode = (e: { content: Uint8Array | number[] }) => new TextDecoder().decode(Uint8Array.from(e.content))
  const out = fillUncFiles({ drawing: decode(drawingEntry), sheet: decode(sheetEntry) }, d)
  drawingEntry.content = new TextEncoder().encode(out.drawing)
  sheetEntry.content = new TextEncoder().encode(out.sheet)
  return Uint8Array.from(CFB.write(zip, { fileType: "zip", type: "buffer", compression: true }))
}
