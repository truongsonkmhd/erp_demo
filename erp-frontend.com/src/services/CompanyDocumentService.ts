import { CompanyDocument, CompanyDocumentInput } from "@/types/companyDocument"
import { newLocalId, readStore, removeUndefinedValues, writeStore } from "@/lib/localStore"

const DOCUMENTS_KEY = "pts.company_documents"

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

export async function getCompanyDocuments(): Promise<CompanyDocument[]> {
  return readStore<CompanyDocument>(DOCUMENTS_KEY).sort((first, second) =>
    (second.updatedAt || "").localeCompare(first.updatedAt || ""),
  )
}

export async function uploadCompanyDocumentFile(file: File) {
  const safeName = file.name.replace(/[^\w.\-() ]+/g, "_")
  const fileUrl = await readAsDataUrl(file)
  return {
    fileName: file.name,
    fileUrl,
    fileType: file.name.split(".").pop()?.toLowerCase() || "other",
    fileSize: file.size,
    storagePath: `local/company-documents/${Date.now()}-${safeName}`,
  }
}

export async function addCompanyDocument(input: CompanyDocumentInput): Promise<void> {
  const now = new Date().toISOString()
  const documents = readStore<CompanyDocument>(DOCUMENTS_KEY)
  documents.push(
    removeUndefinedValues({
      ...input,
      id: newLocalId("doc"),
      createdAt: now,
      updatedAt: now,
    } as CompanyDocument),
  )
  writeStore(DOCUMENTS_KEY, documents)
}

export async function updateCompanyDocument(
  id: string,
  input: Partial<CompanyDocumentInput>,
): Promise<void> {
  const documents = readStore<CompanyDocument>(DOCUMENTS_KEY)
  writeStore(
    DOCUMENTS_KEY,
    documents.map((item) =>
      item.id === id
        ? removeUndefinedValues({ ...item, ...input, id, updatedAt: new Date().toISOString() })
        : item,
    ),
  )
}

export async function deleteCompanyDocument(id: string, _fileUrl?: string): Promise<void> {
  writeStore(
    DOCUMENTS_KEY,
    readStore<CompanyDocument>(DOCUMENTS_KEY).filter((item) => item.id !== id),
  )
}
