import type { Supplier } from "../types/procurement.types"

export function getSupplierCategories(supplier: Partial<Pick<Supplier, "supplyCategories">>): string[] {
  return Array.isArray(supplier.supplyCategories) ? supplier.supplyCategories : []
}
