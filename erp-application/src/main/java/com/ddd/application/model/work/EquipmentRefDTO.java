package com.xxxx.ddd.application.model.work;

import lombok.Data;

/** Một thiết bị trong danh mục (form Nhiệm vụ, chi tiết nhiệm vụ). */
@Data
public class EquipmentRefDTO {
    private Long id;
    private String code;
    private String name;
    private String departmentCode;
}
