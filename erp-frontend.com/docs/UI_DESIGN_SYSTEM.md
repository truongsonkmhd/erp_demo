# UI Design System ERP

## 1. Mục tiêu

Design system này tạo một ngôn ngữ giao diện thống nhất cho ERP logistics. Giao diện phải chuyên nghiệp, gọn, dễ đọc và hỗ trợ thao tác lặp lại với dữ liệu lớn. Trang nghiệp vụ không được mang phong cách landing page hoặc ưu tiên trang trí hơn hiệu quả sử dụng.

Các nguyên tắc chính:

- Rõ ràng hơn gây ấn tượng.
- Nhất quán hơn sáng tạo tùy từng màn hình.
- Mật độ thông tin cao nhưng không chật chội.
- Trạng thái, quyền và hậu quả của hành động luôn dễ hiểu.
- Component và semantic token là nguồn chuẩn; không sao chép style tùy ý.

## 2. Nguồn chuẩn và thứ tự ưu tiên

1. `docs/ERP_UX_RULES.md` quy định hành vi nghiệp vụ.
2. File này quy định ngôn ngữ hình ảnh và component.
3. `tailwind.config.ts` và `src/index.css` là hiện thực token trong code.
4. `src/components/ui/` là hiện thực component nền tảng.
5. Skill `ui-ux-pro-max` chỉ được dùng để tra cứu và đề xuất.

Nếu tài liệu và code chưa đồng bộ, không tự tạo token thứ hai. Xác định token chuẩn, cập nhật có chủ đích và ghi rõ phạm vi thay đổi.

## 3. Màu sắc

Mọi màu trong component nghiệp vụ phải đi qua semantic token hoặc utility đã ánh xạ trong Tailwind. Không dùng giá trị hex tùy ý trong JSX/TSX.

| Token | Vai trò |
|---|---|
| `background` | Nền trang chính |
| `foreground` | Chữ chính |
| `card` | Nền card, panel và vùng nội dung |
| `muted` | Nền phụ, hàng xen kẽ hoặc vùng ít nhấn mạnh |
| `muted-foreground` | Chữ mô tả và metadata |
| `primary` | Hành động chính, mục điều hướng active và link quan trọng |
| `secondary` | Hành động phụ |
| `accent` | Trạng thái hover hoặc vùng cần nhấn nhẹ |
| `border` | Viền, divider và ranh giới bảng |
| `destructive` | Xóa, từ chối và lỗi nghiêm trọng |
| `success` | Hoàn thành, đã duyệt hoặc kết quả tích cực |
| `warning` | Chờ xử lý hoặc cảnh báo |

Yêu cầu:

- Chữ thường đạt độ tương phản tối thiểu 4.5:1; thành phần đồ họa và focus indicator tối thiểu 3:1.
- Màu trạng thái luôn đi cùng nhãn chữ hoặc icon có tên truy cập.
- Dark mode phải được kiểm tra độc lập; không suy ra bằng cách đảo màu.
- Một màn hình chỉ có một primary action nổi bật.

## 4. Typography

- Dùng font sans-serif hiện được cấu hình trong dự án; font thay thế phải hỗ trợ đầy đủ tiếng Việt.
- Thang chữ khuyến nghị: 12, 14, 16, 20 và 24px.
- Nội dung bảng và form ưu tiên 14px; không dùng body text nhỏ hơn 12px.
- Heading dùng weight 600-700; label dùng 500-600; body dùng 400.
- Số tiền, số lượng, tỷ lệ và dữ liệu bảng dùng `tabular-nums`.
- Không viết hoa toàn bộ đoạn dài. Chỉ dùng uppercase cho mã hoặc nhãn rất ngắn khi thật sự cần.
- Văn bản dài phải được wrap tự nhiên; mã hoặc URL dài dùng `overflow-wrap: anywhere`.

## 5. Spacing và layout

- Dùng lưới 4px: 4, 8, 12, 16, 24 và 32px.
- Không tạo khoảng cách tùy ý nếu utility trong thang spacing đã đáp ứng.
- Padding vùng nội dung desktop mặc định khoảng 24px; giảm có hệ thống trên tablet và mobile.
- Sidebar và topbar phải nhất quán với `AppLayout`; nội dung không bị che bởi vùng fixed/sticky.
- Trang danh sách ưu tiên chiều rộng hữu dụng cho bảng. Form và nội dung đọc dài cần giới hạn chiều rộng hợp lý.
- Tránh nested scroll. Chỉ tạo vùng cuộn riêng khi bảng hoặc panel thực sự cần sticky header.
- Z-index phải theo các lớp nhất quán: nội dung, sticky, dropdown, overlay, modal và toast.

## 6. Icon

- Dùng `lucide-react` làm bộ icon mặc định.
- Kích thước chuẩn: 16px cho control gọn, 20px cho hành động thông thường, 24px khi cần nhấn mạnh.
- Giữ stroke nhất quán, thường từ 1.5 đến 2.
- Icon cạnh nhãn chữ mang tính trang trí phải có `aria-hidden="true"`.
- Nút chỉ có icon phải có `aria-label`, tooltip khi ý nghĩa chưa hiển nhiên và vùng bấm đủ lớn.
- Không dùng emoji hoặc icon raster cho chức năng hệ thống.

## 7. Component chuẩn

### Button

- Biến thể tối thiểu: primary, secondary, outline, ghost và destructive.
- Kích thước và chiều cao phải dùng variant chung, không điều chỉnh riêng từng màn hình.
- Khi submit bất đồng bộ: disable nút, giữ chiều rộng ổn định và hiển thị trạng thái tiến trình.
- Không đặt hai nút primary cạnh nhau.

### Input Select và Date Picker

- Luôn có label hiển thị.
- Có trạng thái default, hover, focus, disabled, readonly và error.
- Helper text và error text không làm layout nhảy bất ngờ.
- Focus ring rõ; không dựa vào đổi màu viền quá nhẹ.

### Data Table

- Chiều cao hàng mục tiêu khoảng 40px cho desktop; tăng khi cần hỗ trợ touch.
- Header rõ, có thể sticky khi vùng bảng cuộn.
- Hỗ trợ sort, filter, pagination và chọn dòng khi nghiệp vụ cần.
- Cột số căn phải, text căn trái, trạng thái và ngày có thể căn giữa; cột thao tác ở cuối.
- Không nhồi quá nhiều nút vào mỗi hàng; dùng menu khi có nhiều hơn hai hành động phụ.

### Dialog Drawer và Confirmation

- Dialog dùng cho quyết định hoặc hành động ngắn cần tập trung.
- Drawer dùng cho nội dung phụ hoặc chỉnh sửa nhanh mà người dùng cần giữ ngữ cảnh danh sách.
- Hành động nguy hiểm phải mô tả đối tượng và hậu quả, không chỉ hỏi chung chung “Bạn có chắc không?”.
- Focus được đưa vào dialog khi mở và trả về trigger khi đóng; hỗ trợ Escape khi an toàn.

### Badge

- Badge trạng thái phải có màu và nhãn chữ.
- Dùng cùng một ánh xạ màu cho cùng một trạng thái trên toàn hệ thống.
- Không dùng màu quá bão hòa làm nền diện tích lớn.

### Toast Banner và Inline Message

- Toast dành cho kết quả ngắn sau thao tác và tự đóng trong thời gian hợp lý.
- Banner dành cho vấn đề ảnh hưởng cả trang hoặc toàn bộ phiên làm việc.
- Inline message dành cho lỗi hoặc hướng dẫn gắn với một vùng cụ thể.
- Thông báo lỗi nêu nguyên nhân và cách xử lý; không hiển thị stack trace hoặc mã kỹ thuật thô.

## 8. Mẫu trang

### Trang danh sách

1. Page header với tiêu đề, mô tả ngắn nếu cần và một primary action.
2. Filter bar gồm tìm kiếm, bộ lọc chính và thao tác đặt lại.
3. Data table hoặc danh sách dữ liệu.
4. Tổng số bản ghi và pagination.
5. Loading, empty và error state trong chính vùng dữ liệu.

### Trang chi tiết

1. Breadcrumb và page header.
2. Trạng thái hiện tại và nhóm hành động hợp lệ.
3. Các nhóm thông tin bằng section hoặc card.
4. Tabs khi có nhiều miền thông tin, gồm lịch sử nếu đối tượng có workflow.

### Trang form

1. Page header và ngữ cảnh đối tượng.
2. Các section theo nhóm nghiệp vụ, tối đa hai cột trên desktop.
3. Mô tả hoặc helper text cho trường phức tạp.
4. Thanh hành động sticky cho form dài, không che nội dung cuối trang.

### Dashboard

- Chỉ hiển thị chỉ số hỗ trợ quyết định hoặc hành động.
- Biểu đồ phải có tiêu đề, đơn vị, khoảng thời gian, legend/tooltip và phương án thay thế dễ đọc.
- Không dùng biểu đồ tròn khi có quá nhiều nhóm; không dựa vào màu làm tín hiệu duy nhất.

## 9. Motion

- Motion chỉ giải thích quan hệ nguyên nhân-kết quả hoặc chuyển trạng thái.
- Ưu tiên opacity và transform; không animate thuộc tính gây reflow như width, height, top hoặc left.
- Animation phải ngắn, có thể bị ngắt và không chặn thao tác.
- Tôn trọng `prefers-reduced-motion`.
- Không dùng parallax, stagger diện rộng hoặc hiệu ứng trang trí trong màn hình ERP.

## 10. Responsive và accessibility

- Desktop là môi trường chính, nhưng mọi chức năng phải dùng được trên tablet và màn hình nhỏ.
- Không tạo horizontal scroll cho toàn trang; bảng rộng có thể cuộn trong vùng có nhãn/ngữ cảnh rõ.
- Target tương tác web tối thiểu 24x24 CSS px; hành động chính trên thiết bị cảm ứng nên đạt khoảng 44x44px.
- Thứ tự DOM và thứ tự focus phải theo luồng thị giác.
- Mọi form control có label; lỗi liên kết bằng `aria-describedby` khi phù hợp.
- Các trạng thái selected, expanded, disabled và pressed phải được thể hiện bằng thuộc tính semantic tương ứng.

## 11. Checklist thiết kế

- [ ] Dùng semantic token, không có màu tùy ý trong component.
- [ ] Spacing theo lưới 4px.
- [ ] Typography và định dạng số nhất quán.
- [ ] Component có đủ hover, focus, disabled, loading và error khi phù hợp.
- [ ] Không dùng màu làm tín hiệu duy nhất.
- [ ] Có thể dùng bằng bàn phím và focus không bị che.
- [ ] Responsive không làm mất hành động hoặc dữ liệu quan trọng.
- [ ] Không tạo component trùng với `src/components/ui/`.
