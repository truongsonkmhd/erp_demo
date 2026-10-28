-- Nhân sự, năng lực, phòng ban (tổ/phòng) và trang Tài khoản của VLDC, chuyển từ Firestore sang MySQL.
-- Tổ/phòng là node con trong cây tbl_department, nên phạm vi quản lý (AuthorizationService.subtreeUnitIds) bao luôn tổ.
-- Idempotent: mọi bước DDL chỉ chạy khi đối tượng chưa có, dữ liệu dùng INSERT IGNORE / NOT EXISTS / IS NULL.

-- 1. Đơn vị: loại node, chức năng nhiệm vụ, trưởng/phó, trạng thái.
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_department' AND COLUMN_NAME = 'kind');
SET @ddl := IF(@has = 0, 'ALTER TABLE tbl_department
  ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT ''DON_VI'',
  ADD COLUMN unit_type VARCHAR(50) NULL,
  ADD COLUMN mission VARCHAR(2000) NULL,
  ADD COLUMN head_employee_id BIGINT NULL,
  ADD COLUMN deputy_employee_id BIGINT NULL,
  ADD COLUMN sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN created_at DATETIME NULL,
  ADD COLUMN dissolved_at DATETIME NULL', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Hồ sơ nhân sự; department_id là đơn vị hoặc tổ đang công tác, user_id là tài khoản đăng nhập (nếu có).
CREATE TABLE IF NOT EXISTS tbl_employee (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  gender VARCHAR(10) NULL,
  birth_year INT NOT NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(150) NULL,
  education VARCHAR(30) NOT NULL,
  major VARCHAR(150) NOT NULL,
  work_start_year INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  department_id BIGINT NOT NULL,
  on_field TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'DANG_LAM',
  left_at DATE NULL,
  user_id BIGINT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100) NULL,
  INDEX idx_employee_department (department_id),
  INDEX idx_employee_status (status),
  CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES tbl_department(id),
  CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES tbl_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_employee_certificate (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  number VARCHAR(50) NULL,
  issued_by VARCHAR(200) NULL,
  expires_at DATE NULL,
  INDEX idx_certificate_employee (employee_id),
  INDEX idx_certificate_expires (expires_at),
  CONSTRAINT fk_certificate_employee FOREIGN KEY (employee_id) REFERENCES tbl_employee(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lịch sử điều chuyển; from/to là đơn vị hoặc tổ.
CREATE TABLE IF NOT EXISTS tbl_employee_transfer (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  from_department_id BIGINT NULL,
  to_department_id BIGINT NOT NULL,
  effective_date DATE NOT NULL,
  note VARCHAR(500) NULL,
  created_by VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transfer_employee (employee_id, effective_date),
  CONSTRAINT fk_transfer_employee FOREIGN KEY (employee_id) REFERENCES tbl_employee(id) ON DELETE CASCADE,
  CONSTRAINT fk_transfer_from FOREIGN KEY (from_department_id) REFERENCES tbl_department(id),
  CONSTRAINT fk_transfer_to FOREIGN KEY (to_department_id) REFERENCES tbl_department(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Năng lực: danh mục kỹ năng và mức 1–5 của từng người.
CREATE TABLE IF NOT EXISTS tbl_skill (
  code VARCHAR(30) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_employee_skill (
  employee_id BIGINT NOT NULL,
  skill_code VARCHAR(30) NOT NULL,
  level TINYINT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100) NULL,
  PRIMARY KEY (employee_id, skill_code),
  INDEX idx_employee_skill_level (skill_code, level),
  CONSTRAINT fk_employee_skill_employee FOREIGN KEY (employee_id) REFERENCES tbl_employee(id) ON DELETE CASCADE,
  CONSTRAINT fk_employee_skill_skill FOREIGN KEY (skill_code) REFERENCES tbl_skill(code),
  CONSTRAINT chk_employee_skill_level CHECK (level BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO tbl_skill (code, name, sort_order) VALUES
  ('geophysics', 'Địa vật lý', 1),
  ('gis', 'GIS – Bản đồ', 2),
  ('data', 'Xử lý dữ liệu', 3),
  ('pm', 'Quản lý dự án', 4);

-- Trưởng/phó trỏ tới hồ sơ nhân sự (thêm sau khi tbl_employee đã có).
SET @has := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_department' AND CONSTRAINT_NAME = 'fk_department_head');
SET @ddl := IF(@has = 0, 'ALTER TABLE tbl_department
  ADD CONSTRAINT fk_department_head FOREIGN KEY (head_employee_id) REFERENCES tbl_employee(id),
  ADD CONSTRAINT fk_department_deputy FOREIGN KEY (deputy_employee_id) REFERENCES tbl_employee(id)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Trang Tài khoản và quyền thao tác.
INSERT IGNORE INTO tbl_page (code, name, url) VALUES ('vldc-accounts', 'Tài khoản', '/vldc/accounts');
INSERT IGNORE INTO tbl_permission (code, label, page_id, action_id)
SELECT CONCAT(p.code, ':', a.code), CONCAT(p.name, ' - ', a.name), p.id, a.id
FROM tbl_page p CROSS JOIN tbl_action a WHERE p.code = 'vldc-accounts';

SET @has := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_menu');
SET @ddl := IF(@has = 1, 'INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
  SELECT ''vldc-accounts'', ''Tài khoản'', ''KeyRound'', g.id, p.id, ''vldc'', 306
  FROM tbl_menu g JOIN tbl_page p ON p.code = ''vldc-accounts'' WHERE g.code = ''vldc-grp-organization''
  ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- vldc-hr:create / vldc-organization:create = làm trên toàn Liên đoàn (Lãnh đạo, Phòng TC-HC);
-- :update không kèm :create = chỉ trong đơn vị mình quản lý (trưởng đơn vị). Admin đã có mọi quyền.
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r JOIN tbl_permission p ON p.code IN (
  'vldc-hr:create', 'vldc-hr:update', 'vldc-hr:delete', 'vldc-organization:create', 'vldc-organization:update',
  'vldc-accounts:access', 'vldc-accounts:create', 'vldc-accounts:update')
WHERE r.code IN ('lanhdao', 'tochuc');

INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r JOIN tbl_permission p ON p.code IN ('vldc-hr:update', 'vldc-organization:update')
WHERE r.code IN ('truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'ketoantruong');

INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r CROSS JOIN tbl_permission p WHERE r.code = 'admin' AND p.code LIKE 'vldc-accounts:%';

-- 5. Dữ liệu ban đầu (sinh từ seed của frontend, ngày gốc 27/10/2026).
-- Đơn vị cấp 1: loại, chức năng nhiệm vụ (từ trang Cơ cấu & Chức năng).
UPDATE tbl_department SET kind = 'DON_VI', unit_type = 'Điều hành', mission = COALESCE(mission, 'Chỉ đạo toàn diện hoạt động của Liên đoàn; phân công lĩnh vực, ban hành quy chế và quyết định quản trị.'), sort_order = 1 WHERE code = 'BLD';
UPDATE tbl_department SET kind = 'DON_VI', unit_type = 'Bộ máy giúp việc', mission = COALESCE(mission, 'Tổ chức bộ máy, nhân sự, chế độ chính sách, thi đua, đào tạo; văn thư–lưu trữ; hành chính, hậu cần, xe, ATLĐ, PCCC, cơ sở vật chất; tổng hợp và thông báo kết luận lãnh đạo.'), sort_order = 2 WHERE code = 'TCHC';
UPDATE tbl_department SET kind = 'DON_VI', unit_type = 'Bộ máy giúp việc', mission = COALESCE(mission, 'Tham mưu xây dựng và triển khai nhiệm vụ địa chất–địa vật lý; quản lý khoa học kỹ thuật, chất lượng, kiểm tra, nghiệm thu, dữ liệu chuyên môn và dịch vụ kỹ thuật.'), sort_order = 3 WHERE code = 'KT';
UPDATE tbl_department SET kind = 'DON_VI', unit_type = 'Bộ máy giúp việc', mission = COALESCE(mission, 'Kế hoạch, dự toán, định mức–đơn giá, hợp đồng kinh tế, tài chính–kế toán, công nợ, tài sản theo giá trị, thanh quyết toán và báo cáo tài chính.'), sort_order = 4 WHERE code = 'KHTC';
UPDATE tbl_department SET kind = 'DON_VI', unit_type = 'Đơn vị trực thuộc', mission = COALESCE(mission, 'Điều tra địa vật lý hàng không phục vụ điều tra cơ bản địa chất, khoáng sản trên đất liền và trên biển; thực hiện dịch vụ sự nghiệp công và dịch vụ địa chất, khoáng sản.'), sort_order = 5 WHERE code = 'HK';
UPDATE tbl_department SET kind = 'DON_VI', unit_type = 'Đơn vị trực thuộc', mission = COALESCE(mission, 'Điều tra địa vật lý trên đất liền; thăm dò khoáng sản, ĐCMT, ĐCCT–ĐCTV, tai biến địa chất; kiểm tra chi tiết dị thường địa vật lý hàng không.'), sort_order = 6 WHERE code = 'MD';
UPDATE tbl_department SET kind = 'DON_VI', unit_type = 'Đơn vị trực thuộc', mission = COALESCE(mission, 'Điều tra địa vật lý biển và hải đảo phục vụ địa chất, khoáng sản, môi trường, ĐCCT–ĐCTV và tai biến địa chất.'), sort_order = 7 WHERE code = 'DB';
UPDATE tbl_department SET kind = 'DON_VI', unit_type = 'Đơn vị trực thuộc', mission = COALESCE(mission, 'Hiệu chuẩn, kiểm định máy đo địa vật lý; nghiên cứu ứng dụng phương pháp địa vật lý; bảo dưỡng sửa chữa thiết bị, phân tích mẫu tham số vật lý, quản lý kho mẫu phóng xạ và thực hiện dịch vụ.'), sort_order = 8 WHERE code = 'TT';

-- Tổ/phòng: node con của đơn vị, mã giữ nguyên id cũ (dự án, đề tài, công việc đang tham chiếu).
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'KT-DVL', 'Bộ phận Địa vật lý', p.id, 'BO_PHAN', 'Thẩm định phương án kỹ thuật, kiểm tra chất lượng tài liệu địa vật lý', 100, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'KT';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'KT-GIS', 'Bộ phận GIS – Bản đồ', p.id, 'BO_PHAN', 'Biên tập bản đồ, quản trị dữ liệu không gian', 101, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'KT';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'KT-CNTT', 'Bộ phận CNTT', p.id, 'BO_PHAN', 'Hạ tầng CNTT, phần mềm xử lý và chuyển đổi số', 102, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'KT';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'KHTC-KH', 'Bộ phận Kế hoạch', p.id, 'BO_PHAN', 'Lập kế hoạch, dự toán, theo dõi giao nhiệm vụ', 103, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'KHTC';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'KHTC-KT', 'Bộ phận Kế toán', p.id, 'BO_PHAN', 'Kế toán, thanh quyết toán, công nợ', 104, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'KHTC';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'TCHC-TC', 'Bộ phận Tổ chức cán bộ', p.id, 'BO_PHAN', 'Nhân sự, đào tạo, thi đua khen thưởng', 105, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'TCHC';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'TCHC-HC', 'Bộ phận Hành chính – Văn thư', p.id, 'BO_PHAN', 'Văn thư, lưu trữ, hành chính quản trị', 106, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'TCHC';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'MD-DIEN', 'Tổ đo điện', p.id, 'TO', 'Đo sâu điện, phân cực kích thích', 107, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'MD';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'MD-TU', 'Tổ đo từ – trọng lực', p.id, 'TO', 'Đo từ, trọng lực mặt đất', 108, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'MD';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'MD-TD', 'Tổ trắc địa', p.id, 'TO', 'Bố trí tuyến, định vị điểm đo', 109, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'MD';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'MD-XL', 'Tổ xử lý số liệu', p.id, 'TO', 'Xử lý, minh giải tài liệu thực địa', 110, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'MD';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'DB-DC', 'Tổ địa chấn', p.id, 'TO', 'Thu nổ địa chấn nông phân giải cao', 111, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'DB';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'DB-TT', 'Tổ từ – trọng lực biển', p.id, 'TO', 'Đo từ, trọng lực trên tàu', 112, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'DB';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'DB-HC', 'Đội tàu & hậu cần', p.id, 'DOI', 'Vận hành tàu khảo sát, hậu cần trên biển', 113, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'DB';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'HK-BAY', 'Tổ bay đo', p.id, 'TO', 'Bay đo từ, phổ gamma hàng không', 114, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'HK';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'HK-XL', 'Tổ xử lý dữ liệu bay', p.id, 'TO', 'Hiệu chỉnh, xử lý dữ liệu bay đo', 115, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'HK';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'TT-KD', 'Phòng kiểm định', p.id, 'PHONG', 'Kiểm định, hiệu chuẩn máy địa vật lý', 116, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'TT';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'TT-SC', 'Xưởng sửa chữa', p.id, 'XUONG', 'Sửa chữa, bảo dưỡng thiết bị', 117, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'TT';
INSERT IGNORE INTO tbl_department (code, name, parent_id, kind, mission, sort_order, active, created_at) SELECT 'TT-NC', 'Tổ nghiên cứu chế tạo', p.id, 'TO', 'Nghiên cứu, chế tạo thiết bị mới', 118, 1, '2026-01-01 08:00:00' FROM tbl_department p WHERE p.code = 'TT';

-- Hồ sơ nhân sự (123 người, công bố trên vatlydiachat.gov.vn).
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-001', 'Nguyễn Văn An', 1977, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2001, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-DIEN';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-002', 'Trần Thị Bình', 1977, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2005, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KT-DVL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-003', 'Lê Quang Cường', 1987, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2015, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-DC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-004', 'Phạm Minh Đức', 1984, 'Thạc sĩ', 'Địa vật lý', 2012, 'Kỹ sư chính', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-BAY';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-005', 'Hoàng Thu Giang', 1971, 'Thạc sĩ', 'Công nghệ thông tin', 1995, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-006', 'Vũ Đình Hải', 1978, 'Thạc sĩ', 'Địa vật lý', 2005, 'Kỹ sư chính', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-TU';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-007', 'Đặng Thị Kim', 1995, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2020, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KT-GIS';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-008', 'Bùi Văn Long', 1989, 'Thạc sĩ', 'Địa vật lý', 2014, 'Kỹ sư chính', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-TT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-009', 'Nguyễn Văn Minh', 1968, 'Tiến sĩ', 'Địa vật lý', 1996, 'Liên đoàn trưởng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'BLD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-010', 'Nguyễn Thị Hồng Minh', 1980, 'Thạc sĩ', 'Quản trị nhân lực', 2007, 'Trưởng phòng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TCHC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-011', 'Nguyễn Vân Sang', 1977, 'Tiến sĩ', 'Địa vật lý', 2007, 'Trưởng phòng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-012', 'Nguyễn Thị Lan Hương', 1984, 'Thạc sĩ', 'Kế toán', 2010, 'Trưởng phòng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KHTC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-013', 'Bùi Minh Thành', 1974, 'Thạc sĩ', 'Địa vật lý', 2002, 'Đoàn trưởng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-014', 'Phạm Quang Hưng', 1967, 'Thạc sĩ', 'Địa vật lý', 1995, 'Đoàn trưởng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-015', 'Nguyễn Văn Hành', 1987, 'Thạc sĩ', 'Địa vật lý', 2010, 'Đoàn trưởng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-016', 'Trần Anh Tuấn', 1984, 'Thạc sĩ', 'Điện tử – Tự động hóa', 2009, 'Giám đốc', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-017', 'Đỗ Văn Lộc', 1978, 'Thạc sĩ', 'Địa chất', 2004, 'Phó Liên đoàn trưởng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'BLD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-018', 'Lê Hữu Thắng', 1972, 'Thạc sĩ', 'Địa chất', 1997, 'Phó Liên đoàn trưởng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'BLD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-019', 'Trịnh Đức Phong', 1978, 'Thạc sĩ', 'Địa vật lý', 2002, 'Phó Liên đoàn trưởng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'BLD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-020', 'Vũ Thị Hà', 1978, 'Kỹ sư/Cử nhân', 'Luật', 2002, 'Phó trưởng phòng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TCHC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-021', 'Mai Hữu Vinh', 1989, 'Kỹ sư/Cử nhân', 'Quản trị nhân lực', 2015, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TCHC-TC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-022', 'Trần Quang Tiến', 1993, 'Kỹ sư/Cử nhân', 'Hành chính công', 2016, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TCHC-HC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-023', 'Dương Phương Quỳnh', 1990, 'Kỹ sư/Cử nhân', 'Hành chính công', 2013, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TCHC-TC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-024', 'Phạm Đức Trung', 1992, 'Kỹ sư/Cử nhân', 'Hành chính công', 2018, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TCHC-HC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-025', 'Đặng Thị Trang', 1992, 'Kỹ sư/Cử nhân', 'Luật', 2017, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TCHC-TC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-026', 'Phạm Quang Quân', 1983, 'Kỹ sư/Cử nhân', 'Tài chính – Ngân hàng', 2008, 'Phó trưởng phòng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KHTC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-027', 'Mai Ngọc Hằng', 1987, 'Kỹ sư/Cử nhân', 'Kinh tế', 2012, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KHTC-KH';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-028', 'Bùi Thị Linh', 1986, 'Kỹ sư/Cử nhân', 'Kinh tế', 2013, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KHTC-KT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-029', 'Mai Minh Phong', 2000, 'Kỹ sư/Cử nhân', 'Kế toán', 2026, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KHTC-KH';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-030', 'Đinh Thành Trung', 1996, 'Kỹ sư/Cử nhân', 'Kế toán', 2021, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KHTC-KT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-031', 'Hoàng Quang Toàn', 2000, 'Kỹ sư/Cử nhân', 'Kế toán', 2024, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KHTC-KH';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-032', 'Hoàng Thu Anh', 1996, 'Kỹ sư/Cử nhân', 'Kế toán', 2019, 'Chuyên viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KHTC-KT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-033', 'Đinh Thị Yến', 1981, 'KTV/Công nhân', 'Công nghệ thông tin', 2004, 'Phó trưởng phòng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-034', 'Dương Thành Toàn', 1996, 'KTV/Công nhân', 'Công nghệ thông tin', 2021, 'Kỹ thuật viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KT-GIS';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-035', 'Mai Ngọc Mai', 1996, 'KTV/Công nhân', 'Địa chất', 2022, 'Công nhân kỹ thuật', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KT-CNTT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-036', 'Trần Hữu Lộc', 1993, 'KTV/Công nhân', 'Trắc địa – GIS', 2021, 'Kỹ thuật viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KT-DVL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-037', 'Trần Văn Quân', 1994, 'KTV/Công nhân', 'Trắc địa – GIS', 2022, 'Kỹ thuật viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KT-GIS';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-038', 'Ngô Thu Linh', 1990, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2018, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KT-CNTT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-039', 'Phạm Thu Lan', 1995, 'Kỹ sư/Cử nhân', 'Công nghệ thông tin', 2018, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'KT-DVL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-040', 'Đinh Thu Hoa', 1979, 'KTV/Công nhân', 'Địa vật lý', 2003, 'Phó đoàn trưởng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-041', 'Bùi Ngọc Linh', 1986, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2012, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-042', 'Đỗ Đức Dũng', 1989, 'Kỹ sư/Cử nhân', 'Điện tử – Tự động hóa', 2012, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-BAY';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-043', 'Trịnh Thành Quân', 1988, 'Kỹ sư/Cử nhân', 'Địa chất', 2013, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-044', 'Bùi Thanh Mai', 1987, 'KTV/Công nhân', 'Địa chất', 2014, 'Công nhân kỹ thuật', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-BAY';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-045', 'Đỗ Đức Việt', 1993, 'Kỹ sư/Cử nhân', 'Điện tử – Tự động hóa', 2017, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-046', 'Hoàng Thành Tùng', 1996, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2024, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-BAY';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-047', 'Đặng Thị Hoa', 1992, 'Kỹ sư/Cử nhân', 'Địa chất', 2020, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-048', 'Mai Đức Nam', 1997, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2020, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-BAY';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-049', 'Hoàng Phương Yến', 1985, 'KTV/Công nhân', 'Điện tử – Tự động hóa', 2013, 'Kỹ thuật viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-050', 'Nguyễn Minh Nam', 1990, 'Kỹ sư/Cử nhân', 'Địa chất', 2013, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-BAY';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-051', 'Mai Thanh Linh', 1991, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2019, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-052', 'Lê Thu Linh', 1992, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2018, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-BAY';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-053', 'Mai Thành Khánh', 1998, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2021, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-054', 'Lê Thị Oanh', 1996, 'KTV/Công nhân', 'Điện tử – Tự động hóa', 2022, 'Kỹ thuật viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-BAY';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-055', 'Hồ Đức Dũng', 1988, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2014, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-056', 'Đinh Quang Tiến', 1989, 'Kỹ sư/Cử nhân', 'Địa chất', 2017, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-BAY';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-057', 'Hồ Thành Huy', 1983, 'KTV/Công nhân', 'Địa chất', 2011, 'Kỹ thuật viên', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'HK-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-058', 'Ngô Văn Quân', 1977, 'Thạc sĩ', 'Trắc địa – GIS', 2004, 'Phó đoàn trưởng', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-059', 'Dương Đức Bảo', 1993, 'KTV/Công nhân', 'Địa vật lý', 2017, 'Kỹ thuật viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-DIEN';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-060', 'Lê Minh Tùng', 1991, 'Thạc sĩ', 'Địa vật lý', 2014, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-TU';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-061', 'Mai Văn Phong', 1994, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2019, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-TD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-062', 'Ngô Ngọc Hoa', 1975, 'Kỹ sư/Cử nhân', 'Địa chất', 2002, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-063', 'Trịnh Phương Anh', 1988, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2011, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-DIEN';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-064', 'Hoàng Hữu Nam', 1985, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2013, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-TU';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-065', 'Lê Đức Hùng', 1993, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2019, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-TD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-066', 'Nguyễn Thanh Trang', 1987, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2013, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-067', 'Ngô Thanh Quỳnh', 1984, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2012, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-DIEN';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-068', 'Đặng Đức Hùng', 1993, 'Kỹ sư/Cử nhân', 'Địa chất', 2017, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-TU';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-069', 'Đặng Thanh Linh', 2000, 'Kỹ sư/Cử nhân', 'Địa chất', 2023, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-TD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-070', 'Bùi Thành Việt', 2002, 'Kỹ sư/Cử nhân', 'Địa chất', 2026, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-XL';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-071', 'Đặng Thị Nhung', 1979, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2002, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-DIEN';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-072', 'Hồ Quang Quân', 1987, 'KTV/Công nhân', 'Địa chất', 2011, 'Công nhân kỹ thuật', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-TU';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-073', 'Đinh Công Trung', 1991, 'KTV/Công nhân', 'Địa vật lý', 2017, 'Kỹ thuật viên', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'MD-TD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-074', 'Ngô Phương Ngân', 1977, 'KTV/Công nhân', 'Trắc địa – GIS', 2000, 'Phó đoàn trưởng', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-075', 'Hồ Hữu Tùng', 1983, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2007, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-TT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-076', 'Bùi Thị Ngân', 1974, 'Kỹ sư/Cử nhân', 'Địa chất', 1998, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-HC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-077', 'Đỗ Phương Ngân', 1989, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2016, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-DC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-078', 'Mai Ngọc Trang', 1993, 'Thạc sĩ', 'Địa vật lý', 2020, 'Kỹ sư chính', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-TT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-079', 'Đỗ Đức Huy', 1980, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2008, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-HC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-080', 'Dương Phương Trang', 1977, 'Thạc sĩ', 'Địa vật lý', 2002, 'Kỹ sư chính', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-DC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-081', 'Phạm Văn Tùng', 1977, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2000, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-TT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-082', 'Đặng Phương Ngân', 1976, 'Kỹ sư/Cử nhân', 'Điện tử – Tự động hóa', 2002, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-HC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-083', 'Trần Văn Tiến', 1990, 'Kỹ sư/Cử nhân', 'Địa chất', 2014, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-DC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-084', 'Lê Minh Vinh', 1975, 'KTV/Công nhân', 'Địa vật lý', 2000, 'Công nhân kỹ thuật', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-TT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-085', 'Phạm Phương Thảo', 2003, 'KTV/Công nhân', 'Địa vật lý', 2026, 'Kỹ thuật viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-HC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-086', 'Mai Thành Toàn', 1988, 'Kỹ sư/Cử nhân', 'Địa chất', 2014, 'Kỹ sư', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-DC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-087', 'Nguyễn Quang Trung', 1995, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2020, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-TT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-088', 'Ngô Công Bảo', 1993, 'Kỹ sư/Cử nhân', 'Trắc địa – GIS', 2020, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-HC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-089', 'Phạm Thành Trung', 1973, 'Thạc sĩ', 'Địa vật lý', 2001, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-DC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-090', 'Hồ Thu Hà', 1989, 'KTV/Công nhân', 'Địa vật lý', 2012, 'Kỹ thuật viên', d.id, 1, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'DB-TT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-091', 'Phạm Thành Hùng', 1983, 'Kỹ sư/Cử nhân', 'Công nghệ thông tin', 2007, 'Phó giám đốc', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-092', 'Hoàng Quang Phong', 1987, 'Kỹ sư/Cử nhân', 'Cơ khí', 2015, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-093', 'Lê Công Trung', 1993, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2016, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-094', 'Phạm Hữu Sơn', 1999, 'Kỹ sư/Cử nhân', 'Điện tử – Tự động hóa', 2024, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-NC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-095', 'Đặng Phương Lan', 2003, 'Kỹ sư/Cử nhân', 'Điện tử – Tự động hóa', 2026, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-096', 'Trần Ngọc Lan', 1989, 'Kỹ sư/Cử nhân', 'Công nghệ thông tin', 2014, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-097', 'Trần Thị Trang', 1997, 'KTV/Công nhân', 'Điện tử – Tự động hóa', 2020, 'Kỹ thuật viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-NC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-098', 'Đặng Ngọc Mai', 1984, 'Thạc sĩ', 'Công nghệ thông tin', 2011, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-099', 'Trịnh Công Khánh', 1986, 'KTV/Công nhân', 'Công nghệ thông tin', 2010, 'Kỹ thuật viên', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-100', 'Đinh Ngọc Anh', 1998, 'Kỹ sư/Cử nhân', 'Công nghệ thông tin', 2022, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-NC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-101', 'Trịnh Quang Việt', 1982, 'Kỹ sư/Cử nhân', 'Điện tử – Tự động hóa', 2007, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-102', 'Lê Ngọc Quỳnh', 1987, 'Kỹ sư/Cử nhân', 'Cơ khí', 2013, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-103', 'Trần Thanh Hằng', 1967, 'Kỹ sư/Cử nhân', 'Điện tử – Tự động hóa', 1994, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-NC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-104', 'Ngô Công Khánh', 1978, 'Thạc sĩ', 'Công nghệ thông tin', 2002, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-105', 'Phạm Minh Quân', 1967, 'Kỹ sư/Cử nhân', 'Địa vật lý', 1994, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-106', 'Lê Thanh Nhung', 1997, 'Kỹ sư/Cử nhân', 'Điện tử – Tự động hóa', 2023, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-NC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-107', 'Trần Thanh Lan', 1999, 'KTV/Công nhân', 'Công nghệ thông tin', 2023, 'Công nhân kỹ thuật', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-108', 'Lê Thu Lan', 1992, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2015, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-109', 'Trịnh Đức Trung', 1980, 'Thạc sĩ', 'Cơ khí', 2006, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-NC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-110', 'Dương Ngọc Yến', 1985, 'Thạc sĩ', 'Địa vật lý', 2012, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-111', 'Ngô Đức Thắng', 1975, 'Kỹ sư/Cử nhân', 'Cơ khí', 1998, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-112', 'Vũ Công Lộc', 1985, 'Kỹ sư/Cử nhân', 'Công nghệ thông tin', 2010, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-NC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-113', 'Lê Thu Thảo', 1976, 'Thạc sĩ', 'Địa vật lý', 2004, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-114', 'Đinh Thu Hằng', 1990, 'Thạc sĩ', 'Cơ khí', 2017, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-115', 'Đinh Thị Hoa', 1980, 'Kỹ sư/Cử nhân', 'Cơ khí', 2005, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-NC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-116', 'Vũ Đức Vinh', 1983, 'Kỹ sư/Cử nhân', 'Cơ khí', 2007, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-117', 'Dương Phương Hoa', 1989, 'Kỹ sư/Cử nhân', 'Cơ khí', 2017, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-118', 'Bùi Minh Thắng', 1997, 'Thạc sĩ', 'Công nghệ thông tin', 2021, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-NC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-119', 'Nguyễn Công Hiếu', 1989, 'Thạc sĩ', 'Công nghệ thông tin', 2017, 'Kỹ sư chính', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-120', 'Đặng Quang Phong', 1999, 'Kỹ sư/Cử nhân', 'Điện tử – Tự động hóa', 2022, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-121', 'Hồ Ngọc Oanh', 1993, 'Kỹ sư/Cử nhân', 'Cơ khí', 2021, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-NC';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-122', 'Lê Đức Hiếu', 1988, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2015, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-KD';
INSERT IGNORE INTO tbl_employee (code, full_name, birth_year, education, major, work_start_year, title, department_id, on_field, status, created_at, updated_at) SELECT 'NS-123', 'Đinh Thành Huy', 1975, 'Kỹ sư/Cử nhân', 'Địa vật lý', 2001, 'Kỹ sư', d.id, 0, 'DANG_LAM', NOW(), NOW() FROM tbl_department d WHERE d.code = 'TT-SC';

-- Chứng chỉ.
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Chứng chỉ hành nghề địa vật lý', '2027-06-04' FROM tbl_employee e WHERE e.code = 'NS-001' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Chứng chỉ hành nghề địa vật lý');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Chứng chỉ hành nghề địa vật lý', '2026-12-01' FROM tbl_employee e WHERE e.code = 'NS-002' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Chứng chỉ hành nghề địa vật lý');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Chứng chỉ hành nghề địa vật lý', '2026-12-14' FROM tbl_employee e WHERE e.code = 'NS-003' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Chứng chỉ hành nghề địa vật lý');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Chứng chỉ hành nghề địa vật lý', '2027-08-23' FROM tbl_employee e WHERE e.code = 'NS-004' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Chứng chỉ hành nghề địa vật lý');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Chứng chỉ hành nghề địa vật lý', '2026-11-16' FROM tbl_employee e WHERE e.code = 'NS-005' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Chứng chỉ hành nghề địa vật lý');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Chứng chỉ hành nghề địa vật lý', '2027-03-26' FROM tbl_employee e WHERE e.code = 'NS-006' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Chứng chỉ hành nghề địa vật lý');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Chứng chỉ hành nghề địa vật lý', '2027-12-01' FROM tbl_employee e WHERE e.code = 'NS-007' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Chứng chỉ hành nghề địa vật lý');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Chứng chỉ hành nghề địa vật lý', '2026-12-21' FROM tbl_employee e WHERE e.code = 'NS-008' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Chứng chỉ hành nghề địa vật lý');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'GIS nâng cao', '2027-12-09' FROM tbl_employee e WHERE e.code = 'NS-011' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'GIS nâng cao');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn bức xạ', '2027-07-27' FROM tbl_employee e WHERE e.code = 'NS-013' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn bức xạ');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2027-09-18' FROM tbl_employee e WHERE e.code = 'NS-013' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn lao động', '2028-03-30' FROM tbl_employee e WHERE e.code = 'NS-014' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn lao động');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn làm việc trên biển', '2028-04-06' FROM tbl_employee e WHERE e.code = 'NS-015' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn làm việc trên biển');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành thiết bị địa chấn', '2028-03-18' FROM tbl_employee e WHERE e.code = 'NS-015' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành thiết bị địa chấn');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'GIS nâng cao', '2027-05-19' FROM tbl_employee e WHERE e.code = 'NS-035' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'GIS nâng cao');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'GIS nâng cao', '2027-04-24' FROM tbl_employee e WHERE e.code = 'NS-036' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'GIS nâng cao');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'GIS nâng cao', '2027-12-21' FROM tbl_employee e WHERE e.code = 'NS-038' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'GIS nâng cao');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'GIS nâng cao', '2027-03-12' FROM tbl_employee e WHERE e.code = 'NS-039' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'GIS nâng cao');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn bức xạ', '2027-05-09' FROM tbl_employee e WHERE e.code = 'NS-040' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn bức xạ');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2028-03-10' FROM tbl_employee e WHERE e.code = 'NS-041' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2027-11-27' FROM tbl_employee e WHERE e.code = 'NS-043' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2027-05-27' FROM tbl_employee e WHERE e.code = 'NS-044' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn bức xạ', '2027-11-15' FROM tbl_employee e WHERE e.code = 'NS-044' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn bức xạ');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2027-02-26' FROM tbl_employee e WHERE e.code = 'NS-046' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn bức xạ', '2027-04-21' FROM tbl_employee e WHERE e.code = 'NS-046' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn bức xạ');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2028-03-23' FROM tbl_employee e WHERE e.code = 'NS-047' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn bức xạ', '2027-11-10' FROM tbl_employee e WHERE e.code = 'NS-047' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn bức xạ');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2027-07-04' FROM tbl_employee e WHERE e.code = 'NS-048' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn bức xạ', '2027-04-26' FROM tbl_employee e WHERE e.code = 'NS-048' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn bức xạ');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn bức xạ', '2027-01-10' FROM tbl_employee e WHERE e.code = 'NS-053' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn bức xạ');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2028-01-07' FROM tbl_employee e WHERE e.code = 'NS-054' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2027-09-05' FROM tbl_employee e WHERE e.code = 'NS-055' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn bức xạ', '2027-08-28' FROM tbl_employee e WHERE e.code = 'NS-055' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn bức xạ');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2026-09-29' FROM tbl_employee e WHERE e.code = 'NS-056' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn bức xạ', '2026-12-06' FROM tbl_employee e WHERE e.code = 'NS-056' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn bức xạ');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn bức xạ', '2027-11-20' FROM tbl_employee e WHERE e.code = 'NS-057' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn bức xạ');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Khảo sát địa vật lý hàng không', '2027-02-27' FROM tbl_employee e WHERE e.code = 'NS-057' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Khảo sát địa vật lý hàng không');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành máy đo điện', '2028-03-18' FROM tbl_employee e WHERE e.code = 'NS-061' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành máy đo điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn lao động', '2028-03-22' FROM tbl_employee e WHERE e.code = 'NS-061' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn lao động');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn lao động', '2027-01-03' FROM tbl_employee e WHERE e.code = 'NS-062' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn lao động');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành máy đo điện', '2027-05-05' FROM tbl_employee e WHERE e.code = 'NS-062' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành máy đo điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành máy đo điện', '2027-07-05' FROM tbl_employee e WHERE e.code = 'NS-064' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành máy đo điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn lao động', '2027-03-28' FROM tbl_employee e WHERE e.code = 'NS-064' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn lao động');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành máy đo điện', '2027-08-11' FROM tbl_employee e WHERE e.code = 'NS-065' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành máy đo điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành máy đo điện', '2027-10-16' FROM tbl_employee e WHERE e.code = 'NS-066' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành máy đo điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn lao động', '2027-11-09' FROM tbl_employee e WHERE e.code = 'NS-066' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn lao động');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành máy đo điện', '2027-08-13' FROM tbl_employee e WHERE e.code = 'NS-067' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành máy đo điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn lao động', '2027-01-26' FROM tbl_employee e WHERE e.code = 'NS-067' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn lao động');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành máy đo điện', '2028-02-08' FROM tbl_employee e WHERE e.code = 'NS-070' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành máy đo điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn lao động', '2027-01-08' FROM tbl_employee e WHERE e.code = 'NS-071' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn lao động');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành máy đo điện', '2028-01-28' FROM tbl_employee e WHERE e.code = 'NS-072' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành máy đo điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn lao động', '2027-06-15' FROM tbl_employee e WHERE e.code = 'NS-072' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn lao động');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành máy đo điện', '2027-11-29' FROM tbl_employee e WHERE e.code = 'NS-073' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành máy đo điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành thiết bị địa chấn', '2026-12-14' FROM tbl_employee e WHERE e.code = 'NS-074' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành thiết bị địa chấn');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn làm việc trên biển', '2028-03-06' FROM tbl_employee e WHERE e.code = 'NS-075' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn làm việc trên biển');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn làm việc trên biển', '2027-02-02' FROM tbl_employee e WHERE e.code = 'NS-077' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn làm việc trên biển');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành thiết bị địa chấn', '2028-02-16' FROM tbl_employee e WHERE e.code = 'NS-077' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành thiết bị địa chấn');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành thiết bị địa chấn', '2027-11-24' FROM tbl_employee e WHERE e.code = 'NS-079' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành thiết bị địa chấn');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn làm việc trên biển', '2027-10-26' FROM tbl_employee e WHERE e.code = 'NS-081' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn làm việc trên biển');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành thiết bị địa chấn', '2028-01-25' FROM tbl_employee e WHERE e.code = 'NS-081' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành thiết bị địa chấn');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn làm việc trên biển', '2027-02-25' FROM tbl_employee e WHERE e.code = 'NS-083' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn làm việc trên biển');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành thiết bị địa chấn', '2028-03-03' FROM tbl_employee e WHERE e.code = 'NS-083' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành thiết bị địa chấn');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn làm việc trên biển', '2027-09-04' FROM tbl_employee e WHERE e.code = 'NS-084' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn làm việc trên biển');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn làm việc trên biển', '2028-03-09' FROM tbl_employee e WHERE e.code = 'NS-085' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn làm việc trên biển');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành thiết bị địa chấn', '2027-01-02' FROM tbl_employee e WHERE e.code = 'NS-085' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành thiết bị địa chấn');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn làm việc trên biển', '2027-03-03' FROM tbl_employee e WHERE e.code = 'NS-086' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn làm việc trên biển');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn làm việc trên biển', '2027-03-26' FROM tbl_employee e WHERE e.code = 'NS-090' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn làm việc trên biển');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Vận hành thiết bị địa chấn', '2027-12-30' FROM tbl_employee e WHERE e.code = 'NS-090' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Vận hành thiết bị địa chấn');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2026-10-07' FROM tbl_employee e WHERE e.code = 'NS-091' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2026-12-11' FROM tbl_employee e WHERE e.code = 'NS-095' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2028-02-24' FROM tbl_employee e WHERE e.code = 'NS-095' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2026-11-02' FROM tbl_employee e WHERE e.code = 'NS-096' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2027-04-19' FROM tbl_employee e WHERE e.code = 'NS-097' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2028-03-30' FROM tbl_employee e WHERE e.code = 'NS-097' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2026-10-26' FROM tbl_employee e WHERE e.code = 'NS-098' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-05-13' FROM tbl_employee e WHERE e.code = 'NS-098' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-01-13' FROM tbl_employee e WHERE e.code = 'NS-099' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2027-03-19' FROM tbl_employee e WHERE e.code = 'NS-099' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-10-21' FROM tbl_employee e WHERE e.code = 'NS-101' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2027-08-09' FROM tbl_employee e WHERE e.code = 'NS-101' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2027-04-09' FROM tbl_employee e WHERE e.code = 'NS-104' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-01-16' FROM tbl_employee e WHERE e.code = 'NS-104' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-03-25' FROM tbl_employee e WHERE e.code = 'NS-105' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2028-02-09' FROM tbl_employee e WHERE e.code = 'NS-105' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-07-11' FROM tbl_employee e WHERE e.code = 'NS-106' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2028-02-26' FROM tbl_employee e WHERE e.code = 'NS-107' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2027-06-05' FROM tbl_employee e WHERE e.code = 'NS-107' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-08-13' FROM tbl_employee e WHERE e.code = 'NS-108' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2028-03-07' FROM tbl_employee e WHERE e.code = 'NS-109' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2027-09-10' FROM tbl_employee e WHERE e.code = 'NS-109' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-02-26' FROM tbl_employee e WHERE e.code = 'NS-110' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2027-07-18' FROM tbl_employee e WHERE e.code = 'NS-110' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-10-12' FROM tbl_employee e WHERE e.code = 'NS-111' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2028-02-13' FROM tbl_employee e WHERE e.code = 'NS-114' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-06-19' FROM tbl_employee e WHERE e.code = 'NS-114' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2027-07-26' FROM tbl_employee e WHERE e.code = 'NS-117' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-05-13' FROM tbl_employee e WHERE e.code = 'NS-117' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'Kiểm định thiết bị đo', '2027-09-02' FROM tbl_employee e WHERE e.code = 'NS-118' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'Kiểm định thiết bị đo');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2026-10-24' FROM tbl_employee e WHERE e.code = 'NS-119' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');
INSERT INTO tbl_employee_certificate (employee_id, name, expires_at) SELECT e.id, 'An toàn điện', '2027-02-22' FROM tbl_employee e WHERE e.code = 'NS-120' AND NOT EXISTS (SELECT 1 FROM tbl_employee_certificate c WHERE c.employee_id = e.id AND c.name = 'An toàn điện');

-- Trưởng/phó đơn vị và tổ trưởng.
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-009' SET d.head_employee_id = e.id WHERE d.code = 'BLD' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-017' SET d.deputy_employee_id = e.id WHERE d.code = 'BLD' AND d.deputy_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-010' SET d.head_employee_id = e.id WHERE d.code = 'TCHC' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-020' SET d.deputy_employee_id = e.id WHERE d.code = 'TCHC' AND d.deputy_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-011' SET d.head_employee_id = e.id WHERE d.code = 'KT' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-033' SET d.deputy_employee_id = e.id WHERE d.code = 'KT' AND d.deputy_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-012' SET d.head_employee_id = e.id WHERE d.code = 'KHTC' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-026' SET d.deputy_employee_id = e.id WHERE d.code = 'KHTC' AND d.deputy_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-013' SET d.head_employee_id = e.id WHERE d.code = 'HK' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-040' SET d.deputy_employee_id = e.id WHERE d.code = 'HK' AND d.deputy_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-014' SET d.head_employee_id = e.id WHERE d.code = 'MD' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-058' SET d.deputy_employee_id = e.id WHERE d.code = 'MD' AND d.deputy_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-015' SET d.head_employee_id = e.id WHERE d.code = 'DB' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-074' SET d.deputy_employee_id = e.id WHERE d.code = 'DB' AND d.deputy_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-016' SET d.head_employee_id = e.id WHERE d.code = 'TT' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-091' SET d.deputy_employee_id = e.id WHERE d.code = 'TT' AND d.deputy_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-002' SET d.head_employee_id = e.id WHERE d.code = 'KT-DVL' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-007' SET d.head_employee_id = e.id WHERE d.code = 'KT-GIS' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-038' SET d.head_employee_id = e.id WHERE d.code = 'KT-CNTT' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-027' SET d.head_employee_id = e.id WHERE d.code = 'KHTC-KH' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-028' SET d.head_employee_id = e.id WHERE d.code = 'KHTC-KT' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-023' SET d.head_employee_id = e.id WHERE d.code = 'TCHC-TC' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-022' SET d.head_employee_id = e.id WHERE d.code = 'TCHC-HC' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-001' SET d.head_employee_id = e.id WHERE d.code = 'MD-DIEN' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-006' SET d.head_employee_id = e.id WHERE d.code = 'MD-TU' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-073' SET d.head_employee_id = e.id WHERE d.code = 'MD-TD' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-062' SET d.head_employee_id = e.id WHERE d.code = 'MD-XL' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-089' SET d.head_employee_id = e.id WHERE d.code = 'DB-DC' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-081' SET d.head_employee_id = e.id WHERE d.code = 'DB-TT' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-076' SET d.head_employee_id = e.id WHERE d.code = 'DB-HC' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-004' SET d.head_employee_id = e.id WHERE d.code = 'HK-BAY' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-057' SET d.head_employee_id = e.id WHERE d.code = 'HK-XL' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-005' SET d.head_employee_id = e.id WHERE d.code = 'TT-KD' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-105' SET d.head_employee_id = e.id WHERE d.code = 'TT-SC' AND d.head_employee_id IS NULL;
UPDATE tbl_department d JOIN tbl_employee e ON e.code = 'NS-103' SET d.head_employee_id = e.id WHERE d.code = 'TT-NC' AND d.head_employee_id IS NULL;

-- Skill matrix: 8 chuyên gia công bố, các kỹ sư/KTV khối kỹ thuật được ước theo chuyên ngành và kinh nghiệm.
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-001';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-001';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-001';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-001';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-002';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-002';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-002';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-002';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-003';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-003';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-003';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-003';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-004';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-004';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-004';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-004';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-005';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-005';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-005';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-005';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-006';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-006';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-006';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-006';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-007';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-007';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-007';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-007';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-008';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-008';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-008';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-008';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-011';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-011';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-011';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-011';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-013';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-013';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-013';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-013';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-014';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-014';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-014';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-014';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-015';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-015';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-015';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-015';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-016';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-016';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-016';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-016';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-033';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-033';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-033';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-033';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-034';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-034';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-034';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-034';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-035';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-035';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-035';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-035';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-036';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-036';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-036';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-036';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-037';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-037';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-037';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-037';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-038';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-038';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-038';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-038';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-039';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-039';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-039';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-039';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-040';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-040';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-040';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-040';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-041';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-041';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-041';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-041';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-042';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-042';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-042';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-042';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-043';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-043';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-043';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-043';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-044';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-044';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-044';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-044';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-045';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-045';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-045';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-045';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-046';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-046';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-046';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-046';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-047';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-047';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-047';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-047';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-048';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-048';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-048';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-048';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-049';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-049';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-049';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-049';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-050';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-050';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-050';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-050';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-051';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-051';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-051';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-051';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-052';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-052';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-052';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-052';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-053';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-053';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-053';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-053';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-054';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-054';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-054';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-054';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-055';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-055';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-055';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-055';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-056';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-056';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-056';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-056';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-057';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-057';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-057';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-057';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-058';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-058';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-058';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-058';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-059';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-059';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-059';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-059';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-060';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-060';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-060';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-060';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-061';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-061';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-061';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-061';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-062';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-062';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-062';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-062';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-063';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-063';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-063';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-063';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-064';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-064';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-064';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-064';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-065';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-065';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-065';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-065';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-066';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-066';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-066';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-066';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-067';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-067';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-067';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-067';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-068';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-068';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-068';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-068';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-069';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-069';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-069';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-069';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-070';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-070';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-070';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-070';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-071';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-071';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-071';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-071';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-072';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-072';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-072';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-072';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-073';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-073';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-073';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-073';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-074';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-074';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-074';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-074';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-075';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-075';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-075';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-075';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-076';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-076';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-076';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-076';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-077';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-077';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-077';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-077';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-078';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-078';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-078';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-078';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-079';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-079';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-079';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-079';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-080';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-080';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-080';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-080';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-081';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-081';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-081';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-081';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-082';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-082';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-082';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-082';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-083';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-083';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-083';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-083';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-084';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-084';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-084';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-084';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-085';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-085';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-085';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-085';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-086';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-086';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-086';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-086';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-087';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-087';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-087';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-087';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-088';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-088';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-088';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-088';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-089';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-089';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-089';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-089';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-090';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-090';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-090';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-090';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-091';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-091';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-091';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-091';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-092';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-092';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-092';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-092';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-093';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-093';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-093';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-093';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-094';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-094';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-094';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-094';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-095';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-095';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-095';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-095';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-096';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-096';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-096';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-096';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-097';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-097';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-097';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-097';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-098';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-098';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-098';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-098';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-099';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-099';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-099';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-099';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-100';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-100';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-100';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-100';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-101';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-101';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-101';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-101';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-102';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-102';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-102';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-102';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-103';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-103';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-103';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-103';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-104';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-104';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-104';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-104';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-105';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-105';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-105';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 5, NOW() FROM tbl_employee e WHERE e.code = 'NS-105';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-106';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-106';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-106';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-106';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-107';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-107';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-107';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-107';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-108';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-108';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-108';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-108';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-109';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-109';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-109';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-109';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-110';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-110';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-110';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-110';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-111';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-111';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-111';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-111';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-112';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-112';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-112';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-112';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-113';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-113';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-113';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-113';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-114';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-114';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-114';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-114';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-115';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-115';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-115';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-115';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-116';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-116';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-116';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-116';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-117';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-117';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-117';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-117';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-118';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-118';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-118';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-118';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-119';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-119';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-119';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-119';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-120';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-120';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-120';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-120';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-121';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-121';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-121';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-121';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 3, NOW() FROM tbl_employee e WHERE e.code = 'NS-122';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-122';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 1, NOW() FROM tbl_employee e WHERE e.code = 'NS-122';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-122';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'geophysics', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-123';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'gis', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-123';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'data', 2, NOW() FROM tbl_employee e WHERE e.code = 'NS-123';
INSERT IGNORE INTO tbl_employee_skill (employee_id, skill_code, level, updated_at) SELECT e.id, 'pm', 4, NOW() FROM tbl_employee e WHERE e.code = 'NS-123';

-- 6. Gắn tài khoản sẵn có với hồ sơ cùng họ tên (chỉ khi tên là duy nhất ở cả hai phía).
UPDATE tbl_employee e
JOIN (SELECT full_name, MIN(id) AS id FROM tbl_user WHERE is_deleted = 0 GROUP BY full_name HAVING COUNT(*) = 1) u ON u.full_name = e.full_name
SET e.user_id = u.id
WHERE e.user_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM (SELECT user_id FROM tbl_employee WHERE user_id IS NOT NULL) linked WHERE linked.user_id = u.id)
  AND (SELECT COUNT(*) FROM (SELECT full_name FROM tbl_employee) same WHERE same.full_name = e.full_name) = 1;
