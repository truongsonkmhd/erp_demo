/**
 * Helper format ngày tháng theo quy chuẩn tiếng Việt dd/MM/yyyy
 * Tuân thủ quy tắc ERP_UX_RULES.md (Mục 7: Ngày hiển thị theo dd/MM/yyyy)
 */
export function formatDateVN(dateStr?: string | null, fallback = "Chưa cập nhật"): string {
  if (!dateStr || !dateStr.trim()) {
    return fallback
  }

  const clean = dateStr.trim()

  // Trường hợp định dạng YYYY-MM-DD
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(clean)
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch
    return `${d}/${m}/${y}`
  }

  // Thử parse qua Date object nếu là ISO string
  const parsed = new Date(clean)
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0")
    const month = String(parsed.getMonth() + 1).padStart(2, "0")
    const year = parsed.getFullYear()
    return `${day}/${month}/${year}`
  }

  return clean
}
