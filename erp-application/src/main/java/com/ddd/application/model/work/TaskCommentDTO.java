package com.xxxx.ddd.application.model.work;

import java.time.LocalDateTime;
import lombok.Data;

/** Một ghi chú của việc. */
@Data
public class TaskCommentDTO {
    private Long id;
    private PersonRefDTO user;
    /** Đơn vị người ghi lúc ghi. */
    private String departmentName;
    private String content;
    private LocalDateTime createdAt;
}
