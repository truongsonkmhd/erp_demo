import { FIXED_ROLE_LEVELS, isRoleWithoutLevels } from "@/constants/roles"
import { apiRequest } from "@/lib/api"
import { RoleDefinition, RoleDefinitionInput, RoleLevel, RolePermission } from "@/types/auth"

type BackendRole = {
  id: number
  code: string
  name: string
  summary: string
  departmentId?: number | null
  departmentName?: string | null
  levels: {
    id: string
    name: string
    seat: string
    description: string
    permissionIds?: string[]
  }[]
  permissions: {
    id: string
    code?: string
    label: string
    note?: string
    pageId?: number
    actionId?: number
    pageCode?: string
    actionCode?: string
  }[]
}

function mapRole(role: BackendRole): RoleDefinition {
  const levels: RoleLevel[] = isRoleWithoutLevels(role.code)
    ? []
    : (role.levels?.length ? role.levels : FIXED_ROLE_LEVELS).map((level) => ({
        id: level.id,
        name: level.name,
        seat: (level.seat as RoleLevel["seat"]) || "n",
        description: level.description || "",
        permissionIds: level.permissionIds || [],
      }))

  const permissions: RolePermission[] = (role.permissions || []).map((permission) => ({
    id: permission.id,
    code: permission.code || permission.id,
    label: permission.label,
    note: permission.note,
    pageId: permission.pageId,
    actionId: permission.actionId,
    pageCode: permission.pageCode,
    actionCode: permission.actionCode,
  }))

  return {
    id: String(role.id),
    code: role.code,
    name: role.name,
    summary: role.summary || "",
    departmentId: role.departmentId,
    departmentName: role.departmentName,
    levels,
    permissions,
  }
}

export async function getRoles(): Promise<RoleDefinition[]> {
  const roles = await apiRequest<BackendRole[]>("/api/roles")
  return (roles || []).map(mapRole)
}

export async function getPermissions(): Promise<RolePermission[]> {
  const permissions = await apiRequest<RolePermission[]>("/api/permissions")
  return (permissions || []).map((permission) => ({
    id: permission.id,
    code: permission.code || permission.id,
    label: permission.label,
    note: permission.note,
    pageId: permission.pageId,
    actionId: permission.actionId,
    pageCode: permission.pageCode,
    actionCode: permission.actionCode,
  }))
}

export async function createPermission(permission: RolePermission): Promise<void> {
  const code = permission.code || permission.id
  await apiRequest("/api/permissions", {
    method: "POST",
    body: {
      id: code,
      code,
      label: permission.label,
      note: permission.note,
      pageId: permission.pageId,
      actionId: permission.actionId,
    },
  })
}

export async function updatePermission(permissionId: string, input: Pick<RolePermission, "label" | "note">): Promise<void> {
  await apiRequest(`/api/permissions/${encodeURIComponent(permissionId)}`, {
    method: "PUT",
    body: {
      label: input.label,
      note: input.note,
    },
  })
}

export async function deletePermission(permissionId: string): Promise<void> {
  await apiRequest(`/api/permissions/${encodeURIComponent(permissionId)}`, {
    method: "DELETE",
  })
}

export async function addRole(input: RoleDefinitionInput): Promise<void> {
  await apiRequest<BackendRole>("/api/roles", {
    method: "POST",
    body: {
      code: input.code,
      name: input.name,
      summary: input.summary,
      departmentId: input.departmentId,
      permissions: (input.permissions || []).map((permission) => ({
        id: permission.id,
        label: permission.label,
        note: permission.note,
      })),
    },
  })
}

export async function updateRole(id: string, input: Partial<RoleDefinitionInput>): Promise<void> {
  if (input.name || input.code || input.summary || input.permissions || input.departmentId !== undefined) {
    await apiRequest(`/api/roles/${id}`, {
      method: "PUT",
      body: {
        code: input.code,
        name: input.name,
        summary: input.summary,
        departmentId: input.departmentId,
        permissions: input.permissions?.map((permission) => ({
          id: permission.id,
          label: permission.label,
          note: permission.note,
        })),
      },
    })
  }
}

export async function deleteRole(id: string): Promise<void> {
  await apiRequest(`/api/roles/${id}`, { method: "DELETE" })
}
