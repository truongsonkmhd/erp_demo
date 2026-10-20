-- User list ẩn các tài khoản Kho vận / Kế toán vì lần gỡ vai trò trước đã soft-delete.
-- Bật lại để hiển thị trên trang Người dùng.

USE `hoangminh_pts`;

UPDATE tbl_user u
INNER JOIN tbl_role r ON r.id = u.role_id
SET u.is_deleted = 0, u.active = 1
WHERE r.code IN ('warehouse', 'accounting');
