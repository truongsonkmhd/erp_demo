package com.xxxx.ddd.application.model.work;

import lombok.Data;

/** Một đơn vị: id, mã, tên. */
@Data
public class DepartmentRefDTO {
    private Long id;
    private String code;
    private String name;
}
