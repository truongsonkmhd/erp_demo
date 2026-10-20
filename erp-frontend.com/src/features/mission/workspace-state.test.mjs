import test from 'node:test'
import assert from 'node:assert/strict'

const moduleUnderTest = import('./workspace-state.ts').catch(() => ({}))

test('chỉ công việc thực hiện của nhiệm vụ đang chọn xuất hiện trên Kanban', async () => {
  const { boardWorkItems } = await moduleUnderTest
  assert.equal(typeof boardWorkItems, 'function', 'thiếu hàm lọc thẻ Kanban')
  const nodes = [
    { id: 'p', missionId: 'm1', kind: 'project' },
    { id: 'i', missionId: 'm1', kind: 'item' },
    { id: 'w1', missionId: 'm1', kind: 'work' },
    { id: 'v', missionId: 'm1', kind: 'volume' },
    { id: 'w2', missionId: 'm2', kind: 'work' },
  ]
  assert.deepEqual(boardWorkItems(nodes, 'm1').map((node) => node.id), ['w1'])
})

test('bảng tổng hợp vẫn loại các nút cấu trúc và khối lượng', async () => {
  const { boardWorkItems } = await moduleUnderTest
  const nodes = [
    { id: 'project', missionId: 'm1', kind: 'project' },
    { id: 'work1', missionId: 'm1', kind: 'work' },
    { id: 'volume', missionId: 'm1', kind: 'volume' },
    { id: 'work2', missionId: 'm2', kind: 'work' },
  ]
  assert.deepEqual(boardWorkItems(nodes, 'all').map((node) => node.id), ['work1', 'work2'])
})

test('liên kết đến nhiệm vụ không tồn tại trở về danh sách an toàn', async () => {
  const { readWorkspaceLocation } = await moduleUnderTest
  assert.equal(typeof readWorkspaceLocation, 'function', 'thiếu hàm đọc liên kết workspace')
  const state = readWorkspaceLocation('?mission=deleted&tab=kanban', [{ id: 'm1' }])
  assert.deepEqual(state, { missionId: null, tab: 'missions' })
})

test('liên kết hợp lệ giữ đúng nhiệm vụ và tab Kanban', async () => {
  const { readWorkspaceLocation } = await moduleUnderTest
  assert.equal(typeof readWorkspaceLocation, 'function', 'thiếu hàm đọc liên kết workspace')
  const state = readWorkspaceLocation('?mission=m1&tab=kanban', [{ id: 'm1' }])
  assert.deepEqual(state, { missionId: 'm1', tab: 'kanban' })
})

test('mở một nhiệm vụ mặc định vào tổng quan thay vì cây công việc', async () => {
  const { readWorkspaceLocation } = await moduleUnderTest
  assert.deepEqual(readWorkspaceLocation('?mission=m1', [{ id: 'm1' }]), { missionId: 'm1', tab: 'overview' })
})

test('mở từ Kanban về WBS sẽ mở rộng đúng chuỗi nút cha', async () => {
  const { ancestorIds } = await moduleUnderTest
  assert.equal(typeof ancestorIds, 'function')
  const nodes = [
    { id: 'p', parentId: null },
    { id: 'i', parentId: 'p' },
    { id: 'w', parentId: 'i' },
  ]
  assert.deepEqual(ancestorIds(nodes, 'w'), ['i', 'p'])
})
