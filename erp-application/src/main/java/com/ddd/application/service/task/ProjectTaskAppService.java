package com.xxxx.ddd.application.service.task;

import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.command.CreateTaskCommand;
import com.xxxx.ddd.application.model.command.TaskProgressCommand;
import com.xxxx.ddd.application.model.work.TaskDetailDTO;
import com.xxxx.ddd.application.model.work.TaskSummaryDTO;
import com.xxxx.ddd.domain.model.enums.work.TaskStatus;

/**
 * Việc trong dự án (Dự án → Việc): trưởng phòng của đơn vị tham gia dự án giao việc cho nhân viên đơn vị mình và
 * nghiệm thu / trả lại; nhân viên nhận, cập nhật tiến độ, nộp. Mọi luật quyền và luồng trạng thái kiểm ở đây.
 */
public interface ProjectTaskAppService {
    PageDTO<TaskSummaryDTO> list(String projectCode, TaskStatus status, String keyword, Integer pageNo, Integer pageSize);

    TaskDetailDTO detail(String code);

    TaskDetailDTO create(CreateTaskCommand command);

    TaskDetailDTO accept(String code, String note);

    TaskDetailDTO updateProgress(String code, TaskProgressCommand command);

    TaskDetailDTO submit(String code, String note);

    TaskDetailDTO approve(String code, String note);

    TaskDetailDTO returnTask(String code, String note);

    TaskDetailDTO move(String code, TaskStatus toStatus);

    TaskDetailDTO comment(String code, String content);

    void delete(String code);
}
