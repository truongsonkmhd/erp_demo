package com.xxxx.ddd.application.service.mission;

import com.xxxx.ddd.application.model.PageDTO;
import com.xxxx.ddd.application.model.command.SaveMissionCommand;
import com.xxxx.ddd.application.model.command.TaskProgressCommand;
import com.xxxx.ddd.application.model.work.MissionDetailDTO;
import com.xxxx.ddd.application.model.work.MissionSummaryDTO;
import com.xxxx.ddd.application.model.work.PersonRefDTO;
import com.xxxx.ddd.domain.model.enums.work.MissionStatus;

/**
 * Nhiệm vụ (tab Nhiệm vụ của menu Nhiệm vụ / Dự án): cấp dưới lập, cấp trên trực tiếp duyệt hoặc từ chối; người lập
 * thực hiện, cập nhật tiến độ và báo hoàn thành. Mọi luật quyền và luồng trạng thái kiểm ở đây.
 */
public interface MissionAppService {
    PageDTO<MissionSummaryDTO> list(MissionStatus status, String keyword, Integer pageNo, Integer pageSize);

    MissionDetailDTO detail(String code);

    /** Cấp trên trực tiếp sẽ duyệt nhiệm vụ của người đăng nhập (null với Liên đoàn trưởng). */
    PersonRefDTO approver();

    MissionDetailDTO create(SaveMissionCommand command);

    MissionDetailDTO update(String code, SaveMissionCommand command);

    MissionDetailDTO approve(String code, String note);

    MissionDetailDTO reject(String code, String note);

    MissionDetailDTO updateProgress(String code, TaskProgressCommand command);

    MissionDetailDTO complete(String code, String note);

    MissionDetailDTO comment(String code, String content);

    void delete(String code);
}
