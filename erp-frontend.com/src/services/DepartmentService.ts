import { apiRequest } from "@/lib/api"

export interface Department {
  id: number
  code: string
  name: string
  description?: string | null
}

export type DepartmentInput = Pick<Department, "code" | "name" | "description">

export const getDepartments = () => apiRequest<Department[]>("/api/departments")
export const addDepartment = (input: DepartmentInput) => apiRequest<Department>("/api/departments", { method: "POST", body: input })
export const updateDepartment = (id: number, input: DepartmentInput) => apiRequest<Department>(`/api/departments/${id}`, { method: "PUT", body: input })
export const deleteDepartment = (id: number) => apiRequest<number>(`/api/departments/${id}`, { method: "DELETE" })
