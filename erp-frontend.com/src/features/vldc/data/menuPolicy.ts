/**
 * Menu trimming per role and the merged pages. The server menu is filtered by "{page}:access"; on top of that a
 * role may hide pages it keeps access to (links from its dashboards still open them). Merged pages stay separate
 * routes, joined by a shared sub-tab bar, and highlight their parent menu.
 */

type MenuItem = { code: string; url: string }
type MenuGroup<I extends MenuItem> = { items: I[] }

/** Pages without their own menu entry, opened from a button of their parent page (which stays highlighted). */
const MERGED_INTO: Record<string, string> = { units: "organization" }

/** Pages removed for every account (menu, links and direct URLs). */
const HIDDEN_FOR_ALL = ["crossflow", "handoff", "today", "plans", "finance"]

/** Pages (by page id) hidden from a role's menu. */
const HIDDEN_PAGES: Record<string, string[]> = {
  lanhdao: [
    // Điều hành
    "command", "performance", "risks", "strategy",
    // Tổ chức: Năng lực is a tab of Nhân sự; the public catalogue duplicates Thiết bị
    "capability", "equipmentcatalog",
    // Nghiệp vụ cốt lõi: Văn bản, Sinh văn bản and Thiết bị are not for the head (văn bản giao xử lý reach Công việc)
    "documents", "generator", "equipment",
    // Kế toán: the accounting system is separate – only the overview stays (it carries Doanh thu & công nợ)
    "acctreports", "vouchers", "payments", "advances", "receivables", "payables", "cashbank", "acctassets", "projectacct", "reconcile", "closing", "ledgers",
    // Dữ liệu & Phân tích
    "datahub", "geodata", "archive", "importdata", "migration", "reports", "alerts", "digital", "audit",
  ],
}

/** Sibling pages shown as sub tabs; the first one is the menu entry. */
const PAGE_TABS: [string, string][][] = [
  [["hr", "Nhân sự"], ["capability", "Năng lực"]],
]

const pageOf = (item: MenuItem) => item.url.split("/").filter(Boolean).pop() ?? item.code.replace(/^vldc-/, "")

export function filterMenuGroups<I extends MenuItem, G extends MenuGroup<I>>(groups: G[], roles: string[]): G[] {
  const hidden = new Set([...HIDDEN_FOR_ALL, ...Object.keys(MERGED_INTO), ...roles.flatMap((r) => HIDDEN_PAGES[r] ?? [])])
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !hidden.has(pageOf(i))) }))
    .filter((g) => g.items.length)
}

/** The menu entry a page belongs to (a merged page highlights its parent). */
export const menuPageFor = (page: string) =>
  MERGED_INTO[page] ?? PAGE_TABS.find((tabs) => tabs.some(([p]) => p === page))?.[0][0] ?? page

/** Tab bar of the page's merge group, or "" for a page that is not merged. Page ids are constants, not user data. */
export function subTabsHtml(page: string): string {
  const tabs = PAGE_TABS.find((t) => t.some(([p]) => p === page))
  if (!tabs) return ""
  return `<div class="vx-subtabs">${tabs.map(([p, label]) => `<button class="vx-subtab${p === page ? " active" : ""}" onclick="show('${p}')">${label}</button>`).join("")}</div>`
}

/** Pages a role must not reach at all: hidden from its menu and not a tab of a merged page. */
export function blockedPages(roles: string[]): Set<string> {
  const tabs = new Set([...PAGE_TABS.flat().map(([p]) => p), ...Object.keys(MERGED_INTO)])
  return new Set([...HIDDEN_FOR_ALL, ...roles.flatMap((r) => HIDDEN_PAGES[r] ?? [])].filter((p) => !tabs.has(p)))
}

/** The page an inline onclick navigates to with show('…'), or "". */
export const linkTarget = (onclick: string | null | undefined) => /\bshow\(\s*['"]([\w-]+)['"]\s*\)/.exec(onclick ?? "")?.[1] ?? ""

/**
 * Drops navigation to blocked pages inside a rendered fragment: buttons and links disappear, clickable cards and
 * rows keep their content but stop being clickable.
 */
export function pruneBlockedLinks(root: ParentNode, blocked: Set<string>) {
  if (!blocked.size) return
  root.querySelectorAll<HTMLElement>("[onclick]").forEach((el) => {
    const target = linkTarget(el.getAttribute("onclick"))
    if (!target || !blocked.has(target)) return
    if (el.tagName === "BUTTON" || el.tagName === "A") el.remove()
    else {
      el.removeAttribute("onclick")
      el.style.cursor = "default"
    }
  })
}
