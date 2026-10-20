-- Run once against erp-demo AFTER a verified mysqldump backup.
-- This migration preserves users/roles and archives legacy permissions before replacing them.
USE `erp-demo`;

CREATE TABLE tbl_page (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  url VARCHAR(200) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tbl_action (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO tbl_action (id, code, name) VALUES
  (1, 'access', 'Truy cập'), (2, 'create', 'Tạo mới'),
  (3, 'update', 'Chỉnh sửa'), (4, 'delete', 'Xóa');

INSERT INTO tbl_page (code, name, url) VALUES
  ('dashboard', 'Trang chủ', '/dashboard'),
  ('projects-marketing', 'Dữ liệu Marketing', '/projects-marketing'),
  ('projects-sale', 'Đơn hàng', '/projects-sale'),
  ('projects-cskh', 'Chăm sóc khách hàng', '/projects-cskh'),
  ('timeline', 'Giao nhiệm vụ', '/timeline'),
  ('documents', 'Tài liệu', '/documents'),
  ('learning', 'Học tập', '/learning'),
  ('huong-dan', 'Hướng dẫn', '/huong-dan'),
  ('roles', 'Vai trò và phân quyền', '/roles'),
  ('users', 'Người dùng', '/users'),
  ('templates', 'Biểu mẫu', '/templates'),
  ('reports', 'Báo cáo', '/reports'),
  ('tools', 'Công cụ', '/tools'),
  ('settings', 'Cài đặt', '/settings');

CREATE TABLE tbl_permission_legacy_backup_20261008 AS SELECT * FROM tbl_permission;
CREATE TABLE tbl_role_permission_legacy_backup_20261008 AS SELECT * FROM tbl_role_permission;
CREATE TABLE tbl_user_role_legacy_backup_20261008 AS SELECT id, role_id FROM tbl_user;

ALTER TABLE tbl_permission ADD COLUMN page_id BIGINT NULL, ADD COLUMN action_id BIGINT NULL;
DELETE FROM tbl_role_permission;
DELETE FROM tbl_permission;
INSERT INTO tbl_permission (code, label, note, page_id, action_id)
SELECT CONCAT(p.code, ':', a.code), CONCAT(p.name, ' - ', a.name), NULL, p.id, a.id
FROM tbl_page p CROSS JOIN tbl_action a;
ALTER TABLE tbl_permission
  MODIFY page_id BIGINT NOT NULL,
  MODIFY action_id BIGINT NOT NULL,
  ADD CONSTRAINT uk_permission_page_action UNIQUE (page_id, action_id),
  ADD CONSTRAINT fk_permission_page FOREIGN KEY (page_id) REFERENCES tbl_page(id),
  ADD CONSTRAINT fk_permission_action FOREIGN KEY (action_id) REFERENCES tbl_action(id);

ALTER TABLE tbl_user ADD COLUMN account_type TINYINT NOT NULL DEFAULT 2;
UPDATE tbl_user u JOIN tbl_role r ON r.id = u.role_id SET u.account_type = 1 WHERE r.code = 'admin';
ALTER TABLE tbl_user ADD CONSTRAINT chk_user_account_type CHECK (account_type IN (1, 2, 3));
CREATE TABLE tbl_user_role (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES tbl_user(id),
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES tbl_role(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO tbl_user_role (user_id, role_id)
SELECT id, role_id FROM tbl_user WHERE role_id IS NOT NULL;
ALTER TABLE tbl_user DROP FOREIGN KEY fk_user_role;
ALTER TABLE tbl_user DROP INDEX idx_user_role;
ALTER TABLE tbl_user DROP COLUMN role_id;

INSERT INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r CROSS JOIN tbl_permission p WHERE r.code = 'admin';

-- Verification: admin user(s) must remain associated with admin and have every permission.
SELECT COUNT(*) AS admin_users FROM tbl_user_role ur JOIN tbl_role r ON r.id = ur.role_id WHERE r.code = 'admin';
SELECT (SELECT COUNT(*) FROM tbl_permission) AS permissions_total,
       (SELECT COUNT(*) FROM tbl_role_permission rp JOIN tbl_role r ON r.id = rp.role_id WHERE r.code = 'admin') AS admin_permissions;
