package com.xxxx.ddd.controller.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateUserRequest {
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String roleCode;
    private java.util.List<String> roleCodes;
    private Integer accountType;
    private String levelId;
    /** Mã chức vụ (tbl_position.code); rỗng để bỏ chức vụ. */
    private String positionCode;
    /** Đơn vị (tbl_department.id); 0 để bỏ đơn vị. */
    private Long orgUnitId;
    private BigDecimal baseSalary;
    private Boolean active;
}
