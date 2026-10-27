package com.xxxx.ddd.application.service.mywork;

import com.xxxx.ddd.application.model.work.MyWorkDTO;

/**
 * Menu Công việc (chỉ đọc): gom việc từ Dự án, Việc dự án và Nhiệm vụ. Các thao tác vẫn gọi API của từng nguồn.
 */
public interface MyWorkAppService {
    /** Tab Của tôi: việc người đăng nhập phải xử lý (filter mine) và việc mình phối hợp (cc). */
    MyWorkDTO mine(String filter, String keyword, Integer pageNo, Integer pageSize);

    /** Tab Toàn Liên đoàn (chỉ Liên đoàn trưởng): dự án đang chạy và nhiệm vụ còn mở của mọi đơn vị, chỉ để theo dõi. */
    MyWorkDTO federation(String status, Long departmentId, String keyword, Integer pageNo, Integer pageSize);
}
