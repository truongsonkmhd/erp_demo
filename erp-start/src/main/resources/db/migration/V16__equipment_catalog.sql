-- Danh mục thiết bị tối thiểu cho form Nhiệm vụ (chọn nhiều thiết bị). id số, mã thiết bị ở cột code. Gộp vào module
-- tài sản khi module đó lên MySQL. Không seed dữ liệu. Chạy lại không lỗi.
CREATE TABLE IF NOT EXISTS tbl_equipment (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  code          VARCHAR(30)  NOT NULL,
  name          VARCHAR(255) NOT NULL,
  department_id BIGINT       NULL,
  status        VARCHAR(50)  NULL,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_tbl_equipment_code (code),
  KEY idx_tbl_equipment_department (department_id),
  CONSTRAINT fk_tbl_equipment_department FOREIGN KEY (department_id) REFERENCES tbl_department (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thiết bị của nhiệm vụ giờ trỏ tới danh mục.
SET @has := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_mission_equipment' AND CONSTRAINT_NAME = 'fk_tbl_mission_equipment_equipment');
SET @ddl := IF(@has = 0, 'ALTER TABLE tbl_mission_equipment ADD CONSTRAINT fk_tbl_mission_equipment_equipment FOREIGN KEY (equipment_id) REFERENCES tbl_equipment (id)', 'DO 0');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
