-- VLDC module (ported from vldc-erp-react) — menu table, pages, permissions, roles, demo users.
-- Safe to re-run. Generated from vldc-erp-react/src/legacy/engine.ts (navigationForRole per role).
USE `erp-demo`;

CREATE TABLE IF NOT EXISTS tbl_menu (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  icon VARCHAR(50) NULL,
  parent_id BIGINT NULL,
  page_id BIGINT NULL,
  module VARCHAR(50) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  KEY idx_menu_module (module),
  CONSTRAINT fk_menu_parent FOREIGN KEY (parent_id) REFERENCES tbl_menu(id),
  CONSTRAINT fk_menu_page FOREIGN KEY (page_id) REFERENCES tbl_page(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1. Pages: one per legacy render[] page, permission code prefix "vldc-".
INSERT IGNORE INTO tbl_page (code, name, url) VALUES
  ('vldc-dashboard', 'Dashboard điều hành', '/vldc/dashboard'),
  ('vldc-action', 'Công việc', '/vldc/action'),
  ('vldc-today', 'Hôm nay', '/vldc/today'),
  ('vldc-calendar', 'Lịch làm việc', '/vldc/calendar'),
  ('vldc-plans', 'Kế hoạch', '/vldc/plans'),
  ('vldc-notifications', 'Trung tâm thông báo', '/vldc/notifications'),
  ('vldc-assistant', 'AI Knowledge Workspace', '/vldc/assistant'),
  ('vldc-command', 'Executive Command Center', '/vldc/command'),
  ('vldc-directives', 'Giao việc', '/vldc/directives'),
  ('vldc-meetings', 'Phòng họp', '/vldc/meetings'),
  ('vldc-performance', 'KPI & Performance Center', '/vldc/performance'),
  ('vldc-risks', 'Risk & Compliance Center', '/vldc/risks'),
  ('vldc-strategy', 'Kế hoạch chiến lược', '/vldc/strategy'),
  ('vldc-organization', 'Phòng ban', '/vldc/organization'),
  ('vldc-units', 'Không gian đơn vị', '/vldc/units'),
  ('vldc-capability', 'Năng lực Liên đoàn', '/vldc/capability'),
  ('vldc-hr', 'Nhân sự', '/vldc/hr'),
  ('vldc-equipmentcatalog', 'Danh mục thiết bị công khai', '/vldc/equipmentcatalog'),
  ('vldc-projects', 'Nhiệm vụ / Dự án', '/vldc/projects'),
  ('vldc-research', 'Khoa học – Công nghệ – Đổi mới sáng tạo', '/vldc/research'),
  ('vldc-finance', 'Kế hoạch - Tài chính', '/vldc/finance'),
  ('vldc-contracts', 'Hợp đồng', '/vldc/contracts'),
  ('vldc-equipment', 'Thiết bị', '/vldc/equipment'),
  ('vldc-dms', 'DMS - Quản trị tài liệu', '/vldc/dms'),
  ('vldc-documents', 'Văn bản', '/vldc/documents'),
  ('vldc-generator', 'Sinh văn bản', '/vldc/generator'),
  ('vldc-accounting', 'Tổng quan kế toán', '/vldc/accounting'),
  ('vldc-vouchers', 'Chứng từ kế toán', '/vldc/vouchers'),
  ('vldc-payments', 'Thanh toán', '/vldc/payments'),
  ('vldc-advances', 'Tạm ứng - Hoàn ứng', '/vldc/advances'),
  ('vldc-receivables', 'Công nợ phải thu', '/vldc/receivables'),
  ('vldc-payables', 'Công nợ phải trả', '/vldc/payables'),
  ('vldc-cashbank', 'Tiền mặt & Ngân hàng', '/vldc/cashbank'),
  ('vldc-acctassets', 'Tài sản kế toán', '/vldc/acctassets'),
  ('vldc-projectacct', 'Kế toán dự án', '/vldc/projectacct'),
  ('vldc-reconcile', 'Đối chiếu', '/vldc/reconcile'),
  ('vldc-closing', 'Khóa sổ', '/vldc/closing'),
  ('vldc-ledgers', 'Sổ kế toán', '/vldc/ledgers'),
  ('vldc-acctreports', 'Báo cáo kế toán', '/vldc/acctreports'),
  ('vldc-crossflow', 'Luồng liên phòng', '/vldc/crossflow'),
  ('vldc-handoff', 'Bàn giao nghiệp vụ', '/vldc/handoff'),
  ('vldc-datahub', 'Data Hub', '/vldc/datahub'),
  ('vldc-geodata', 'Geo Data Center', '/vldc/geodata'),
  ('vldc-archive', 'Kho hồ sơ lịch sử', '/vldc/archive'),
  ('vldc-importdata', 'Import & Chuẩn hóa', '/vldc/importdata'),
  ('vldc-migration', 'Data Migration Dashboard', '/vldc/migration'),
  ('vldc-reports', 'Trung tâm báo cáo', '/vldc/reports'),
  ('vldc-alerts', 'Cảnh báo & Rules', '/vldc/alerts'),
  ('vldc-digital', 'Đánh giá chuyển đổi số', '/vldc/digital'),
  ('vldc-audit', 'Audit Timeline', '/vldc/audit');

INSERT IGNORE INTO tbl_permission (code, label, page_id, action_id)
SELECT CONCAT(p.code, ':', a.code), CONCAT(p.name, ' - ', a.name), p.id, a.id
FROM tbl_page p CROSS JOIN tbl_action a
WHERE p.code LIKE 'vldc-%' AND a.code IN ('access', 'create', 'update', 'delete');

-- 2. Menu tree: groups (no page) then leaves (page_id -> shown when user has page:access).
--    icon = lucide-react component name; re-running refreshes title/icon/order.
INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order) VALUES
  ('vldc-grp-workspace', 'Không gian làm việc', 'LayoutDashboard', NULL, NULL, 'vldc', 100),
  ('vldc-grp-executive', 'Điều hành', 'Target', NULL, NULL, 'vldc', 200),
  ('vldc-grp-organization', 'Tổ chức Liên đoàn', 'Building2', NULL, NULL, 'vldc', 300),
  ('vldc-grp-core', 'Nghiệp vụ cốt lõi', 'BriefcaseBusiness', NULL, NULL, 'vldc', 400),
  ('vldc-grp-accounting', 'Kế toán', 'Calculator', NULL, NULL, 'vldc', 500),
  ('vldc-grp-crossflow', 'Liên phòng', 'ArrowLeftRight', NULL, NULL, 'vldc', 600),
  ('vldc-grp-data', 'Dữ liệu & Phân tích', 'Database', NULL, NULL, 'vldc', 700)
ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon), sort_order = VALUES(sort_order);

INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
SELECT m.code, m.title, m.icon, g.id, p.id, 'vldc', m.sort_order
FROM (
  SELECT 'vldc-dashboard' AS code, 'Dashboard' AS title, 'LayoutDashboard' AS icon, 101 AS sort_order UNION ALL
  SELECT 'vldc-action' AS code, 'Công việc' AS title, 'Inbox' AS icon, 102 AS sort_order UNION ALL
  SELECT 'vldc-directives' AS code, 'Giao việc' AS title, 'Send' AS icon, 103 AS sort_order UNION ALL
  SELECT 'vldc-today' AS code, 'Hôm nay' AS title, 'Sun' AS icon, 105 AS sort_order UNION ALL
  SELECT 'vldc-calendar' AS code, 'Lịch làm việc' AS title, 'CalendarDays' AS icon, 106 AS sort_order UNION ALL
  SELECT 'vldc-plans' AS code, 'Kế hoạch' AS title, 'ListChecks' AS icon, 107 AS sort_order UNION ALL
  SELECT 'vldc-notifications' AS code, 'Thông báo' AS title, 'Bell' AS icon, 108 AS sort_order UNION ALL
  SELECT 'vldc-assistant' AS code, 'Trợ lý AI' AS title, 'Sparkles' AS icon, 109 AS sort_order
) m
JOIN tbl_menu g ON g.code = 'vldc-grp-workspace'
JOIN tbl_page p ON p.code = m.code
ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order);

INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
SELECT m.code, m.title, m.icon, g.id, p.id, 'vldc', m.sort_order
FROM (
  SELECT 'vldc-command' AS code, 'Command Center' AS title, 'Radar' AS icon, 201 AS sort_order UNION ALL
  SELECT 'vldc-meetings' AS code, 'Phòng họp' AS title, 'Users' AS icon, 203 AS sort_order UNION ALL
  SELECT 'vldc-performance' AS code, 'KPI & Hiệu suất' AS title, 'Gauge' AS icon, 204 AS sort_order UNION ALL
  SELECT 'vldc-risks' AS code, 'Rủi ro & Tuân thủ' AS title, 'ShieldAlert' AS icon, 205 AS sort_order UNION ALL
  SELECT 'vldc-strategy' AS code, 'Chiến lược' AS title, 'Flag' AS icon, 206 AS sort_order
) m
JOIN tbl_menu g ON g.code = 'vldc-grp-executive'
JOIN tbl_page p ON p.code = m.code
ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon), sort_order = VALUES(sort_order);

INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
SELECT m.code, m.title, m.icon, g.id, p.id, 'vldc', m.sort_order
FROM (
  SELECT 'vldc-organization' AS code, 'Phòng ban' AS title, 'Network' AS icon, 301 AS sort_order UNION ALL
  SELECT 'vldc-units' AS code, 'Không gian đơn vị' AS title, 'Building2' AS icon, 302 AS sort_order UNION ALL
  SELECT 'vldc-capability' AS code, 'Năng lực' AS title, 'Award' AS icon, 303 AS sort_order UNION ALL
  SELECT 'vldc-hr' AS code, 'Nhân sự' AS title, 'UserRound' AS icon, 304 AS sort_order UNION ALL
  SELECT 'vldc-equipmentcatalog' AS code, 'Thiết bị công khai' AS title, 'BookOpen' AS icon, 305 AS sort_order
) m
JOIN tbl_menu g ON g.code = 'vldc-grp-organization'
JOIN tbl_page p ON p.code = m.code
ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon), sort_order = VALUES(sort_order);

INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
SELECT m.code, m.title, m.icon, g.id, p.id, 'vldc', m.sort_order
FROM (
  SELECT 'vldc-projects' AS code, 'Nhiệm vụ / Dự án' AS title, 'FolderKanban' AS icon, 401 AS sort_order UNION ALL
  SELECT 'vldc-research' AS code, 'KH-CN & Đổi mới' AS title, 'FlaskConical' AS icon, 402 AS sort_order UNION ALL
  SELECT 'vldc-finance' AS code, 'Kế hoạch – Tài chính' AS title, 'Wallet' AS icon, 403 AS sort_order UNION ALL
  SELECT 'vldc-contracts' AS code, 'Hợp đồng' AS title, 'FileSignature' AS icon, 404 AS sort_order UNION ALL
  SELECT 'vldc-equipment' AS code, 'Thiết bị' AS title, 'Wrench' AS icon, 405 AS sort_order UNION ALL
  SELECT 'vldc-dms' AS code, 'DMS – Tài liệu' AS title, 'FolderOpen' AS icon, 406 AS sort_order UNION ALL
  SELECT 'vldc-documents' AS code, 'Văn bản' AS title, 'FileText' AS icon, 407 AS sort_order UNION ALL
  SELECT 'vldc-generator' AS code, 'Sinh văn bản' AS title, 'FilePlus2' AS icon, 408 AS sort_order
) m
JOIN tbl_menu g ON g.code = 'vldc-grp-core'
JOIN tbl_page p ON p.code = m.code
ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon), sort_order = VALUES(sort_order);

INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
SELECT m.code, m.title, m.icon, g.id, p.id, 'vldc', m.sort_order
FROM (
  SELECT 'vldc-accounting' AS code, 'Tổng quan kế toán' AS title, 'Calculator' AS icon, 501 AS sort_order UNION ALL
  SELECT 'vldc-vouchers' AS code, 'Chứng từ' AS title, 'Receipt' AS icon, 502 AS sort_order UNION ALL
  SELECT 'vldc-payments' AS code, 'Thanh toán' AS title, 'CreditCard' AS icon, 503 AS sort_order UNION ALL
  SELECT 'vldc-advances' AS code, 'Tạm ứng - Hoàn ứng' AS title, 'ArrowLeftRight' AS icon, 504 AS sort_order UNION ALL
  SELECT 'vldc-receivables' AS code, 'Phải thu' AS title, 'ArrowDownLeft' AS icon, 505 AS sort_order UNION ALL
  SELECT 'vldc-payables' AS code, 'Phải trả' AS title, 'ArrowUpRight' AS icon, 506 AS sort_order UNION ALL
  SELECT 'vldc-cashbank' AS code, 'Tiền mặt & Ngân hàng' AS title, 'Landmark' AS icon, 507 AS sort_order UNION ALL
  SELECT 'vldc-acctassets' AS code, 'Tài sản kế toán' AS title, 'Package' AS icon, 508 AS sort_order UNION ALL
  SELECT 'vldc-projectacct' AS code, 'Kế toán dự án' AS title, 'BriefcaseBusiness' AS icon, 509 AS sort_order UNION ALL
  SELECT 'vldc-reconcile' AS code, 'Đối chiếu' AS title, 'CheckCheck' AS icon, 510 AS sort_order UNION ALL
  SELECT 'vldc-closing' AS code, 'Khóa sổ' AS title, 'Lock' AS icon, 511 AS sort_order UNION ALL
  SELECT 'vldc-ledgers' AS code, 'Sổ kế toán' AS title, 'BookText' AS icon, 512 AS sort_order UNION ALL
  SELECT 'vldc-acctreports' AS code, 'Báo cáo kế toán' AS title, 'FileBarChart' AS icon, 513 AS sort_order
) m
JOIN tbl_menu g ON g.code = 'vldc-grp-accounting'
JOIN tbl_page p ON p.code = m.code
ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon), sort_order = VALUES(sort_order);

INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
SELECT m.code, m.title, m.icon, g.id, p.id, 'vldc', m.sort_order
FROM (
  SELECT 'vldc-crossflow' AS code, 'Luồng liên phòng' AS title, 'Workflow' AS icon, 601 AS sort_order UNION ALL
  SELECT 'vldc-handoff' AS code, 'Bàn giao nghiệp vụ' AS title, 'Forward' AS icon, 602 AS sort_order
) m
JOIN tbl_menu g ON g.code = 'vldc-grp-crossflow'
JOIN tbl_page p ON p.code = m.code
ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon), sort_order = VALUES(sort_order);

INSERT INTO tbl_menu (code, title, icon, parent_id, page_id, module, sort_order)
SELECT m.code, m.title, m.icon, g.id, p.id, 'vldc', m.sort_order
FROM (
  SELECT 'vldc-datahub' AS code, 'Data Hub' AS title, 'Database' AS icon, 701 AS sort_order UNION ALL
  SELECT 'vldc-geodata' AS code, 'Geo Data' AS title, 'MapPinned' AS icon, 702 AS sort_order UNION ALL
  SELECT 'vldc-archive' AS code, 'Kho hồ sơ lịch sử' AS title, 'Archive' AS icon, 703 AS sort_order UNION ALL
  SELECT 'vldc-importdata' AS code, 'Import & Chuẩn hóa' AS title, 'Upload' AS icon, 704 AS sort_order UNION ALL
  SELECT 'vldc-migration' AS code, 'Data Migration Dashboard' AS title, 'DatabaseZap' AS icon, 705 AS sort_order UNION ALL
  SELECT 'vldc-reports' AS code, 'Trung tâm báo cáo' AS title, 'BarChart3' AS icon, 706 AS sort_order UNION ALL
  SELECT 'vldc-alerts' AS code, 'Cảnh báo & Rules' AS title, 'BellRing' AS icon, 707 AS sort_order UNION ALL
  SELECT 'vldc-digital' AS code, 'Chuyển đổi số' AS title, 'Cpu' AS icon, 708 AS sort_order UNION ALL
  SELECT 'vldc-audit' AS code, 'Audit Timeline' AS title, 'History' AS icon, 709 AS sort_order
) m
JOIN tbl_menu g ON g.code = 'vldc-grp-data'
JOIN tbl_page p ON p.code = m.code
ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon), sort_order = VALUES(sort_order);

-- 3. Roles: one per legacy VLDC role (code = legacy role key, used by the page engine for data scoping).
INSERT IGNORE INTO tbl_role (code, name, summary) VALUES
  ('lanhdao', 'Liên đoàn trưởng', 'Ban Lãnh đạo'),
  ('truongdonvi', 'Trưởng đơn vị', 'Đoàn ĐVL Mặt đất'),
  ('chunhiem', 'Chủ nhiệm dự án', 'Đoàn ĐVL Mặt đất'),
  ('kythuat', 'Chuyên viên kỹ thuật', 'Phòng Kỹ thuật'),
  ('kehoach', 'Chuyên viên KH-TC', 'Phòng Kế hoạch - Tài chính'),
  ('tochuc', 'Chuyên viên TC-HC', 'Phòng Tổ chức - Hành chính'),
  ('hientruong', 'Cán bộ hiện trường', 'Đoàn ĐVL Biển'),
  ('ketoan', 'Kế toán viên', 'Phòng Kế toán'),
  ('ketoantruong', 'Kế toán trưởng', 'Phòng Kế toán'),
  ('hangkhong', 'Đoàn trưởng ĐVL Hàng không', 'Đoàn Địa vật lý Hàng không'),
  ('matdat', 'Điều hành Đoàn ĐVL Mặt đất', 'Đoàn Địa vật lý Mặt đất'),
  ('bien', 'Đoàn trưởng ĐVL Biển', 'Đoàn Địa vật lý Biển'),
  ('trungtam', 'Giám đốc Trung tâm', 'Trung tâm Công nghệ & Kiểm định máy ĐVL');

-- 4. Role permissions: "access" on every page the legacy menu showed that role.
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM (

  SELECT 'lanhdao' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-command:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-directives:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-meetings:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-performance:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-risks:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-strategy:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-organization:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-units:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-capability:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-hr:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-equipmentcatalog:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-projects:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-finance:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-contracts:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-equipment:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-dms:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-documents:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-generator:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-accounting:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-vouchers:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-payments:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-advances:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-receivables:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-payables:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-cashbank:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-acctassets:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-projectacct:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-reconcile:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-closing:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-ledgers:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-acctreports:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-crossflow:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-handoff:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-datahub:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-geodata:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-archive:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-importdata:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-migration:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-reports:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-alerts:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-digital:access' AS perm_code UNION ALL
  SELECT 'lanhdao' AS role_code, 'vldc-audit:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-projects:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-equipment:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-hr:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-dms:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-reports:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-documents:access' AS perm_code UNION ALL
  SELECT 'truongdonvi' AS role_code, 'vldc-handoff:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-directives:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-meetings:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-performance:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-risks:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-projects:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-equipment:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-dms:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-generator:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-reports:access' AS perm_code UNION ALL
  SELECT 'chunhiem' AS role_code, 'vldc-handoff:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-projects:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-dms:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-geodata:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-reports:access' AS perm_code UNION ALL
  SELECT 'kythuat' AS role_code, 'vldc-risks:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-finance:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-contracts:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-acctassets:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-receivables:access' AS perm_code UNION ALL
  SELECT 'kehoach' AS role_code, 'vldc-reports:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-hr:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-documents:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-meetings:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-equipment:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-digital:access' AS perm_code UNION ALL
  SELECT 'tochuc' AS role_code, 'vldc-reports:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-directives:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-meetings:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-performance:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-projects:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-equipment:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-dms:access' AS perm_code UNION ALL
  SELECT 'hientruong' AS role_code, 'vldc-geodata:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-directives:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-meetings:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-performance:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-risks:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-accounting:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-vouchers:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-payments:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-advances:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-receivables:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-payables:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-cashbank:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-acctassets:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-projectacct:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-reconcile:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-ledgers:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-acctreports:access' AS perm_code UNION ALL
  SELECT 'ketoan' AS role_code, 'vldc-handoff:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-directives:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-meetings:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-performance:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-risks:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-accounting:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-vouchers:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-payments:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-advances:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-receivables:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-payables:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-cashbank:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-acctassets:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-projectacct:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-reconcile:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-closing:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-ledgers:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-acctreports:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-crossflow:access' AS perm_code UNION ALL
  SELECT 'ketoantruong' AS role_code, 'vldc-handoff:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-projects:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-equipmentcatalog:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-equipment:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-dms:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-geodata:access' AS perm_code UNION ALL
  SELECT 'hangkhong' AS role_code, 'vldc-reports:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-projects:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-equipmentcatalog:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-equipment:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-dms:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-geodata:access' AS perm_code UNION ALL
  SELECT 'matdat' AS role_code, 'vldc-reports:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-projects:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-equipmentcatalog:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-equipment:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-dms:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-geodata:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'bien' AS role_code, 'vldc-reports:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-dashboard:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-action:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-assistant:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-notifications:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-calendar:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-today:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-plans:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-equipmentcatalog:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-equipment:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-research:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-projects:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-dms:access' AS perm_code UNION ALL
  SELECT 'trungtam' AS role_code, 'vldc-reports:access' AS perm_code

) rp
JOIN tbl_role r ON r.code = rp.role_code
JOIN tbl_permission p ON p.code = rp.perm_code;

INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r CROSS JOIN tbl_permission p
WHERE r.code = 'admin' AND p.code LIKE 'vldc-%';

-- 5. Demo users, one per role (password: 123456, same as the legacy demo). Local demo only.
INSERT IGNORE INTO tbl_user (username, email, password, full_name, account_type) VALUES
  ('lanhdao', 'lanhdao@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Nguyễn Văn Minh', 2),
  ('truongdonvi', 'truongdonvi@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Trần Quốc Hùng', 2),
  ('chunhiem', 'chunhiem@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Lê Hoàng Nam', 2),
  ('kythuat', 'kythuat@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Phạm Thu Hà', 2),
  ('kehoach', 'kehoach@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Vũ Thị Lan', 2),
  ('tochuc', 'tochuc@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Đỗ Minh Anh', 2),
  ('hientruong', 'hientruong@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Nguyễn Đức Hải', 2),
  ('ketoan', 'ketoan@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Nguyễn Thu Hương', 2),
  ('ketoantruong', 'ketoantruong@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Trần Minh Phương', 2),
  ('hangkhong', 'hangkhong@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Bùi Minh Thành', 2),
  ('matdat', 'matdat@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Phạm Quang Hưng', 2),
  ('bien', 'bien@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Nguyễn Văn Hành', 2),
  ('trungtam', 'trungtam@vldc.local', '$2a$10$32OvhBsFRoVfYEMZUDMoYOvF9JQrMb312G83NafCxMl5fs4dexm3G', 'Trần Anh Tuấn', 2);

INSERT IGNORE INTO tbl_user_role (user_id, role_id)
SELECT u.id, r.id FROM tbl_user u JOIN tbl_role r ON u.email = CONCAT(r.code, '@vldc.local');

-- 6. Cross-account workflow permissions (same as migrations/20261020_vldc_workflow_permissions.sql).
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM (
  -- Every business role can open and work on directives, inbox and notifications.
  SELECT r0.code AS role_code, perm.code AS perm_code
  FROM tbl_role r0
  CROSS JOIN (
    SELECT 'vldc-directives:access' AS code UNION ALL
    SELECT 'vldc-directives:update' UNION ALL
    SELECT 'vldc-action:access' UNION ALL
    SELECT 'vldc-notifications:access'
  ) perm
  WHERE r0.code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem',
                    'kythuat', 'kehoach', 'tochuc', 'hientruong', 'ketoan', 'ketoantruong')
  UNION ALL
  -- Roles that can hand work down.
  SELECT code, 'vldc-directives:create' FROM tbl_role
  WHERE code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem', 'ketoantruong')
  UNION ALL
  -- Payment dossier chain: chunhiem -> kehoach -> ketoan -> ketoantruong -> lanhdao -> ketoan.
  SELECT code, 'vldc-payments:access' FROM tbl_role
  WHERE code IN ('chunhiem', 'kehoach', 'ketoan', 'ketoantruong', 'lanhdao')
  UNION ALL
  SELECT 'chunhiem', 'vldc-payments:create'
  UNION ALL
  SELECT code, 'vldc-payments:update' FROM tbl_role
  WHERE code IN ('kehoach', 'ketoan', 'ketoantruong', 'lanhdao')
) rp
JOIN tbl_role r ON r.code = rp.role_code
JOIN tbl_permission p ON p.code = rp.perm_code;

-- 7. VLDC units as departments (same as migrations/20261022_vldc_departments.sql).

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

-- 8. Bảng tin (same as migrations/20261022_vldc_news.sql).

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
