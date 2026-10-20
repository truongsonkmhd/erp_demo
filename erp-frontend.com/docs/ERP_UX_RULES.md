# Quy tắc UX cho ERP Logistics

## 1. Phạm vi và ưu tiên

File này là nguồn quy tắc UX có độ ưu tiên cao nhất của frontend ERP. Mọi trang nghiệp vụ, component dùng chung và đề xuất từ skill UI/UX phải tuân thủ các quy tắc dưới đây.

Mục tiêu là giúp nhân viên hoàn thành công việc nhanh, chính xác và dễ kiểm tra. Khi phải lựa chọn, ưu tiên tính rõ ràng và hiệu quả thao tác hơn hiệu ứng thị giác.

## 2. Bảng dữ liệu

- Dùng mật độ gọn; chiều cao hàng desktop mục tiêu khoảng 40px.
- Header cố định khi bảng nằm trong vùng cuộn.
- Hỗ trợ sort cho các cột có ý nghĩa sắp xếp và cho biết rõ chiều sort hiện tại.
- Bộ lọc phải phản ánh trạng thái đang áp dụng; có thao tác đặt lại thuận tiện.
- Khi nghiệp vụ cần, hỗ trợ chọn nhiều dòng, hành động hàng loạt và xuất Excel.
- Hành động hàng loạt chỉ hiện hoặc chỉ active khi có dòng được chọn.
- Cột số, tiền và tỷ lệ căn phải; cột văn bản căn trái; cột trạng thái/ngày có thể căn giữa; cột thao tác ở cuối.
- Cột mã quan trọng có thể sao chép nhanh và không bị cắt mất phần phân biệt thiết yếu.
- Có phân trang hoặc cuộn ảo khi dữ liệu lớn; luôn hiển thị tổng số bản ghi.
- Bảng có loading, empty và error state ngay trong vùng dữ liệu.
- Không dùng tooltip làm cách duy nhất để đọc dữ liệu quan trọng. Nếu phải truncate, cung cấp cách xem đầy đủ cho cả chuột và bàn phím.
- Giữ cột nhận diện chính khi responsive; chuyển cột phụ vào detail/drawer thay vì làm toàn trang cuộn ngang mất kiểm soát.

## 3. Form nhập liệu

- Nhóm trường theo ý nghĩa và thứ tự nghiệp vụ; tối đa hai cột trên desktop, một cột trên màn hình hẹp.
- Trường bắt buộc được đánh dấu rõ; label luôn hiển thị, không thay bằng placeholder.
- Lỗi hiển thị ngay dưới trường, bằng tiếng Việt và hướng dẫn cách sửa.
- Khi có nhiều lỗi, focus vào error summary hoặc trường lỗi đầu tiên theo cách không làm mất dữ liệu đã nhập.
- Thứ tự Tab theo đúng luồng nhập liệu; tự focus trường đầu tiên chỉ khi không gây bất ngờ hoặc làm bật bàn phím ngoài ý muốn.
- Cho phép paste và trình quản lý mật khẩu ở màn hình xác thực.
- Có trạng thái submitting, chống gửi lặp và giữ dữ liệu khi request thất bại.
- Form dài cần thanh hành động sticky ở cuối nhưng không che nội dung hoặc focus.
- Có cảnh báo khi rời trang với thay đổi chưa lưu. Nếu nghiệp vụ hỗ trợ, cung cấp lưu nháp rõ ràng.
- Không yêu cầu nhập lại dữ liệu đã có trong cùng một quy trình nếu không có lý do pháp lý hoặc bảo mật.

## 4. Luồng duyệt và trạng thái

- Mỗi chứng từ hoặc đối tượng có trạng thái rõ, hiển thị bằng Badge gồm cả màu và chữ.
- Một trạng thái phải dùng cùng tên, màu và ý nghĩa ở danh sách, chi tiết, form và báo cáo.
- Chỉ hiển thị hành động hợp lệ với trạng thái hiện tại. Ví dụ, chỉ cho sửa khi bản ghi còn ở trạng thái cho phép chỉnh sửa.
- Duyệt, từ chối, hủy và xóa luôn yêu cầu xác nhận; từ chối phải nhập lý do khi nghiệp vụ cần truy vết.
- Dialog xác nhận nêu rõ tên/mã đối tượng, hậu quả và khả năng hoàn tác.
- Khi đối tượng có workflow, cung cấp lịch sử gồm người thực hiện, hành động, thời gian và ghi chú.
- Sau hành động thành công, cập nhật UI ngay hoặc refetch có kiểm soát; không để trạng thái cũ gây hiểu nhầm.

## 5. Thông báo và phản hồi

- Toast dùng cho kết quả thao tác ngắn như lưu thành công hoặc sao chép mã.
- Banner dùng cho vấn đề ảnh hưởng cả trang hoặc phiên làm việc như mất kết nối hay dữ liệu quá hạn.
- Dialog dùng cho hành động không thể hoàn tác hoặc quyết định cần người dùng xác nhận.
- Inline error dùng cho lỗi gắn với field hoặc một vùng dữ liệu cụ thể.
- Thông báo lỗi nêu điều gì xảy ra và người dùng có thể làm gì tiếp theo; không hiển thị exception hoặc mã kỹ thuật thô.
- Tác vụ dài phải có tiến trình hoặc thông báo đang xử lý. Không để nút có vẻ hoạt động nhưng không phản hồi.
- Thay đổi số lượng/trạng thái động quan trọng cần được screen reader thông báo bằng vùng live phù hợp, không tự ý di chuyển focus.

## 6. Phân quyền

- Chức năng người dùng không có quyền được ẩn khỏi menu và nhóm hành động để tránh tạo kỳ vọng sai.
- Truy cập trực tiếp URL không có quyền phải hiển thị trang 403 thân thiện, không chuyển thành trang 404 hoặc màn hình trắng.
- Chức năng có quyền nhưng tạm thời không thực hiện được do trạng thái nghiệp vụ thì disable và giải thích lý do.
- Frontend chỉ cải thiện trải nghiệm; backend vẫn phải là nơi thực thi quyền thực sự.
- Sau khi quyền hoặc vai trò thay đổi, giao diện phải refresh thông tin người dùng hoặc hướng dẫn đăng nhập lại nếu cần.

## 7. Định dạng dữ liệu

- Locale mặc định là `vi-VN`.
- Tiền tệ dùng phân cách hàng nghìn và kèm đơn vị VND; không chỉ dựa vào tiêu đề xa khỏi giá trị.
- Ngày hiển thị theo `dd/MM/yyyy`; ngày giờ theo `dd/MM/yyyy HH:mm`.
- Dữ liệu chưa có phải hiển thị thống nhất bằng dấu gạch hoặc nhãn “Chưa có”, không nhầm với giá trị 0.
- Quy định số chữ số thập phân theo loại dữ liệu; số lượng, đơn giá, tỷ giá và phần trăm không tự dùng chung một quy tắc.
- Mã đơn hàng, lô hàng, dự án và chứng từ hiển thị nhất quán và có thể sao chép nhanh.
- Số âm, quá hạn hoặc vượt ngưỡng phải có chữ/icon giải thích, không chỉ đổi màu.

## 8. Ngôn ngữ giao diện

- Nhãn, thông báo và validation dùng tiếng Việt rõ ràng, trừ tên riêng hoặc thuật ngữ bắt buộc giữ nguyên.
- Dùng một thuật ngữ cho một khái niệm trên toàn hệ thống.
- Nút dùng động từ mô tả hành động như “Lưu”, “Duyệt”, “Từ chối”, “Xuất Excel”; tránh nhãn mơ hồ như “OK” khi có thể cụ thể hơn.
- Tiêu đề trang và dialog cho biết đối tượng đang xem hoặc chỉnh sửa.
- Không dùng câu đổ lỗi cho người dùng. Thông báo cần ngắn, cụ thể và có hướng xử lý.

### Thuật ngữ nền

| Thuật ngữ kỹ thuật | Nhãn tiếng Việt ưu tiên |
|---|---|
| Dashboard | Tổng quan |
| Project | Dự án |
| Project sale | Dự án kinh doanh |
| Customer care | Chăm sóc khách hàng |
| Role | Vai trò |
| Permission | Quyền |
| User | Người dùng |
| Draft | Nháp |
| Pending approval | Chờ duyệt |
| Approved | Đã duyệt |
| Rejected | Từ chối |

Mở rộng bảng này khi có module hoặc thuật ngữ mới. Không tự tạo bản dịch khác nếu đã có nhãn chuẩn.

## 9. Khả năng truy cập

- Đạt tối thiểu WCAG AA.
- Toàn bộ chức năng chính sử dụng được bằng bàn phím; thứ tự Tab theo trình tự nhìn và nghiệp vụ.
- Focus ring rõ, có tương phản phù hợp và không bị sticky header, footer hoặc overlay che khuất.
- Nút chỉ có icon phải có `aria-label`; icon trang trí cạnh chữ phải ẩn khỏi accessibility tree.
- Không truyền đạt trạng thái chỉ bằng màu; luôn bổ sung chữ, icon hoặc pattern phù hợp.
- Dialog giữ focus bên trong khi mở, có tiêu đề truy cập và trả focus về trigger khi đóng.
- Drag, swipe hoặc thao tác chuột phức tạp phải có phương án bằng nút và bàn phím.
- Tôn trọng reduced motion; không dùng animation nhấp nháy hoặc chuyển động gây mất tập trung.
- Nội dung phóng to hoặc wrap không làm mất nút, nhãn hay dữ liệu thiết yếu.

## 10. Dashboard và biểu đồ

- Chỉ hiển thị KPI có chủ sở hữu, kỳ thời gian, đơn vị và ý nghĩa hành động rõ.
- Mỗi biểu đồ có tiêu đề, phạm vi thời gian, đơn vị và nguồn dữ liệu khi cần.
- Chọn biểu đồ theo câu hỏi nghiệp vụ: đường cho xu hướng, cột cho so sánh, thanh ngang cho nhãn dài.
- Hạn chế biểu đồ tròn; không dùng khi có nhiều nhóm hoặc cần so sánh chính xác.
- Tooltip phải dễ đọc, nhưng thông tin cốt lõi không được chỉ tồn tại trong tooltip.
- Màu biểu đồ có tương phản và không phải tín hiệu duy nhất; cung cấp legend hoặc nhãn trực tiếp.
- Có empty và error state khi dữ liệu biểu đồ không sẵn sàng.

## 11. Tài liệu và tệp tải lên

- Hiển thị tên, loại, kích thước, người tải lên và thời gian cập nhật khi dữ liệu có sẵn.
- Kiểm tra loại và kích thước file trước khi xử lý; thông báo giới hạn rõ ràng.
- Upload dài cần tiến trình; lỗi không được làm mất metadata người dùng đã nhập.
- Xóa tài liệu phải có xác nhận và mô tả khả năng khôi phục.
- Link tải xuống phải có accessible name mô tả tài liệu, không chỉ dùng icon.

## 12. Các trạng thái bắt buộc của trang dữ liệu

Mỗi trang dùng dữ liệu bất đồng bộ phải thiết kế đầy đủ:

1. Loading: giữ bố cục ổn định bằng skeleton hoặc progress phù hợp.
2. Empty lần đầu: giải thích chưa có dữ liệu và cung cấp hành động tạo nếu người dùng có quyền.
3. Không có kết quả lọc: cho biết bộ lọc không khớp và cung cấp cách đặt lại.
4. Error: mô tả lỗi dễ hiểu và có nút thử lại khi an toàn.
5. Success: hiển thị dữ liệu, tổng số và thời điểm cập nhật nếu có ý nghĩa.
6. Offline hoặc mất kết nối: bảo toàn dữ liệu chưa lưu và hướng dẫn thử lại.

## 13. Checklist review màn hình ERP

- [ ] Luồng chính hoàn thành được mà không cần đoán.
- [ ] Chỉ một hành động chính nổi bật trên màn hình.
- [ ] Bảng và form tuân thủ căn chỉnh, mật độ và định dạng dữ liệu.
- [ ] Có đủ loading, empty, filtered-empty, error và retry.
- [ ] Trạng thái và quyền quyết định đúng hành động hiển thị.
- [ ] Hành động nguy hiểm có xác nhận và mô tả hậu quả.
- [ ] Thuật ngữ tiếng Việt nhất quán.
- [ ] Dùng được hoàn toàn bằng bàn phím.
- [ ] Focus, contrast và accessible name đạt yêu cầu.
- [ ] Responsive không làm mất dữ liệu hoặc hành động thiết yếu.
