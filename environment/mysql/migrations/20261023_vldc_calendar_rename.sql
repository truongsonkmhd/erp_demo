-- VLDC: rename menu "Lịch" to "Sự kiện". Safe to re-run.
USE `erp-demo`;

UPDATE tbl_menu SET title = 'Sự kiện' WHERE code = 'vldc-calendar';
UPDATE tbl_page SET name = 'Sự kiện' WHERE code = 'vldc-calendar';
