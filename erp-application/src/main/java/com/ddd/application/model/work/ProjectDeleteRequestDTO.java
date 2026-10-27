package com.xxxx.ddd.application.model.work;

import java.time.LocalDateTime;
import lombok.Data;

/** Đề nghị xoá đang chờ Liên đoàn trưởng quyết. */
@Data
public class ProjectDeleteRequestDTO {
    private String reason;
    private PersonRefDTO requestedBy;
    private LocalDateTime requestedAt;
}
