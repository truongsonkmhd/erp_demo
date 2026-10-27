package com.xxxx.ddd.application.model.command;

import java.time.LocalDate;
import java.util.List;
import lombok.Data;

/** Lập / sửa nhiệm vụ (code chỉ dùng khi lập). */
@Data
public class SaveMissionCommand {
    private String code;
    private String title;
    /** Đơn vị / tổ đội; null = đơn vị người lập. */
    private Long departmentId;
    private String projectCode;
    private LocalDate dueDate;
    private List<Long> equipmentIds;
    private String content;
    private List<Long> followerUserIds;
}
