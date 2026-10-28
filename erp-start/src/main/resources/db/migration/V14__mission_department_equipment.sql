-- Nhiệm vụ theo trường BA: đơn vị / tổ đội (mặc định đơn vị người lập), nhiều thiết bị (chọn từ tài sản, không bắt
-- buộc), bỏ mức ưu tiên. Idempotent: mỗi bước chỉ chạy khi chưa làm.

-- 1. Đơn vị / tổ đội của nhiệm vụ (tbl_mission đang trống nên NOT NULL được ngay).
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_mission' AND COLUMN_NAME = 'department_id');
SET @ddl := IF(@has = 0, 'ALTER TABLE tbl_mission ADD COLUMN department_id BIGINT NOT NULL AFTER content, ADD CONSTRAINT fk_tbl_mission_department_id FOREIGN KEY (department_id) REFERENCES tbl_department (id), ADD INDEX idx_tbl_mission_department_id (department_id)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Bỏ mức ưu tiên (bỏ ràng buộc CHECK trước, rồi bỏ cột).
SET @has := (SELECT COUNT(*) FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'ck_tbl_mission_priority');
SET @ddl := IF(@has = 1, 'ALTER TABLE tbl_mission DROP CHECK ck_tbl_mission_priority', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_mission' AND COLUMN_NAME = 'priority');
SET @ddl := IF(@has = 1, 'ALTER TABLE tbl_mission DROP COLUMN priority', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Thiết bị của nhiệm vụ: chọn từ danh mục tài sản. Chưa có bảng tài sản trong MySQL nên equipment_id chưa có khoá
-- ngoại; thêm khoá ngoại khi bảng tài sản được tạo.
CREATE TABLE IF NOT EXISTS tbl_mission_equipment (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  mission_id   BIGINT      NOT NULL,
  equipment_id BIGINT      NOT NULL,
  created_at   DATETIME(3) NOT NULL,
  CONSTRAINT pk_tbl_mission_equipment PRIMARY KEY (id),
  CONSTRAINT uk_tbl_mission_equipment UNIQUE (mission_id, equipment_id),
  CONSTRAINT fk_tbl_mission_equipment_mission_id FOREIGN KEY (mission_id) REFERENCES tbl_mission (id) ON DELETE CASCADE,
  INDEX idx_tbl_mission_equipment_equipment_id (equipment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
