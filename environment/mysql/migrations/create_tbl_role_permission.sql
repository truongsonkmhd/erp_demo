-- Tạo bảng tbl_role_permission và seed dữ liệu phân quyền mặc định
USE `hoangminh_pts`;

CREATE TABLE IF NOT EXISTS `tbl_role_permission` (
    `role_id` BIGINT(20) NOT NULL,
    `permission_id` BIGINT(20) NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`),
    CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `tbl_role` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_role_permission_perm` FOREIGN KEY (`permission_id`) REFERENCES `tbl_permission` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Mapping giữa Role và Permission';

-- 1) Admin: full quyền
INSERT IGNORE INTO `tbl_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `tbl_role` r
CROSS JOIN `tbl_permission` p
WHERE r.code = 'admin';

-- 2) Quyền mặc định theo các Role khác
INSERT IGNORE INTO `tbl_role_permission` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `tbl_role` r
JOIN `tbl_permission` p
WHERE
    -- Sale
    (r.code = 'sale' AND p.code IN (
        'menu_home', 'menu_marketing_data', 'menu_orders', 'menu_assignments',
        'menu_salary', 'menu_documents', 'menu_learning', 'menu_user_guide',
        'rs_manage_marketing_data', 'assign_task_for_sale', 'view_general_data_of_marketing',
        'view_general_customer_and_reoder', 'view_general_business_results', 'rs_order',
        'export_order', 'import_quote', 'assign_task_for_customer_care', 'manage_salary'
    ))
    -- Marketing
    OR (r.code = 'marketing' AND p.code IN (
        'menu_home', 'menu_marketing_data', 'menu_assignments', 'menu_documents',
        'menu_learning', 'menu_user_guide', 'cud_marketing_data', 'rs_manage_marketing_data',
        'export_excel_data_marketign', 'view_general_data_of_marketing', 'assign_task_for_sale'
    ))
    -- CSKH
    OR (r.code = 'cskh' AND p.code IN (
        'menu_home', 'menu_orders', 'menu_assignments', 'menu_documents',
        'menu_learning', 'menu_user_guide', 'take_care_customer', 'rs_order',
        'import_quote', 'view_general_customer_and_reoder', 'assign_task_for_customer_care'
    ))
    -- Kho vận
    OR (r.code = 'warehouse' AND p.code IN (
        'menu_home', 'menu_orders', 'menu_documents', 'menu_learning',
        'menu_user_guide', 'rs_order', 'import_warehousing_and_storage'
    ))
    -- Kế toán
    OR (r.code = 'accounting' AND p.code IN (
        'menu_home', 'menu_orders', 'menu_salary', 'menu_documents',
        'menu_learning', 'menu_user_guide', 'rs_order', 'export_order',
        'manage_salary', 'view_general_business_results', 'view_general_customer_and_reoder'
    ));
