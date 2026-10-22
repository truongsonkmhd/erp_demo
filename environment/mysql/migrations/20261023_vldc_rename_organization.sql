-- VLDC: menu "Cơ cấu & Chức năng" is now "Phòng ban" (Không gian đơn vị opens from its page). Safe to re-run.
USE `erp-demo`;

UPDATE tbl_menu SET title = 'Phòng ban' WHERE code = 'vldc-organization';
UPDATE tbl_page SET name = 'Phòng ban' WHERE code = 'vldc-organization';
