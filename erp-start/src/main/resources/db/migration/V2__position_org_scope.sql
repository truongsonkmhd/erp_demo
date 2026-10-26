-- Chức vụ (Position) tách khỏi Role, đơn vị dạng cây và audit log (Đặc tả phân quyền chức vụ/role/permission).
-- Idempotent: a fresh database already has the tables and columns from environment/mysql/init/auth_init.sql, so every
-- DDL step only runs when its object is missing; the data steps only fill what is not set yet.

-- 1. Danh mục chức vụ: level 1 là cấp cao nhất; manages_unit = quản lý đơn vị mình và các đơn vị con.
CREATE TABLE IF NOT EXISTS tbl_position (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  level INT NOT NULL,
  manages_unit TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Audit log cho thao tác nhạy cảm (đổi quyền, chức vụ, đơn vị, tài khoản).
CREATE TABLE IF NOT EXISTS tbl_audit_log (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id BIGINT NULL,
  actor_username VARCHAR(100) NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100) NULL,
  detail VARCHAR(2000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_resource (resource_type, resource_id),
  INDEX idx_audit_actor (actor_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Đơn vị dạng cây (tbl_department là org unit), người dùng thuộc một đơn vị và giữ một chức vụ.
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_department' AND COLUMN_NAME = 'parent_id');
SET @ddl := IF(@has = 0, 'ALTER TABLE tbl_department ADD COLUMN parent_id BIGINT NULL, ADD CONSTRAINT fk_department_parent FOREIGN KEY (parent_id) REFERENCES tbl_department(id)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_user' AND COLUMN_NAME = 'position_id');
SET @ddl := IF(@has = 0, 'ALTER TABLE tbl_user ADD COLUMN position_id BIGINT NULL, ADD CONSTRAINT fk_user_position FOREIGN KEY (position_id) REFERENCES tbl_position(id)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_user' AND COLUMN_NAME = 'department_id');
SET @ddl := IF(@has = 0, 'ALTER TABLE tbl_user ADD COLUMN department_id BIGINT NULL, ADD CONSTRAINT fk_user_department FOREIGN KEY (department_id) REFERENCES tbl_department(id)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_user' AND INDEX_NAME = 'idx_user_department');
SET @ddl := IF(@has = 0, 'CREATE INDEX idx_user_department ON tbl_user (department_id)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Data.
INSERT INTO tbl_position (code, name, level, manages_unit) VALUES
  ('LANH_DAO', 'Lãnh đạo', 1, 1),
  ('TRUONG_DON_VI', 'Trưởng phòng / Đoàn trưởng', 2, 1),
  ('NHAN_VIEN', 'Nhân viên', 3, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name), level = VALUES(level), manages_unit = VALUES(manages_unit);

-- Ban Lãnh đạo là gốc; các phòng, đoàn và trung tâm là đơn vị con.
UPDATE tbl_department child
JOIN tbl_department root ON root.code = 'BLD'
SET child.parent_id = root.id
WHERE child.code IN ('KT', 'KHTC', 'TCHC', 'MD', 'DB', 'HK', 'TT') AND child.parent_id IS NULL;

-- Đơn vị của người dùng lấy từ đơn vị gắn với role hiện tại (chỉ khi chưa được gán).
UPDATE tbl_user u
JOIN tbl_user_role ur ON ur.user_id = u.id
JOIN tbl_role r ON r.id = ur.role_id
SET u.department_id = r.department_id
WHERE u.department_id IS NULL AND r.department_id IS NOT NULL;

-- Chức vụ mặc định của các tài khoản VLDC (chỉ khi chưa được gán).
UPDATE tbl_user u
JOIN tbl_user_role ur ON ur.user_id = u.id
JOIN tbl_role r ON r.id = ur.role_id
JOIN (
  SELECT 'lanhdao' AS role_code, 'LANH_DAO' AS position_code UNION ALL
  SELECT 'truongdonvi', 'TRUONG_DON_VI' UNION ALL
  SELECT 'matdat', 'TRUONG_DON_VI' UNION ALL
  SELECT 'bien', 'TRUONG_DON_VI' UNION ALL
  SELECT 'hangkhong', 'TRUONG_DON_VI' UNION ALL
  SELECT 'trungtam', 'TRUONG_DON_VI' UNION ALL
  SELECT 'ketoantruong', 'TRUONG_DON_VI' UNION ALL
  SELECT 'chunhiem', 'NHAN_VIEN' UNION ALL
  SELECT 'kythuat', 'NHAN_VIEN' UNION ALL
  SELECT 'kehoach', 'NHAN_VIEN' UNION ALL
  SELECT 'tochuc', 'NHAN_VIEN' UNION ALL
  SELECT 'hientruong', 'NHAN_VIEN' UNION ALL
  SELECT 'ketoan', 'NHAN_VIEN'
) m ON m.role_code = r.code
JOIN tbl_position p ON p.code = m.position_code
SET u.position_id = p.id
WHERE u.position_id IS NULL;

-- BR-07: business roles do not administer roles/permissions. VLDC pages now read titles and units from
-- GET /api/org/directory, so the read access granted by 20261022_vldc_departments.sql is withdrawn.
DELETE rp FROM tbl_role_permission rp
JOIN tbl_role r ON r.id = rp.role_id
JOIN tbl_permission p ON p.id = rp.permission_id
WHERE p.code = 'roles:access'
  AND r.code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem',
                 'kythuat', 'kehoach', 'tochuc', 'hientruong', 'ketoan', 'ketoantruong');
