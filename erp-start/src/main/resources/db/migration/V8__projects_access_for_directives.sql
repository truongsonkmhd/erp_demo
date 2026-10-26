-- Giao việc không còn menu riêng: nó là tab thứ hai của Nhiệm vụ / Dự án. Mọi role đang dùng Giao việc
-- (vldc-directives:access) cần thấy menu Nhiệm vụ / Dự án để vào được tab đó. Idempotent.
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT rp.role_id, p.id
FROM tbl_role_permission rp
JOIN tbl_permission d ON d.id = rp.permission_id AND d.code = 'vldc-directives:access'
JOIN tbl_permission p ON p.code = 'vldc-projects:access';
