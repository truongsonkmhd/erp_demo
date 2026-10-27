package com.xxxx.ddd.application.model.command;

import com.xxxx.ddd.domain.model.enums.work.Complexity;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

/** Tạo việc trong dự án (trưởng phòng giao cho nhân viên đơn vị mình). */
@Data
public class CreateTaskCommand {
    private String code;
    private String projectCode;
    private String title;
    private String resultRequirement;
    private Complexity complexity;
    private Long assigneeUserId;
    private List<Long> followerUserIds;
    private LocalDate dueDate;
}
