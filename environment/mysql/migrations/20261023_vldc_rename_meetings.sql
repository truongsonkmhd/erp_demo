-- VLDC: menu "Họp & Kết luận" is now "Phòng họp". Safe to re-run.
USE `erp-demo`;

UPDATE tbl_menu SET title = 'Phòng họp' WHERE code = 'vldc-meetings';
UPDATE tbl_page SET name = 'Phòng họp' WHERE code = 'vldc-meetings';
