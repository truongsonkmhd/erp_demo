package com.xxxx.ddd.application.service.project;

import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.command.SaveProjectCommand;
import com.xxxx.ddd.application.model.work.PersonRefDTO;
import com.xxxx.ddd.application.model.work.ProjectDetailDTO;
import com.xxxx.ddd.application.model.work.ProjectSummaryDTO;
import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;

import java.util.List;

/**
 * Dự án (menu Nhiệm vụ / Dự án): Phòng Kỹ thuật lập và sửa, Liên đoàn trưởng phê duyệt và quyết xoá; đơn vị tham gia
 * xem sau khi được duyệt. Mọi luật quyền và luồng trạng thái kiểm ở đây.
 */
public interface ProjectAppService {
    PageDTO<ProjectSummaryDTO> list(ProjectStatus status, String keyword, Integer pageNo, Integer pageSize);

    ProjectDetailDTO detail(String code);

    ProjectDetailDTO create(SaveProjectCommand command);

    ProjectDetailDTO update(String code, SaveProjectCommand command);

    ProjectDetailDTO approve(String code);

    ProjectDetailDTO reject(String code, String note);

    ProjectDetailDTO requestDelete(String code, String reason);

    ProjectDetailDTO cancelDelete(String code);

    /** Liên đoàn trưởng đồng ý xoá: dự án bị xoá mềm, không còn trả về. */
    void approveDelete(String code);

    ProjectDetailDTO rejectDelete(String code, String note);

    /** Người đang hoạt động của một đơn vị tham gia dự án (để giao việc). */
    List<PersonRefDTO> assignableUsers(String code, Long departmentId);
}
