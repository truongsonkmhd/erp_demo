-- Gán quyền hiện có (tbl_permission) cho từng role + cấp bậc.
-- Chạy trên database hoangminh_pts. INSERT IGNORE nên chạy lại cũng an toàn.

USE `hoangminh_pts`;

-- ---------------------------------------------------------------------------
-- 1) Admin: full quyền, không dùng cấp bậc
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM tbl_role r
CROSS JOIN tbl_permission p
WHERE r.code = 'admin';

-- ---------------------------------------------------------------------------
-- 2) Quyền mặc định theo role (fallback khi level chưa cấu hình)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM tbl_role r
JOIN tbl_permission p
WHERE
    -- Sale
    (r.code = 'sale' AND p.code IN (
        'menu_home',
        'menu_marketing_data',
        'menu_orders',
        'menu_assignments',
        'menu_salary',
        'menu_documents',
        'menu_learning',
        'menu_user_guide',
        'rs_manage_marketing_data',
        'assign_task_for_sale',
        'view_general_data_of_marketing',
        'view_general_customer_and_reoder',
        'view_general_business_results',
        'rs_order',
        'export_order',
        'import_quote',
        'assign_task_for_customer_care',
        'manage_salary'
    ))
    -- Marketing
    OR (r.code = 'marketing' AND p.code IN (
        'menu_home',
        'menu_marketing_data',
        'menu_assignments',
        'menu_documents',
        'menu_learning',
        'menu_user_guide',
        'cud_marketing_data',
        'rs_manage_marketing_data',
        'export_excel_data_marketign',
        'view_general_data_of_marketing',
        'assign_task_for_sale'
    ))
    -- CSKH
    OR (r.code = 'cskh' AND p.code IN (
        'menu_home',
        'menu_orders',
        'menu_assignments',
        'menu_documents',
        'menu_learning',
        'menu_user_guide',
        'take_care_customer',
        'rs_order',
        'import_quote',
        'view_general_customer_and_reoder',
        'assign_task_for_customer_care'
    ))
    -- Kho vận
    OR (r.code = 'warehouse' AND p.code IN (
        'menu_home',
        'menu_orders',
        'menu_documents',
        'menu_learning',
        'menu_user_guide',
        'rs_order',
        'import_warehousing_and_storage'
    ))
    -- Kế toán
    OR (r.code = 'accounting' AND p.code IN (
        'menu_home',
        'menu_orders',
        'menu_salary',
        'menu_documents',
        'menu_learning',
        'menu_user_guide',
        'rs_order',
        'export_order',
        'manage_salary',
        'view_general_business_results',
        'view_general_customer_and_reoder'
    ));

-- ---------------------------------------------------------------------------
-- 3) Cấu hình quyền theo cấp bậc (tab Cấu hình quyền)
--    Executive: xem
--    Senior: xem + thao tác
--    Manager: + phân việc
--    Director: full quyền của role
-- ---------------------------------------------------------------------------

-- ===== SALE =====
INSERT IGNORE INTO tbl_role_level_permission (role_id, level_code, permission_id)
SELECT r.id, lvl.level_code, p.id
FROM tbl_role r
JOIN tbl_permission p
JOIN (
    SELECT 'executive' AS level_code UNION ALL
    SELECT 'senior' UNION ALL
    SELECT 'manager' UNION ALL
    SELECT 'director'
) lvl
WHERE r.code = 'sale'
  AND (
        (lvl.level_code IN ('executive', 'senior', 'manager', 'director') AND p.code IN (
            'menu_home', 'menu_marketing_data', 'menu_orders',
            'menu_documents', 'menu_learning', 'menu_user_guide',
            'rs_order', 'rs_manage_marketing_data'
        ))
     OR (lvl.level_code IN ('senior', 'manager', 'director') AND p.code IN (
            'export_order', 'import_quote', 'view_general_customer_and_reoder'
        ))
     OR (lvl.level_code IN ('manager', 'director') AND p.code IN (
            'menu_assignments', 'assign_task_for_sale', 'assign_task_for_customer_care',
            'view_general_data_of_marketing', 'view_general_business_results'
        ))
     OR (lvl.level_code = 'director' AND p.code IN (
            'menu_salary', 'manage_salary'
        ))
  );

-- ===== MARKETING =====
INSERT IGNORE INTO tbl_role_level_permission (role_id, level_code, permission_id)
SELECT r.id, lvl.level_code, p.id
FROM tbl_role r
JOIN tbl_permission p
JOIN (
    SELECT 'executive' AS level_code UNION ALL
    SELECT 'senior' UNION ALL
    SELECT 'manager' UNION ALL
    SELECT 'director'
) lvl
WHERE r.code = 'marketing'
  AND (
        (lvl.level_code IN ('executive', 'senior', 'manager', 'director') AND p.code IN (
            'menu_home', 'menu_marketing_data',
            'menu_documents', 'menu_learning', 'menu_user_guide',
            'rs_manage_marketing_data', 'view_general_data_of_marketing'
        ))
     OR (lvl.level_code IN ('senior', 'manager', 'director') AND p.code IN (
            'cud_marketing_data', 'export_excel_data_marketign'
        ))
     OR (lvl.level_code IN ('manager', 'director') AND p.code IN (
            'menu_assignments', 'assign_task_for_sale'
        ))
  );

-- ===== CSKH =====
INSERT IGNORE INTO tbl_role_level_permission (role_id, level_code, permission_id)
SELECT r.id, lvl.level_code, p.id
FROM tbl_role r
JOIN tbl_permission p
JOIN (
    SELECT 'executive' AS level_code UNION ALL
    SELECT 'senior' UNION ALL
    SELECT 'manager' UNION ALL
    SELECT 'director'
) lvl
WHERE r.code = 'cskh'
  AND (
        (lvl.level_code IN ('executive', 'senior', 'manager', 'director') AND p.code IN (
            'menu_home', 'menu_orders',
            'menu_documents', 'menu_learning', 'menu_user_guide',
            'take_care_customer', 'rs_order'
        ))
     OR (lvl.level_code IN ('senior', 'manager', 'director') AND p.code IN (
            'import_quote', 'view_general_customer_and_reoder'
        ))
     OR (lvl.level_code IN ('manager', 'director') AND p.code IN (
            'menu_assignments', 'assign_task_for_customer_care'
        ))
  );

-- ===== KHO VẬN =====
INSERT IGNORE INTO tbl_role_level_permission (role_id, level_code, permission_id)
SELECT r.id, lvl.level_code, p.id
FROM tbl_role r
JOIN tbl_permission p
JOIN (
    SELECT 'executive' AS level_code UNION ALL
    SELECT 'senior' UNION ALL
    SELECT 'manager' UNION ALL
    SELECT 'director'
) lvl
WHERE r.code = 'warehouse'
  AND (
        (lvl.level_code IN ('executive', 'senior', 'manager', 'director') AND p.code IN (
            'menu_home', 'menu_orders',
            'menu_documents', 'menu_learning', 'menu_user_guide',
            'rs_order'
        ))
     OR (lvl.level_code IN ('senior', 'manager', 'director') AND p.code IN (
            'import_warehousing_and_storage'
        ))
  );

-- ===== KẾ TOÁN =====
INSERT IGNORE INTO tbl_role_level_permission (role_id, level_code, permission_id)
SELECT r.id, lvl.level_code, p.id
FROM tbl_role r
JOIN tbl_permission p
JOIN (
    SELECT 'executive' AS level_code UNION ALL
    SELECT 'senior' UNION ALL
    SELECT 'manager' UNION ALL
    SELECT 'director'
) lvl
WHERE r.code = 'accounting'
  AND (
        (lvl.level_code IN ('executive', 'senior', 'manager', 'director') AND p.code IN (
            'menu_home', 'menu_orders', 'menu_salary',
            'menu_documents', 'menu_learning', 'menu_user_guide',
            'rs_order', 'manage_salary'
        ))
     OR (lvl.level_code IN ('senior', 'manager', 'director') AND p.code IN (
            'export_order'
        ))
     OR (lvl.level_code IN ('manager', 'director') AND p.code IN (
            'view_general_business_results', 'view_general_customer_and_reoder'
        ))
  );

-- Kiểm tra nhanh
SELECT r.code AS role_code, COUNT(*) AS permission_count
FROM tbl_role_permission rp
JOIN tbl_role r ON r.id = rp.role_id
GROUP BY r.code
ORDER BY r.code;

SELECT r.code AS role_code, rlp.level_code, COUNT(*) AS permission_count
FROM tbl_role_level_permission rlp
JOIN tbl_role r ON r.id = rlp.role_id
GROUP BY r.code, rlp.level_code
ORDER BY r.code, FIELD(rlp.level_code, 'executive', 'senior', 'manager', 'director');
