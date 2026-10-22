-- VLDC: menu "Chỉ đạo điều hành" is now "Giao việc". Safe to re-run.
USE `erp-demo`;

UPDATE tbl_menu SET title = 'Giao việc' WHERE code = 'vldc-directives';
UPDATE tbl_page SET name = 'Giao việc' WHERE code = 'vldc-directives';
