import { CustomerCare, CustomerCareInput } from "@/types/customerCare"
import { newLocalId, readStore, writeStore } from "@/lib/localStore"

const CUSTOMER_CARE_KEY = "pts.customer_care"

export async function getCustomerCareRecords(projectId: string): Promise<CustomerCare[]> {
  return readStore<CustomerCare>(CUSTOMER_CARE_KEY)
    .filter((item) => item.projectId === projectId)
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
}

export async function addCustomerCareRecord(
  input: CustomerCareInput,
  projectId: string,
  customerName: string,
): Promise<void> {
  const now = new Date().toISOString()
  const records = readStore<CustomerCare>(CUSTOMER_CARE_KEY)
  records.push({
    ...input,
    id: newLocalId("cskh"),
    projectId,
    customerName,
    createdAt: now,
    updatedAt: now,
  } as CustomerCare)
  writeStore(CUSTOMER_CARE_KEY, records)
}

export async function updateCustomerCareRecord(id: string, input: CustomerCareInput): Promise<void> {
  const records = readStore<CustomerCare>(CUSTOMER_CARE_KEY)
  writeStore(
    CUSTOMER_CARE_KEY,
    records.map((item) =>
      item.id === id ? { ...item, ...input, id, updatedAt: new Date().toISOString() } : item,
    ),
  )
}

export async function deleteCustomerCareRecord(id: string): Promise<void> {
  writeStore(
    CUSTOMER_CARE_KEY,
    readStore<CustomerCare>(CUSTOMER_CARE_KEY).filter((item) => item.id !== id),
  )
}

export async function getAllCustomerCareRecords(): Promise<CustomerCare[]> {
  return readStore<CustomerCare>(CUSTOMER_CARE_KEY)
}

export async function getAllCustomerCareIssues(): Promise<CustomerCare[]> {
  return (await getAllCustomerCareRecords())
    .filter((item) => item.hasIssue === true)
    .sort((first, second) => (second.updatedAt || "").localeCompare(first.updatedAt || ""))
}
