package com.xxxx.ddd.application.model.work;

import lombok.Data;

/** Thao tác người đang xem được làm với dự án (giao diện ẩn / hiện nút theo đây). */
@Data
public class ProjectPermissionsDTO {
    private boolean canEdit;
    private boolean canApprove;
    private boolean canRequestDelete;
    private boolean canCancelDelete;
    private boolean canDecideDelete;
    private boolean canCreateTask;
}
