-- Fresh ERP Demo auth database. Business data remains frontend-local.
CREATE DATABASE IF NOT EXISTS `erp-demo` DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
USE `erp-demo`;

CREATE TABLE IF NOT EXISTS tbl_page (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  url VARCHAR(200) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_action (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_permission (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  note VARCHAR(500) NULL,
  page_id BIGINT NOT NULL,
  action_id BIGINT NOT NULL,
  CONSTRAINT uk_permission_page_action UNIQUE (page_id, action_id),
  CONSTRAINT fk_permission_page FOREIGN KEY (page_id) REFERENCES tbl_page(id),
  CONSTRAINT fk_permission_action FOREIGN KEY (action_id) REFERENCES tbl_action(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_department (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_role (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  summary VARCHAR(500) NULL,
  department_id BIGINT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_role_department FOREIGN KEY (department_id) REFERENCES tbl_department(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_role_permission (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES tbl_role(id),
  CONSTRAINT fk_role_permission_perm FOREIGN KEY (permission_id) REFERENCES tbl_permission(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_user (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  account_type TINYINT NOT NULL DEFAULT 2,
  level_code VARCHAR(50) NULL,
  base_salary DECIMAL(15,2) NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_user_account_type CHECK (account_type IN (1,2,3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_user_role (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES tbl_user(id),
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES tbl_role(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_token (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiration_time DATETIME NOT NULL,
  CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES tbl_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_invalidated_token (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  expiry_time DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO tbl_action (id, code, name) VALUES
  (1, 'access', 'Truy cập'), (2, 'create', 'Tạo mới'),
  (3, 'update', 'Chỉnh sửa'), (4, 'delete', 'Xóa');

INSERT IGNORE INTO tbl_page (code, name, url) VALUES
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

INSERT IGNORE INTO tbl_page (code, name, url) VALUES
  ('mission-ho-so-nhiem-vu', 'Hồ sơ nhiệm vụ', '/ke-hoach-nhiem-vu-du-an/ho-so-nhiem-vu'),
  ('mission-ke-hoach', 'Kế hoạch nhiệm vụ', '/ke-hoach-nhiem-vu-du-an/ke-hoach'),
  ('mission-theo-doi-tien-do', 'Theo dõi tiến độ nhiệm vụ', '/ke-hoach-nhiem-vu-du-an/theo-doi-tien-do'),
  ('mission-nguon-luc-nhiem-vu', 'Nguồn lực nhiệm vụ', '/ke-hoach-nhiem-vu-du-an/nguon-luc-nhiem-vu'),
  ('mission-so-sanh-don-vi', 'So sánh đơn vị', '/ke-hoach-nhiem-vu-du-an/so-sanh-don-vi');

INSERT IGNORE INTO tbl_permission (code, label, page_id, action_id)
SELECT CONCAT(p.code, ':', a.code), CONCAT(p.name, ' - ', a.name), p.id, a.id
FROM tbl_page p CROSS JOIN tbl_action a;

INSERT IGNORE INTO tbl_role (code, name, summary) VALUES
  ('admin', 'Admin', 'Toàn quyền hệ thống');
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r CROSS JOIN tbl_permission p WHERE r.code = 'admin';

-- Default admin credentials are only for local demo bootstrap; change them immediately.
INSERT IGNORE INTO tbl_user (username, email, password, full_name, account_type)
VALUES ('admin', 'admin@local', '$2a$10$XEQ11hTuAuSyO17Ny2YEF.ZTlWMSmY3k8qkVpQGQpF0mt4.FVpRmi', 'System Admin', 1);
INSERT IGNORE INTO tbl_user_role (user_id, role_id)
SELECT u.id, r.id FROM tbl_user u CROSS JOIN tbl_role r WHERE u.email = 'admin@local' AND r.code = 'admin';
