import test from "node:test"
import assert from "node:assert/strict"

const moduleUnderTest = import("./supplier-data.ts").catch(() => ({}))

test("lọc nhà cung cấp theo các nhóm cung cấp đã lưu", async () => {
  const { getSupplierCategories } = await moduleUnderTest
  assert.equal(typeof getSupplierCategories, "function", "thiếu helper nhóm nhà cung cấp")
  assert.deepEqual(getSupplierCategories({ supplyCategories: ["Thiết bị", "Vật tư"] }), ["Thiết bị", "Vật tư"])
})

test("nhà cung cấp cũ không có danh sách nhóm không làm hỏng bảng", async () => {
  const { getSupplierCategories } = await moduleUnderTest
  assert.deepEqual(getSupplierCategories({}), [])
})
