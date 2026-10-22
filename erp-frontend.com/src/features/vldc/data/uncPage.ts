import { escapeHtml as esc, formatMoney, jsCall } from "../workflow/html"
import { localToday } from "./dates"
import { vldcData } from "./registry"
import { buildUncXlsx, vndInWords, type UncData } from "./uncCore"

/**
 * "Xuất UNC" on Chứng từ kế toán: an Ủy nhiệm chi voucher is printed on the BIDV form (public/uy-nhiem-chi-bidv.xlsx).
 * The form opens prefilled from the voucher; the beneficiary's account and bank are typed at export time only.
 */

type Ctx = { openModal(title: string, html: string): void; closeModal(): void }

export const UNC_TYPE = "Ủy nhiệm chi"
/** Debited account printed on the bank's sample form. */
const PAYER = { name: "LIÊN ĐOÀN VẬT LÝ ĐỊA CHẤT", account: "6211007555" }
const TEMPLATE = `${import.meta.env.BASE_URL}uy-nhiem-chi-bidv.xlsx`

const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
const field = (id: string, label: string, val = "", type = "text", full = false) =>
  `<div${full ? ' class="full"' : ""}><label>${label}</label><input id="${id}" type="${type}" value="${esc(val)}"></div>`

export const uncButton = (voucherId: string) => `<button class="btn btn-light" ${jsCall("uncForm", voucherId)}>Xuất UNC</button>`

export function installUncExport(ctx: Ctx) {
  function uncForm(id: string) {
    const v = vldcData.get("vouchers").find((x) => x.id === id)
    if (!v) return
    const amount = Math.round(v.amount * 1e6)
    ctx.openModal(`Xuất ủy nhiệm chi • ${v.id}`, `<div class="mini" style="margin-bottom:8px">Mẫu Ủy nhiệm chi BIDV. Số tiền, nội dung, người hưởng lấy từ chứng từ; nhập thêm tài khoản người hưởng rồi tải file Excel để in.</div>
<div class="form-grid">
${field("unc-number", "Số / Seq No", v.id)}${field("unc-date", "Ngày", v.date || localToday(), "date")}
${field("unc-amount", "Số tiền (đồng)", String(amount), "number")}<div><label>Bằng chữ</label><div class="mini" id="unc-words" style="padding:10px 0">${esc(vndInWords(amount))}</div></div>
${field("unc-payer", "Tên TK trích Nợ", PAYER.name)}${field("unc-payer-acc", "Số TK trích Nợ (BIDV)", PAYER.account)}
${field("unc-ben", "Người hưởng *", v.counterparty)}${field("unc-ben-acc", "Số TK người hưởng *")}
${field("unc-ben-bank", "Tại ngân hàng *", "", "text", true)}
${field("unc-id", "Số CMND/HC (cá nhân)")}${field("unc-id-date", "Ngày cấp", "", "date")}${field("unc-id-place", "Nơi cấp", "", "text", true)}
${field("unc-remarks", "Nội dung", v.note || `Thanh toán ${v.counterparty}`, "text", true)}
</div><button class="btn btn-primary" style="margin-top:12px" ${jsCall("uncDownload", v.id)}>Tải file ủy nhiệm chi</button>`)
    document.getElementById("unc-amount")?.addEventListener("input", (e) => {
      const n = Number((e.target as HTMLInputElement).value)
      const out = document.getElementById("unc-words")
      if (out) out.textContent = n > 0 ? `${vndInWords(n)} (${formatMoney(n)})` : ""
    })
  }

  async function uncDownload(id: string) {
    const data: UncData = {
      number: value("unc-number"), date: value("unc-date"), amount: Number(value("unc-amount")),
      payerName: value("unc-payer"), payerAccount: value("unc-payer-acc"),
      beneficiary: value("unc-ben"), beneficiaryAccount: value("unc-ben-acc"), beneficiaryBank: value("unc-ben-bank"),
      idNo: value("unc-id"), idDate: value("unc-id-date"), idPlace: value("unc-id-place"), remarks: value("unc-remarks"),
    }
    const missing = [
      !(data.amount > 0) && "số tiền", !data.beneficiary && "người hưởng", !data.beneficiaryAccount && "số tài khoản người hưởng",
      !data.beneficiaryBank && "ngân hàng người hưởng", !data.payerAccount && "số tài khoản trích nợ",
    ].filter(Boolean)
    if (missing.length) return alert(`Vui lòng nhập ${missing.join(", ")}`)
    try {
      const [XLSX, res] = await Promise.all([import("xlsx"), fetch(TEMPLATE)])
      if (!res.ok) throw new Error("Không tải được mẫu ủy nhiệm chi")
      const bytes = buildUncXlsx(new Uint8Array(await res.arrayBuffer()), data, XLSX.CFB as never)
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }))
      const a = Object.assign(document.createElement("a"), { href: url, download: `${id}-uy-nhiem-chi.xlsx` })
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      ctx.closeModal()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  Object.assign(window, { uncForm, uncDownload })
}
