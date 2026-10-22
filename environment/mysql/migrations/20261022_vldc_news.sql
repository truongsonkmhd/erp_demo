-- VLDC Bảng tin: page, permissions, menu entry and role grants. Safe to re-run.
USE `erp-demo`;

INSERT IGNORE INTO tbl_page (code, name, url) VALUES
  ('vldc-news', 'Bảng tin', '/vldc/news');

INSERT IGNORE INTO tbl_permission (code, label, page_id, action_id)
SELECT CONCAT(p.code, ':', a.code), CONCAT(p.name, ' - ', a.name), p.id, a.id
FROM tbl_page p CROSS JOIN tbl_action a
WHERE p.code = 'vldc-news';

-- Below Công việc (102) and Giao việc (103) in "Không gian làm việc".
INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
SELECT 'vldc-news', 'Bảng tin', 'Newspaper', g.id, p.id, 'vldc', 104
FROM tbl_menu g
JOIN tbl_page p ON p.code = 'vldc-news'
WHERE g.code = 'vldc-grp-workspace'
ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon), sort_order = VALUES(sort_order);

-- Everyone reads; leadership, TC-HC and unit heads publish (unit heads only for their own unit – enforced in the page).
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM (
  SELECT r0.code AS role_code, 'vldc-news:access' AS perm_code
  FROM tbl_role r0
  WHERE r0.code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem',
                    'kythuat', 'kehoach', 'tochuc', 'hientruong', 'ketoan', 'ketoantruong')
  UNION ALL
  SELECT r1.code, perm.code
  FROM tbl_role r1
  CROSS JOIN (
    SELECT 'vldc-news:create' AS code UNION ALL
    SELECT 'vldc-news:update' UNION ALL
    SELECT 'vldc-news:delete'
  ) perm
  WHERE r1.code IN ('lanhdao', 'tochuc', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam')
) rp
JOIN tbl_role r ON r.code = rp.role_code
JOIN tbl_permission p ON p.code = rp.perm_code;

-- Admin holds every vldc-* permission (granted once by the init script, so new pages need it again).
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r CROSS JOIN tbl_permission p
WHERE r.code = 'admin' AND p.code LIKE 'vldc-news:%';
