import { escapeHtml as esc } from "./html.ts"

/** Hand-drawn SVG charts returned as HTML strings, so the legacy string-rendered pages can embed them. */

export type Series = { name: string; color: string; values: (number | null)[]; dashed?: boolean }

const AXIS = "#dce6ef"
const SURFACE = "#ffffff"

const round = (n: number) => Math.round(n * 10) / 10

export function legend(items: { name: string; color: string; value?: string }[]): string {
  return `<div class="viz-legend">${items.map((x) => `<span><i style="background:${x.color}"></i>${esc(x.name)}${x.value === undefined ? "" : ` <b>${esc(x.value)}</b>`}</span>`).join("")}</div>`
}

/** Horizontal grouped bars on a 0–max scale; one row per category, one thin bar per series. */
export function groupedBars(categories: string[], series: Series[], opts: { max?: number; unit?: string; flag?: (row: number) => string } = {}): string {
  const max = opts.max ?? 100, unit = opts.unit ?? "%"
  const labelW = 118, plotW = 300, valueW = 40, bar = 8, gap = 2
  const rowH = series.length * (bar + gap) + 14
  const width = labelW + plotW + valueW, height = categories.length * rowH + 18
  const x = (v: number) => (Math.max(0, Math.min(v, max)) / max) * plotW
  const grid = [0, 25, 50, 75, 100].map((p) => {
    const gx = labelW + (p / 100) * plotW
    return `<line x1="${gx}" x2="${gx}" y1="0" y2="${height - 16}" stroke="${AXIS}"/><text x="${gx}" y="${height - 4}" text-anchor="middle" class="viz-small">${round((p / 100) * max)}${unit}</text>`
  }).join("")
  const rows = categories.map((cat, i) => {
    const top = i * rowH + 6
    const bars = series.map((s, j) => {
      const v = s.values[i]
      if (v == null) return ""
      const y = top + j * (bar + gap)
      return `<rect x="${labelW}" y="${y}" width="${round(Math.max(x(v), 2))}" height="${bar}" rx="2" fill="${s.color}"><title>${esc(cat)} • ${esc(s.name)}: ${v}${unit}</title></rect><text x="${round(labelW + x(v) + 4)}" y="${y + bar - 1}" class="viz-val">${v}</text>`
    }).join("")
    const flag = opts.flag?.(i) ?? ""
    const mid = top + (series.length * (bar + gap)) / 2 + 3
    return `<text x="0" y="${mid}" class="viz-label">${esc(cat)}</text>${bars}${flag ? `<text x="${width}" y="${mid}" text-anchor="end" class="viz-flag">${esc(flag)}</text>` : ""}`
  }).join("")
  return `<svg viewBox="0 0 ${width} ${height}" class="viz-svg" role="img">${grid}${rows}</svg>${legend(series)}`
}

/** Line chart over shared x labels; null values end a series early (e.g. actuals up to this month). */
export function lineChart(labels: string[], series: Series[], opts: { unit?: string; max?: number } = {}): string {
  const unit = opts.unit ?? ""
  const max = opts.max ?? Math.max(...series.flatMap((s) => s.values.filter((v): v is number => v != null)), 1)
  const left = 34, right = 10, top = 10, plotH = 150, width = 460, height = top + plotH + 22
  const plotW = width - left - right
  const px = (i: number) => left + (labels.length === 1 ? 0 : (i / (labels.length - 1)) * plotW)
  const py = (v: number) => top + plotH - (v / max) * plotH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const v = Math.round(max * t)
    return `<line x1="${left}" x2="${width - right}" y1="${round(py(v))}" y2="${round(py(v))}" stroke="${AXIS}"/><text x="${left - 5}" y="${round(py(v)) + 3}" text-anchor="end" class="viz-small">${v}</text>`
  }).join("")
  const xLabels = labels.map((l, i) => `<text x="${round(px(i))}" y="${height - 6}" text-anchor="middle" class="viz-small">${esc(l)}</text>`).join("")
  const lines = series.map((s) => {
    const pts = s.values.flatMap((v, i) => (v == null ? [] : [{ x: px(i), y: py(v), v, label: labels[i] }]))
    const path = pts.map((p, i) => `${i ? "L" : "M"} ${round(p.x)} ${round(p.y)}`).join(" ")
    const last = pts[pts.length - 1]
    // Invisible 9px hit targets give every point a hover tooltip larger than the mark.
    const hits = pts.map((p) => `<circle cx="${round(p.x)}" cy="${round(p.y)}" r="9" fill="transparent" class="viz-hit"><title>${esc(p.label)} • ${esc(s.name)}: ${p.v}${unit}</title></circle>`).join("")
    const end = last ? `<circle cx="${round(last.x)}" cy="${round(last.y)}" r="4" fill="${s.color}" stroke="${SURFACE}" stroke-width="2"/><text x="${round(last.x) - 6}" y="${round(last.y) + 14}" text-anchor="end" class="viz-val">${last.v}${unit}</text>` : ""
    return `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round"${s.dashed ? ' stroke-dasharray="5 4"' : ""}/>${end}${hits}`
  }).join("")
  return `<svg viewBox="0 0 ${width} ${height}" class="viz-svg" role="img">${ticks}${lines}${xLabels}</svg>${legend(series)}`
}
