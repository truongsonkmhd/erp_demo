package com.xxxx.ddd.application.model.work;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

/** Chi tiết nhiệm vụ: thông tin BA, thiết bị, phối hợp, ghi chú và thao tác người xem được làm. */
@Data
@EqualsAndHashCode(callSuper = true)
public class MissionDetailDTO extends MissionSummaryDTO {
    private String content;
    /** Thiết bị (id trong danh mục tài sản). */
    private List<Long> equipmentIds;
    private List<PersonRefDTO> followers;
    private String evidence;
    /** Lý do từ chối. */
    private String decisionNote;
    private LocalDateTime decidedAt;
    private LocalDateTime completedAt;
    private List<TaskCommentDTO> comments;
    /** APPROVE, REJECT, EDIT, PROGRESS, COMPLETE, COMMENT, DELETE. */
    private List<String> allowedActions;
    private boolean atRisk;
}
