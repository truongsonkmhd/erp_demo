-- Tự đăng ký tài khoản: tài khoản mới ở trạng thái chờ duyệt (không role, không chức vụ, chưa đăng nhập được) cho đến khi
-- admin gán role, chức vụ, đơn vị và duyệt. Guarded like V2: fresh databases get the columns from init/auth_init.sql.

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_user' AND COLUMN_NAME = 'registration_status');
SET @ddl := IF(@has = 0, 'ALTER TABLE tbl_user ADD COLUMN registration_status VARCHAR(20) NULL', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_user' AND COLUMN_NAME = 'requested_department_id');
SET @ddl := IF(@has = 0, 'ALTER TABLE tbl_user ADD COLUMN requested_department_id BIGINT NULL, ADD CONSTRAINT fk_user_requested_department FOREIGN KEY (requested_department_id) REFERENCES tbl_department(id)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_user' AND INDEX_NAME = 'idx_user_registration_status');
SET @ddl := IF(@has = 0, 'CREATE INDEX idx_user_registration_status ON tbl_user (registration_status)', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
