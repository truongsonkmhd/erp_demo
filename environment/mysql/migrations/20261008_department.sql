-- Apply to erp-demo after a verified full backup. No existing roles are reassigned.
USE `erp-demo`;
CREATE TABLE IF NOT EXISTS tbl_department (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE tbl_role ADD COLUMN department_id BIGINT NULL;
ALTER TABLE tbl_role ADD CONSTRAINT fk_role_department
  FOREIGN KEY (department_id) REFERENCES tbl_department(id);
