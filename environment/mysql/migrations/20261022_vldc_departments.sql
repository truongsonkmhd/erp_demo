-- VLDC units as departments: one row per unit, every VLDC role linked to its unit, and read access to
-- roles/departments so the VLDC pages can load titles and units from the backend. Safe to re-run.
USE `erp-demo`;

INSERT INTO tbl_department (code, name, description) VALUES
  ('BLD',  'Ban Lãnh đạo Liên đoàn', 'Liên đoàn trưởng và các Phó Liên đoàn trưởng'),
  ('KT',   'Phòng Kỹ thuật', 'Bộ máy giúp việc'),
  ('KHTC', 'Phòng Kế hoạch – Tài chính', 'Bộ máy giúp việc (gồm kế toán)'),
  ('TCHC', 'Phòng Tổ chức – Hành chính', 'Bộ máy giúp việc'),
  ('MD',   'Đoàn ĐVL Mặt đất', 'Đơn vị trực thuộc'),
  ('DB',   'Đoàn ĐVL Biển', 'Đơn vị trực thuộc'),
  ('HK',   'Đoàn ĐVL Hàng không', 'Đơn vị trực thuộc'),
  ('TT',   'TT Công nghệ & Kiểm định', 'Đơn vị trực thuộc')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

UPDATE tbl_role r
JOIN (
  SELECT 'lanhdao' AS role_code, 'BLD' AS dept_code UNION ALL
  SELECT 'kythuat', 'KT' UNION ALL
  SELECT 'kehoach', 'KHTC' UNION ALL
  SELECT 'ketoan', 'KHTC' UNION ALL
  SELECT 'ketoantruong', 'KHTC' UNION ALL
  SELECT 'tochuc', 'TCHC' UNION ALL
  SELECT 'truongdonvi', 'MD' UNION ALL
  SELECT 'chunhiem', 'MD' UNION ALL
  SELECT 'matdat', 'MD' UNION ALL
  SELECT 'bien', 'DB' UNION ALL
  SELECT 'hientruong', 'DB' UNION ALL
  SELECT 'hangkhong', 'HK' UNION ALL
  SELECT 'trungtam', 'TT'
) m ON m.role_code = r.code
JOIN tbl_department d ON d.code = m.dept_code
SET r.department_id = d.id, r.summary = d.name
WHERE r.code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem',
                 'kythuat', 'kehoach', 'tochuc', 'hientruong', 'ketoan', 'ketoantruong');

-- Read-only: lets VLDC accounts call GET /api/roles and GET /api/departments (writes need roles:create/update/delete).
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM tbl_role r
JOIN tbl_permission p ON p.code = 'roles:access'
WHERE r.code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem',
                 'kythuat', 'kehoach', 'tochuc', 'hientruong', 'ketoan', 'ketoantruong');
