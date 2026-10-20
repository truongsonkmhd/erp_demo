import test from "node:test"
import assert from "node:assert/strict"

const moduleUnderTest = import("./management-tabs.ts").catch(() => ({}))

test("khu quản trị truy cập chỉ hiện phòng ban, vai trò và phân quyền", async () => {
  const { managementTabs } = await moduleUnderTest
  assert.equal(typeof managementTabs, "function")
  assert.deepEqual(
    managementTabs({ area: "access", canUsers: true, canRoles: true }).map((tab) => tab.id),
    ["departments", "roles", "permissions"],
  )
})

test("màn hình cũ vẫn giữ tab người dùng", async () => {
  const { managementTabs } = await moduleUnderTest
  assert.deepEqual(
    managementTabs({ area: "full", canUsers: true, canRoles: true }).map((tab) => tab.id),
    ["users", "roles", "departments", "permissions"],
  )
})
