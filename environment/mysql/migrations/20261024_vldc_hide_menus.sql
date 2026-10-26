-- VLDC: hide Thông báo, Trợ lý AI, Họp & Kết luận, Rủi ro & Tuân thủ, Chiến lược from the menu for every role.
-- Pages and permissions stay, so links to them still work. Safe to re-run; set active = 1 to bring an entry back.
USE `erp-demo`;

UPDATE tbl_menu SET active = 0
WHERE code IN ('vldc-notifications', 'vldc-assistant', 'vldc-meetings', 'vldc-risks', 'vldc-strategy');
