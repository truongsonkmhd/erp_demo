package com.xxxx.ddd.application.model.work;

import lombok.Data;

/** Một người trong dự án / việc / nhiệm vụ: id, họ tên, mã role và đơn vị (để giao diện hiện tên). */
@Data
public class PersonRefDTO {
    private Long userId;
    private String fullName;
    private String roleCode;
    private String departmentCode;
}
