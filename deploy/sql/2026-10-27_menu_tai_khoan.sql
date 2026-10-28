-- Chỉ menu "Tài khoản" (nhóm Tổ chức Liên đoàn) và quyền liên quan, tách từ V11__hr_org.sql.
-- Không tạo bảng, không đụng dữ liệu nhân sự. Chạy lại nhiều lần vẫn an toàn.
-- DBeaver: mở file rồi bấm Alt+X (Execute SQL Script), không bôi đen chạy Ctrl+Enter.
-- Sau khi chạy: đăng xuất rồi đăng nhập lại để menu và quyền mới được nạp.
USE `erp-demo`;

-- Trang Tài khoản và 4 quyền access/create/update/delete của nó.
INSERT IGNORE INTO tbl_page (code, name, url) VALUES ('vldc-accounts', 'Tài khoản', '/vldc/accounts');

INSERT IGNORE INTO tbl_permission (code, label, page_id, action_id)
SELECT CONCAT(p.code, ':', a.code), CONCAT(p.name, ' - ', a.name), p.id, a.id
FROM tbl_page p CROSS JOIN tbl_action a WHERE p.code = 'vldc-accounts';

-- Menu nằm dưới nhóm Tổ chức Liên đoàn, sau Nhân sự.
INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
SELECT 'vldc-accounts', 'Tài khoản', 'KeyRound', g.id, p.id, 'vldc', 306
FROM tbl_menu g JOIN tbl_page p ON p.code = 'vldc-accounts'
WHERE g.code = 'vldc-grp-organization'
ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon), parent_id = VALUES(parent_id), page_id = VALUES(page_id);

-- :create = làm trên toàn Liên đoàn (Lãnh đạo, Phòng TC-HC); :update không kèm :create = chỉ trong đơn vị mình quản lý.
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r JOIN tbl_permission p ON p.code IN (
  'vldc-hr:create', 'vldc-hr:update', 'vldc-hr:delete', 'vldc-organization:create', 'vldc-organization:update',
  'vldc-accounts:access', 'vldc-accounts:create', 'vldc-accounts:update')
WHERE r.code IN ('lanhdao', 'tochuc');

INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r JOIN tbl_permission p ON p.code IN ('vldc-hr:update', 'vldc-organization:update')
WHERE r.code IN ('truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'ketoantruong');

INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r JOIN tbl_permission p ON p.code LIKE 'vldc-accounts:%'
WHERE r.code = 'admin';

-- Kiểm tra: phải ra 1 dòng menu và 4 quyền.
SELECT code, title, parent_id, page_id FROM tbl_menu WHERE code = 'vldc-accounts';
SELECT code FROM tbl_permission WHERE code LIKE 'vldc-accounts:%';
