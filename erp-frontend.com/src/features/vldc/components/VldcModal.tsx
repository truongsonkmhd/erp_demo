import { useEffect } from "react"
import { X } from "lucide-react"
import { vldcActions, type VldcModal as VldcModalState } from "@/features/vldc/store"

type Props = { modal: NonNullable<VldcModalState> }

export function VldcModal({ modal }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && vldcActions.closeModal()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="modal" onMouseDown={vldcActions.closeModal}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={modal.title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{modal.title}</h3>
          <button type="button" className="vx-icon-btn" onClick={vldcActions.closeModal} aria-label="Đóng" title="Đóng (Esc)">
            <X size={18} />
          </button>
        </div>
        {/* key forces fresh markup on every open, matching the old innerHTML reset */}
        <div key={modal.seq} id="modalBody" dangerouslySetInnerHTML={{ __html: modal.html }} />
      </div>
    </div>
  )
}
