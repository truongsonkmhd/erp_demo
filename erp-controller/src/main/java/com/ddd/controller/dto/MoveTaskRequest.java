package com.xxxx.ddd.controller.dto;

import com.xxxx.ddd.domain.model.enums.work.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Body kéo thả việc sang trạng thái khác. */
@Data
public class MoveTaskRequest {
    @NotNull
    private TaskStatus toStatus;
}
