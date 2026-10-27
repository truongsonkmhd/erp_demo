package com.xxxx.ddd.application.model.work;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

/** Chi tiết việc: thông tin, người phối hợp, ghi chú và thao tác người xem được làm. */
@Data
@EqualsAndHashCode(callSuper = true)
public class TaskDetailDTO extends TaskSummaryDTO {
    private String resultRequirement;
    private String evidence;
    private PersonRefDTO assigner;
    private List<PersonRefDTO> followers;
    private List<TaskCommentDTO> comments;
    /** ACCEPT, PROGRESS, SUBMIT, APPROVE, RETURN, COMMENT, DELETE, MOVE. */
    private List<String> allowedActions;
    /** Chưa xong và quá hạn, hoặc còn ≤ 2 ngày mà dưới 80%. */
    private boolean atRisk;
    private LocalDateTime completedAt;
}
