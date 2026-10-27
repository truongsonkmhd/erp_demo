package com.xxxx.ddd.application.model.work;

import com.xxxx.ddd.application.model.PageDTO;
import java.util.Map;

/** Menu Công việc: số ở các ô thống kê và một trang mục (thư mục dự án / nhiệm vụ). */
public record MyWorkDTO(Map<String, Integer> counts, PageDTO<WorkEntryDTO> page) {
}
