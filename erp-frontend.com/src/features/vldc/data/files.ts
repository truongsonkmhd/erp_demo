import { apiDownload, apiUpload } from "@/lib/api"

/**
 * Private attachments stored on the backend's disk. A record keeps the files' URLs
 * (/api/vldc/files/{type}/{ownerId}/{fileId}/{name}); reading one needs a sign-in and the owner's scope, so the
 * file is fetched with the token and handed to the browser as a download, never as a public link.
 * Older records may still hold plain file names (no file behind them).
 */

const PREFIX = "/api/vldc/files/"
export const MAX_FILES = 10
export const MAX_FILE_MB = 20
export const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"

export const isFileUrl = (value: string) => value.startsWith(PREFIX)

/** Display name of an attachment: the original name of a stored file, or the legacy plain name. */
export function attachmentName(value: string): string {
  if (!isFileUrl(value)) return value
  const last = value.slice(value.lastIndexOf("/") + 1)
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

/** Reasons the picked files cannot be uploaded (empty when they can), checked again by the backend. */
export function fileProblems(files: File[], alreadyStored: number): string[] {
  const out: string[] = []
  if (alreadyStored + files.length > MAX_FILES) out.push(`Tối đa ${MAX_FILES} file cho mỗi hồ sơ`)
  const allowed = ACCEPT.split(",")
  for (const f of files) {
    if (f.size > MAX_FILE_MB * 1024 * 1024) out.push(`${f.name}: quá ${MAX_FILE_MB} MB`)
    if (!allowed.includes(f.name.slice(f.name.lastIndexOf(".")).toLowerCase())) out.push(`${f.name}: không hỗ trợ loại file này`)
  }
  return out
}

export async function uploadFiles(type: string, ownerId: string, files: File[]): Promise<string[]> {
  const form = new FormData()
  files.forEach((f) => form.append("files", f, f.name))
  return apiUpload<string[]>(`${PREFIX}${encodeURIComponent(type)}/${encodeURIComponent(ownerId)}`, form)
}

/** Fetches the file with the user's token and saves it under its original name. */
export async function downloadFile(url: string): Promise<void> {
  if (!isFileUrl(url)) return
  const blob = await apiDownload(url)
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = attachmentName(url)
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
}
