-- VLDC Kế toán: the menu keeps only Thu, Chi, Công nợ, Chứng từ, and only accounting roles see it.
-- tbl_menu.active hides an entry for every role; who sees an active entry is decided by <page>:access grants.
-- Kế toán viên / Kế toán trưởng get these pages; admin sees everything through its effective permissions.
-- Safe to re-run.
USE `erp-demo`;

-- 1. Pages, permissions and menu entries for Thu, Chi, Công nợ.
INSERT IGNORE INTO tbl_page (code, name, url) VALUES
  ('vldc-cashin', 'Thu', '/vldc/cashin'),
  ('vldc-cashout', 'Chi', '/vldc/cashout'),
  ('vldc-debts', 'Công nợ', '/vldc/debts');

INSERT IGNORE INTO tbl_permission (code, label, page_id, action_id)
SELECT CONCAT(p.code, ':', a.code), CONCAT(p.name, ' - ', a.name), p.id, a.id
FROM tbl_page p CROSS JOIN tbl_action a
WHERE p.code IN ('vldc-cashin', 'vldc-cashout', 'vldc-debts');

INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
SELECT m.code, m.title, m.icon, g.id, p.id, 'vldc', m.sort_order
FROM (
  SELECT 'vldc-cashin' AS code, 'Thu' AS title, 'ArrowDownLeft' AS icon, 502 AS sort_order UNION ALL
  SELECT 'vldc-cashout', 'Chi', 'ArrowUpRight', 503 UNION ALL
  SELECT 'vldc-debts', 'Công nợ', 'Wallet', 504
) m
JOIN tbl_menu g ON g.code = 'vldc-grp-accounting'
JOIN tbl_page p ON p.code = m.code
ON DUPLICATE KEY UPDATE title = m.title, icon = m.icon, sort_order = m.sort_order;

-- 2. Only Thu, Chi, Công nợ, Chứng từ stay active in the Kế toán group (set active = 1 to bring an entry back).
UPDATE tbl_menu
SET active = CASE WHEN code IN ('vldc-cashin', 'vldc-cashout', 'vldc-debts', 'vldc-vouchers') THEN 1 ELSE 0 END
WHERE parent_id = (SELECT id FROM (SELECT id FROM tbl_menu WHERE code = 'vldc-grp-accounting') g);

-- Chứng từ (vldc-vouchers, created by 20261019_vldc_menu_permission.sql) sits right after Công nợ.
UPDATE tbl_menu SET sort_order = 505 WHERE code = 'vldc-vouchers';

-- 3. Grant these pages to accounting roles only, and revoke them from every other role.
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM tbl_role r
JOIN tbl_permission p ON p.page_id IN (SELECT id FROM tbl_page WHERE code IN ('vldc-cashin', 'vldc-cashout', 'vldc-debts', 'vldc-vouchers'))
WHERE r.code IN ('ketoan', 'ketoantruong', 'admin');

DELETE rp FROM tbl_role_permission rp
JOIN tbl_role r ON r.id = rp.role_id
JOIN tbl_permission p ON p.id = rp.permission_id
JOIN tbl_page pg ON pg.id = p.page_id
WHERE pg.code IN ('vldc-cashin', 'vldc-cashout', 'vldc-debts', 'vldc-vouchers')
  AND r.code NOT IN ('ketoan', 'ketoantruong', 'admin');
