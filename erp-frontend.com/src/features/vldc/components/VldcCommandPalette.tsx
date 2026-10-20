import { useEffect, useMemo, useRef, useState } from "react"
import { CornerDownLeft, Search } from "lucide-react"
import { menuIcon } from "@/features/vldc/menuIcons"
import { normalizeVi, type VldcMenuGroup } from "@/features/vldc/useVldcMenus"

type Props = {
  open: boolean
  groups: VldcMenuGroup[]
  onClose: () => void
  onSelect: (url: string) => void
}

/** Ctrl/⌘+K quick jump to any page the user is allowed to open. */
export function VldcCommandPalette({ open, groups, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    const all = groups.flatMap((group) => group.items)
    const q = normalizeVi(query.trim())
    return q ? all.filter((item) => normalizeVi(`${item.title} ${item.group}`).includes(q)) : all
  }, [groups, query])

  useEffect(() => {
    if (open) {
      setQuery("")
      setCursor(0)
    }
  }, [open])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" })
  }, [cursor])

  if (!open) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, items.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === "Enter" && items[cursor]) {
      onSelect(items[cursor].url)
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <div className="vx-overlay" onMouseDown={onClose}>
      <div className="vx-palette" role="dialog" aria-modal="true" aria-label="Tìm nhanh chức năng" onMouseDown={(e) => e.stopPropagation()}>
        <div className="vx-palette-input">
          <Search size={18} aria-hidden="true" />
          <input
            className="vx-bare"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Gõ tên chức năng, ví dụ: chứng từ, lịch, thiết bị…"
            aria-label="Tên chức năng"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="vx-palette-list" ref={listRef} role="listbox">
          {!items.length && <div className="vx-nav-empty">Không tìm thấy chức năng phù hợp.</div>}
          {items.map((item, index) => {
            const Icon = menuIcon(item.icon)
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={index === cursor}
                data-index={index}
                className={`vx-palette-item${index === cursor ? " is-active" : ""}`}
                onMouseEnter={() => setCursor(index)}
                onClick={() => onSelect(item.url)}
              >
                <Icon size={17} aria-hidden="true" />
                <span className="vx-palette-title">{item.title}</span>
                <span className="vx-palette-group">{item.group}</span>
                {index === cursor && <CornerDownLeft size={14} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
